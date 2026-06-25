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

insert into storage.objects (bucket_id, name, owner, metadata)
values
  ('clinic-logos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/logo.png', '22222222-2222-2222-2222-222222222222', '{}'::jsonb)
on conflict (bucket_id, name) do nothing;

set local role service_role;

insert into public.ai_generation_logs (
  clinic_id,
  user_id,
  generation_type,
  provider,
  model,
  request_correlation_id,
  status
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'rls_service_role_check',
  'fake',
  'fake-draft-v1',
  'rls-service-role-check',
  'succeeded'
);

insert into public.usage_credits (
  clinic_id,
  usage_type,
  period_start,
  period_end,
  used_count,
  limit_count
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'rls_service_role_check',
  current_date,
  current_date,
  1,
  50
);

insert into public.content_compliance_reviews (
  clinic_id,
  reviewed_content_version_hash,
  status,
  issue_codes,
  notes,
  reviewer_type
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'sha256-rls-service-role-check',
  'passed',
  '{}'::text[],
  '{}'::text[],
  'rules'
);

insert into public.generated_assets (
  id,
  clinic_id,
  content_item_id,
  asset_type,
  storage_path,
  template_version,
  metadata
)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  null,
  'branded_post_asset',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/assets/final.svg',
  'branded_post_asset:v1',
  '{"rls": true}'::jsonb
)
on conflict (id) do nothing;

insert into storage.objects (bucket_id, name, owner, metadata)
values
  ('generated-assets', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/assets/final.svg', '22222222-2222-2222-2222-222222222222', '{}'::jsonb)
on conflict (bucket_id, name) do nothing;

reset role;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare
  visible_clinics integer;
  visible_b_campaigns integer;
  changed_b_campaigns integer;
  visible_b_logos integer;
  changed_b_logos integer;
  visible_b_generated_assets integer;
  visible_b_generated_asset_objects integer;
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

  update public.content_campaigns
  set title = 'Compromised Clinic B Campaign'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  get diagnostics changed_b_campaigns = row_count;
  if changed_b_campaigns <> 0 then
    raise exception 'Owner A can update Clinic B campaigns';
  end if;

  insert into storage.objects (bucket_id, name, owner, metadata)
  values (
    'clinic-logos',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/logo.png',
    auth.uid(),
    '{}'::jsonb
  );

  select count(*) into visible_b_logos
  from storage.objects
  where bucket_id = 'clinic-logos'
    and name = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/logo.png';

  if visible_b_logos <> 0 then
    raise exception 'Owner A can see Clinic B logo objects';
  end if;

  update storage.objects
  set metadata = '{"compromised": true}'::jsonb
  where bucket_id = 'clinic-logos'
    and name = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/logo.png';

  get diagnostics changed_b_logos = row_count;
  if changed_b_logos <> 0 then
    raise exception 'Owner A can update Clinic B logo objects';
  end if;

  select count(*) into visible_b_generated_assets
  from public.generated_assets
  where clinic_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  if visible_b_generated_assets <> 0 then
    raise exception 'Owner A can see Clinic B generated asset rows';
  end if;

  select count(*) into visible_b_generated_asset_objects
  from storage.objects
  where bucket_id = 'generated-assets'
    and name = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/assets/final.svg';

  if visible_b_generated_asset_objects <> 0 then
    raise exception 'Owner A can see Clinic B generated asset objects';
  end if;
end $$;

rollback;
