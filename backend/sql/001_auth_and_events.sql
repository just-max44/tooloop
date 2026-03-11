create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  first_name text not null default 'Utilisateur',
  last_name text not null default 'Tooloop',
  avatar_url text,
  private_city text,
  private_postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists refresh_tokens_user_id_idx on refresh_tokens(user_id);
create index if not exists refresh_tokens_expires_at_idx on refresh_tokens(expires_at);

create table if not exists app_events (
  id bigint generated always as identity primary key,
  topic text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists app_events_topic_id_idx on app_events(topic, id);