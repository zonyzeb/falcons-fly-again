-- Umpiring duties need a time so we can detect clashes with match times
-- (block within 4 hours, warn same day).
alter table public.umpiring_duties add column duty_time time;
