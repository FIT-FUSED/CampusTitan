import { supabase } from './supabase';

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
        // Could be a complex SQL query via Supabase RPC, but for now we'll fetch basic data if required
        // We can just keep using the generated seed data for dummy analytics if preferred.
        return null;
    }
}

export const db = new Database();
export const KEYS = {};
export default db;
