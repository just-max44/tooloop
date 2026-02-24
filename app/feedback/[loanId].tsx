import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { FEEDBACK_CRITERIA, FEEDBACK_IMPACT_LABELS, INBOX_LOANS } from '@/data/mock';
import { useThemeColor } from '@/hooks/use-theme-color';
import { isFeedbackSubmitted, markFeedbackSubmitted } from '@/stores/feedback-store';

export default function FeedbackScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');

  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  };

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [loanId]);
  const alreadySubmitted = useMemo(() => (loanId ? isFeedbackSubmitted(loanId) : false), [loanId]);

  const totalCriteriaWeight = useMemo(
    () => FEEDBACK_CRITERIA.reduce((acc, criterion) => acc + criterion.weight, 0),
    []
  );

  const selectedCriteriaWeight = useMemo(() => {
    return selectedCriteria.reduce((acc, criterionId) => {
      const criterion = FEEDBACK_CRITERIA.find((item) => item.id === criterionId);
      return acc + (criterion?.weight ?? 0);
    }, 0);
  }, [selectedCriteria]);

  const evaluationPercent = useMemo(() => {
    if (totalCriteriaWeight === 0) {
      return 0;
    }

    return Math.round((selectedCriteriaWeight / totalCriteriaWeight) * 100);
  }, [selectedCriteriaWeight, totalCriteriaWeight]);

  const impactLabel =
    evaluationPercent >= 80
      ? FEEDBACK_IMPACT_LABELS.high
      : evaluationPercent >= 45
        ? FEEDBACK_IMPACT_LABELS.medium
        : FEEDBACK_IMPACT_LABELS.low;

  const toggleCriterion = (criterionId: string) => {
    setSelectedCriteria((current) =>
      current.includes(criterionId)
        ? current.filter((item) => item !== criterionId)
        : [...current, criterionId],
    );
  };

  const submitFeedback = () => {
    if (!loanId) {
      return;
    }

    if (alreadySubmitted) {
      Alert.alert('Déjà envoyé', 'Ton évaluation a déjà été enregistrée pour cet échange.');
      return;
    }

    if (selectedCriteria.length === 0) {
      Alert.alert('Sélection requise', 'Choisis au moins un signal pour valider ton évaluation.');
      return;
    }

    markFeedbackSubmitted(loanId);

    Alert.alert(
      'Évaluation envoyée',
      `Merci. Note de cet échange: ${evaluationPercent}%`,
      [{ text: 'OK', onPress: () => router.push('/(tabs)/inbox') }],
    );
  };

  if (!loan) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Échange introuvable</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              Impossible d’ouvrir ce feedback pour le moment.
            </ThemedText>
            <Button label="Retour Inbox" onPress={() => router.push('/(tabs)/inbox')} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight - insets.top : 20}>
        <ThemedView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="always"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tint} colors={[tint]} />
            }>
          <Card style={styles.card}>
            <ThemedText type="title">Feedback post-prêt</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              {loan.objectName} avec {loan.otherUserName}
            </ThemedText>

            {alreadySubmitted ? <Badge label="Évaluation déjà envoyée" variant="primary" /> : null}

            <View style={styles.impactRow}>
              <Badge label={impactLabel} variant="primary" />
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                Note actuelle: {evaluationPercent}% · objectif 100% si tout est validé
              </ThemedText>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Ce qui s’est bien passé</ThemedText>
            <View style={styles.criteriaWrap}>
              {FEEDBACK_CRITERIA.map((criterion) => {
                const active = selectedCriteria.includes(criterion.id);
                return (
                  <Pressable
                    key={criterion.id}
                    onPress={() => toggleCriterion(criterion.id)}
                    accessibilityRole="button"
                    accessibilityLabel={criterion.label}
                    accessibilityHint="Ajoute ou retire ce signal de confiance"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.criterion,
                      {
                        borderColor: active ? tint : border,
                        backgroundColor: active ? `${tint}15` : surface,
                      },
                    ]}>
                    <View style={styles.criterionLeft}>
                      <MaterialIcons
                        name={active ? 'check-circle' : 'radio-button-unchecked'}
                        size={16}
                        color={active ? tint : mutedText}
                      />
                      <ThemedText type={active ? 'defaultSemiBold' : 'default'}>{criterion.label}</ThemedText>
                    </View>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      +{Math.round((criterion.weight / totalCriteriaWeight) * 100)}%
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Commentaire (optionnel)</ThemedText>
            <ThemedText style={{ color: mutedText, fontSize: 12 }}>
              Ton commentaire aide la communauté à comprendre la qualité de l’échange.
            </ThemedText>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Ex: échange rapide et très respectueux"
              placeholderTextColor={mutedText}
              multiline
              style={[styles.input, { color: text, borderColor: border, backgroundColor: surface }]}
            />
            <Button
              label={alreadySubmitted ? 'Évaluation déjà envoyée' : 'Envoyer mon feedback'}
              onPress={submitFeedback}
              disabled={alreadySubmitted || selectedCriteria.length === 0}
            />
          </Card>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  content: {
    gap: 12,
    flexGrow: 1,
    paddingBottom: 16,
  },
  card: {
    gap: 10,
  },
  impactRow: {
    gap: 6,
  },
  criteriaWrap: {
    gap: 8,
  },
  criterion: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  criterionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 108,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
