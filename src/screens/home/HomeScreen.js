// Home Dashboard — Premium Bento Layout
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions, Platform,
    RefreshControl, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../../theme';
import { Avatar } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import db from '../../services/database';
import sensorService from '../../services/SensorService';
import { format } from 'date-fns';

const { width: W } = Dimensions.get('window');
const CARD_GAP = 10;
const BENTO_W = (W - SPACING.lg * 2 - CARD_GAP) / 2;

// Circular Progress Ring (pure View, no SVG needed)
function ProgressRing({ progress, size = 80, strokeWidth = 6, color, children }) {
    const radius = (size - strokeWidth) / 2;
    const clamp = Math.min(Math.max(progress, 0), 100);
    // We use 4 quarter-circle segments clipped to simulate a ring
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {/* Background ring */}
            <View style={{
                position: 'absolute', width: size, height: size,
                borderRadius: size / 2, borderWidth: strokeWidth,
                borderColor: COLORS.surfaceLight,
            }} />
            {/* Filled ring - top */}
            {clamp > 0 && (
                <View style={{
                    position: 'absolute', width: size, height: size,
                    borderRadius: size / 2, borderWidth: strokeWidth,
                    borderColor: 'transparent',
                    borderTopColor: color || COLORS.primary,
                    borderRightColor: clamp > 25 ? color || COLORS.primary : 'transparent',
                    borderBottomColor: clamp > 50 ? color || COLORS.primary : 'transparent',
                    borderLeftColor: clamp > 75 ? color || COLORS.primary : 'transparent',
                    transform: [{ rotate: '-45deg' }],
                }} />
            )}
            {/* Center content */}
            <View style={{ alignItems: 'center' }}>
                {children}
            </View>
        </View>
    );
}

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 });
    const [todayActivity, setTodayActivity] = useState({ minutes: 0, burned: 0, count: 0 });
    const [todayMood, setTodayMood] = useState(null);
    const [steps, setSteps] = useState(0);
    const [weeklyActivity, setWeeklyActivity] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    const today = format(new Date(), 'yyyy-MM-dd');

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            const foods = await db.getFoodLogs(user.id);
            const todayFoods = foods.filter(f => f.date === today);
            const totals = todayFoods.reduce((acc, f) => ({
                calories: acc.calories + (f.calories || 0),
                protein: acc.protein + (f.protein || 0),
                carbs: acc.carbs + (f.carbs || 0),
                fat: acc.fat + (f.fat || 0),
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
            setTodayStats({ ...totals, meals: todayFoods.length });

            const activities = await db.getActivities(user.id);
            const todayActs = activities.filter(a => a.date === today);
            setTodayActivity({
                minutes: todayActs.reduce((s, a) => s + (a.duration || 0), 0),
                burned: todayActs.reduce((s, a) => s + (a.caloriesBurned || 0), 0),
                count: todayActs.length,
            });
            setRecentActivities(activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3));

            const last7 = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = format(d, 'yyyy-MM-dd');
                const dayActs = activities.filter(a => a.date === dateStr);
                last7.push(dayActs.reduce((s, a) => s + (a.duration || 0), 0));
            }
            setWeeklyActivity(last7);

            const moods = await db.getMoodLogs(user.id);
            setTodayMood(moods.find(m => m.date === today));
        } catch (e) {
            console.error('Load error:', e);
        }
    }, [user, today]);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const calorieGoal = 2000;
    const calProg = Math.min((todayStats.calories / calorieGoal) * 100, 100);
    const actGoal = 45;
    const actProg = Math.min((todayActivity.minutes / actGoal) * 100, 100);

    const hour = new Date().getHours();
    const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';
    const greetText = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <View style={s.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* ─── HERO GREETING ─── */}
                <View style={s.hero}>
                    <View style={s.heroTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.heroGreet}>{greetText} {greetEmoji}</Text>
                            <Text style={s.heroName}>{user?.name?.split(' ')[0] || 'User'}</Text>
                            {!!user?.college && (
                                <View style={s.heroBadge}>
                                    <Text style={s.heroBadgeText}>{user.college}</Text>
                                </View>
                            )}
                        </View>
                        <View style={s.heroRight}>
                            <Avatar name={user?.name} color={COLORS.primary} size={52} />
                            <Text style={s.heroDate}>{format(new Date(), 'dd MMM')}</Text>
                        </View>
                    </View>
                </View>

                {/* ─── QUIZ CTA ─── */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('WellnessQuiz')}
                    style={s.quizCard}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.accent]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={s.quizGradient}
                    >
                        <View style={s.quizContent}>
                            <Text style={s.quizEmoji}>🧠</Text>
                            <View style={{ flex: 1, marginLeft: SPACING.md }}>
                                <Text style={s.quizTitle}>Daily Wellness Check</Text>
                                <Text style={s.quizSub}>Earn points & train your AI predictor!</Text>
                            </View>
                            <View style={s.quizBtn}>
                                <Text style={s.quizBtnText}>Start</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* ─── BENTO GRID ─── */}
                <View style={s.bentoGrid}>
                    {/* Row 1: Two rings side by side */}
                    <View style={s.bentoRow}>
                        {/* Calories Ring */}
                        <View style={[s.bentoCard, s.bentoHalf]}>
                            <ProgressRing progress={calProg} size={76} strokeWidth={5} color={COLORS.coral}>
                                <Text style={s.ringValue}>{todayStats.calories}</Text>
                                <Text style={s.ringUnit}>kcal</Text>
                            </ProgressRing>
                            <Text style={s.bentoLabel}>Calories</Text>
                            <Text style={s.bentoSub}>{Math.round(calProg)}% of {calorieGoal}</Text>
                        </View>

                        {/* Activity Ring */}
                        <View style={[s.bentoCard, s.bentoHalf]}>
                            <ProgressRing progress={actProg} size={76} strokeWidth={5} color={COLORS.accent}>
                                <Text style={s.ringValue}>{todayActivity.minutes}</Text>
                                <Text style={s.ringUnit}>min</Text>
                            </ProgressRing>
                            <Text style={s.bentoLabel}>Activity</Text>
                            <Text style={s.bentoSub}>{Math.round(actProg)}% of {actGoal}m</Text>
                        </View>
                    </View>

                    {/* Row 2: Full-width macro strip */}
                    <LinearGradient
                        colors={[COLORS.surface, COLORS.surfaceLight]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.macroStrip}
                    >
                        {[
                            { label: 'Protein', val: todayStats.protein, color: COLORS.primary, suffix: 'g' },
                            { label: 'Carbs', val: todayStats.carbs, color: COLORS.accent, suffix: 'g' },
                            { label: 'Fat', val: todayStats.fat, color: COLORS.coral, suffix: 'g' },
                            { label: 'Meals', val: todayStats.meals, color: COLORS.orange, suffix: '/4' },
                        ].map((m, i) => (
                            <View key={i} style={s.macroCell}>
                                <View style={[s.macroIndicator, { backgroundColor: m.color }]} />
                                <Text style={s.macroVal}>{Math.round(m.val)}{m.suffix}</Text>
                                <Text style={s.macroLbl}>{m.label}</Text>
                            </View>
                        ))}
                    </LinearGradient>

                    {/* Row 3: Steps tall card + Mood small card */}
                    <View style={s.bentoRow}>
                        {/* Steps - tall card */}
                        <TouchableOpacity
                            style={[s.bentoCard, s.bentoHalf, s.bentoTall]}
                            activeOpacity={0.8}
                            onPress={async () => {
                                const granted = await sensorService.requestPermissions();
                                if (granted) await sensorService.incrementStep((st) => setSteps(st));
                            }}
                        >
                            <LinearGradient
                                colors={COLORS.gradientPrimary}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={s.stepsGradient}
                            >
                                <Text style={s.stepsIcon}>👟</Text>
                                <Text style={s.stepsValue}>{steps.toLocaleString()}</Text>
                                <Text style={s.stepsLabel}>Steps Today</Text>
                                <Text style={s.stepsTap}>tap to sync</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Mood + Quick Info Stack */}
                        <View style={[s.bentoHalf, { gap: CARD_GAP }]}>
                            <View style={s.bentoCard}>
                                <Text style={s.moodEmoji}>
                                    {todayMood ? ['😢', '😔', '😐', '🙂', '😄'][todayMood.mood - 1] : '🫥'}
                                </Text>
                                <Text style={s.bentoLabel}>
                                    {todayMood ? ['Bad', 'Low', 'Okay', 'Good', 'Great'][todayMood.mood - 1] : 'No mood'}
                                </Text>
                            </View>
                            <View style={s.bentoCard}>
                                <Text style={s.burnValue}>{todayActivity.burned}</Text>
                                <Text style={s.burnUnit}>kcal burned</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ─── WEEKLY BAR CHART ─── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Weekly Activity</Text>
                    <View style={s.barChart}>
                        {weeklyActivity.map((val, i) => {
                            const maxVal = Math.max(...weeklyActivity, 1);
                            const h = Math.max((val / maxVal) * 70, 3);
                            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                            const isToday = i === 6;
                            return (
                                <View key={i} style={s.barCol}>
                                    <LinearGradient
                                        colors={isToday ? COLORS.gradientPrimary : [COLORS.surfaceElevated, COLORS.surfaceElevated]}
                                        style={[s.bar, { height: h }]}
                                    />
                                    <Text style={[s.barLabel, isToday && { color: COLORS.primary, ...FONTS.bold }]}>
                                        {days[i]}
                                    </Text>
                                    {isToday && <View style={s.barDot} />}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ─── RECENT ACTIVITY ─── */}
                {recentActivities.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Recent Activity</Text>
                        {recentActivities.map((act, i) => (
                            <View key={i} style={s.actRow}>
                                <View style={[s.actIcon, { backgroundColor: COLORS.chartColors[i % 7] + '20' }]}>
                                    <Text style={{ fontSize: 16 }}>
                                        {act.type === 'running' ? '🏃' : act.type === 'gym' ? '🏋️' : act.type === 'cycling' ? '🚴' : act.type === 'yoga' ? '🧘' : '⚡'}
                                    </Text>
                                </View>
                                <View style={s.actInfo}>
                                    <Text style={s.actType}>{act.type?.charAt(0).toUpperCase() + act.type?.slice(1)}</Text>
                                    <Text style={s.actMeta}>{act.duration}min · {act.caloriesBurned}kcal</Text>
                                </View>
                                <Text style={s.actDate}>{act.date?.slice(5)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 40 },

    // ─── Hero ───
    hero: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
    heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
    heroGreet: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, ...FONTS.medium, letterSpacing: 1, textTransform: 'uppercase' },
    heroName: { fontSize: 32, ...FONTS.extraBold, color: COLORS.text, marginTop: 2, letterSpacing: -0.5 },
    heroBadge: {
        alignSelf: 'flex-start', marginTop: SPACING.sm,
        backgroundColor: COLORS.primary + '18', paddingHorizontal: SPACING.md,
        paddingVertical: 3, borderRadius: BORDER_RADIUS.round,
        borderWidth: 1, borderColor: COLORS.primary + '30',
    },
    heroBadgeText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, ...FONTS.semiBold },
    heroRight: { alignItems: 'center' },
    heroDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, ...FONTS.medium, marginTop: 4 },

    // ─── Quiz CTA ───
    quizCard: {
        marginHorizontal: SPACING.lg, marginBottom: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl, overflow: 'hidden',
        ...SHADOWS.medium,
    },
    quizGradient: { padding: SPACING.lg },
    quizContent: { flexDirection: 'row', alignItems: 'center' },
    quizEmoji: { fontSize: 36 },
    quizTitle: { fontSize: FONT_SIZES.md, ...FONTS.bold, color: COLORS.textInverse },
    quizSub: { fontSize: FONT_SIZES.xs, ...FONTS.medium, color: COLORS.textInverse, opacity: 0.8, marginTop: 2 },
    quizBtn: {
        backgroundColor: COLORS.textInverse, paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round
    },
    quizBtnText: { color: COLORS.primary, ...FONTS.bold, fontSize: FONT_SIZES.sm },

    // ─── Bento ───
    bentoGrid: { paddingHorizontal: SPACING.lg, gap: CARD_GAP },
    bentoRow: { flexDirection: 'row', gap: CARD_GAP },
    bentoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    bentoHalf: { width: BENTO_W },
    bentoTall: { paddingVertical: 0, overflow: 'hidden' },
    bentoLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.semiBold, marginTop: SPACING.sm },
    bentoSub: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },

    // ─── Rings ───
    ringValue: { fontSize: FONT_SIZES.xl, ...FONTS.extraBold, color: COLORS.text },
    ringUnit: { fontSize: 9, color: COLORS.textMuted, ...FONTS.medium, marginTop: -2 },

    // ─── Macro strip ───
    macroStrip: {
        flexDirection: 'row',
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    macroCell: { flex: 1, alignItems: 'center' },
    macroIndicator: { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
    macroVal: { fontSize: FONT_SIZES.md, ...FONTS.bold, color: COLORS.text },
    macroLbl: { fontSize: 9, color: COLORS.textMuted, ...FONTS.medium, marginTop: 1 },

    // ─── Steps ───
    stepsGradient: {
        flex: 1, width: '100%',
        borderRadius: BORDER_RADIUS.xl - 1,
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: SPACING.lg,
    },
    stepsIcon: { fontSize: 28 },
    stepsValue: { fontSize: 28, ...FONTS.extraBold, color: COLORS.textInverse, marginTop: 4 },
    stepsLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textInverse, ...FONTS.semiBold, opacity: 0.8 },
    stepsTap: { fontSize: 9, color: COLORS.textInverse, opacity: 0.5, marginTop: 4, ...FONTS.medium },

    // ─── Mood ───
    moodEmoji: { fontSize: 32 },

    // ─── Burn ───
    burnValue: { fontSize: FONT_SIZES.xxl, ...FONTS.extraBold, color: COLORS.coral },
    burnUnit: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, ...FONTS.medium },

    // ─── Section ───
    section: {
        marginTop: SPACING.xl,
        marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    sectionTitle: { fontSize: FONT_SIZES.md, ...FONTS.bold, color: COLORS.text, marginBottom: SPACING.md },

    // ─── Bar chart ───
    barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
    barCol: { alignItems: 'center', flex: 1 },
    bar: { width: 22, borderRadius: 11, marginBottom: 6 },
    barLabel: { fontSize: 10, color: COLORS.textMuted, ...FONTS.medium },
    barDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 3 },

    // ─── Activity ───
    actRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
    },
    actIcon: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        marginRight: SPACING.md,
    },
    actInfo: { flex: 1 },
    actType: { fontSize: FONT_SIZES.md, ...FONTS.semiBold, color: COLORS.text },
    actMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
    actDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, ...FONTS.medium },
});
