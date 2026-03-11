import { Button } from '@/components/ui/button';
import { useThemeScheme } from '@/context/theme-context';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const ThemeToggle: React.FC = () => {
  const { scheme, setScheme } = useThemeScheme();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mode :</Text>
      <Button
        label={scheme === 'dark' ? 'Sombre' : 'Clair'}
        onPress={() => setScheme(scheme === 'dark' ? 'light' : 'dark')}
      />
      <Button
        label="Auto"
        variant="ghost"
        onPress={() => setScheme('auto')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
