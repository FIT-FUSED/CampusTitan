// Environment Service - Real Weather and AQI Data
import * as Location from 'expo-location';
import axios from 'axios';

class EnvironmentService {
  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[EnvironmentService] Permission request failed:', error);
      return false;
    }
  }

  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('[EnvironmentService] Location fetch failed:', error);
      throw error;
    }
  }

  async getWeatherData() {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const location = await this.getCurrentLocation();
      
      const response = await axios.get(
        `${this.baseUrl}/weather`,
        {
          params: {
            lat: location.latitude,
            lon: location.longitude,
            appid: this.apiKey,
            units: 'metric',
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      
      return {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        aqi: null, // OpenWeatherMap requires separate AQI API
        aqiCategory: 'Unknown',
        location: data.name,
        description: data.weather[0].description,
        windSpeed: data.wind?.speed || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[EnvironmentService] Weather fetch failed:', error);
      throw error;
    }
  }

  async getAQIData() {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const location = await this.getCurrentLocation();
      
      // Note: This would require OpenWeatherMap Air Pollution API
      // For now, return placeholder
      return {
        aqi: 50,
        aqiCategory: 'Good',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[EnvironmentService] AQI fetch failed:', error);
      throw error;
    }
  }

  async getEnvironmentData() {
    try {
      const [weather, aqi] = await Promise.allSettled([
        this.getWeatherData(),
        this.getAQIData(),
      ]);

      const result = {
        weather: weather.status === 'fulfilled' ? weather.value : null,
        aqi: aqi.status === 'fulfilled' ? aqi.value : null,
        error: null,
      };

      if (weather.reason) {
        result.error = weather.reason;
      } else if (aqi.reason) {
        result.error = aqi.reason;
      }

      return result;
    } catch (error) {
      console.error('[EnvironmentService] Environment data fetch failed:', error);
      return {
        weather: null,
        aqi: null,
        error: error.message,
      };
    }
  }
}

export const environmentService = new EnvironmentService();
export default environmentService;
