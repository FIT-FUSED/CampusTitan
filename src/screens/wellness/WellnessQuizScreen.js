import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../../theme';
import db from '../../services/database';
import { useAuth } from '../../services/AuthContext';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCategorizedScreenTime, checkAndRequestPermission } from '../../services/screenTimeMapper';

const { width } = Dimensions.get('window');

const QUESTIONS = [
    { id: 'occupation', title: "What do you do?", type: 'options', options: ["Student", "Corporate", "Others", "Business", "Housewife"] },
    { id: 'work_mode', title: "How do you work/study?", type: 'options', options: ["Remote", "Onsite", "Hybrid"] },
    { id: 'exercise_minutes_per_week', title: "Exercise per week?", type: 'number', suffix: "mins", sub: "Manual log" },
    { id: 'social_hours_per_week', title: "Socializing per week?", type: 'number', suffix: "hours", sub: "(Optional) Skip if unsure" },
];

export default function WellnessQuizScreen({ navigation }) {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);

    // Default values if user has them
    useEffect(() => {
        const initPermissions = async () => {
            await checkAndRequestPermission(); // Ensure UsageStats permission is granted
        };
        initPermissions();

        if (user) {
            // Pull existing workout data if any
            const loadPrefills = async () => {
                const exMins = await AsyncStorage.getItem('@exercise_mins_week');
                if (exMins) setAnswers(prev => ({ ...prev, exercise_minutes_per_week: parseFloat(exMins) }));
            };
            loadPrefills();
        }
    }, [user]);

    const progress = (currentIndex / QUESTIONS.length) * 100;
    const currentQ = QUESTIONS[currentIndex];

    // Auto-advance for options
    const handleOptionSelect = (val) => {
        handleAnswer(val);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(handleNext, 400); // short delay for visual feedback
    };

    const handleAnswer = (val) => {
        setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
    };

    const handleNext = async () => {
        if (currentIndex < QUESTIONS.length - 1) {
            setCurrentIndex(prev => prev + 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            await finishQuiz();
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const finishQuiz = async () => {
        setLoading(true);
        try {
            // Aggregate all auto-tracked data here secretly
            const screenStats = fetchCategorizedScreenTime();

            const kmsLogged = await AsyncStorage.getItem('@kms_walked_daily');
            const sleepHrs = await AsyncStorage.getItem('@sleep_hours');
            const sleepQual = await AsyncStorage.getItem('@sleep_quality');
            const stress = await AsyncStorage.getItem('@journal_stress');
            const prod = await AsyncStorage.getItem('@journal_prod');

            const payload = {
                ...answers,
                age: user.age,
                gender: user.gender,
                screen_time_hours: screenStats.screen_time_hours || 0,
                work_screen_hours: screenStats.work_screen_hours || 0,
                leisure_screen_hours: screenStats.leisure_screen_hours || 0,
                kms_walked_daily: kmsLogged ? parseFloat(kmsLogged) : 0,
                sleep_hours: sleepHrs ? parseFloat(sleepHrs) : 0,
                sleep_quality_1_5: sleepQual ? parseInt(sleepQual) : 3,
                stress_level_0_10: stress ? parseInt(stress) : 5,
                productivity_0_100: prod ? parseInt(prod) : 50,
            };

            await db.saveWellnessData(user.id, payload);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                "Checkup Complete! 🧠",
                "Your automated data (sleep, steps, screen time) and quiz answers have been sent to the AI engine.",
                [{ text: "Awesome", onPress: () => navigation.navigate('MainApp') }]
            );
        } catch (e) {
            console.error('Save failed', e);
            alert("Failed to save data");
        }
        setLoading(false);
    };

    const renderInput = () => {
        const val = answers[currentQ.id];

        if (currentQ.type === 'options') {
            return (
                <View style={s.optionsContainer}>
                    {currentQ.options.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={[s.optionBtn, val === opt && s.optionBtnActive]}
                            onPress={() => handleOptionSelect(opt)}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.optionText, val === opt && s.optionTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (currentQ.type === 'number') {
            const numVal = val !== undefined ? String(val) : '';
            return (
                <View style={s.numContainer}>
                    <TextInput
                        style={s.numInput}
                        keyboardType="decimal-pad"
                        value={numVal}
                        onChangeText={(t) => handleAnswer(t ? parseFloat(t) : undefined)}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        autoFocus
                    />
                    <Text style={s.numSuffix}>{currentQ.suffix}</Text>
                </View>
            );
        }

        if (currentQ.type === 'slider') {
            // Simplified custom slider using buttons for exact ML values
            const range = [];
            let step = currentQ.step || 1;
            for (let i = currentQ.min; i <= currentQ.max; i += step) range.push(i);

            return (
                <View style={s.sliderContainer}>
                    <View style={s.sliderLabels}>
                        <Text style={s.sliderLabelText}>{currentQ.labels[0]}</Text>
                        <Text style={s.sliderLabelText}>{currentQ.labels[1]}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {range.map(num => (
                            <TouchableOpacity
                                key={num}
                                style={[s.sliderBtn, val === num && s.sliderBtnActive]}
                                onPress={() => handleOptionSelect(num)}
                            >
                                <Text style={[s.sliderBtnText, val === num && s.sliderBtnTextActive]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            );
        }
    };

    const isOptional = currentQ.id === 'social_hours_per_week';
    const isAnswered = isOptional || (answers[currentQ.id] !== undefined && answers[currentQ.id] !== '');

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
                    <Ionicons name="close" size={28} color={COLORS.textMuted} />
                </TouchableOpacity>
                <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.content}
            >
                <View style={s.questionArea}>
                    <Text style={s.questionText}>{currentQ.title}</Text>
                    {currentQ.sub && <Text style={s.subText}>{currentQ.sub}</Text>}
                    {renderInput()}
                </View>

                {currentQ.type !== 'options' && currentQ.type !== 'slider' && (
                    <View style={s.footer}>
                        <TouchableOpacity
                            style={[s.nextBtn, !isAnswered && s.nextBtnDisabled]}
                            onPress={handleNext}
                            disabled={!isAnswered || loading}
                        >
                            <Text style={s.nextBtnText}>{loading ? 'Saving...' : 'Continue'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
    closeBtn: { padding: SPACING.xs },
    progressTrack: {
        flex: 1, height: 16, backgroundColor: COLORS.surfaceElevated,
        borderRadius: 8, marginLeft: SPACING.md, overflow: 'hidden'
    },
    progressFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 8 },

    content: { flex: 1, paddingHorizontal: SPACING.xl, justifyContent: 'space-between', paddingBottom: 40 },
    questionArea: { flex: 1, justifyContent: 'center' },
    questionText: { fontSize: 32, ...FONTS.extraBold, color: COLORS.text, marginBottom: SPACING.md, textAlign: 'center' },
    subText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl },

    // Options
    optionsContainer: { gap: SPACING.md },
    optionBtn: {
        padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl,
        borderWidth: 2, borderColor: COLORS.glassBorder, backgroundColor: COLORS.surface
    },
    optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
    optionText: { fontSize: FONT_SIZES.lg, ...FONTS.bold, color: COLORS.text, textAlign: 'center' },
    optionTextActive: { color: COLORS.primary },

    // Number
    numContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
    numInput: { fontSize: 64, ...FONTS.extraBold, color: COLORS.primary, minWidth: 80, textAlign: 'center' },
    numSuffix: { fontSize: FONT_SIZES.xl, color: COLORS.textMuted, ...FONTS.bold, marginLeft: SPACING.sm },

    // Slider replacements (buttons to ensure exact discrete values for ML)
    sliderContainer: { marginTop: SPACING.md },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
    sliderLabelText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.bold },
    sliderBtn: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.surface,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.glassBorder
    },
    sliderBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '20' },
    sliderBtnText: { fontSize: FONT_SIZES.lg, ...FONTS.bold, color: COLORS.text },
    sliderBtnTextActive: { color: COLORS.primary },

    // Footer
    footer: { paddingTop: SPACING.xl },
    nextBtn: {
        backgroundColor: COLORS.success, padding: 20, borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center', ...SHADOWS.medium
    },
    nextBtnDisabled: { backgroundColor: COLORS.surfaceElevated, elevation: 0 },
    nextBtnText: { color: COLORS.textInverse, fontSize: FONT_SIZES.lg, ...FONTS.extraBold, textTransform: 'uppercase', letterSpacing: 1 },
});
