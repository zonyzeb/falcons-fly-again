-- Training sessions (nets / practice) + per-player availability, carpool and
-- cost-split payment tracking. Mirrors the fixtures + match_availability model
-- (0003_fixtures.sql) but training is INTERNAL — signed-in members read it, the
-- public site does not.

-- ─────────────────────────────────────────────────────────────
-- training_sessions: one practice/nets session.
-- ─────────────────────────────────────────────────────────────
create table public.training_sessions (
  id               uuid primary key default gen_random_uuid(),
  title            text,                 -- optional label, e.g. "Nets"
  session_date     date not null,
  start_time       time,
  end_time         time,
  location         text,
  notes            text,
  cost_sek         integer,              -- total cost, split among 'available' responders
  paid_by          uuid references auth.users (id) on delete set null, -- who fronted it
  auto_remind      boolean not null default true,   -- send automatic reminders
  last_reminded_at timestamptz,          -- dedup guard for the reminder cron
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.training_sessions enable row level security;

-- Internal only — signed-in members/admins can read (NOT the public site).
create policy "training: read (signed in)"
  on public.training_sessions for select
  to authenticated
  using (true);

-- Only admins create / edit / delete sessions.
create policy "training: admin write"
  on public.training_sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger training_sessions_touch
  before update on public.training_sessions
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- training_availability: a squad player's status for a session,
-- plus carpool (offer/need a lift) and payment of their cost share.
-- Keyed by player_id (not user) so admins can mark unlinked players.
-- ─────────────────────────────────────────────────────────────
create table public.training_availability (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.training_sessions (id) on delete cascade,
  player_id     bigint not null,
  status        text not null check (status in ('available', 'maybe', 'unavailable')),
  -- carpool
  pickup        text not null default 'none' check (pickup in ('none', 'offer', 'need')),
  pickup_seats  smallint,   -- seats available when offering a lift
  pickup_area   text,       -- area / pickup point note
  -- payment of this player's share of cost_sek
  paid          boolean not null default false,
  paid_at       timestamptz,
  set_by        uuid references auth.users (id) on delete set null,
  updated_at    timestamptz not null default now(),
  unique (session_id, player_id)
);

alter table public.training_availability enable row level security;

-- Internal only — signed-in members/admins can read.
create policy "training_avail: read (signed in)"
  on public.training_availability for select
  to authenticated
  using (true);

-- A member may set their own linked player's row; admins may set anyone's.
create policy "training_avail: member or admin insert"
  on public.training_availability for insert
  to authenticated
  with check (
    public.is_admin()
    or player_id = (select player_id from public.profiles where id = auth.uid())
  );

create policy "training_avail: member or admin update"
  on public.training_availability for update
  to authenticated
  using (
    public.is_admin()
    or player_id = (select player_id from public.profiles where id = auth.uid())
  )
  with check (
    public.is_admin()
    or player_id = (select player_id from public.profiles where id = auth.uid())
  );

create policy "training_avail: admin delete"
  on public.training_availability for delete
  to authenticated
  using (public.is_admin());

create trigger training_availability_touch
  before update on public.training_availability
  for each row execute function public.touch_updated_at();
