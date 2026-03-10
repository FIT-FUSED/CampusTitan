// Campus Analytics Screen
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, GradientCard, SectionHeader, Chip, ProgressBar } from '../../components/common';
import db from '../../services/database';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
    const [selectedView, setSelectedView] = useState('hostel');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await db.getCampusAnalytics();
            setAnalytics(data);
        } catch (e) {
            console.error('Analytics load error:', e);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="Campus Analytics" subtitle="Loading..." onBack={() => navigation.goBack()} />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: COLORS.primary }}>Crunching real data...</Text>
                </View>
            </View>
        );
    }

    if (!analytics) return null;

    return (
        <View style={styles.container}>
            <Header title="Campus Analytics" subtitle="Anonymized insights" onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Privacy Notice */}
                <GradientCard gradient={COLORS.gradientCard} style={styles.privacyCard}>
                    <Text style={styles.privacyEmoji}>🔒</Text>
                    <Text style={styles.privacyText}>All analytics are anonymized. No personal data is shared.</Text>
                </GradientCard>

                {/* View Toggle */}
                <View style={styles.toggleRow}>
                    {['hostel', 'department', 'trends'].map(v => (
                        <Chip key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} selected={selectedView === v} onPress={() => setSelectedView(v)} color={COLORS.primary} />
                    ))}
                </View>

                {/* Hostel Comparison */}
                {selectedView === 'hostel' && (
                    <>
                        <SectionHeader title="Hostel-wise Activity (min/day)" />
                        <View style={styles.barChart}>
                            {analytics.hostelStats.map((h, i) => {
                                const maxMin = Math.max(...analytics.hostelStats.map(s => s.avgActivityMinutes));
                                const barH = (h.avgActivityMinutes / maxMin) * 100;
                                return (
                                    <View key={i} style={styles.barItem}>
                                        <Text style={styles.barValue}>{h.avgActivityMinutes}</Text>
                                        <LinearGradient
                                            colors={COLORS.chartColors[i] ? [COLORS.chartColors[i], COLORS.chartColors[i] + '88'] : COLORS.gradientPrimary}
                                            style={[styles.bar, { height: barH }]}
                                        />
                                        <Text style={styles.barLabel}>{h.hostel.replace('Hostel ', '')}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        <SectionHeader title="Hostel Details" />
                        {analytics.hostelStats.map((h, i) => (
                            <View key={i} style={styles.hostelCard}>
                                <View style={styles.hostelHeader}>
                                    <View style={[styles.hostelBadge, { backgroundColor: COLORS.chartColors[i] + '22' }]}>
                                        <Text style={[styles.hostelBadgeText, { color: COLORS.chartColors[i] }]}>{h.hostel.replace('Hostel ', '')}</Text>
                                    </View>
                                    <Text style={styles.hostelName}>{h.hostel}</Text>
                                    <Text style={styles.hostelUsers}>{h.activeUsers} active</Text>
                                </View>
                                <View style={styles.hostelStats}>
                                    <View style={styles.hostelStat}>
                                        <Text style={styles.hostelStatValue}>{h.avgDailySteps}</Text>
                                        <Text style={styles.hostelStatLabel}>Avg Steps</Text>
                                    </View>
                                    <View style={styles.hostelStat}>
                                        <Text style={styles.hostelStatValue}>{h.avgCaloriesConsumed}</Text>
                                        <Text style={styles.hostelStatLabel}>Avg Calories</Text>
                                    </View>
                                    <View style={styles.hostelStat}>
                                        <Text style={styles.hostelStatValue}>{h.avgMoodScore}</Text>
                                        <Text style={styles.hostelStatLabel}>Avg Mood</Text>
                                    </View>
                                    <View style={styles.hostelStat}>
                                        <Text style={styles.hostelStatValue}>{h.participationRate}%</Text>
                                        <Text style={styles.hostelStatLabel}>Participation</Text>
                                    </View>
                                </View>
                                <View style={styles.participationBar}>
                                    <Text style={styles.pbLabel}>Participation</Text>
                                    <ProgressBar progress={h.participationRate} color={COLORS.chartColors[i]} />
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Department Comparison */}
                {selectedView === 'department' && (
                    <>
                        <SectionHeader title="Department Activity" />
                        {analytics.departmentStats.map((d, i) => (
                            <View key={i} style={styles.deptCard}>
                                <View style={styles.deptHeader}>
                                    <Text style={styles.deptName}>{d.department}</Text>
                                    <View style={[styles.deptTopActivity, { backgroundColor: COLORS.chartColors[i] + '22' }]}>
                                        <Text style={[styles.deptTopText, { color: COLORS.chartColors[i] }]}>
                                            {d.topActivity === 'gym' ? '🏋️' : d.topActivity === 'running' ? '🏃' : d.topActivity === 'sports' ? '⚽' : d.topActivity === 'yoga' ? '🧘' : '🚴'} {d.topActivity}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.deptStats}>
                                    <View>
                                        <Text style={styles.deptStatValue}>{d.avgActivityMinutes} min</Text>
                                        <Text style={styles.deptStatLabel}>Avg Activity/Day</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.deptStatValue}>{d.participationRate}%</Text>
                                        <Text style={styles.deptStatLabel}>Participation</Text>
                                    </View>
                                </View>
                                <ProgressBar progress={d.participationRate} color={COLORS.chartColors[i]} style={{ marginTop: SPACING.md }} />
                            </View>
                        ))}
                    </>
                )}

                {/* Weekly Trends */}
                {selectedView === 'trends' && (
                    <>
                        <SectionHeader title="Campus-wide Weekly Trends" />
                        <View style={styles.trendCards}>
                            {analytics.weeklyTrends.map((d, i) => (
                                <View key={i} style={styles.trendCard}>
                                    <Text style={styles.trendDay}>{d.day}</Text>
                                    <View style={styles.trendStats}>
                                        <Text style={styles.trendStat}>🏃 {d.totalActivities}</Text>
                                        <Text style={styles.trendStat}>😊 {d.avgMood}</Text>
                                        <Text style={styles.trendStat}>🔥 {d.avgCalories}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <SectionHeader title="Activity Trend" />
                        <View style={styles.trendChart}>
                            {analytics.weeklyTrends.map((d, i) => {
                                const maxAct = Math.max(...analytics.weeklyTrends.map(t => t.totalActivities));
                                const barH = (d.totalActivities / maxAct) * 80;
                                return (
                                    <View key={i} style={styles.trendBarItem}>
                                        <Text style={styles.trendBarValue}>{d.totalActivities}</Text>
                                        <LinearGradient
                                            colors={COLORS.gradientPrimary}
                                            style={[styles.trendBarFill, { height: barH }]}
                                        />
                                        <Text style={styles.trendBarDay}>{d.day}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        <SectionHeader title="Mood Trend" />
                        <View style={styles.trendChart}>
                            {analytics.weeklyTrends.map((d, i) => {
                                const barH = (parseFloat(d.avgMood) / 5) * 80;
                                return (
                                    <View key={i} style={styles.trendBarItem}>
                                        <Text style={styles.trendBarValue}>{d.avgMood}</Text>
                                        <LinearGradient
                                            colors={COLORS.gradientAccent}
                                            style={[styles.trendBarFill, { height: barH }]}
                                        />
                                        <Text style={styles.trendBarDay}>{d.day}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
    content: { paddingBottom: SPACING.huge },
    privacyCard: { marginHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center' },
    privacyEmoji: { fontSize: 20, marginRight: SPACING.md },
    privacyText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, flex: 1 },
    toggleRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginVertical: SPACING.lg, gap: SPACING.sm },
    barChart: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
        marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface,
        padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder, height: 160,
    },
    barItem: { alignItems: 'center' },
    barValue: { color: COLORS.textMuted, fontSize: 10, marginBottom: 4, ...FONTS.bold },
    bar: { width: 32, borderRadius: BORDER_RADIUS.sm },
    barLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.sm },
    hostelCard: {
        marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    hostelHeader: { flexDirection: 'row', alignItems: 'center' },
    hostelBadge: { width: 32, height: 32, borderRadius: BORDER_RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
    hostelBadgeText: { fontSize: FONT_SIZES.md, ...FONTS.bold },
    hostelName: { flex: 1, color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.semiBold },
    hostelUsers: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
    hostelStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.lg },
    hostelStat: { alignItems: 'center' },
    hostelStatValue: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.bold },
    hostelStatLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
    participationBar: { marginTop: SPACING.md },
    pbLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginBottom: SPACING.xs },
    deptCard: {
        marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    deptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    deptName: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.semiBold },
    deptTopActivity: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
    deptTopText: { fontSize: FONT_SIZES.sm, ...FONTS.medium },
    deptStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
    deptStatValue: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.bold },
    deptStatLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
    trendCards: { paddingHorizontal: SPACING.lg },
    trendCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md, marginBottom: SPACING.sm,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    trendDay: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.bold, minWidth: 40 },
    trendStats: { flexDirection: 'row', gap: SPACING.lg },
    trendStat: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
    trendChart: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
        marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface,
        padding: SPACING.lg, paddingBottom: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.glassBorder, height: 130,
    },
    trendBarItem: { alignItems: 'center' },
    trendBarValue: { color: COLORS.textMuted, fontSize: 9, marginBottom: 4 },
    trendBarFill: { width: 28, borderRadius: BORDER_RADIUS.sm },
    trendBarDay: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.sm },
});
