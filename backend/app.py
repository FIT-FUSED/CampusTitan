from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import subprocess
import json
from dotenv import load_dotenv

# Add the parent directory to the path to import nutrition_score
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import nutrition_score
try:
    import nutrition_score
    load_dotenv()
except ImportError:
    print("Warning: nutrition_score not available")
    nutrition_score = None

app = Flask(__name__)
CORS(app)

@app.route('/api/nutrition/analyze', methods=['POST'])
def analyze_nutrition():
    try:
        # Get the image file and context from the request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        image_file = request.files['image']
        context = request.form.get('context', '')
        
        # Save the image temporarily
        temp_image_path = 'temp_food_image.jpg'
        image_file.save(temp_image_path)
        
        # Use the actual nutrition_score.py if available
        if nutrition_score and os.getenv('GEMINI_API_KEY') and os.getenv('USDA_API_KEY'):
            print("Using real nutrition analysis...")
            result = nutrition_score.execute_ml_vision_pipeline(
                temp_image_path, 
                context,
                os.getenv('GEMINI_API_KEY'),
                os.getenv('USDA_API_KEY')
            )
            
            if result:
                # Clean up temp file
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                return jsonify(result)
        
        # Fallback to mock data with some variation based on context
        print("Using mock nutrition data...")
        mock_data_variations = {
            'rice': {
                'food_name': 'Cooked White Rice',
                'Caloric Value': 130,
                'Protein( in g)': 2.7,
                'Carbohydrates( in g)': 28,
                'Fat( in g)': 0.3,
                'Dietary Fiber( in g)': 0.4,
                'Nutrition Density': 25.5,
            },
            'roti': {
                'food_name': 'Chapati (Roti)',
                'Caloric Value': 85,
                'Protein( in g)': 2.5,
                'Carbohydrates( in g)': 17,
                'Fat( in g)': 0.8,
                'Dietary Fiber( in g)': 2.0,
                'Nutrition Density': 45.2,
            },
            'default': {
                'food_name': 'Mixed Meal',
                'Caloric Value': 250,
                'Protein( in g)': 15,
                'Carbohydrates( in g)': 30,
                'Fat( in g)': 10,
                'Dietary Fiber( in g)': 5,
                'Nutrition Density': 65.5,
            }
        }
        
        # Select mock data based on context
        context_lower = context.lower()
        selected_data = mock_data_variations['default']
        
        for key in mock_data_variations:
            if key in context_lower:
                selected_data = mock_data_variations[key]
                break
        
        # Clean up temp file
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
            
        return jsonify(selected_data)
        
    except Exception as e:
        print(f"Error in nutrition analysis: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
