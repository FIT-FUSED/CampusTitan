// Register Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { AnimatedButton, StyledInput } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import { COLLEGES } from '../../data/seedData';

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        email: '', password: '', name: '', college: COLLEGES[0],
    });
    const [loading, setLoading] = useState(false);
    const [showCollegePicker, setShowCollegePicker] = useState(false);
    const { register } = useAuth();

    function updateForm(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleRegister() {
        if (!form.name || !form.email || !form.password || !form.college) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }
        setLoading(true);
        try {
            await register(form);
        } catch (e) {
            Alert.alert('Registration Failed', e.message);
        }
        setLoading(false);
    }

    function renderStep1() {
        return (
            <>
                <Text style={styles.stepTitle}>Create Account</Text>
                <Text style={styles.stepSubtitle}>Step 1 of 2 — Account Details</Text>
                <StyledInput label="Email" value={form.email} onChangeText={(v) => updateForm('email', v)} placeholder="you@campus.edu" keyboardType="email-address" icon="📧" />
                <StyledInput label="Password" value={form.password} onChangeText={(v) => updateForm('password', v)} placeholder="Min 6 characters" secureTextEntry icon="🔒" />
                <AnimatedButton title="Next →" onPress={() => setStep(2)} style={{ marginTop: SPACING.lg }} />
            </>
        );
    }

    function renderStep2() {
        return (
            <>
                <Text style={styles.stepTitle}>Your Profile</Text>
                <Text style={styles.stepSubtitle}>Step 2 of 2 — Campus Info</Text>
                <StyledInput label="Full Name" value={form.name} onChangeText={(v) => updateForm('name', v)} placeholder="John Doe" icon="👤" />

                <Text style={styles.fieldLabel}>Select College</Text>
                <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowCollegePicker(true)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.pickerButtonText}>{form.college}</Text>
                    <Text style={styles.pickerChevron}>▼</Text>
                </TouchableOpacity>

                <Modal
                    visible={showCollegePicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowCollegePicker(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowCollegePicker(false)}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select College</Text>
                                <TouchableOpacity onPress={() => setShowCollegePicker(false)}>
                                    <Text style={styles.modalDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={COLLEGES}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.collegeItem,
                                            item === form.college && styles.collegeItemSelected,
                                        ]}
                                        onPress={() => {
                                            updateForm('college', item);
                                            setShowCollegePicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.collegeItemText,
                                            item === form.college && styles.collegeItemTextSelected,
                                        ]}>{item}</Text>
                                        {item === form.college && <Text style={styles.checkmark}>✓</Text>}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                <View style={styles.navButtons}>
                    <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <AnimatedButton title={loading ? "Creating..." : "Create Account"} onPress={handleRegister} disabled={loading} style={{ flex: 1 }} />
                </View>
            </>
        );
    }

    // Progress bar
    const progress = (step / 2) * 100;

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
        marginBottom: SPACING.xs,
        marginTop: SPACING.md,
    },
    pickerButton: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md + 4,
        marginBottom: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerButtonText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        flex: 1,
    },
    pickerChevron: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        maxHeight: height * 0.5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glassBorder,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        ...FONTS.bold,
        color: COLORS.text,
    },
    modalDone: {
        fontSize: FONT_SIZES.md,
        ...FONTS.semiBold,
        color: COLORS.primary,
    },
    collegeItem: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glassBorder,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    collegeItemSelected: {
        backgroundColor: COLORS.primary + '15',
    },
    collegeItemText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        flex: 1,
    },
    collegeItemTextSelected: {
        color: COLORS.primary,
        ...FONTS.semiBold,
    },
    checkmark: {
        color: COLORS.primary,
        fontSize: 18,
        ...FONTS.bold,
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
