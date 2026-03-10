import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// For physical device testing, use your laptop's local IP address
// You can find this by running 'ipconfig getifaddr en0' on Mac
const LOCAL_IP = '10.120.198.163';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_NUTRITION_API_URL ||
  (Platform.OS === 'web' ? 'http://localhost:5001' : `http://${LOCAL_IP}:5001`);

class BackendAPI {
  constructor() {
    this.baseURL = BACKEND_URL;
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async analyzeFoodImage(imageUri, context = '') {
    try {
      console.log('[BackendAPI] Analyzing food image:', imageUri);
      
      // Create form data
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'food_image.jpg',
      });
      if (context) {
        formData.append('context', context);
      }

      const response = await this.axios.post('/api/nutrition/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[BackendAPI] Analysis result:', response.data);
      return response.data;
    } catch (error) {
      console.error('[BackendAPI] Error analyzing food:', error);
      if (error.response) {
        console.error('[BackendAPI] Server response:', error.response.data);
        throw new Error(error.response.data.error || 'Server error');
      } else if (error.request) {
        throw new Error('No response from server. Check if backend is running.');
      } else {
        throw new Error('Request setup error: ' + error.message);
      }
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/health`);
      return response.data;
    } catch (error) {
      console.error('[BackendAPI] Connection test failed:', error);
      throw error;
    }
  }
}

export default new BackendAPI();
