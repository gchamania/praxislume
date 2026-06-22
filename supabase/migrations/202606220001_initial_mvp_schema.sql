create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  locality text not null,
  city text not null,
  phone text,
  whatsapp text,
  appointment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinics_owner_name_unique unique (owner_user_id, name)
);

create table public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doctor_name text not null,
  qualifications text not null,
  specialty_id uuid references public.specialties(id),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_profiles_clinic_user_unique unique (clinic_id, user_id)
);

create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  version integer not null default 1,
  logo_path text,
  clinic_display_name text not null,
  doctor_display_name text not null,
  qualifications text not null,
  locations jsonb not null default '[]'::jsonb,
  phone text,
  whatsapp text,
  appointment_url text,
  primary_color text not null default '#0D4D57',
  secondary_color text not null default '#A7E1D6',
  accent_color text not null default '#F2C15E',
  typography_style text not null default 'clean',
  tone text not null default 'warm',
  default_cta text not null default 'Book a consultation',
  disclaimer_text text not null default 'This content is for general education only. Please consult a qualified doctor for personal medical advice.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_kits_clinic_unique unique (clinic_id),
  constraint brand_kits_tone_check check (tone in ('warm', 'authoritative', 'simple', 'premium', 'local_language_friendly')),
  constraint brand_kits_color_check check (
    primary_color ~ '^#[0-9A-Fa-f]{6}$'
    and secondary_color ~ '^#[0-9A-Fa-f]{6}$'
    and accent_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

create table public.clinic_services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_services_unique unique (clinic_id, name)
);

create table public.content_campaigns (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title text not null,
  goal text not null,
  duration_days integer not null,
  start_date date not null,
  status text not null default 'draft',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_campaigns_duration_check check (duration_days in (7, 15, 30)),
  constraint content_campaigns_status_check check (status in ('draft', 'active', 'archived'))
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  campaign_id uuid not null references public.content_campaigns(id) on delete cascade,
  scheduled_date date not null,
  day_offset integer not null default 0,
  title text not null,
  category text not null,
  status text not null default 'idea',
  objective text,
  key_points text[] not null default '{}',
  caption text,
  reel_hook text,
  reel_script text,
  short_cta text,
  disclaimer_text text,
  notes text,
  user_edited_at timestamptz,
  approved_at timestamptz,
  compliance_review_status text,
  content_version_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_category_check check (category in ('awareness', 'myth_buster', 'symptoms', 'procedure_explainer', 'seasonal_health_tip', 'clinic_service', 'faq')),
  constraint content_items_status_check check (status in ('idea', 'drafted', 'designed', 'posted')),
  constraint content_items_day_offset_check check (day_offset >= 0 and day_offset < 30)
);

create table public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete set null,
  asset_type text not null,
  storage_path text,
  template_version text,
  brand_kit_version integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint generated_assets_type_check check (asset_type in ('campaign_export', 'brand_preview', 'future_template_asset'))
);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  generation_type text not null,
  provider text not null,
  model text not null,
  request_correlation_id text not null,
  prompt_version text,
  prompt_hash text,
  input_summary jsonb not null default '{}'::jsonb,
  output_reference_id uuid,
  structured_output jsonb,
  prompt_tokens integer,
  completion_tokens integer,
  estimated_cost numeric(12, 6),
  latency_ms integer not null default 0,
  status text not null,
  error_category text,
  created_at timestamptz not null default now(),
  constraint ai_generation_logs_status_check check (status in ('succeeded', 'failed', 'blocked'))
);

create table public.usage_credits (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  usage_type text not null,
  period_start date not null,
  period_end date not null,
  used_count integer not null default 0,
  limit_count integer not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usage_credits_unique unique (clinic_id, usage_type, period_start),
  constraint usage_credits_count_check check (used_count >= 0 and limit_count >= 0)
);

create table public.content_compliance_reviews (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  reviewed_content_version_hash text not null,
  status text not null,
  issue_codes text[] not null default '{}',
  notes text[] not null default '{}',
  safer_rewrite text,
  reviewer_type text not null default 'rules',
  reviewer_model text,
  created_at timestamptz not null default now(),
  constraint content_compliance_reviews_status_check check (status in ('passed', 'flagged', 'blocked')),
  constraint content_compliance_reviews_reviewer_check check (reviewer_type in ('rules', 'model', 'human'))
);

create index clinics_owner_user_id_idx on public.clinics(owner_user_id);
create index doctor_profiles_clinic_id_idx on public.doctor_profiles(clinic_id);
create index brand_kits_clinic_id_idx on public.brand_kits(clinic_id);
create index clinic_services_clinic_id_idx on public.clinic_services(clinic_id);
create index content_campaigns_clinic_id_idx on public.content_campaigns(clinic_id);
create index content_campaigns_start_date_idx on public.content_campaigns(start_date);
create index content_items_clinic_id_idx on public.content_items(clinic_id);
create index content_items_campaign_date_idx on public.content_items(campaign_id, scheduled_date);
create index content_items_status_idx on public.content_items(status);
create index ai_generation_logs_clinic_type_idx on public.ai_generation_logs(clinic_id, generation_type, created_at desc);
create index usage_credits_clinic_period_idx on public.usage_credits(clinic_id, period_start, period_end);
create index content_compliance_reviews_item_idx on public.content_compliance_reviews(content_item_id, created_at desc);

create trigger set_user_profiles_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();
create trigger set_clinics_updated_at before update on public.clinics for each row execute function public.set_updated_at();
create trigger set_doctor_profiles_updated_at before update on public.doctor_profiles for each row execute function public.set_updated_at();
create trigger set_brand_kits_updated_at before update on public.brand_kits for each row execute function public.set_updated_at();
create trigger set_clinic_services_updated_at before update on public.clinic_services for each row execute function public.set_updated_at();
create trigger set_content_campaigns_updated_at before update on public.content_campaigns for each row execute function public.set_updated_at();
create trigger set_content_items_updated_at before update on public.content_items for each row execute function public.set_updated_at();
create trigger set_usage_credits_updated_at before update on public.usage_credits for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.clinics enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.brand_kits enable row level security;
alter table public.clinic_services enable row level security;
alter table public.content_campaigns enable row level security;
alter table public.content_items enable row level security;
alter table public.generated_assets enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.usage_credits enable row level security;
alter table public.content_compliance_reviews enable row level security;

grant usage on schema public to authenticated;

grant select on public.specialties to authenticated;

grant select, insert, update, delete on
  public.user_profiles,
  public.clinics,
  public.doctor_profiles,
  public.brand_kits,
  public.clinic_services,
  public.content_campaigns,
  public.content_items,
  public.generated_assets,
  public.usage_credits,
  public.content_compliance_reviews
to authenticated;

grant select on public.ai_generation_logs to authenticated;

create policy "Users can manage own profile"
on public.user_profiles for all
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Authenticated users can read specialties"
on public.specialties for select
to authenticated
using (true);

create policy "Clinic owners can manage own clinics"
on public.clinics for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "Clinic owners can manage doctor profiles"
on public.doctor_profiles for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = doctor_profiles.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = doctor_profiles.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can manage brand kits"
on public.brand_kits for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = brand_kits.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = brand_kits.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can manage services"
on public.clinic_services for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = clinic_services.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = clinic_services.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can manage campaigns"
on public.content_campaigns for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = content_campaigns.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = content_campaigns.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can manage content items"
on public.content_items for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = content_items.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = content_items.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can manage generated assets"
on public.generated_assets for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = generated_assets.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = generated_assets.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can read generation logs"
on public.ai_generation_logs for select
to authenticated
using (exists (select 1 from public.clinics c where c.id = ai_generation_logs.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can manage usage credits"
on public.usage_credits for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = usage_credits.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = usage_credits.clinic_id and c.owner_user_id = auth.uid()));

create policy "Clinic owners can manage compliance reviews"
on public.content_compliance_reviews for all
to authenticated
using (exists (select 1 from public.clinics c where c.id = content_compliance_reviews.clinic_id and c.owner_user_id = auth.uid()))
with check (exists (select 1 from public.clinics c where c.id = content_compliance_reviews.clinic_id and c.owner_user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinic-logos',
  'clinic-logos',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select on storage.buckets to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;

create policy "Clinic owners can read own logo objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'clinic-logos'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);

create policy "Clinic owners can upload own logo objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'clinic-logos'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);

create policy "Clinic owners can update own logo objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'clinic-logos'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
)
with check (
  bucket_id = 'clinic-logos'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);

create policy "Clinic owners can delete own logo objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'clinic-logos'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);
