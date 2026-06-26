-- Falcons Cricket Club — auth roles + member availability
-- Run this in the Supabase SQL editor (or via the Supabase CLI) once per project.

-- ─────────────────────────────────────────────────────────────
-- 1. profiles: one row per auth user, holds role + CricHeroes link
-- ─────────────────────────────────────────────────────────────
create type public.member_role as enum ('member', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        public.member_role not null default 'member',
  -- links this account to a CricHeroes player_id from stats/data/players.json
  player_id   bigint,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile when a new auth user is created (e.g. via invite).
-- full_name is read from the invite's user_metadata when present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, player_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.member_role, 'member'),
    nullif(new.raw_user_meta_data ->> 'player_id', '')::bigint
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current request made by an admin?
-- security definer so the policy check itself isn't blocked by RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles policies
create policy "profiles: read all (signed in)"
  on public.profiles for select
  to authenticated
  using (true);

-- A member may edit their own name, but NOT their role or player link.
create policy "profiles: update own (no privilege change)"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and player_id is not distinct from (select player_id from public.profiles where id = auth.uid())
  );

-- Admins can update any profile (assign roles, link players).
create policy "profiles: admin update any"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles: admin delete"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 2. availability: a member's current availability for selection
-- ─────────────────────────────────────────────────────────────
create type public.avail_status as enum ('available', 'unavailable', 'maybe');
create type public.fitness_status as enum ('Fit', 'Doubtful', 'Injured', 'Recovering');

create table public.availability (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  player_id   bigint,
  status      public.avail_status not null default 'available',
  fitness     public.fitness_status not null default 'Fit',
  note        text,
  updated_at  timestamptz not null default now()
);

alter table public.availability enable row level security;

-- Everyone signed in can read availability (admins aggregate it; members see the wall).
create policy "availability: read all (signed in)"
  on public.availability for select
  to authenticated
  using (true);

-- A member can only write their own row.
create policy "availability: write own"
  on public.availability for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "availability: update own"
  on public.availability for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can override / clear any row.
create policy "availability: admin write any"
  on public.availability for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger availability_touch
  before update on public.availability
  for each row execute function public.touch_updated_at();

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();
