import { Platform } from 'react-native';

function createShadow({
  color,
  x,
  y,
  blur,
  opacity,
  elevation,
}: {
  color: string;
  x: number;
  y: number;
  blur: number;
  opacity: number;
  elevation: number;
}) {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${x}px ${y}px ${blur}px rgba(0,0,0,${opacity})`,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: x, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}

export const theme = {
  colors: {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceMuted: '#f5f5f5',
    surfaceElevated: '#ffffff',
    border: '#e5e5e5',
    borderSubtle: '#f0f0f0',
    text: '#171717',
    textSecondary: '#525252',
    textMuted: '#737373',
    accent: '#0ea5e9',
    accentHover: '#0284c7',
    accentMuted: '#e0f2fe',
    primary: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    error: '#ef4444',
    info: '#3b82f6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  shadow: {
    sm: createShadow({ color: '#000000', x: 0, y: 1, blur: 3, opacity: 0.1, elevation: 2 }),
    md: createShadow({ color: '#000000', x: 0, y: 4, blur: 12, opacity: 0.15, elevation: 4 }),
    lg: createShadow({ color: '#000000', x: 0, y: 8, blur: 25, opacity: 0.15, elevation: 8 }),
  },
  typography: {
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      default: 'Inter',
    }),
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
};
