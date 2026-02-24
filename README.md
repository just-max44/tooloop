# Tooloop

Application mobile cross-platform (Expo + React Native) destinée à la mise en relation locale pour le prêt d'objets entre voisins.

## Objectif

- UX simple, rassurante et rapide
- Déploiement cible: Android (Play Store) et iOS (App Store)
- Base technique propre, testable et revendable
- Zéro dépendance à une API payante pour le MVP front

## Différenciation produit (front)

- Pulse quartier (activité locale + dynamique d’entraide)
- Parcours Confiance locale (score, preuves, signaux communautaires)
- Pass d’échange offline (QR/code local, validation remise/retour en 2 étapes)
- Feedback post-prêt avec projection d’impact confiance
- Formulaire de publication adaptatif (`Prêt` / `Recherche`)

## Stack

- Expo Router
- React Native + TypeScript strict
- ESLint (config Expo)
- Design system interne (tokens + composants UI)

## Démarrage local

1. Installer les dépendances

```bash
npm install
```

2. Lancer le projet

```bash
npm run start
```

3. Vérifier la qualité

```bash
npm run lint
npx tsc --noEmit
```

## Structure utile

- `app/` : routes et écrans Expo Router
- `components/ui/` : composants réutilisables (Button, Card, Badge, etc.)
- `constants/theme.ts` : tokens design (couleurs, radius, spacing)
- `app/proof/` : logique pass d’échange (remise, retour, récapitulatifs)
- `app/feedback/` : évaluation post-échange
- `architecture.md` : cadrage fonctionnel MVP
- `styles.md` : direction artistique
- `TODO.md` : suivi d'implémentation

## Fonctionnalités MVP actuellement implémentées

- Onglets `Empruntés`, `Prêtés`, `Terminés` avec états locaux (`pending`, `accepted`, `completed`, `refused`)
- Acceptation / refus côté prêteur
- Chat autorisé uniquement après acceptation
- Pass d’échange en deux phases :
	- `Remise` : date de retour définie par le prêteur, validation emprunteur via QR/code + récapitulatif
	- `Retour` : état de l’objet défini par le prêteur (`Conforme`, `Partiel`, `Abîmé`), validation emprunteur via QR/code + récapitulatif
- Verrouillage des étapes déjà validées + redirection vers évaluation en fin de retour
- Recherche fonctionnelle dans `Découvrir` (titre, description, propriétaire)

## Notes techniques MVP

- La logique d’état est locale (stores en mémoire) pour le front MVP.
- Les données proviennent de `data/mock.ts`.
- Aucun backend persistant n’est branché à ce stade.

## Publication stores

Le guide de pré-publication est disponible dans `docs/RELEASE_CHECKLIST.md`.

Documents légaux MVP disponibles :

- `docs/PRIVACY_POLICY.md`
- `docs/TERMS_AND_CONDITIONS.md`
- `docs/STORE_METADATA.md`

Avant soumission, vérifier au minimum:

- identifiants bundle/package définitifs
- versioning iOS/Android
- assets stores (icône, screenshots, privacy policy)
- conformité légale (CGU / politique de confidentialité)
