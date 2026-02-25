# Supabase Security Checklist — Tooloop

## 1) RLS et policies

- Appliquer les migrations:

```bash
npx supabase db push
```

- Vérifier RLS:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public'
order by tablename;
```

- Vérifier policies:

```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname='public'
order by tablename, policyname;
```

## 2) Auth anti-abus

Dans Supabase Dashboard:

- Authentication → Rate limits
  - réduire les seuils de login/signup/reset (valeurs strictes prod)
- Authentication → Bot detection
  - activer CAPTCHA (signup/login)

## 3) Function delete-account

- Redéployer:

```bash
npx supabase functions deploy delete-account
```

- Test rate-limit (attendu: `429 Too many requests` après plusieurs requêtes dans la fenêtre):
  - tenter 4 suppressions en < 1h sur même compte/IP

## 4) Contrôles manuels essentiels

- Vérifier qu’un utilisateur ne peut lire/modifier que ses données sensibles (`listings`, `loans`, `messages`, etc.).
- Vérifier qu’un utilisateur non participant à un prêt ne peut pas lire son chat/pass d’échange.
- Vérifier qu’un utilisateur ne peut pas créer une `listing` avec `user_id` d’un autre.

## 5) Monitoring minimal

- Créer une alerte sur pics `401`, `403`, `429`, `5xx` (Edge Functions + API).
- Revue hebdomadaire des erreurs Auth (tentatives invalides, bursts de reset).
