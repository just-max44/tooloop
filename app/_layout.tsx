import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AppNotice } from '@/components/ui/app-notice';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthSession } from '@/lib/backend/auth';
import { initializeSupabaseAuthLifecycle } from '@/lib/backend/supabase';
import { promptNotificationPermissionOnFirstLogin } from '@/lib/notifications/service';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { session, isLoading, isBackendConfigured } = useAuthSession();
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

  useEffect(() => {
    initializeSupabaseAuthLifecycle();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }

    promptNotificationPermissionOnFirstLogin(userId).catch(() => {});
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || !isBackendConfigured) {
      return;
    }

    const isOnLogin = pathname === '/login';
    const isOnLegalScreen = pathname.startsWith('/legal/');

    if (!session && !isOnLogin && !isOnLegalScreen) {
      router.replace('/login');
      return;
    }

    if (session && isOnLogin) {
      router.replace('/(tabs)');
    }
  }, [isBackendConfigured, isLoading, pathname, router, session]);

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
        <Stack.Screen name="login" options={{ title: 'Connexion', headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ title: 'Connexion', headerShown: false }} />
        <Stack.Screen name="legal/privacy" options={{ title: 'Politique de confidentialité' }} />
        <Stack.Screen name="legal/terms" options={{ title: 'Conditions générales' }} />
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
          options={{
            title: 'Pass d’échange',
            animation: 'fade',
            animationDuration: 320,
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="proof/pickup/[loanId]"
          options={{
            title: 'Validation prêt',
            animation: 'fade',
            animationDuration: 320,
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="proof/pickup-review/[loanId]"
          options={{
            title: 'Récapitulatif remise',
            animation: 'fade',
            animationDuration: 320,
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="proof/return/[loanId]"
          options={{
            title: 'Validation retour',
            animation: 'fade',
            animationDuration: 320,
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="proof/return-review/[loanId]"
          options={{
            title: 'Récapitulatif retour',
            animation: 'fade',
            animationDuration: 320,
            headerBackVisible: false,
            headerLeft: () => null,
          }}
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
      <AppNotice />
    </ThemeProvider>
  );
}
