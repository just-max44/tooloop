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