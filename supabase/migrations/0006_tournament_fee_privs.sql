-- Fix: a column-level REVOKE is ignored while the role holds table-level SELECT.
-- Drop anon's table SELECT and re-grant only the public columns, so fee_sek and
-- paid_by are hidden from the public API while name/format/etc stay readable
-- (needed for the public fixtures → tournament join).
revoke select on public.tournaments from anon;
grant select (id, name, format, season, start_date, created_at, updated_at)
  on public.tournaments to anon;
