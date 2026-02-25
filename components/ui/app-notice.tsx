import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { hideAppNotice, useAppNotice } from '@/stores/app-notice-store';

export function AppNotice() {
  const notice = useAppNotice();

  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const surface = useThemeColor({}, 'surface');
  const danger = useThemeColor({}, 'danger');

  if (!notice.visible) {
    return null;
  }

  const toneColor =
    notice.tone === 'error'
      ? danger
      : notice.tone === 'success'
        ? tint
        : notice.tone === 'warning'
          ? tint
          : tint;

  const iconName =
    notice.tone === 'error'
      ? 'error-outline'
      : notice.tone === 'success'
        ? 'check-circle-outline'
        : notice.tone === 'warning'
          ? 'warning-amber'
          : 'info-outline';

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable
        onPress={hideAppNotice}
        accessibilityRole="button"
        accessibilityLabel="Fermer le message"
        style={[styles.card, { borderColor: border, backgroundColor: surface }]}
      >
        <MaterialIcons name={iconName} size={18} color={toneColor} />
        <ThemedText style={{ color: text, flex: 1, fontSize: 13 }}>{notice.message}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
