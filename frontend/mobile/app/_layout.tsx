import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { AppProviders } from '@/providers/app-providers';
import { RouteGate } from '@/providers/route-gate';
import { useAppTheme, useResolvedThemeMode } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const appTheme = useAppTheme();
  const resolvedThemeMode = useResolvedThemeMode();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: appTheme.colors.background,
        card: appTheme.colors.surface,
        border: appTheme.colors.border,
        text: appTheme.colors.text,
        primary: appTheme.colors.accent,
      },
    }),
    [
      appTheme.colors.accent,
      appTheme.colors.background,
      appTheme.colors.border,
      appTheme.colors.surface,
      appTheme.colors.text,
    ],
  );

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProviders>
      <StatusBar style={resolvedThemeMode === 'dark' ? 'light' : 'dark'} />
      <ThemeProvider value={navigationTheme}>
        <RouteGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(viewer)" />
          <Stack.Screen name="(creator)" />
          <Stack.Screen name="(staff)" />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
