-- Upcoming fixtures (tournament matches) + per-match player availability.

-- ─────────────────────────────────────────────────────────────
-- fixtures: one upcoming match. Publicly readable (shown on the site).
-- ─────────────────────────────────────────────────────────────
create table public.fixtures (
  id          uuid primary key default gen_random_uuid(),
  tournament  text not null,
  opponent    text,
  match_date  date not null,
  match_time  time,
  ground      text,
  format      text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.fixtures enable row level security;

-- Anyone (incl. logged-out public site visitors) can read the schedule.
create policy "fixtures: public read"
  on public.fixtures for select
  to anon, authenticated
  using (true);

-- Only admins create / edit / delete fixtures.
create policy "fixtures: admin write"
  on public.fixtures for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger fixtures_touch
  before update on public.fixtures
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- match_availability: a squad player's status for a fixture.
-- Keyed by player_id (not user) so admins can mark players without accounts.
-- ─────────────────────────────────────────────────────────────
create table public.match_availability (
  id          uuid primary key default gen_random_uuid(),
  fixture_id  uuid not null references public.fixtures (id) on delete cascade,
  player_id   bigint not null,
  status      text not null check (status in ('available', 'maybe', 'unavailable')),
  set_by      uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (fixture_id, player_id)
);

alter table public.match_availability enable row level security;

-- Internal only — signed-in members/admins can read (NOT the public site).
create policy "match_avail: read (signed in)"
  on public.match_availability for select
  to authenticated
  using (true);

-- A member may set their own linked player's status; admins may set anyone's.
create policy "match_avail: member or admin insert"
  on public.match_availability for insert
  to authenticated
  with check (
    public.is_admin()
    or player_id = (select player_id from public.profiles where id = auth.uid())
  );

create policy "match_avail: member or admin update"
  on public.match_availability for update
  to authenticated
  using (
    public.is_admin()
    or player_id = (select player_id from public.profiles where id = auth.uid())
  )
  with check (
    public.is_admin()
    or player_id = (select player_id from public.profiles where id = auth.uid())
  );

create policy "match_avail: admin delete"
  on public.match_availability for delete
  to authenticated
  using (public.is_admin());

create trigger match_availability_touch
  before update on public.match_availability
  for each row execute function public.touch_updated_at();
