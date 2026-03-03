import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import config from './config';

const API_URL = config.BASE_URL;
const TOKEN_KEY = 'fitfusion_auth_token';
const isWeb = Platform.OS === 'web';

// Helper to get auth token
const getToken = async () => {
    if (isWeb) {
        return localStorage.getItem(TOKEN_KEY);
    } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    }
};

// Axios instance with auth header
const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

class Database {
    // User-specific
    async getUsers() { return []; } // Should be admin only route
    async addUser(user) { return null; } // Handled by auth.js register
    async getUserByEmail(email) { return null; } // Handled by auth.js login

    // Food logs
    async getFoodLogs(userId) {
        const res = await api.get('/food');
        return res.data;
    }
    async addFoodLog(log) {
        const res = await api.post('/food', log);
        return res.data;
    }
    async deleteFoodLog(id) {
        const res = await api.delete(`/food/${id}`);
        return res.data;
    }
    async getAllFoodLogs() { return this.getFoodLogs(); }

    // Activities
    async getActivities(userId) {
        const res = await api.get('/activities');
        return res.data;
    }
    async addActivity(activity) {
        const res = await api.post('/activities', activity);
        return res.data;
    }
    async deleteActivity(id) {
        const res = await api.delete(`/activities/${id}`);
        return res.data;
    }
    async getAllActivities() { return this.getActivities(); }

    // Mood logs
    async getMoodLogs(userId) {
        const res = await api.get('/mood');
        return res.data;
    }
    async addMoodLog(log) {
        const res = await api.post('/mood', log);
        return res.data;
    }
    async deleteMoodLog(id) {
        const res = await api.delete(`/mood/${id}`);
        return res.data;
    }
    async getAllMoodLogs() { return this.getMoodLogs(); }

    // Journals
    async getJournals(userId) {
        const res = await api.get('/journals');
        return res.data;
    }
    async addJournal(journal) {
        const res = await api.post('/journals', journal);
        return res.data;
    }
    async updateJournal(id, updates) {
        const res = await api.put(`/journals/${id}`, updates);
        return res.data;
    }
    async deleteJournal(id) {
        const res = await api.delete(`/journals/${id}`);
        return res.data;
    }

    // Environmental data
    async getEnvData() {
        const res = await api.get('/env');
        return res.data;
    }
    async addEnvData(data) {
        const res = await api.post('/env', data);
        return res.data;
    }

    // Wellness circles
    async getWellnessCircles() {
        const res = await api.get('/wellness-circles');
        return res.data;
    }
    async addWellnessCircle(circle) {
        const res = await api.post('/wellness-circles', circle);
        return res.data;
    }
    async joinWellnessCircle(id) {
        const res = await api.post(`/wellness-circles/${id}/join`);
        return res.data;
    }

    // Seeded flag
    async isSeeded() { return true; }
    async markSeeded() { }

    // Clear all data
    async clearAll() { }

    // Campus Analytics
    async getCampusAnalytics() {
        const res = await api.get('/analytics/campus');
        return res.data;
    }
}

export const db = new Database();
export const KEYS = {};
export default db;
