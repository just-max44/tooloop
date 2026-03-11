import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const avatarOptions = [
  require('@/assets/images/optimized/avatar1.png'),
  require('@/assets/images/optimized/avatar2.png'),
  require('@/assets/images/optimized/avatar3.png'),
];

export const ProfilePreferences: React.FC = () => {
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  // Correction : obtenir chaque couleur séparément
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, { backgroundColor: background }]} accessibilityLabel="Préférences du profil"
      >
      <Text style={[styles.title, { color: text }]}>Personnalisation du profil</Text>
      <Text style={[styles.label, { color: text }]}>Avatar</Text>
      <View style={styles.avatarRow}>
        {avatarOptions.map((img, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setAvatar(img)}
            accessible={true}
            accessibilityLabel={`Sélectionner avatar ${idx + 1}`}
            accessibilityRole="button"
          >
            <Image
              source={img}
              style={[styles.avatar, avatar === img && styles.avatarSelected]}
              accessibilityLabel={`Avatar ${idx + 1}`}
            />
          </TouchableOpacity>
        ))}
      </View>
      <ThemeToggle />
      <Button label="Enregistrer" onPress={() => {/* save logic */}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#4CAF50',
  },
});
