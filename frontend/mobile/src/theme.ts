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
    background: '#f4efe7',
    backgroundAccent: '#ebe2d3',
    surface: '#fffaf2',
    surfaceMuted: '#f3ebdf',
    surfaceElevated: '#ffffff',
    border: '#ddd1c0',
    borderSubtle: '#ece2d5',
    text: '#14231f',
    textSecondary: '#435550',
    textMuted: '#72807b',
    accent: '#0f766e',
    accentHover: '#115e59',
    accentMuted: '#d9f0ea',
    primary: '#0f766e',
    primarySoft: '#d8ebe5',
    success: '#1f8a70',
    successMuted: '#d7f0e8',
    warning: '#c9891c',
    warningMuted: '#faebc9',
    danger: '#c6513d',
    dangerMuted: '#f8ddd7',
    error: '#c6513d',
    info: '#2563eb',
    infoMuted: '#dbe7ff',
    overlay: 'rgba(20, 35, 31, 0.08)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    '4xl': 40,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    '2xl': 36,
    pill: 999,
  },
  shadow: {
    sm: createShadow({ color: '#14231f', x: 0, y: 6, blur: 16, opacity: 0.08, elevation: 3 }),
    md: createShadow({ color: '#14231f', x: 0, y: 12, blur: 28, opacity: 0.12, elevation: 6 }),
    lg: createShadow({ color: '#14231f', x: 0, y: 18, blur: 38, opacity: 0.16, elevation: 10 }),
  },
  typography: {
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      default: 'Inter',
    }),
    displayFontFamily: Platform.select({
      ios: 'SpaceMono',
      android: 'SpaceMono',
      default: 'SpaceMono',
    }),
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 32,
      '4xl': 40,
      '5xl': 48,
    },
    weights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
};
