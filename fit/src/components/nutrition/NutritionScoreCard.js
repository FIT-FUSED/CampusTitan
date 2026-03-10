import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';

const { width } = Dimensions.get('window');

export default function NutritionScoreCard({ nutritionData, foodName }) {
  if (!nutritionData) return null;

  const { score, grade, calories, protein, carbs, fat, fiber } = nutritionData;
  const gradeColor = getGradeColor(grade);

  return (
    <View style={styles.container}>
      {/* Header with Food Name and Score */}
      <View style={styles.header}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{foodName}</Text>
          <Text style={styles.calories}>{calories} kcal</Text>
        </View>
        <View style={[styles.gradeCircle, { backgroundColor: gradeColor }]}>
          <Text style={styles.gradeText}>{grade}</Text>
          <Text style={styles.scoreText}>{Math.round(score)}</Text>
        </View>
      </View>

      {/* Nutrition Score Bar */}
      <View style={styles.scoreBarContainer}>
        <View style={styles.scoreBarBackground}>
          <LinearGradient
            colors={getScoreGradient(score)}
            style={[styles.scoreBarFill, { width: `${score}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.scoreLabel}>Nutrition Score</Text>
      </View>

      {/* Macro Breakdown */}
      <View style={styles.macroGrid}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>{protein}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>{carbs}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>{fat}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fiber</Text>
          <Text style={styles.macroValue}>{fiber}g</Text>
        </View>
      </View>

      {/* Grade Description */}
      <Text style={styles.description}>{getGradeDescription(grade)}</Text>
    </View>
  );
}

function getGradeColor(grade) {
  const colors = {
    'A': '#10B981',
    'B': '#84CC16', 
    'C': '#F59E0B',
    'D': '#F97316',
    'F': '#EF4444',
  };
  return colors[grade] || '#6B7280';
}

function getScoreGradient(score) {
  if (score >= 80) return ['#10B981', '#34D399'];
  if (score >= 60) return ['#84CC16', '#BEF264'];
  if (score >= 40) return ['#F59E0B', '#FCD34D'];
  if (score >= 20) return ['#F97316', '#FB923C'];
  return ['#EF4444', '#F87171'];
}

function getGradeDescription(grade) {
  const descriptions = {
    'A': 'Excellent nutritional value - rich in nutrients and low in negative components',
    'B': 'Good nutritional value - decent nutrient profile with minimal drawbacks',
    'C': 'Average nutritional value - balanced nutrients with some limitations',
    'D': 'Below average nutritional value - lacking in key nutrients',
    'F': 'Poor nutritional value - high in negative components, low in beneficial nutrients',
  };
  return descriptions[grade] || 'Unknown nutritional value';
}

const styles = StyleSheet.create({
  container: {
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  calories: {
    fontSize: FONT_SIZES.md,
    ...FONTS.medium,
    color: COLORS.textSecondary,
  },
  gradeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradeText: {
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    color: '#FFF',
  },
  scoreText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    color: '#FFF',
    opacity: 0.9,
  },
  scoreBarContainer: {
    marginBottom: SPACING.lg,
  },
  scoreBarBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  macroValue: {
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
    color: COLORS.text,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
