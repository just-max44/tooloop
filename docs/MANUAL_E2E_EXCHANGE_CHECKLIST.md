# Validation manuelle E2E — Parcours échange

Date: 2026-03-11
Branche: master
Objectif: valider le flux complet demande -> acceptation -> chat -> preuve -> retour -> feedback

## Pré-requis

- Deux comptes: Compte A (prêteur), Compte B (emprunteur)
- Backend démarré et accessible
- Données minimales: au moins un objet publiable depuis A
- App installée sur device ou émulateur

## Résultat global

- [ ] PASS global
- [ ] FAIL global

## Script détaillé

### 1) Création demande

- [ ] B ouvre la fiche objet et envoie une demande
- Résultat attendu:
  - La demande apparaît dans l'Inbox de A et B
  - État initial: pending

### 2) Inbox pending cohérente

- [ ] Vérifier la carte pending dans l'Inbox
- Résultat attendu:
  - Action principale non actionnable
  - Libellé: En attente de réponse

### 3) Acceptation prêteur

- [ ] A accepte la demande
- Résultat attendu:
  - État passe à accepted côté A et B
  - Accès chat autorisé
  - Accès pass d'échange autorisé

### 4) Chat fonctionnel

- [ ] A envoie un message à B
- [ ] B répond
- Résultat attendu:
  - Messages visibles des deux côtés

### 5) Résilience envoi chat (échec réseau)

- [ ] Couper le réseau côté expéditeur
- [ ] Tenter un envoi
- Résultat attendu:
  - Brouillon restauré
  - Notice d'erreur affichée
  - Aucun message fantôme côté destinataire

### 6) Pickup

- [ ] Valider la remise (pickup) selon le flow prévu
- Résultat attendu:
  - Pickup validé côté prêt

### 7) Return review succès

- [ ] Revenir sur réseau normal
- [ ] Valider le retour complet
- Résultat attendu:
  - Clôture réussie
  - Redirection vers feedback
  - État loan: completed

### 8) Clôture atomique (échec réseau)

- [ ] Rejouer un échange test
- [ ] Couper réseau au moment de Valider le retour
- Résultat attendu:
  - La clôture distante échoue
  - Les flags locaux d'acceptation retour ne basculent pas à tort
  - Message d'erreur utilisateur visible

### 9) Inbox refused cohérente

- [ ] Rejouer un échange test puis refus côté prêteur
- Résultat attendu:
  - État refused
  - Action principale non actionnable
  - Libellé: Demande refusée

### 10) Feedback

- [ ] Soumettre un feedback après completed
- Résultat attendu:
  - Feedback accepté
  - Pas d'accès feedback si non completed

## Journal d'exécution

- Environnement testé:
- Appareil/OS:
- Heure début:
- Heure fin:
- Anomalies:
  - [ ] Aucune
  - [ ] Oui (détailler ci-dessous)

### Détails anomalies

1) 
2) 
3) 

## Verdict

- [ ] Release OK côté parcours échange
- [ ] Correctifs supplémentaires requis
