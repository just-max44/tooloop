-- Tooloop — Complete database schema
-- PostgreSQL 14+
-- Run once on a fresh database: psql $DATABASE_URL -f 000_full_schema.sql

create extension if not exists pgcrypto;

-- =========================
-- Users & auth
-- =========================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  first_name text not null default 'Utilisateur',
  last_name text not null default 'Tooloop',
  display_name text generated always as (trim(first_name || ' ' || last_name)) stored,
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

-- =========================
-- Objects & listings
-- =========================
create table if not exists objects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  image_url text,
  is_free boolean not null default true,
  requires_deposit boolean not null default false,
  distance_km numeric(5,2),
  response_time_label text,
  trust_score_snapshot int not null default 0,
  loops_completed_snapshot int not null default 0,
  impact_kg_co2_snapshot int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_objects_owner on objects(owner_user_id);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  object_id uuid references objects(id) on delete set null,
  publication_mode text not null check (publication_mode in ('loan', 'request')),
  title text not null,
  description text not null,
  category text not null,
  image_url text,
  distance_km numeric(5,2),
  target_period text,
  requires_deposit boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Loans & exchange flow
-- =========================
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  object_id uuid references objects(id) on delete set null,
  lender_user_id uuid not null references users(id) on delete cascade,
  borrower_user_id uuid not null references users(id) on delete cascade,
  state text not null default 'pending' check (state in ('pending', 'accepted', 'completed', 'refused')),
  due_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loans_lender on loans(lender_user_id);
create index if not exists idx_loans_borrower on loans(borrower_user_id);
create index if not exists idx_loans_object on loans(object_id);

create table if not exists exchange_passes (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null unique references loans(id) on delete cascade,
  meetup_label text not null,
  location_label text not null,
  code_seed text not null,
  verifier_code text not null,
  created_at timestamptz not null default now()
);

create table if not exists exchange_messages (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  sender_user_id uuid references users(id) on delete set null,
  sender_kind text not null check (sender_kind in ('me', 'other', 'system')),
  text text not null,
  time_label text,
  created_at timestamptz not null default now()
);

create table if not exists loan_proof_state (
  loan_id uuid primary key references loans(id) on delete cascade,
  pickup_validated boolean not null default false,
  return_validated boolean not null default false,
  pickup_return_date_iso timestamptz,
  return_handback_date_iso timestamptz,
  lender_condition text check (lender_condition in ('conforme', 'partiel', 'abime')),
  borrower_pickup_accepted boolean not null default false,
  borrower_return_accepted boolean not null default false,
  pickup_accepted_at_iso timestamptz,
  return_accepted_at_iso timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists loan_proof_state_updated_at_idx on loan_proof_state(updated_at);

-- =========================
-- Trust, feedback, comments
-- =========================
create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  author_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  evaluation_percent int not null check (evaluation_percent between 0 and 100),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedbacks_target on feedbacks(target_user_id);

create table if not exists trust_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  trust_score int not null default 0,
  loops_validated int not null default 0,
  exchange_rate int not null default 0,
  active_weeks int not null default 0,
  story_contributions_approved int not null default 0,
  on_time_return_rate int not null default 0,
  response_rate int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists trust_exchange_comments (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  author_user_id uuid references users(id) on delete set null,
  target_user_id uuid references users(id) on delete set null,
  author_name_snapshot text not null,
  target_name_snapshot text,
  loan_object_name_snapshot text not null,
  comment text not null,
  time_label text,
  created_at timestamptz not null default now()
);

create index if not exists idx_trust_comments_target on trust_exchange_comments(target_user_id);

-- =========================
-- Object stories
-- =========================
create table if not exists object_stories (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null unique references objects(id) on delete cascade,
  total_loans int not null default 0,
  anecdote text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists object_story_moments (
  id uuid primary key default gen_random_uuid(),
  object_story_id uuid not null references object_stories(id) on delete cascade,
  label text not null,
  detail text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists object_story_photos (
  id uuid primary key default gen_random_uuid(),
  object_story_id uuid not null references object_stories(id) on delete cascade,
  photo_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists story_contributions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  object_id uuid not null references objects(id) on delete cascade,
  author_user_id uuid not null references users(id) on delete cascade,
  photo_url text not null,
  comment text,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_story_contrib_object on story_contributions(object_id);

-- =========================
-- Success tags
-- =========================
create table if not exists success_tags (
  id text primary key,
  label text not null,
  condition_type text not null,
  threshold int not null,
  description text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists user_successes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  success_tag_id text not null references success_tags(id) on delete cascade,
  unlocked_at timestamptz,
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  unique (user_id, success_tag_id)
);

-- =========================
-- Events (SSE / polling)
-- =========================
create table if not exists app_events (
  id bigint generated always as identity primary key,
  topic text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists app_events_topic_id_idx on app_events(topic, id);

-- =========================
-- Seed: default success tags
-- =========================
insert into success_tags (id, label, condition_type, threshold, description, is_hidden) values
  ('exchange-rate-50',   'Taux d''échange 50%', 'exchange_rate',             50,  'Atteindre 50% de taux d''échange', false),
  ('loops-10',           '10 prêts validés',    'completed_loans',           10,  'Valider 10 prêts',                 false),
  ('on-time-90',         'Retours à temps 90%', 'on_time_return_rate',       90,  'Retourner à temps 90% du temps',   false),
  ('story-contrib-5',    '5 contributions',     'story_contrib_approved',     5,  'Faire approuver 5 contributions',  false),
  ('active-weeks-12',    '12 semaines actives', 'active_weeks',              12,  'Être actif 12 semaines',           true)
on conflict (id) do nothing;
