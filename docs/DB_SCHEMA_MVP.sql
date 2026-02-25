-- Tooloop MVP database schema
-- Target: PostgreSQL 14+
-- Auth strategy: OAuth only (Google/Facebook), no email/password required for login

create extension if not exists pgcrypto;

-- =========================
-- Users & OAuth identities
-- =========================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  display_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_oauth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('google', 'facebook')),
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

-- =========================
-- Domain: objects & listings
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
  trust_score_snapshot int,
  loops_completed_snapshot int,
  impact_kg_co2_snapshot int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  object_id uuid references objects(id) on delete set null,
  publication_mode text not null check (publication_mode in ('loan', 'request')),
  title text not null,
  description text not null,
  category text not null,
  target_period text,
  requires_deposit boolean,
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
  state text not null check (state in ('pending', 'accepted', 'completed', 'refused')),
  due_text text,
  pickup_date_label text,
  return_date_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exchange_passes (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null unique references loans(id) on delete cascade,
  meetup_label text not null,
  location_label text not null,
  code_seed text not null,
  verifier_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loan_return_status (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null unique references loans(id) on delete cascade,
  return_condition text check (return_condition in ('conforme', 'partiel', 'abime')),
  borrower_return_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

-- =========================
-- Trust, feedback, comments
-- =========================
create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null unique references loans(id) on delete cascade,
  author_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  evaluation_percent int not null check (evaluation_percent between 0 and 100),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists feedback_criteria_votes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedbacks(id) on delete cascade,
  criterion_id text not null,
  created_at timestamptz not null default now(),
  unique (feedback_id, criterion_id)
);

create table if not exists trust_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  trust_score int not null default 0 check (trust_score between 0 and 100),
  loops_validated int not null default 0,
  exchange_rate int not null default 0 check (exchange_rate between 0 and 100),
  active_weeks int not null default 0,
  story_contributions_approved int not null default 0,
  on_time_return_rate int not null default 0 check (on_time_return_rate between 0 and 100),
  response_rate int not null default 0 check (response_rate between 0 and 100),
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

-- =========================
-- Mini-story & moderation
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
  review_status text not null check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- =========================
-- Success tags / featured success
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

create table if not exists user_featured_success (
  user_id uuid primary key references users(id) on delete cascade,
  success_tag_id text not null references success_tags(id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- =========================
-- Useful indexes
-- =========================
create index if not exists idx_objects_owner on objects(owner_user_id);
create index if not exists idx_loans_lender on loans(lender_user_id);
create index if not exists idx_loans_borrower on loans(borrower_user_id);
create index if not exists idx_loans_object on loans(object_id);
create index if not exists idx_feedbacks_target on feedbacks(target_user_id);
create index if not exists idx_trust_comments_target on trust_exchange_comments(target_user_id);
create index if not exists idx_story_contrib_object on story_contributions(object_id);

-- End of schema
