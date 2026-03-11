// Auth Context for state management
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';
import db from '../services/database';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [roleOverride, setRoleOverride] = useState(null);
    const [userBadges, setUserBadges] = useState([]);

    useEffect(() => {
        checkAuth();
    }, []);

    // Load badges when user logs in
    const loadUserBadges = async (userId) => {
        try {
            const badgeIds = await db.getUserBadgeIds(userId);
            setUserBadges(badgeIds);
            console.log('📜 Loaded', badgeIds.length, 'badges for user on login');
        } catch (err) {
            console.error('Error loading user badges:', err);
        }
    };

    async function checkAuth() {
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setIsOnboarded(true);
                // Load persisted badges
                await loadUserBadges(currentUser.id);
            }
        } catch (e) {
            console.error('Auth check error:', e);
        }
        setLoading(false);
    }

    async function login(email, password) {
        const result = await authService.login(email, password);
        const userWithMeta = await authService.getCurrentUser();
        setUser(userWithMeta);
        setIsOnboarded(true);
        // Load persisted badges on login
        await loadUserBadges(userWithMeta.id);
        return result;
    }

    async function register(userData) {
        const result = await authService.register(userData);
        const userWithMeta = await authService.getCurrentUser();
        setUser(userWithMeta);
        setIsOnboarded(true);
        // Load persisted badges on register (should be empty for new users)
        await loadUserBadges(userWithMeta.id);
        return result;
    }

    async function logout() {
        try {
            await authService.logout();
        } finally {
            setUser(null);
            setUserBadges([]); // Clear badges on logout
            // We keep isOnboarded as true so they see Login not Onboarding
        }
    }

    async function updateProfile(updates) {
        if (!user) return;
        const updated = await authService.updateProfile(user.id, updates);
        setUser(updated);
        return updated;
    }

    // Function to refresh badges (can be called after earning a new badge)
    const refreshBadges = async () => {
        if (user) {
            await loadUserBadges(user.id);
        }
    };

    const userRole = roleOverride || (user?.role === 'admin' ? 'admin' : 'student');

    function setUserRoleOverride(nextRole) {
        // This does not mutate the persisted Supabase role – it only affects
        // in-app navigation for demo "God Mode" switches.
        if (nextRole === 'admin' || nextRole === 'student' || nextRole === null) {
            setRoleOverride(nextRole);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isOnboarded,
            setIsOnboarded,
            login,
            register,
            logout,
            updateProfile,
            userRole,
            setUserRoleOverride,
            isAdmin: userRole === 'admin',
            userBadges,
            refreshBadges,
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

