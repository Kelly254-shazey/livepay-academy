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
  background: '#f5efe8',
  backgroundAccent: '#eadccf',
  surface: '#fffaf6',
  surfaceMuted: '#f4e8de',
  surfaceElevated: '#ffffff',
  border: '#dcccbf',
  borderSubtle: '#eaded3',
  text: '#1b1717',
  textSecondary: '#5e5048',
  textMuted: '#8d7d72',
  accent: '#9a6b42',
  accentHover: '#845633',
  accentMuted: '#f2e2d2',
  primary: '#9a6b42',
  primarySoft: '#efe0d0',
  success: '#5c8f78',
  successMuted: '#deeee4',
  warning: '#b8812f',
  warningMuted: '#f8e8ca',
  danger: '#c26652',
  dangerMuted: '#f6ddd7',
  error: '#c26652',
  info: '#476c9b',
  infoMuted: '#dce6f3',
  overlay: 'rgba(27, 23, 23, 0.08)',
};

const darkColors = {
  background: '#0d1117',
  backgroundAccent: '#161c24',
  surface: '#151b23',
  surfaceMuted: '#1b2430',
  surfaceElevated: '#1d2630',
  border: '#313d4c',
  borderSubtle: '#27313e',
  text: '#f4efe8',
  textSecondary: '#d3c5b7',
  textMuted: '#9c9187',
  accent: '#f0c987',
  accentHover: '#dfb266',
  accentMuted: '#3a2f20',
  primary: '#f0c987',
  primarySoft: '#2e261d',
  success: '#7cc6a5',
  successMuted: '#183126',
  warning: '#f0b24f',
  warningMuted: '#4a3317',
  danger: '#f38c78',
  dangerMuted: '#49231d',
  error: '#f38c78',
  info: '#7aa2d6',
  infoMuted: '#1b2e45',
  overlay: 'rgba(244, 239, 232, 0.08)',
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
