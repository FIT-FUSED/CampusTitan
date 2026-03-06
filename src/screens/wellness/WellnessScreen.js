// Wellness Screen
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, MOOD_EMOJIS } from '../../theme';
import { GradientCard, StatCard, SectionHeader, AnimatedButton } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import db from '../../services/database';
import { format, subDays } from 'date-fns';
import SleepTracker from './SleepTracker';

export default function WellnessScreen({ navigation }) {
    const { user } = useAuth();
    const [moodLogs, setMoodLogs] = useState([]);
    const [journals, setJournals] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!user) return;
        const moods = await db.getMoodLogs(user.id);
        setMoodLogs(moods.sort((a, b) => b.date.localeCompare(a.date)));
        const j = await db.getJournals(user.id);
        setJournals(j.sort((a, b) => b.date.localeCompare(a.date)));
    }, [user]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMood = moodLogs.find(m => m.date === today);

    // Weekly mood data
    const weekMoods = Array.from({ length: 7 }, (_, i) => {
        const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        const log = moodLogs.find(m => m.date === date);
        return { day: format(subDays(new Date(), 6 - i), 'EEE'), mood: log?.mood || 0, date };
    });

    const avgMood = moodLogs.length > 0
        ? (moodLogs.slice(0, 7).reduce((s, m) => s + m.mood, 0) / Math.min(moodLogs.length, 7)).toFixed(1)
        : '—';

    // Mood streak
    let moodStreak = 0;
    for (let i = 0; i < 30; i++) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (moodLogs.some(m => m.date === d)) moodStreak++;
        else break;
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                <Text style={styles.headerTitle}>Mental Wellness</Text>

                {/* Today's Mood */}
                <GradientCard gradient={todayMood ? COLORS.gradientPrimary : COLORS.gradientCard} style={styles.moodCard}>
                    {todayMood ? (
                        <View style={styles.todayMood}>
                            <Text style={styles.todayMoodEmoji}>{MOOD_EMOJIS[5 - todayMood.mood]?.emoji}</Text>
                            <View>
                                <Text style={styles.todayMoodLabel}>Today's Mood</Text>
                                <Text style={styles.todayMoodText}>{MOOD_EMOJIS[5 - todayMood.mood]?.label}</Text>
                                {todayMood.note && <Text style={styles.todayMoodNote}>{todayMood.note}</Text>}
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.logMoodPrompt} onPress={() => navigation.navigate('MoodLog')}>
                            <Text style={styles.logMoodEmoji}>😊</Text>
                            <Text style={styles.logMoodText}>How are you feeling today?</Text>
                            <Text style={styles.logMoodCta}>Tap to log your mood →</Text>
                        </TouchableOpacity>
                    )}
                </GradientCard>

                {/* Sleep Tracker */}
                <SleepTracker />

                {/* Quick Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MoodLog')}>
                        <LinearGradient colors={COLORS.gradientSunset} style={styles.actionGradient}>
                            <Text style={styles.actionEmoji}>😊</Text>
                            <Text style={styles.actionLabel}>Log Mood</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Journal')}>
                        <LinearGradient colors={COLORS.gradientOcean} style={styles.actionGradient}>
                            <Text style={styles.actionEmoji}>📝</Text>
                            <Text style={styles.actionLabel}>Journal</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('WellnessCircle')}>
                        <LinearGradient colors={COLORS.gradientAccent} style={styles.actionGradient}>
                            <Text style={styles.actionEmoji}>🤝</Text>
                            <Text style={styles.actionLabel}>Circles</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('DailyJournal')}>
                        <LinearGradient colors={COLORS.gradientSunset} style={styles.actionGradient}>
                            <Text style={styles.actionEmoji}>🧠</Text>
                            <Text style={styles.actionLabel}>AI Journal</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    <StatCard title="Avg Mood" value={avgMood} icon="📊" color={COLORS.primary} subtitle="Last 7 days" />
                    <StatCard title="Log Streak" value={moodStreak} unit="days" icon="🔥" color={COLORS.coral} />
                </View>

                {/* Weekly Mood Trend */}
                <SectionHeader title="Weekly Mood Trend" />
                <View style={styles.moodChart}>
                    {weekMoods.map((d, i) => {
                        const moodInfo = d.mood > 0 ? MOOD_EMOJIS[5 - d.mood] : null;
                        return (
                            <View key={i} style={styles.moodChartItem}>
                                <View style={[styles.moodChartDot, {
                                    backgroundColor: moodInfo?.color || COLORS.surfaceElevated,
                                    bottom: d.mood > 0 ? (d.mood / 5) * 50 : 0,
                                }]}>
                                    <Text style={{ fontSize: d.mood > 0 ? 16 : 12 }}>{moodInfo?.emoji || '—'}</Text>
                                </View>
                                <Text style={styles.moodChartDay}>{d.day}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Recent Mood Logs */}
                <SectionHeader title="Recent Mood Logs" />
                {moodLogs.slice(0, 7).map((log, i) => {
                    const moodInfo = MOOD_EMOJIS[5 - log.mood];
                    return (
                        <View key={i} style={styles.moodLogItem}>
                            <Text style={styles.moodLogEmoji}>{moodInfo?.emoji}</Text>
                            <View style={styles.moodLogInfo}>
                                <Text style={styles.moodLogDate}>{log.date} • {log.time}</Text>
                                {log.note && <Text style={styles.moodLogNote}>{log.note}</Text>}
                            </View>
                            <View style={[styles.moodBadge, { backgroundColor: moodInfo?.color + '22' }]}>
                                <Text style={[styles.moodBadgeText, { color: moodInfo?.color }]}>{moodInfo?.label}</Text>
                            </View>
                        </View>
                    );
                })}

                {/* Recent Journals */}
                <SectionHeader title="Journal Entries" action={() => navigation.navigate('Journal')} actionLabel="View All" />
                {journals.slice(0, 3).map((j, i) => (
                    <TouchableOpacity key={i} style={styles.journalItem} onPress={() => navigation.navigate('JournalEntry', { journal: j })}>
                        <Text style={styles.journalTitle}>{j.title}</Text>
                        <Text style={styles.journalDate}>{j.date}</Text>
                        <Text style={styles.journalPreview} numberOfLines={2}>{j.body}</Text>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    headerTitle: { fontSize: FONT_SIZES.xxl, ...FONTS.bold, color: COLORS.text, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
    moodCard: { marginHorizontal: SPACING.lg },
    todayMood: { flexDirection: 'row', alignItems: 'center' },
    todayMoodEmoji: { fontSize: 48, marginRight: SPACING.lg },
    todayMoodLabel: { color: COLORS.text, fontSize: FONT_SIZES.sm, opacity: 0.7 },
    todayMoodText: { color: COLORS.text, fontSize: FONT_SIZES.xxl, ...FONTS.bold },
    todayMoodNote: { color: COLORS.text, fontSize: FONT_SIZES.sm, opacity: 0.8, marginTop: SPACING.xs },
    logMoodPrompt: { alignItems: 'center', paddingVertical: SPACING.md },
    logMoodEmoji: { fontSize: 40, marginBottom: SPACING.md },
    logMoodText: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.semiBold },
    logMoodCta: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm },
    actions: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginTop: SPACING.lg },
    actionBtn: { flex: 1 },
    actionGradient: {
        borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center',
    },
    actionEmoji: { fontSize: 28, marginBottom: SPACING.sm },
    actionLabel: { color: COLORS.text, fontSize: FONT_SIZES.sm, ...FONTS.semiBold },
    statsGrid: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginTop: SPACING.lg },
    moodChart: {
        flexDirection: 'row', justifyContent: 'space-around',
        marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface,
        padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder, height: 120,
    },
    moodChartItem: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
    moodChartDot: {
        width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    },
    moodChartDay: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.sm },
    moodLogItem: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg,
        paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
    },
    moodLogEmoji: { fontSize: 24, marginRight: SPACING.md },
    moodLogInfo: { flex: 1 },
    moodLogDate: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
    moodLogNote: { color: COLORS.text, fontSize: FONT_SIZES.sm, marginTop: 2 },
    moodBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
    moodBadgeText: { fontSize: FONT_SIZES.xs, ...FONTS.semiBold },
    journalItem: {
        marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    journalTitle: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.semiBold },
    journalDate: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.xs },
    journalPreview: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm, lineHeight: 20 },
});
