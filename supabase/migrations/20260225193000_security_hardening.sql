-- Security hardening: RLS + anti-abuse primitives

create table if not exists public.security_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.check_rate_limit(
  p_rate_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz := now() - make_interval(secs => p_window_seconds);
  v_allowed boolean := false;
begin
  if p_rate_key is null or length(trim(p_rate_key)) = 0 then
    return false;
  end if;

  if p_max_hits <= 0 or p_window_seconds <= 0 then
    return false;
  end if;

  insert into public.security_rate_limits(rate_key, window_started_at, hit_count, updated_at)
  values (p_rate_key, v_now, 1, v_now)
  on conflict (rate_key)
  do update set
    hit_count = case
      when public.security_rate_limits.window_started_at < v_window_start then 1
      when public.security_rate_limits.hit_count < p_max_hits then public.security_rate_limits.hit_count + 1
      else public.security_rate_limits.hit_count
    end,
    window_started_at = case
      when public.security_rate_limits.window_started_at < v_window_start then v_now
      else public.security_rate_limits.window_started_at
    end,
    updated_at = v_now;

  select
    case
      when s.window_started_at < v_window_start then true
      when s.hit_count <= p_max_hits then true
      else false
    end
  into v_allowed
  from public.security_rate_limits s
  where s.rate_key = p_rate_key;

  return coalesce(v_allowed, false);
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;

alter table public.security_rate_limits enable row level security;

-- Enable RLS on core tables
alter table public.users enable row level security;
alter table public.objects enable row level security;
alter table public.listings enable row level security;
alter table public.loans enable row level security;
alter table public.exchange_passes enable row level security;
alter table public.loan_return_status enable row level security;
alter table public.exchange_messages enable row level security;
alter table public.feedbacks enable row level security;
alter table public.feedback_criteria_votes enable row level security;
alter table public.trust_profiles enable row level security;
alter table public.trust_exchange_comments enable row level security;
alter table public.object_stories enable row level security;
alter table public.object_story_moments enable row level security;
alter table public.object_story_photos enable row level security;
alter table public.story_contributions enable row level security;
alter table public.user_successes enable row level security;
alter table public.user_featured_success enable row level security;

-- users
drop policy if exists users_select_authenticated on public.users;
create policy users_select_authenticated
on public.users
for select
to authenticated
using (true);

drop policy if exists users_insert_self on public.users;
create policy users_insert_self
on public.users
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists users_delete_self on public.users;
create policy users_delete_self
on public.users
for delete
to authenticated
using (id = auth.uid());

-- objects
drop policy if exists objects_select_active_or_owner on public.objects;
create policy objects_select_active_or_owner
on public.objects
for select
to authenticated
using (is_active = true or owner_user_id = auth.uid());

drop policy if exists objects_insert_owner on public.objects;
create policy objects_insert_owner
on public.objects
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists objects_update_owner on public.objects;
create policy objects_update_owner
on public.objects
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists objects_delete_owner on public.objects;
create policy objects_delete_owner
on public.objects
for delete
to authenticated
using (owner_user_id = auth.uid());

-- listings
drop policy if exists listings_select_owner on public.listings;
create policy listings_select_owner
on public.listings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists listings_insert_owner on public.listings;
create policy listings_insert_owner
on public.listings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists listings_update_owner on public.listings;
create policy listings_update_owner
on public.listings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists listings_delete_owner on public.listings;
create policy listings_delete_owner
on public.listings
for delete
to authenticated
using (user_id = auth.uid());

-- loans
drop policy if exists loans_select_participant on public.loans;
create policy loans_select_participant
on public.loans
for select
to authenticated
using (lender_user_id = auth.uid() or borrower_user_id = auth.uid());

drop policy if exists loans_insert_participant on public.loans;
create policy loans_insert_participant
on public.loans
for insert
to authenticated
with check (lender_user_id = auth.uid() or borrower_user_id = auth.uid());

drop policy if exists loans_update_participant on public.loans;
create policy loans_update_participant
on public.loans
for update
to authenticated
using (lender_user_id = auth.uid() or borrower_user_id = auth.uid())
with check (lender_user_id = auth.uid() or borrower_user_id = auth.uid());

-- exchange passes / return status / messages
drop policy if exists exchange_passes_select_participant on public.exchange_passes;
create policy exchange_passes_select_participant
on public.exchange_passes
for select
to authenticated
using (
  exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
);

drop policy if exists exchange_passes_mutate_participant on public.exchange_passes;
create policy exchange_passes_mutate_participant
on public.exchange_passes
for all
to authenticated
using (
  exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
);

drop policy if exists loan_return_status_select_participant on public.loan_return_status;
create policy loan_return_status_select_participant
on public.loan_return_status
for select
to authenticated
using (
  exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
);

drop policy if exists loan_return_status_mutate_participant on public.loan_return_status;
create policy loan_return_status_mutate_participant
on public.loan_return_status
for all
to authenticated
using (
  exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
);

drop policy if exists exchange_messages_select_participant on public.exchange_messages;
create policy exchange_messages_select_participant
on public.exchange_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
);

drop policy if exists exchange_messages_insert_sender_participant on public.exchange_messages;
create policy exchange_messages_insert_sender_participant
on public.exchange_messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.loans l
    where l.id = loan_id
      and (l.lender_user_id = auth.uid() or l.borrower_user_id = auth.uid())
  )
);

-- feedback
drop policy if exists feedbacks_select_related_user on public.feedbacks;
create policy feedbacks_select_related_user
on public.feedbacks
for select
to authenticated
using (author_user_id = auth.uid() or target_user_id = auth.uid());

drop policy if exists feedbacks_insert_author on public.feedbacks;
create policy feedbacks_insert_author
on public.feedbacks
for insert
to authenticated
with check (author_user_id = auth.uid());

drop policy if exists feedback_criteria_votes_select_related_feedback on public.feedback_criteria_votes;
create policy feedback_criteria_votes_select_related_feedback
on public.feedback_criteria_votes
for select
to authenticated
using (
  exists (
    select 1
    from public.feedbacks f
    where f.id = feedback_id
      and (f.author_user_id = auth.uid() or f.target_user_id = auth.uid())
  )
);

drop policy if exists feedback_criteria_votes_insert_related_feedback on public.feedback_criteria_votes;
create policy feedback_criteria_votes_insert_related_feedback
on public.feedback_criteria_votes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.feedbacks f
    where f.id = feedback_id
      and f.author_user_id = auth.uid()
  )
);

-- trust / stories / tags
drop policy if exists trust_profiles_select_authenticated on public.trust_profiles;
create policy trust_profiles_select_authenticated
on public.trust_profiles
for select
to authenticated
using (true);

drop policy if exists trust_profiles_mutate_self on public.trust_profiles;
create policy trust_profiles_mutate_self
on public.trust_profiles
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists trust_comments_select_authenticated on public.trust_exchange_comments;
create policy trust_comments_select_authenticated
on public.trust_exchange_comments
for select
to authenticated
using (true);

drop policy if exists object_stories_select_authenticated on public.object_stories;
create policy object_stories_select_authenticated
on public.object_stories
for select
to authenticated
using (true);

drop policy if exists object_story_moments_select_authenticated on public.object_story_moments;
create policy object_story_moments_select_authenticated
on public.object_story_moments
for select
to authenticated
using (true);

drop policy if exists object_story_photos_select_authenticated on public.object_story_photos;
create policy object_story_photos_select_authenticated
on public.object_story_photos
for select
to authenticated
using (true);

drop policy if exists story_contributions_select_self on public.story_contributions;
create policy story_contributions_select_self
on public.story_contributions
for select
to authenticated
using (author_user_id = auth.uid());

drop policy if exists story_contributions_insert_self on public.story_contributions;
create policy story_contributions_insert_self
on public.story_contributions
for insert
to authenticated
with check (author_user_id = auth.uid());

drop policy if exists success_tags_select_authenticated on public.success_tags;
create policy success_tags_select_authenticated
on public.success_tags
for select
to authenticated
using (true);

drop policy if exists user_successes_select_self on public.user_successes;
create policy user_successes_select_self
on public.user_successes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_featured_success_select_self on public.user_featured_success;
create policy user_featured_success_select_self
on public.user_featured_success
for select
to authenticated
using (user_id = auth.uid());
