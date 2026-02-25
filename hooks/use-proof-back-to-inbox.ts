import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useProofBackToInbox() {
  const navigation = useNavigation();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (event) => {
        const actionType = event.data.action.type;
        const isBackGestureOrBackAction = actionType === 'GO_BACK' || actionType === 'POP';

        if (!isBackGestureOrBackAction) {
          return;
        }

        event.preventDefault();
        router.replace('/(tabs)/inbox');
      });

      return unsubscribe;
    }, [navigation, router])
  );
}
