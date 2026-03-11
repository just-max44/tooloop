import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadows } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  const initials = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return initials.join('');
}

export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const border = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: Radius.full,
          borderColor: border,
          backgroundColor: `${tint}14`,
        },
        size >= 48 && Shadows.xs,
      ]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: Radius.full }} />
      ) : (
        <ThemedText
          type="defaultSemiBold"
          style={{ color: tint, fontSize: Math.max(12, size * 0.36), letterSpacing: 0.5 }}>
          {getInitials(name)}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
});
