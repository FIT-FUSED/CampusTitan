import { supabase } from './supabase';
import axios from 'axios';
import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class Database {
    // User-specific
    async getUsers() {
        const { data, error } = await supabase.from('users').select('*');
        if (error) { console.error(error); return []; }
        return data;
    }
    async addUser(user) { return null; } // Handled by auth.js register
    async getUserByEmail(email) {
        const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error) return null;
        return data;
    }

    // Wellness Model Data
    async saveWellnessData(userId, dataDict) {
        const insertObj = {
            user_id: userId,
            ...dataDict
        };
        const { data, error } = await supabase.from('user_wellness_data').insert([insertObj]).select().single();
        if (error) {
            console.error('saveWellnessData error:', error);
            throw error;
        }
        return data;
    }

    async predictWellness(metrics) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const url = `${config.BASE_URL}/wellness/predict`;
            console.log('>>> predictWellness URL:', url);
            console.log('>>> Session exists:', !!session);
            console.log('>>> Token preview:', session?.access_token ? session.access_token.slice(0, 30) + '...' : 'none');
            console.log('>>> Metrics keys:', Object.keys(metrics));
            const response = await axios.post(url, metrics, {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });
            console.log('>>> predictWellness response status:', response.status);
            return response.data;
        } catch (error) {
            console.error('>>> predictWellness error:', error.response?.data || error.message);
            console.error('>>> Full axios error:', error);
            throw error;
        }
    }

    // Food logs
    async getFoodLogs(userId) {
        // userId parameter might not be strictly needed if using RLS, but passing it for the query
        const { data, error } = await supabase.from('food_logs').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (error) { console.error(error); return []; }
        // Supabase returns dates as strings, let's format if needed, but for now just return
        return data.map(log => ({ ...log, mealType: log.meal_type, foodName: log.food_name, isVeg: log.is_veg }));
    }

    async addFoodLog(log) {
        const insertLog = {
            ...log,
            user_id: log.userId,
            meal_type: log.mealType,
            food_name: log.foodName,
            is_veg: log.isVeg
        };
        delete insertLog.userId;
        delete insertLog.mealType;
        delete insertLog.foodName;
        delete insertLog.isVeg;
        delete insertLog.id; // Supabase generates ID

        const { data, error } = await supabase.from('food_logs').insert([insertLog]).select().single();
        if (error) { console.error(error); throw error; }
        return { ...data, mealType: data.meal_type, foodName: data.food_name, isVeg: data.is_veg };
    }

    async deleteFoodLog(id) {
        const { error } = await supabase.from('food_logs').delete().eq('id', id);
        if (error) { console.error(error); throw error; }
        return { message: 'Deleted' };
    }
    async getAllFoodLogs() {
        const { data: { user } } = await supabase.auth.getUser();
        return this.getFoodLogs(user?.id);
    }

    // Activities
    async getActivities(userId) {
        const { data, error } = await supabase.from('activities').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (error) { console.error(error); return []; }
        return data.map(act => ({ ...act, caloriesBurned: act.calories_burned }));
    }

    async addActivity(activity) {
        const insertAct = {
            ...activity,
            user_id: activity.userId,
            calories_burned: activity.caloriesBurned
        };
        delete insertAct.userId;
        delete insertAct.caloriesBurned;
        delete insertAct.id;

        const { data, error } = await supabase.from('activities').insert([insertAct]).select().single();
        if (error) { console.error(error); throw error; }
        return { ...data, caloriesBurned: data.calories_burned };
    }

    async deleteActivity(id) {
        const { error } = await supabase.from('activities').delete().eq('id', id);
        if (error) { console.error(error); throw error; }
        return { message: 'Deleted' };
    }

    async getAllActivities() {
        const { data: { user } } = await supabase.auth.getUser();
        return this.getActivities(user?.id);
    }

    // Mood logs
    async getMoodLogs(userId) {
        const { data, error } = await supabase.from('mood_logs').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (error) { console.error(error); return []; }
        return data;
    }

    async addMoodLog(log) {
        const insertLog = { ...log, user_id: log.userId };
        delete insertLog.userId;
        delete insertLog.id;

        const { data, error } = await supabase.from('mood_logs').insert([insertLog]).select().single();
        if (error) { console.error(error); throw error; }
        return data;
    }

    async deleteMoodLog(id) {
        const { error } = await supabase.from('mood_logs').delete().eq('id', id);
        if (error) { console.error(error); throw error; }
        return { message: 'Deleted' };
    }

    async getAllMoodLogs() {
        const { data: { user } } = await supabase.auth.getUser();
        return this.getMoodLogs(user?.id);
    }

    // Journals
    async getJournals(userId) {
        const { data, error } = await supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (error) { console.error(error); return []; }
        return data;
    }

    async addJournal(journal) {
        const insertJ = { ...journal, user_id: journal.userId };
        delete insertJ.userId;
        delete insertJ.id;

        const { data, error } = await supabase.from('journals').insert([insertJ]).select().single();
        if (error) { console.error(error); throw error; }
        return data;
    }

    async updateJournal(id, updates) {
        const { data, error } = await supabase.from('journals').update(updates).eq('id', id).select().single();
        if (error) { console.error(error); throw error; }
        return data;
    }

    async deleteJournal(id) {
        const { error } = await supabase.from('journals').delete().eq('id', id);
        if (error) { console.error(error); throw error; }
        return { message: 'Deleted' };
    }

    // Environmental data
    async getEnvData() {
        // Will rely on the old seeded logic as Supabase mapping for env might be overkill
        // If needed in the future, can create table
        return [];
    }
    async addEnvData(data) {
        return null;
    }

    // Wellness circles
    async getWellnessCircles() {
        const { data, error } = await supabase.from('wellness_circles').select('*');
        if (error) { console.error(error); return []; }
        return data.map(wc => ({ ...wc, maxParticipants: wc.max_participants }));
    }

    async addWellnessCircle(circle) {
        const insertC = { ...circle, max_participants: circle.maxParticipants, created_by: circle.createdBy };
        delete insertC.maxParticipants;
        delete insertC.createdBy;
        delete insertC.id;

        const { data, error } = await supabase.from('wellness_circles').insert([insertC]).select().single();
        if (error) { console.error(error); throw error; }
        return { ...data, maxParticipants: data.max_participants };
    }

    async joinWellnessCircle(id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const { data, error } = await supabase.from('circle_participants').insert([{
            circle_id: id,
            user_id: user.id
        }]);

        if (error) { console.error(error); throw error; }
        return { message: "Joined successfully" };
    }

    // Seeded flag
    async isSeeded() { return true; }
    async markSeeded() { }

    // Clear all data
    async clearAll() { }

    // Campus Analytics
    async getCampusAnalytics() {
        return null;
    }

    // College Leaderboard
    async getLeaderboard(college) {
        if (!college) return [];
        try {
            // Fetch all users from the same college
            const { data: users, error } = await supabase
                .from('users')
                .select('id, name, college, height, weight, age, gender')
                .eq('college', college);

            if (error || !users) {
                console.error('Leaderboard fetch error:', error);
                return [];
            }

            // For each user, compute a health score
            const scored = await Promise.all(users.map(async (u) => {
                let score = 0;

                // 1. Activity score (up to 40 pts)
                try {
                    const acts = await this.getActivities(u.id);
                    const totalMinutes = acts.reduce((sum, a) => sum + (a.duration || 0), 0);
                    const activeDays = new Set(acts.map(a => a.date)).size;
                    score += Math.min(totalMinutes / 10, 25); // up to 25 pts for total minutes
                    score += Math.min(activeDays * 3, 15); // up to 15 pts for consistency
                    u.activeDays = activeDays;
                } catch (e) {
                    u.activeDays = 0;
                }

                // 2. Food logging score (up to 25 pts)
                try {
                    const foods = await this.getFoodLogs(u.id);
                    const loggedDays = new Set(foods.map(f => f.date)).size;
                    score += Math.min(loggedDays * 2, 25);
                } catch (e) { }

                // 3. Mood tracking score (up to 15 pts)
                try {
                    const moods = await this.getMoodLogs(u.id);
                    const moodDays = new Set(moods.map(m => m.date)).size;
                    score += Math.min(moodDays * 2, 15);
                } catch (e) { }

                // 4. BMI score (up to 20 pts) - closer to healthy range = more points
                if (u.weight && u.height) {
                    const bmi = u.weight / ((u.height / 100) ** 2);
                    u.bmi = bmi.toFixed(1);
                    if (bmi >= 18.5 && bmi < 25) score += 20; // Normal
                    else if (bmi >= 16 && bmi < 18.5) score += 12; // Underweight
                    else if (bmi >= 25 && bmi < 30) score += 10; // Overweight
                    else score += 5; // Obese or severely underweight
                } else {
                    u.bmi = null;
                }

                return { ...u, healthScore: Math.round(score) };
            }));

            // Sort by health score descending
            scored.sort((a, b) => b.healthScore - a.healthScore);
            return scored;
        } catch (e) {
            console.error('Leaderboard error:', e);
            return [];
        }
    }

    // Daily Wellness Logs (Local Storage)
    async getDailyWellnessLog(date) {
        try {
            const logs = await AsyncStorage.getItem('@daily_wellness_logs');
            if (!logs) return null;
            const parsed = JSON.parse(logs);
            return parsed.find(l => l.date === date);
        } catch (e) {
            console.error('getDailyWellnessLog error:', e);
            return null;
        }
    }

    async saveDailyWellnessLog(log) {
        try {
            const logsStr = await AsyncStorage.getItem('@daily_wellness_logs');
            let logs = logsStr ? JSON.parse(logsStr) : [];
            // Update existing or add new
            const existingIndex = logs.findIndex(l => l.date === log.date);
            if (existingIndex >= 0) {
                logs[existingIndex] = { ...logs[existingIndex], ...log };
            } else {
                logs.push(log);
            }
            await AsyncStorage.setItem('@daily_wellness_logs', JSON.stringify(logs));
            return log;
        } catch (e) {
            console.error('saveDailyWellnessLog error:', e);
            throw e;
        }
    }

    async getWellnessHistory(days = 7) {
        try {
            const logsStr = await AsyncStorage.getItem('@daily_wellness_logs');
            if (!logsStr) return [];
            const logs = JSON.parse(logsStr);
            // Sort by date descending
            logs.sort((a, b) => new Date(b.date) - new Date(a.date));
            return logs.slice(0, days);
        } catch (e) {
            console.error('getWellnessHistory error:', e);
            return [];
        }
    }
}

export const db = new Database();
export const KEYS = {};
export default db;
