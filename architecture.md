# Architecture Fonctionnelle (MVP Front actuel)

## 1) Portée actuelle

Le projet implémente un MVP front Expo Router orienté parcours d’échange local.
La logique métier est locale (stores en mémoire), sans persistance serveur à ce stade.

## 2) Domaines fonctionnels livrés

### Découvrir
- Listing d’objets mockés
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
- Données mock: `data/mock.ts`
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
