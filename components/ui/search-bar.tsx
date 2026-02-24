import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Shadows } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type SearchBarProps = TextInputProps;

export function SearchBar(props: SearchBarProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, { backgroundColor: surface, borderColor: border }]}>
      <MaterialIcons name="search" size={20} color={tint} />
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? 'Barre de recherche'}
        placeholderTextColor={mutedText}
        style={[styles.input, { color: text }]}
        returnKeyType="search"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.card,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
