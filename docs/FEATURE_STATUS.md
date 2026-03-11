# Tooloop — Statut des fonctionnalités (MVP)

Dernière mise à jour : 2026-03-11

## Légende

- ✅ Fait (implémenté en front)
- 🟡 Partiel (présent en UI mais pas complet backend)
- ⛔ Non fait (prévu, pas encore implémenté)

## 1) Authentification

- ✅ Inscription email + mot de passe
- ⛔ Connexion Google
- 🟡 Profil utilisateur minimal (écran Profil présent, backend branché partiellement)

## 2) Gestion des objets

- ✅ Ajouter un objet (écran Post + formulaire)
- ⛔ Modifier un objet
- ⛔ Supprimer un objet
- 🟡 Marquer disponible / indisponible (visible sur profil, logique persistée partielle)
- ✅ Découvrir/rechercher des objets (écran Discover + filtres)
- 🟡 Estimation prix neuf / économie (algo local + affichage, sans source live externe)

## 3) Système de prêt

- ✅ Demande envoyée (flow UI depuis détail objet)
- 🟡 Propriétaire accepte / refuse (statuts visibles dans Inbox, logique persistée partielle)
- ⛔ Adresse exacte visible après acceptation
- 🟡 Prêt en cours / completed (statuts UI)
- ⛔ Photo avant
- ⛔ Photo après
- ✅ Preuve d’échange offline (pass local + check-in/check-out)

## 4) Système de notation / feedback

- 🟡 Feedback post-prêt (écran dédié, critères + commentaire, impact confiance simulé)
- ⛔ Note 1–5 persistée
- ⛔ Calcul automatique server-side (`averageRating`, `totalReviews`)

## 5) Système de badges

- 🟡 Badges visibles en UI (profil + cartes)
- ⛔ Attribution automatique des badges selon règles métier

## 6) Engagement & dynamique communautaire

- ⛔ “Je cherche cet objet” (wanted posts)
- ✅ Badge statut “Actif” en UI
- 🟡 “Objet partagé X fois” (données simulées, pas de compteur réel)
- 🟡 Compteur d’impact (pulse quartier en calcul local)

## 7) Sécurité & confiance

- 🟡 Confiance locale (écran dédié + score + preuves backend partiel)
- ⛔ Protection d’adresse (règles d’exposition non implémentées)
- ⛔ Signalement utilisateur
- ⛔ Blocage utilisateur
- ⛔ Rappels automatiques (notifications)
- ⛔ Anti-spam (limites et cooldown)

## 8) Messagerie / chat

- ⛔ Chat temps réel (pas encore implémenté)
- 🟡 Inbox actuelle = centre de demandes/statuts (pas une conversation live)
- ✅ Envoi message résilient: en cas d'échec réseau, le brouillon est restauré et une erreur utilisateur est affichée

## Correctifs parcours échange (2026-03-11)

- ✅ Finalisation retour atomique: l'état local de validation retour n'est appliqué qu'après succès serveur de clôture
- ✅ Action principale Inbox alignée: les états `pending` et `refused` n'ouvrent plus à tort le flux preuve
- ✅ Libellés Inbox clarifiés: `En attente de réponse` et `Demande refusée` sur états non actionnables
- ✅ Robustesse chat: rollback du brouillon + notification d'erreur en cas d'échec d'envoi
- ✅ Couverture tests ajoutée sur les chemins d'erreur retour/chat

## 9) Admin / pilotage

- ⛔ Dashboard admin minimal (users, objects, loans, reviews, reports)
- ⛔ KPI automatiques (actifs, taux d’échange, moyenne notes, etc.)

## 10) Légal, store et qualité

- ✅ Documents légaux MVP (`PRIVACY_POLICY`, `TERMS_AND_CONDITIONS`)
- ✅ Métadonnées store + checklist release
- ✅ Base front soignée (design system, navigation 5 tabs, flows clés)
- ✅ Contrôles qualité locaux (lint + TypeScript)

## Résumé rapide

Le projet est avancé côté front produit (navigation, discover, prêt, confiance, preuve offline, feedback).  
Le backend métier (auth, persistance, règles de sécurité, chat temps réel, admin, automatisations) reste majoritairement à implémenter.
