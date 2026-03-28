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
};

const darkColors = {
  background: '#08110f',
  backgroundAccent: '#0f1a18',
  surface: '#101a18',
  surfaceMuted: '#162321',
  surfaceElevated: '#16211f',
  border: '#26403b',
  borderSubtle: '#1f322f',
  text: '#eef8f4',
  textSecondary: '#c7ded7',
  textMuted: '#8faaa2',
  accent: '#48d4bd',
  accentHover: '#2bb7a2',
  accentMuted: '#103d37',
  primary: '#48d4bd',
  primarySoft: '#153a36',
  success: '#4ade80',
  successMuted: '#153428',
  warning: '#fbbf24',
  warningMuted: '#4a3a12',
  danger: '#fb7185',
  dangerMuted: '#431822',
  error: '#fb7185',
  info: '#60a5fa',
  infoMuted: '#172d4e',
  overlay: 'rgba(238, 248, 244, 0.08)',
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
