import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible } from '@/components/ui/collapsible';
import { LEGAL_ROUTES } from '@/constants/legal';
import { Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    changePasswordWithCurrentPassword,
    deleteCurrentAccount,
    getPrivateLocationPreference,
    sendPasswordResetEmail,
    signOutSession,
    updatePrivateLocationPreference,
    updateProfilePhotoPreference,
    useAuthSession,
} from '@/lib/backend/auth';
import {
    PROFILE_STATS,
    TRUST_PROFILE,
    getObjectByLoanObjectName,
    getSuccessTagsStatus,
    refreshBackendData,
    useBackendDataVersion,
} from '@/lib/backend/data';
import { isBackendConfigured } from '@/lib/backend/supabase';
import {
    ensureNotificationPermission,
    getNotificationTypePreferences,
    getNotificationsEnabled,
    setNotificationTypeEnabled,
    setNotificationsEnabled,
    type NotificationEventType,
} from '@/lib/notifications/service';
import { showAppNotice } from '@/stores/app-notice-store';
import { removeListing, useListings } from '@/stores/listings-store';
import { useProfile } from '@/stores/profile-store';

export default function ProfileScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const mutedText = useThemeColor({}, 'mutedText');
  const danger = useThemeColor({}, 'danger');
  const tint = useThemeColor({}, 'tint');
  const text = useThemeColor({}, 'text');

  const listings = useListings();
  const profile = useProfile();
  const { session } = useAuthSession();
  const [pendingDeleteListing, setPendingDeleteListing] = useState<{ id: string; title: string } | null>(null);
  const [pendingAccountAction, setPendingAccountAction] = useState<'logout' | 'delete-account' | null>(null);
  const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordUpdateLoading, setIsPasswordUpdateLoading] = useState(false);
  const [isAccountDeletionLoading, setIsAccountDeletionLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [notificationTypePreferences, setNotificationTypePreferences] = useState<Record<NotificationEventType, boolean>>({
    new_message_received: true,
    loan_request_accepted: true,
    return_due_tomorrow: true,
  });
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [privateCity, setPrivateCity] = useState('');
  const [privatePostalCode, setPrivatePostalCode] = useState('');
  const [isPrivateLocationLoading, setIsPrivateLocationLoading] = useState(false);
  const [isPrivateLocationUpdatingFromGps, setIsPrivateLocationUpdatingFromGps] = useState(false);
  const [pendingProfilePhotoUri, setPendingProfilePhotoUri] = useState<string | null>(null);
  const [isPublishingProfilePhoto, setIsPublishingProfilePhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasPasswordDraft = newPassword.length > 0 || confirmNewPassword.length > 0;
  const passwordMatchState =
    !hasPasswordDraft ? null : newPassword === confirmNewPassword ? 'match' : 'mismatch';

  const metadata = session?.user?.user_metadata as Record<string, unknown> | undefined;
  const metadataFirstName = typeof metadata?.first_name === 'string' ? metadata.first_name : '';
  const metadataLastName = typeof metadata?.last_name === 'string' ? metadata.last_name : '';
  const metadataFullName = typeof metadata?.full_name === 'string' ? metadata.full_name : '';
  const fallbackFullName = `${profile.firstName} ${profile.lastName}`;
  const fullName =
    metadataFullName ||
    [metadataFirstName, metadataLastName].filter(Boolean).join(' ').trim() ||
    fallbackFullName;
  const profileEmail = session?.user?.email ?? null;
  const metadataAvatar = typeof metadata?.avatar_url === 'string' ? metadata.avatar_url : null;
  const metadataPrivateCity = typeof metadata?.private_city === 'string' ? metadata.private_city : '';
  const metadataPrivatePostalCode = typeof metadata?.private_postal_code === 'string' ? metadata.private_postal_code : '';
  const avatarUri = metadataAvatar || profile.photoUri;
  const loanListings = listings.filter((item) => item.publicationMode === 'loan');
  const requestListings = listings.filter((item) => item.publicationMode === 'request');
  const profileSuccess = getSuccessTagsStatus(TRUST_PROFILE).find((tag) => tag.unlocked);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getNotificationsEnabled(), getNotificationTypePreferences()])
      .then(([enabled, preferences]) => {
        if (isMounted) {
          setNotificationsEnabledState(enabled);
          setNotificationTypePreferences(preferences);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsNotificationsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    setPrivateCity(metadataPrivateCity);
    setPrivatePostalCode(metadataPrivatePostalCode);

    if (!metadataPrivateCity && !metadataPrivatePostalCode) {
      getPrivateLocationPreference()
        .then((preference) => {
          if (!isMounted || !preference) {
            return;
          }
          setPrivateCity(preference.city);
          setPrivatePostalCode(preference.postalCode);
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [metadataPrivateCity, metadataPrivatePostalCode]);

  const openListing = (listingId: string) => {
    const listing = listings.find((item) => item.id === listingId);
    if (!listing) {
      return;
    }

    const objectIdFromListing = listing.linkedObjectId;
    const matchedObject = getObjectByLoanObjectName(listing.title);
    const objectId = objectIdFromListing || matchedObject?.id;

    if (objectId) {
      router.push({ pathname: '/object/[id]', params: { id: objectId } });
      return;
    }

    router.push({ pathname: '/object/[id]', params: { id: listing.id, listingId: listing.id } });
  };

  const editListing = (listingId: string) => {
    router.push({ pathname: '/(tabs)/post', params: { listingId } });
  };

  const deleteListing = (listingId: string, title: string) => {
    setPendingDeleteListing({ id: listingId, title });
  };

  const pickProfilePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAppNotice('Autorise l’accès à la galerie pour changer ta photo.', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPendingProfilePhotoUri(result.assets[0].uri);
      showAppNotice('Photo prête: publie-la pour confirmer.', 'info');
    }
  };

  const publishProfilePhoto = async () => {
    if (!pendingProfilePhotoUri) {
      showAppNotice('Choisis une photo avant de publier.', 'warning');
      return;
    }

    setIsPublishingProfilePhoto(true);
    try {
      await updateProfilePhotoPreference(pendingProfilePhotoUri);
      await refreshBackendData();
      setPendingProfilePhotoUri(null);
      showAppNotice('Photo de profil mise à jour.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de publier la photo de profil.';
      showAppNotice(message, 'error');
    } finally {
      setIsPublishingProfilePhoto(false);
    }
  };

  const handleLogout = () => {
    setPendingAccountAction('logout');
  };

  const handleDeleteAccount = () => {
    setPendingAccountAction('delete-account');
  };

  const confirmDeleteListing = async () => {
    if (!pendingDeleteListing) {
      return;
    }

    await removeListing(pendingDeleteListing.id);
    showAppNotice('Annonce supprimée.', 'success');
    setPendingDeleteListing(null);
  };

  const confirmLogout = async () => {
    try {
      if (isBackendConfigured) {
        await signOutSession();
      }
      showAppNotice('Déconnexion effectuée.', 'info');
      setPendingAccountAction(null);
      router.replace('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de se déconnecter pour le moment.';
      showAppNotice(message, 'error');
    }
  };

  const confirmDeleteAccount = async () => {
    if (!isBackendConfigured) {
      showAppNotice('Backend non configuré: suppression de compte indisponible.', 'warning');
      return;
    }

    setIsAccountDeletionLoading(true);
    try {
      await deleteCurrentAccount();
      showAppNotice('Compte supprimé définitivement.', 'success');
      setPendingAccountAction(null);
      router.replace('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Suppression du compte impossible pour le moment.';
      showAppNotice(message, 'error');
    } finally {
      setIsAccountDeletionLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = session?.user?.email;
    if (!email) {
      showAppNotice('Email de compte introuvable. Reconnecte-toi puis réessaie.', 'warning');
      return;
    }

    setIsPasswordResetLoading(true);
    try {
      await sendPasswordResetEmail(email);
      showAppNotice('Email de changement de mot de passe envoyé.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d’envoyer le lien de réinitialisation.';
      showAppNotice(message, 'error');
    } finally {
      setIsPasswordResetLoading(false);
    }
  };

  const handleDirectPasswordChange = async () => {
    const current = currentPassword.trim();
    const next = newPassword.trim();
    const confirmation = confirmNewPassword.trim();

    if (!current || !next || !confirmation) {
      showAppNotice('Saisis ancien, nouveau et confirmation du mot de passe.', 'warning');
      return;
    }

    if (next.length < 8) {
      showAppNotice('Le nouveau mot de passe doit contenir au moins 8 caractères.', 'warning');
      return;
    }

    if (next !== confirmation) {
      showAppNotice('La confirmation du nouveau mot de passe ne correspond pas.', 'warning');
      return;
    }

    setIsPasswordUpdateLoading(true);
    try {
      await changePasswordWithCurrentPassword(current, next);
      showAppNotice('Mot de passe mis à jour.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.';
      showAppNotice(message, 'error');
    } finally {
      setIsPasswordUpdateLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (isNotificationsLoading) {
      return;
    }

    const nextEnabled = !notificationsEnabled;
    setIsNotificationsLoading(true);

    try {
      await setNotificationsEnabled(nextEnabled);
      setNotificationsEnabledState(nextEnabled);

      if (nextEnabled) {
        const granted = await ensureNotificationPermission(true);
        if (!granted) {
          showAppNotice('Notifications activées, mais permission refusée côté appareil.', 'warning');
        } else {
          showAppNotice('Notifications activées.', 'success');
        }
      } else {
        showAppNotice('Notifications désactivées.', 'info');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de modifier les notifications.';
      showAppNotice(message, 'error');
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const handleToggleNotificationType = async (type: NotificationEventType) => {
    if (isNotificationsLoading) {
      return;
    }

    setIsNotificationsLoading(true);
    const nextValue = !notificationTypePreferences[type];

    try {
      await setNotificationTypeEnabled(type, nextValue);
      setNotificationTypePreferences((current) => ({
        ...current,
        [type]: nextValue,
      }));
      showAppNotice('Préférence de notification mise à jour.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de modifier cette préférence.';
      showAppNotice(message, 'error');
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const handleSavePrivateLocation = async () => {
    const city = privateCity.trim();
    const postalCode = privatePostalCode.trim();

    if (!city || !postalCode) {
      showAppNotice('Renseigne une ville et un code postal.', 'warning');
      return;
    }

    setIsPrivateLocationLoading(true);
    try {
      await updatePrivateLocationPreference({ city, postalCode });
      setPrivateCity(city);
      setPrivatePostalCode(postalCode);
      showAppNotice('Zone privée enregistrée.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d’enregistrer la zone privée.';
      showAppNotice(message, 'error');
    } finally {
      setIsPrivateLocationLoading(false);
    }
  };

  const handleUpdatePrivateLocationFromCurrentPosition = async () => {
    setIsPrivateLocationUpdatingFromGps(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        showAppNotice('Active la localisation pour mettre à jour automatiquement ta zone.', 'warning');
        return;
      }

      if (Location.enableNetworkProviderAsync) {
        await Location.enableNetworkProviderAsync().catch(() => {});
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });

      const place = geocoded[0];
      const city = (place?.city ?? place?.subregion ?? place?.region ?? '').trim();
      const postalCode = (place?.postalCode ?? '').trim();

      if (!city || !postalCode) {
        showAppNotice('Position détectée mais ville/CP non disponibles. Saisis-les manuellement.', 'warning');
        return;
      }

      setPrivateCity(city);
      setPrivatePostalCode(postalCode);
      await updatePrivateLocationPreference({ city, postalCode });
      showAppNotice('Zone privée mise à jour depuis ta position actuelle.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mise à jour de la zone privée impossible.';
      showAppNotice(message, 'error');
    } finally {
      setIsPrivateLocationUpdatingFromGps(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBackendData();
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
            <ThemedText type="title">Profil</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>Ton espace de confiance et de suivi.</ThemedText>

            <View style={[styles.profileHeader, { borderColor: border, backgroundColor: surface }]}>
              <View style={styles.avatarEditWrap}>
                <Avatar name={fullName} uri={avatarUri} size={64} />
                <Pressable
                  onPress={pickProfilePhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier la photo de profil"
                  style={[styles.avatarEditButton, { borderColor: border, backgroundColor: surface }]}>
                  <MaterialIcons name="edit" size={14} color={tint} />
                </Pressable>
              </View>
              <View style={styles.profileHeaderTextWrap}>
                <ThemedText type="defaultSemiBold">{fullName}</ThemedText>
                {profileEmail ? <ThemedText style={{ color: mutedText, fontSize: 12 }}>{profileEmail}</ThemedText> : null}
                {profileSuccess ? <Badge label={profileSuccess.label} variant="primary" /> : null}
              </View>
            </View>

            {pendingProfilePhotoUri ? (
              <View style={[styles.photoPublishCard, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText type="defaultSemiBold">Nouvelle photo de profil</ThemedText>
                <View style={styles.pendingPhotoPreviewWrap}>
                  <Image source={{ uri: pendingProfilePhotoUri }} style={styles.pendingPhotoPreview} contentFit="cover" />
                </View>
                <View style={styles.pendingPhotoActions}>
                  <Button label="Redimensionner" variant="secondary" onPress={pickProfilePhoto} />
                  <Button label="Publier" variant="secondary" loading={isPublishingProfilePhoto} onPress={publishProfilePhoto} />
                </View>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <View style={[styles.statItem, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">{PROFILE_STATS.objects}</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Objets postés</ThemedText>
              </View>
              <View style={[styles.statItem, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">{PROFILE_STATS.loans}</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Prêts total</ThemedText>
              </View>
            </View>

            <View style={[styles.trustRow, { borderColor: border, backgroundColor: surface }]}> 
              <View style={styles.trustTextWrap}>
                <ThemedText type="defaultSemiBold">Confiance locale: {TRUST_PROFILE.trustScore}%</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>{TRUST_PROFILE.level}</ThemedText>
              </View>
              <Pressable
                onPress={() => router.push('/trust')}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir la page Confiance locale">
                <ThemedText type="link">Voir détail</ThemedText>
              </Pressable>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeadingRow}>
              <MaterialIcons name="inventory-2" size={16} color={tint} />
              <ThemedText type="subtitle">Annonces publiées</ThemedText>
            </View>
            {pendingDeleteListing ? (
              <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}12` }]}>
                <ThemedText type="defaultSemiBold" style={{ color: danger }}>
                  Tu es sur le point de supprimer “{pendingDeleteListing.title}”.
                </ThemedText>
                <View style={styles.warningActionsRow}>
                  <Button label="Annuler" variant="secondary" onPress={() => setPendingDeleteListing(null)} />
                  <Button label="Confirmer" variant="secondary" textStyle={{ color: danger }} onPress={confirmDeleteListing} />
                </View>
              </View>
            ) : null}
            <View style={[styles.listingGroupWrap, styles.loanGroup, { borderColor: `${border}99`, backgroundColor: `${surface}` }]}>
              <View style={styles.groupHeaderRow}>
                <ThemedText type="defaultSemiBold">À prêter</ThemedText>
                <Badge label={`${loanListings.length}`} variant="primary" />
              </View>
              {loanListings.map((item) => (
                <View key={item.id} style={[styles.listingRow, { borderColor: border, backgroundColor: surface }]}>
                  <View style={styles.itemTextWrap}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.title}</ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }} numberOfLines={2}>
                      {item.description}
                    </ThemedText>
                  </View>
                  <View style={styles.listingActionsWrap}>
                    <Badge label="À prêter" variant="primary" />
                    <View style={styles.iconActionsRow}>
                      <Pressable
                        onPress={() => openListing(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Voir l’annonce ${item.title}`}
                        style={[styles.iconActionButton, { borderColor: border, backgroundColor: surface }]}>
                        <MaterialIcons name="visibility" size={16} color={tint} />
                      </Pressable>
                      <Pressable
                        onPress={() => editListing(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Modifier l’annonce ${item.title}`}
                        style={[styles.iconActionButton, { borderColor: border, backgroundColor: surface }]}>
                        <MaterialIcons name="edit" size={16} color={tint} />
                      </Pressable>
                      <Pressable
                        onPress={() => deleteListing(item.id, item.title)}
                        accessibilityRole="button"
                        accessibilityLabel={`Supprimer l’annonce ${item.title}`}
                        style={[styles.iconActionButton, { borderColor: `${danger}55`, backgroundColor: surface }]}>
                        <MaterialIcons name="delete-outline" size={16} color={danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.listingGroupWrap, styles.requestGroup, { borderColor: `${border}99`, backgroundColor: `${surface}` }]}>
              <View style={styles.groupHeaderRow}>
                <ThemedText type="defaultSemiBold">À emprunter</ThemedText>
                <Badge label={`${requestListings.length}`} variant="neutral" />
              </View>
              {requestListings.map((item) => (
                <View key={item.id} style={[styles.listingRow, { borderColor: border, backgroundColor: surface }]}>
                  <View style={styles.itemTextWrap}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.title}</ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }} numberOfLines={2}>
                      {item.description}
                    </ThemedText>
                  </View>
                  <View style={styles.listingActionsWrap}>
                    <Badge label="À emprunter" variant="neutral" />
                    <View style={styles.iconActionsRow}>
                      <Pressable
                        onPress={() => openListing(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Voir l’annonce ${item.title}`}
                        style={[styles.iconActionButton, { borderColor: border, backgroundColor: surface }]}>
                        <MaterialIcons name="visibility" size={16} color={tint} />
                      </Pressable>
                      <Pressable
                        onPress={() => editListing(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Modifier l’annonce ${item.title}`}
                        style={[styles.iconActionButton, { borderColor: border, backgroundColor: surface }]}>
                        <MaterialIcons name="edit" size={16} color={tint} />
                      </Pressable>
                      <Pressable
                        onPress={() => deleteListing(item.id, item.title)}
                        accessibilityRole="button"
                        accessibilityLabel={`Supprimer l’annonce ${item.title}`}
                        style={[styles.iconActionButton, { borderColor: `${danger}55`, backgroundColor: surface }]}>
                        <MaterialIcons name="delete-outline" size={16} color={danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeadingRow}>
              <MaterialIcons name="manage-accounts" size={16} color={tint} />
              <ThemedText type="subtitle">Compte</ThemedText>
            </View>
            <View style={[styles.accountSectionCard, { borderColor: border, backgroundColor: surface }]}>
              <Collapsible title="Localisation privée">
                <View style={styles.collapsibleContentWrap}>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    Utilisée si la géolocalisation n’est pas active au moment de publier.
                  </ThemedText>
                  <View style={styles.privateLocationInputsRow}>
                    <View style={styles.privateLocationInputBlock}>
                      <View style={styles.privateLocationInputLabelRow}>
                        <MaterialIcons name="markunread-mailbox" size={14} color={tint} />
                        <ThemedText style={styles.privateLocationInputLabel}>Code postal</ThemedText>
                      </View>
                      <TextInput
                        value={privatePostalCode}
                        onChangeText={setPrivatePostalCode}
                        placeholder="Code postal"
                        placeholderTextColor={mutedText}
                        keyboardType="number-pad"
                        style={[styles.privateLocationInput, { color: text, borderColor: border, backgroundColor: surface }]}
                      />
                    </View>
                    <View style={styles.privateLocationInputBlock}>
                      <View style={styles.privateLocationInputLabelRow}>
                        <MaterialIcons name="location-city" size={14} color={tint} />
                        <ThemedText style={styles.privateLocationInputLabel}>Ville</ThemedText>
                      </View>
                      <TextInput
                        value={privateCity}
                        onChangeText={setPrivateCity}
                        placeholder="Ville"
                        placeholderTextColor={mutedText}
                        style={[styles.privateLocationInput, { color: text, borderColor: border, backgroundColor: surface }]}
                      />
                    </View>
                  </View>
                  <View style={styles.privateLocationActions}>
                    <Button
                      label="Enregistrer"
                      loading={isPrivateLocationLoading}
                      style={styles.privateLocationActionButton}
                      onPress={handleSavePrivateLocation}
                    />
                    <Button
                      label="Mettre à jour"
                      variant="secondary"
                      loading={isPrivateLocationUpdatingFromGps}
                      style={styles.privateLocationActionButton}
                      onPress={handleUpdatePrivateLocationFromCurrentPosition}
                    />
                  </View>
                </View>
              </Collapsible>
            </View>

            <View style={[styles.accountSectionCard, { borderColor: border, backgroundColor: surface }]}>
              <Collapsible title="Notifications">
                <View style={styles.collapsibleContentWrap}>
                  <View style={[styles.notificationRow, { borderColor: border, backgroundColor: surface }]}>
                    <View style={styles.notificationTextWrap}>
                      <ThemedText type="defaultSemiBold">Notifications</ThemedText>
                      <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                        {notificationsEnabled ? 'Activées' : 'Désactivées'}
                      </ThemedText>
                    </View>
                    <Button
                      label={notificationsEnabled ? 'Désactiver' : 'Activer'}
                      variant="secondary"
                      loading={isNotificationsLoading}
                      style={styles.notificationActionButton}
                      onPress={handleToggleNotifications}
                    />
                  </View>
                  <View style={styles.notificationTypesWrap}>
                    {(
                      [
                        { type: 'new_message_received', label: 'Nouveau message reçu' },
                        { type: 'loan_request_accepted', label: 'Demande acceptée' },
                        { type: 'return_due_tomorrow', label: 'Rappel retour demain' },
                      ] as const
                    ).map((item) => (
                      <View key={item.type} style={[styles.notificationTypeRow, { borderColor: border, backgroundColor: surface }]}> 
                        <ThemedText style={[styles.notificationTypeLabel, { color: mutedText, fontSize: 12 }]} numberOfLines={2}>
                          {item.label}
                        </ThemedText>
                        <Button
                          label={notificationTypePreferences[item.type] ? 'On' : 'Off'}
                          variant="secondary"
                          loading={isNotificationsLoading}
                          style={styles.notificationActionButton}
                          onPress={() => handleToggleNotificationType(item.type)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              </Collapsible>
            </View>

            <View style={[styles.accountSectionCard, { borderColor: border, backgroundColor: surface }]}>
              <Collapsible title="Mot de passe">
                <View style={styles.collapsibleContentWrap}>
                  <View style={[styles.passwordHintBox, { borderColor: border, backgroundColor: surface }]}>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      Saisis ton ancien mot de passe puis ton nouveau mot de passe.
                    </ThemedText>
                  </View>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Ancien mot de passe"
                    placeholderTextColor={mutedText}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.passwordInput, { color: text, borderColor: border, backgroundColor: surface }]}
                  />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nouveau mot de passe"
                    placeholderTextColor={mutedText}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.passwordInput, { color: text, borderColor: border, backgroundColor: surface }]}
                  />
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Confirmer le nouveau mot de passe"
                    placeholderTextColor={mutedText}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.passwordInput, { color: text, borderColor: border, backgroundColor: surface }]}
                  />
                  {passwordMatchState ? (
                    <View
                      style={[
                        styles.passwordMatchHint,
                        {
                          borderColor: passwordMatchState === 'match' ? `${tint}66` : `${danger}66`,
                          backgroundColor: passwordMatchState === 'match' ? `${tint}14` : `${danger}12`,
                        },
                      ]}>
                      <ThemedText
                        style={{ color: passwordMatchState === 'match' ? tint : danger, fontSize: 12 }}>
                        {passwordMatchState === 'match'
                          ? 'Les mots de passe correspondent.'
                          : 'Les mots de passe ne correspondent pas.'}
                      </ThemedText>
                    </View>
                  ) : null}
                  <Button
                    label="Mettre à jour le mot de passe"
                    loading={isPasswordUpdateLoading}
                    onPress={handleDirectPasswordChange}
                  />
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    Si besoin, tu peux aussi recevoir un lien de réinitialisation par email.
                  </ThemedText>
                  <Button
                    label="Envoyer un lien de réinitialisation"
                    variant="secondary"
                    loading={isPasswordResetLoading}
                    onPress={handlePasswordReset}
                  />
                </View>
              </Collapsible>
            </View>
            {pendingAccountAction === 'logout' ? (
              <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}12` }]}>
                <ThemedText style={{ color: danger }}>
                  Attention: vous ne recevrez plus de notifications après déconnexion.
                </ThemedText>
                <View style={styles.warningActionsRow}>
                  <Button label="Annuler" variant="secondary" onPress={() => setPendingAccountAction(null)} />
                  <Button label="Se déconnecter" variant="secondary" textStyle={{ color: danger }} onPress={confirmLogout} />
                </View>
              </View>
            ) : null}

            {pendingAccountAction === 'delete-account' ? (
              <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}12` }]}>
                <ThemedText style={{ color: danger }}>
                  Vous êtes sur le point de supprimer votre compte.
                </ThemedText>
                <View style={styles.warningActionsRow}>
                  <Button
                    label="Annuler"
                    variant="secondary"
                    disabled={isAccountDeletionLoading}
                    onPress={() => setPendingAccountAction(null)}
                  />
                  <Button
                    label="Supprimer"
                    variant="secondary"
                    textStyle={{ color: danger }}
                    loading={isAccountDeletionLoading}
                    onPress={confirmDeleteAccount}
                  />
                </View>
              </View>
            ) : null}
            <Button label="Se déconnecter" variant="secondary" onPress={handleLogout} />
            <Button
              label="Supprimer mon compte"
              variant="secondary"
              style={[styles.dangerButton, { borderColor: `${danger}66`, backgroundColor: `${danger}14` }]}
              textStyle={{ color: danger }}
              onPress={handleDeleteAccount}
            />
          </Card>

          <Card style={styles.card}>
            <View style={styles.sectionHeadingRow}>
              <MaterialIcons name="gavel" size={16} color={tint} />
              <ThemedText type="subtitle">Légal</ThemedText>
            </View>
            <Pressable
              onPress={() => router.push(LEGAL_ROUTES.privacyPolicy as never)}
              accessibilityRole="button"
              accessibilityLabel="Voir la politique de confidentialité">
              <ThemedText type="link">Politique de confidentialité</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push(LEGAL_ROUTES.terms as never)}
              accessibilityRole="button"
              accessibilityLabel="Voir les conditions générales d’utilisation">
              <ThemedText type="link">Conditions générales d’utilisation</ThemedText>
            </Pressable>
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
    gap: 10,
    width: '100%',
  },
  subtitle: {
    marginTop: 4,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  profileHeader: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  avatarEditWrap: {
    position: 'relative',
  },
  avatarEditButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  listingRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  listingGroupWrap: {
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  loanGroup: {
    marginTop: 4,
  },
  requestGroup: {
    marginTop: 2,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listingActionsWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  iconActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconActionButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  trustRow: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  trustTextWrap: {
    flex: 1,
    gap: 1,
  },
  photoPublishCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  pendingPhotoPreviewWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  pendingPhotoPreview: {
    width: '100%',
    height: '100%',
  },
  pendingPhotoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dangerButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  accountSectionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
    alignSelf: 'center',
  },
  collapsibleContentWrap: {
    marginTop: 8,
    gap: 8,
    marginLeft: 0,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 680,
  },
  passwordHintBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  privateLocationCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  privateLocationInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  privateLocationInputBlock: {
    flex: 1,
    gap: 4,
  },
  privateLocationInputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privateLocationInputLabel: {
    fontSize: 12,
  },
  privateLocationInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  privateLocationActions: {
    gap: 8,
    flexDirection: 'row',
  },
  privateLocationActionButton: {
    flex: 1,
    minHeight: 38,
  },
  notificationRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    alignSelf: 'center',
  },
  notificationTextWrap: {
    flex: 1,
    gap: 2,
  },
  notificationTypesWrap: {
    gap: 8,
  },
  notificationTypeRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    alignSelf: 'center',
  },
  notificationTypeLabel: {
    flex: 1,
    paddingRight: 8,
  },
  notificationActionButton: {
    minHeight: 36,
    minWidth: 112,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  passwordMatchHint: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    gap: 8,
  },
  warningActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
