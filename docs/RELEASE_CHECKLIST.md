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

- [ ] Politique de confidentialité publique (URL)
- [x] CGU rédigées (`docs/TERMS_AND_CONDITIONS.md`)
- [x] Politique de confidentialité rédigée (`docs/PRIVACY_POLICY.md`)
- [x] CGU accessibles depuis l’app
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
