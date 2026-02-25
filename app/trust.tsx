import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuthSession } from '@/lib/backend/auth';
import {
    getProfilePhotoUriByName,
    getSuccessTagsStatus,
    PROFILE_USER,
    TRUST_PROFILE,
    TRUST_PROOFS,
    useBackendDataVersion,
} from '@/lib/backend/data';
import { getTrustExchangeComments } from '@/stores/feedback-store';

export default function TrustScreen() {
  useBackendDataVersion();
  const { session } = useAuthSession();
  const { userName } = useLocalSearchParams<{ userName?: string }>();
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successFilter, setSuccessFilter] = useState<'all' | 'unlocked' | 'pending'>('all');
  const [selectedProfileSuccessId, setSelectedProfileSuccessId] = useState<string | null>(null);
  const [pendingProfileSuccessId, setPendingProfileSuccessId] = useState<string | null>(null);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  };

  const metadata = session?.user?.user_metadata as Record<string, unknown> | undefined;
  const metadataFirstName = typeof metadata?.first_name === 'string' ? metadata.first_name.trim() : '';
  const metadataLastName = typeof metadata?.last_name === 'string' ? metadata.last_name.trim() : '';
  const metadataFullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';
  const profileFallbackName = [PROFILE_USER.firstName, PROFILE_USER.lastName].filter(Boolean).join(' ').trim();
  const sessionName =
    metadataFullName ||
    [metadataFirstName, metadataLastName].filter(Boolean).join(' ').trim() ||
    profileFallbackName ||
    (session?.user?.email?.split('@')[0] ?? 'Mon profil');
  const resolvedName = userName ? String(userName).trim() : sessionName;
  const successTags = getSuccessTagsStatus(TRUST_PROFILE);
  const isOwnProfile = !userName || resolvedName.toLowerCase() === `${PROFILE_USER.firstName} ${PROFILE_USER.lastName}`.toLowerCase();
  const selectableProfileSuccessTags = successTags.filter((tag) => tag.unlocked && (!tag.isHidden || tag.unlocked));
  useEffect(() => {
    if (selectableProfileSuccessTags.length === 0) {
      setSelectedProfileSuccessId(null);
      setPendingProfileSuccessId(null);
      return;
    }

    if (!selectedProfileSuccessId || !selectableProfileSuccessTags.some((tag) => tag.id === selectedProfileSuccessId)) {
      setSelectedProfileSuccessId(selectableProfileSuccessTags[0].id);
      setPendingProfileSuccessId(selectableProfileSuccessTags[0].id);
      return;
    }

    if (!pendingProfileSuccessId || !selectableProfileSuccessTags.some((tag) => tag.id === pendingProfileSuccessId)) {
      setPendingProfileSuccessId(selectedProfileSuccessId);
    }
  }, [pendingProfileSuccessId, selectableProfileSuccessTags, selectedProfileSuccessId]);

  const selectedProfileSuccess =
    selectableProfileSuccessTags.find((tag) => tag.id === selectedProfileSuccessId) ?? null;
  const visibleSuccessTags = successTags
    .filter((tag) => !tag.isHidden || tag.unlocked)
    .filter((tag) => (isOwnProfile ? true : tag.unlocked))
    .filter((tag) => {
      if (!isOwnProfile) {
        return true;
      }
      if (successFilter === 'unlocked') {
        return tag.unlocked;
      }
      if (successFilter === 'pending') {
        return !tag.unlocked;
      }
      return true;
    });
  const comments = getTrustExchangeComments(userName);
  const firstName = resolvedName.split(' ')[0] || PROFILE_USER.firstName;
  const profilePhotoUri = getProfilePhotoUriByName(resolvedName);

  const applyProfileSuccess = () => {
    if (!pendingProfileSuccessId) {
      return;
    }
    setSelectedProfileSuccessId(pendingProfileSuccessId);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tint} colors={[tint]} />
          }>
          <Card style={styles.card}>
            <View style={styles.titleRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
                <MaterialIcons name="verified-user" size={18} color={tint} />
              </View>
              <View style={styles.titleBlock}>
                <ThemedText type="title">Confiance locale</ThemedText>
                <ThemedText style={{ color: mutedText }}>
                  Vue de confiance basée sur les échanges validés.
                </ThemedText>
              </View>
            </View>

            <View style={[styles.profileRow, { borderColor: border, backgroundColor: surface }]}> 
              <Avatar name={resolvedName} uri={profilePhotoUri} size={42} />
              <View style={styles.profileTextWrap}>
                <ThemedText type="defaultSemiBold">{firstName}</ThemedText>
                {selectedProfileSuccess ? (
                  <Badge label={selectedProfileSuccess.label} variant="primary" />
                ) : null}
              </View>
            </View>

            <View style={styles.scoreRow}>
              <View style={[styles.scoreCard, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText type="subtitle">{TRUST_PROFILE.exchangeRate}%</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Taux d’échange</ThemedText>
              </View>
              <View style={[styles.scoreCard, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText type="subtitle">{TRUST_PROFILE.loopsValidated}</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Prêts validés</ThemedText>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Succès</ThemedText>
            {isOwnProfile ? (
              <>
                <View style={styles.selectedSuccessWrap}>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>Succès affiché sous le profil</ThemedText>
                  {selectableProfileSuccessTags.length > 0 ? (
                    <View style={styles.successFilterRow}>
                      {selectableProfileSuccessTags.map((tag) => (
                        <Pressable
                          key={tag.id}
                          onPress={() => setPendingProfileSuccessId(tag.id)}
                          style={[
                            styles.successFilterChip,
                            {
                              borderColor: pendingProfileSuccessId === tag.id ? tint : border,
                              backgroundColor: pendingProfileSuccessId === tag.id ? `${tint}22` : surface,
                            },
                          ]}>
                          <ThemedText style={{ color: pendingProfileSuccessId === tag.id ? tint : mutedText, fontSize: 12 }}>
                            {tag.label}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  <Button
                    label="Appliquer sous le profil"
                    variant="secondary"
                    onPress={applyProfileSuccess}
                    disabled={!pendingProfileSuccessId || pendingProfileSuccessId === selectedProfileSuccessId}
                  />
                </View>

                <View style={styles.filterPanel}>
                  <ThemedText type="defaultSemiBold">Filtrer les succès affichés</ThemedText>
                  <View style={styles.successFilterRow}>
                    <Pressable
                      onPress={() => setSuccessFilter('all')}
                      style={[
                        styles.successFilterChip,
                        {
                          borderColor: successFilter === 'all' ? tint : border,
                          backgroundColor: successFilter === 'all' ? `${tint}22` : surface,
                        },
                      ]}>
                      <ThemedText style={{ color: successFilter === 'all' ? tint : mutedText, fontSize: 12 }}>
                        Tous
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setSuccessFilter('unlocked')}
                      style={[
                        styles.successFilterChip,
                        {
                          borderColor: successFilter === 'unlocked' ? tint : border,
                          backgroundColor: successFilter === 'unlocked' ? `${tint}22` : surface,
                        },
                      ]}>
                      <ThemedText style={{ color: successFilter === 'unlocked' ? tint : mutedText, fontSize: 12 }}>
                        Débloqués
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setSuccessFilter('pending')}
                      style={[
                        styles.successFilterChip,
                        {
                          borderColor: successFilter === 'pending' ? tint : border,
                          backgroundColor: successFilter === 'pending' ? `${tint}22` : surface,
                        },
                      ]}>
                      <ThemedText style={{ color: successFilter === 'pending' ? tint : mutedText, fontSize: 12 }}>
                        À débloquer
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : null}
            <View style={styles.successWrap}>
              {visibleSuccessTags.map((tag) => (
                  <View key={tag.id} style={[styles.successRow, { borderColor: border, backgroundColor: surface }]}>
                    <View style={styles.successHeadRow}>
                      <ThemedText type="defaultSemiBold">{tag.label}</ThemedText>
                      {tag.unlocked ? (
                        <MaterialIcons name="check-circle" size={16} color={tint} />
                      ) : (
                        <Badge label={`${tag.progressPercent}%`} variant="neutral" />
                      )}
                    </View>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>{tag.description}</ThemedText>
                  </View>
                ))}
              {visibleSuccessTags.length === 0 ? (
                <View style={[styles.successRow, { borderColor: border, backgroundColor: surface }]}>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    Aucun succès dans ce filtre pour le moment.
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Preuves de fiabilité</ThemedText>
            <View style={styles.proofsWrap}>
              {TRUST_PROOFS.map((proof) => (
                <View key={proof.id} style={[styles.proofRow, { borderColor: border }]}>
                  <ThemedText type="defaultSemiBold">{proof.label}</ThemedText>
                  <ThemedText style={{ color: mutedText }}>{proof.value}</ThemedText>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Commentaires d’échanges</ThemedText>
            <View style={styles.signalsWrap}>
              {comments.length === 0 ? (
                <View style={[styles.signalRow, { borderColor: border }]}>
                  <MaterialIcons name="forum" size={14} color={tint} />
                  <View style={styles.signalTextWrap}>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      Aucun commentaire pour ce profil pour le moment.
                    </ThemedText>
                  </View>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={[styles.signalRow, { borderColor: border }]}>
                    <MaterialIcons name="forum" size={14} color={tint} />
                    <View style={styles.signalTextWrap}>
                      <ThemedText type="defaultSemiBold">{comment.authorName} · {comment.loanObjectName}</ThemedText>
                      <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                        “{comment.comment}”
                      </ThemedText>
                      <ThemedText style={{ color: mutedText, fontSize: 11 }}>{comment.timeLabel}</ThemedText>
                    </View>
                  </View>
                ))
              )}
            </View>
          </Card>
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
    gap: 12,
  },
  card: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileTextWrap: {
    flex: 1,
    gap: 1,
  },
  scoreCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  successWrap: {
    gap: 8,
  },
  selectedSuccessWrap: {
    gap: 6,
  },
  filterPanel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  successFilterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  successFilterChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    minHeight: 32,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  successRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  successHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  proofsWrap: {
    gap: 8,
  },
  proofRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  signalsWrap: {
    gap: 8,
  },
  signalRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  signalTextWrap: {
    flex: 1,
    gap: 1,
  },
});
