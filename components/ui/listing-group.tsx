import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import type { MyListing } from '@/lib/backend/data';

type ListingGroupProps = {
  items: MyListing[];
  badgeLabel: string;
  badgeVariant: 'primary' | 'neutral';
  groupLabel: string;
  tint: string;
  danger: string;
  softBorder: string;
  softSurface: string;
  mutedText: string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
};

export function ListingGroup({
  items,
  badgeLabel,
  badgeVariant,
  groupLabel,
  tint,
  danger,
  softBorder,
  softSurface,
  mutedText,
  onView,
  onEdit,
  onDelete,
}: ListingGroupProps) {
  return (
    <View style={[styles.listingGroupWrap, { borderColor: softBorder, backgroundColor: softSurface }]}>
      <View style={styles.groupHeaderRow}>
        <ThemedText type="defaultSemiBold">{groupLabel}</ThemedText>
        <Badge label={`${items.length}`} variant={badgeVariant} />
      </View>
      {items.map((item) => (
        <View key={item.id} style={[styles.listingRow, { borderColor: softBorder, backgroundColor: softSurface }]}>
          <View style={styles.itemTextWrap}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.title}</ThemedText>
            <ThemedText style={{ color: mutedText, fontSize: 12 }} numberOfLines={2}>
              {item.description}
            </ThemedText>
          </View>
          <View style={styles.listingActionsWrap}>
            <Badge label={badgeLabel} variant={badgeVariant} />
            <View style={styles.iconActionsRow}>
              <Pressable
                onPress={() => onView(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Voir la fiche de l'annonce ${item.title}`}
                style={[styles.iconActionButton, { borderColor: softBorder, backgroundColor: softSurface }]}>
                <MaterialIcons name="visibility" size={16} color={tint} />
              </Pressable>
              <Pressable
                onPress={() => onEdit(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Modifier la fiche de l'annonce ${item.title}`}
                style={[styles.iconActionButton, { borderColor: softBorder, backgroundColor: softSurface }]}>
                <MaterialIcons name="edit" size={16} color={tint} />
              </Pressable>
              <Pressable
                onPress={() => onDelete(item.id, item.title)}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer la fiche de l'annonce ${item.title}`}
                style={[styles.iconActionButton, { borderColor: `${danger}55`, backgroundColor: softSurface }]}>
                <MaterialIcons name="delete-outline" size={16} color={danger} />
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listingGroupWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listingRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  itemTextWrap: {
    gap: 2,
  },
  listingActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconActionButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
