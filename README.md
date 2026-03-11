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

- Onglets `Empruntés`, `Prêtés`, `Terminés` avec états persistés (`pending`, `accepted`, `completed`, `refused`)
- Acceptation / refus côté prêteur
- Chat autorisé uniquement après acceptation
- Pass d’échange en deux phases :
	- `Remise` : date de retour définie par le prêteur, validation emprunteur via QR/code + récapitulatif
	- `Retour` : état de l’objet défini par le prêteur (`Conforme`, `Partiel`, `Abîmé`), validation emprunteur via QR/code + récapitulatif
- Verrouillage des étapes déjà validées + redirection vers évaluation en fin de retour
- Recherche fonctionnelle dans `Découvrir` (titre, description, propriétaire)

## Notes techniques MVP

- Les données applicatives transitent via `lib/backend/data.ts`.
- Le mode backend est piloté par `EXPO_PUBLIC_BACKEND_PROVIDER` (`supabase` ou `custom`).
- Le backend `custom` (Express + Neon + JWT + R2) est disponible dans `backend/`.

## Statut migration backend

- Migré: Auth JWT, snapshot data, CRUD listings, états de prêts, messages chat, proof state (pickup/return).
- Persisté côté serveur: validation pickup/return + métadonnées de retour via `loan_proof_state`.
- Runbook opérationnel: `docs/MIGRATION_SUPABASE_TO_NEON.md`.

## Vérification obsolescence

- Supprimés (non référencés): `stores/proof/closure-store.ts`, `services/supabaseClient.ts`, `services/supabaseAuthLifecycle.ts`, `services/supabaseConfig.ts`.
- Conservé volontairement: `docs/BACKEND_SETUP.md` comme référence legacy/rollback Supabase.

## Publication stores

Le guide de pré-publication est disponible dans `docs/RELEASE_CHECKLIST.md`.

## CI/CD

- CI automatique sur `push` / `pull_request` vers `master` via `.github/workflows/ci.yml`:
	- `npm run lint`
	- `npm run typecheck`
	- `npm run test:ci`
	- `npm run build:web`
- Build mobile manuel via `.github/workflows/eas-build.yml` (GitHub Actions → `Run workflow`).
- Secret requis pour EAS: `EXPO_TOKEN`.

Documents légaux MVP disponibles :

- `docs/PRIVACY_POLICY.md`
- `docs/TERMS_AND_CONDITIONS.md`
- `docs/STORE_METADATA.md`

Configuration backend MVP (Supabase) :

- `docs/BACKEND_SETUP.md`

Migration vers Neon + backend Express + JWT + R2 :

- `docs/MIGRATION_SUPABASE_TO_NEON.md`

Avant soumission, vérifier au minimum:

- identifiants bundle/package définitifs
- versioning iOS/Android
- assets stores (icône, screenshots, privacy policy)
- conformité légale (CGU / politique de confidentialité)
