import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TermsScreen() {
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const mutedText = useThemeColor({}, 'mutedText');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <ThemedText type="title">Conditions générales d’utilisation</ThemedText>
            <ThemedText style={{ color: mutedText, fontSize: 12 }}>Date d’entrée en vigueur : 23 février 2026</ThemedText>
          </Card>

          <Card style={styles.card}>
            <Section title="1. Objet">
              Tooloop est une plateforme de mise en relation entre utilisateurs pour le prêt d’objets. Tooloop n’est pas partie au contrat de prêt.
            </Section>
            <Section title="2. Acceptation">
              L’utilisation de Tooloop implique l’acceptation pleine et entière des présentes CGU.
            </Section>
            <Section title="3. Compte utilisateur">
              L’utilisateur doit fournir des informations exactes, protéger ses accès et reste responsable des actions réalisées via son compte.
            </Section>
            <Section title="4. Règles d’usage">
              Publication de bonne foi, respect des utilisateurs, interdiction des contenus illégaux/frauduleux/offensants et des objets dangereux.
            </Section>
            <Section title="5. Prêts entre utilisateurs">
              Le prêt est conclu directement entre prêteur et emprunteur. Chaque partie est responsable des conditions convenues et de l’état de l’objet.
            </Section>
            <Section title="6. Système de confiance">
              Notes, avis, badges, signalements et blocage peuvent être utilisés. En cas d’abus, Tooloop peut suspendre ou supprimer un compte.
            </Section>
            <Section title="7. Responsabilité">
              Tooloop agit comme intermédiaire technique. Dans les limites légales, Tooloop n’est pas responsable des dommages liés aux échanges.
            </Section>
            <Section title="8. Propriété intellectuelle">
              Les éléments de l’application (marque, interface, textes, design, code) sont protégés. Toute reproduction non autorisée est interdite.
            </Section>
            <Section title="9. Données personnelles">
              Le traitement des données est décrit dans la politique de confidentialité de Tooloop.
            </Section>
            <Section title="10. Résiliation">
              L’utilisateur peut cesser le service à tout moment. Tooloop peut suspendre ou clôturer un compte en cas de violation des CGU.
            </Section>
            <Section title="11. Modification des CGU">
              Tooloop peut modifier les CGU à tout moment. La version en vigueur est publiée avec sa date d’entrée en vigueur.
            </Section>
            <Section title="12. Droit applicable">
              Les CGU sont soumises au droit applicable au siège de l’éditeur, sous réserve des dispositions impératives protégeant les consommateurs.
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
