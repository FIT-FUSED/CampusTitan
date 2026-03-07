import os
import json
import time
import requests
from PIL import Image
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
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

def execute_ml_vision_pipeline(image_path: str, user_text_context: str, gemini_key: str, usda_key: str):
    client = genai.Client(api_key=gemini_key)
    try:
        image = Image.open(image_path)
    except FileNotFoundError:
        print(f"Error: Could not find image at '{image_path}'")
        return None

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
        response_1 = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=[image, prompt_1],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=InitialIdentification,
                temperature=0.0 
            )
        )
        initial_data = json.loads(response_1.text)
    except Exception as e:
        print(f"Vision API Error: {e}")
        return None
        
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
        print("USDA API Error.")
        return None
        
    candidates = usda_response.json().get("foods", [])
    if not candidates: 
        print("No database matches found.")
        return None

    options_text = "USDA Database Options:\n"
    for item in candidates:
        options_text += f"- ID: {item['fdcId']} | Name: {item['description']}\n"

    print("\n[Step 3] AI Autonomous Verification...")
    prompt_2 = f"Review the options and return the exact ID matching '{food_name}'. Return -1 if no safe match.\n{options_text}"
    
    response_2 = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=[prompt_2],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=USDASelection,
            temperature=0.0
        )
    )
    
    selected_id = json.loads(response_2.text)["best_match_id"]
    if selected_id == -1: 
        print("AI rejected all candidates to preserve data integrity.")
        return None
        
    selected_food = next((item for item in candidates if item["fdcId"] == selected_id), None)
    print(f"-> ML Approved Match: {selected_food['description']}")

    print("\n[Step 4] Scaling 34-Column Matrix & Calculating Density...")
    
    # CORRECTED UNIT MAPPINGS
    nutrient_mapping = {
        1008: "Caloric Value", 1004: "Fat( in g)", 1258: "Saturated Fats( in g)",
        1292: "Monounsaturated Fats( in g)", 1293: "Polyunsaturated Fats( in g)",
        1005: "Carbohydrates( in g)", 2000: "Sugars( in g)", 1003: "Protein( in g)",
        1079: "Dietary Fiber( in g)", 1253: "Cholesterol( in mg)", 1093: "Sodium( in mg)", 
        1055: "Water( in g)", 1106: "Vitamin A( in µg)", 1165: "Vitamin B1 (Thiamine)( in mg)",
        1177: "Vitamin B11 (Folic Acid)( in µg)", 1178: "Vitamin B12( in mg)",
        1166: "Vitamin B2 (Riboflavin)( in mg)", 1167: "Vitamin B3 (Niacin)( in mg)",
        1170: "Vitamin B5 (Pantothenic Acid)( in mg)", 1175: "Vitamin B6( in mg)",
        1162: "Vitamin C( in mg)", 1110: "Vitamin D( in mg)", 1109: "Vitamin E( in mg)",
        1185: "Vitamin K( in µg)", 1087: "Calcium( in mg)", 1098: "Copper( in mg)",
        1089: "Iron( in mg)", 1090: "Magnesium( in mg)", 1097: "Manganese( in mg)",
        1091: "Phosphorus( in mg)", 1092: "Potassium( in mg)", 1103: "Selenium( in µg)", 
        1095: "Zinc( in mg)"
    }
    
    final_nutrition = {name: 0.0 for name in nutrient_mapping.values()}
    
    for nutrient in selected_food.get("foodNutrients", []):
        n_id = nutrient.get("nutrientId")
        if n_id in nutrient_mapping:
            final_nutrition[nutrient_mapping[n_id]] = nutrient.get("value", 0.0)
            
    multiplier = portion_g / 100.0
    for key in final_nutrition:
        final_nutrition[key] = round(final_nutrition[key] * multiplier, 2)
        
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