import { Appearance, Platform, useColorScheme } from 'react-native';
import { useSessionStore, type ThemePreference } from '@/store/session-store';

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

const lightColors = {
  background: '#fafafa',
  backgroundAccent: '#f5f5f5',
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
  primarySoft: '#e0f2fe',
  success: '#10b981',
  successMuted: '#d1fae5',
  warning: '#f59e0b',
  warningMuted: '#fef3c7',
  danger: '#ef4444',
  dangerMuted: '#fee2e2',
  error: '#ef4444',
  info: '#3b82f6',
  infoMuted: '#dbeafe',
  overlay: 'rgba(0, 0, 0, 0.04)',
};

const darkColors = {
  background: '#0a0a0a',
  backgroundAccent: '#171717',
  surface: '#171717',
  surfaceMuted: '#262626',
  surfaceElevated: '#1c1c1c',
  border: '#404040',
  borderSubtle: '#2a2a2a',
  text: '#fafafa',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  accent: '#0ea5e9',
  accentHover: '#38bdf8',
  accentMuted: 'rgba(14, 165, 233, 0.1)',
  primary: '#0ea5e9',
  primarySoft: 'rgba(14, 165, 233, 0.12)',
  success: '#10b981',
  successMuted: 'rgba(16, 185, 129, 0.14)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.14)',
  danger: '#ef4444',
  dangerMuted: 'rgba(239, 68, 68, 0.14)',
  error: '#ef4444',
  info: '#3b82f6',
  infoMuted: 'rgba(59, 130, 246, 0.14)',
  overlay: 'rgba(255, 255, 255, 0.05)',
};

const createTheme = (colors: typeof lightColors) => ({
  colors,
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
    sm: createShadow({ color: colors.text, x: 0, y: 6, blur: 16, opacity: 0.12, elevation: 3 }),
    md: createShadow({ color: colors.text, x: 0, y: 12, blur: 28, opacity: 0.16, elevation: 6 }),
    lg: createShadow({ color: colors.text, x: 0, y: 18, blur: 38, opacity: 0.2, elevation: 10 }),
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
});

export const lightTheme = createTheme(lightColors);
export const darkTheme = createTheme(darkColors);

export type Theme = typeof lightTheme;

function normalizeColorScheme(systemScheme: ReturnType<typeof useColorScheme> | ReturnType<typeof Appearance.getColorScheme>) {
  return systemScheme === 'dark' || systemScheme === 'light' ? systemScheme : null;
}

function resolveThemeMode(themePreference: ThemePreference, systemScheme?: 'light' | 'dark' | null) {
  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }

  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function getTheme(themePreference: ThemePreference, systemScheme?: 'light' | 'dark' | null) {
  return resolveThemeMode(themePreference, systemScheme) === 'dark' ? darkTheme : lightTheme;
}

export function useAppTheme() {
  const themePreference = useSessionStore((state) => state.themePreference);
  const systemScheme = useColorScheme();
  return getTheme(themePreference, normalizeColorScheme(systemScheme));
}

export function useResolvedThemeMode() {
  const themePreference = useSessionStore((state) => state.themePreference);
  const systemScheme = useColorScheme();
  return resolveThemeMode(themePreference, normalizeColorScheme(systemScheme));
}

export const theme = new Proxy(lightTheme, {
  get(_target, property) {
    const currentTheme = getTheme(
      useSessionStore.getState().themePreference,
      normalizeColorScheme(Appearance.getColorScheme()),
    );

    return currentTheme[property as keyof Theme];
  },
}) as Theme;
