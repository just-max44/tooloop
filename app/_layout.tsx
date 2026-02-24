import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const baseTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors[resolvedTheme].tint,
      background: Colors[resolvedTheme].background,
      card: Colors[resolvedTheme].surface,
      text: Colors[resolvedTheme].text,
      border: Colors[resolvedTheme].border,
    },
  };

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors[resolvedTheme].background).catch(() => {});
  }, [resolvedTheme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          animation: 'fade',
          animationDuration: 320,
          animationMatchesGesture: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
          freezeOnBlur: false,
          contentStyle: { backgroundColor: Colors[resolvedTheme].background },
          headerStyle: { backgroundColor: Colors[resolvedTheme].surface },
          headerTintColor: Colors[resolvedTheme].text,
          headerTitleStyle: { color: Colors[resolvedTheme].text },
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="community"
          options={{ title: 'Activité locale', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="trust"
          options={{ title: 'Confiance locale', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="object/[id]"
          options={{ title: 'Détail objet', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="proof/[loanId]"
          options={{ title: 'Pass d’échange', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="proof/pickup/[loanId]"
          options={{ title: 'Validation prêt', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="proof/pickup-review/[loanId]"
          options={{ title: 'Récapitulatif remise', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="proof/return/[loanId]"
          options={{ title: 'Validation retour', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="proof/return-review/[loanId]"
          options={{ title: 'Récapitulatif retour', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="chat/[loanId]"
          options={{ title: 'Chat', animation: 'fade', animationDuration: 320 }}
        />
        <Stack.Screen
          name="feedback/[loanId]"
          options={{ title: 'Évaluer un échange', animation: 'fade', animationDuration: 320 }}
        />
      </Stack>
      <StatusBar
        style={resolvedTheme === 'dark' ? 'light' : 'dark'}
        backgroundColor={Colors[resolvedTheme].background}
        animated={false}
      />
    </ThemeProvider>
  );
}
