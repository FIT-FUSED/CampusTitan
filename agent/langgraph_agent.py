"""
CampusTitan Agentic Workflow System
=====================================
Implements a LangGraph-style agent with:
- Router Agent (LLM-based query classification)
- Tool System (Nutrition, Activity, Wellness, Prediction, Recommendation)
- Response Generator (LLM-based answer synthesis)
- Natural Language Logging (Intent Parser, Food/Activity Logging Tools)

User Query → Router → Tool → Tool Output → LLM Response → Final Answer

Natural Language Logging Flow:
User Query → Intent Parser → Router (LLM-based) → Logging Tool(s) → Database → Response → App
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Try to import google.genai (new package), fallback to deprecated one
try:
    from google import genai
    from google.genai import types
    GOOGLE_GENAI_V2 = True
except ImportError:
    try:
        import google.generativeai as genai
        from google.generativeai import types
        GOOGLE_GENAI_V2 = False
    except ImportError:
        genai = None
        types = None
        GOOGLE_GENAI_V2 = False

# Try to import ML modules (optional - for prediction tool)
try:
    from mental_wellness_predictor import predict_wellness
    from context_engine import calculate_moving_averages
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("Warning: ML modules not available. Prediction features disabled.")

load_dotenv()


def _get_genai_client(api_key: str):
    if not api_key:
        return None
    if GOOGLE_GENAI_V2:
        return genai.Client(api_key=api_key)
    genai.configure(api_key=api_key)
    return None


# ==========================================
# Food Macro Lookup Table
# ==========================================

FOOD_MACRO_TABLE = {
    # Indian Foods
    "chapati": {"calories": 120, "protein": 3, "carbs": 20, "fat": 3},
    "roti": {"calories": 120, "protein": 3, "carbs": 20, "fat": 3},
    "paratha": {"calories": 250, "protein": 6, "carbs": 30, "fat": 12},
    "naan": {"calories": 260, "protein": 8, "carbs": 45, "fat": 6},
    "puri": {"calories": 160, "protein": 4, "carbs": 22, "fat": 7},
    "rice": {"calories": 130, "protein": 2, "carbs": 28, "fat": 0.3},
    "dal": {"calories": 120, "protein": 9, "carbs": 20, "fat": 3},
    "dal tadka": {"calories": 180, "protein": 12, "carbs": 22, "fat": 6},
    "rajma": {"calories": 220, "protein": 15, "carbs": 38, "fat": 4},
    "chole": {"calories": 210, "protein": 12, "carbs": 35, "fat": 5},
    "paneer": {"calories": 265, "protein": 14, "carbs": 3, "fat": 22},
    "butter chicken": {"calories": 350, "protein": 25, "carbs": 10, "fat": 25},
    "biryani": {"calories": 320, "protein": 12, "carbs": 45, "fat": 10},
    "dosa": {"calories": 200, "protein": 4, "carbs": 35, "fat": 5},
    "idli": {"calories": 100, "protein": 3, "carbs": 20, "fat": 1},
    "vada": {"calories": 150, "protein": 4, "carbs": 18, "fat": 7},
    "samosa": {"calories": 260, "protein": 5, "carbs": 30, "fat": 14},
    "pakora": {"calories": 200, "protein": 4, "carbs": 20, "fat": 12},
    "poha": {"calories": 180, "protein": 4, "carbs": 30, "fat": 5},
    "upma": {"calories": 160, "protein": 4, "carbs": 25, "fat": 5},
    
    # Common Foods
    "egg": {"calories": 70, "protein": 6, "carbs": 0.6, "fat": 5},
    "eggs": {"calories": 70, "protein": 6, "carbs": 0.6, "fat": 5},
    "boiled egg": {"calories": 78, "protein": 6, "carbs": 0.6, "fat": 5},
    "fried egg": {"calories": 90, "protein": 6, "carbs": 0.6, "fat": 7},
    "omelette": {"calories": 120, "protein": 8, "carbs": 1, "fat": 9},
    "banana": {"calories": 89, "protein": 1, "carbs": 23, "fat": 0.3},
    "apple": {"calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2},
    "orange": {"calories": 47, "protein": 0.9, "carbs": 12, "fat": 0.1},
    "mango": {"calories": 60, "protein": 0.8, "carbs": 15, "fat": 0.4},
    "grapes": {"calories": 69, "protein": 0.7, "carbs": 18, "fat": 0.2},
    "watermelon": {"calories": 30, "protein": 0.6, "carbs": 8, "fat": 0.2},
    "papaya": {"calories": 43, "protein": 0.5, "carbs": 11, "fat": 0.3},
    "milkshake": {"calories": 180, "protein": 6, "carbs": 30, "fat": 4},
    "milk": {"calories": 42, "protein": 3.4, "carbs": 5, "fat": 1},
    "curd": {"calories": 60, "protein": 4, "carbs": 5, "fat": 3},
    "yogurt": {"calories": 60, "protein": 4, "carbs": 5, "fat": 3},
    "butter": {"calories": 102, "protein": 0.1, "carbs": 0, "fat": 12},
    "cheese": {"calories": 113, "protein": 7, "carbs": 0.4, "fat": 9},
    "bread": {"calories": 80, "protein": 3, "carbs": 15, "fat": 1},
    "toast": {"calories": 100, "protein": 4, "carbs": 18, "fat": 2},
    "sandwich": {"calories": 250, "protein": 10, "carbs": 35, "fat": 8},
    "pizza": {"calories": 285, "protein": 12, "carbs": 36, "fat": 10},
    "burger": {"calories": 354, "protein": 17, "carbs": 31, "fat": 17},
    "fries": {"calories": 312, "protein": 3, "carbs": 41, "fat": 15},
    "noodles": {"calories": 138, "protein": 4, "carbs": 25, "fat": 2},
    "pasta": {"calories": 131, "protein": 5, "carbs": 25, "fat": 1},
    "maggi": {"calories": 100, "protein": 3, "carbs": 18, "fat": 2},
    "soup": {"calories": 50, "protein": 3, "carbs": 8, "fat": 1},
    "salad": {"calories": 35, "protein": 1, "carbs": 7, "fat": 0.3},
    "chicken": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6},
    "fish": {"calories": 136, "protein": 20, "carbs": 0, "fat": 5},
    "mutton": {"calories": 250, "protein": 26, "carbs": 0, "fat": 15},
    "vegetables": {"calories": 30, "protein": 2, "carbs": 6, "fat": 0.3},
    "mix veg": {"calories": 60, "protein": 3, "carbs": 10, "fat": 2},
    "aloo gobhi": {"calories": 150, "protein": 4, "carbs": 15, "fat": 8},
    "bhindi": {"calories": 120, "protein": 3, "carbs": 12, "fat": 7},
    "palak paneer": {"calories": 200, "protein": 12, "carbs": 10, "fat": 14},
    "daal makhani": {"calories": 220, "protein": 14, "carbs": 25, "fat": 8},
    
    # Beverages
    "coffee": {"calories": 2, "protein": 0.3, "carbs": 0, "fat": 0},
    "tea": {"calories": 2, "protein": 0, "carbs": 0, "fat": 0},
    "juice": {"calories": 55, "protein": 0.5, "carbs": 14, "fat": 0.2},
    "cold drink": {"calories": 40, "protein": 0, "carbs": 10, "fat": 0},
    "water": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
    
    # Snacks
    "chips": {"calories": 152, "protein": 2, "carbs": 15, "fat": 10},
    "biscuit": {"calories": 60, "protein": 1, "carbs": 8, "fat": 3},
    "cookie": {"calories": 80, "protein": 1, "carbs": 10, "fat": 4},
    "chocolate": {"calories": 230, "protein": 3, "carbs": 25, "fat": 13},
    "ice cream": {"calories": 137, "protein": 2, "carbs": 16, "fat": 7},
    "cake": {"calories": 257, "protein": 3, "carbs": 36, "fat": 12},
    
    # Breakfast
    "cornflakes": {"calories": 100, "protein": 2, "carbs": 24, "fat": 0.5},
    "oats": {"calories": 150, "protein": 5, "carbs": 27, "fat": 3},
    "granola": {"calories": 190, "protein": 4, "carbs": 32, "fat": 6},
    "pancake": {"calories": 175, "protein": 5, "carbs": 22, "fat": 7},
    "waffle": {"calories": 200, "protein": 5, "carbs": 25, "fat": 9},
}

# Activity Calorie Burn Rates (per hour)
ACTIVITY_CALORIES = {
    "badminton": 400,
    "tennis": 450,
    "football": 500,
    "soccer": 450,
    "cricket": 300,
    "basketball": 480,
    "volleyball": 300,
    "hockey": 450,
    "baseball": 350,
    "swimming": 500,
    "running": 600,
    "jogging": 450,
    "walking": 280,
    "cycling": 450,
    "gym": 400,
    "workout": 350,
    "yoga": 200,
    "meditation": 50,
    "dance": 400,
    "dancing": 400,
    "aerobics": 450,
    "boxing": 550,
    "martial arts": 500,
    "karate": 400,
    "table tennis": 280,
    "ping pong": 280,
    "squash": 500,
    "hiking": 400,
    "climbing": 450,
    "skipping": 600,
    "jump rope": 600,
    "burpee": 500,
    "pushups": 300,
    "pullups": 250,
    "weightlifting": 300,
    "stretching": 150,
    "pilates": 280,
    "zumba": 450,
    "cardio": 450,
    " HIIT": 500,
    "crossfit": 550,
    "running": 600,
    "sprinting": 700,
    "marathon": 800,
}

# ==========================================
# Data Classes
# ==========================================

@dataclass
class AgentQuery:
    """Represents a user query to the agent"""
    raw_query: str
    user_id: str
    timestamp: datetime
    context: Dict[str, Any] = None

@dataclass
class AgentResponse:
    """Represents the agent's final response"""
    answer: str
    tool_used: str
    confidence: float
    data: Dict[str, Any]
    sources: List[str]

@dataclass
class ToolResult:
    """Represents the result from a tool execution"""
    tool_name: str
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None

# ==========================================
# Tool Definitions
# ==========================================

class BaseTool:
    """Base class for all tools"""
    name: str = "base"
    description: str = "Base tool"
    required_params: List[str] = []
    
    def execute(self, params: Dict[str, Any], user_id: str) -> ToolResult:
        raise NotImplementedError

class NutritionTool(BaseTool):
    """
    Nutrition Tool - Fetches user's nutritional data from Supabase
    Handles queries about: protein, calories, macros, meals, food logs
    """
    name = "nutrition"
    description = "Fetches nutritional data including protein intake, calories, macronutrients, and meal history"
    required_params = ["user_id"]
    
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    def execute(self, params: Dict[str, Any], user_id: str) -> ToolResult:
        try:
            # Get date range (default: today)
            date = params.get("date", datetime.now().strftime("%Y-%m-%d"))
            time_range = params.get("time_range", "day")  # day, week, month
            
            # Build query based on time range
            if time_range == "day":
                start_date = date
                end_date = date
            elif time_range == "week":
                start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
                end_date = date
            else:  # month
                start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
                end_date = date
            
            # Fetch food logs from Supabase
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}"
            }
            
            response = requests.get(
                f"{self.supabase_url}/rest/v1/food_logs",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "date": f"gte.{start_date}&date=lte.{end_date}",
                    "select": "*",
                    "order": "date.desc"
                }
            )
            
            if response.status_code != 200:
                return ToolResult(
                    tool_name=self.name,
                    success=False,
                    data={},
                    error=f"Database error: {response.text}"
                )
            
            food_logs = response.json()
            
            # Calculate macros
            totals = {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0,
                "meals": len(food_logs)
            }
            
            for log in food_logs:
                totals["calories"] += log.get("calories", 0)
                totals["protein"] += log.get("protein", 0)
                totals["carbs"] += log.get("carbs", 0)
                totals["fat"] += log.get("fat", 0)
                totals["fiber"] += log.get("fiber", 0)
            
            # Get protein goal (default: based on weight)
            protein_goal = params.get("protein_goal", 60)  # Default 60g
            
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "date": date,
                    "time_range": time_range,
                    "food_logs": food_logs[:5],  # Last 5 meals
                    "totals": totals,
                    "protein_goal": protein_goal,
                    "protein_percentage": min(100, (totals["protein"] / protein_goal) * 100),
                    "meals_logged": len(food_logs)
                }
            )
            
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                success=False,
                data={},
                error=str(e)
            )

class ActivityTool(BaseTool):
    """
    Activity Tool - Fetches user's activity data from Supabase
    Handles queries about: workouts, calories burned, exercise minutes, steps
    """
    name = "activity"
    description = "Fetches activity data including workouts, calories burned, exercise minutes, and step count"
    required_params = ["user_id"]
    
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    def execute(self, params: Dict[str, Any], user_id: str) -> ToolResult:
        try:
            date = params.get("date", datetime.now().strftime("%Y-%m-%d"))
            time_range = params.get("time_range", "day")
            
            if time_range == "day":
                start_date = date
            elif time_range == "week":
                start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            else:
                start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}"
            }
            
            response = requests.get(
                f"{self.supabase_url}/rest/v1/activities",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "date": f"gte.{start_date}",
                    "select": "*",
                    "order": "date.desc"
                }
            )
            
            activities = response.json() if response.status_code == 200 else []
            
            totals = {
                "sessions": len(activities),
                "total_minutes": 0,
                "total_calories": 0,
                "steps": 0
            }
            
            activity_types = {}
            
            for act in activities:
                totals["total_minutes"] += act.get("duration", 0)
                totals["total_calories"] += act.get("calories_burned", 0)
                act_type = act.get("type", "other")
                activity_types[act_type] = activity_types.get(act_type, 0) + 1
            
            # Calculate weekly goal progress
            weekly_goal = params.get("weekly_goal", 150)  # 150 min default
            today_goal = params.get("today_goal", 30)  # 30 min daily
            
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "date": date,
                    "time_range": time_range,
                    "activities": activities[:5],
                    "totals": totals,
                    "activity_types": activity_types,
                    "weekly_goal_progress": min(100, (totals["total_minutes"] / weekly_goal) * 100),
                    "today_progress": min(100, (totals["total_minutes"] / today_goal) * 100)
                }
            )
            
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                success=False,
                data={},
                error=str(e)
            )

class WellnessTool(BaseTool):
    """
    Wellness Tool - Fetches user's wellness data
    Handles queries about: sleep, stress, mood, AQI, screen time, productivity
    """
    name = "wellness"
    description = "Fetches wellness data including sleep hours, stress level, mood, AQI exposure, and productivity"
    required_params = ["user_id"]
    
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    def execute(self, params: Dict[str, Any], user_id: str) -> ToolResult:
        try:
            date = params.get("date", datetime.now().strftime("%Y-%m-%d"))
            days = params.get("days", 7)
            
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}"
            }
            
            # Fetch wellness data
            response = requests.get(
                f"{self.supabase_url}/rest/v1/user_wellness_data",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "date": f"lte.{date}",
                    "select": "*",
                    "order": "date.desc",
                    "limit": days
                }
            )
            
            wellness_logs = response.json() if response.status_code == 200 else []
            
            # Calculate averages
            if wellness_logs:
                avg_sleep = sum(w.get("sleep_hrs", 0) for w in wellness_logs) / len(wellness_logs)
                avg_stress = sum(w.get("stress_level", 5) for w in wellness_logs) / len(wellness_logs)
                avg_productivity = sum(w.get("productivity", 50) for w in wellness_logs) / len(wellness_logs)
                avg_screen = sum(w.get("screen_time_hrs", 0) for w in wellness_logs) / len(wellness_logs)
            else:
                avg_sleep = avg_stress = avg_productivity = avg_screen = 0
            
            # Get today's data
            today_data = next((w for w in wellness_logs if w.get("date") == date), None)
            
            # Get AQI from environment (mock for now)
            aqi = params.get("aqi", 120)
            
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "date": date,
                    "days_analyzed": len(wellness_logs),
                    "today": today_data,
                    "averages": {
                        "sleep_hours": round(avg_sleep, 1),
                        "stress_level": round(avg_stress, 1),
                        "productivity": round(avg_productivity, 1),
                        "screen_time_hours": round(avg_screen, 1)
                    },
                    "aqi": aqi,
                    "aqi_impact": "moderate" if aqi < 150 else "unhealthy"
                }
            )
            
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                success=False,
                data={},
                error=str(e)
            )

class PredictionTool(BaseTool):
    """
    Prediction Tool - Uses PyTorch ML model for wellness prediction
    """
    name = "prediction"
    description = "Predicts future wellness scores based on historical data using ML model"
    required_params = ["user_id"]
    
    def execute(self, params: Dict[str, Any], user_id: str) -> ToolResult:
        # Check if ML is available
        if not ML_AVAILABLE:
            return ToolResult(
                tool_name=self.name,
                success=False,
                data={},
                error="ML prediction not available. Please install torch and scikit-learn."
            )
        
        try:
            # Get user metrics for prediction
            age = params.get("age", 22)
            gender = params.get("gender", "male")
            screen_time = params.get("screen_time_hours", 6)
            sleep_hours = params.get("sleep_hours", 7)
            stress_level = params.get("stress_level", 5)
            productivity = params.get("productivity", 50)
            exercise_minutes = params.get("exercise_minutes", 30)
            
            # Build metrics dict for the model
            user_metrics = {
                "age": age,
                "gender": gender,
                "occupation": params.get("occupation", "student"),
                "work_mode": params.get("work_mode", "hybrid"),
                "screen_time_hours": screen_time,
                "work_screen_hours": screen_time * 0.4,
                "leisure_screen_hours": screen_time * 0.6,
                "sleep_hours": sleep_hours,
                "sleep_quality_1_5": params.get("sleep_quality", 3),
                "stress_level_0_10": stress_level,
                "productivity_0_100": productivity,
                "exercise_minutes_per_week": exercise_minutes * 7,
                "social_hours_per_week": params.get("social_hours", 2),
                "kms_walked_daily": params.get("walked_km", 2)
            }
            
            # Get prediction from ML model
            predicted_score = predict_wellness(user_metrics)
            
            # Get historical trend
            days = params.get("trend_days", 7)
            
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "predicted_wellness_score": round(predicted_score, 1),
                    "confidence": 0.85,
                    "factors": {
                        "sleep_impact": "positive" if sleep_hours >= 7 else "negative",
                        "exercise_impact": "positive" if exercise_minutes >= 30 else "neutral",
                        "screen_time_impact": "moderate" if screen_time < 6 else "negative",
                        "stress_impact": "positive" if stress_level < 5 else "negative"
                    },
                    "trend": "improving" if predicted_score > 60 else "declining",
                    "recommendations": [
                        "Maintain 7+ hours of sleep",
                        "Limit screen time to < 6 hours",
                        "Exercise for at least 30 minutes daily"
                    ]
                }
            )
            
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                success=False,
                data={},
                error=f"ML prediction error: {str(e)}"
            )

class RecommendationTool(BaseTool):
    """
    Recommendation Tool - Uses LLM to generate personalized recommendations
    """
    name = "recommendation"
    description = "Generates personalized health recommendations based on user data"
    required_params = ["user_id"]
    
    def __init__(self):
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY")
        self._client = _get_genai_client(self.gemini_api_key)
    
    def execute(self, params: Dict[str, Any], user_id: str) -> ToolResult:
        try:
            # Gather context from other data
            nutrition = params.get("nutrition_data", {})
            activity = params.get("activity_data", {})
            wellness = params.get("wellness_data", {})
            prediction = params.get("prediction_data", {})
            
            # Build context for LLM
            context = f"""
            User Health Context:
            - Today's Protein: {nutrition.get('totals', {}).get('protein', 0)}g
            - Today's Calories: {nutrition.get('totals', {}).get('calories', 0)}
            - Activity Today: {activity.get('totals', {}).get('total_minutes', 0)} minutes
            - Sleep Last Night: {wellness.get('averages', {}).get('sleep_hours', 0)} hours
            - Stress Level: {wellness.get('averages', {}).get('stress_level', 5)}/10
            - Predicted Wellness: {prediction.get('predicted_wellness_score', 'N/A')}/100
            """
            
            prompt = f"""
            You are Titan AI, a campus health coach for college students.
            
            {context}
            
            Based on this data, provide 3 specific, actionable recommendations for the user today.
            Keep it brief, friendly, and actionable.
            Format as a numbered list.
            """
            
            if self.gemini_api_key:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(
                    contents=prompt,
                    generation_config=types.GenerateContentConfig(temperature=0.7)
                )
                recommendations = response.text.strip()
            else:
                recommendations = "1. Eat more protein-rich foods like eggs, dal, or chicken\n2. Get 30+ minutes of exercise today\n3. Aim for 7+ hours of sleep tonight"
            
            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "recommendations": recommendations,
                    "context": context,
                    "personalized": True
                }
            )
            
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                success=False,
                data={},
                error=str(e)
            )

# ==========================================
# Router Agent
# ==========================================

class RouterAgent:
    """
    Router Agent - Classifies user queries and selects the appropriate tool
    """
    
    def __init__(self):
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY")
        self._client = _get_genai_client(self.gemini_api_key)
        
        # Tool descriptions for routing
        self.tools = {
            "nutrition": "Handles queries about: protein, calories, carbs, fat, meals, food intake, eating habits, nutrition density, hunger, diet",
            "activity": "Handles queries about: exercise, workouts, running, gym, cycling, sports, calories burned, steps, walking, fitness, movement",
            "wellness": "Handles queries about: sleep, stress, mood, mental health, AQI, air quality, screen time, productivity, rest, relaxation",
            "prediction": "Handles queries about: future predictions, wellness score forecast, health trends, expected outcomes, tomorrow's预测",
            "recommendation": "Handles queries about: advice, suggestions, tips, what should I do, recommendations, help me improve"
        }
    
    def classify_query(self, query: str) -> Dict[str, Any]:
        """
        Uses LLM to classify the query and select appropriate tool(s)
        """
        tools_list = "\n".join([f"- {name}: {desc}" for name, desc in self.tools.items()])
        
        prompt = f"""
        You are a query classifier for a campus health app.
        
        Available Tools:
        {tools_list}
        
        User Query: "{query}"
        
        Task: 
        1. Classify the query into one or more of the above tools
        2. Extract any specific parameters mentioned (e.g., "today", "this week", protein goal)
        
        Respond in JSON format:
        {{
            "primary_tool": "tool_name",
            "secondary_tools": ["other_tool1", "other_tool2"],
            "confidence": 0.95,
            "extracted_params": {{
                "time_range": "day|week|month",
                "specific_topic": "protein|calories|sleep|etc",
                "goal_mentioned": true/false
            }},
            "query_intent": "informational|actionable|predictive"
        }}
        """
        
        if self.gemini_api_key:
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(
                    contents=prompt,
                    generation_config=types.GenerateContentConfig(
                        temperature=0.1,
                        response_mime_type="application/json"
                    )
                )
                result = json.loads(response.text)
                return result
            except Exception as e:
                print(f"Router classification error: {e}")
        
        # Fallback: keyword-based routing
        return self._keyword_based_routing(query)
    
    def _keyword_based_routing(self, query: str) -> Dict[str, Any]:
        """Fallback keyword-based routing"""
        query_lower = query.lower()
        
        # Define keyword mappings
        keyword_map = {
            "nutrition": ["protein", "calories", "eat", "food", "meal", "diet", "carbs", "fat", "nutrition", "hungry", "breakfast", "lunch", "dinner"],
            "activity": ["exercise", "workout", "gym", "run", "running", "cycling", "sports", "fitness", "steps", "walk", "active", "burned", "minutes"],
            "wellness": ["sleep", "stress", "mood", "mental", "aqi", "air", "screen", "productivity", "rest", "tired", "energy"],
            "prediction": ["predict", "future", "forecast", "will i", "expected", "trend"],
            "recommendation": ["should", "advice", "tips", "suggest", "recommend", "help me", "what to"]
        }
        
        # Score each category
        scores = {}
        for category, keywords in keyword_map.items():
            score = sum(1 for kw in keywords if kw in query_lower)
            scores[category] = score
        
        # Get highest scoring category
        if max(scores.values()) > 0:
            primary_tool = max(scores, key=scores.get)
        else:
            primary_tool = "recommendation"  # Default
        
        return {
            "primary_tool": primary_tool,
            "secondary_tools": [],
            "confidence": 0.7,
            "extracted_params": {
                "time_range": "day",
                "specific_topic": None,
                "goal_mentioned": "goal" in query_lower or "target" in query_lower
            },
            "query_intent": "actionable" if "?" in query else "informational"
        }

# ==========================================
# Response Generator
# ==========================================

class ResponseGenerator:
    """
    Generates human-readable responses from tool outputs
    """
    
    def __init__(self):
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY")
        self._client = _get_genai_client(self.gemini_api_key)
    
    def generate_response(
        self, 
        query: str, 
        tool_results: List[ToolResult],
        user_context: Dict[str, Any]
    ) -> AgentResponse:
        """
        Generates a natural language response from tool results
        """
        # Build context from tool results
        context_parts = []
        data_summary = {}
        
        for result in tool_results:
            if result.success:
                context_parts.append(f"[{result.tool_name.upper()}] {json.dumps(result.data)}")
                data_summary[result.tool_name] = result.data
        
        context = "\n\n".join(context_parts)
        
        # Get the primary tool result for simpler queries
        primary_data = tool_results[0].data if tool_results else {}
        
        # Generate response based on query type
        query_lower = query.lower()
        
        # Handle specific common queries directly for speed
        if "protein" in query_lower:
            answer = self._generate_protein_response(primary_data, query)
        elif "sleep" in query_lower:
            answer = self._generate_sleep_response(primary_data, query)
        elif "exercise" in query_lower or "workout" in query_lower:
            answer = self._generate_activity_response(primary_data, query)
        elif "stress" in query_lower:
            answer = self._generate_stress_response(primary_data, query)
        elif "wellness" in query_lower or "score" in query_lower:
            answer = self._generate_wellness_response(primary_data, query)
        else:
            # Use LLM for complex queries
            answer = self._generate_llm_response(query, context, user_context)
        
        # Determine confidence
        confidence = 0.9 if tool_results[0].success else 0.5 if tool_results else 0.3
        
        return AgentResponse(
            answer=answer,
            tool_used=tool_results[0].tool_name if tool_results else "none",
            confidence=confidence,
            data=data_summary,
            sources=["Supabase Database", "ML Model" if any("prediction" in r.tool_name for r in tool_results) else "User Input"]
        )
    
    def _generate_protein_response(self, data: Dict, query: str) -> str:
        """Generate response for protein-related queries"""
        totals = data.get("totals", {})
        protein = totals.get("protein", 0)
        goal = data.get("protein_goal", 60)
        percentage = data.get("protein_percentage", 0)
        
        if percentage >= 100:
            status = f"🎉 Great job! You've exceeded your protein goal with {protein}g!"
        elif percentage >= 75:
            status = f"💪 Good progress! You've gotten {protein}g ({percentage:.0f}%) of your {goal}g goal."
        elif percentage >= 50:
            status = f"🥗 You're at {protein}g ({percentage:.0f}%) of your {goal}g protein goal. Add some more!"
        else:
            status = f"⚠️ Only {protein}g ({percentage:.0f}%) of your {goal}g protein goal. Eat protein-rich foods!"
        
        return status
    
    def _generate_sleep_response(self, data: Dict, query: str) -> str:
        """Generate response for sleep-related queries"""
        averages = data.get("averages", {})
        today = data.get("today", {})
        
        sleep_hours = today.get("sleep_hrs") or averages.get("sleep_hours", 0)
        
        if sleep_hours >= 7:
            return f"😴 Great sleep! You got {sleep_hours} hours last night. Keep it up!"
        elif sleep_hours >= 6:
            return f"😪 You slept {sleep_hours} hours. Try to get 7+ for better wellness."
        else:
            return f"😫 Only {sleep_hours} hours of sleep? Prioritize rest tonight!"
    
    def _generate_activity_response(self, data: Dict, query: str) -> str:
        """Generate response for activity-related queries"""
        totals = data.get("totals", {})
        today_progress = data.get("today_progress", 0)
        
        minutes = totals.get("total_minutes", 0)
        calories = totals.get("total_calories", 0)
        
        if today_progress >= 100:
            return f"🏆 Amazing! You've completed {minutes} minutes of activity today, burning {calories} calories!"
        elif today_progress >= 50:
            return f"💪 Good progress! {minutes} minutes down. You're at {today_progress:.0f}% of your goal."
        else:
            return f"🏃 Start moving! You have {minutes} minutes ({today_progress:.0f}%) of your 30-min daily goal."
    
    def _generate_stress_response(self, data: Dict, query: str) -> str:
        """Generate response for stress-related queries"""
        averages = data.get("averages", {})
        stress = averages.get("stress_level", 5)
        
        if stress <= 3:
            return f"😊 Low stress at {stress}/10! You're doing great!"
        elif stress <= 6:
            return f"😐 Moderate stress at {stress}/10. Try some deep breathing or a short walk."
        else:
            return f"😰 High stress at {stress}/10. Take a break, do some stretching, or talk to someone!"
    
    def _generate_wellness_response(self, data: Dict, query: str) -> str:
        """Generate response for wellness score queries"""
        prediction = data.get("predicted_wellness_score", 0)
        
        if prediction >= 75:
            return f"🌟 Your predicted wellness score is {prediction}/100! You're on fire!"
        elif prediction >= 50:
            return f"📊 Your wellness score is around {prediction}/100. Room for improvement!"
        else:
            return f"⚠️ Your predicted wellness is {prediction}/100. Let's work on self-care!"
    
    def _generate_llm_response(self, query: str, context: str, user_context: Dict) -> str:
        """Generate response using LLM for complex queries"""
        if not self.gemini_api_key:
            return "I need more data to answer that. Try asking about your protein, sleep, exercise, or stress!"
        
        prompt = f"""
        You are Titan AI, a friendly campus health coach.
        
        User Question: {query}
        
        Data Context:
        {context}
        
        User Profile:
        - Name: {user_context.get('name', 'Student')}
        - College: {user_context.get('college', 'Campus')}
        
        Answer the user's question based on the data above.
        Be friendly, concise, and actionable.
        Keep it under 2 sentences.
        """
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(
                contents=prompt,
                generation_config=types.GenerateContentConfig(temperature=0.7)
            )
            return response.text.strip()
        except Exception as e:
            return f"I analyzed your data but couldn't generate a detailed response. Your daily stats are available in the app!"

# ==========================================
# Main Agent Class
# ==========================================

class CampusTitanAgent:
    """
    Main Agent class that orchestrates the entire workflow:
    Query → Router → Tool → Tool Output → LLM Response → Final Answer
    """
    
    def __init__(self):
        # Initialize all tools
        self.tools = {
            "nutrition": NutritionTool(),
            "activity": ActivityTool(),
            "wellness": WellnessTool(),
            "prediction": PredictionTool(),
            "recommendation": RecommendationTool()
        }
        
        # Initialize router and response generator
        self.router = RouterAgent()
        self.response_generator = ResponseGenerator()
    
    def process_query(self, query: str, user_id: str, user_context: Dict = None) -> AgentResponse:
        """
        Main entry point for processing user queries
        
        Workflow:
        1. Classify query using Router Agent
        2. Execute selected tool(s)
        3. Generate response using LLM
        """
        print(f"\n🤖 Processing query: {query}")
        
        # Step 1: Route the query
        print("📡 Routing query...")
        routing = self.router.classify_query(query)
        print(f"   → Primary tool: {routing['primary_tool']}")
        print(f"   → Confidence: {routing['confidence']}")
        
        # Step 2: Execute tools
        print("🔧 Executing tools...")
        tool_results = []
        
        # Execute primary tool
        primary_tool_name = routing["primary_tool"]
        if primary_tool_name in self.tools:
            params = {
                "user_id": user_id,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "time_range": routing.get("extracted_params", {}).get("time_range", "day")
            }
            
            # Add user context to params
            if user_context:
                params.update({
                    "age": user_context.get("age", 22),
                    "gender": user_context.get("gender", "male"),
                    "occupation": user_context.get("occupation", "student"),
                    "protein_goal": user_context.get("protein_goal", 60),
                    "weekly_goal": user_context.get("weekly_goal", 150)
                })
            
            result = self.tools[primary_tool_name].execute(params, user_id)
            tool_results.append(result)
            print(f"   → {primary_tool_name}: {'✓' if result.success else '✗'}")
        
        # Execute secondary tools if needed
        for tool_name in routing.get("secondary_tools", []):
            if tool_name in self.tools:
                params = {"user_id": user_id}
                if user_context:
                    params.update(user_context)
                
                result = self.tools[tool_name].execute(params, user_id)
                tool_results.append(result)
        
        # Step 3: Generate response
        print("✨ Generating response...")
        response = self.response_generator.generate_response(
            query=query,
            tool_results=tool_results,
            user_context=user_context or {}
        )
        
        print(f"   → Answer: {response.answer[:100]}...")
        
        return response

# ==========================================
# API Endpoint Handler
# ==========================================

def handle_agent_request(query: str, user_id: str, user_context: Dict = None) -> Dict:
    """
    API handler function for the agent
    Returns JSON-serializable response
    """
    agent = CampusTitanAgent()
    
    try:
        response = agent.process_query(query, user_id, user_context)
        
        return {
            "success": True,
            "answer": response.answer,
            "tool_used": response.tool_used,
            "confidence": response.confidence,
            "data": response.data,
            "sources": response.sources,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "answer": "Sorry, I encountered an error. Please try again.",
            "timestamp": datetime.now().isoformat()
        }

# ==========================================
# Example Usage
# ==========================================

if __name__ == "__main__":
    # Initialize agent
    agent = CampusTitanAgent()
    
    # Mock user context
    mock_user_context = {
        "name": "Arjun",
        "college": "MNNIT",
        "age": 22,
        "gender": "male",
        "protein_goal": 60,
        "weekly_goal": 150
    }
    
    # Test queries
    test_queries = [
        "Did I eat enough protein today?",
        "How much did I exercise today?",
        "How did I sleep last night?",
        "What's my stress level?",
        "What's my wellness score?",
        "What should I do to improve?"
    ]
    
    print("=" * 60)
    print("CampusTitan Agent - Test Queries")
    print("=" * 60)
    
    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        response = agent.process_query(
            query=query,
            user_id="test-user-123",
            user_context=mock_user_context
        )
        print(f"🤖 Answer: {response.answer}")
        print(f"📊 Tool: {response.tool_used} | Confidence: {response.confidence}")
        print("-" * 60)

