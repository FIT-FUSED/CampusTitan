// Login Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { AnimatedButton, StyledInput } from '../../components/common';
import { useAuth } from '../../services/AuthContext';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    function showAlert(title, message) {
        console.log(`Alert: ${title} - ${message}`);
        if (Platform.OS === 'web') alert(`${title}: ${message}`);
        else Alert.alert(title, message);
    }

    async function handleLogin() {
        console.log('Login pressed, email:', email, 'password length:', password.length);
        if (!email || !password) {
            showAlert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (e) {
            console.error('Login error:', e);
            showAlert('Login Failed', e.message);
        }
        setLoading(false);
    }

    async function fillDemo(type) {
        console.log('Demo pressed:', type);
        const demoEmail = type === 'student' ? 'arjun@campus.edu' : 'admin@campus.edu';
        const demoPass = 'demo123';
        setEmail(demoEmail);
        setPassword(demoPass);

        setLoading(true);
        try {
            console.log('Attempting auto login for demo...');
            await login(demoEmail, demoPass);
            console.log('Demo auto login success');
        } catch (e) {
            console.error('Demo login error:', e);
            showAlert('Login Failed', e.message);
        }
        setLoading(false);
    }

    const renderContent = () => (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            {/* Logo */}
            <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>🏃‍♂️</Text>
                </View>
                <Text style={styles.appName}>FitFusion</Text>
                <Text style={styles.tagline}>Campus Fitness & Wellness</Text>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
                <StyledInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@campus.edu"
                    keyboardType="email-address"
                    icon="📧"
                />
                <StyledInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    icon="🔒"
                />

                <AnimatedButton
                    title={loading ? "Signing in..." : "Sign In"}
                    onPress={handleLogin}
                    disabled={loading}
                    style={{ marginTop: SPACING.md }}
                />

                <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerText}>
                        Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Demo accounts */}
            <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Quick Demo Access</Text>
                <View style={styles.demoButtons}>
                    <TouchableOpacity style={styles.demoButton} onPress={() => fillDemo('student')}>
                        <Text style={styles.demoButtonEmoji}>🎓</Text>
                        <Text style={styles.demoButtonText}>Student</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.demoButton} onPress={() => fillDemo('admin')}>
                        <Text style={styles.demoButtonEmoji}>🛡️</Text>
                        <Text style={styles.demoButtonText}>Admin</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            <View style={{ flex: 1 }} pointerEvents="auto">
                {Platform.OS !== 'web' ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        {renderContent()}
                    </KeyboardAvoidingView>
                ) : (
                    renderContent()
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xxl,
        justifyContent: 'center',
        paddingTop: height * 0.08,
        paddingBottom: SPACING.huge,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: SPACING.xxxl,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '22',
        borderWidth: 2,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    logoEmoji: { fontSize: 36 },
    appName: {
        fontSize: FONT_SIZES.hero,
        ...FONTS.extraBold,
        color: COLORS.text,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    formSection: {
        marginBottom: SPACING.xxl,
    },
    registerLink: {
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    registerText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
    registerTextBold: {
        color: COLORS.primary,
        ...FONTS.bold,
    },
    demoSection: {
        alignItems: 'center',
    },
    demoTitle: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.sm,
        marginBottom: SPACING.md,
    },
    demoButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    demoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        gap: SPACING.sm,
    },
    demoButtonEmoji: { fontSize: 18 },
    demoButtonText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        ...FONTS.medium,
    },
});
