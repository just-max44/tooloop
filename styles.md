# Guide de style (MVP)

## Direction

Style sobre, lisible et rassurant:
- Interfaces en cartes
- Hiérarchie simple
- États explicites
- Faible charge visuelle

## Principes UX appliqués

- Priorité aux actions utiles par état
- Blocage explicite quand une étape préalable manque
- Messages courts orientés action
- Cohérence de wording sur les statuts (`En attente`, `Accepté`, `Terminé`, `Refusé`)

## Design system

- Tokens centralisés dans `constants/theme.ts`
- Composants de base: `Button`, `Card`, `Badge`, `SearchBar`
- Radius/spacing cohérents (arrondis doux, espaces réguliers)

## Conventions d’interface

### Cartes
- Une carte = un bloc d’information/action
- Éviter les surcharges (texte + actions minimales)

### Boutons
- `primary`: action principale de l’étape
- `secondary`: action alternative
- `ghost`: action discrète

### États critiques
- Couleur `danger` uniquement pour refus/alerte
- Succès via badge/encart discret, pas d’animation agressive

### Découvrir
- `Pulse quartier` doit rester informatif et discret
- Recherche visible et immédiatement utilisable

### Pass d’échange
- Étapes séquentielles claires
- Informations sensibles non exposées au mauvais rôle
- Récapitulatif final obligatoire avant validation

## Accessibilité

- Libellés explicites (`accessibilityLabel`) sur actions clés
- Contrastes gérés via thème
- Taille tactile suffisante pour boutons/chips
