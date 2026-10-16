-- Leads captured by the welcome gate on vbcaterers.com.
--
-- Run this in the Supabase SQL Editor (or `supabase db push` once linked).
-- Safe to re-run: every statement is idempotent.

create table if not exists public.leads (
  id         uuid        primary key default gen_random_uuid(),
  phone      text        not null,
  email      text        not null,
  source     text        not null default 'welcome',
  created_at timestamptz not null default now(),

  -- Tighter than the runtime validation in lib/leads.ts, so a bad row can
  -- never be written even if the API layer is bypassed.
  constraint leads_phone_check  check (char_length(phone) between 8 and 20),
  constraint leads_email_check  check (char_length(email) between 5 and 254),
  constraint leads_source_check check (char_length(source) between 1 and 40),

  -- The same visitor may come back and submit again; keep one row per contact.
  constraint leads_phone_email_key unique (phone, email)
);

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

-- Row Level Security: no policy is defined for anon/authenticated, so nobody
-- holding the public anon key can read or write this table. Every read and
-- write goes through the server with the service-role key.
alter table public.leads enable row level security;

-- Since 2026-04 Supabase does not expose newly created tables through the
-- Data API without explicit GRANTs (enforced on existing projects from
-- 2026-10-30), so grant deliberately and only to the service role.
revoke all on public.leads from anon, authenticated;
grant select, insert, update, delete on public.leads to service_role;

comment on table public.leads is
  'Phone + email details submitted through the website welcome gate.';
