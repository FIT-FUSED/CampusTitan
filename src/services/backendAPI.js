import axios from 'axios';
import { Platform } from 'react-native';

class BackendAPI {
  constructor() {
    // Use localhost for web, actual IP for mobile (matches Expo dev server)
    const localIP = process.env.EXPO_PUBLIC_BACKEND_IP || '10.57.218.69';
    this.baseURL = process.env.EXPO_PUBLIC_BACKEND_URL || (Platform.OS === 'web' ? 'http://localhost:5001' : `http://${localIP}:5001`);
  }

  async analyzeNutrition(imageUri, userContext = '') {
    try {
      console.log('Attempting to connect to backend:', this.baseURL);

      // Create FormData for image upload (required for nutrition_score.py)
      const formData = new FormData();

      // Handle different platforms for image URI
      let uri = imageUri;
      if (Platform.OS === 'android' && !uri.startsWith('file://')) {
        uri = `file://${uri}`;
      }

      formData.append('image', {
        uri: uri,
        type: 'image/jpeg',
        name: 'food_image.jpg',
      });

      if (userContext) {
        formData.append('context', userContext);
      }

      console.log('Sending image to backend for nutrition_score.py analysis...');

      // Call the backend API with image upload
      const response = await axios.post(`${this.baseURL}/api/nutrition/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120 second timeout (retries on rate limits can take time)
      });

      console.log('Backend response received:', response.data);

      // Check if the backend returned an error inside 200 or if API errored
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;

    } catch (error) {
      console.error('Backend API error:', error.message);
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to analyze food image');
    }
  }

  getFallbackData(context) {
    // Provide varied fallback data based on context
    const contextLower = context.toLowerCase();

    if (contextLower.includes('rice')) {
      return {
        food_name: 'Cooked White Rice',
        'Caloric Value': 130,
        'Protein( in g)': 2.7,
        'Carbohydrates( in g)': 28,
        'Fat( in g)': 0.3,
        'Dietary Fiber( in g)': 0.4,
        'Nutrition Density': 25.5,
      };
    }

    if (contextLower.includes('roti') || contextLower.includes('chapati')) {
      return {
        food_name: 'Chapati (Roti)',
        'Caloric Value': 85,
        'Protein( in g)': 2.5,
        'Carbohydrates( in g)': 17,
        'Fat( in g)': 0.8,
        'Dietary Fiber( in g)': 2.0,
        'Nutrition Density': 45.2,
      };
    }

    // Default fallback
    return {
      food_name: 'Mixed Meal',
      'Caloric Value': 250,
      'Protein( in g)': 15,
      'Carbohydrates( in g)': 30,
      'Fat( in g)': 10,
      'Dietary Fiber( in g)': 5,
      'Nutrition Density': 65.5,
    };
  }

  async getHealthSummary(userData) {
    try {
      console.log('Requesting AI health summary from:', this.baseURL);

      // Step 1: Start the job (returns immediately with a jobId)
      const startResponse = await axios.post(
        `${this.baseURL}/api/health-summary`,
        userData,
        { timeout: 30000 }  // 30s to start (should be instant, but server might be busy)
      );
      const { jobId } = startResponse.data;
      if (!jobId) {
        throw new Error('Backend did not return a job ID');
      }
      console.log('Health summary job started:', jobId);

      // Step 2: Poll until result is ready (every 5s, max 10 min)
      const maxAttempts = 120; // 120 * 5s = 10 min (allowing for slow local LLaMA)
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5s

        try {
          console.log(`Polling health summary... (attempt ${attempt}/${maxAttempts})`);
          const pollResponse = await axios.get(
            `${this.baseURL}/api/health-summary/${jobId}`,
            { timeout: 25000 } // Increased timeout for poll
          );

          if (pollResponse.data.status === 'done') {
            console.log('Health summary received!');
            return pollResponse.data;
          }

          if (pollResponse.data.status === 'error') {
            throw new Error(pollResponse.data.error || 'AI pipeline failed');
          }

          // status === 'processing' → continue polling
        } catch (pollError) {
          // If it's a network error during polling, don't give up yet
          // The server might be 100% busy with LLaMA inference
          if (pollError.message.includes('Network Error') || pollError.code === 'ECONNABORTED' || pollError.response?.status === 503) {
            console.warn(`Poll attempt ${attempt} failed (server busy?), retrying...`);
            continue;
          }
          throw pollError; // Rethrow other errors (e.g., AI pipeline errors)
        }
      }

      throw new Error('Health summary timed out after 10 minutes. Please check your local LLaMA model.');
    } catch (error) {
      console.error('Health summary error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to get health summary');
    }
  }
}

export default new BackendAPI();
