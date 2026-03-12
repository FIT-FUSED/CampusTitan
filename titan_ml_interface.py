import os
from dotenv import load_dotenv

# ---------------------------------------------------------
# IMPORTING YOUR ML MODULES
# Ensure these files are in the same directory as this script.
# ---------------------------------------------------------
from context_engine import (
    calculate_moving_averages,
    format_historical_log,       # <--- NEW: Replaced compress_historical_context
    build_ollama_prompt,
    get_health_coach_advice
)

from mental_wellness_predictor import predict_wellness
from nutrition_score import execute_ml_vision_pipeline

class TitanHealthAI:
    def __init__(self):
        """Initializes the AI interface and loads required environment variables."""
        load_dotenv()
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY")
        self.usda_api_key = os.environ.get("USDA_API_KEY")

        if not self.gemini_api_key or not self.usda_api_key:
            raise EnvironmentError("CRITICAL: Missing GEMINI_API_KEY or USDA_API_KEY in .env file.")

    # ==========================================
    # Endpoint 1: Meal Processing (Vision remains untouched)
    # ==========================================
    def process_meal_image(self, image_filepath: str, user_context: str = "") -> dict:
        """
        Analyzes a food image to calculate calories, macronutrients, and NRF9.3 density.
        """
        print(f"-> AI Interface: Processing meal image from {image_filepath}...")
        
        nutritional_data = execute_ml_vision_pipeline(
            image_path=image_filepath,
            user_text_context=user_context,
            gemini_key=self.gemini_api_key,
            usda_key=self.usda_api_key
        )
        return nutritional_data

    # ==========================================
    # Endpoint 2: Mental Wellness Processing
    # ==========================================
    def calculate_mental_score(self, user_metrics: dict) -> float:
        """
        Predicts the mental wellness score based on behavioral data.
        """
        print("-> AI Interface: Calculating mental wellness score...")
        score = predict_wellness(user_metrics)
        return round(score, 2)

    # ==========================================
    # Endpoint 3: Daily Report Generation (100% Offline LLM)
    # ==========================================
    def generate_daily_report(self, history_logs: list, todays_meal: dict, todays_mental_score: float) -> str:
        """
        Generates the strict, fine-tuned Llama 3.2 coaching advice entirely locally.
        """
        print("-> AI Interface: Generating daily report from local LLM...")
        
        # 1. Math computation (Deterministic)
        averages = calculate_moving_averages(history_logs)
        
        # 2. Raw Format Assembly (Gemini Removed)
        raw_log_string = format_historical_log(history_logs)
        
        # 3. Prompt Assembly (Passing the raw text instead of a Gemini summary)
        final_prompt = build_ollama_prompt(
            raw_log=raw_log_string, 
            averages=averages, 
            current_meal=todays_meal, 
            current_mental=todays_mental_score
        )
        
        # 4. Local Llama 3.2 Inference
        final_advice = get_health_coach_advice(final_prompt)
        
        return final_advice

# ==========================================
# Example Usage Block (For testing the interface directly)
# ==========================================
if __name__ == "__main__":
    try:
        # Initialize the AI Brain
        titan_ai = TitanHealthAI()
        
        print("\n--- Testing Interface Load ---")
        print("TitanHealthAI initialized successfully. Ready for backend integration.")
        
    except Exception as e:
        print(f"Initialization Failed: {e}")