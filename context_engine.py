import os
import json
import requests
from dotenv import load_dotenv

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
# Phase 3: Offline Trend Summarizer
# ==========================================
def compress_historical_context(history_data: list) -> str:
    """Offline trend summary (deterministic).

    Note: The function name is kept for backwards compatibility with existing callers,
    but it intentionally does NOT call Gemini.
    """
    try:
        averages = calculate_moving_averages(history_data)
        if not history_data:
            return "No historical context available."

        first = history_data[0]
        last = history_data[-1]

        def _delta(label: str, key: str):
            try:
                a = float(first.get(key, 0))
                b = float(last.get(key, 0))
                d = round(b - a, 1)
                direction = "improved" if d > 0 else "declined" if d < 0 else "remained stable"
                return f"{label} {direction} ({d:+})."
            except Exception:
                return f"{label} trend unavailable."

        sentence1 = (
            f"7-day averages — mental {averages['avg_mental']}/100, nutrition density {averages['avg_nutrition']}, "
            f"sleep {averages['avg_sleep']}h."
        )
        sentence2 = (
            f"Trend — {_delta('Mental', 'mental_score')} {_delta('Nutrition', 'nutrition_density')} {_delta('Sleep', 'sleep_hours')}"
        )
        return f"{sentence1} {sentence2}".strip()
    except Exception as e:
        return f"Historical context unavailable due to offline summariser error: {e}"

# ==========================================
# Phase 4: Final Payload Assembly
# ==========================================
def build_ollama_prompt(summary: str, averages: dict, current_meal: dict, current_mental: int) -> str:
    """Constructs the raw data string. (System tags are handled by the Modelfile)"""
    
    prompt = f"""[HISTORICAL CONTEXT - PAST 7 DAYS]
Trend: {summary}
7-Day Averages: 
- Mental Health: {averages['avg_mental']}/100
- Nutrition Density: {averages['avg_nutrition']}
- Sleep: {averages['avg_sleep']} hours

[TODAY'S CURRENT VECTORS]
- Current Mental Health Score: {current_mental}/100
- Just Ingested: {current_meal['dish_name']} ({current_meal['calories']} kcal, {current_meal['protein_g']}g Protein, {current_meal['fiber_g']}g Fiber)
- Today's Meal Nutrition Density: {current_meal['nutrition_density']}"""
    
    return prompt

# ==========================================
# Phase 5: Inference Server Connection
# ==========================================
def get_health_coach_advice(prompt_payload: str) -> str:
    """Sends the data to the local Ollama Llama 3 model."""
    print("-> Sending contextual payload to the local Titan Coach model...")
    
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
    env_model = (os.getenv("OLLAMA_MODEL") or "").strip()
    ollama_model = "titan-coach-3b" if (not env_model or env_model in {"my-llama:latest", "titan-coach"}) else env_model

    url = f"{ollama_url}/api/generate"
    data = {
        "model": ollama_model,
        "prompt": prompt_payload,
        "stream": False,
        "raw": True,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 400,
        },
    }
    
    try:
        response = requests.post(url, json=data, timeout=180)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "Error: No response generated.").strip()
    except requests.exceptions.RequestException as e:
        return f"CRITICAL: Failed to connect to local Ollama server. Error: {e}"

# ==========================================
# Execution Block
# ==========================================
if __name__ == "__main__":
    # 1. Environment Setup
    load_dotenv()

    # 2. Data Pipeline
    print("\n[Step 1] Fetching Mock PostgreSQL Data...")
    history_logs = fetch_mock_postgres_data()
    
    print("\n[Step 2] Calculating Moving Averages...")
    averages = calculate_moving_averages(history_logs)
    
    print("\n[Step 3] Building offline trend summary...")
    trend_summary = compress_historical_context(history_logs)
    
    print("\n[Step 4] Assembling Raw Prompt...")
    mock_todays_meal = {
        "dish_name": "2 rotis",
        "calories": 207.9,
        "protein_g": 7.84,
        "fiber_g": 3.43,
        "nutrition_density": 40.04
    }
    todays_mental_score = 42
    
    final_prompt = build_ollama_prompt(trend_summary, averages, mock_todays_meal, todays_mental_score)
    
    # 3. Model Inference
    print("\n[Step 5] Awaiting AI Coach Response...")
    final_advice = get_health_coach_advice(final_prompt)

    print("\n================ TITAN HEALTH COACH ================")
    print(final_advice)
    print("====================================================")