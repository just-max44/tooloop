import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    getExchangeMessagesByLoanId,
    getExchangePassByLoanId,
    sendExchangeMessageRemote,
} from '@/lib/backend/data';
import { sendChatMessageResilient } from '@/lib/domain/exchange-actions';
import { canOpenChat, getChatBlockedReason } from '@/lib/domain/exchange-status';
import { notifyEvent } from '@/lib/notifications/events';
import { showAppNotice } from '@/stores/app-notice-store';
import { useBackendStore } from '@/stores/backend-store';

export default function ExchangeChatScreen() {
  const INBOX_LOANS = useBackendStore((s) => s.inboxLoans);
  const EXCHANGE_CHAT_MESSAGES = useBackendStore((s) => s.exchangeChatMessages);
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const insets = useSafeAreaInsets();

  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const softSurface = `${surface}F2`;
  const softBorder = `${border}AA`;

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [INBOX_LOANS, loanId]);
  const pass = useMemo(() => (loanId ? getExchangePassByLoanId(loanId) : undefined), [loanId]);
  const loanState = useMemo(() => {
    if (!loan) {
      return undefined;
    }
    return loan.state;
  }, [loan]);
  const chatAllowed = useMemo(() => {
    if (!loanState) {
      return false;
    }
    return canOpenChat(loanState);
  }, [loanState]);

  const [messages, setMessages] = useState(() => (loanId ? getExchangeMessagesByLoanId(loanId) : []));
  const [draftMessage, setDraftMessage] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const messagesScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!loanId) {
      setMessages([]);
      return;
    }

    setMessages(getExchangeMessagesByLoanId(loanId));
  }, [EXCHANGE_CHAT_MESSAGES, loanId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;
      setKeyboardOffset(Math.max(0, keyboardHeight - insets.bottom));
      requestAnimationFrame(() => {
        messagesScrollRef.current?.scrollToEnd({ animated: true });
      });
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom]);

  useEffect(() => {
    requestAnimationFrame(() => {
      messagesScrollRef.current?.scrollToEnd({ animated: false });
    });
  }, [messages.length]);

  const canSend = draftMessage.trim().length > 0;

  const sendMessage = async () => {
    if (!canSend || !loanId) {
      return;
    }

    const trimmedText = draftMessage.trim();
    setDraftMessage('');

    const didSend = await sendChatMessageResilient({
      loanId,
      text: trimmedText,
      sendRemotely: sendExchangeMessageRemote,
      restoreDraft: setDraftMessage,
      notifyRemoteFailure: () => {
        showAppNotice('Envoi impossible pour le moment. Réessaie dans quelques instants.', 'error');
      },
    });

    if (!didSend) {
      return;
    }

    if (loan) {
      void notifyEvent({
        type: 'new_message_received',
        loanId: loan.id,
        objectName: loan.objectName,
        otherUserName: loan.otherUserName,
      });
    }
  };

  if (!loan || !chatAllowed) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Chat indisponible</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              {getChatBlockedReason(loanState ?? 'pending')}
            </ThemedText>
            <Button label="Retour Échanges" onPress={() => router.push('/(tabs)/inbox')} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        <View style={[styles.chatLayout, { paddingBottom: keyboardOffset }]}>
          <Card style={styles.headerCard}>
            <ThemedText type="subtitle">{loan.objectName}</ThemedText>
            <ThemedText style={{ color: mutedText }}>Avec {loan.otherUserName}</ThemedText>
            {pass ? (
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                RDV: {pass.meetupLabel} · {pass.locationLabel}
              </ThemedText>
            ) : null}
          </Card>

          <ScrollView
            ref={messagesScrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => messagesScrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.length === 0 ? (
              <Card style={styles.card}>
                <ThemedText type="defaultSemiBold">Commence la discussion</ThemedText>
                <ThemedText style={{ color: mutedText }}>
                  Utilise ce chat pour valider l’heure et le lieu de la rencontre.
                </ThemedText>
              </Card>
            ) : (
              messages.map((message) => {
                const isMine = message.sender === 'me';
                const isSystem = message.sender === 'system';

                if (isSystem) {
                  return (
                    <View key={message.id} style={styles.systemRow}>
                      <ThemedText style={[styles.systemText, { color: mutedText }]}>{message.text}</ThemedText>
                    </View>
                  );
                }

                return (
                  <View key={message.id} style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
                    <View
                      style={[
                        styles.messageBubble,
                        {
                          backgroundColor: isMine ? `${tint}18` : softSurface,
                          borderColor: isMine ? `${tint}55` : softBorder,
                        },
                      ]}>
                      <ThemedText style={{ color: text }}>{message.text}</ThemedText>
                      <ThemedText style={[styles.messageTime, { color: mutedText }]}>{message.timeLabel}</ThemedText>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View
            style={[
              styles.composerWrap,
              { borderColor: softBorder, backgroundColor: softSurface, paddingBottom: Math.max(insets.bottom, Spacing.sm) },
            ]}>
            <TextInput
              value={draftMessage}
              onChangeText={setDraftMessage}
              placeholder="Écrire un message..."
              placeholderTextColor={mutedText}
              style={[styles.composerInput, { color: text }]}
              multiline
              maxLength={280}
            />
            <Pressable
              onPress={sendMessage}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le message"
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: canSend ? tint : `${tint}55`,
                },
                pressed && canSend ? styles.pressedFeedback : null,
              ]}>
              <ThemedText type="defaultSemiBold" style={styles.sendButtonLabel}>
                Envoyer
              </ThemedText>
            </Pressable>
          </View>
        </View>
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
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  chatLayout: {
    flex: 1,
    gap: Spacing.md,
  },
  headerCard: {
    gap: 8,
  },
  card: {
    gap: 8,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    gap: 12,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 5,
  },
  messageTime: {
    fontSize: 11,
  },
  systemRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
  },
  composerWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
  },
  composerInput: {
    minHeight: 44,
    maxHeight: 120,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  sendButton: {
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendButtonLabel: {
    color: '#FFFFFF',
  },
  pressedFeedback: {
    opacity: 0.9,
  },
});
