import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { getExchangeMessagesByLoanId, getExchangePassByLoanId, INBOX_LOANS } from '@/data/mock';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getEffectiveLoanState, isExchangeRefused } from '@/stores/proof/closure-store';

export default function ExchangeChatScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const insets = useSafeAreaInsets();

  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [loanId]);
  const pass = useMemo(() => (loanId ? getExchangePassByLoanId(loanId) : undefined), [loanId]);
  const initialMessages = useMemo(() => (loanId ? getExchangeMessagesByLoanId(loanId) : []), [loanId]);
  const loanState = useMemo(() => {
    if (!loan) {
      return undefined;
    }
    return getEffectiveLoanState(loan.id, loan.state);
  }, [loan]);
  const isRefused = useMemo(() => (loanId ? isExchangeRefused(loanId) : false), [loanId]);
  const chatAllowed = !isRefused && (loanState === 'accepted' || loanState === 'completed');

  const [messages, setMessages] = useState(initialMessages);
  const [draftMessage, setDraftMessage] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const messagesScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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

  const sendMessage = () => {
    if (!canSend || !loanId) {
      return;
    }

    const trimmedText = draftMessage.trim();
    setDraftMessage('');

    setMessages((current) => [
      ...current,
      {
        id: `${loanId}-${Date.now()}`,
        loanId,
        sender: 'me',
        text: trimmedText,
        timeLabel: 'Maintenant',
      },
    ]);
  };

  if (!loan || !chatAllowed) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Chat indisponible</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              {isRefused
                ? 'Cette demande a été refusée.'
                : 'Le chat est disponible uniquement après acceptation de la demande.'}
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
                          backgroundColor: isMine ? `${tint}20` : surface,
                          borderColor: isMine ? `${tint}55` : border,
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
              { borderColor: border, backgroundColor: surface, paddingBottom: Math.max(insets.bottom, Spacing.sm) },
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
              style={[
                styles.sendButton,
                {
                  backgroundColor: canSend ? tint : `${tint}55`,
                },
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
  },
  chatLayout: {
    flex: 1,
    gap: Spacing.sm,
  },
  headerCard: {
    gap: 4,
  },
  card: {
    gap: 6,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    gap: 8,
    paddingBottom: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
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
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
  },
  composerInput: {
    minHeight: 40,
    maxHeight: 120,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  sendButton: {
    minHeight: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendButtonLabel: {
    color: '#FFFFFF',
  },
});
