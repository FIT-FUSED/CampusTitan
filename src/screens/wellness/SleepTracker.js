import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '../../theme';
import * as Haptics from 'expo-haptics';

const SLEEP_START_KEY = '@sleep_start_time';
const SLEEP_HOURS_KEY = '@sleep_hours';
const SLEEP_QUALITY_KEY = '@sleep_quality';

const EMOJIS = [
    { label: 'Exhausted', emoji: '😫', val: 1 },
    { label: 'Tired', emoji: '🥱', val: 2 },
    { label: 'Okay', emoji: '😐', val: 3 },
    { label: 'Rested', emoji: '🙂', val: 4 },
    { label: 'Energized', emoji: '🤩', val: 5 },
];

export default function SleepTracker() {
    const [isSleeping, setIsSleeping] = useState(false);
    const [sleepStart, setSleepStart] = useState(null);
    const [showQualityModal, setShowQualityModal] = useState(false);
    const [lastSleep, setLastSleep] = useState(null);

    useEffect(() => {
        loadState();
    }, []);

    const loadState = async () => {
        try {
            const start = await AsyncStorage.getItem(SLEEP_START_KEY);
            if (start) {
                setSleepStart(parseInt(start, 10));
                setIsSleeping(true);
            }
            const hours = await AsyncStorage.getItem(SLEEP_HOURS_KEY);
            if (hours) setLastSleep(parseFloat(hours).toFixed(1));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSleep = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const now = Date.now();
        await AsyncStorage.setItem(SLEEP_START_KEY, now.toString());
        setSleepStart(now);
        setIsSleeping(true);
    };

    const handleWakeUp = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const now = Date.now();
        const elapsedHours = (now - sleepStart) / (1000 * 60 * 60);

        await AsyncStorage.setItem(SLEEP_HOURS_KEY, elapsedHours.toString());
        await AsyncStorage.removeItem(SLEEP_START_KEY);

        setIsSleeping(false);
        setSleepStart(null);
        setLastSleep(elapsedHours.toFixed(1));

        // Trigger modal for quality
        setShowQualityModal(true);
    };

    const handleQualitySelect = async (val) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await AsyncStorage.setItem(SLEEP_QUALITY_KEY, val.toString());
        setShowQualityModal(false);
        Alert.alert("Recorded!", "Your sleep data has been securely saved.");
    };

    return (
        <View style={s.container}>
            <View style={s.card}>
                <View style={s.header}>
                    <Ionicons name="moon" size={24} color={COLORS.primary} />
                    <Text style={s.title}>Sleep Tracker</Text>
                </View>

                {isSleeping ? (
                    <View style={s.activeState}>
                        <Text style={s.sleepingText}>Zzz... You are asleep.</Text>
                        <TouchableOpacity style={[s.btn, s.wakeBtn]} onPress={handleWakeUp}>
                            <Ionicons name="sunny" size={24} color={COLORS.textInverse} />
                            <Text style={s.btnText}>Wake Up</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={s.idleState}>
                        <Text style={s.infoText}>
                            {lastSleep ? `Last sleep: ${lastSleep} hrs` : "Ready for bed?"}
                        </Text>
                        <TouchableOpacity style={[s.btn, s.sleepBtn]} onPress={handleSleep}>
                            <Ionicons name="bed" size={24} color={COLORS.textInverse} />
                            <Text style={s.btnText}>Going to Sleep</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <Modal visible={showQualityModal} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>How do you feel?</Text>
                        <Text style={s.modalSubtitle}>How energized do you feel this morning?</Text>
                        <View style={s.emojiRow}>
                            {EMOJIS.map(item => (
                                <TouchableOpacity
                                    key={item.val}
                                    style={s.emojiBtn}
                                    onPress={() => handleQualitySelect(item.val)}
                                >
                                    <Text style={s.emoji}>{item.emoji}</Text>
                                    <Text style={s.emojiLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { marginVertical: SPACING.md },
    card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.glassBorder, ...SHADOWS.small },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
    title: { fontSize: FONT_SIZES.xl, ...FONTS.bold, color: COLORS.text },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, gap: SPACING.sm },
    sleepBtn: { backgroundColor: COLORS.primary },
    wakeBtn: { backgroundColor: COLORS.success },
    btnText: { color: COLORS.textInverse, ...FONTS.bold, fontSize: FONT_SIZES.lg },
    infoText: { color: COLORS.textMuted, marginBottom: SPACING.md, fontSize: FONT_SIZES.md },
    activeState: { alignItems: 'center' },
    sleepingText: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.medium, marginBottom: SPACING.md, fontStyle: 'italic' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
    modalCard: { backgroundColor: COLORS.surface, width: '100%', padding: SPACING.xl, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.glassBorder },
    modalTitle: { fontSize: FONT_SIZES.xxxl, ...FONTS.extraBold, color: COLORS.text, textAlign: 'center', marginBottom: SPACING.xs },
    modalSubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl },
    emojiRow: { flexDirection: 'row', justifyContent: 'space-between' },
    emojiBtn: { alignItems: 'center' },
    emoji: { fontSize: 40, marginBottom: SPACING.xs },
    emojiLabel: { fontSize: Math.min(10, FONT_SIZES.xs), color: COLORS.textSecondary, ...FONTS.medium }
});
