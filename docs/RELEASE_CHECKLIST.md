# Release Checklist — Play Store / App Store

## 1) Identité application

- [x] Définir `expo.name` et `expo.slug` finaux
- [x] Définir `ios.bundleIdentifier` (ex: `com.tooloop.app`)
- [x] Définir `android.package` (ex: `com.tooloop.app`)
- [x] Vérifier `expo.scheme` pour deep links

## 2) Versioning

- [x] Mettre à jour `expo.version`
- [x] Définir `ios.buildNumber`
- [x] Définir `android.versionCode`
- [ ] Geler un changelog release

## 3) Build & signature

- [x] Configurer EAS (`eas.json`) selon les environnements
- [ ] Générer builds `preview` puis `production`
- [ ] Vérifier signatures Android (AAB) et iOS

## 4) Qualité technique

- [x] `npm run lint` passe
- [x] `npx tsc --noEmit` passe
- [ ] Vérifier lancement Android release
- [ ] Vérifier lancement iOS release
- [ ] Vérifier crashes/logs sur device réel

## 5) UX & accessibilité

- [x] Zones tactiles cohérentes sur composants principaux
- [x] Safe areas gérées sur les écrans tabs
- [ ] Contraste final validé en mode light/dark
- [ ] Relecture UX sur petit écran Android (360dp)
- [ ] Relecture UX sur iPhone compact

## 6) Conformité stores

- [ ] Politique de confidentialité publique (URL active)
- [x] CGU rédigées (`docs/TERMS_AND_CONDITIONS.md`)
- [x] Politique de confidentialité rédigée (`docs/PRIVACY_POLICY.md`)
- [x] CGU accessibles depuis l’app
- [x] Suppression de compte déclenchable depuis l’app (fonction `delete-account` à déployer)
- [ ] Déclaration collecte de données (Play + App Store)
- [ ] Permissions strictement nécessaires

## 7) Assets store

- [ ] Icône finale
- [ ] Splash final
- [ ] Screenshots Android (phone + éventuellement tablet)
- [ ] Screenshots iOS (tailles requises)
- [x] Description courte/longue initiale (`docs/STORE_METADATA.md`)

## 8) Go/No-Go

- [ ] Smoke test complet (auth, objets, prêts, profil)
- [ ] Vérification analytics/crash reporting
- [ ] Validation métier finale
- [ ] Soumission Play Console
- [ ] Soumission App Store Connect

### 8.1) Script E2E smoke (manuel)

- [ ] **Auth**: login, logout, relogin sans erreur visible
- [ ] **Création objet**: publication d’un objet avec photo + catégorie + mode prêt
- [ ] **Demande de prêt**: envoi d’une demande depuis un autre compte
- [ ] **Validation pickup**: preuve de remise validée côté prêteur et emprunteur
- [ ] **Validation return**: preuve de retour validée côté prêteur et emprunteur
- [ ] **Clôture échange**: état final `completed` visible dans les deux vues
- [ ] **Messagerie**: ouverture conversation liée au prêt, envoi/réception d’un message
- [ ] **Profil**: édition préférences et persistance après relance app
- [ ] **Erreurs globales**: déclencher une erreur backend simulée et vérifier le bandeau global

Critère de succès: 100% des points ci-dessus passent sur Android et iOS en build `preview`.

## 9) Bloquants actuels à lever

- [ ] Publier les pages légales via GitHub Pages (`docs/privacy.html` et `docs/terms.html`) puis renseigner les URLs stores
- [ ] Déployer l’Edge Function: `supabase functions deploy delete-account`
- [ ] Compléter les formulaires "Data safety" (Play) et "App Privacy" (Apple)
- [ ] Produire screenshots finaux Android + iOS et finaliser la fiche store

Guide: `docs/GITHUB_PAGES_SETUP.md`
