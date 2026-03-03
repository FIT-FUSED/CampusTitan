import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import config from './config';

const TOKEN_KEY = 'fitfusion_auth_token';
const USER_KEY = 'fitfusion_user_id';
const API_URL = config.AUTH_URL;

const isWeb = Platform.OS === 'web';

const storage = {
    setItem: async (key, value) => {
        if (isWeb) {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    getItem: async (key) => {
        if (isWeb) {
            return localStorage.getItem(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },
    deleteItem: async (key) => {
        if (isWeb) {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};

class AuthService {
    async register(userData) {
        try {
            const response = await axios.post(`${API_URL}/register`, userData);
            const { token, ...user } = response.data;
            await storage.setItem(TOKEN_KEY, token);
            await storage.setItem(USER_KEY, user._id);
            return { user, token };
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    async login(email, password) {
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            const { token, ...user } = response.data;
            await storage.setItem(TOKEN_KEY, token);
            await storage.setItem(USER_KEY, user._id);
            return { user, token };
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    async logout() {
        await storage.deleteItem(TOKEN_KEY);
        await storage.deleteItem(USER_KEY);
    }

    async getCurrentUser() {
        try {
            const token = await storage.getItem(TOKEN_KEY);
            if (!token) return null;

            const response = await axios.get(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            return null;
        }
    }

    async isAuthenticated() {
        const token = await storage.getItem(TOKEN_KEY);
        return !!token;
    }

    async updateProfile(userId, updates) {
        // Will be implemented when user routes are robust
        return null;
    }

    isAdmin(user) {
        return user?.role === 'admin';
    }
}

export const authService = new AuthService();
export default authService;
