import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { t } from '@/lib/i18n/i18n';
import { Button } from '@/components/ui/button';

interface PhotoUploadControlProps {
  photoUri: string | null;
  onPickPhoto: () => void;
  onTakePhoto: () => void;
  onRemovePhoto: () => void;
  error?: string | null;
  colors: {
    tint: string;
    border: string;
    surface: string;
    softBorder: string;
    softSurface: string;
    danger: string;
    mutedText: string;
  };
}

export function PhotoUploadControl({ photoUri, onPickPhoto, onTakePhoto, onRemovePhoto, error, colors }: PhotoUploadControlProps) {
  const { tint, border, surface, softBorder, softSurface, danger, mutedText } = colors;

  return (
    <View style={styles.formGroup}>
      <ThemedText type="defaultSemiBold">{t("photo.label")}</ThemedText>
      {photoUri ? (
        <View style={[styles.photoPreviewWrap, { borderColor: border, backgroundColor: surface }]}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
        </View>
      ) : (
        <View style={styles.photoSourceRow}>
          <Pressable
            onPress={onPickPhoto}
            accessibilityRole="button"
            accessibilityLabel={t("photo.galleryAccessibility")}
            style={[styles.photoPicker, { borderColor: softBorder, backgroundColor: softSurface }]}>
            <MaterialIcons name="photo-library" size={18} color={tint} />
            <ThemedText type="defaultSemiBold" style={{ color: tint }}>{t("photo.gallery")}</ThemedText>
          </Pressable>
          <Pressable
            onPress={onTakePhoto}
            accessibilityRole="button"
            accessibilityLabel={t("photo.cameraAccessibility")}
            style={[styles.photoPicker, { borderColor: softBorder, backgroundColor: softSurface }]}>
            <MaterialIcons name="photo-camera" size={18} color={tint} />
            <ThemedText type="defaultSemiBold" style={{ color: tint }}>{t("photo.camera")}</ThemedText>
          </Pressable>
        </View>
      )}

      {photoUri ? (
        <View style={styles.photoActions}>
          <Button label={t("photo.replaceGallery")} variant="ghost" onPress={onPickPhoto} />
          <Button label={t("photo.replaceCamera")} variant="ghost" onPress={onTakePhoto} />
          <Button label={t("photo.delete")} variant="ghost" onPress={onRemovePhoto} />
        </View>
      ) : (
        <ThemedText style={{ color: mutedText, fontSize: 12 }}>
          {t('photo.required')}
        </ThemedText>
      )}
      {error ? (
        <ThemedText style={{ color: danger, fontSize: 12 }}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    gap: 6,
  },
  photoSourceRow: {
    flexDirection: 'row',
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
});
