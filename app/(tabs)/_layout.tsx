import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 240,
          },
        },
        sceneStyle: { backgroundColor: Colors[resolvedTheme].background },
        tabBarActiveTintColor: Colors[resolvedTheme].tint,
        tabBarInactiveTintColor: Colors[resolvedTheme].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.35,
          fontWeight: '500',
        },
        tabBarStyle: {
          position: 'absolute',
          left: Spacing.lg,
          right: Spacing.lg,
          bottom: Platform.OS === 'android' ? Spacing.md : Spacing.sm,
          borderTopColor: Colors[resolvedTheme].borderSubtle,
          borderColor: Colors[resolvedTheme].border,
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: 22,
          backgroundColor: Colors[resolvedTheme].surface,
          height: Platform.OS === 'android' ? 68 : 66,
          paddingTop: Spacing.xs,
          paddingBottom: Platform.OS === 'android' ? Spacing.xs : Spacing.sm,
          ...Shadows.md,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Découvrir',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Publier',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Échanges',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
