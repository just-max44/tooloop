import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export const LoadingSpinner: React.FC<{ visible: boolean; size?: 'small' | 'large'; }> = ({ visible, size = 'large' }) => {
  const tint = useThemeColor({}, 'tint');
  if (!visible) return null;

  return (
    <View style={styles.overlay} accessibilityLabel="Chargement en cours">
      <ActivityIndicator color={tint} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    zIndex: 100,
  },
});
