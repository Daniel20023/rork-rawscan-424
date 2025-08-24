// Modern color palette inspired by Lifesum
export const Colors = {
  // Primary brand colors with bright retro red
  primary: {
    red: '#FF0040',
    brightRed: '#FF0040',
    white: '#FFFFFF',
    lightRed: '#FF4D6D',
  },
  
  // Gradient combinations
  gradients: {
    whiteToRed: ['#FFFFFF', '#FF0040'],
    redToWhite: ['#FF0040', '#FFFFFF'],
    lightRed: ['#FF4D6D', '#FF0040'],
    softWhite: ['#FFFFFF', '#F8F8F8'],
  },
  
  // Health score colors
  health: {
    excellent: '#10B981', // Green
    good: '#22C55E',
    fair: '#F59E0B',      // Yellow/Orange
    poor: '#EF4444',      // Red
    critical: '#DC2626',
  },
  
  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
};

// Typography weights
export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Common spacing values
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius values
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow presets
export const Shadows = {
  card: {
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
};