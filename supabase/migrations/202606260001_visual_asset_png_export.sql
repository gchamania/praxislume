alter table public.generated_assets
drop constraint if exists generated_assets_type_check;

alter table public.generated_assets
add constraint generated_assets_type_check
check (
  asset_type in (
    'campaign_export',
    'brand_preview',
    'future_template_asset',
    'ai_background',
    'branded_post_asset',
    'branded_post_png'
  )
);
