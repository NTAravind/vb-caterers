-- The website menu, stored as a single JSON document
--
-- Run this in the Supabase SQL Editor (or `supabase db push` once linked).
-- Safe to re-run: every statement is idempotent.
--
-- The menu is one document (~2,000 dishes) that the admin panel loads and saves
-- whole, so it is kept as a single jsonb row rather than normalised tables:
-- one round trip instead of thousands, and no partial state mid-edit.

create table if not exists public.menu (
  -- Single-row table. The check constraint is what enforces the singleton, so a
  -- stray insert cannot quietly create a second menu.
  id         text        primary key default 'default',
  data       jsonb       not null,
  -- Bumped on every write. The admin sends the version it loaded and the write
  -- only lands if it still matches, so two open sessions cannot overwrite each
  -- other without anyone noticing.
  version    integer     not null default 1,
  updated_at timestamptz not null default now(),

  constraint menu_singleton_check check (id = 'default'),
  constraint menu_document_check  check (jsonb_typeof(data) = 'object'),
  constraint menu_version_check   check (version >= 1)
);

-- Row Level Security: no policy is defined for anon/authenticated, so nobody
-- holding the public anon key can read or write this table. Every read and
-- write goes through the server with the service-role key.
alter table public.menu enable row level security;

-- Since 2026-04 Supabase does not expose newly created tables through the
-- Data API without explicit GRANTs (enforced on existing projects from
-- 2026-10-30), so grant deliberately and only to the service role.
revoke all on public.menu from anon, authenticated;
grant select, insert, update, delete on public.menu to service_role;

comment on table public.menu is
  'The website menu (tagline, closing line, sections, groups and dishes) as one JSON document. Supabase is the source of truth; data/menu.json is only the seed and offline fallback.';
