import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

type AnimatedViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const FadeInView: React.FC<AnimatedViewProps> = ({ children, style }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const surface = useThemeColor({}, 'surface');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[{ opacity: fadeAnim, backgroundColor: surface }, style]}>
      {children}
    </Animated.View>
  );
};

export const SlideInView: React.FC<AnimatedViewProps> = ({ children, style }) => {
  const slideAnim = React.useRef(new Animated.Value(40)).current;
  const surface = useThemeColor({}, 'surface');

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View style={[{ transform: [{ translateY: slideAnim }], backgroundColor: surface }, style]}>
      {children}
    </Animated.View>
  );
};
