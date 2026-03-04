import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

const isWeb = Platform.OS === 'web';

class AuthService {
    async register(userData) {
        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        name: userData.name,
                        college: userData.college,
                        age: userData.age,
                        height: userData.height,
                        weight: userData.weight,
                        gender: userData.gender
                    }
                }
            });

            if (authError) throw authError;

            // 2. Create user profile in 'users' table linking to auth.users.id
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([
                        {
                            id: authData.user.id,
                            email: userData.email,
                            name: userData.name,
                            college: userData.college,
                            age: userData.age,
                            height: userData.height,
                            weight: userData.weight,
                            gender: userData.gender,
                            role: 'student'
                        }
                    ]);

                if (profileError) {
                    console.error("Profile creation error (safe to ignore if table missing):", profileError);
                }
            }

            return { user: authData.user, session: authData.session };
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    }

    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            return { user: data.user, session: data.session };
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    }

    async logout() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async getCurrentUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const user = session.user;

            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                return { ...user, ...profile };
            }

            // Fallback: use user_metadata if profile table doesn't exist yet
            return {
                ...user,
                name: user.user_metadata?.name || user.email?.split('@')[0],
                college: user.user_metadata?.college || 'Not set',
                age: user.user_metadata?.age,
                height: user.user_metadata?.height,
                weight: user.user_metadata?.weight,
                gender: user.user_metadata?.gender,
                role: user.user_metadata?.role || 'student'
            };
        } catch (error) {
            return null;
        }
    }

    async isAuthenticated() {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }

    async updateProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            return null;
        }
    }

    isAdmin(user) {
        return user?.role === 'admin';
    }
}

export const authService = new AuthService();
export default authService;
