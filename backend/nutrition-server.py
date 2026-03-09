from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'nutrition_score_available': nutrition_score is not None,
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
