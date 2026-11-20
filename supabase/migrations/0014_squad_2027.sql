-- 2027 squad — an admin-curated roster shown publicly at /team (replacing the
-- auto-scraped squad, which moves to the "Tennis Ball Team" page). Players may
-- link to a CricHeroes player_id (for name/photo/stats) or be free-text recruits.

create table public.squad_2027 (
  id              uuid primary key default gen_random_uuid(),
  player_id       bigint,                 -- links to stats/data/players.json when in the system
  name            text,                   -- free-text recruit name / display override
  role            text check (role in ('BAT', 'BOWL', 'ALL', 'WK')),
  tagline         text,                   -- short blurb for the showcase card
  photo_url       text,                   -- optional override photo
  jersey_number   int,
  is_captain      boolean not null default false,
  is_vice_captain boolean not null default false,
  status          text not null default 'in_talks' check (status in ('confirmed', 'in_talks')),
  sort_order      int not null default 0,
  published       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- must identify the player somehow
  check (player_id is not null or name is not null)
);

alter table public.squad_2027 enable row level security;

-- Public (incl. logged-out visitors) sees only confirmed + published players.
create policy "squad_2027: public read (confirmed + published)"
  on public.squad_2027 for select
  to anon, authenticated
  using (published = true and status = 'confirmed');

-- Admins can read everything (drafts + in-talks).
create policy "squad_2027: admin read all"
  on public.squad_2027 for select
  to authenticated
  using (public.is_admin());

-- Only admins create / edit / delete.
create policy "squad_2027: admin write"
  on public.squad_2027 for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger squad_2027_touch
  before update on public.squad_2027
  for each row execute function public.touch_updated_at();
