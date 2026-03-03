// FitFusion Design System
export const COLORS = {
  // Primary palette
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5A4BD1',

  // Accent colors
  accent: '#00CEC9',
  accentLight: '#55EFC4',
  accentDark: '#00B894',

  // Warm accents
  coral: '#FF6B6B',
  coralLight: '#FF8E8E',
  orange: '#FDCB6E',
  orangeLight: '#FFEAA7',

  // Background (Dark mode first)
  background: '#0A0A1A',
  surface: '#141428',
  surfaceLight: '#1E1E3A',
  surfaceElevated: '#252545',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#6B6B8D',
  textInverse: '#0A0A1A',

  // Status
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#FF6B6B',
  info: '#74B9FF',

  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHighlight: 'rgba(255, 255, 255, 0.15)',

  // Chart colors
  chartColors: ['#6C5CE7', '#00CEC9', '#FF6B6B', '#FDCB6E', '#55EFC4', '#A29BFE', '#74B9FF'],

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#6C5CE7', '#A29BFE'],
  gradientAccent: ['#00CEC9', '#55EFC4'],
  gradientCoral: ['#FF6B6B', '#FF8E8E'],
  gradientSunset: ['#F093FB', '#F5576C'],
  gradientOcean: ['#4FACFE', '#00F2FE'],
  gradientDark: ['#0A0A1A', '#141428'],
  gradientCard: ['rgba(30, 30, 58, 0.8)', 'rgba(20, 20, 40, 0.6)'],
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
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const CARD_STYLE = {
  backgroundColor: 'rgba(20, 20, 40, 0.6)',
  borderRadius: BORDER_RADIUS.lg,
  borderWidth: 1,
  borderColor: COLORS.glassBorder,
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

// Mood emojis
export const MOOD_EMOJIS = [
  { emoji: '😄', label: 'Great', value: 5, color: '#55EFC4' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#00CEC9' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#FDCB6E' },
  { emoji: '😔', label: 'Low', value: 2, color: '#FF8E8E' },
  { emoji: '😢', label: 'Bad', value: 1, color: '#FF6B6B' },
];

// Activity types
export const ACTIVITY_TYPES = [
  { id: 'gym', label: 'Gym Workout', icon: 'fitness-center', color: '#6C5CE7' },
  { id: 'running', label: 'Running', icon: 'directions-run', color: '#00CEC9' },
  { id: 'cycling', label: 'Cycling', icon: 'pedal-bike', color: '#FDCB6E' },
  { id: 'sports', label: 'Sports', icon: 'sports-soccer', color: '#FF6B6B' },
  { id: 'yoga', label: 'Yoga', icon: 'self-improvement', color: '#55EFC4' },
  { id: 'swimming', label: 'Swimming', icon: 'pool', color: '#74B9FF' },
  { id: 'walking', label: 'Walking', icon: 'directions-walk', color: '#A29BFE' },
  { id: 'other', label: 'Other', icon: 'sports', color: '#F093FB' },
];

// Meal types
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'free-breakfast', time: '7:00 - 9:30' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant', time: '12:00 - 14:00' },
  { id: 'snack', label: 'Snack', icon: 'local-cafe', time: 'Anytime' },
  { id: 'dinner', label: 'Dinner', icon: 'dinner-dining', time: '19:00 - 21:00' },
];
