-- Lets the server-side email function resolve member email addresses
-- (auth.users isn't exposed via the API). Service-role only.
create or replace function public.member_directory()
returns table (user_id uuid, player_id bigint, full_name text, email text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.player_id, p.full_name, u.email
  from public.profiles p
  join auth.users u on u.id = p.id;
$$;

revoke all on function public.member_directory() from public, anon, authenticated;
grant execute on function public.member_directory() to service_role;
