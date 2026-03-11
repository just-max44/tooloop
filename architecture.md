# Architecture Fonctionnelle (MVP Front actuel)

## 1) Portée actuelle

Le projet implémente un MVP front Expo Router orienté parcours d’échange local.
La logique métier est locale (stores en mémoire), sans persistance serveur à ce stade.

## 2) Domaines fonctionnels livrés

### Découvrir
- Listing d’objets (backend Supabase)
- Filtres catégories
- Recherche fonctionnelle (titre, description, propriétaire)
- Bloc “Pulse quartier” (activité locale + impact)

### Détail objet
- Détail + durée souhaitée
- Envoi d’une demande avec confirmation UX (état en attente)

### Échanges
- Segments: `Empruntés`, `Prêtés`, `Terminés`
- États effectifs: `pending`, `accepted`, `completed`, `refused`
- Actions prêteur: accepter/refuser
- Chat autorisé uniquement après acceptation

### Pass d’échange
- Étape `Remise`:
  - Date de retour définie par le prêteur
  - Emprunteur: scan QR ou saisie code (sans visibilité du QR/code prêteur)
  - Récapitulatif de validation
- Étape `Retour`:
  - État de l’objet défini par le prêteur (`Conforme`, `Partiel`, `Abîmé`)
  - Emprunteur: scan QR ou saisie code (sans visibilité du QR/code prêteur)
  - Récapitulatif de validation + clôture
- Verrouillage des étapes validées

### Feedback
- Évaluation post-échange
- Rappel dans `Terminés`
- Soumission unique par échange

### Publication
- Mode `Prêt` / `Recherche`
- Formulaire adaptatif
- Option caution côté prêteur (oui/non)

## 3) Architecture technique

- Routage: Expo Router (`app/`)
- UI: composants `components/ui/`
- Design tokens: `constants/theme.ts`
- Données backend: `lib/backend/data.ts` (Supabase)
- Stores locaux (front-only):
  - `app/proof/closure-store.ts`
  - `app/proof/progress-store.ts`
  - `app/proof/return-timing-store.ts`
  - `app/feedback/feedback-store.ts`

## 4) Limites connues (normal MVP front)

- Pas d’auth réelle
- Pas de base distante
- Pas de persistance après redémarrage
- Pas de synchronisation multi-device

## 5) Cible backend (prochaine étape)

- Remplacer les stores mémoire par un backend persistant
- Brancher auth + rôles utilisateur réels
- Stocker objets, demandes, pass, validations, feedback
- Ajouter traçabilité temporelle serveur et notifications

## 6) Conventions d’architecture (à respecter)

### Séparation des couches
- `app/` : écrans et composition UX uniquement.
- `components/` : UI réutilisable, pas de logique métier.
- `stores/` : orchestration front et état local orienté feature.
- `lib/backend/` et `services/` : accès données / intégrations externes.
- `types/` : contrats partagés (dont types Supabase séparés du front).

### Règles de dépendances
- Un écran peut consommer `stores` + `components`, mais pas accéder directement à des détails d’implémentation backend non exposés.
- Un `store` peut consommer `lib/backend` et `services`, mais ne doit pas contenir de JSX.
- Les composants UI ne doivent pas importer `lib/backend`.

### Gestion d’erreurs et loading
- Toute mutation asynchrone passe par un point de capture `try/catch` unique au niveau store/context.
- Les erreurs utilisateur passent par `app-notice-store` (message cohérent, ton `error`).
- Les états de chargement partagés passent par contexte/store dédié, pas via duplication d’états locaux non nécessaires.

## 7) Conventions de code

### Typage
- `strict` TypeScript obligatoire, pas de `any`.
- Préférer `unknown` + normalisation explicite des erreurs.
- Les types DB proviennent de `types/supabase.ts`.

### Nommage
- Fonctions async : verbes explicites (`refreshBackendData`, `addListing`, `approveStoryContribution`).
- Stores : noms orientés domaine (`listings-store`, `object-story-store`, `app-notice-store`).
- Types : suffixes explicites (`Row`, `Insert`, `Update`, `State`, `Props`).

### Tests
- Priorité aux tests unitaires des stores/contexts critiques.
- Couvrir minimum : chemin succès, erreur normalisée, et effet de bord principal.

## 8) Checklist PR (maintenabilité revente)

- Un seul objectif fonctionnel par session.
- Un seul module impacté quand possible.
- `npx tsc --noEmit` sans erreur.
- `npm run lint` sans erreur.
- Tests ciblés ajoutés/mis à jour si logique métier modifiée.
- Aucun ajout de dépendance sans justification produit/technique.
