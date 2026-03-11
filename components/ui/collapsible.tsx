import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const icon = useThemeColor({}, 'icon');

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.heading, pressed && styles.headingPressed]}
        onPress={() => setIsOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}>
        <IconSymbol
          name="chevron.right"
          size={16}
          weight="medium"
          color={icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </Pressable>
      {isOpen ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  headingPressed: {
    opacity: 0.7,
  },
  content: {
    marginTop: Spacing.sm,
    width: '100%',
    backgroundColor: 'transparent',
  },
});
