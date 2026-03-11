import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type SearchBarProps = TextInputProps;

export function SearchBar(props: SearchBarProps) {
  const surfaceRaised = useThemeColor({}, 'surfaceRaised');
  const borderSubtle = useThemeColor({}, 'borderSubtle');
  const text = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const tint = useThemeColor({}, 'tint');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: surfaceRaised,
          borderColor: isFocused ? tint : borderSubtle,
          borderWidth: isFocused ? 1.5 : 1,
        },
      ]}>
      <MaterialIcons name="search" size={20} color={isFocused ? tint : mutedText} />
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? 'Barre de recherche'}
        placeholderTextColor={mutedText}
        style={[styles.input, { color: text }]}
        returnKeyType="search"
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
