// Register Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { AnimatedButton, StyledInput, Chip } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import { HOSTELS, DEPARTMENTS, YEARS } from '../../data/seedData';

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: '', email: '', password: '',
        age: '', gender: 'Male', height: '', weight: '',
        fitnessLevel: 'beginner',
        dietaryPreferences: 'Vegetarian',
        hostel: 'Hostel A', department: 'Computer Science', year: '2nd Year',
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    function updateForm(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleRegister() {
        if (!form.name || !form.email || !form.password) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }
        setLoading(true);
        try {
            await register({
                ...form,
                age: parseInt(form.age) || 20,
                height: parseInt(form.height) || 170,
                weight: parseInt(form.weight) || 65,
            });
        } catch (e) {
            Alert.alert('Registration Failed', e.message);
        }
        setLoading(false);
    }

    function renderStep1() {
        return (
            <>
                <Text style={styles.stepTitle}>Create Account</Text>
                <Text style={styles.stepSubtitle}>Step 1 of 3 — Basic Info</Text>
                <StyledInput label="Full Name" value={form.name} onChangeText={(v) => updateForm('name', v)} placeholder="John Doe" icon="👤" />
                <StyledInput label="Email" value={form.email} onChangeText={(v) => updateForm('email', v)} placeholder="you@campus.edu" keyboardType="email-address" icon="📧" />
                <StyledInput label="Password" value={form.password} onChangeText={(v) => updateForm('password', v)} placeholder="Min 6 characters" secureTextEntry icon="🔒" />
                <AnimatedButton title="Next →" onPress={() => setStep(2)} style={{ marginTop: SPACING.lg }} />
            </>
        );
    }

    function renderStep2() {
        return (
            <>
                <Text style={styles.stepTitle}>Body Profile</Text>
                <Text style={styles.stepSubtitle}>Step 2 of 3 — Physical Details</Text>
                <View style={styles.row}>
                    <StyledInput label="Age" value={form.age} onChangeText={(v) => updateForm('age', v)} placeholder="20" keyboardType="numeric" style={{ flex: 1 }} />
                    <View style={{ width: SPACING.md }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Gender</Text>
                        <View style={styles.chipRow}>
                            {['Male', 'Female', 'Other'].map(g => (
                                <Chip key={g} label={g} selected={form.gender === g} onPress={() => updateForm('gender', g)} color={COLORS.primary} />
                            ))}
                        </View>
                    </View>
                </View>
                <View style={styles.row}>
                    <StyledInput label="Height (cm)" value={form.height} onChangeText={(v) => updateForm('height', v)} placeholder="175" keyboardType="numeric" style={{ flex: 1 }} />
                    <View style={{ width: SPACING.md }} />
                    <StyledInput label="Weight (kg)" value={form.weight} onChangeText={(v) => updateForm('weight', v)} placeholder="70" keyboardType="numeric" style={{ flex: 1 }} />
                </View>
                <Text style={styles.fieldLabel}>Fitness Level</Text>
                <View style={styles.chipRow}>
                    {['beginner', 'intermediate'].map(l => (
                        <Chip key={l} label={l.charAt(0).toUpperCase() + l.slice(1)} selected={form.fitnessLevel === l} onPress={() => updateForm('fitnessLevel', l)} color={COLORS.accent} />
                    ))}
                </View>
                <Text style={styles.fieldLabel}>Dietary Preference</Text>
                <View style={styles.chipRow}>
                    {['Vegetarian', 'Non-Vegetarian', 'Vegan'].map(d => (
                        <Chip key={d} label={d} selected={form.dietaryPreferences === d} onPress={() => updateForm('dietaryPreferences', d)} color={COLORS.accentLight} />
                    ))}
                </View>
                <View style={styles.navButtons}>
                    <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <AnimatedButton title="Next →" onPress={() => setStep(3)} style={{ flex: 1 }} />
                </View>
            </>
        );
    }

    function renderStep3() {
        return (
            <>
                <Text style={styles.stepTitle}>Campus Details</Text>
                <Text style={styles.stepSubtitle}>Step 3 of 3 — Campus Info</Text>
                <Text style={styles.fieldLabel}>Hostel / Residence</Text>
                <View style={styles.chipRow}>
                    {HOSTELS.map(h => (
                        <Chip key={h} label={h} selected={form.hostel === h} onPress={() => updateForm('hostel', h)} color={COLORS.primary} />
                    ))}
                </View>
                <Text style={styles.fieldLabel}>Department</Text>
                <View style={styles.chipRow}>
                    {DEPARTMENTS.map(d => (
                        <Chip key={d} label={d} selected={form.department === d} onPress={() => updateForm('department', d)} color={COLORS.accent} />
                    ))}
                </View>
                <Text style={styles.fieldLabel}>Year</Text>
                <View style={styles.chipRow}>
                    {YEARS.map(y => (
                        <Chip key={y} label={y} selected={form.year === y} onPress={() => updateForm('year', y)} color={COLORS.coral} />
                    ))}
                </View>
                <View style={styles.navButtons}>
                    <TouchableOpacity onPress={() => setStep(2)} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <AnimatedButton title={loading ? "Creating..." : "Create Account"} onPress={handleRegister} disabled={loading} style={{ flex: 1 }} />
                </View>
            </>
        );
    }

    // Progress bar
    const progress = (step / 3) * 100;

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBg}>
                            <LinearGradient
                                colors={COLORS.gradientPrimary}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={[styles.progressFill, { width: `${progress}%` }]}
                            />
                        </View>
                    </View>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
                        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginTextBold}>Sign In</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: SPACING.xxl,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: SPACING.huge,
    },
    progressContainer: { marginBottom: SPACING.xxl },
    progressBg: {
        height: 4,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: { height: 4, borderRadius: 2 },
    stepTitle: {
        fontSize: FONT_SIZES.xxxl,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    stepSubtitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xxl,
    },
    fieldLabel: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    navButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xxl,
        gap: SPACING.md,
    },
    backBtn: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    backBtnText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        ...FONTS.medium,
    },
    loginLink: {
        alignItems: 'center',
        marginTop: SPACING.xxl,
    },
    loginText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
    loginTextBold: {
        color: COLORS.primary,
        ...FONTS.bold,
    },
});
