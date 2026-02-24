# TODO Tooloop — UI & Style MVP

## Phase 1 — Fondation design
- [x] Définir les design tokens Tooloop (couleurs, rayons, espacements, typo)
- [x] Mettre à jour le thème global dans `constants/theme.ts` (light/dark)
- [x] Aligner la palette sur le style cible (vert doux, beige clair, gris cartes, rouge alertes)

## Phase 2 — Composants réutilisables
- [x] Créer les composants UI de base (`Button`, `Card`, `Badge`, `Avatar`, `SearchBar`)
- [x] Créer une carte objet standardisée (image, distance, owner, CTA "Emprunter")
- [x] Ajouter les variantes d’état (actif, disabled, loading)

## Phase 3 — Navigation & écrans
- [x] Étendre la navigation à 5 onglets (Home, Discover, Post, Inbox, Profile)
- [x] Refaire l’écran Home avec hero + proposition de valeur
- [x] Construire l’écran Discover avec recherche + catégories + liste d’objets

## Phase 4 — Détails UX confiance
- [x] Ajouter les badges visuels (vérifié, populaire, nouveau voisin)
- [x] Ajouter les indicateurs utiles (distance, temps de réponse, disponibilité)
- [x] Uniformiser les interactions (zones tactiles, feedback, cohérence des boutons)

## Phase 5 — Qualité & finalisation
- [x] Vérifier accessibilité (contrastes, tailles de texte, navigation)
- [x] Vérifier rendu mobile + web (responsive, safe areas, scroll)
- [x] Remplacer les contenus template Expo restants
- [x] Lancer `npm run lint` et corriger les régressions liées au redesign

## Priorité immédiate (ordre conseillé)
1. Définir tokens + thème
2. Créer `Card` + `Button` + `SearchBar`
3. Refaire `app/(tabs)/index.tsx` (Home)
4. Refaire `app/(tabs)/explore.tsx` en `Discover`
5. Mettre à jour la tab bar
