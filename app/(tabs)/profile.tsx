import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible } from '@/components/ui/collapsible';
import { Divider } from '@/components/ui/divider';
import { Input } from '@/components/ui/input';
import { ListingGroup } from '@/components/ui/listing-group';
import { SectionHeader } from '@/components/ui/section-header';
import { LEGAL_ROUTES } from '@/constants/legal';
import { Radius, Spacing } from '@/constants/theme';
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
    getObjectByLoanObjectName,
    getSuccessTagsStatus,
    refreshBackendData,
} from '@/lib/backend/data';
import { isBackendConfigured } from '@/lib/backend/provider';
import {
    ensureNotificationPermission,
    getNotificationTypePreferences,
    getNotificationsEnabled,
    setNotificationTypeEnabled,
    setNotificationsEnabled,
    type NotificationEventType,
} from '@/lib/notifications/service';
import { showAppNotice } from '@/stores/app-notice-store';
import { useBackendStore } from '@/stores/backend-store';
import { removeListing, useListings } from '@/stores/listings-store';
import { useProfile } from '@/stores/profile-store';

export default function ProfileScreen() {
  const PROFILE_STATS = useBackendStore((s) => s.profileStats);
  const TRUST_PROFILE = useBackendStore((s) => s.trustProfile);
  const router = useRouter();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const mutedText = useThemeColor({}, 'mutedText');
  const danger = useThemeColor({}, 'danger');
  const tint = useThemeColor({}, 'tint');
  const softSurface = `${surface}F2`;
  const softBorder = `${border}AA`;

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
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

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
      showAppNotice('Autorise l\u2019acc\u00e8s \u00e0 la galerie pour changer ta photo.', 'warning');
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
      showAppNotice('Photo pr\u00eate: publie-la pour confirmer.', 'info');
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
      showAppNotice('Photo de profil mise \u00e0 jour.', 'success');
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
    showAppNotice('Annonce supprim\u00e9e.', 'success');
    setPendingDeleteListing(null);
  };

  const confirmLogout = async () => {
    try {
      if (isBackendConfigured) {
        await signOutSession();
      }
      showAppNotice('D\u00e9connexion effectu\u00e9e.', 'info');
      setPendingAccountAction(null);
      router.replace('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de se d\u00e9connecter pour le moment.';
      showAppNotice(message, 'error');
    }
  };

  const confirmDeleteAccount = async () => {
    if (!isBackendConfigured) {
      showAppNotice('Backend non configur\u00e9: suppression de compte indisponible.', 'warning');
      return;
    }

    setIsAccountDeletionLoading(true);
    try {
      await deleteCurrentAccount();
      showAppNotice('Compte supprim\u00e9 d\u00e9finitivement.', 'success');
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
      showAppNotice('Email de compte introuvable. Reconnecte-toi puis r\u00e9essaie.', 'warning');
      return;
    }

    setIsPasswordResetLoading(true);
    try {
      await sendPasswordResetEmail(email);
      showAppNotice('Email de changement de mot de passe envoy\u00e9.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d\u2019envoyer le lien de r\u00e9initialisation.';
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
      showAppNotice('Le nouveau mot de passe doit contenir au moins 8 caract\u00e8res.', 'warning');
      return;
    }

    if (next !== confirmation) {
      showAppNotice('La confirmation du nouveau mot de passe ne correspond pas.', 'warning');
      return;
    }

    setIsPasswordUpdateLoading(true);
    try {
      await changePasswordWithCurrentPassword(current, next);
      showAppNotice('Mot de passe mis \u00e0 jour.', 'success');
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
          showAppNotice('Notifications activ\u00e9es, mais permission refus\u00e9e c\u00f4t\u00e9 appareil.', 'warning');
        } else {
          showAppNotice('Notifications activ\u00e9es.', 'success');
        }
      } else {
        showAppNotice('Notifications d\u00e9sactiv\u00e9es.', 'info');
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
      showAppNotice('Pr\u00e9f\u00e9rence de notification mise \u00e0 jour.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de modifier cette pr\u00e9f\u00e9rence.';
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
      showAppNotice('Zone priv\u00e9e enregistr\u00e9e.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d\u2019enregistrer la zone priv\u00e9e.';
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
        showAppNotice('Active la localisation pour mettre \u00e0 jour automatiquement ta zone.', 'warning');
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
        showAppNotice('Position d\u00e9tect\u00e9e mais ville/CP non disponibles. Saisis-les manuellement.', 'warning');
        return;
      }

      setPrivateCity(city);
      setPrivatePostalCode(postalCode);
      await updatePrivateLocationPreference({ city, postalCode });
      showAppNotice('Zone priv\u00e9e mise \u00e0 jour depuis ta position actuelle.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mise \u00e0 jour de la zone priv\u00e9e impossible.';
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
            <ThemedText type="label" style={{ color: tint }}>
              Espace perso
            </ThemedText>
            <ThemedText type="title">Profil</ThemedText>
            <ThemedText type="caption">Ton espace de confiance et de suivi.</ThemedText>

            <View style={[styles.profileHeader, { borderColor: softBorder, backgroundColor: softSurface }]}>
              <View style={styles.avatarEditWrap}>
                <Avatar name={fullName} uri={avatarUri} size={64} />
                <Pressable
                  onPress={pickProfilePhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Changer la photo de profil"
                  hitSlop={8}
                  style={[styles.avatarEditButton, { borderColor: softBorder, backgroundColor: softSurface }]}>
                  <MaterialIcons name="edit" size={14} color={tint} />
                </Pressable>
              </View>
              <View style={styles.profileHeaderTextWrap}>
                <ThemedText type="defaultSemiBold">{fullName}</ThemedText>
                {profileEmail ? <ThemedText type="caption">{profileEmail}</ThemedText> : null}
                {profileSuccess ? <Badge label={profileSuccess.label} variant="primary" /> : null}
              </View>
            </View>

            {pendingProfilePhotoUri ? (
              <View style={[styles.photoPublishCard, { borderColor: softBorder, backgroundColor: softSurface }]}>
                <ThemedText type="defaultSemiBold">Nouvelle photo de profil</ThemedText>
                <View style={styles.pendingPhotoPreviewWrap}>
                  <Image source={{ uri: pendingProfilePhotoUri }} style={styles.pendingPhotoPreview} contentFit="cover" />
                </View>
                <View style={styles.pendingPhotoActions}>
                  <Button label="Redimensionner" variant="secondary" size="sm" onPress={pickProfilePhoto} />
                  <Button label="Publier" variant="secondary" size="sm" loading={isPublishingProfilePhoto} onPress={publishProfilePhoto} />
                </View>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <View style={[styles.statItem, { backgroundColor: softSurface, borderColor: softBorder }]}>
                <ThemedText type="defaultSemiBold">{PROFILE_STATS.objects}</ThemedText>
                <ThemedText type="caption">Objets post\u00e9s</ThemedText>
              </View>
              <View style={[styles.statItem, { backgroundColor: softSurface, borderColor: softBorder }]}>
                <ThemedText type="defaultSemiBold">{PROFILE_STATS.loans}</ThemedText>
                <ThemedText type="caption">Pr\u00eats total</ThemedText>
              </View>
            </View>

            <View style={[styles.trustRow, { borderColor: softBorder, backgroundColor: softSurface }]}>
              <View style={styles.trustTextWrap}>
                <ThemedText type="defaultSemiBold">Confiance locale: {TRUST_PROFILE.trustScore}%</ThemedText>
                <ThemedText type="caption">{TRUST_PROFILE.level}</ThemedText>
              </View>
              <Pressable
                onPress={() => router.push('/trust')}
                accessibilityRole="button"
                accessibilityLabel="Voir le d\u00e9tail de la confiance locale">
                <ThemedText type="link">Voir d\u00e9tail</ThemedText>
              </Pressable>
            </View>
          </Card>

          <Card style={styles.card}>
            <SectionHeader title="Annonces publi\u00e9es" icon="inventory-2" />
            {pendingDeleteListing ? (
              <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}12` }]}>
                <ThemedText type="defaultSemiBold" style={{ color: danger }}>
                  Tu es sur le point de supprimer &ldquo;{pendingDeleteListing.title}&rdquo;.
                </ThemedText>
                <View style={styles.warningActionsRow}>
                  <Button label="Annuler" variant="secondary" size="sm" onPress={() => setPendingDeleteListing(null)} />
                  <Button label="Confirmer" variant="danger" size="sm" onPress={confirmDeleteListing} />
                </View>
              </View>
            ) : null}
            <View style={styles.loanGroup}>
              <ListingGroup
                items={loanListings}
                badgeLabel="\u00c0 pr\u00eater"
                badgeVariant="primary"
                groupLabel="\u00c0 pr\u00eater"
                tint={tint}
                danger={danger}
                softBorder={softBorder}
                softSurface={softSurface}
                mutedText={mutedText}
                onView={openListing}
                onEdit={editListing}
                onDelete={deleteListing}
              />
            </View>

            <View style={styles.requestGroup}>
              <ListingGroup
                items={requestListings}
                badgeLabel="\u00c0 emprunter"
                badgeVariant="neutral"
                groupLabel="\u00c0 emprunter"
                tint={tint}
                danger={danger}
                softBorder={softBorder}
                softSurface={softSurface}
                mutedText={mutedText}
                onView={openListing}
                onEdit={editListing}
                onDelete={deleteListing}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <SectionHeader title="Compte" icon="manage-accounts" />
            <View style={[styles.accountSectionCard, { borderColor: softBorder, backgroundColor: softSurface }]}>
              <Collapsible title="Localisation priv\u00e9e">
                <View style={styles.collapsibleContentWrap}>
                  <ThemedText type="caption">
                    Utilis\u00e9e si la g\u00e9olocalisation n\u2019est pas active au moment de publier.
                  </ThemedText>
                  <View style={[styles.privateLocationInputsRow, isCompact ? styles.privateLocationInputsColumn : null]}>
                    <View style={styles.privateLocationInputBlock}>
                      <Input
                        label="Code postal"
                        icon="markunread-mailbox"
                        value={privatePostalCode}
                        onChangeText={setPrivatePostalCode}
                        placeholder="Code postal"
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.privateLocationInputBlock}>
                      <Input
                        label="Ville"
                        icon="location-city"
                        value={privateCity}
                        onChangeText={setPrivateCity}
                        placeholder="Ville"
                      />
                    </View>
                  </View>
                  <View style={styles.privateLocationActions}>
                    <Button
                      label="Enregistrer"
                      size="sm"
                      loading={isPrivateLocationLoading}
                      style={styles.privateLocationActionButton}
                      onPress={handleSavePrivateLocation}
                    />
                    <Button
                      label="Mettre \u00e0 jour"
                      variant="secondary"
                      size="sm"
                      loading={isPrivateLocationUpdatingFromGps}
                      style={styles.privateLocationActionButton}
                      onPress={handleUpdatePrivateLocationFromCurrentPosition}
                    />
                  </View>
                </View>
              </Collapsible>
            </View>

            <View style={[styles.accountSectionCard, { borderColor: softBorder, backgroundColor: softSurface }]}>
              <Collapsible title="Notifications">
                <View style={styles.collapsibleContentWrap}>
                  <View style={[styles.notificationRow, { borderColor: softBorder, backgroundColor: softSurface }]}>
                    <View style={styles.notificationTextWrap}>
                      <ThemedText type="defaultSemiBold">Notifications</ThemedText>
                      <ThemedText type="caption">
                        {notificationsEnabled ? 'Activ\u00e9es' : 'D\u00e9sactiv\u00e9es'}
                      </ThemedText>
                    </View>
                    <Button
                      label={notificationsEnabled ? 'D\u00e9sactiver' : 'Activer'}
                      variant="secondary"
                      size="sm"
                      loading={isNotificationsLoading}
                      style={styles.notificationActionButton}
                      onPress={handleToggleNotifications}
                    />
                  </View>
                  <View style={styles.notificationTypesWrap}>
                    {(
                      [
                        { type: 'new_message_received', label: 'Nouveau message re\u00e7u' },
                        { type: 'loan_request_accepted', label: 'Demande accept\u00e9e' },
                        { type: 'return_due_tomorrow', label: 'Rappel retour demain' },
                      ] as const
                    ).map((item) => (
                      <View key={item.type} style={[styles.notificationTypeRow, { borderColor: softBorder, backgroundColor: softSurface }]}>
                        <ThemedText type="caption" style={styles.notificationTypeLabel} numberOfLines={2}>
                          {item.label}
                        </ThemedText>
                        <Button
                          label={notificationTypePreferences[item.type] ? 'On' : 'Off'}
                          variant="secondary"
                          size="sm"
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

            <View style={[styles.accountSectionCard, { borderColor: softBorder, backgroundColor: softSurface }]}>
              <Collapsible title="Mot de passe">
                <View style={styles.collapsibleContentWrap}>
                  <ThemedText type="caption">
                    Saisis ton ancien mot de passe puis ton nouveau mot de passe.
                  </ThemedText>
                  <Input
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Ancien mot de passe"
                    icon="lock-outline"
                    isPassword
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Input
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nouveau mot de passe"
                    icon="lock-outline"
                    isPassword
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Input
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Confirmer le nouveau mot de passe"
                    icon="lock-outline"
                    isPassword
                    autoCapitalize="none"
                    autoCorrect={false}
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
                    label="Mettre \u00e0 jour le mot de passe"
                    loading={isPasswordUpdateLoading}
                    onPress={handleDirectPasswordChange}
                  />
                  <Divider />
                  <ThemedText type="caption">
                    Tu peux aussi recevoir un lien de r\u00e9initialisation par email.
                  </ThemedText>
                  <Button
                    label="Envoyer un lien de r\u00e9initialisation"
                    variant="secondary"
                    size="sm"
                    loading={isPasswordResetLoading}
                    onPress={handlePasswordReset}
                  />
                </View>
              </Collapsible>
            </View>

            {pendingAccountAction === 'logout' ? (
              <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}12` }]}>
                <ThemedText style={{ color: danger }}>
                  Attention: vous ne recevrez plus de notifications apr\u00e8s d\u00e9connexion.
                </ThemedText>
                <View style={styles.warningActionsRow}>
                  <Button label="Annuler" variant="secondary" size="sm" onPress={() => setPendingAccountAction(null)} />
                  <Button label="Se d\u00e9connecter" variant="danger" size="sm" onPress={confirmLogout} />
                </View>
              </View>
            ) : null}

            {pendingAccountAction === 'delete-account' ? (
              <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}12` }]}>
                <ThemedText style={{ color: danger }}>
                  Vous \u00eates sur le point de supprimer votre compte.
                </ThemedText>
                <View style={styles.warningActionsRow}>
                  <Button
                    label="Annuler"
                    variant="secondary"
                    size="sm"
                    disabled={isAccountDeletionLoading}
                    onPress={() => setPendingAccountAction(null)}
                  />
                  <Button
                    label="Supprimer"
                    variant="danger"
                    size="sm"
                    loading={isAccountDeletionLoading}
                    onPress={confirmDeleteAccount}
                  />
                </View>
              </View>
            ) : null}
            <Button label="Se d\u00e9connecter" variant="secondary" onPress={handleLogout} />
            <Button
              label="Supprimer mon compte"
              variant="danger"
              onPress={handleDeleteAccount}
            />
          </Card>

          <Card style={styles.card}>
            <SectionHeader title="L\u00e9gal" icon="gavel" />
            <Pressable
              onPress={() => router.push(LEGAL_ROUTES.privacyPolicy as never)}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir la politique de confidentialit\u00e9">
              <ThemedText type="link">Politique de confidentialit\u00e9</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push(LEGAL_ROUTES.terms as never)}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir les conditions g\u00e9n\u00e9rales d'utilisation">
              <ThemedText type="link">Conditions g\u00e9n\u00e9rales d’utilisation</ThemedText>
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
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: Spacing.md,
    paddingBottom: 120,
  },
  card: {
    gap: Spacing.md,
    width: '100%',
    paddingVertical: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  profileHeader: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  profileHeaderTextWrap: {
    flex: 1,
    gap: Spacing.xs,
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
  loanGroup: {
    marginTop: Spacing.xs,
  },
  requestGroup: {
    marginTop: Spacing.xs,
  },
  trustRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  trustTextWrap: {
    flex: 1,
    gap: 1,
  },
  photoPublishCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
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
    gap: Spacing.sm,
  },
  accountSectionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: '100%',
    alignSelf: 'center',
  },
  collapsibleContentWrap: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    marginLeft: 0,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 680,
  },
  privateLocationInputsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  privateLocationInputsColumn: {
    flexDirection: 'column',
  },
  privateLocationInputBlock: {
    flex: 1,
  },
  privateLocationActions: {
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  privateLocationActionButton: {
    flex: 1,
  },
  notificationRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 60,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    width: '100%',
    alignSelf: 'center',
  },
  notificationTextWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  notificationTypesWrap: {
    gap: Spacing.sm,
  },
  notificationTypeRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 52,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    width: '100%',
    alignSelf: 'center',
  },
  notificationTypeLabel: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  notificationActionButton: {
    minWidth: 112,
  },
  passwordMatchHint: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  warningActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
