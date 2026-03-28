import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useAppTheme } from '@/theme';

export default function CreatorTabsLayout() {
  const appTheme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: appTheme.colors.accent,
        tabBarInactiveTintColor: appTheme.colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 28,
          backgroundColor: appTheme.colors.surfaceElevated,
          borderTopColor: appTheme.colors.borderSubtle,
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 1,
          elevation: 18,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0px 12px 28px rgba(16,33,29,0.18)' }
            : {
                shadowColor: appTheme.colors.text,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.18,
                shadowRadius: 28,
              }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="speedometer-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="lives"
        options={{
          title: 'Lives',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="radio-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="albums-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="wallet-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="sparkles-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-circle-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
