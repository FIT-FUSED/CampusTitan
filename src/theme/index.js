import { Platform } from 'react-native';

// CampusTitan Design System — Power Blue & Energetic Orange (Fitness Theme)
export const COLORS = {
  // Primary — Power Blue
  primary: '#0077B6',
  primaryLight: '#48A9D6',
  primaryDark: '#005A8C',

  // Accent — Energetic Orange
  accent: '#FF6B35',
  accentLight: '#FF8F66',
  accentDark: '#E5501F',

  // Warm accents
  coral: '#FF6B35',
  coralLight: '#FF8F66',
  orange: '#FF8C00',
  orangeLight: '#FFB347',

  // Background — Light Blue Tint
  background: '#F0F7FF',
  surface: '#FFFFFF',
  surfaceLight: '#E3F2FD',
  surfaceElevated: '#BBDEFB',

  // Text — Deep Blue Gray
  text: '#1A2B3C',
  textSecondary: '#455A64',
  textMuted: '#78909C',
  textInverse: '#FFFFFF',

  // Status
  success: '#00C853',
  warning: '#FF8C00',
  error: '#FF3D00',
  info: '#0077B6',

  // Glassmorphism — subtle cloudy for light mode
  glass: 'rgba(0, 119, 182, 0.02)',
  glassBorder: 'rgba(0, 119, 182, 0.08)',
  glassHighlight: 'rgba(0, 119, 182, 0.12)',

  // Chart colors — energetic fitness palette
  chartColors: ['#0077B6', '#FF6B35', '#00C853', '#FF8C00', '#9C27B0', '#E91E63', '#00BCD4'],

  // Gradients
  gradientPrimary: ['#0077B6', '#005A8C'],
  gradientAccent: ['#FF6B35', '#E5501F'],
  gradientCoral: ['#FF6B35', '#E5501F'],
  gradientSunset: ['#FF8C00', '#FF6B35'],
  gradientOcean: ['#0077B6', '#00BCD4'],
  gradientDark: ['#F0F7FF', '#E3F2FD'],
  gradientCard: ['#FFFFFF', '#F0F7FF'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 36,
  mega: 48,
};

export const FONTS = {
  light: { fontWeight: '300' },
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extraBold: { fontWeight: '800' },
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const SHADOWS = {
  small: Platform.select({
    ios: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    web: { boxShadow: '0px 2px 4px rgba(0,119,182,0.08)' },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 5 },
    web: { boxShadow: '0px 4px 8px rgba(0,119,182,0.12)' },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0px 8px 16px rgba(0,119,182,0.15)' },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0px 0px 15px rgba(0,119,182,0.3)' },
  }),
};

export const CARD_STYLE = {
  backgroundColor: '#FFFFFF',
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1,
  borderColor: '#E3F2FD',
  padding: SPACING.lg,
  ...SHADOWS.small,
};

export const GLASS_STYLE = {
  backgroundColor: COLORS.glass,
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1,
  borderColor: COLORS.glassBorder,
  padding: SPACING.lg,
  overflow: 'hidden',
};

// Mood emojis — fitness energy palette
export const MOOD_EMOJIS = [
  { emoji: '😄', label: 'Great', value: 5, color: '#00C853' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#4CAF50' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#FF8C00' },
  { emoji: '😔', label: 'Low', value: 2, color: '#FF6B35' },
  { emoji: '😢', label: 'Bad', value: 1, color: '#FF3D00' },
];

// Activity types — fitness palette
export const ACTIVITY_TYPES = [
  { id: 'gym', label: 'Gym Workout', icon: 'fitness-center', color: '#0077B6' },
  { id: 'running', label: 'Running', icon: 'directions-run', color: '#FF6B35' },
  { id: 'cycling', label: 'Cycling', icon: 'pedal-bike', color: '#FF8C00' },
  { id: 'sports', label: 'Sports', icon: 'sports-soccer', color: '#00C853' },
  { id: 'yoga', label: 'Yoga', icon: 'self-improvement', color: '#9C27B0' },
  { id: 'swimming', label: 'Swimming', icon: 'pool', color: '#00BCD4' },
  { id: 'walking', label: 'Walking', icon: 'directions-walk', color: '#48A9D6' },
  { id: 'other', label: 'Other', icon: 'sports', color: '#E91E63' },
];

// Meal types
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'free-breakfast', time: '7:00 - 9:30' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant', time: '12:00 - 14:00' },
  { id: 'snack', label: 'Snack', icon: 'local-cafe', time: 'Anytime' },
  { id: 'dinner', label: 'Dinner', icon: 'dinner-dining', time: '19:00 - 21:00' },
];

