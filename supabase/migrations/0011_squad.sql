-- Squad attributes (role, bowling type, fitness, active) moved out of each
-- admin's localStorage into shared cloud storage. Name/slug/photo still come
-- from the scraped players.json; only the editable attributes live here.
-- Rows are created lazily when an admin edits a player; unset players fall back
-- to deterministic inferred defaults in the client.
create table public.squad (
  player_id          bigint primary key,
  role               text check (role in ('BAT', 'BOWL', 'ALL', 'WK')),
  bowling_type       text check (bowling_type in ('Fast', 'Spin', 'Medium', 'N/A')),
  active             boolean not null default true,
  fitness            text not null default 'Fit' check (fitness in ('Fit', 'Injured', 'Doubtful', 'Recovering')),
  preferred_position int not null default 0,
  updated_at         timestamptz not null default now()
);

alter table public.squad enable row level security;

create policy "squad: read (signed in)"
  on public.squad for select to authenticated using (true);

create policy "squad: admin write"
  on public.squad for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create trigger squad_touch
  before update on public.squad
  for each row execute function public.touch_updated_at();
