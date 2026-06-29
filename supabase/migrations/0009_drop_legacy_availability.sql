-- The single-status `availability` table is superseded by per-fixture
-- `match_availability`; nothing references it anymore.
drop table if exists public.availability;
