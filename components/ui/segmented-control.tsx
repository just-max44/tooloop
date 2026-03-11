import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type Segment<T extends string> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  selected: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  segments,
  selected,
  onChange,
}: SegmentedControlProps<T>) {
  const tint = useThemeColor({}, 'tint');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const background = useThemeColor({}, 'background');

  return (
    <View style={[styles.track, { backgroundColor: background, borderColor: border }]}>
      {segments.map((seg) => {
        const active = seg.value === selected;
        return (
          <Pressable
            key={seg.value}
            onPress={() => onChange(seg.value)}
            accessibilityRole="button"
            accessibilityLabel={seg.accessibilityLabel ?? seg.label}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segment,
              active && [styles.activeSegment, { backgroundColor: surface, borderColor: `${tint}44` }],
              pressed && !active && styles.pressed,
            ]}>
            <ThemedText
              type="defaultSemiBold"
              numberOfLines={1}
              style={[styles.label, { color: active ? tint : text }]}>
              {seg.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  activeSegment: {
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
