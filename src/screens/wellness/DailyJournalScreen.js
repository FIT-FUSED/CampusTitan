import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../../theme';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simulated LLM API call
const mockAnalyzeJournal = async (text) => {
    return new Promise(resolve => {
        setTimeout(() => {
            const content = text.toLowerCase();
            let stress = 5;
            let prod = 50;

            if (content.includes('overwhelmed') || content.includes('tired') || content.includes('stressed') || content.includes('hard')) stress += 3;
            if (content.includes('happy') || content.includes('calm') || content.includes('relaxed')) stress -= 2;

            if (content.includes('done') || content.includes('productive') || content.includes('finished') || content.includes('focus')) prod += 30;
            if (content.includes('lazy') || content.includes('distracted') || content.includes('procrastinated')) prod -= 20;

            resolve({
                stress_level_0_10: Math.max(0, Math.min(10, stress)),
                productivity_0_100: Math.max(0, Math.min(100, prod))
            });
        }, 1500); // simulate network delay
    });
};

export default function DailyJournalScreen({ navigation }) {
    const [journal, setJournal] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    const handleSave = async () => {
        if (!journal.trim()) return;
        setIsAnalyzing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const analysis = await mockAnalyzeJournal(journal);
            setResults(analysis);

            // Save to AsyncStorage so WellnessQuiz can grab it later
            await AsyncStorage.setItem('@journal_stress', analysis.stress_level_0_10.toString());
            await AsyncStorage.setItem('@journal_prod', analysis.productivity_0_100.toString());

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Journal Saved", "Your AI analysis has recorded your stress & productivity.");
        } catch (e) {
            console.error(e);
        }
        setIsAnalyzing(false);
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.textMuted} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Daily Journal</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
                <ScrollView contentContainerStyle={s.scroll}>
                    <Text style={s.prompt}>How are you feeling today?</Text>
                    <Text style={s.subPrompt}>Write about your day, challenges, and wins. Our AI will analyze your mental well-being securely.</Text>

                    <TextInput
                        style={s.textArea}
                        multiline
                        placeholder="Today I focused on building the native expo module..."
                        placeholderTextColor={COLORS.textMuted}
                        value={journal}
                        onChangeText={setJournal}
                        textAlignVertical="top"
                    />

                    {results && (
                        <View style={s.resultsBox}>
                            <Text style={s.resultsTitle}>AI Analysis Complete</Text>
                            <View style={s.resultRow}>
                                <Text style={s.resultLabel}>Stress Level (0-10):</Text>
                                <Text style={[s.resultValue, { color: results.stress_level_0_10 > 7 ? COLORS.error : COLORS.success }]}>
                                    {results.stress_level_0_10}/10
                                </Text>
                            </View>
                            <View style={s.resultRow}>
                                <Text style={s.resultLabel}>Productivity (0-100):</Text>
                                <Text style={[s.resultValue, { color: COLORS.primary }]}>
                                    {results.productivity_0_100}%
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[s.btn, !journal.trim() && s.btnDisabled]}
                        onPress={handleSave}
                        disabled={!journal.trim() || isAnalyzing}
                    >
                        <Text style={s.btnText}>{isAnalyzing ? 'Analyzing with AI...' : 'Save & Analyze'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
    closeBtn: { padding: SPACING.xs },
    headerTitle: { fontSize: FONT_SIZES.xl, ...FONTS.bold, color: COLORS.text },
    container: { flex: 1 },
    scroll: { padding: SPACING.lg, paddingBottom: 40 },
    prompt: { fontSize: 32, ...FONTS.extraBold, color: COLORS.text, marginBottom: SPACING.xs },
    subPrompt: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl, lineHeight: 22 },
    textArea: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        padding: SPACING.lg,
        minHeight: 250,
        marginBottom: SPACING.xl,
        ...FONTS.medium
    },
    btn: {
        backgroundColor: COLORS.primary,
        padding: 20,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        ...SHADOWS.medium
    },
    btnDisabled: { backgroundColor: COLORS.surfaceElevated, elevation: 0 },
    btnText: { color: COLORS.textInverse, fontSize: FONT_SIZES.lg, ...FONTS.extraBold, textTransform: 'uppercase' },

    resultsBox: {
        backgroundColor: COLORS.primary + '15',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        marginBottom: SPACING.xl
    },
    resultsTitle: { color: COLORS.primary, ...FONTS.bold, fontSize: FONT_SIZES.lg, marginBottom: SPACING.sm },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: SPACING.xs },
    resultLabel: { color: COLORS.text, ...FONTS.medium, fontSize: FONT_SIZES.md },
    resultValue: { ...FONTS.bold, fontSize: FONT_SIZES.lg }
});
