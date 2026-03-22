import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { theme } from '@/theme';

export default function ViewerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 28,
          backgroundColor: 'rgba(248,255,251,0.96)',
          borderTopColor: 'transparent',
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 0,
          elevation: 18,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0px 12px 28px rgba(16,33,29,0.12)' }
            : {
                shadowColor: '#10211D',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.12,
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
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="search-outline" size={size} />,
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
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
