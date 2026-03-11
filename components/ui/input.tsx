import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { normalizeDisplayText } from '@/lib/i18n/text-normalize';

type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  showError?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isPassword?: boolean;
};

export function Input({
  label,
  error,
  showError = false,
  icon,
  isPassword,
  style,
  ...rest
}: InputProps) {
  const text = useThemeColor({}, 'text');
  const surfaceRaised = useThemeColor({}, 'surfaceRaised');
  const border = useThemeColor({}, 'border');
  const borderSubtle = useThemeColor({}, 'borderSubtle');
  const mutedText = useThemeColor({}, 'mutedText');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  const hasError = showError && !!error;
  const ringColor = hasError ? danger : isFocused ? tint : border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <ThemedText type="caption" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.container,
          {
            backgroundColor: surfaceRaised,
            borderColor: hasError || isFocused ? ringColor : borderSubtle,
            borderWidth: hasError || isFocused ? 1.5 : 1,
          },
        ]}>
        {icon ? <MaterialIcons name={icon} size={18} color={mutedText} style={styles.icon} /> : null}
        <TextInput
          placeholderTextColor={mutedText}
          style={[styles.input, { color: text }, style]}
          placeholder={typeof rest.placeholder === 'string' ? normalizeDisplayText(rest.placeholder) : rest.placeholder}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          secureTextEntry={isPassword ? isSecure : rest.secureTextEntry}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setIsSecure((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            hitSlop={8}
            style={styles.eyeButton}>
            <MaterialIcons
              name={isSecure ? 'visibility-off' : 'visibility'}
              size={20}
              color={mutedText}
            />
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <ThemedText style={[styles.errorText, { color: danger }]}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    paddingLeft: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  eyeButton: {
    paddingLeft: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    paddingLeft: 2,
  },
});
