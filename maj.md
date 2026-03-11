1. Architecture
Structure des dossiers :
La structure est globalement claire (app, components, hooks, lib, services, stores, types, etc.), mais certains dossiers (ex: app/object/story/) semblent peu explicites ou trop imbriqués.
Séparation UI / logique / data :
Les composants UI sont dans components/ui, la logique dans hooks, services, stores, mais il manque une vraie couche “domain” (business logic centralisée).
Domain logic :
Peu de séparation claire entre logique métier et logique de présentation. La logique métier semble dispersée dans les hooks et services.
Anti-patterns React :
Risque de “prop drilling”, hooks personnalisés non factorisés, absence de context pour certains états globaux.
Gestion des hooks :
Hooks présents, mais à auditer pour éviter duplication, effets secondaires non maîtrisés, et manque de tests.
2. Typage
Cohérence des interfaces :
Présence de fichiers types/, mais à vérifier la cohérence et l’utilisation systématique.
Any implicites :
Risque d’“any” implicite dans les hooks, services, et composants, surtout pour les données Supabase.
Duplication de types :
Possibles duplications entre types front et types Supabase, à rationaliser.
Types liés à Supabase vs front :
À clarifier : générer les types Supabase automatiquement et les séparer des types front.
3. Gestion des données
Centralisation des appels API :
Les services semblent gérer Supabase, mais à vérifier la centralisation et la réutilisabilité.
Gestion des erreurs :
À auditer : gestion des erreurs dispersée, peu de feedback utilisateur standardisé.
Loading states :
Loading spinner présent, mais à uniformiser la gestion des états de chargement.
Gestion des permissions :
Permissions probablement gérées côté Supabase, mais à auditer côté front pour éviter les failles.
4. UX / Produit
Clarté des flows :
Flows à cartographier, risque de complexité ou d’incohérence (ex: onboarding, navigation).
Onboarding :
Présence d’un onboarding carousel, à vérifier l’efficacité et la clarté.
Feedback utilisateur :
Snackbar et app-notice présents, mais à uniformiser et enrichir.
Points de friction :
À identifier via audit UX : navigation, erreurs non gérées, flows non linéaires.

Cartographie UX critique — Flow Demande de prêt (MVP actuel)
Objectif business : augmenter le taux de conversion Découvrir -> demande envoyée -> échange finalisé, tout en réduisant les abandons dus à l’incertitude post-demande.

Entrée du flow
- Écran objet : app/object/[id].tsx
- Intention user : demander un prêt sur une annonce (choix durée + envoi)

Étapes observées
1) Consultation objet
	- L’utilisateur voit détails (titre, description, badges, propriétaire, distance, mini-story).
2) Configuration de la demande
	- L’utilisateur choisit une durée prédéfinie ou « autre ».
3) Envoi de demande
	- CTA « Envoyer la demande » active un état local simulé puis affiche « Demande envoyée ».
4) Redirection vers suivi
	- CTA « Voir mes échanges » mène vers app/(tabs)/inbox.tsx.
5) Suivi dans inbox
	- L’utilisateur filtre (Empruntés / Prêtés / Terminés), visualise statut et prochaine étape.
6) Passage au chat
	- Le chat (app/chat/[loanId].tsx) n’est accessible qu’après acceptation.
7) Passage au pass d’échange
	- Le pass (app/proof/[loanId].tsx) organise remise/retour + contribution mini-story.

Points de friction majeurs
- Friction A — Confirmation ambiguë post-demande
  - La confirmation est locale à l’écran objet ; la transition vers inbox n’explicite pas toujours l’étape suivante attendue côté prêteur.
- Friction B — Gating chat tardif perçu comme blocant
  - L’accès chat refusé avant acceptation peut être compris comme bug plutôt que règle métier.
- Friction C — Continuité de statut hétérogène
  - Les libellés d’état entre objet, inbox, chat et pass ne racontent pas toujours une progression unique.
- Friction D — Temps de réponse perçu
  - Le flow ne donne pas de SLA explicite après envoi (anxiété, abandon).

Corrections UX prioritaires (sans refactor global)
P0
- Standardiser la timeline de statut sur 4 états uniques visibles partout : Demande envoyée -> Acceptée -> En cours -> Terminée.
- Ajouter un message d’attente explicite en inbox après envoi : « En attente de validation du prêteur » + prochaine action attendue.

P1
- Sur chat indisponible, remplacer le message générique par une explication orientée action : « Chat activé dès acceptation de la demande ».
- Harmoniser les libellés CTA entre objet/inbox/pass pour réduire la charge cognitive.

KPI à suivre sur ce flow
- Taux objet -> demande envoyée
- Taux demande envoyée -> demande acceptée
- Délai médian demande -> acceptation
- Taux acceptée -> échange terminé
5. Scalabilité
Risques à 1k/10k utilisateurs :
Risque de surcharge sur endpoints critiques, absence de cache côté front, gestion naïve des listes.
Endpoints critiques :
À identifier et monitorer (ex: listing, chat, proof).
Requêtes SQL non optimisées :
Scripts et migrations présents, mais à auditer les requêtes pour éviter les full scans, N+1, etc.
6. Dette technique
Liste priorisée :
Typage incomplet/“any”
Logique métier dispersée
Gestion des erreurs/permissions
Flows UX non cartographiés
Optimisation des requêtes Supabase
Tests unitaires et d’intégration manquants
Impact business :
Risque de bugs, mauvaise expérience utilisateur, difficulté de maintenance, frein à la revente.
Risque pour revente :
Code peu maintenable, absence de documentation, scalabilité limitée, sécurité à renforcer.
Plan de mise à niveau
Phase 1 – Stabilisation
Audit complet du typage (remplacer tous les “any”, générer types Supabase)
Centraliser la gestion des erreurs et loading states
Cartographier les flows UX et corriger les points de friction majeurs
Mettre en place des tests unitaires sur les hooks/services critiques
Documenter l’architecture et les conventions
Phase 2 – Professionnalisation
Refactoriser la logique métier dans une couche “domain” dédiée
Séparer strictement UI, logique métier, et accès data
Uniformiser la gestion des permissions côté front et back
Mettre en place un système de feedback utilisateur cohérent (snackbar, app-notice, etc.)
Rationaliser les types (front vs Supabase) et automatiser leur génération
Ajouter des tests d’intégration et end-to-end
Phase 3 – Scalabilité
Optimiser les endpoints et requêtes SQL (index, pagination, cache)
Mettre en place du monitoring (logs, analytics, alertes)
Préparer l’infrastructure pour le scale (CDN, edge functions, etc.)
Auditer la sécurité (permissions, stockage, RGPD)
Documenter le produit pour la revente (README, guides, API docs)
Automatiser le déploiement et la CI/CD