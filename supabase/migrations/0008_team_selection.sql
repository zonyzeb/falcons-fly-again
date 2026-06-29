-- Final XI selection per fixture: the chosen players, batting order, captain,
-- and keeper. Draft until the fixture's xi_published flag is set.

alter table public.fixtures add column xi_published boolean not null default false;

create table public.team_selections (
  id            uuid primary key default gen_random_uuid(),
  fixture_id    uuid not null references public.fixtures (id) on delete cascade,
  player_id     bigint not null,
  batting_order int not null default 0,
  is_captain    boolean not null default false,
  is_keeper     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (fixture_id, player_id)
);

alter table public.team_selections enable row level security;

-- Members can see a selection only once its fixture is published; admins always.
-- (No anon policy → the XI stays internal to signed-in members.)
create policy "selections: read published or admin"
  on public.team_selections for select
  to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.fixtures f where f.id = fixture_id and f.xi_published)
  );

create policy "selections: admin write"
  on public.team_selections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
