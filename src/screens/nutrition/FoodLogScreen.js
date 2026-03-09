// Food Log Screen
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONTS,
  BORDER_RADIUS,
  MEAL_TYPES,
} from "../../theme";
import { Header, AnimatedButton, Chip } from "../../components/common";
import { useAuth } from "../../services/AuthContext";
import db from "../../services/database";
import { format } from "date-fns";

export default function FoodLogScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedMealType, setSelectedMealType] = useState("lunch");
  const [portion, setPortion] = useState("1");
  const [saving, setSaving] = useState(false);
  // Manual food entry fields
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleSave = async () => {
    if (!foodName || !calories) {
      Alert.alert("Missing Info", "Please enter at least food name and calories.");
      return;
    }
    setSaving(true);
    try {
      const logObject = {
        food_name: foodName,
        calories: parseFloat(calories),
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        meal_type: selectedMealType,
        date: format(new Date(), "yyyy-MM-dd"),
        portion: parseFloat(portion) || 1,
      };
      await db.addFoodLog({
        ...logObject,
        user_id: user?.id,
      });
      Alert.alert("Success", "Food logged successfully.");
      // Reset fields
      setFoodName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setPortion("1");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Log Food"
        subtitle="What did you eat?"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Meal Type Selector */}
        <Text style={styles.label}>Meal Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          {MEAL_TYPES.map((m) => (
            <Chip
              key={m.id}
              label={`${m.id === "breakfast" ? "🌅" : m.id === "lunch" ? "☀️" : m.id === "snack" ? "🍪" : "🌙"} ${m.label}`}
              selected={selectedMealType === m.id}
              onPress={() => setSelectedMealType(m.id)}
              color={COLORS.primary}
            />
          ))}
        </ScrollView>

        {/* Manual Food Entry Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Food Name *</Text>
          <TextInput
            style={styles.input}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="e.g., Grilled Chicken Breast"
          />

          <Text style={styles.label}>Calories *</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="e.g., 250"
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            placeholder="0"
            keyboardType="numeric"
          />
          <Text style={styles.label}>Portion</Text>
          <TextInput
            style={styles.input}
            value={portion}
            onChangeText={setPortion}
            placeholder="1"
            keyboardType="numeric"
          />

          <AnimatedButton
            title={saving ? "Saving..." : "Save Food Log"}
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  content: { paddingBottom: SPACING.huge },
  label: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  chipScroll: { paddingLeft: SPACING.lg, marginBottom: SPACING.sm },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    paddingVertical: SPACING.md,
  },
  clearIcon: { color: COLORS.textMuted, fontSize: 16, padding: SPACING.sm },
  selectedCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  vegBadge: { padding: 4, borderRadius: 6, marginRight: SPACING.sm },
  selectedName: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  closeBtn: { color: COLORS.textMuted, fontSize: 18, padding: SPACING.sm },
  nutrientGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: SPACING.md,
  },
  nutrientItem: { alignItems: "center" },
  nutrientValue: { fontSize: FONT_SIZES.xl, ...FONTS.bold },
  nutrientLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  portionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  portionLabel: {},
  form: {
    padding: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  half: {
    flex: 1,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
});
