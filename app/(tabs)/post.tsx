import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CATEGORIES, DISCOVER_OBJECTS, PAST_PUBLICATIONS, useBackendDataVersion } from '@/lib/backend/data';
import { showAppNotice } from '@/stores/app-notice-store';
import { addListing, getListingById, updateListing } from '@/stores/listings-store';

type PublicationMode = 'loan' | 'request';

export default function PostScreen() {
  useBackendDataVersion();
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
  const [showPastPublications, setShowPastPublications] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isLocationServiceEnabled, setIsLocationServiceEnabled] = useState<boolean | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  const isLoanPublication = publicationMode === 'loan';
  const isLocationReady = locationPermission === 'granted' && isLocationServiceEnabled === true;

  const syncLocationState = async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    const granted = permission.status === 'granted';
    setLocationPermission(granted ? 'granted' : 'denied');

    if (!granted) {
      setIsLocationServiceEnabled(null);
      return;
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    setIsLocationServiceEnabled(servicesEnabled);
  };

  const requestLocationPermission = async () => {
    if (locationPermission === 'denied') {
      await Linking.openSettings();
      return;
    }

    setIsRequestingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      const granted = permission.status === 'granted';
      setLocationPermission(granted ? 'granted' : 'denied');

      if (!granted) {
        setIsLocationServiceEnabled(null);
        return;
      }

      if (Location.enableNetworkProviderAsync) {
        await Location.enableNetworkProviderAsync().catch(() => {});
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      setIsLocationServiceEnabled(servicesEnabled);
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
    setPrefillSourceLabel(`Annonce préremplie: ${preset.title}`);
  };

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

    if (!params.title && !params.description) {
      return;
    }

    const resolvedMode: PublicationMode = params.mode === 'request' ? 'request' : 'loan';
    const categoryValue = typeof params.category === 'string' ? params.category : '';
    const resolvedCategory = CATEGORIES.includes(categoryValue as (typeof CATEGORIES)[number])
      ? (categoryValue as (typeof CATEGORIES)[number])
      : 'Bricolage';

    applyPublicationPreset({
      publicationMode: resolvedMode,
      title: typeof params.title === 'string' ? params.title : '',
      description: typeof params.description === 'string' ? params.description : '',
      category: resolvedCategory,
      targetPeriod: typeof params.targetPeriod === 'string' ? params.targetPeriod : '',
      requiresDeposit: params.requiresDeposit === '1',
    });

    setIsPrefillApplied(true);
  }, [
    isPrefillApplied,
    params.category,
    params.description,
    params.listingId,
    params.mode,
    params.requiresDeposit,
    params.targetPeriod,
    params.title,
  ]);

  useEffect(() => {
    syncLocationState().catch(() => {
      setLocationPermission('denied');
      setIsLocationServiceEnabled(null);
      setIsRequestingLocation(false);
    });
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
      missing.push('période');
    }
    if (!isLocationReady) {
      missing.push('position activée');
    }
    return missing;
  }, [description, isLoanPublication, isLocationReady, photoUri, targetPeriod, title]);

  const titleError = title.trim().length === 0 ? (isLoanPublication ? 'Le nom de l’objet est requis.' : 'L’objet recherché est requis.') : null;
  const descriptionError = description.trim().length === 0 ? 'La description est requise.' : null;
  const photoError = isLoanPublication && !photoUri ? 'La photo est obligatoire pour un prêt.' : null;
  const targetPeriodError = !isLoanPublication && targetPeriod.trim().length === 0 ? 'La période souhaitée est requise.' : null;

  const submitSuccessMessage = isLoanPublication
    ? 'Ton objet est prêt à être découvert par les voisins.'
    : 'Ta recherche est visible pour les voisins qui peuvent prêter cet objet.';
  const isEditing = !!editingListingId;

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
      showAppNotice('Autorise l’accès à la galerie pour ajouter une photo.', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      showAppNotice('Autorise l’accès à la caméra pour prendre une photo.', 'warning');
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

    if (!isLocationReady) {
      await requestLocationPermission();
      showAppNotice(
        locationPermission === 'denied'
          ? 'Active la localisation dans les réglages avant de publier.'
          : 'Active la localisation pour publier cette annonce.',
        'warning'
      );
      return;
    }

    const payload = {
      publicationMode,
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      targetPeriod: publicationMode === 'request' ? targetPeriod.trim() : undefined,
      requiresDeposit: publicationMode === 'loan' ? requiresDeposit : undefined,
    } as const;

    if (editingListingId) {
      await updateListing(editingListingId, payload);
    } else {
      await addListing(payload);
    }

    showAppNotice(editingListingId ? 'Publication mise à jour.' : submitSuccessMessage, 'success');
    setTitle('');
    setDescription('');
    setTargetPeriod('');
    setPhotoUri(null);
    setRequiresDeposit(false);
    setTitleTouched(false);
    setDescriptionTouched(false);
    setTargetPeriodTouched(false);
    setSubmitAttempted(false);
    setSelectedCategory('Bricolage');
    setPublicationMode('loan');
    setEditingListingId(null);
    router.push(isLoanPublication ? '/(tabs)/explore' : '/(tabs)/inbox');
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="always">
            <Card style={styles.card}>
              <ThemedText type="title">{isEditing ? 'Modifier la publication' : 'Nouvelle publication'}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedText }]}>Choisis le type puis complète le formulaire.</ThemedText>

              {prefillSourceLabel ? (
                <View style={[styles.prefillBanner, { borderColor: `${tint}55`, backgroundColor: `${tint}12` }]}>
                  <MaterialIcons name="auto-awesome" size={16} color={tint} />
                  <View style={styles.prefillBannerTextWrap}>
                    <ThemedText type="defaultSemiBold" style={{ color: tint }}>
                      Champs préremplis
                    </ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>{prefillSourceLabel}</ThemedText>
                  </View>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <ThemedText type="defaultSemiBold">Type de publication</ThemedText>
                <View style={styles.modeRow}>
                  <Pressable
                    onPress={() => switchPublicationMode('loan')}
                    accessibilityRole="button"
                    accessibilityLabel="Créer une publication de prêt"
                    accessibilityState={{ selected: publicationMode === 'loan' }}
                    style={[
                      styles.modeButton,
                      {
                        borderColor: publicationMode === 'loan' ? tint : border,
                        backgroundColor: publicationMode === 'loan' ? `${tint}22` : surface,
                      },
                    ]}>
                    <ThemedText type="defaultSemiBold" style={{ color: publicationMode === 'loan' ? tint : text }}>
                      Prêt
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => switchPublicationMode('request')}
                    accessibilityRole="button"
                    accessibilityLabel="Créer une publication de recherche"
                    accessibilityState={{ selected: publicationMode === 'request' }}
                    style={[
                      styles.modeButton,
                      {
                        borderColor: publicationMode === 'request' ? tint : border,
                        backgroundColor: publicationMode === 'request' ? `${tint}22` : surface,
                      },
                    ]}>
                    <ThemedText type="defaultSemiBold" style={{ color: publicationMode === 'request' ? tint : text }}>
                      Recherche
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="defaultSemiBold">Position</ThemedText>
                <View style={[styles.locationRow, { borderColor: border, backgroundColor: surface }]}>
                  <MaterialIcons name="my-location" size={16} color={tint} />
                  <View style={styles.locationTextWrap}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
                      {isLocationReady ? 'Position active' : 'Position requise pour publier'}
                    </ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      {isLocationReady
                        ? 'Tes annonces seront publiées avec une zone locale fiable.'
                        : locationPermission === 'denied'
                          ? 'Autorisation refusée: ouvre les réglages pour l’activer.'
                          : 'Active la localisation pour pouvoir publier.'}
                    </ThemedText>
                  </View>
                </View>
                {!isLocationReady ? (
                  <Button
                    label={
                      isRequestingLocation
                        ? 'Activation en cours...'
                        : locationPermission === 'denied'
                          ? 'Ouvrir les réglages localisation'
                          : 'Activer ma position'
                    }
                    variant="secondary"
                    onPress={requestLocationPermission}
                    disabled={isRequestingLocation}
                  />
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="defaultSemiBold">Republier une annonce passée</ThemedText>
                {PAST_PUBLICATIONS.length > 0 ? (
                  <Button
                    label={showPastPublications ? 'Masquer les annonces passées' : 'Afficher les annonces passées'}
                    variant="secondary"
                    onPress={() => setShowPastPublications((current) => !current)}
                  />
                ) : null}
                {showPastPublications && PAST_PUBLICATIONS.length > 0 ? (
                  <View style={styles.pastWrap}>
                    {PAST_PUBLICATIONS.map((pastItem) => (
                      <View key={pastItem.id} style={[styles.pastRow, { borderColor: border, backgroundColor: surface }]}>
                        <View style={styles.pastTextWrap}>
                          <ThemedText type="defaultSemiBold" numberOfLines={1}>{pastItem.title}</ThemedText>
                          <ThemedText style={{ color: mutedText, fontSize: 12 }} numberOfLines={1}>
                            {pastItem.archivedAtLabel}
                          </ThemedText>
                        </View>
                        <View style={styles.pastActionsWrap}>
                          <ThemedText style={{ color: mutedText, fontSize: 11 }}>
                            {pastItem.publicationMode === 'loan' ? 'Prêt' : 'Recherche'}
                          </ThemedText>
                          <Button
                            label="Republier"
                            variant="secondary"
                            style={styles.republishButton}
                            onPress={() =>
                              applyPublicationPreset({
                                publicationMode: pastItem.publicationMode,
                                title: pastItem.title,
                                description: pastItem.description,
                                category: pastItem.category,
                                targetPeriod: pastItem.targetPeriod,
                                requiresDeposit: pastItem.requiresDeposit,
                              })
                            }
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              {isLoanPublication ? (
                <View style={styles.formGroup}>
                  <ThemedText type="defaultSemiBold">Photo de l’objet</ThemedText>
                  {photoUri ? (
                    <View style={[styles.photoPreviewWrap, { borderColor: border, backgroundColor: surface }]}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                    </View>
                  ) : (
                    <View style={styles.photoSourceRow}>
                      <Pressable
                        onPress={pickPhoto}
                        accessibilityRole="button"
                        accessibilityLabel="Ajouter une photo depuis la galerie"
                        style={[styles.photoPicker, { borderColor: border, backgroundColor: surface }]}>
                        <MaterialIcons name="photo-library" size={18} color={tint} />
                        <ThemedText type="defaultSemiBold" style={{ color: tint }}>
                          Galerie
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={takePhoto}
                        accessibilityRole="button"
                        accessibilityLabel="Prendre une photo"
                        style={[styles.photoPicker, { borderColor: border, backgroundColor: surface }]}>
                        <MaterialIcons name="photo-camera" size={18} color={tint} />
                        <ThemedText type="defaultSemiBold" style={{ color: tint }}>
                          Caméra
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {photoUri ? (
                    <View style={styles.photoActions}>
                      <Button label="Galerie" variant="ghost" onPress={pickPhoto} />
                      <Button label="Caméra" variant="ghost" onPress={takePhoto} />
                      <Button label="Supprimer" variant="ghost" onPress={() => setPhotoUri(null)} />
                    </View>
                  ) : (
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      Une photo est obligatoire pour une publication de prêt.
                    </ThemedText>
                  )}
                  {submitAttempted && photoError ? (
                    <ThemedText style={{ color: danger, fontSize: 12 }}>{photoError}</ThemedText>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <ThemedText type="defaultSemiBold">{isLoanPublication ? 'Nom de l’objet' : 'Objet recherché'}</ThemedText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setTitleTouched(true)}
                  placeholder={isLoanPublication ? 'Ex: Perceuse Bosch' : 'Ex: Perceuse Bosch 18V'}
                  placeholderTextColor={mutedText}
                  style={[
                    styles.input,
                    prefillSourceLabel ? { borderColor: `${tint}66`, backgroundColor: `${tint}10` } : null,
                    { color: text, borderColor: prefillSourceLabel ? `${tint}66` : border, backgroundColor: prefillSourceLabel ? `${tint}10` : surface },
                  ]}
                />
                {(titleTouched || submitAttempted) && titleError ? (
                  <ThemedText style={{ color: danger, fontSize: 12 }}>{titleError}</ThemedText>
                ) : null}
              </View>

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
                      ? 'État, conditions de prêt, disponibilité...'
                      : 'Précise ton besoin, usage, budget éventuel, contraintes...'
                  }
                  placeholderTextColor={mutedText}
                  style={[
                    styles.textarea,
                    { color: text, borderColor: prefillSourceLabel ? `${tint}66` : border, backgroundColor: prefillSourceLabel ? `${tint}10` : surface },
                  ]}
                />
                {(descriptionTouched || submitAttempted) && descriptionError ? (
                  <ThemedText style={{ color: danger, fontSize: 12 }}>{descriptionError}</ThemedText>
                ) : null}
              </View>

              {!isLoanPublication ? (
                <View style={styles.formGroup}>
                  <ThemedText type="defaultSemiBold">Période souhaitée</ThemedText>
                  <TextInput
                    value={targetPeriod}
                    onChangeText={setTargetPeriod}
                    onBlur={() => setTargetPeriodTouched(true)}
                    placeholder="Ex: ce weekend, 3 jours max"
                    placeholderTextColor={mutedText}
                    style={[
                      styles.input,
                      { color: text, borderColor: prefillSourceLabel ? `${tint}66` : border, backgroundColor: prefillSourceLabel ? `${tint}10` : surface },
                    ]}
                  />
                  {(targetPeriodTouched || submitAttempted) && targetPeriodError ? (
                    <ThemedText style={{ color: danger, fontSize: 12 }}>{targetPeriodError}</ThemedText>
                  ) : null}
                </View>
              ) : null}

              {isLoanPublication ? (
                <View style={styles.formGroup}>
                  <ThemedText type="defaultSemiBold">Souhaites-tu une caution ?</ThemedText>
                  <View style={styles.modeRow}>
                    <Pressable
                      onPress={() => setRequiresDeposit(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Prêt sans caution"
                      accessibilityState={{ selected: !requiresDeposit }}
                      style={[
                        styles.modeButton,
                        {
                          borderColor: !requiresDeposit ? tint : border,
                          backgroundColor: !requiresDeposit ? `${tint}22` : surface,
                        },
                      ]}>
                      <ThemedText type="defaultSemiBold" style={{ color: !requiresDeposit ? tint : text }}>
                        Non
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setRequiresDeposit(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Prêt avec caution"
                      accessibilityState={{ selected: requiresDeposit }}
                      style={[
                        styles.modeButton,
                        {
                          borderColor: requiresDeposit ? tint : border,
                          backgroundColor: requiresDeposit ? `${tint}22` : surface,
                        },
                      ]}>
                      <ThemedText type="defaultSemiBold" style={{ color: requiresDeposit ? tint : text }}>
                        Oui
                      </ThemedText>
                    </Pressable>
                  </View>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    {requiresDeposit ? 'La publication indiquera qu’une caution est demandée.' : 'La publication indiquera qu’aucune caution n’est demandée.'}
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <ThemedText type="defaultSemiBold">Catégorie</ThemedText>
                <View style={styles.categoryWrap}>
                  {CATEGORIES.map((category) => {
                    const selected = selectedCategory === category;
                    return (
                      <Pressable
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        style={[
                          styles.categoryChip,
                          {
                            borderColor: selected ? tint : border,
                            backgroundColor: selected ? `${tint}22` : surface,
                          },
                        ]}>
                        <ThemedText type="defaultSemiBold" style={{ color: selected ? tint : text, fontSize: 13 }}>
                          {category}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Button
                label={
                  isEditing
                    ? 'Enregistrer les modifications'
                    : isLoanPublication
                      ? 'Publier le prêt'
                      : 'Publier la recherche'
                }
                disabled={!canSubmit}
                onPress={submitPost}
                accessibilityLabel={isLoanPublication ? 'Publier ce prêt' : 'Publier cette recherche'}
              />
              {!canSubmit ? (
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  Complète: {missingRequirements.join(', ')}.
                </ThemedText>
              ) : null}
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
    padding: 16,
    flexGrow: 1,
    paddingBottom: 34,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    gap: 14,
  },
  subtitle: {
    marginTop: 4,
  },
  formGroup: {
    gap: 6,
  },
  prefillBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefillBannerTextWrap: {
    flex: 1,
    gap: 1,
  },
  pastWrap: {
    gap: 8,
  },
  pastRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pastTextWrap: {
    flex: 1,
    gap: 2,
  },
  pastActionsWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  republishButton: {
    minHeight: 34,
    paddingHorizontal: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoPicker: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  photoSourceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoPreviewWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  locationRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  locationTextWrap: {
    flex: 1,
    gap: 2,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
