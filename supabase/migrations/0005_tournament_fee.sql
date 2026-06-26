-- Tournament entry fee (SEK) and which member paid it.

alter table public.tournaments
  add column fee_sek  integer,
  add column paid_by  uuid references auth.users (id) on delete set null;

-- Fee + payer are internal. The tournaments table stays public-readable so the
-- public site can join name/format onto fixtures, but anon must not see these
-- two columns. (Signed-in members/admins still can.)
revoke select (fee_sek, paid_by) on public.tournaments from anon;
