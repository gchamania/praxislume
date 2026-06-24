alter table public.generated_assets
drop constraint generated_assets_type_check;

alter table public.generated_assets
add constraint generated_assets_type_check check (
  asset_type in ('campaign_export', 'brand_preview', 'future_template_asset', 'ai_generated_thumbnail')
);

grant select, insert, update, delete on public.generated_assets to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-assets',
  'generated-assets',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Clinic owners can read own generated asset objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'generated-assets'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);

create policy "Clinic owners can upload own generated asset objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'generated-assets'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);

create policy "Clinic owners can update own generated asset objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'generated-assets'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
)
with check (
  bucket_id = 'generated-assets'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);

create policy "Clinic owners can delete own generated asset objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'generated-assets'
  and exists (
    select 1
    from public.clinics c
    where c.id::text = (storage.foldername(storage.objects.name))[1]
      and c.owner_user_id = auth.uid()
  )
);
