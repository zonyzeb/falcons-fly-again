-- Promote "tournament" from a free-text field on each match to its own entity.
-- Matches (fixtures) now belong to a tournament.

create table public.tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  format      text,            -- e.g. T20, T10
  season      int,             -- year
  start_date  date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.tournaments enable row level security;

create policy "tournaments: public read"
  on public.tournaments for select
  to anon, authenticated
  using (true);

create policy "tournaments: admin write"
  on public.tournaments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger tournaments_touch
  before update on public.tournaments
  for each row execute function public.touch_updated_at();

-- Re-point fixtures at a tournament (safe: zero existing rows).
alter table public.fixtures drop column tournament;
alter table public.fixtures drop column format;
alter table public.fixtures
  add column tournament_id uuid not null references public.tournaments (id) on delete cascade;
