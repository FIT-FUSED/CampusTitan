import { Platform } from 'react-native';

// CampusTitan Design System — Warm Amber & Emerald on Light Slate
export const COLORS = {
  // Primary — Warm Amber/Gold
  primary: '#F0A500',
  primaryLight: '#FFCB5C',
  primaryDark: '#D4910A',

  // Accent — Emerald Green
  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',

  // Warm accents
  coral: '#EF4444',
  coralLight: '#F87171',
  orange: '#F59E0B',
  orangeLight: '#FCD34D',

  // Background — Premium Off-White
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceLight: '#F1F3F5',
  surfaceElevated: '#E9ECEF',

  // Text — Deep Charcoal
  text: '#1A1A1A',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Glassmorphism — subtle cloudy for light mode
  glass: 'rgba(0, 0, 0, 0.02)',
  glassBorder: 'rgba(0, 0, 0, 0.05)',
  glassHighlight: 'rgba(0, 0, 0, 0.08)',

  // Chart colors — warm diverse palette
  chartColors: ['#F0A500', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6'],

  // Gradients
  gradientPrimary: ['#F0A500', '#D4910A'],
  gradientAccent: ['#10B981', '#059669'],
  gradientCoral: ['#EF4444', '#DC2626'],
  gradientSunset: ['#F59E0B', '#EF4444'],
  gradientOcean: ['#10B981', '#3B82F6'],
  gradientDark: ['#F8F9FA', '#E9ECEF'],
  gradientCard: ['#FFFFFF', '#F8F9FA'],
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 5 },
    web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.08)' },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0px 8px 16px rgba(0,0,0,0.12)' },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: '#F0A500',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0px 0px 15px rgba(240,165,0,0.2)' },
  }),
};

export const CARD_STYLE = {
  backgroundColor: '#FFFFFF',
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1,
  borderColor: '#E9ECEF',
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

// Mood emojis — warm palette
export const MOOD_EMOJIS = [
  { emoji: '😄', label: 'Great', value: 5, color: '#10B981' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#34D399' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#F59E0B' },
  { emoji: '😔', label: 'Low', value: 2, color: '#F87171' },
  { emoji: '😢', label: 'Bad', value: 1, color: '#EF4444' },
];

// Activity types — warm palette
export const ACTIVITY_TYPES = [
  { id: 'gym', label: 'Gym Workout', icon: 'fitness-center', color: '#F0A500' },
  { id: 'running', label: 'Running', icon: 'directions-run', color: '#EF4444' },
  { id: 'cycling', label: 'Cycling', icon: 'pedal-bike', color: '#F59E0B' },
  { id: 'sports', label: 'Sports', icon: 'sports-soccer', color: '#10B981' },
  { id: 'yoga', label: 'Yoga', icon: 'self-improvement', color: '#8B5CF6' },
  { id: 'swimming', label: 'Swimming', icon: 'pool', color: '#3B82F6' },
  { id: 'walking', label: 'Walking', icon: 'directions-walk', color: '#FFCB5C' },
  { id: 'other', label: 'Other', icon: 'sports', color: '#EC4899' },
];

// Meal types
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'free-breakfast', time: '7:00 - 9:30' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant', time: '12:00 - 14:00' },
  { id: 'snack', label: 'Snack', icon: 'local-cafe', time: 'Anytime' },
  { id: 'dinner', label: 'Dinner', icon: 'dinner-dining', time: '19:00 - 21:00' },
];
