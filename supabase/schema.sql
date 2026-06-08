-- ============================================================
-- FormCraft schema  (run in Supabase SQL Editor)
-- ============================================================

-- Forms ------------------------------------------------------
create table if not exists public.forms (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text default '',
  -- schema = ordered array of field objects:
  -- [{ "id":"f1","type":"text","label":"Name","required":true,"options":[] }, ...]
  schema      jsonb not null default '[]'::jsonb,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Entries (submissions) -------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  form_id     uuid not null references public.forms(id) on delete cascade,
  owner_id    uuid not null,           -- denormalized from form for RLS speed
  -- data = { "f1":"Jane", "f2":"jane@x.com", ... } keyed by field id
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists entries_form_id_idx on public.entries(form_id);
create index if not exists forms_owner_idx     on public.forms(owner_id);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists forms_touch on public.forms;
create trigger forms_touch before update on public.forms
  for each row execute function public.touch_updated_at();

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

-- copy owner_id onto entry from its parent form automatically
create or replace function public.set_entry_owner()
returns trigger language plpgsql security definer as $$
begin
  select owner_id into new.owner_id from public.forms where id = new.form_id;
  return new;
end; $$;

drop trigger if exists entries_set_owner on public.entries;
create trigger entries_set_owner before insert on public.entries
  for each row execute function public.set_entry_owner();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.forms   enable row level security;
alter table public.entries enable row level security;

-- Owners manage their own forms
drop policy if exists forms_owner_all on public.forms;
create policy forms_owner_all on public.forms
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Anyone (even anon) can READ a published form so the public fill page works
drop policy if exists forms_public_read on public.forms;
create policy forms_public_read on public.forms
  for select using (published = true);

-- Owners see/manage their own entries
drop policy if exists entries_owner_all on public.entries;
create policy entries_owner_all on public.entries
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Anyone can INSERT an entry into a published form (public submission)
drop policy if exists entries_public_insert on public.entries;
create policy entries_public_insert on public.entries
  for insert with check (
    exists (select 1 from public.forms f
            where f.id = form_id and f.published = true)
  );

-- NOTE: the service-role key used by /api routes bypasses RLS entirely,
-- which is what lets Make read/update across the table via your endpoints.
