import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CATEGORIES } from '@/data/mock';
import { useThemeColor } from '@/hooks/use-theme-color';

type PublicationMode = 'loan' | 'request';

export default function PostScreen() {
  const router = useRouter();
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

  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');
  const danger = useThemeColor({}, 'danger');

  const isLoanPublication = publicationMode === 'loan';

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
    return missing;
  }, [description, isLoanPublication, photoUri, targetPeriod, title]);

  const titleError = title.trim().length === 0 ? (isLoanPublication ? 'Le nom de l’objet est requis.' : 'L’objet recherché est requis.') : null;
  const descriptionError = description.trim().length === 0 ? 'La description est requise.' : null;
  const photoError = isLoanPublication && !photoUri ? 'La photo est obligatoire pour un prêt.' : null;
  const targetPeriodError = !isLoanPublication && targetPeriod.trim().length === 0 ? 'La période souhaitée est requise.' : null;

  const submitSuccessTitle = isLoanPublication ? 'Prêt publié' : 'Recherche publiée';
  const submitSuccessMessage = isLoanPublication
    ? 'Ton objet est prêt à être découvert par les voisins.'
    : 'Ta recherche est visible pour les voisins qui peuvent prêter cet objet.';

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
      Alert.alert('Autorisation requise', 'Autorise l’accès à la galerie pour ajouter une photo.');
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
      Alert.alert('Autorisation requise', 'Autorise l’accès à la caméra pour prendre une photo.');
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

  const submitPost = () => {
    setSubmitAttempted(true);
    if (!canSubmit) {
      return;
    }

    Alert.alert(submitSuccessTitle, submitSuccessMessage, [
      {
        text: isLoanPublication ? 'Voir Découvrir' : 'Voir Échanges',
        onPress: () => {
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
          router.push(isLoanPublication ? '/(tabs)/explore' : '/(tabs)/inbox');
        },
      },
    ]);
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
              <ThemedText type="title">Nouvelle publication</ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedText }]}>Choisis le type puis complète le formulaire.</ThemedText>

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
                  style={[styles.input, { color: text, borderColor: border, backgroundColor: surface }]}
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
                  style={[styles.textarea, { color: text, borderColor: border, backgroundColor: surface }]}
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
                    style={[styles.input, { color: text, borderColor: border, backgroundColor: surface }]}
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
                label={isLoanPublication ? 'Publier le prêt' : 'Publier la recherche'}
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
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
