// Nutrition Screen
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, MEAL_TYPES } from '../../theme';
import { GradientCard, SectionHeader, AnimatedButton, ProgressBar, Chip } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import db from '../../services/database';
import nutritionAnalysis from '../../services/nutritionAnalysis';
import { format, subDays } from 'date-fns';

const { width } = Dimensions.get('window');

export default function NutritionScreen({ navigation }) {
    const { user } = useAuth();
    const [foodLogs, setFoodLogs] = useState([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!user) return;
        const logs = await db.getFoodLogs(user.id);
        setFoodLogs(logs);
    }, [user]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const dayLogs = foodLogs.filter(l => l.date === selectedDate);
    const totals = dayLogs.reduce((acc, l) => ({
        calories: acc.calories + (l.calories || 0),
        protein: acc.protein + (l.protein || 0),
        carbs: acc.carbs + (l.carbs || 0),
        fat: acc.fat + (l.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const calorieGoal = 2000;
    const proteinGoal = 60;
    const carbGoal = 250;
    const fatGoal = 65;

    // Last 7 days calorie data
    const weekData = Array.from({ length: 7 }, (_, i) => {
        const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        const dayTotal = foodLogs.filter(l => l.date === date).reduce((s, l) => s + (l.calories || 0), 0);
        return { date, day: format(subDays(new Date(), 6 - i), 'EEE'), calories: dayTotal };
    });

    // Date selector
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return { date: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE'), num: format(d, 'dd') };
    });

    function getMealsByType(type) {
        return dayLogs.filter(l => l.mealType === type);
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
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Nutrition</Text>
                    <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        <TouchableOpacity
                            style={[styles.logButton, { backgroundColor: COLORS.surfaceElevated }]}
                            onPress={() => navigation.navigate('FoodScanner')}
                        >
                            <Text style={{ fontSize: 18 }}>📷</Text>
                        </TouchableOpacity>
                        <AnimatedButton
                            title="+ Log Food"
                            onPress={() => navigation.navigate('FoodLog')}
                            style={styles.logButton}
                        />
                    </View>
                </View>

                {/* Date Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelector} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
                    {dates.map((d) => (
                        <TouchableOpacity
                            key={d.date}
                            style={[styles.dateItem, selectedDate === d.date && styles.dateItemActive]}
                            onPress={() => setSelectedDate(d.date)}
                        >
                            <Text style={[styles.dateDay, selectedDate === d.date && styles.dateDayActive]}>{d.day}</Text>
                            <Text style={[styles.dateNum, selectedDate === d.date && styles.dateNumActive]}>{d.num}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Calorie Overview */}
                <GradientCard gradient={COLORS.gradientCard} style={styles.calorieCard}>
                    <View style={styles.calorieHeader}>
                        <View>
                            <Text style={styles.calorieLabel}>Calories Consumed</Text>
                            <View style={styles.calorieValueRow}>
                                <Text style={styles.calorieValue}>{Math.round(totals.calories)}</Text>
                                <Text style={styles.calorieGoal}>/ {calorieGoal} kcal</Text>
                            </View>
                        </View>
                        <View style={styles.calorieRing}>
                            <Text style={styles.caloriePercent}>{Math.round((totals.calories / calorieGoal) * 100)}%</Text>
                        </View>
                    </View>
                    <ProgressBar progress={(totals.calories / calorieGoal) * 100} color={COLORS.coral} style={{ marginTop: SPACING.md }} />
                </GradientCard>

                {/* Macros */}
                <SectionHeader title="Macro Breakdown" />
                <View style={styles.macroGrid}>
                    {[
                        { label: 'Protein', value: totals.protein, goal: proteinGoal, color: COLORS.primary, unit: 'g' },
                        { label: 'Carbs', value: totals.carbs, goal: carbGoal, color: COLORS.accent, unit: 'g' },
                        { label: 'Fat', value: totals.fat, goal: fatGoal, color: COLORS.coral, unit: 'g' },
                    ].map((m, i) => (
                        <View key={i} style={styles.macroCard}>
                            <Text style={styles.macroLabel}>{m.label}</Text>
                            <Text style={[styles.macroValue, { color: m.color }]}>{Math.round(m.value)}{m.unit}</Text>
                            <ProgressBar progress={(m.value / m.goal) * 100} color={m.color} height={4} style={{ marginTop: SPACING.sm }} />
                            <Text style={styles.macroGoal}>{Math.round(m.value)}/{m.goal}{m.unit}</Text>
                        </View>
                    ))}
                </View>

                {/* Meals grouped by type */}
                {MEAL_TYPES.map((meal) => {
                    const meals = getMealsByType(meal.id);
                    const mealCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
                    return (
                        <View key={meal.id} style={styles.mealSection}>
                            <View style={styles.mealHeader}>
                                <View style={styles.mealHeaderLeft}>
                                    <Text style={styles.mealEmoji}>
                                        {meal.id === 'breakfast' ? '🌅' : meal.id === 'lunch' ? '☀️' : meal.id === 'snack' ? '🍪' : '🌙'}
                                    </Text>
                                    <View>
                                        <Text style={styles.mealTitle}>{meal.label}</Text>
                                        <Text style={styles.mealTime}>{meal.time}</Text>
                                    </View>
                                </View>
                                <Text style={styles.mealCalories}>{Math.round(mealCalories)} kcal</Text>
                            </View>
                            {meals.length === 0 ? (
                                <Text style={styles.mealEmpty}>No items logged</Text>
                            ) : (
                                meals.map((item, i) => (
                                    <View key={i} style={styles.foodItem}>
                                        <View style={[styles.vegDot, { backgroundColor: item.isVeg ? COLORS.success : COLORS.error }]} />
                                        <View style={styles.foodInfo}>
                                            <Text style={styles.foodName}>{item.foodName}</Text>
                                            {item.nutrition_score && (
                                                <View style={styles.nutritionScore}>
                                                    <Text style={[styles.gradeText, { color: nutritionAnalysis.getGradeColor(item.nutrition_grade) }]}>
                                                        Grade: {item.nutrition_grade}
                                                    </Text>
                                                    <Text style={styles.scoreText}>
                                                        Score: {Math.round(item.nutrition_score)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.foodCalories}>{item.calories} kcal</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    );
                })}

                {/* Weekly Trend */}
                <SectionHeader title="Weekly Calorie Trend" />
                <View style={styles.weekChart}>
                    {weekData.map((d, i) => {
                        const maxCal = Math.max(...weekData.map(w => w.calories), 1);
                        const barH = Math.max((d.calories / maxCal) * 80, 4);
                        const isToday = d.date === format(new Date(), 'yyyy-MM-dd');
                        return (
                            <TouchableOpacity key={i} style={styles.weekBar} onPress={() => setSelectedDate(d.date)}>
                                <Text style={styles.weekCalValue}>{d.calories > 0 ? Math.round(d.calories) : '-'}</Text>
                                <LinearGradient
                                    colors={isToday ? COLORS.gradientPrimary : [COLORS.surfaceElevated, COLORS.surfaceElevated]}
                                    style={[styles.weekBarFill, { height: barH }]}
                                />
                                <Text style={[styles.weekDay, isToday && { color: COLORS.primary }]}>{d.day}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
    },
    headerTitle: { fontSize: FONT_SIZES.xxl, ...FONTS.bold, color: COLORS.text },
    logButton: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
    dateSelector: { marginBottom: SPACING.lg },
    dateItem: {
        alignItems: 'center', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.md, marginRight: SPACING.sm,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassBorder,
        minWidth: 48,
    },
    dateItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dateDay: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, ...FONTS.medium },
    dateDayActive: { color: COLORS.text },
    dateNum: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.bold, marginTop: 2 },
    dateNumActive: { color: COLORS.text },
    calorieCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
    calorieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    calorieLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
    calorieValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: SPACING.xs },
    calorieValue: { color: COLORS.text, fontSize: FONT_SIZES.hero, ...FONTS.bold },
    calorieGoal: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, marginLeft: SPACING.sm },
    calorieRing: {
        width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: COLORS.coral,
        alignItems: 'center', justifyContent: 'center',
    },
    caloriePercent: { color: COLORS.coral, fontSize: FONT_SIZES.sm, ...FONTS.bold },
    macroGrid: {
        flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md,
    },
    macroCard: {
        flex: 1, backgroundColor: COLORS.surface, padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    macroLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, ...FONTS.medium },
    macroValue: { fontSize: FONT_SIZES.xl, ...FONTS.bold, marginTop: SPACING.xs },
    macroGoal: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.xs },
    mealSection: {
        marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder, padding: SPACING.lg,
    },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    mealHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    mealEmoji: { fontSize: 24, marginRight: SPACING.md },
    mealTitle: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.semiBold },
    mealTime: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
    mealCalories: { color: COLORS.coral, fontSize: FONT_SIZES.md, ...FONTS.bold },
    mealEmpty: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, fontStyle: 'italic' },
    foodItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.glassBorder,
    },
    vegDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.md },
    foodInfo: { flex: 1 },
    foodName: { color: COLORS.text, fontSize: FONT_SIZES.md },
    nutritionScore: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
        gap: SPACING.sm,
    },
    gradeText: {
        fontSize: FONT_SIZES.xs,
        ...FONTS.semiBold,
    },
    scoreText: {
        fontSize: FONT_SIZES.xs,
        ...FONTS.medium,
        color: COLORS.textSecondary,
    },
    foodCalories: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
    weekChart: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
        marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface,
        padding: SPACING.lg, paddingBottom: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.glassBorder,
        height: 140,
    },
    weekBar: { alignItems: 'center' },
    weekCalValue: { color: COLORS.textMuted, fontSize: 9, marginBottom: 4 },
    weekBarFill: { width: 28, borderRadius: BORDER_RADIUS.sm },
    weekDay: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: SPACING.sm },
});
