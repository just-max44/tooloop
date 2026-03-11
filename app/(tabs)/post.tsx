import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { PhotoUploadControl } from '@/components/ui/photo-upload-control';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getPrivateLocationPreference, updatePrivateLocationPreference } from '@/lib/backend/auth';
import { CATEGORIES, refreshBackendData } from '@/lib/backend/data';
import { showAppNotice } from '@/stores/app-notice-store';
import { useBackendStore } from '@/stores/backend-store';
import { addListing, getListingById, updateListing } from '@/stores/listings-store';

type PublicationMode = 'loan' | 'request';
type PostSectionKey = 'type' | 'details' | 'location' | 'publish';

const MODE_SEGMENTS: { value: PublicationMode; label: string }[] = [
  { value: 'loan', label: 'Pr\u00eat' },
  { value: 'request', label: 'Recherche' },
];

export default function PostScreen() {
  const DISCOVER_OBJECTS = useBackendStore((s) => s.discoverObjects);
  const PAST_PUBLICATIONS = useBackendStore((s) => s.pastPublications);
  const router = useRouter();
  const params = useLocalSearchParams<{
    listingId?: string;
    mode?: string;
    title?: string;
    description?: string;
    category?: string;
    targetPeriod?: string;
    requiresDeposit?: string;
  }>();
  const [publicationMode, setPublicationMode] = useState<PublicationMode>('loan');
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetPeriod, setTargetPeriod] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [targetPeriodTouched, setTargetPeriodTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('Bricolage');
  const [isPrefillApplied, setIsPrefillApplied] = useState(false);
  const [prefillSourceLabel, setPrefillSourceLabel] = useState<string | null>(null);
  const [showPastPublicationsMenu, setShowPastPublicationsMenu] = useState(false);
  const [selectedPastPublicationId, setSelectedPastPublicationId] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isLocationServiceEnabled, setIsLocationServiceEnabled] = useState<boolean | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [privateCity, setPrivateCity] = useState('');
  const [privatePostalCode, setPrivatePostalCode] = useState('');
  const [isUpdatingLocationFromDevice, setIsUpdatingLocationFromDevice] = useState(false);
  const [showRepublishPanel, setShowRepublishPanel] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<PostSectionKey, boolean>>({
    type: true,
    details: true,
    location: true,
    publish: true,
  });

  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');
  const softSurface = `${surface}F2`;
  const softBorder = `${border}AA`;

  const isLoanPublication = publicationMode === 'loan';
  const isLocationReady = locationPermission === 'granted' && isLocationServiceEnabled === true;
  const hasPrivateLocationFallback = privateCity.trim().length > 0 && privatePostalCode.trim().length > 0;
  const canPublishWithLocation = isLocationReady || hasPrivateLocationFallback;
  const hasPastPublications = PAST_PUBLICATIONS.length > 0;
  const selectedPastPublication = useMemo(
    () => PAST_PUBLICATIONS.find((item) => item.id === selectedPastPublicationId) ?? null,
    [PAST_PUBLICATIONS, selectedPastPublicationId]
  );

  const syncLocationState = async () => {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        setLocationPermission('granted');
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        setIsLocationServiceEnabled(servicesEnabled);
      } else if (permission.status === 'denied' && !permission.canAskAgain) {
        setLocationPermission('denied');
        setIsLocationServiceEnabled(null);
      } else {
        setLocationPermission('unknown');
        setIsLocationServiceEnabled(null);
      }
    } catch {
      setLocationPermission('unknown');
      setIsLocationServiceEnabled(null);
    }
  };

  const requestLocationPermission = async () => {
    if (locationPermission === 'denied') {
      showAppNotice('Localisation refus\u00e9e. Active-la dans les r\u00e9glages de ton t\u00e9l\u00e9phone.', 'warning');
      await Linking.openSettings();
      return;
    }

    setIsRequestingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        setLocationPermission('granted');

        if (Location.enableNetworkProviderAsync) {
          await Location.enableNetworkProviderAsync().catch(() => {});
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        setIsLocationServiceEnabled(servicesEnabled);

        if (servicesEnabled) {
          await updatePrivateLocationFromCurrentPosition();
        }
      } else if (!permission.canAskAgain) {
        setLocationPermission('denied');
        setIsLocationServiceEnabled(null);
        showAppNotice('Localisation refus\u00e9e d\u00e9finitivement. Va dans R\u00e9glages > Tooloop > Localisation.', 'warning');
      } else {
        setLocationPermission('unknown');
        setIsLocationServiceEnabled(null);
        showAppNotice('Autorise la localisation pour publier ton annonce.', 'warning');
      }
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const applyPublicationPreset = (preset: {
    publicationMode: PublicationMode;
    title: string;
    description: string;
    category: (typeof CATEGORIES)[number];
    targetPeriod?: string;
    requiresDeposit?: boolean;
  }) => {
    setPublicationMode(preset.publicationMode);
    setTitle(preset.title);
    setDescription(preset.description);
    setSelectedCategory(preset.category);
    setTargetPeriod(preset.targetPeriod ?? '');
    setRequiresDeposit(Boolean(preset.requiresDeposit));
    setSubmitAttempted(false);
    setTitleTouched(false);
    setDescriptionTouched(false);
    setTargetPeriodTouched(false);
    setPrefillSourceLabel(`Annonce pr\u00e9remplie: ${preset.title}`);
  };

  const resetPublicationForm = () => {
    setPublicationMode('loan');
    setRequiresDeposit(false);
    setTitle('');
    setDescription('');
    setTargetPeriod('');
    setPhotoUri(null);
    setSubmitAttempted(false);
    setTitleTouched(false);
    setDescriptionTouched(false);
    setTargetPeriodTouched(false);
    setSelectedCategory('Bricolage');
    setPrefillSourceLabel(null);
    setSelectedPastPublicationId(null);
  };

  useEffect(() => {
    const listingId = typeof params.listingId === 'string' ? params.listingId : '';
    if (listingId) {
      return;
    }

    setEditingListingId(null);
    setIsPrefillApplied(false);
    resetPublicationForm();
  }, [params.listingId]);

  useEffect(() => {
    if (isPrefillApplied) {
      return;
    }

    const listingId = typeof params.listingId === 'string' ? params.listingId : '';
    if (listingId) {
      const listing = getListingById(listingId);
      if (listing) {
        applyPublicationPreset({
          publicationMode: listing.publicationMode,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          targetPeriod: listing.targetPeriod,
          requiresDeposit: listing.requiresDeposit,
        });
        setEditingListingId(listing.id);
        setPrefillSourceLabel(`Modification: ${listing.title}`);

        if (listing.photoUri) {
          setPhotoUri(listing.photoUri);
        }

        if (listing.publicationMode === 'loan' && listing.linkedObjectId) {
          const linkedObject = DISCOVER_OBJECTS.find((item) => item.id === listing.linkedObjectId);
          if (linkedObject?.imageUrl) {
            setPhotoUri(linkedObject.imageUrl);
          }
        }

        setIsPrefillApplied(true);
        return;
      }
    }
  }, [
    DISCOVER_OBJECTS,
    isPrefillApplied,
    params.listingId,
  ]);

  useEffect(() => {
    syncLocationState().catch(() => {
      setLocationPermission('denied');
      setIsLocationServiceEnabled(null);
      setIsRequestingLocation(false);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    getPrivateLocationPreference()
      .then((preference) => {
        if (!isMounted || !preference) {
          return;
        }
        setPrivateCity(preference.city);
        setPrivatePostalCode(preference.postalCode);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const canSubmit = useMemo(
    () =>
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      (isLoanPublication ? Boolean(photoUri) : targetPeriod.trim().length > 0),
    [description, isLoanPublication, photoUri, targetPeriod, title],
  );

  const missingRequirements = useMemo(() => {
    const missing: string[] = [];
    if (isLoanPublication && !photoUri) {
      missing.push('photo');
    }
    if (title.trim().length === 0) {
      missing.push('objet');
    }
    if (description.trim().length === 0) {
      missing.push('description');
    }
    if (!isLoanPublication && targetPeriod.trim().length === 0) {
      missing.push('p\u00e9riode');
    }
    if (!canPublishWithLocation) {
      missing.push('position activ\u00e9e');
    }
    return missing;
  }, [canPublishWithLocation, description, isLoanPublication, photoUri, targetPeriod, title]);

  const titleError = title.trim().length === 0 ? (isLoanPublication ? 'Le nom de l\u2019objet est requis.' : 'L\u2019objet recherch\u00e9 est requis.') : null;
  const descriptionError = description.trim().length === 0 ? 'La description est requise.' : null;
  const photoError = isLoanPublication && !photoUri ? 'La photo est obligatoire pour un pr\u00eat.' : null;
  const targetPeriodError = !isLoanPublication && targetPeriod.trim().length === 0 ? 'La p\u00e9riode souhait\u00e9e est requise.' : null;

  const submitSuccessMessage = isLoanPublication
    ? 'Ton objet est pr\u00eat \u00e0 \u00eatre d\u00e9couvert par les voisins.'
    : 'Ta recherche est visible pour les voisins qui peuvent pr\u00eater cet objet.';
  const isEditing = !!editingListingId;

  const toggleSection = (section: PostSectionKey) => {
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const switchPublicationMode = (mode: PublicationMode) => {
    if (mode === publicationMode) {
      return;
    }

    setPublicationMode(mode);
    setSubmitAttempted(false);
    setTitleTouched(false);
    setDescriptionTouched(false);
    setTargetPeriodTouched(false);
  };

  const pickPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAppNotice('Autorise l\u2019acc\u00e8s \u00e0 la galerie pour ajouter une photo.', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAppNotice('Autorise l\u2019acc\u00e8s \u00e0 la cam\u00e9ra pour prendre une photo.', 'warning');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submitPost = async () => {
    setSubmitAttempted(true);
    if (!canSubmit) {
      return;
    }

    if (!canPublishWithLocation) {
      await requestLocationPermission();
      showAppNotice(
        locationPermission === 'denied'
          ? 'Active la localisation dans les r\u00e9glages avant de publier.'
          : 'Active la localisation pour publier cette annonce.',
        'warning'
      );
      return;
    }

    const payload = {
      publicationMode,
      title: title.trim(),
      description: description.trim(),
      photoUri: publicationMode === 'loan' ? photoUri ?? undefined : undefined,
      category: selectedCategory,
      targetPeriod: publicationMode === 'request' ? targetPeriod.trim() : undefined,
      requiresDeposit: publicationMode === 'loan' ? requiresDeposit : undefined,
    } as const;

    try {
      if (editingListingId) {
        await updateListing(editingListingId, payload);
      } else {
        await addListing(payload);
      }

      showAppNotice(editingListingId ? 'Publication mise \u00e0 jour.' : submitSuccessMessage, 'success');
      resetPublicationForm();
      setPublicationMode('loan');
      setEditingListingId(null);
      router.push(isLoanPublication ? '/(tabs)/explore' : '/(tabs)/inbox');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
          ? error.message
          : 'Publication impossible. V\u00e9rifie ta connexion et r\u00e9essaie.';
      showAppNotice(message, 'error');
    }
  };

  const updatePrivateLocationFromCurrentPosition = async () => {
    setIsUpdatingLocationFromDevice(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        showAppNotice('Active la localisation pour mettre \u00e0 jour ta zone de publication.', 'warning');
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
        showAppNotice('Position d\u00e9tect\u00e9e mais ville/CP non disponibles. Mets \u00e0 jour ton profil manuellement.', 'warning');
        return;
      }

      setPrivateCity(city);
      setPrivatePostalCode(postalCode);
      setLocationPermission('granted');
      setIsLocationServiceEnabled(true);
      await updatePrivateLocationPreference({ city, postalCode });
      showAppNotice('Position de publication mise \u00e0 jour depuis ta position actuelle.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mise \u00e0 jour de position impossible.';
      showAppNotice(message, 'error');
    } finally {
      setIsUpdatingLocationFromDevice(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBackendData();
      await syncLocationState();

      const preference = await getPrivateLocationPreference();
      if (preference) {
        setPrivateCity(preference.city);
        setPrivatePostalCode(preference.postalCode);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 20}>
        <ThemedView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tint} colors={[tint]} />}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="always">
            <Card style={styles.card}>
              <ThemedText type="title">{isEditing ? 'Modifier la publication' : 'Nouvelle publication'}</ThemedText>

              {prefillSourceLabel ? (
                <View style={[styles.prefillBanner, { borderColor: `${tint}55`, backgroundColor: `${tint}12` }]}>
                  <View style={styles.prefillBannerTextWrap}>
                    <ThemedText type="defaultSemiBold" style={{ color: tint }}>
                      Champs pr\u00e9remplis
                    </ThemedText>
                    <ThemedText type="caption">{prefillSourceLabel}</ThemedText>
                  </View>
                </View>
              ) : null}

              {submitAttempted && (!canSubmit || !canPublishWithLocation) ? (
                <View style={[styles.errorSummary, { borderColor: `${danger}55`, backgroundColor: `${danger}10` }]}>
                  <ThemedText type="defaultSemiBold" style={{ color: danger }}>
                    V\u00e9rifie les informations avant de publier
                  </ThemedText>
                  <ThemedText style={{ color: danger, fontSize: 12 }}>
                    Manquant: {missingRequirements.join(', ')}.
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.sectionWrap}>
                <Pressable
                  onPress={() => toggleSection('type')}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir ou fermer la section type de publication"
                  style={[styles.sectionHeader, { borderColor: softBorder, backgroundColor: softSurface }]}>
                  <View style={styles.sectionLabelRow}>
                    <ThemedText type="defaultSemiBold">\u00c9tape 1 \u00b7 Type de publication</ThemedText>
                  </View>
                  <MaterialIcons
                    name={expandedSections.type ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={18}
                    color={mutedText}
                  />
                </Pressable>

                {expandedSections.type ? (
                  <View style={styles.sectionBody}>
                    <SegmentedControl
                      segments={MODE_SEGMENTS}
                      selected={publicationMode}
                      onChange={switchPublicationMode}
                    />

                    <View style={styles.formGroup}>
                      <Pressable
                        onPress={() => setShowRepublishPanel((current) => !current)}
                        style={[styles.dropdownTrigger, { borderColor: softBorder, backgroundColor: softSurface }]}
                        accessibilityRole="button"
                        accessibilityLabel="Ouvrir ou fermer republier une annonce pass\u00e9e"
                        accessibilityState={{ expanded: showRepublishPanel }}>
                        <ThemedText type="defaultSemiBold" style={{ color: text, fontSize: 13 }} numberOfLines={1}>
                          Republier une annonce pass\u00e9e (optionnel)
                        </ThemedText>
                        <MaterialIcons
                          name={showRepublishPanel ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                          size={18}
                          color={mutedText}
                        />
                      </Pressable>

                      {showRepublishPanel ? (
                        <>
                          <Pressable
                            onPress={() => {
                              if (!hasPastPublications) {
                                return;
                              }
                              setShowPastPublicationsMenu((current) => !current);
                            }}
                            style={[styles.dropdownTrigger, { borderColor: softBorder, backgroundColor: softSurface }]}
                            accessibilityRole="button"
                            accessibilityLabel="Ouvrir la liste des annonces pass\u00e9es"
                            accessibilityState={{ disabled: !hasPastPublications }}>
                            <ThemedText
                              type="defaultSemiBold"
                              style={{ color: hasPastPublications ? (selectedPastPublication ? text : mutedText) : mutedText, fontSize: 13 }}
                              numberOfLines={1}>
                              {hasPastPublications
                                ? (selectedPastPublication ? selectedPastPublication.title : 'S\u00e9lectionner une annonce pass\u00e9e')
                                : 'Aucune annonce pass\u00e9e disponible'}
                            </ThemedText>
                            <MaterialIcons
                              name={showPastPublicationsMenu ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                              size={18}
                              color={mutedText}
                            />
                          </Pressable>

                          {showPastPublicationsMenu && hasPastPublications ? (
                            <View style={[styles.dropdownMenu, { borderColor: softBorder, backgroundColor: softSurface }]}>
                              {PAST_PUBLICATIONS.map((pastItem) => {
                                const isSelected = selectedPastPublicationId === pastItem.id;
                                return (
                                  <Pressable
                                    key={pastItem.id}
                                    onPress={() => {
                                      setSelectedPastPublicationId(pastItem.id);
                                      setShowPastPublicationsMenu(false);
                                    }}
                                    style={[
                                      styles.dropdownMenuItem,
                                      isSelected ? { backgroundColor: `${tint}14` } : null,
                                    ]}
                                    accessibilityRole="button"
                                    accessibilityLabel={`S\u00e9lectionner l'annonce ${pastItem.title}`}>
                                    <ThemedText
                                      type={isSelected ? 'defaultSemiBold' : 'default'}
                                      style={{ color: isSelected ? tint : text, fontSize: 13 }}
                                      numberOfLines={1}>
                                      {pastItem.title}
                                    </ThemedText>
                                  </Pressable>
                                );
                              })}
                            </View>
                          ) : null}

                          <Button
                            label="Pr\u00e9-remplir le formulaire"
                            variant="secondary"
                            size="sm"
                            disabled={!selectedPastPublication}
                            onPress={() => {
                              if (!selectedPastPublication) {
                                return;
                              }
                              applyPublicationPreset({
                                publicationMode: selectedPastPublication.publicationMode,
                                title: selectedPastPublication.title,
                                description: selectedPastPublication.description,
                                category: selectedPastPublication.category,
                                targetPeriod: selectedPastPublication.targetPeriod,
                                requiresDeposit: selectedPastPublication.requiresDeposit,
                              });
                            }}
                          />
                        </>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionWrap}>
                <Pressable
                  onPress={() => toggleSection('details')}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir ou fermer la section d\u00e9tails de l'annonce"
                  style={[styles.sectionHeader, { borderColor: softBorder, backgroundColor: softSurface }]}>
                  <View style={styles.sectionLabelRow}>
                    <ThemedText type="defaultSemiBold">\u00c9tape 2 \u00b7 D\u00e9tails de l’annonce</ThemedText>
                  </View>
                  <MaterialIcons
                    name={expandedSections.details ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={18}
                    color={mutedText}
                  />
                </Pressable>

                {expandedSections.details ? (
                  <View style={styles.sectionBody}>
                    {isLoanPublication ? (
                      <PhotoUploadControl
                        photoUri={photoUri}
                        onPickPhoto={pickPhoto}
                        onTakePhoto={takePhoto}
                        onRemovePhoto={() => setPhotoUri(null)}
                        error={submitAttempted ? photoError : null}
                        colors={{ tint, border, surface, softBorder, softSurface, danger, mutedText }}
                      />
                    ) : null}

                    <Input
                      label={isLoanPublication ? 'Nom de l\u2019objet' : 'Objet recherch\u00e9'}
                      value={title}
                      onChangeText={setTitle}
                      onBlur={() => setTitleTouched(true)}
                      placeholder={isLoanPublication ? 'Ex: Perceuse Bosch' : 'Ex: Perceuse Bosch 18V'}
                      error={titleError}
                      showError={titleTouched || submitAttempted}
                    />

                    <View style={styles.formGroup}>
                      <ThemedText type="defaultSemiBold">Description</ThemedText>
                      <TextInput
                        value={description}
                        onChangeText={setDescription}
                        onBlur={() => setDescriptionTouched(true)}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        placeholder={
                          isLoanPublication
                            ? '\u00c9tat, conditions de pr\u00eat, disponibilit\u00e9...'
                            : 'Pr\u00e9cise ton besoin, usage, budget \u00e9ventuel, contraintes...'
                        }
                        placeholderTextColor={mutedText}
                        style={[
                          styles.textarea,
                          { color: text, borderColor: softBorder, backgroundColor: softSurface },
                        ]}
                      />
                      {(descriptionTouched || submitAttempted) && descriptionError ? (
                        <ThemedText style={{ color: danger, fontSize: 12 }}>{descriptionError}</ThemedText>
                      ) : null}
                    </View>

                    {!isLoanPublication ? (
                      <Input
                        label="P\u00e9riode souhait\u00e9e"
                        value={targetPeriod}
                        onChangeText={setTargetPeriod}
                        onBlur={() => setTargetPeriodTouched(true)}
                        placeholder="Ex: ce weekend, 3 jours max"
                        error={targetPeriodError}
                        showError={targetPeriodTouched || submitAttempted}
                      />
                    ) : null}

                    {isLoanPublication ? (
                      <View style={styles.formGroup}>
                        <ThemedText type="defaultSemiBold">Souhaites-tu une caution ?</ThemedText>
                        <SegmentedControl
                          segments={[
                            { value: 'no', label: 'Non' },
                            { value: 'yes', label: 'Oui' },
                          ]}
                          selected={requiresDeposit ? 'yes' : 'no'}
                          onChange={(v) => setRequiresDeposit(v === 'yes')}
                        />
                        <ThemedText type="caption">
                          {requiresDeposit ? 'La publication indiquera qu\u2019une caution est demand\u00e9e.' : 'La publication indiquera qu\u2019aucune caution n\u2019est demand\u00e9e.'}
                        </ThemedText>
                      </View>
                    ) : null}

                    <View style={styles.formGroup}>
                      <ThemedText type="defaultSemiBold">Cat\u00e9gorie</ThemedText>
                      <View style={[styles.compactInfoRow, { borderColor: softBorder, backgroundColor: softSurface }]}>
                        <ThemedText type="defaultSemiBold" style={{ color: text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                          {selectedCategory}
                        </ThemedText>
                        <Button
                          label={showCategorySelector ? 'Fermer' : 'Changer'}
                          variant="ghost"
                          size="sm"
                          onPress={() => setShowCategorySelector((current) => !current)}
                        />
                      </View>
                      {showCategorySelector ? (
                        <View style={styles.categoryWrap}>
                          {CATEGORIES.map((category) => (
                            <Chip
                              key={category}
                              label={category}
                              selected={selectedCategory === category}
                              onPress={() => {
                                setSelectedCategory(category);
                                setShowCategorySelector(false);
                              }}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionWrap}>
                <Pressable
                  onPress={() => toggleSection('location')}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir ou fermer la section localisation"
                  style={[styles.sectionHeader, { borderColor: softBorder, backgroundColor: softSurface }]}>
                  <View style={styles.sectionLabelRow}>
                    <ThemedText type="defaultSemiBold">\u00c9tape 3 \u00b7 Localisation</ThemedText>
                  </View>
                  <MaterialIcons
                    name={expandedSections.location ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={18}
                    color={mutedText}
                  />
                </Pressable>

                {expandedSections.location ? (
                  <View style={styles.sectionBody}>
                    <View style={[styles.locationCompactRow, { borderColor: softBorder, backgroundColor: softSurface }]}>
                      <MaterialIcons
                        name={isLocationReady ? 'location-on' : 'location-off'}
                        size={16}
                        color={isLocationReady ? tint : mutedText}
                      />
                      <ThemedText style={{ color: isLocationReady ? text : mutedText, fontSize: 13, flex: 1, marginLeft: 6 }} numberOfLines={2}>
                        {isLocationReady
                          ? (privateCity ? `${privateCity} (${privatePostalCode})` : 'Position active')
                          : hasPrivateLocationFallback
                            ? `${privateCity} (${privatePostalCode})`
                            : 'Autorise la localisation pour publier'}
                      </ThemedText>
                    </View>
                    <View style={styles.locationCompactActions}>
                      {isLocationReady ? (
                        <Button
                          label={isUpdatingLocationFromDevice ? 'Mise \u00e0 jour...' : 'Mettre \u00e0 jour ma position'}
                          variant="secondary"
                          size="sm"
                          onPress={updatePrivateLocationFromCurrentPosition}
                          disabled={isUpdatingLocationFromDevice}
                        />
                      ) : (
                        <Button
                          label={isRequestingLocation ? 'Activation...' : 'Autoriser la localisation'}
                          variant="primary"
                          size="sm"
                          onPress={requestLocationPermission}
                          disabled={isRequestingLocation}
                        />
                      )}
                    </View>
                    <ThemedText type="caption" style={{ fontSize: 11 }}>
                      Ta position sert uniquement \u00e0 rendre ton annonce visible pr\u00e8s de chez toi.
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionWrap}>
                <Pressable
                  onPress={() => toggleSection('publish')}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir ou fermer la section publication"
                  style={[styles.sectionHeader, { borderColor: softBorder, backgroundColor: softSurface }]}>
                  <View style={styles.sectionLabelRow}>
                    <ThemedText type="defaultSemiBold">\u00c9tape 4 \u00b7 Publication</ThemedText>
                  </View>
                  <MaterialIcons
                    name={expandedSections.publish ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={18}
                    color={mutedText}
                  />
                </Pressable>

                {expandedSections.publish ? (
                  <View style={[styles.publishBlock, { borderColor: softBorder, backgroundColor: softSurface }]}>
                    <Button
                      label={
                        isEditing
                          ? 'Enregistrer les modifications'
                          : isLoanPublication
                            ? 'Publier le pr\u00eat'
                            : 'Publier la recherche'
                      }
                      variant="primary"
                      size="lg"
                      disabled={!canSubmit || !canPublishWithLocation}
                      onPress={submitPost}
                      accessibilityLabel={isLoanPublication ? 'Publier cette annonce de pr\u00eat' : 'Publier cette annonce de recherche'}
                    />
                    {!canSubmit || !canPublishWithLocation ? (
                      <ThemedText type="caption">
                        Compl\u00e8te: {missingRequirements.join(', ')}.
                      </ThemedText>
                    ) : null}
                  </View>
                ) : null}
              </View>
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
  },
  content: {
    padding: Spacing.lg,
    flexGrow: 1,
    paddingBottom: 34,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    gap: Spacing.md,
  },
  sectionWrap: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionBody: {
    gap: Spacing.sm,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  prefillBanner: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  prefillBannerTextWrap: {
    flex: 1,
    gap: 1,
  },
  errorSummary: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    minHeight: 42,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  compactInfoRow: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationCompactRow: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  locationCompactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  publishBlock: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
});
