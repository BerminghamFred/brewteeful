-- Seed data for BrewTeeFul (run after migrations, as postgres role)

-- Site settings
insert into public.site_settings (key, value) values
  ('floating_offer', '{"enabled": true, "text": "10% OFF TODAY — use code KICKOFF10"}'),
  ('exit_popup', '{"enabled": true, "discountPercent": 10, "title": "Wait — take 10% off", "subtitle": "Street culture deserves a second look."}'),
  ('countdown', '{"enabled": true, "endIso": "2026-04-30T23:59:59.000Z", "label": "Next drop ends"}'),
  ('live_notifications', '{"enabled": true, "cities": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"]}')
on conflict (key) do update set value = excluded.value;

-- Products (hero + gallery use Unsplash)
insert into public.products (slug, title, description, collection_slug, price_pence, compare_at_price_pence, stock_remaining, status, hero_image_url)
values
  (
    'terrace-king-tee',
    'Terrace King',
    'Heavyweight cotton. Graffiti-inspired crest. Built for cold mornings and loud away ends.',
    'all',
    4500,
    5500,
    12,
    'published',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80'
  ),
  (
    'north-london-nights',
    'North London Nights',
    'Minimal line work, maximum attitude. Premium print on bone white.',
    'drops',
    4200,
    5000,
    28,
    'published',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80'
  ),
  (
    'kickoff-chrome',
    'Kickoff Chrome',
    'Metallic ink detail. Fits boxy — size up for relaxed.',
    'all',
    4800,
    null,
    40,
    'published',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80'
  ),
  (
    'ultras-script',
    'Ultras Script',
    'Brush script inspired by terrace banners. Soft-hand feel.',
    'all',
    3900,
    4500,
    8,
    'published',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80'
  ),
  (
    'pitch-black-club',
    'Pitch Black Club',
    'All black everything. Subtle crest hit on chest.',
    'drops',
    4400,
    5200,
    22,
    'published',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=80'
  ),
  (
    'extra-time-vintage',
    'Extra Time Vintage',
    'Washed vintage black. Feels like a tee you stole from the best era.',
    'all',
    4100,
    null,
    35,
    'published',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=1200&q=80'
  );

-- Images per product
insert into public.product_images (product_id, url, sort_order, alt)
select p.id, p.hero_image_url, 0, p.title from public.products p where p.slug = 'terrace-king-tee';

insert into public.product_images (product_id, url, sort_order, alt)
select id, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80', 1, 'Flat lay'
from public.products where slug = 'terrace-king-tee';

insert into public.product_images (product_id, url, sort_order, alt)
select id, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80', 2, 'Detail'
from public.products where slug = 'terrace-king-tee';

insert into public.product_images (product_id, url, sort_order, alt)
select p.id, p.hero_image_url, 0, p.title from public.products p where p.slug = 'north-london-nights';

insert into public.product_images (product_id, url, sort_order, alt)
select id, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80', 1, 'Flat lay'
from public.products where slug = 'north-london-nights';

-- Repeat minimal gallery for other products
insert into public.product_images (product_id, url, sort_order, alt)
select p.id, p.hero_image_url, 0, p.title from public.products p
where p.slug in ('kickoff-chrome', 'ultras-script', 'pitch-black-club', 'extra-time-vintage');

-- Variants S/M/L/XL for each
insert into public.product_variants (product_id, size, sku, stock)
select id, s.size, 'BTF-' || upper(substring(slug, 1, 3)) || '-' || s.size, 25
from public.products p
cross join (values ('S'), ('M'), ('L'), ('XL')) as s(size)
where p.status = 'published'
on conflict (product_id, size) do nothing;

-- Reviews
insert into public.reviews (product_id, author_name, city, rating, body, approved, created_at)
select p.id, v.name, v.city, v.rating, v.body, true, v.created_at::timestamptz
from public.products p
cross join (values
  ('James', 'Manchester', 5, 'Quality is mad. Fits true, print has depth.', '2026-03-01'),
  ('Aaliyah', 'London', 5, 'Fast delivery — wore it to five-a-side already.', '2026-03-05'),
  ('Owen', 'Leeds', 4, 'Boxy fit as promised. Would size up again.', '2026-03-08'),
  ('Priya', 'Birmingham', 5, 'Gets compliments every time. Cotton feels premium.', '2026-03-10'),
  ('Callum', 'Glasgow', 5, 'Terrace energy without the cringe. Big up.', '2026-03-12')
) as v(name, city, rating, body, created_at)
where p.slug = 'terrace-king-tee';

insert into public.reviews (product_id, author_name, city, rating, body, approved, created_at)
select p.id, v.name, v.city, v.rating, v.body, true, v.created_at::timestamptz
from public.products p
cross join (values
  ('Nina', 'London', 5, 'Minimal and clean. Exactly what I wanted.', '2026-03-02'),
  ('Tom', 'Bristol', 4, 'Nice tee — shipping was quick.', '2026-03-09')
) as v(name, city, rating, body, created_at)
where p.slug = 'north-london-nights';

insert into public.reviews (product_id, author_name, city, rating, body, approved, created_at)
select p.id, 'Rafa', 'Liverpool', 5, 'Chrome print hits different in person.', true, '2026-03-11'::timestamptz
from public.products p where p.slug = 'kickoff-chrome';

-- Discount code
insert into public.discount_codes (code, percent_off, active)
values ('KICKOFF10', 10, true)
on conflict (code) do nothing;

-- Experiment: homepage headline
insert into public.experiments (slug, name, status, experiment_type, variants)
values (
  'home-hero-headline',
  'Homepage hero headline',
  'running',
  'headline',
  '{
    "A": { "headline": "Football Culture. Reimagined.", "sub": "Premium streetwear tees — UK shipped in days." },
    "B": { "headline": "Born in the terraces.", "sub": "Street-ready fits. Limited runs." }
  }'::jsonb
)
on conflict (slug) do nothing;
