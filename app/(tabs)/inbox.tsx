import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { INBOX_LOANS, refreshBackendData, useBackendDataVersion, type LoanDirection } from '@/lib/backend/data';
import { notifyEvent } from '@/lib/notifications/events';
import { isFeedbackSubmitted } from '@/stores/feedback-store';
import { acceptExchange, getEffectiveLoanState, isExchangeRefused, refuseExchange } from '@/stores/proof/closure-store';
import {
    getPickupAcceptedAtLabel,
    getPickupReturnDateLabel,
    getReturnAcceptedAtLabel,
} from '@/stores/proof/return-timing-store';

type ExchangeFilter = LoanDirection | 'completed';

export default function InboxScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const [filter, setFilter] = useState<ExchangeFilter>('incoming');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');
  void refreshKey;

  const filtered = INBOX_LOANS.filter((loan) => {
    const loanState = getEffectiveLoanState(loan.id, loan.state);

    if (filter === 'completed') {
      return loanState === 'completed';
    }

    return loan.direction === filter && loanState !== 'completed';
  });
  const hasItems = filtered.length > 0;
  const pendingFeedbackCount = INBOX_LOANS.filter((loan) => {
    const loanState = getEffectiveLoanState(loan.id, loan.state);
    const isRefused = isExchangeRefused(loan.id);
    const isSuccessfulCompleted = loanState === 'completed' && !isRefused;
    return isSuccessfulCompleted && !isFeedbackSubmitted(loan.id);
  }).length;

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((current) => current + 1);
    }, [])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBackendData();
      setRefreshKey((current) => current + 1);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tint} colors={[tint]} />}>
          <Card style={styles.card}>
            <ThemedText type="title">Échanges</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>Suis tes objets prêtés et empruntés.</ThemedText>
            {filter === 'completed' ? (
              <Badge
                label={
                  pendingFeedbackCount > 0
                    ? `${pendingFeedbackCount} évaluation${pendingFeedbackCount > 1 ? 's' : ''} en attente`
                    : 'Toutes les évaluations sont envoyées'
                }
                variant={pendingFeedbackCount > 0 ? 'danger' : 'primary'}
              />
            ) : null}

            <View style={styles.segmentRow}>
              <Pressable
                onPress={() => setFilter('incoming')}
                accessibilityRole="button"
                accessibilityLabel="Afficher les objets empruntés"
                accessibilityState={{ selected: filter === 'incoming' }}
                style={[
                  styles.segment,
                  {
                    borderColor: filter === 'incoming' ? tint : border,
                    backgroundColor: filter === 'incoming' ? `${tint}22` : surface,
                  },
                ]}>
                <ThemedText type="defaultSemiBold" style={{ color: filter === 'incoming' ? tint : text }}>
                  Empruntés
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setFilter('outgoing')}
                accessibilityRole="button"
                accessibilityLabel="Afficher les objets prêtés"
                accessibilityState={{ selected: filter === 'outgoing' }}
                style={[
                  styles.segment,
                  {
                    borderColor: filter === 'outgoing' ? tint : border,
                    backgroundColor: filter === 'outgoing' ? `${tint}22` : surface,
                  },
                ]}>
                <ThemedText type="defaultSemiBold" style={{ color: filter === 'outgoing' ? tint : text }}>
                  Prêtés
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setFilter('completed')}
                accessibilityRole="button"
                accessibilityLabel="Afficher les échanges terminés"
                accessibilityState={{ selected: filter === 'completed' }}
                style={[
                  styles.segment,
                  {
                    borderColor: filter === 'completed' ? tint : border,
                    backgroundColor: filter === 'completed' ? `${tint}22` : surface,
                  },
                ]}>
                <ThemedText type="defaultSemiBold" style={{ color: filter === 'completed' ? tint : text }}>
                  Terminés
                </ThemedText>
              </Pressable>
            </View>
          </Card>

          <View style={styles.listWrap}>
            {!hasItems ? (
              <Card style={styles.emptyCard}>
                <ThemedText type="defaultSemiBold">Aucun échange ici pour le moment</ThemedText>
                <ThemedText style={{ color: mutedText }}>
                  Change d’onglet ou lance un nouvel emprunt depuis Découvrir.
                </ThemedText>
              </Card>
            ) : null}
            {filtered.map((loan) => {
              const loanState = getEffectiveLoanState(loan.id, loan.state);
              const isPending = loanState === 'pending';
              const isAccepted = loanState === 'accepted';
              const isCompleted = loanState === 'completed';
              const isRefused = isExchangeRefused(loan.id);
              const isSuccessfulCompleted = isCompleted && !isRefused;
              const savedReturnDateLabel = getPickupReturnDateLabel(loan.id);
              const hasSavedReturnDate = savedReturnDateLabel.trim().length > 0;
              const pickupAcceptedDateLabel = getPickupAcceptedAtLabel(loan.id);
              const returnAcceptedDateLabel = getReturnAcceptedAtLabel(loan.id);
              const isCompletedTab = filter === 'completed';
              const feedbackSubmitted = isFeedbackSubmitted(loan.id);
              const needsFeedback = isSuccessfulCompleted && !feedbackSubmitted;
              const canAcceptAsLender = isPending && loan.direction === 'outgoing';
              const canRefuseAsLender = isPending && loan.direction === 'outgoing';
              const chatAllowed = !isRefused && (isAccepted || isCompleted);
              const showOnlyEvaluateInCompleted = isCompletedTab && needsFeedback;
              const hideAllActionsInCompleted = isCompletedTab && isRefused;

              const statusLabel = isRefused
                ? 'Refusé'
                : loanState === 'pending'
                  ? 'En attente'
                  : loanState === 'accepted'
                    ? 'Accepté'
                    : 'Terminé';

              const roleLabel = loan.direction === 'incoming' ? 'Tu empruntes' : 'Tu prêtes';
              const otherLabel = loan.direction === 'incoming' ? `Avec ${loan.otherUserName}` : `Pour ${loan.otherUserName}`;

              const nextStepTitle = isRefused
                ? 'Échange clôturé'
                : canAcceptAsLender
                  ? 'Action requise'
                  : needsFeedback
                    ? 'Action requise'
                    : isAccepted
                      ? 'Prochaine étape'
                      : 'Statut';

              const nextStepText = isRefused
                ? 'Cette demande a été refusée. Aucun chat ou pass actif.'
                : canAcceptAsLender
                  ? 'Accepte ou refuse cette demande pour débloquer la suite.'
                  : needsFeedback
                    ? 'Envoie ton évaluation pour finaliser la confiance.'
                    : isAccepted
                      ? 'Ouvre le pass d’échange pour confirmer la remise et le retour.'
                      : 'En attente de réponse du prêteur.';

              const nextStepTone = isRefused ? danger : canAcceptAsLender || needsFeedback ? danger : tint;
              const nextStepBackground = isRefused ? `${danger}10` : canAcceptAsLender || needsFeedback ? `${danger}0F` : `${tint}12`;
              const nextStepBorder = isRefused ? `${danger}44` : canAcceptAsLender || needsFeedback ? `${danger}44` : `${tint}44`;

              const dueText = isRefused
                ? 'Demande refusée · échange clôturé'
                : isSuccessfulCompleted && feedbackSubmitted
                  ? 'Échange terminé · évaluation envoyée'
                  : isSuccessfulCompleted
                    ? 'Échange terminé · évaluation en attente'
                : loan.state === 'pending' && loanState === 'accepted'
                  ? 'Prêt validé · pass disponible'
                  : loan.dueText;
              const hideDueTextAboveNextStep = !isCompletedTab && /retour prévu/i.test(dueText);

              return (
              <Card
                key={loan.id}
                style={[
                  styles.requestCard,
                  isCompletedTab && isRefused
                    ? { borderColor: `${danger}66`, backgroundColor: `${danger}10` }
                    : null,
                  isCompletedTab && isSuccessfulCompleted
                    ? { borderColor: `${tint}66`, backgroundColor: `${tint}14` }
                    : null,
                ]}>
                <View style={styles.requestHeader}>
                  <View style={styles.headerMainBlock}>
                    <ThemedText type="defaultSemiBold">{loan.objectName}</ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 13 }}>{otherLabel}</ThemedText>
                  </View>
                  <Badge
                    label={statusLabel}
                    variant={isRefused ? 'danger' : (loanState === 'accepted' || isSuccessfulCompleted) ? 'primary' : 'neutral'}
                  />
                </View>

                <View style={styles.metaRow}>
                  <Badge label={roleLabel} variant="neutral" />
                </View>

                {!hideDueTextAboveNextStep ? (
                  <ThemedText style={{ color: mutedText, fontSize: 13 }}>{dueText}</ThemedText>
                ) : null}

                <View style={[styles.nextStepCard, { borderColor: nextStepBorder, backgroundColor: nextStepBackground }]}>
                  <ThemedText type="defaultSemiBold" style={{ color: nextStepTone }}>
                    {nextStepTitle}
                  </ThemedText>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>{nextStepText}</ThemedText>
                </View>

                {isCompletedTab && isSuccessfulCompleted ? (
                  <>
                    {pickupAcceptedDateLabel ? (
                      <ThemedText style={{ color: mutedText, fontSize: 13 }}>Date de remise le {pickupAcceptedDateLabel}</ThemedText>
                    ) : null}
                    {(returnAcceptedDateLabel || hasSavedReturnDate) ? (
                      <ThemedText style={{ color: mutedText, fontSize: 13 }}>
                        Date de retour le {returnAcceptedDateLabel || savedReturnDateLabel}
                      </ThemedText>
                    ) : null}
                  </>
                ) : hasSavedReturnDate && !isRefused ? (
                  <ThemedText style={{ color: mutedText, fontSize: 13 }}>Date de retour convenue le {savedReturnDateLabel}</ThemedText>
                ) : null}

                {isCompletedTab && needsFeedback ? (
                  <View style={[styles.feedbackReminder, { borderColor: `${danger}44`, backgroundColor: `${danger}0F` }]}>
                    <ThemedText type="defaultSemiBold" style={{ color: danger }}>
                      Pense à envoyer ton évaluation
                    </ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      Elle finalise la confiance de l’échange.
                    </ThemedText>
                  </View>
                ) : null}

                {isCompletedTab && isSuccessfulCompleted && feedbackSubmitted ? (
                  <View style={[styles.feedbackDone, { borderColor: `${tint}44`, backgroundColor: `${tint}12` }]}>
                    <ThemedText type="defaultSemiBold" style={{ color: tint }}>
                      Évaluation enregistrée
                    </ThemedText>
                  </View>
                ) : null}

                {(canAcceptAsLender || canRefuseAsLender) && !isCompletedTab ? (
                  <View style={styles.pendingActionsRow}>
                    {canAcceptAsLender ? (
                      <Button
                        label="Accepter"
                        variant="primary"
                        style={styles.acceptAction}
                        accessibilityLabel={`Accepter la demande pour ${loan.objectName}`}
                        onPress={() => {
                          acceptExchange(loan.id);
                          void notifyEvent({
                            type: 'loan_request_accepted',
                            loanId: loan.id,
                            objectName: loan.objectName,
                            otherUserName: loan.otherUserName,
                          });
                          setRefreshKey((current) => current + 1);
                        }}
                      />
                    ) : null}
                    {canRefuseAsLender ? (
                      <Button
                        label="Refuser"
                        variant="secondary"
                        style={[
                          styles.refuseAction,
                          {
                            borderColor: `${danger}66`,
                            backgroundColor: `${danger}16`,
                            elevation: 0,
                            shadowOpacity: 0,
                          },
                        ]}
                        textStyle={{ color: danger }}
                        accessibilityLabel={`Refuser la demande pour ${loan.objectName}`}
                        onPress={() => {
                          refuseExchange(loan.id);
                          setRefreshKey((current) => current + 1);
                        }}
                      />
                    ) : null}
                  </View>
                ) : null}

                {chatAllowed && !isCompletedTab ? (
                  <Button
                    label="Chat"
                    variant="primary"
                    style={styles.primaryAction}
                    accessibilityLabel={`Ouvrir le chat pour ${loan.objectName}`}
                    onPress={() => router.push({ pathname: '/chat/[loanId]', params: { loanId: loan.id } })}
                  />
                ) : !isCompletedTab && !hideAllActionsInCompleted && !showOnlyEvaluateInCompleted ? (
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    {isRefused ? 'Échange refusé · chat fermé.' : 'Chat disponible après acceptation de la demande.'}
                  </ThemedText>
                ) : null}

                {showOnlyEvaluateInCompleted ? (
                  <Button
                    label="Évaluer maintenant"
                    variant="primary"
                    style={styles.secondaryActionButton}
                    textStyle={styles.secondaryActionText}
                    accessibilityLabel={`Évaluer l’échange pour ${loan.objectName}`}
                    onPress={() => router.push({ pathname: '/feedback/[loanId]', params: { loanId: loan.id } })}
                  />
                ) : !isCompletedTab && (isAccepted || isCompleted) ? (
                  <View style={styles.secondaryActionsRow}>
                    <Button
                      label="Pass d’échange"
                      variant="secondary"
                      style={styles.secondaryActionButton}
                      textStyle={styles.secondaryActionText}
                      accessibilityLabel={`Ouvrir le pass d’échange pour ${loan.objectName}`}
                      onPress={() => router.push({ pathname: '/proof/[loanId]', params: { loanId: loan.id } })}
                    />
                    {isSuccessfulCompleted ? (
                      <Button
                        label="Évaluer"
                        variant="secondary"
                        style={styles.secondaryActionButton}
                        textStyle={styles.secondaryActionText}
                        accessibilityLabel={`Évaluer l’échange pour ${loan.objectName}`}
                        onPress={() => router.push({ pathname: '/feedback/[loanId]', params: { loanId: loan.id } })}
                      />
                    ) : null}
                  </View>
                ) : null}
              </Card>
            );
            })}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    gap: 12,
  },
  subtitle: {
    marginTop: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    marginTop: 12,
    gap: 10,
  },
  requestCard: {
    gap: 8,
  },
  emptyCard: {
    gap: 6,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerMainBlock: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  nextStepCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  primaryAction: {
    minHeight: 46,
    marginTop: 2,
  },
  acceptAction: {
    flex: 1,
    minHeight: 44,
  },
  refuseAction: {
    flex: 1,
    minHeight: 44,
  },
  pendingActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackReminder: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  feedbackDone: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  secondaryActionText: {
    fontSize: 14,
  },
});
