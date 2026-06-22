insert into public.specialties (name, slug)
values
  ('ENT', 'ent'),
  ('Dermatology', 'dermatology'),
  ('Dental', 'dental'),
  ('Pediatrics', 'pediatrics'),
  ('Gynecology and IVF', 'gynecology-ivf'),
  ('Physiotherapy', 'physiotherapy'),
  ('Orthopedics', 'orthopedics'),
  ('Neurology', 'neurology')
on conflict (slug) do update
set name = excluded.name;
