-- Umpiring duties — a date with two assigned umpires (members), plus
-- member-initiated swap requests that an admin approves.

-- ─────────────────────────────────────────────────────────────
-- umpiring_duties: one match day, two umpire slots
-- ─────────────────────────────────────────────────────────────
create table public.umpiring_duties (
  id          uuid primary key default gen_random_uuid(),
  duty_date   date not null,
  umpire1     uuid references auth.users (id) on delete set null,
  umpire2     uuid references auth.users (id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.umpiring_duties enable row level security;

-- Everyone signed in can see the rota.
create policy "duties: read all (signed in)"
  on public.umpiring_duties for select
  to authenticated
  using (true);

-- Only admins create / edit / delete duties.
create policy "duties: admin write"
  on public.umpiring_duties for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger umpiring_duties_touch
  before update on public.umpiring_duties
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- duty_swap_requests: a member asks to hand their slot to another member
-- ─────────────────────────────────────────────────────────────
create table public.duty_swap_requests (
  id            uuid primary key default gen_random_uuid(),
  duty_id       uuid not null references public.umpiring_duties (id) on delete cascade,
  slot          smallint not null check (slot in (1, 2)),
  requested_by  uuid not null references auth.users (id) on delete cascade,
  requested_to  uuid not null references auth.users (id) on delete cascade,
  note          text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'declined', 'cancelled')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

alter table public.duty_swap_requests enable row level security;

-- Visible to the requester, the proposed replacement, and admins.
create policy "swaps: read involved or admin"
  on public.duty_swap_requests for select
  to authenticated
  using (requested_by = auth.uid() or requested_to = auth.uid() or public.is_admin());

-- A member may only request a swap for a slot they currently hold.
create policy "swaps: member create own"
  on public.duty_swap_requests for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.umpiring_duties d
      where d.id = duty_id
        and ((slot = 1 and d.umpire1 = auth.uid()) or (slot = 2 and d.umpire2 = auth.uid()))
    )
  );

-- The requester can cancel their own still-pending request.
create policy "swaps: requester cancel own"
  on public.duty_swap_requests for update
  to authenticated
  using (requested_by = auth.uid() and status = 'pending')
  with check (requested_by = auth.uid() and status = 'cancelled');

-- Admins approve / decline. (Approval also reassigns the duty slot, done
-- as a separate admin-privileged update on umpiring_duties.)
create policy "swaps: admin resolve"
  on public.duty_swap_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
