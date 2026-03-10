// Food Log Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, MEAL_TYPES } from '../../theme';
import { Header, AnimatedButton, Chip, StyledInput } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import db from '../../services/database';
import { FOOD_DATABASE } from '../../data/seedData';
import { format } from 'date-fns';

export default function FoodLogScreen({ navigation, route }) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMealType, setSelectedMealType] = useState('lunch');
    const [selectedFood, setSelectedFood] = useState(null);
    const [portion, setPortion] = useState('1');
    const [saving, setSaving] = useState(false);

    useFocusEffect(useCallback(() => {
        if (route.params?.preselectedFood) {
            setSelectedFood(route.params.preselectedFood);
            // Clear params so it doesn't re-select on every focus
            navigation.setParams({ preselectedFood: null });
        }
    }, [route.params]));

    const filteredFoods = FOOD_DATABASE.filter(f => {
        const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMeal = f.category === selectedMealType || selectedMealType === 'all';
        return matchesSearch && matchesMeal;
    });

    async function handleSave() {
        if (!selectedFood) {
            Alert.alert('Select Food', 'Please select a food item first');
            return;
        }
        setSaving(true);
        const portionNum = parseFloat(portion) || 1;
        try {
            await db.addFoodLog({
                userId: user.id,
                date: format(new Date(), 'yyyy-MM-dd'),
                mealType: selectedMealType,
                foodName: selectedFood.name,
                calories: Math.round(selectedFood.calories * portionNum),
                protein: Math.round(selectedFood.protein * portionNum),
                carbs: Math.round(selectedFood.carbs * portionNum),
                fat: Math.round(selectedFood.fat * portionNum),
                portion: portionNum,
                isVeg: selectedFood.isVeg,
            });
            Alert.alert('Success! ✅', `${selectedFood.name} logged successfully`, [
                { text: 'Log More', onPress: () => { setSelectedFood(null); setSearchQuery(''); } },
                { text: 'Done', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            Alert.alert('Error', 'Failed to log food');
        }
        setSaving(false);
    }

    return (
        <View style={styles.container}>
            <Header title="Log Food" subtitle="What did you eat?" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* Meal Type Selector */}
                <Text style={styles.label}>Meal Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {MEAL_TYPES.map(m => (
                        <Chip
                            key={m.id}
                            label={`${m.id === 'breakfast' ? '🌅' : m.id === 'lunch' ? '☀️' : m.id === 'snack' ? '🍪' : '🌙'} ${m.label}`}
                            selected={selectedMealType === m.id}
                            onPress={() => setSelectedMealType(m.id)}
                            color={COLORS.primary}
                        />
                    ))}
                </ScrollView>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search food items..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Selected food detail */}
                {selectedFood && (
                    <View style={styles.selectedCard}>
                        <View style={styles.selectedHeader}>
                            <View style={[styles.vegBadge, { backgroundColor: selectedFood.isVeg ? COLORS.success + '22' : COLORS.error + '22' }]}>
                                <Text style={{ fontSize: 12 }}>{selectedFood.isVeg ? '🟢' : '🔴'}</Text>
                            </View>
                            <Text style={styles.selectedName}>{selectedFood.name}</Text>
                            <TouchableOpacity onPress={() => setSelectedFood(null)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.nutrientGrid}>
                            <View style={styles.nutrientItem}>
                                <Text style={[styles.nutrientValue, { color: COLORS.coral }]}>
                                    {Math.round(selectedFood.calories * (parseFloat(portion) || 1))}
                                </Text>
                                <Text style={styles.nutrientLabel}>Calories</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                                <Text style={[styles.nutrientValue, { color: COLORS.primary }]}>
                                    {Math.round(selectedFood.protein * (parseFloat(portion) || 1))}g
                                </Text>
                                <Text style={styles.nutrientLabel}>Protein</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                                <Text style={[styles.nutrientValue, { color: COLORS.accent }]}>
                                    {Math.round(selectedFood.carbs * (parseFloat(portion) || 1))}g
                                </Text>
                                <Text style={styles.nutrientLabel}>Carbs</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                                <Text style={[styles.nutrientValue, { color: COLORS.orange }]}>
                                    {Math.round(selectedFood.fat * (parseFloat(portion) || 1))}g
                                </Text>
                                <Text style={styles.nutrientLabel}>Fat</Text>
                            </View>
                        </View>

                        <View style={styles.portionRow}>
                            <Text style={styles.portionLabel}>Portion:</Text>
                            {['0.5', '1', '1.5', '2'].map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.portionBtn, portion === p && styles.portionBtnActive]}
                                    onPress={() => setPortion(p)}
                                >
                                    <Text style={[styles.portionBtnText, portion === p && styles.portionBtnTextActive]}>{p}x</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <AnimatedButton
                            title={saving ? "Saving..." : "Log This Meal"}
                            onPress={handleSave}
                            disabled={saving}
                            icon="✅"
                            style={{ marginTop: SPACING.lg }}
                        />
                    </View>
                )}

                {/* Food list */}
                <Text style={styles.label}>
                    {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} Items
                    {searchQuery ? ` matching "${searchQuery}"` : ''}
                </Text>
                {filteredFoods.map((food, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.foodItem, selectedFood?.name === food.name && styles.foodItemSelected]}
                        onPress={() => setSelectedFood(food)}
                    >
                        <View style={[styles.vegDot, { backgroundColor: food.isVeg ? COLORS.success : COLORS.error }]} />
                        <View style={styles.foodInfo}>
                            <Text style={styles.foodName}>{food.name}</Text>
                            <Text style={styles.foodMeta}>
                                P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
                            </Text>
                        </View>
                        <View style={styles.foodCalBadge}>
                            <Text style={styles.foodCalText}>{food.calories}</Text>
                            <Text style={styles.foodCalUnit}>kcal</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredFoods.length === 0 && (
                    <Text style={styles.noResults}>No food items found 🥺</Text>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
    content: { paddingBottom: SPACING.huge },
    label: {
        fontSize: FONT_SIZES.sm, ...FONTS.semiBold, color: COLORS.textSecondary,
        paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.md,
    },
    chipScroll: { paddingLeft: SPACING.lg, marginBottom: SPACING.sm },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md, marginTop: SPACING.md,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    searchIcon: { fontSize: 16, marginRight: SPACING.sm },
    searchInput: { flex: 1, color: COLORS.text, fontSize: FONT_SIZES.md, paddingVertical: SPACING.md },
    clearIcon: { color: COLORS.textMuted, fontSize: 16, padding: SPACING.sm },
    selectedCard: {
        marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary + '44',
    },
    selectedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
    vegBadge: { padding: 4, borderRadius: 6, marginRight: SPACING.sm },
    selectedName: { flex: 1, color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.bold },
    closeBtn: { color: COLORS.textMuted, fontSize: 18, padding: SPACING.sm },
    nutrientGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.md },
    nutrientItem: { alignItems: 'center' },
    nutrientValue: { fontSize: FONT_SIZES.xl, ...FONTS.bold },
    nutrientLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
    portionRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: SPACING.lg, gap: SPACING.sm,
    },
    portionLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, ...FONTS.medium, marginRight: SPACING.sm },
    portionBtn: {
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    portionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    portionBtnText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium },
    portionBtnTextActive: { color: COLORS.text },
    foodItem: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg,
        paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
    },
    foodItemSelected: { backgroundColor: COLORS.primary + '11', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md },
    vegDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.md },
    foodInfo: { flex: 1 },
    foodName: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.medium },
    foodMeta: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
    foodCalBadge: { alignItems: 'center' },
    foodCalText: { color: COLORS.coral, fontSize: FONT_SIZES.lg, ...FONTS.bold },
    foodCalUnit: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
    noResults: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xxl, fontSize: FONT_SIZES.md },
});
