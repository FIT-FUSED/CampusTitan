// Home Dashboard Screen
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS, MOOD_EMOJIS } from '../../theme';
import { GradientCard, StatCard, SectionHeader, Avatar, ProgressBar } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import db from '../../services/database';
import sensorService from '../../services/SensorService';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const MOTIVATIONAL_QUOTES = [
    "The only bad workout is the one that didn't happen. 💪",
    "Your body can stand almost anything. It's your mind you have to convince. 🧠",
    "Take care of your body. It's the only place you have to live. 🏠",
    "Fitness is not about being better than someone else. It's about being better than you used to be. ⭐",
    "The secret of getting ahead is getting started. 🚀",
];

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 });
    const [todayActivity, setTodayActivity] = useState({ minutes: 0, burned: 0, count: 0 });
    const [todayMood, setTodayMood] = useState(null);
    const [steps, setSteps] = useState(0);
    const [envData, setEnvData] = useState(null);
    const [weeklyActivity, setWeeklyActivity] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [quote] = useState(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    const today = format(new Date(), 'yyyy-MM-dd');

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            // Today's food
            const foods = await db.getFoodLogs(user.id);
            const todayFoods = foods.filter(f => f.date === today);
            const totals = todayFoods.reduce((acc, f) => ({
                calories: acc.calories + (f.calories || 0),
                protein: acc.protein + (f.protein || 0),
                carbs: acc.carbs + (f.carbs || 0),
                fat: acc.fat + (f.fat || 0),
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
            setTodayStats({ ...totals, meals: todayFoods.length });

            // Today's activity
            const activities = await db.getActivities(user.id);
            const todayActs = activities.filter(a => a.date === today);
            setTodayActivity({
                minutes: todayActs.reduce((s, a) => s + (a.duration || 0), 0),
                burned: todayActs.reduce((s, a) => s + (a.caloriesBurned || 0), 0),
                count: todayActs.length,
            });

            // Recent activities
            setRecentActivities(activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));

            // Weekly activity for sparkline
            const last7 = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = format(d, 'yyyy-MM-dd');
                const dayActs = activities.filter(a => a.date === dateStr);
                last7.push(dayActs.reduce((s, a) => s + (a.duration || 0), 0));
            }
            setWeeklyActivity(last7);

            // Today's mood
            const moods = await db.getMoodLogs(user.id);
            const todayMoodLog = moods.find(m => m.date === today);
            setTodayMood(todayMoodLog);

            // Env data
            const env = await db.getEnvData();
            if (env.length > 0) {
                setEnvData(env.sort((a, b) => b.date.localeCompare(a.date))[0]);
            }
        } catch (e) {
            console.error('Load error:', e);
        }
    }, [user, today]);

    useEffect(() => { loadData(); }, [loadData]);

    // useEffect(() => {
    //     sensorService.startTracking((s) => setSteps(s));
    //     return () => sensorService.stopTracking();
    // }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const calorieGoal = 2000;
    const calorieProgress = Math.min((todayStats.calories / calorieGoal) * 100, 100);
    const activityGoal = 45;
    const activityProgress = Math.min((todayActivity.minutes / activityGoal) * 100, 100);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Avatar name={user?.name} color={user?.avatarColor || COLORS.primary} size={48} />
                        <View style={styles.headerText}>
                            <Text style={styles.greeting}>{greeting()}</Text>
                            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'} 👋</Text>
                        </View>
                    </View>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{format(new Date(), 'dd MMM')}</Text>
                    </View>
                </View>

                {/* Quote Card */}
                <GradientCard gradient={COLORS.gradientPrimary} style={styles.quoteCard}>
                    <Text style={styles.quoteText}>{quote}</Text>
                </GradientCard>

                {/* Today's Overview */}
                <SectionHeader title="Today's Overview" />
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Calories"
                        value={todayStats.calories}
                        unit="kcal"
                        icon="🔥"
                        color={COLORS.coral}
                        subtitle={`${Math.round(calorieProgress)}% of ${calorieGoal} goal`}
                    />
                    <StatCard
                        title="Activity"
                        value={todayActivity.minutes}
                        unit="min"
                        icon="⚡"
                        color={COLORS.accent}
                        subtitle={`${Math.round(activityProgress)}% of ${activityGoal}min goal`}
                    />
                </View>
                <View style={[styles.statsGrid, { marginTop: SPACING.md }]}>
                    <StatCard
                        title="Steps"
                        value={steps}
                        unit=""
                        icon="👟"
                        color={COLORS.primary}
                        subtitle="Real-time tracking"
                        onPress={async () => {
                            const granted = await sensorService.requestPermissions();
                            if (granted) {
                                await sensorService.incrementStep((s) => setSteps(s));
                            }
                        }}
                    />
                    <StatCard
                        title="AQI"
                        value={envData?.aqi || '—'}
                        icon="🌍"
                        color={envData?.aqi > 100 ? COLORS.error : COLORS.success}
                        subtitle={envData?.aqi > 150 ? 'Bad — Stay indoors' : envData?.aqi > 100 ? 'Moderate' : 'Good for exercise'}
                    />
                </View>

                {/* Progress Bars */}
                <SectionHeader title="Daily Goals" />
                <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>🔥 Calories</Text>
                        <Text style={styles.progressValue}>{todayStats.calories}/{calorieGoal}</Text>
                    </View>
                    <ProgressBar progress={calorieProgress} color={COLORS.coral} />

                    <View style={[styles.progressRow, { marginTop: SPACING.lg }]}>
                        <Text style={styles.progressLabel}>⚡ Activity</Text>
                        <Text style={styles.progressValue}>{todayActivity.minutes}/{activityGoal} min</Text>
                    </View>
                    <ProgressBar progress={activityProgress} color={COLORS.accent} />

                    <View style={[styles.progressRow, { marginTop: SPACING.lg }]}>
                        <Text style={styles.progressLabel}>🥗 Meals Logged</Text>
                        <Text style={styles.progressValue}>{todayStats.meals}/4</Text>
                    </View>
                    <ProgressBar progress={(todayStats.meals / 4) * 100} color={COLORS.primary} />
                </View>

                {/* Macros */}
                <SectionHeader title="Macros Today" />
                <View style={styles.macroRow}>
                    {[
                        { label: 'Protein', value: todayStats.protein, color: COLORS.primary, unit: 'g' },
                        { label: 'Carbs', value: todayStats.carbs, color: COLORS.accent, unit: 'g' },
                        { label: 'Fat', value: todayStats.fat, color: COLORS.coral, unit: 'g' },
                    ].map((macro, i) => (
                        <View key={i} style={styles.macroItem}>
                            <View style={[styles.macroDot, { backgroundColor: macro.color }]} />
                            <Text style={styles.macroValue}>{Math.round(macro.value)}{macro.unit}</Text>
                            <Text style={styles.macroLabel}>{macro.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Weekly Activity Sparkline */}
                <SectionHeader title="Weekly Activity" />
                <View style={styles.sparkline}>
                    {weeklyActivity.map((val, i) => {
                        const maxVal = Math.max(...weeklyActivity, 1);
                        const barHeight = Math.max((val / maxVal) * 60, 4);
                        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                        return (
                            <View key={i} style={styles.sparklineBar}>
                                <View style={[styles.sparklineBarFill, {
                                    height: barHeight,
                                    backgroundColor: i === 6 ? COLORS.primary : COLORS.surfaceElevated,
                                }]} />
                                <Text style={styles.sparklineLabel}>{days[i]}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Recent Activities */}
                <SectionHeader title="Recent Activity" />
                {recentActivities.length === 0 ? (
                    <Text style={styles.noData}>No activities yet. Start tracking!</Text>
                ) : (
                    recentActivities.map((act, i) => (
                        <View key={i} style={styles.activityItem}>
                            <View style={[styles.activityDot, { backgroundColor: COLORS.chartColors[i % 7] }]} />
                            <View style={styles.activityInfo}>
                                <Text style={styles.activityType}>{act.type?.charAt(0).toUpperCase() + act.type?.slice(1)}</Text>
                                <Text style={styles.activityMeta}>{act.date} · {act.duration}min · {act.caloriesBurned}kcal</Text>
                            </View>
                        </View>
                    ))
                )}

                {/* Environment Quick View */}
                {envData && (
                    <>
                        <SectionHeader title="Campus Environment" />
                        <GradientCard gradient={COLORS.gradientCard} style={styles.envCard}>
                            <View style={styles.envRow}>
                                <View style={styles.envItem}>
                                    <Text style={styles.envEmoji}>🌡️</Text>
                                    <Text style={styles.envValue}>{envData.temperature}°C</Text>
                                    <Text style={styles.envLabel}>Temp</Text>
                                </View>
                                <View style={styles.envItem}>
                                    <Text style={styles.envEmoji}>💨</Text>
                                    <Text style={styles.envValue}>AQI {envData.aqi}</Text>
                                    <Text style={styles.envLabel}>Air</Text>
                                </View>
                                <View style={styles.envItem}>
                                    <Text style={styles.envEmoji}>💧</Text>
                                    <Text style={styles.envValue}>{envData.humidity}%</Text>
                                    <Text style={styles.envLabel}>Humidity</Text>
                                </View>
                                <View style={styles.envItem}>
                                    <Text style={styles.envEmoji}>🔊</Text>
                                    <Text style={styles.envValue}>{envData.noiseLevel}dB</Text>
                                    <Text style={styles.envLabel}>Noise</Text>
                                </View>
                            </View>
                        </GradientCard>
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerText: { marginLeft: SPACING.md },
    greeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    userName: { fontSize: FONT_SIZES.xl, ...FONTS.bold, color: COLORS.text },
    dateBadge: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    dateText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium },
    quoteCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
    quoteText: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.medium, lineHeight: 22 },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
    },
    progressSection: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    progressLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium },
    progressValue: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    macroItem: { alignItems: 'center' },
    macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: SPACING.sm },
    macroValue: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.bold },
    macroLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
    sparkline: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        paddingBottom: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        height: 110,
    },
    sparklineBar: { alignItems: 'center' },
    sparklineBarFill: {
        width: 28,
        borderRadius: BORDER_RADIUS.sm,
        marginBottom: SPACING.sm,
    },
    sparklineLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glassBorder,
    },
    activityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: SPACING.md,
    },
    activityInfo: { flex: 1 },
    activityType: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.medium },
    activityMeta: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, marginTop: 2 },
    envCard: { marginHorizontal: SPACING.lg },
    envRow: { flexDirection: 'row', justifyContent: 'space-around' },
    envItem: { alignItems: 'center' },
    envEmoji: { fontSize: 24, marginBottom: SPACING.sm },
    envValue: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.bold },
    envLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
    noData: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
});
