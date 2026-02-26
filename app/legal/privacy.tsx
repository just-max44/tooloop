import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PrivacyPolicyScreen() {
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const mutedText = useThemeColor({}, 'mutedText');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <ThemedText type="title">Politique de confidentialité</ThemedText>
            <ThemedText style={{ color: mutedText, fontSize: 12 }}>Date d’entrée en vigueur : 23 février 2026</ThemedText>
          </Card>

          <Card style={styles.card}>
            <Section title="1. Responsable de traitement">
              Tooloop est une plateforme de mise en relation locale pour le prêt d’objets entre utilisateurs.
            </Section>
            <Section title="2. Données collectées">
              Identité de compte (nom, email), données de profil (photo, localisation approximative), données d’usage (objets, demandes,
              historique), données de confiance (notes, avis, badges), et données techniques minimales nécessaires au service.
            </Section>
            <Section title="3. Finalités du traitement">
              Créer et gérer les comptes, afficher des objets proches, gérer le cycle de prêt, renforcer la sécurité et améliorer le produit.
            </Section>
            <Section title="4. Base légale">
              Exécution du service demandé, intérêt légitime de sécurité/amélioration, et obligations légales applicables.
            </Section>
            <Section title="5. Partage des données">
              Aucune vente de données personnelles. Partage limité aux prestataires techniques nécessaires et obligations légales.
            </Section>
            <Section title="6. Localisation et adresse">
              La localisation visible est approximative. L’adresse exacte n’est partagée qu’après acceptation d’un prêt selon les règles du service.
            </Section>
            <Section title="7. Durée de conservation">
              Les données sont conservées le temps nécessaire au service puis supprimées ou anonymisées selon les obligations légales.
            </Section>
            <Section title="8. Sécurité">
              Tooloop applique des mesures techniques et organisationnelles raisonnables contre l’accès non autorisé, la perte et l’altération.
            </Section>
            <Section title="9. Vos droits">
              Accès, rectification, suppression, limitation/opposition et portabilité lorsque applicable.
            </Section>
            <Section title="10. Mineurs">
              Tooloop n’est pas destiné aux mineurs sans autorisation parentale, conformément aux lois locales.
            </Section>
            <Section title="11. Modifications">
              Cette politique peut évoluer. En cas de changement substantiel, les utilisateurs sont informés via les canaux appropriés.
            </Section>
            <View style={[styles.contactBox, { borderColor: border, backgroundColor: surface }]}>
              <ThemedText type="defaultSemiBold">Contact</ThemedText>
              <ThemedText style={{ color: mutedText }}>tooloop-app@proton.me</ThemedText>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

type SectionProps = {
  title: string;
  children: string;
};

function Section({ title, children }: SectionProps) {
  const mutedText = useThemeColor({}, 'mutedText');

  return (
    <View style={styles.section}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      <ThemedText style={{ color: mutedText }}>{children}</ThemedText>
    </View>
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
    gap: 12,
  },
  card: {
    gap: 10,
  },
  section: {
    gap: 4,
  },
  contactBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    gap: 2,
  },
});
