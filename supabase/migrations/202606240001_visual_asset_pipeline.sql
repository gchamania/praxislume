alter table public.generated_assets
drop constraint if exists generated_assets_type_check;

alter table public.generated_assets
add constraint generated_assets_type_check
check (asset_type in ('campaign_export', 'brand_preview', 'future_template_asset', 'ai_background', 'branded_post_asset'));

grant select, insert, update, delete on public.generated_assets to service_role;
grant select, insert, update, delete on storage.objects to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-assets',
  'generated-assets',
  false,
  5242880,
  array['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
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
