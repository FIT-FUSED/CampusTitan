// Login Screen — Premium Editorial Design
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
    Platform, ScrollView, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../../theme';
import { AnimatedButton, StyledInput } from '../../components/common';
import { useAuth } from '../../services/AuthContext';

const { height: H, width: W } = Dimensions.get('window');

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
        const demoEmail = type === 'student' ? 'arjun@campus.edu' : 'admin@campus.edu';
        const demoPass = 'demo123';
        setEmail(demoEmail);
        setPassword(demoPass);
        setLoading(true);
        try {
            await login(demoEmail, demoPass);
        } catch (e) {
            showAlert('Login Failed', e.message);
        }
        setLoading(false);
    }

    const renderContent = () => (
        <ScrollView
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* Brand Hero */}
            <View style={s.brandSection}>
                {/* Decorative accent shapes */}
                <View style={s.accentCircle1} />
                <View style={s.accentCircle2} />

                <View style={s.brandMark}>
                    <LinearGradient
                        colors={COLORS.gradientPrimary}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={s.brandGradient}
                    >
                        <Text style={s.brandIcon}>CT</Text>
                    </LinearGradient>
                </View>
                <Text style={s.brandName}>Campus{'\n'}Titan</Text>
                <Text style={s.brandTag}>YOUR CAMPUS HEALTH COMPANION</Text>
            </View>

            {/* Form Card */}
            <View style={s.formCard}>
                <Text style={s.formTitle}>Welcome back</Text>
                <Text style={s.formSub}>Sign in to continue</Text>

                <StyledInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@campus.edu"
                    keyboardType="email-address"
                />
                <StyledInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                />

                <AnimatedButton
                    title={loading ? "Signing in..." : "Sign In"}
                    onPress={handleLogin}
                    disabled={loading}
                    style={{ marginTop: SPACING.sm }}
                />

                <TouchableOpacity style={s.registerLink} onPress={() => navigation.navigate('Register')}>
                    <Text style={s.registerText}>
                        Don't have an account? <Text style={s.registerBold}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Demo Bar */}
            <View style={s.demoBar}>
                <View style={s.demoLine} />
                <Text style={s.demoLabel}>QUICK DEMO</Text>
                <View style={s.demoLine} />
            </View>
            <View style={s.demoRow}>
                <TouchableOpacity style={s.demoPill} onPress={() => fillDemo('student')}>
                    <Text style={s.demoPillText}>🎓 Student</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.demoPill} onPress={() => fillDemo('admin')}>
                    <Text style={s.demoPillText}>🛡️ Admin</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <View style={s.container}>
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
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: SPACING.huge,
    },

    // ─── Brand ───
    brandSection: {
        paddingTop: H * 0.1,
        paddingBottom: SPACING.xxxl,
        paddingHorizontal: SPACING.xxl,
        overflow: 'hidden',
    },
    accentCircle1: {
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: COLORS.primary + '08',
    },
    accentCircle2: {
        position: 'absolute', top: 60, right: 40,
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: COLORS.accent + '06',
    },
    brandMark: { marginBottom: SPACING.lg },
    brandGradient: {
        width: 56, height: 56, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.medium,
    },
    brandIcon: {
        fontSize: 22, ...FONTS.extraBold, color: COLORS.textInverse,
        letterSpacing: 1,
    },
    brandName: {
        fontSize: 44, ...FONTS.extraBold, color: COLORS.text,
        lineHeight: 48, letterSpacing: -1.5,
    },
    brandTag: {
        fontSize: 11, ...FONTS.semiBold, color: COLORS.textMuted,
        letterSpacing: 3, marginTop: SPACING.md,
    },

    // ─── Form ───
    formCard: {
        marginHorizontal: SPACING.xxl,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xxl,
        padding: SPACING.xxl,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        ...SHADOWS.small,
    },
    formTitle: {
        fontSize: FONT_SIZES.xxl, ...FONTS.bold, color: COLORS.text,
        marginBottom: 4,
    },
    formSub: {
        fontSize: FONT_SIZES.sm, color: COLORS.textMuted,
        marginBottom: SPACING.xl,
    },

    registerLink: { alignItems: 'center', marginTop: SPACING.xl },
    registerText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
    registerBold: { color: COLORS.primary, ...FONTS.bold },

    // ─── Demo ───
    demoBar: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: SPACING.xxl, marginTop: SPACING.xxl,
    },
    demoLine: { flex: 1, height: 1, backgroundColor: COLORS.glassBorder },
    demoLabel: {
        marginHorizontal: SPACING.md,
        fontSize: 10, ...FONTS.semiBold, color: COLORS.textMuted,
        letterSpacing: 2,
    },
    demoRow: {
        flexDirection: 'row', justifyContent: 'center',
        gap: SPACING.md, marginTop: SPACING.md,
    },
    demoPill: {
        paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.round,
        backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    demoPillText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium },
});
