import { FadeInView, SlideInView } from '@/components/ui/animated-views';
import { Button } from '@/components/ui/button';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const steps = [
  {
    title: 'Bienvenue sur Tooloop',
    description: 'Louez, empruntez et partagez en toute confiance dans votre quartier.',
    image: require('../assets/images/optimized/onboarding1.png'),
  },
  {
    title: 'Pulse quartier',
    description: 'Découvrez l’activité locale et les objets disponibles près de chez vous.',
    image: require('../assets/images/optimized/onboarding2.png'),
  },
  {
    title: 'Confiance & sécurité',
    description: 'Profitez d’un parcours sécurisé, badges vérifiés et feedbacks communautaires.',
    image: require('../assets/images/optimized/onboarding3.png'),
  },
  {
    title: 'Prêt ? Commencez !',
    description: 'Publiez ou recherchez un objet en quelques secondes.',
    image: require('../assets/images/optimized/onboarding4.png'),
  },
];

export const OnboardingCarousel = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(0);
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  return (
    <FadeInView style={[styles.container, { backgroundColor: background }]}> 
      <SlideInView>
        <Image source={steps[step].image} style={styles.image} resizeMode="contain" />
        <Text style={[styles.title, { color: text }]}>{steps[step].title}</Text>
        <Text style={[styles.desc, { color: text }]}>{steps[step].description}</Text>
        <View style={styles.buttons}>
          {step < steps.length - 1 ? (
            <Button label="Suivant" onPress={() => setStep(step + 1)} />
          ) : (
            <Button label="Commencer" onPress={onFinish} />
          )}
          {step > 0 && (
            <Button label="Retour" variant="ghost" onPress={() => setStep(step - 1)} />
          )}
          <Button label="Passer" variant="ghost" onPress={onFinish} />
        </View>
      </SlideInView>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
});
