import requests

# ==========================================
# Phase 1: PostgreSQL Simulation
# ==========================================
def fetch_mock_postgres_data():
    """Simulates the JSON payload from your daily_logs database."""
    return [
        {"day": 1, "mental_score": 75, "nutrition_density": 65.2, "sleep_hours": 7.5},
        {"day": 2, "mental_score": 70, "nutrition_density": 60.1, "sleep_hours": 6.0},
        {"day": 3, "mental_score": 65, "nutrition_density": 62.0, "sleep_hours": 5.5},
        {"day": 4, "mental_score": 60, "nutrition_density": 58.5, "sleep_hours": 5.0},
        {"day": 5, "mental_score": 55, "nutrition_density": 64.0, "sleep_hours": 4.5},
        {"day": 6, "mental_score": 50, "nutrition_density": 61.2, "sleep_hours": 4.0},
        {"day": 7, "mental_score": 45, "nutrition_density": 65.0, "sleep_hours": 4.2}
    ]

# ==========================================
# Phase 2: Deterministic Math
# ==========================================
def calculate_moving_averages(history_data: list) -> dict:
    """Calculates strict mathematical averages to prevent LLM hallucination."""
    if not history_data:
        return {"avg_mental": 0, "avg_nutrition": 0, "avg_sleep": 0}
        
    days = len(history_data)
    avg_mental = sum(item["mental_score"] for item in history_data) / days
    avg_nutrition = sum(item["nutrition_density"] for item in history_data) / days
    avg_sleep = sum(item["sleep_hours"] for item in history_data) / days
    
    return {
        "avg_mental": round(avg_mental, 1),
        "avg_nutrition": round(avg_nutrition, 1),
        "avg_sleep": round(avg_sleep, 1)
    }

# ==========================================
# Phase 3: Raw History Formatter 
# ==========================================
def format_historical_log(history_data: list) -> str:
    """Converts the raw JSON into a clean chronological text log for Llama 3.2."""
    log_lines = []
    for entry in history_data:
        line = f"Day {entry['day']} - Mental: {entry['mental_score']}, Nutrition: {entry['nutrition_density']}, Sleep: {entry['sleep_hours']}h"
        log_lines.append(line)
    return "\n".join(log_lines)

# ==========================================
# Phase 4: Final Payload Assembly
# ==========================================
def build_ollama_prompt(raw_log: str, averages: dict, current_meal: dict, current_mental: int) -> str:
    """Constructs the exact raw data string the model was trained on, forcing a descriptive paragraph."""
    
    prompt = f"""### System: You are a highly analytical wellness data coach. Provide a detailed, descriptive paragraph summarizing the user's health trend. 
CRITICAL RULES:
1. DO NOT output numbered lists or bullet points. Write a fluid paragraph.
2. DO NOT perform mathematical calculations. Rely ONLY on the provided 7-DAY AVERAGES.
3. Sentence 1: State the overall directional trend of their mental health, nutrition, and sleep.
4. Sentence 2: Describe how today's mental score and today's meal compare to the 7-day average baseline.
5. Sentence 3: Hypothesize the correlation between their sleep/nutrition and their current mental state.
6. Sentence 4: Provide exactly one highly specific, actionable diet or lifestyle adjustment to correct the trajectory.
### Input:
[PAST 7 DAYS LOG]
{raw_log}

[7-DAY AVERAGES]
Mental: {averages['avg_mental']}, Nutrition: {averages['avg_nutrition']}, Sleep: {averages['avg_sleep']}h

[TODAY'S VECTORS]
Mental: {current_mental}, Meal: {current_meal['dish_name']} ({current_meal['calories']} kcal, {current_meal['protein_g']}g Protein)
### Output:"""
    
    return prompt

# ==========================================
# Phase 5: Local Inference Server Connection
# ==========================================
def get_health_coach_advice(prompt_payload: str) -> str:
    """Sends the data to the local Ollama Llama 3.2 3B model."""
    print("-> Sending contextual payload to the local Titan Coach 3B model...")
    
    url = "http://localhost:11434/api/generate"
    data = {
        "model": "titan-coach-3b",
        "prompt": prompt_payload,
        "stream": False,
        "raw": True  # <--- CRITICAL FIX: This disables Ollama's auto-formatting
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "Error: No response generated.").strip()
    except requests.exceptions.RequestException as e:
        return f"CRITICAL: Failed to connect to local Ollama server. Error: {e}"

# ==========================================
# Execution Block
# ==========================================
if __name__ == "__main__":
    
    # 1. Data Pipeline
    print("\n[Step 1] Fetching Mock PostgreSQL Data...")
    history_logs = fetch_mock_postgres_data()
    
    print("\n[Step 2] Calculating Moving Averages...")
    averages = calculate_moving_averages(history_logs)
    
    print("\n[Step 3] Formatting Raw Log for Local LLM...")
    raw_log_string = format_historical_log(history_logs)
    
    print("\n[Step 4] Assembling Final Prompt...")
    mock_todays_meal = {
        "dish_name": "2 rotis",
        "calories": 207.9,
        "protein_g": 7.84,
        "fiber_g": 3.43,
        "nutrition_density": 40.04
    }
    todays_mental_score = 42
    
    final_prompt = build_ollama_prompt(raw_log_string, averages, mock_todays_meal, todays_mental_score)
    
    # 2. Model Inference
    print("\n[Step 5] Awaiting AI Coach Response...")
    final_advice = get_health_coach_advice(final_prompt)

    print("\n================ TITAN HEALTH COACH ================")
    print(final_advice)
    print("====================================================")