-- Run after local migrations in a Supabase database.
-- This verifies that an authenticated owner of Clinic A cannot read Clinic B.

begin;

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'owner-a@example.com', 'test', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'owner-b@example.com', 'test', now(), now(), now())
on conflict (id) do nothing;

insert into public.clinics (id, owner_user_id, name, locality, city)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Clinic A', 'Aundh', 'Pune'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Clinic B', 'Baner', 'Pune')
on conflict (id) do nothing;

insert into public.content_campaigns (id, clinic_id, title, goal, duration_days, start_date)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Clinic A Campaign', 'appointments', 7, current_date),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Clinic B Campaign', 'appointments', 7, current_date)
on conflict (id) do nothing;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare
  visible_clinics integer;
  visible_b_campaigns integer;
begin
  select count(*) into visible_clinics from public.clinics;
  if visible_clinics <> 1 then
    raise exception 'Expected owner A to see exactly 1 clinic, saw %', visible_clinics;
  end if;

  select count(*) into visible_b_campaigns
  from public.content_campaigns
  where clinic_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  if visible_b_campaigns <> 0 then
    raise exception 'Owner A can see Clinic B campaigns';
  end if;
end $$;

rollback;
