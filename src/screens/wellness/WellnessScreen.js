// Wellness Screen
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, RefreshControl, Modal, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS, MOOD_EMOJIS } from '../../theme';
import { GradientCard, StatCard, SectionHeader, AnimatedButton } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import db from '../../services/database';
import { format, subDays } from 'date-fns';
import SleepTracker from './SleepTracker';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const DetailItem = ({ label, value, color, big }) => (
    <View style={styles.detailItem}>
        <Text style={[styles.detailValue, big && { fontSize: 24, color: color || COLORS.text }]}>{value}</Text>
        <Text style={styles.detailLabel}>{label}</Text>
    </View>
);

export default function WellnessScreen({ navigation }) {
    const { user } = useAuth();
    const [moodLogs, setMoodLogs] = useState([]);
    const [journals, setJournals] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    
    // New State for Wellness History
    const [wellnessHistory, setWellnessHistory] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);

    const loadData = useCallback(async () => {
        if (!user) return;
        const moods = await db.getMoodLogs(user.id);
        setMoodLogs(moods.sort((a, b) => b.date.localeCompare(a.date)));
        const j = await db.getJournals(user.id);
        setJournals(j.sort((a, b) => b.date.localeCompare(a.date)));

        // Load Wellness History
        const history = await db.getWellnessHistory(7);
        const historyWithScore = history.map(h => {
            // Simple score calculation (0-100)
            // Normalize:
            // Sleep: 8hrs = 100%
            const sleepScore = Math.min(100, (h.sleepHrs / 8) * 100);
            // Walk: 5km = 100%
            const walkScore = Math.min(100, (h.walkedKm / 5) * 100);
            // Stress: 1 is best (100%), 10 is worst (0%)
            const stressScore = (11 - h.stressLevel) * 10;
            // Productivity: 0-100
            const prodScore = h.productivity;
            
            const score = (sleepScore * 0.25 + walkScore * 0.15 + stressScore * 0.35 + prodScore * 0.25);
            return { ...h, score: Math.round(score) };
        });
        // Sort oldest to newest for chart
        setWellnessHistory(historyWithScore.sort((a, b) => new Date(a.date) - new Date(b.date)));

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
            <Modal
                visible={!!selectedLog}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedLog(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectedLog(null)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Daily Snapshot</Text>
                                <Text style={styles.modalDate}>{selectedLog && format(new Date(selectedLog.date), 'EEEE, MMMM do')}</Text>

                                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                                    <View style={styles.modalGrid}>
                                        <DetailItem label="Score" value={selectedLog?.score ?? '—'} color={COLORS.primary} big />
                                        <DetailItem label="Occupation" value={selectedLog?.occupation || '—'} />
                                        <DetailItem label="Work Mode" value={selectedLog?.workMode || '—'} />
                                        <DetailItem label="Exercise" value={`${selectedLog?.exerciseMins ?? 0}m`} />
                                        <DetailItem label="Steps" value={`${selectedLog?.steps ?? 0}`} />
                                        <DetailItem label="Walked" value={`${selectedLog?.walkedKm ?? 0}km`} />
                                        <DetailItem label="Sleep" value={`${selectedLog?.sleepHrs ?? 0}h`} />
                                        <DetailItem label="Screen" value={`${selectedLog?.screenTimeHrs ?? 0}h`} />
                                        <DetailItem label="Work Screen" value={`${selectedLog?.workScreenHrs ?? 0}h`} />
                                        <DetailItem label="Leisure Screen" value={`${selectedLog?.leisureScreenHrs ?? 0}h`} />
                                        <DetailItem label="Social" value={`${selectedLog?.socialHrs ?? 0}h`} />
                                        <DetailItem label="Sleep Quality" value={`${selectedLog?.sleepQuality ?? '—'}/5`} />
                                        <DetailItem label="Stress" value={`${selectedLog?.stressLevel ?? '—'}/10`} />
                                        <DetailItem label="Productivity" value={`${selectedLog?.productivity ?? '—'}/100`} />
                                        <DetailItem label="Time" value={selectedLog?.timestamp ? format(new Date(selectedLog.timestamp), 'p') : '—'} />
                                    </View>
                                </ScrollView>

                                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLog(null)}>
                                    <Text style={styles.closeBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

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

                {/* Mental Wellness Score Trend */}
                <SectionHeader title="Wellness Score Trend" />
                {wellnessHistory.length > 0 ? (
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={{
                                labels: wellnessHistory.map(h => format(new Date(h.date), 'dd/MM')),
                                datasets: [{ data: wellnessHistory.map(h => h.score) }]
                            }}
                            width={width - SPACING.lg * 2}
                            height={220}
                            chartConfig={{
                                backgroundColor: COLORS.surface,
                                backgroundGradientFrom: COLORS.surface,
                                backgroundGradientTo: COLORS.surface,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(255, 111, 97, ${opacity})`, // COLORS.primary
                                labelColor: (opacity = 1) => COLORS.textSecondary,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "6", strokeWidth: "2", stroke: COLORS.primary }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                            onDataPointClick={({ index }) => setSelectedLog(wellnessHistory[index])}
                        />
                        <Text style={styles.chartHint}>Tap a point to view details</Text>
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <Text style={styles.emptyText}>No wellness data yet. Complete a check-in!</Text>
                    </View>
                )}

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
    todayMoodLabel: { color: COLORS.textInverse, fontSize: FONT_SIZES.sm, opacity: 0.8 },
    todayMoodText: { color: COLORS.textInverse, fontSize: FONT_SIZES.xxl, ...FONTS.bold },
    todayMoodNote: { color: COLORS.textInverse, fontSize: FONT_SIZES.sm, opacity: 0.9, marginTop: SPACING.xs },
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
    actionLabel: { color: COLORS.textInverse, fontSize: FONT_SIZES.sm, ...FONTS.semiBold },
    statsGrid: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginTop: SPACING.lg },
    moodChart: {
        flexDirection: 'row', justifyContent: 'space-around',
        height: 150, alignItems: 'flex-end', paddingBottom: SPACING.md,
    },
    moodChartItem: { alignItems: 'center', width: 30 },
    moodChartDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
    moodChartDay: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, ...FONTS.medium },
    moodLogItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
    moodLogEmoji: { fontSize: 32, marginRight: SPACING.md },
    moodLogInfo: { flex: 1 },
    moodLogDate: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, ...FONTS.medium },
    moodLogNote: { color: COLORS.text, fontSize: FONT_SIZES.sm, marginTop: 2 },
    moodBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm },
    moodBadgeText: { fontSize: 10, ...FONTS.bold },
    journalItem: { marginHorizontal: SPACING.lg, padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, ...SHADOWS.small },
    journalTitle: { fontSize: FONT_SIZES.md, ...FONTS.bold, color: COLORS.text },
    journalDate: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
    journalPreview: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.sm },

    // Chart & Modal
    chartContainer: { alignItems: 'center', marginHorizontal: SPACING.lg },
    chartHint: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: -SPACING.sm, marginBottom: SPACING.md },
    emptyChart: { padding: SPACING.xl, alignItems: 'center' },
    emptyText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOWS.medium },
    modalTitle: { fontSize: FONT_SIZES.xl, ...FONTS.bold, color: COLORS.text, textAlign: 'center' },
    modalDate: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
    modalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    detailItem: { width: '45%', marginBottom: SPACING.md, alignItems: 'center', padding: SPACING.sm, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md },
    detailValue: { fontSize: FONT_SIZES.lg, ...FONTS.bold, color: COLORS.text },
    detailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
    closeBtn: { marginTop: SPACING.md, backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
    closeBtnText: { color: COLORS.white, ...FONTS.bold },
});
