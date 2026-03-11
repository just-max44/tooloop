import { useThemeColor } from '@/hooks/use-theme-color';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

export type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarContextProps {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextProps>({ showSnackbar: () => {} });

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');
  const surface = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const success = useThemeColor({}, 'success');
  const danger = useThemeColor({}, 'danger');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showSnackbar = useCallback((msg: string, t: SnackbarType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 3000);
  }, [fadeAnim]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {visible && (
        <Animated.View style={[styles.snackbar, {
          backgroundColor: type === 'success' ? success : type === 'error' ? danger : surface,
          opacity: fadeAnim,
        }]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Snackbar ${type}`}
        >
          <Text style={[styles.text, { color: textColor }]}>{message}</Text>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    zIndex: 100,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
