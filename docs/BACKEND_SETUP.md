# Backend setup (MVP)

Ce projet utilise **Supabase** comme backend PostgreSQL + Auth email/password.

## 1) Créer le projet Supabase

1. Créer un projet sur Supabase.
2. Récupérer:
   - `Project URL`
   - `anon public key`

## 2) Configurer les variables d’environnement Expo

1. Copier `.env.example` en `.env`.
2. Renseigner:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3) Appliquer le schéma SQL MVP

1. Ouvrir Supabase SQL Editor.
2. Exécuter le contenu de [docs/DB_SCHEMA_MVP.sql](./DB_SCHEMA_MVP.sql).

## 4) Auth email + reset mot de passe

Dans Supabase > Authentication > Providers:

- Activer **Email**.
- Désactiver la confirmation email obligatoire si vous voulez un login immédiat MVP.

Dans `.env` (optionnel mais recommandé):

```bash
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_TO=tooloop://login
```

Cette URL est utilisée par `resetPasswordForEmail` dans `lib/backend/auth.ts`.

## 5) Notifications dans l’app (locales uniquement)

Les notifications sont **locales appareil** (pas d’envoi email):

- `new_message_received`
- `loan_request_accepted`
- `return_due_tomorrow`

Les préférences globales + par type sont gérées côté app dans `Profil`.

## 6) Suppression de compte (obligatoire stores)

La suppression de compte est implémentée via une Edge Function Supabase sécurisée.

Déploiement:

```bash
supabase functions deploy delete-account
```

Dans `.env` (optionnel):

```bash
EXPO_PUBLIC_DELETE_ACCOUNT_FUNCTION_NAME=delete-account
```

## 7) Sécurité anti-abus (obligatoire prod)

1. Appliquer les migrations SQL Supabase (incluant hardening RLS + rate-limit):

```bash
supabase db push
```

2. Vérifier que les tables `public` sont bien sous RLS et que des policies existent.
3. Dans Supabase Dashboard > Auth > Rate Limits, activer des limites strictes pour login/signup/reset.
4. Dans Supabase Dashboard > Auth > Bot Detection, activer CAPTCHA pour signup/login.
5. Redéployer la function delete-account après migration:

```bash
supabase functions deploy delete-account
```

Checklist détaillée: `docs/SUPABASE_SECURITY_CHECKLIST.md`

## 8) Client backend côté app

Le client partagé est prêt dans [lib/backend/supabase.ts](../lib/backend/supabase.ts).

- `isBackendConfigured`: indique si les variables sont présentes.
- `getSupabaseClient()`: retourne un client prêt à l’emploi ou lève une erreur explicite.

## 9) Vérification rapide

1. Lancer l’app:

```bash
npm run start
```

2. Vérifier que `isBackendConfigured === true` avant d’appeler le backend.

## 10) Étape suivante recommandée

Brancher progressivement les écrans:

1. Auth (login OAuth)
2. Listings/objects
3. Loans + pass d’échange
4. Feedback et trust
