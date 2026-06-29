-- Match result (set by admin after the game) for W/L tags on the schedule.
alter table public.fixtures
  add column result      text check (result in ('won', 'lost', 'tied', 'no_result')),
  add column result_note text;
