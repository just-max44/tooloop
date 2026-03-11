import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    refreshBackendData,
    setLoanStateRemote,
} from '@/lib/backend/data';
import {
    canAcceptOrRefuseAsLender,
    canOpenFeedback,
    type ExchangeFilter,
    getExchangeStatusBadge,
    getPrimaryAction,
    getRoleLabel,
    isLoanVisibleInFilter,
} from '@/lib/domain/exchange-status';
import { notifyEvent } from '@/lib/notifications/events';
import { useBackendStore } from '@/stores/backend-store';
import { isFeedbackSubmitted } from '@/stores/feedback-store';

const FILTER_SEGMENTS: { value: ExchangeFilter; label: string }[] = [
  { value: 'incoming', label: 'Emprunts' },
  { value: 'outgoing', label: 'Pr\u00eats' },
  { value: 'completed', label: 'Historique' },
];

export default function InboxScreen() {
  const INBOX_LOANS = useBackendStore((s) => s.inboxLoans);
  const DISCOVER_OBJECTS = useBackendStore((s) => s.discoverObjects);
  const EXCHANGE_CHAT_MESSAGES = useBackendStore((s) => s.exchangeChatMessages);
  const router = useRouter();
  const [filter, setFilter] = useState<ExchangeFilter>('incoming');
  const [refreshKey, setRefreshKey] = useState(0);
  const [openMenuLoanId, setOpenMenuLoanId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');
  const softSurface = `${surface}F2`;
  const softBorder = `${border}AA`;
  void refreshKey;

  const filtered = INBOX_LOANS.filter((loan) => {
    const loanState = loan.state;
    return isLoanVisibleInFilter(loanState, loan.direction, filter);
  });
  const hasItems = filtered.length > 0;
  const pendingFeedbackCount = INBOX_LOANS.filter((loan) => {
    const loanState = loan.state;
    return canOpenFeedback(loanState, isFeedbackSubmitted(loan.id));
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
            <ThemedText type="title">\u00c9changes en cours</ThemedText>
            <ThemedText type="caption">Chaque carte correspond \u00e0 un objet.</ThemedText>
            {filter === 'completed' ? (
              <Badge
                label={
                  pendingFeedbackCount > 0
                    ? `${pendingFeedbackCount} \u00e9valuation${pendingFeedbackCount > 1 ? 's' : ''} en attente`
                    : 'Toutes les \u00e9valuations sont envoy\u00e9es'
                }
                variant={pendingFeedbackCount > 0 ? 'danger' : 'primary'}
              />
            ) : null}

            <SegmentedControl
              segments={FILTER_SEGMENTS}
              selected={filter}
              onChange={setFilter}
            />
          </Card>

          <View style={styles.listWrap}>
            {!hasItems ? (
              <EmptyState
                title="Aucun \u00e9change ici"
                description="Change d'onglet ou trouve un objet depuis D\u00e9couvrir."
                icon="swap-horiz"
              />
            ) : null}
            {filtered.map((loan) => {
              const loanState = loan.state;
              const isAccepted = loanState === 'accepted';
              const isCompleted = loanState === 'completed';
              const isRefused = loanState === 'refused';
              const isSuccessfulCompleted = isCompleted && !isRefused;
              const isCompletedTab = filter === 'completed';
              const feedbackSubmitted = isFeedbackSubmitted(loan.id);
              const canAcceptAsLender = canAcceptOrRefuseAsLender(loanState, loan.direction);
              const canRefuseAsLender = canAcceptAsLender;
              const roleLabel = getRoleLabel(loan.direction);
              const { label: statusLabel, variant: statusVariant } = getExchangeStatusBadge(loanState);
              const objectPreview = DISCOVER_OBJECTS.find((item) => item.title === loan.objectName);
              const lastMessage = EXCHANGE_CHAT_MESSAGES.filter((message) => message.loanId === loan.id).at(-1);
              const primaryAction = getPrimaryAction(loanState, feedbackSubmitted);

              const openMainAction = () => {
                if (primaryAction === 'feedback') {
                  router.push({ pathname: '/feedback/[loanId]', params: { loanId: loan.id } });
                  return;
                }

                if (primaryAction === 'chat') {
                  router.push({ pathname: '/chat/[loanId]', params: { loanId: loan.id } });
                  return;
                }

                router.push({ pathname: '/proof/[loanId]', params: { loanId: loan.id } });
              };

              const primaryActionLabel =
                primaryAction === 'feedback'
              const primaryActionDisabled = primaryAction === 'none';
                  ? 'Donner mon avis'
                  : primaryAction === 'chat'
                if (primaryAction === 'none') {
                  return;
                }
                    ? 'Continuer dans le chat'
                    : 'Ouvrir le pass';

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
                  <View style={styles.objectHeader}>
                    <Image
                      source={{
                        uri:
                    : primaryAction === 'proof'
                      ? 'Ouvrir le pass'
                      : loanState === 'refused'
                        ? 'Demande refusée'
                        : 'En attente de réponse';
                          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
                      }}
                      style={styles.objectImage}
                      contentFit="cover"
                    />
                    <View style={styles.headerMainBlock}>
                      <ThemedText type="defaultSemiBold">{loan.objectName}</ThemedText>
                      <ThemedText type="caption">{roleLabel} \u00b7 {loan.otherUserName}</ThemedText>
                      <View style={styles.metaRow}>
                        <Badge label={statusLabel} variant={statusVariant} />
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setOpenMenuLoanId((current) => (current === loan.id ? null : loan.id))}
                      accessibilityRole="button"
                      accessibilityLabel={`Afficher les actions secondaires pour ${loan.objectName}`}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.cardMenuButton,
                        { borderColor: softBorder, backgroundColor: softSurface },
                        pressed ? styles.pressedFeedback : null,
                      ]}>
                      <MaterialIcons name="more-vert" size={18} color={text} />
                    </Pressable>
                  </View>

                  <View style={[styles.lastMessageWrap, { borderColor: softBorder, backgroundColor: `${tint}0C` }]}>
                    <ThemedText type="defaultSemiBold">Dernier message</ThemedText>
                    <ThemedText type="caption">
                      {lastMessage ? `${lastMessage.text} \u00b7 ${lastMessage.timeLabel}` : 'Aucun message pour le moment.'}
                    </ThemedText>
                  </View>

                  {openMenuLoanId === loan.id ? (
                    <View style={[styles.menuActionsWrap, { borderColor: softBorder, backgroundColor: softSurface }]}>
                      {(canAcceptAsLender || canRefuseAsLender) && !isCompletedTab ? (
                        <View style={styles.pendingActionsRow}>
                          {canAcceptAsLender ? (
                            <Button
                              label="Accepter"
                              variant="primary"
                              style={styles.acceptAction}
                              accessibilityLabel={`Accepter l'\u00e9change de ${loan.objectName}`}
                              onPress={async () => {
                                await setLoanStateRemote(loan.id, 'accepted').catch(() => {});
                                void notifyEvent({
                                  type: 'loan_request_accepted',
                                  loanId: loan.id,
                                  objectName: loan.objectName,
                                  otherUserName: loan.otherUserName,
                                });
                                setOpenMenuLoanId(null);
                                setRefreshKey((current) => current + 1);
                              }}
                            />
                          ) : null}
                          {canRefuseAsLender ? (
                            <Button
                              label="Refuser"
                              variant="danger"
                              style={styles.refuseAction}
                              accessibilityLabel={`Refuser l'\u00e9change de ${loan.objectName}`}
                              onPress={async () => {
                                await setLoanStateRemote(loan.id, 'refused').catch(() => {});
                                setOpenMenuLoanId(null);
                                setRefreshKey((current) => current + 1);
                              }}
                            />
                          ) : null}
                        </View>
                      ) : null}

                      {!isRefused && (isAccepted || isCompleted) ? (
                        <Button
                          label="Pass d'\u00e9change"
                          variant="secondary"
                          size="sm"
                          accessibilityLabel={`Voir le pass d'\u00e9change pour ${loan.objectName}`}
                          onPress={() => {
                            setOpenMenuLoanId(null);
                            router.push({ pathname: '/proof/[loanId]', params: { loanId: loan.id } });
                          }}
                        />
                      ) : null}

                      {isSuccessfulCompleted ? (
                        <Button
                          label="\u00c9valuer"
                          variant="secondary"
                          size="sm"
                          accessibilityLabel={`Donner une \u00e9valuation pour ${loan.objectName}`}
                          onPress={() => {
                            setOpenMenuLoanId(null);
                            router.push({ pathname: '/feedback/[loanId]', params: { loanId: loan.id } });
                          }}
                        />
                      ) : null}
                    </View>
                  ) : null}

                  <Button
                    label={primaryActionLabel}
                    variant="primary"
                    accessibilityLabel={`Ouvrir la fiche d'\u00e9change de ${loan.objectName}`}
                    accessibilityHint="Ouvre l'etape principale recommandee pour cet echange"
                    onPress={openMainAction}
                  />
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
                    disabled={primaryActionDisabled}
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingBottom: 120,
  },
  card: {
    width: '100%',
    gap: Spacing.md,
  },
  listWrap: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  requestCard: {
    gap: Spacing.md,
  },
  objectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  objectImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
  headerMainBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cardMenuButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastMessageWrap: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  menuActionsWrap: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  acceptAction: {
    flex: 1,
  },
  refuseAction: {
    flex: 1,
  },
  pendingActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pressedFeedback: {
    opacity: 0.86,
  },
});
