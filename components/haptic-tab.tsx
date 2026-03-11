import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Give lightweight tactile feedback on tab focus.
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        props.onPressIn?.(ev);
      }}
      onPress={(ev) => {
        Haptics.selectionAsync().catch(() => {});
        props.onPress?.(ev);
      }}
    />
  );
}
