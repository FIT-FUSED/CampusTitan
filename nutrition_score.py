import os
import json
import time
import requests
from PIL import Image
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

# ==========================================
# Phase 1: Pydantic Schemas
# ==========================================

class InitialIdentification(BaseModel):
    dish_name: str = Field(description="Generic name of the food (e.g., 'Apple, raw', 'Chapati, plain')")
    estimated_portion_g: float = Field(description="Final calculated weight in grams")
    estimation_method: str = Field(description="State whether weight was calculated via 'User Text', 'Reference Object', or 'Blind Guess'")

class USDASelection(BaseModel):
    best_match_id: int = Field(description="The exact fdcId that matches. Return -1 if NO options match.")

# ==========================================
# Phase 2: Nutrient Density Engine (NRF9.3)
# ==========================================

def calculate_nrf93(nutrition_data: dict) -> float:
    """
    Calculates the Nutrient Rich Foods (NRF9.3) index.
    Keys must exactly match the updated units (mg, µg).
    """
    dv_positive = {
        "Protein( in g)": 50.0,
        "Dietary Fiber( in g)": 28.0,
        "Vitamin A( in µg)": 900.0,    # Corrected to µg
        "Vitamin C( in mg)": 90.0,
        "Vitamin E( in mg)": 15.0,
        "Calcium( in mg)": 1300.0,
        "Iron( in mg)": 18.0,
        "Magnesium( in mg)": 420.0,
        "Potassium( in mg)": 4700.0
    }
    
    mrv_negative = {
        "Saturated Fats( in g)": 20.0,
        "Sugars( in g)": 50.0,         
        "Sodium( in mg)": 2300.0       # Corrected to mg
    }
    
    positive_score = 0.0
    for nutrient, dv in dv_positive.items():
        amount = nutrition_data.get(nutrient, 0.0)
        pct = (amount / dv) * 100
        positive_score += min(pct, 100.0)
        
    negative_score = 0.0
    for nutrient, mrv in mrv_negative.items():
        amount = nutrition_data.get(nutrient, 0.0)
        pct = (amount / mrv) * 100
        negative_score += pct
        
    final_score = positive_score - negative_score
    return round(final_score, 2)

# ==========================================
# Phase 3: The ML Pipeline
# ==========================================

# Models to try in order (separate free-tier quotas per model)
GEMINI_MODELS = [
    'models/gemini-2.0-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-2.5-flash-lite',
]

def _call_gemini(model_name, contents, config, max_retries=3):
    """Call Gemini with automatic retry on 429 and model fallback."""
    last_error = None
    
    for attempt in range(max_retries):
        try:
            print(f"  Trying {model_name} (attempt {attempt + 1}/{max_retries})...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                contents=contents,
                generation_config=config
            )
            print(f"  ✓ Success with {model_name}")
            return response
        except Exception as e:
            error_str = str(e)
            last_error = e
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                # Rate limited - check if it's per-minute or per-day
                if 'PerDay' in error_str or 'limit: 0' in error_str:
                    print(f"  ✗ {model_name} daily quota exhausted, trying next model...")
                    break  # Skip retries, try next model
                else:
                    wait_time = min(15 * (attempt + 1), 30)
                    print(f"  ⏳ Rate limited, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
            else:
                raise  # Non-rate-limit error, propagate immediately
    
    raise Exception(f"All Gemini models exhausted after retries. Last error: {last_error}")

def execute_ml_vision_pipeline(image_path: str, user_text_context: str, gemini_key: str, usda_key: str):
    # Configure the API key
    genai.configure(api_key=gemini_key)
    try:
        image = Image.open(image_path)
        print(f"Image loaded: {image.size}, mode={image.mode}")
    except Exception as e:
        raise Exception(f"Could not open image at '{image_path}': {e}")

    print("\n[Step 1] ML Vision & Context Processing...")
    prompt_1 = f"""
    Analyze this food image. 
    User provided context: "{user_text_context if user_text_context else 'None'}"
    
    Task 1: Identify the primary food item. Keep the name generic for a USDA database search.
    
    Task 2: Determine the portion size in grams. You MUST follow this hierarchy:
    1. IF user provided context (e.g., '4 rotis', '1 bowl'), calculate total grams mathematically based on standard sizes.
    2. IF context is 'None', scan the image for a physical reference object (fork, coin, plate edge) to estimate volume.
    3. IF no reference object exists, make your best conservative baseline guess.
    """
    
    try:
        # NOTE: Some google-generativeai versions do not expose types.GenerateContentConfig.
        # Using a plain dict keeps compatibility across versions.
        response_1 = _call_gemini(
            GEMINI_MODELS[0],
            contents=[image, prompt_1],
            config={
                "temperature": 0.0,
                # These keys are ignored by older SDKs; newer SDKs may accept them.
                "response_mime_type": "application/json",
                "response_schema": InitialIdentification,
            },
        )
        print(f"Step 1 raw response: {response_1.text}")
        initial_data = json.loads(response_1.text)
    except Exception as e:
        raise Exception(f"Gemini Vision API failed: {e}")
        
    food_name = initial_data["dish_name"]
    portion_g = initial_data["estimated_portion_g"]
    method = initial_data["estimation_method"]
    
    print(f"-> Detected: {food_name}")
    print(f"-> Calculated Weight: {portion_g}g")
    print(f"-> Logic Used: {method}")

    print("\n[Step 2] Fetching USDA Candidates...")
    usda_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {"api_key": usda_key, "query": food_name, "pageSize": 5, "dataType": ["Foundation", "SR Legacy"]}
    
    usda_response = requests.get(usda_url, params=params)
    if usda_response.status_code != 200:
        raise Exception(f"USDA API returned status {usda_response.status_code}: {usda_response.text[:200]}")
        
    candidates = usda_response.json().get("foods", [])
    if not candidates: 
        raise Exception(f"No USDA database matches found for '{food_name}'")

    options_text = "USDA Database Options:\n"
    for item in candidates:
        options_text += f"- ID: {item['fdcId']} | Name: {item['description']}\n"
    print(options_text)

    print("\n[Step 3] AI Autonomous Verification...")
    prompt_2 = f"Review the options and return the exact ID matching '{food_name}'. Return -1 if no safe match.\n{options_text}"
    
    response_2 = _call_gemini(
        GEMINI_MODELS[0],
        contents=[prompt_2],
        config={
            "temperature": 0.0,
            "response_mime_type": "application/json",
            "response_schema": USDASelection,
        },
    )
    
    print(f"Step 3 raw response: {response_2.text}")
    selected_id = json.loads(response_2.text)["best_match_id"]
    if selected_id == -1: 
        raise Exception(f"AI rejected all USDA candidates for '{food_name}' to preserve data integrity.")
        
    selected_food = next((item for item in candidates if item["fdcId"] == selected_id), None)
    if not selected_food:
        raise Exception(f"Selected USDA ID {selected_id} not found in candidates list")
    print(f"-> ML Approved Match: {selected_food['description']}")

    print("\n[Step 4] Scaling 34-Column Matrix & Calculating Density...")
    
    nutrient_mapping = {
        1008: "Caloric Value", 1004: "Fat( in g)", 1258: "Saturated Fats( in g)",
        1292: "Monounsaturated Fats( in g)", 1293: "Polyunsaturated Fats( in g)",
        1005: "Carbohydrates( in g)", 2000: "Sugars( in g)", 1003: "Protein( in g)",
        1079: "Dietary Fiber( in g)", 1253: "Cholesterol( in mg)", 1093: "Sodium( in mg)", 
        1087: "Calcium( in mg)", 1089: "Iron( in mg)", 1090: "Magnesium( in mg)", 1097: "Manganese( in mg)",
        1092: "Potassium( in mg)", 1103: "Selenium( in µg)", 1095: "Zinc( in mg)", 1106: "Vitamin A( in µg)", 1165: "Vitamin B1 (Thiamine)( in mg)",
        1177: "Vitamin B11 (Folic Acid)( in µg)", 1178: "Vitamin B12( in mg)", 1166: "Vitamin B2 (Riboflavin)( in mg)", 1167: "Vitamin B3 (Niacin)( in mg)",
        1170: "Vitamin B5 (Pantothenic Acid)( in mg)", 1175: "Vitamin B6( in mg)", 1162: "Vitamin C( in mg)", 1110: "Vitamin D( in mg)", 1109: "Vitamin E( in mg)",
        1185: "Vitamin K( in µg)", 1055: "Water( in g)"
    }
    
    final_nutrition = {"food_name": food_name, "portion_g": portion_g}
    for nutrient_id, name in nutrient_mapping.items():
        final_nutrition[name] = 0.0
    
    for nutrient in selected_food.get("foodNutrients", []):
        nid = nutrient.get("nutrientId")
        if nid in nutrient_mapping:
            name = nutrient_mapping[nid]
            amount = nutrient.get("value", 0)
            unit = nutrient.get("unitName", "")
            
            if unit == "g":
                final_nutrition[name] = amount
            elif unit == "mg":
                final_nutrition[name] = amount
            elif unit == "µg" or unit == "mcg":
                final_nutrition[name] = amount / 1000
            elif unit == "IU":
                if name == "Vitamin A( in µg)":
                    final_nutrition[name] = amount * 0.3
                elif name == "Vitamin D( in mg)":
                    final_nutrition[name] = amount * 0.025
            else:
                final_nutrition[name] = amount
    
    # Scale by portion size
    scale_factor = portion_g / 100.0
    for key, value in final_nutrition.items():
        if key not in ["food_name", "portion_g"] and isinstance(value, (int, float)):
            final_nutrition[key] = value * scale_factor
    
    final_nutrition["Nutrition Density"] = calculate_nrf93(final_nutrition)
    final_nutrition["food_name"] = selected_food["description"]
    final_nutrition["portion_g"] = portion_g

    return final_nutrition

# ==========================================
# Execution Block
# ==========================================
if __name__ == "__main__":
    load_dotenv() 

    GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
    USDA_KEY = os.environ.get("USDA_API_KEY")
    
    if not GEMINI_KEY or not USDA_KEY:
        print("CRITICAL: Missing API keys. Please check your .env file.")
        exit(1)
        
    IMAGE_FILE = "C:/Users/Asus/CampusTitan/test_image.png"
    USER_CONTEXT = "2 rotis" 
    
    result = execute_ml_vision_pipeline(IMAGE_FILE, USER_CONTEXT, GEMINI_KEY, USDA_KEY)
    
    if result:
        print("\n--- Final Verified Matrix ---")
        import json
        print(json.dumps(result, indent=4))