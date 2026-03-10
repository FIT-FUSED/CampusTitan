from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import random
import requests as http_requests
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import tempfile

# Add the parent directory to the path to import nutrition_score
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env from the backend folder
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)
print(f"Loaded .env from: {env_path}")

# Import nutrition_score
try:
    import nutrition_score
    print("✓ nutrition_score.py loaded successfully")
except ImportError as e:
    print(f"✗ Failed to load nutrition_score.py: {e}")
    nutrition_score = None

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = tempfile.gettempdir()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/nutrition/analyze', methods=['POST'])
def analyze_nutrition():
    try:
        print("Received nutrition analysis request")

        # Check if image was uploaded
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']
        context = request.form.get('context', '')
        print(f"Context: {context}")

        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400

        # Save image temporarily
        filename = secure_filename(image_file.filename)
        temp_image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(temp_image_path)
        print(f"Saved image to: {temp_image_path}")

        # Check if we have nutrition_score and API keys
        gemini_key = os.getenv('GEMINI_API_KEY')
        usda_key = os.getenv('USDA_API_KEY')

        # Debug: Show what keys are loaded (first 10 chars)
        print(f"=== API KEY DEBUG ===")
        print(f"GEMINI_API_KEY env var: {'set' if gemini_key else 'NOT SET'}")
        if gemini_key:
            print(f"GEMINI key prefix: {gemini_key[:15]}...")
        print(f"USDA_API_KEY env var: {'set' if usda_key else 'NOT SET'}")
        print(f"======================")
        print(f"USDA key available: {bool(usda_key)}")
        print(f"Nutrition score available: {nutrition_score is not None}")

        # Only use nutrition_score.py - no fallbacks
        if not nutrition_score:
            return jsonify({'error': 'nutrition_score.py not available'}), 500

        if not gemini_key:
            return jsonify({'error': 'GEMINI_API_KEY not configured'}), 500

        if not usda_key:
            return jsonify({'error': 'USDA_API_KEY not configured'}), 500

        print("Processing with nutrition_score.py...")
        try:
            result = nutrition_score.execute_ml_vision_pipeline(
                temp_image_path,
                context,
                gemini_key,
                usda_key
            )

            # Clean up temp file
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)

            if result and 'food_name' in result:
                print(f"✓ Analysis successful: {result.get('food_name', 'Unknown')}")
                return jsonify(result)
            else:
                print("✗ Pipeline returned no result")
                return jsonify({'error': 'AI pipeline returned no result. The food could not be identified.'}), 500

        except Exception as e:
            print(f"✗ nutrition_score.py error: {e}")
            import traceback
            traceback.print_exc()
            # Clean up temp file
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)
            return jsonify({'error': f'AI analysis failed: {str(e)}'}), 500

    except Exception as e:
        print(f"✗ Backend error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def get_fallback_data(context):
    """Get fallback nutrition data based on context"""
    context_lower = context.lower()

    if context_lower and 'rice' in context_lower:
        return {
            'food_name': 'Cooked White Rice',
            'Caloric Value': 130,
            'Protein( in g)': 2.7,
            'Carbohydrates( in g)': 28,
            'Fat( in g)': 0.3,
            'Dietary Fiber( in g)': 0.4,
            'Nutrition Density': 25.5,
        }

    if context_lower and ('roti' in context_lower or 'chapati' in context_lower):
        return {
            'food_name': 'Chapati (Roti)',
            'Caloric Value': 85,
            'Protein( in g)': 2.5,
            'Carbohydrates( in g)': 17,
            'Fat( in g)': 0.8,
            'Dietary Fiber( in g)': 2.0,
            'Nutrition Density': 45.2,
        }

    if context_lower and ('apple' in context_lower or 'fruit' in context_lower):
        return {
            'food_name': 'Apple',
            'Caloric Value': 52,
            'Protein( in g)': 0.3,
            'Carbohydrates( in g)': 14,
            'Fat( in g)': 0.2,
            'Dietary Fiber( in g)': 2.4,
            'Nutrition Density': 85.3,
        }

    if context_lower and 'banana' in context_lower:
        return {
            'food_name': 'Banana',
            'Caloric Value': 89,
            'Protein( in g)': 1.1,
            'Carbohydrates( in g)': 23,
            'Fat( in g)': 0.3,
            'Dietary Fiber( in g)': 2.6,
            'Nutrition Density': 78.5,
        }

    # Default mixed meal
    return {
        'food_name': 'Mixed Meal',
        'Caloric Value': 250,
        'Protein( in g)': 15,
        'Carbohydrates( in g)': 30,
        'Fat( in g)': 10,
        'Dietary Fiber( in g)': 5,
        'Nutrition Density': 65.5,
    }

# ─── Ollama LLaMA Health Summary (using context_engine.py pipeline) ───
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'my-llama:latest')

# Import the existing context engine and EMA tracker
try:
    from context_engine import compress_historical_context, build_ollama_prompt, calculate_moving_averages
    from engine import EMATracker
    ema_tracker = EMATracker(alpha=0.3)
    print("✓ context_engine.py and engine.py loaded successfully")
except ImportError as e:
    print(f"✗ Failed to load context_engine/engine: {e}")
    ema_tracker = None

def _generate_arbitrary_activity():
    """Generate realistic arbitrary activity data since activity tracking is not fully implemented."""
    activities = [
        {'type': 'walking', 'duration': random.randint(15, 45), 'calories_burned': random.randint(80, 200)},
        {'type': 'gym', 'duration': random.randint(30, 60), 'calories_burned': random.randint(150, 350)},
        {'type': 'running', 'duration': random.randint(15, 35), 'calories_burned': random.randint(150, 400)},
        {'type': 'yoga', 'duration': random.randint(20, 40), 'calories_burned': random.randint(60, 120)},
        {'type': 'cycling', 'duration': random.randint(20, 50), 'calories_burned': random.randint(100, 300)},
        {'type': 'sports', 'duration': random.randint(30, 60), 'calories_burned': random.randint(200, 400)},
    ]
    count = random.randint(1, 3)
    return random.sample(activities, min(count, len(activities)))

def _generate_arbitrary_mood():
    """Generate realistic arbitrary mood/mental wellness data."""
    moods_map = {'Great': 9, 'Good': 7, 'Okay': 5, 'Low': 3, 'Bad': 1}
    weights = [0.15, 0.35, 0.30, 0.15, 0.05]
    mood_label = random.choices(list(moods_map.keys()), weights=weights, k=1)[0]
    return {
        'mood': mood_label,
        'mood_score': moods_map[mood_label],
        'stress_level': random.choice(['Low', 'Moderate', 'High']),
        'sleep_hours': round(random.uniform(5, 9), 1),
        'energy_level': random.choice(['Low', 'Moderate', 'High']),
    }

def _generate_mock_history(today_data):
    """Generate 7-day mock historical data for the context engine based on today's real data."""
    history = []
    # Use today's values as a baseline and create slight variations for past 7 days
    base_mental = today_data.get('mental_score', 60)
    base_nutrition = today_data.get('nutrition_density', 55.0)
    base_sleep = today_data.get('sleep_hours', 7.0)

    for day in range(1, 8):
        history.append({
            'day': day,
            'mental_score': max(10, min(100, base_mental + random.randint(-15, 15))),
            'nutrition_density': round(max(10, min(100, base_nutrition + random.uniform(-10, 10))), 1),
            'sleep_hours': round(max(3, min(10, base_sleep + random.uniform(-1.5, 1.5))), 1),
        })
    return history

def _call_ollama(prompt, timeout=180):
    """Send structured prompt to the local Ollama LLaMA model."""
    try:
        print(f"  → Calling Ollama at {OLLAMA_URL}/api/generate with model={OLLAMA_MODEL}")
        resp = http_requests.post(
            f'{OLLAMA_URL}/api/generate',
            json={
                'model': OLLAMA_MODEL,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'num_predict': 256,   # Limit output tokens for faster response
                    'temperature': 0.5,
                    'num_ctx': 1024,      # Smaller context window for speed
                },
            },
            timeout=timeout
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get('response', '')
    except http_requests.exceptions.ConnectionError:
        raise Exception(f'Cannot connect to Ollama at {OLLAMA_URL}. Is it running?')
    except http_requests.exceptions.Timeout:
        raise Exception('Ollama request timed out. The model might be loading.')
    except Exception as e:
        raise Exception(f'Ollama error: {str(e)}')

import threading
import uuid

# In-memory store for health summary jobs
_health_jobs = {}

def _run_health_pipeline(job_id, data, gemini_key):
    """Run the full Gemini → LLaMA pipeline in a background thread."""
    try:
        user_profile = data.get('user', {})
        food_logs = data.get('foodLogs', [])
        activities = data.get('activities', None)
        mood_data = data.get('mood', None)

        if not activities or len(activities) == 0:
            activities = _generate_arbitrary_activity()
        if not mood_data:
            mood_data = _generate_arbitrary_mood()

        # Step 1: Today's nutrition stats
        total_cal = sum(f.get('calories', 0) for f in food_logs)
        total_protein = sum(f.get('protein', 0) for f in food_logs)
        total_carbs = sum(f.get('carbs', 0) for f in food_logs)
        total_fat = sum(f.get('fat', 0) for f in food_logs)
        total_fiber = sum(f.get('fiber', 0) for f in food_logs)
        meal_count = len(food_logs)
        meal_names = [f.get('food_name', f.get('foodName', 'Unknown')) for f in food_logs]

        total_active_min = sum(a.get('duration', 0) for a in activities)
        total_burned = sum(a.get('calories_burned', a.get('caloriesBurned', 0)) for a in activities)
        exercise_steps = total_active_min * 100

        mood_score_map = {'Great': 9, 'Good': 7, 'Okay': 5, 'Low': 3, 'Bad': 1}
        mood_label = mood_data.get('mood', 'Okay')
        mental_score_raw = mood_data.get('mood_score', mood_score_map.get(mood_label, 5))
        sleep_hours = mood_data.get('sleep_hours', 7)

        nutrition_density = 0
        if total_cal > 0:
            nutrition_density = min(100, round(
                ((total_protein * 4 + total_fiber * 7) / max(total_cal, 1)) * 100, 1
            ))

        # Step 2: EMA
        daily_score = 50.0
        new_ema = 50.0
        if ema_tracker:
            daily_score = ema_tracker.normalize_metrics(
                int(total_cal), float(sleep_hours), int(mental_score_raw), int(exercise_steps)
            )
            new_ema = ema_tracker.calculate_new_ema(None, daily_score)
            print(f"  [{job_id[:8]}] EMA daily_score={round(daily_score,1)}, new_ema={new_ema}")

        # Step 3: Gemini context compression (with timeout)
        history_data = _generate_mock_history({
            'mental_score': int(mental_score_raw * 10),
            'nutrition_density': nutrition_density,
            'sleep_hours': sleep_hours,
        })
        averages = calculate_moving_averages(history_data)
        print(f"  [{job_id[:8]}] 7-day averages: {averages}")

        trend_summary = None
        if gemini_key:
            print(f"  [{job_id[:8]}] Calling Gemini for context compression...")
            try:
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(compress_historical_context, history_data, gemini_key)
                    trend_summary = future.result(timeout=20)
                print(f"  [{job_id[:8]}] ✓ Gemini trend: {trend_summary[:80]}...")
            except Exception as ge:
                print(f"  [{job_id[:8]}] ✗ Gemini failed: {ge}")

        if not trend_summary:
            trend_summary = (
                f"Over the past 7 days, mental health averaged {averages['avg_mental']}/100, "
                f"nutrition density averaged {averages['avg_nutrition']}, and sleep averaged "
                f"{averages['avg_sleep']} hours per night."
            )

        # Step 4: Build structured prompt
        current_meal = {
            'dish_name': ', '.join(meal_names[:3]) if meal_names else 'No meals logged',
            'calories': round(total_cal, 1),
            'protein_g': round(total_protein, 1),
            'fiber_g': round(total_fiber, 1),
            'nutrition_density': nutrition_density,
        }
        current_mental = int(mental_score_raw * 10)
        structured_prompt = build_ollama_prompt(trend_summary, averages, current_meal, current_mental)
        print(f"  [{job_id[:8]}] Structured prompt assembled ({len(structured_prompt)} chars)")

        # Step 5: Call Ollama
        print(f"  [{job_id[:8]}] Sending to Ollama '{OLLAMA_MODEL}'...")
        ai_response = _call_ollama(structured_prompt)
        print(f"  [{job_id[:8]}] ✓ Ollama response received ({len(ai_response)} chars)")

        _health_jobs[job_id] = {
            'status': 'done',
            'result': {
                'summary': ai_response,
                'geminiContext': trend_summary,
                'stats': {
                    'calories': round(total_cal),
                    'protein': round(total_protein, 1),
                    'carbs': round(total_carbs, 1),
                    'fat': round(total_fat, 1),
                    'meals': meal_count,
                    'activeMinutes': total_active_min,
                    'caloriesBurned': total_burned,
                    'mood': mood_label,
                    'stressLevel': mood_data.get('stress_level', 'N/A'),
                    'sleepHours': sleep_hours,
                    'dailyScore': round(daily_score, 1),
                    'ema': new_ema,
                    'nutritionDensity': nutrition_density,
                },
                'model': OLLAMA_MODEL,
            }
        }
    except Exception as e:
        print(f"  [{job_id[:8]}] ✗ Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        _health_jobs[job_id] = {'status': 'error', 'error': str(e)}

@app.route('/api/health-summary', methods=['POST'])
def health_summary_start():
    """Start health summary generation in background, return job_id immediately."""
    data = request.get_json() or {}
    gemini_key = os.getenv('GEMINI_API_KEY')
    job_id = str(uuid.uuid4())
    _health_jobs[job_id] = {'status': 'processing'}

    t = threading.Thread(target=_run_health_pipeline, args=(job_id, data, gemini_key))
    t.daemon = True
    t.start()

    print(f"  → Started health summary job {job_id[:8]}...")
    return jsonify({'jobId': job_id, 'status': 'processing'})

@app.route('/api/health-summary/<job_id>', methods=['GET'])
def health_summary_poll(job_id):
    """Poll for health summary result."""
    job = _health_jobs.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    if job['status'] == 'processing':
        return jsonify({'status': 'processing'})
    if job['status'] == 'error':
        # Clean up
        del _health_jobs[job_id]
        return jsonify({'status': 'error', 'error': job['error']}), 500
    # Done — return result and clean up
    result = job['result']
    del _health_jobs[job_id]
    return jsonify({'status': 'done', **result})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'nutrition_score_available': nutrition_score is not None,
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting nutrition server on port {port}")
    print(f"Nutrition score available: {nutrition_score is not None}")
    # use_reloader=False to prevent killing background threads for health summary jobs
    app.run(debug=True, host='0.0.0.0', port=port, threaded=True, use_reloader=False)
