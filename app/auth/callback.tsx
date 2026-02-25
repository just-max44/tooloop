import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const tint = useThemeColor({}, 'tint');

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 300);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="small" color={tint} />
          <ThemedText style={{ color: mutedText }}>Finalisation de la connexion…</ThemedText>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    alignItems: 'center',
    gap: 10,
  },
});
