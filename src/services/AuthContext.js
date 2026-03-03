// Auth Context for state management
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';
import db from '../services/database';
import {
    SAMPLE_USERS, generateFoodLogs, generateActivities,
    generateMoodLogs, generateJournals, generateEnvData, WELLNESS_CIRCLES,
} from '../data/seedData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setIsOnboarded(true);
            }
        } catch (e) {
            console.error('Auth check error:', e);
        }
        setLoading(false);
    }

    async function login(email, password) {
        const result = await authService.login(email, password);
        setUser(result.user);
        setIsOnboarded(true);
        return result;
    }

    async function register(userData) {
        const result = await authService.register(userData);
        setUser(result.user);
        setIsOnboarded(true);
        return result;
    }

    async function logout() {
        await authService.logout();
        setUser(null);
    }

    async function updateProfile(updates) {
        if (!user) return;
        const updated = await authService.updateProfile(user.id, updates);
        setUser(updated);
        return updated;
    }

    return (
        <AuthContext.Provider value={{
            user, loading, isOnboarded, setIsOnboarded,
            login, register, logout, updateProfile,
            isAdmin: authService.isAdmin(user),
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

export default AuthContext;
