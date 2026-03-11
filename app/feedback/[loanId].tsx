import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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
import { useThemeColor } from '@/hooks/use-theme-color';
import { FEEDBACK_CRITERIA, FEEDBACK_IMPACT_LABELS } from '@/lib/backend/data';
import { canAccessFeedbackScreen, getExchangeStatusBadge } from '@/lib/domain/exchange-status';
import { showAppNotice } from '@/stores/app-notice-store';
import { useBackendStore } from '@/stores/backend-store';
import {
    isFeedbackSubmitted,
    markFeedbackSubmitted,
    upsertTrustExchangeComment,
} from '@/stores/feedback-store';

export default function FeedbackScreen() {
  const INBOX_LOANS = useBackendStore((s) => s.inboxLoans);
  const PROFILE_USER = useBackendStore((s) => s.profileUser);
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
  const softSurface = `${surface}F2`;
  const softBorder = `${border}AA`;

  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  };

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [INBOX_LOANS, loanId]);
  const loanState = useMemo(() => {
    if (!loan) {
      return undefined;
    }
    return loan.state;
  }, [loan]);
  const alreadySubmitted = useMemo(() => (loanId ? isFeedbackSubmitted(loanId) : false), [loanId]);
  const canAccessScreen = useMemo(() => {
    if (!loanState) {
      return false;
    }
    return canAccessFeedbackScreen(loanState);
  }, [loanState]);

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
    if (!loanId || !loan) {
      return;
    }

    if (alreadySubmitted) {
      showAppNotice('Ton évaluation a déjà été enregistrée pour cet échange.', 'info');
      return;
    }

    if (selectedCriteria.length === 0) {
      showAppNotice('Choisis au moins un signal pour valider ton évaluation.', 'warning');
      return;
    }

    markFeedbackSubmitted(loanId);

    if (comment.trim().length > 0) {
      upsertTrustExchangeComment({
        sourceKey: `feedback-${loanId}`,
        authorName: PROFILE_USER.firstName,
        targetUserName: loan.otherUserName,
        loanObjectName: loan.objectName,
        comment,
        timeLabel: 'Maintenant',
      });
    }

    showAppNotice(`Évaluation envoyée. Note: ${evaluationPercent}%`, 'success');
    router.push('/(tabs)/inbox');
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

  if (!canAccessScreen) {
    const statusBadge = getExchangeStatusBadge(loanState ?? 'pending');

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Feedback indisponible</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              L’évaluation est disponible uniquement après validation complète du retour.
            </ThemedText>
            <Badge label={`Statut: ${statusBadge.label}`} variant={statusBadge.variant} />
            <Button label="Retour Inbox" onPress={() => router.push('/(tabs)/inbox')} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const statusBadge = getExchangeStatusBadge(loanState ?? 'completed');

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
            <ThemedText type="label" style={{ color: tint }}>
              Cloture de l’echange
            </ThemedText>
            <ThemedText type="heading">Retour d’experience</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              {loan.objectName} avec {loan.otherUserName}
            </ThemedText>
            <Badge label={`Statut: ${statusBadge.label}`} variant={statusBadge.variant} />

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
                    style={({ pressed }) => [
                      styles.criterion,
                      {
                        borderColor: active ? tint : softBorder,
                        backgroundColor: active ? `${tint}12` : softSurface,
                      },
                      pressed ? styles.pressedFeedback : null,
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
              style={[styles.input, { color: text, borderColor: softBorder, backgroundColor: softSurface }]}
            />
            <Button
              label={alreadySubmitted ? 'Évaluation déjà envoyée' : 'Envoyer mon feedback'}
              onPress={submitFeedback}
              disabled={alreadySubmitted || selectedCriteria.length === 0}
              accessibilityLabel={alreadySubmitted ? 'Evaluation deja envoyee' : 'Envoyer mon feedback'}
              accessibilityHint="Valide ton evaluation et revient a la liste des echanges"
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
    gap: 14,
    flexGrow: 1,
    paddingBottom: 120,
  },
  card: {
    gap: 12,
  },
  impactRow: {
    gap: 8,
  },
  criteriaWrap: {
    gap: 10,
  },
  criterion: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 12,
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
    minHeight: 112,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pressedFeedback: {
    opacity: 0.88,
  },
});
