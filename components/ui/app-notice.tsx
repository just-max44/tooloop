import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { hideAppNotice, useAppNotice } from '@/stores/app-notice-store';

export function AppNotice() {
  const notice = useAppNotice();

  const tint = useThemeColor({}, 'tint');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
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
        ? success
        : notice.tone === 'warning'
          ? warning
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
        style={[
          styles.card,
          { borderColor: `${toneColor}44`, backgroundColor: surface, borderLeftColor: toneColor },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${toneColor}14` }]}>
          <MaterialIcons name={iconName} size={16} color={toneColor} />
        </View>
        <ThemedText style={[styles.message, { color: text }]}>{notice.message}</ThemedText>
        <MaterialIcons name="close" size={16} color={toneColor} />
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
    paddingHorizontal: Spacing.lg,
    zIndex: 100,
  },
  card: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: Radius.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
