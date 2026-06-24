alter table public.content_items
add column if not exists carousel_slides jsonb not null default '[]'::jsonb;

alter table public.content_items
add constraint content_items_carousel_slides_array_check
check (jsonb_typeof(carousel_slides) = 'array' and jsonb_array_length(carousel_slides) <= 7);
