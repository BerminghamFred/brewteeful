-- Seed data for the stag-set MVP (run after migrations).
-- Placeholder designs mirror lib/catalogue-fallback.ts. Replace names, copy and images
-- with the real designs in /admin/products. No reviews are seeded — reviews must be real.

insert into public.collections (slug, name, description, sort_order)
values ('football', 'The Football Collection', 'Illustrated, terrace-culture designs that look unreal as a lineup.', 0)
on conflict (slug) do nothing;

insert into public.products (slug, name, collection_id, tagline, description, price_pence, cost_pence, status, sort_order, accent_color)
select d.slug, d.name, c.id, d.tagline,
       d.tagline || ' Original illustrated artwork from the Football Collection, printed on a heavyweight relaxed-fit tee. Designed to sit alongside every other shirt in the set.',
       2000, 1050, 'active', d.sort_order, d.color
from public.collections c
cross join (values
  ('the-stag', 'The Stag', 'Reserved for the man of the hour.', '#b3862a', 0),
  ('sunday-league-legend', 'Sunday League Legend', 'Hungover, unfit, undroppable.', '#1f6f43', 1),
  ('away-day', 'Away Day', 'Train beers from 9am. Standard.', '#d4481c', 2),
  ('golden-boot', 'Golden Boot', 'Scores more at the bar than on the pitch.', '#d9a400', 3),
  ('the-gaffer', 'The Gaffer', 'Picks the team. Picks the bar. Picks the fights.', '#1d3b8b', 4),
  ('half-time-oranges', 'Half-Time Oranges', 'Peaked at under-11s.', '#ef7d1a', 5),
  ('last-orders', 'Last Orders', 'Never, ever the first to leave.', '#7a1f3d', 6),
  ('under-review', 'Under Review', 'Every decision questioned. Every round checked.', '#5b3a98', 7)
) as d(slug, name, tagline, color, sort_order)
where c.slug = 'football'
on conflict (slug) do nothing;

insert into public.product_variants (product_id, size, sku)
select p.id, s.size, upper(left(p.slug, 12)) || '-' || s.size
from public.products p
cross join (values ('S'), ('M'), ('L'), ('XL'), ('2XL'), ('3XL')) as s(size)
on conflict do nothing;

insert into public.faqs (question, answer, sort_order) values
  ('How does the group set work?', 'Tell us how many are going, give each person a design and a size, and pay once. Everyone can have a different design (that''s the point) — or double up if two of you fight over the same one.', 0),
  ('What''s the minimum order?', '5 shirts. Most groups order 6–10. Over 30? Get in touch and we''ll sort a bulk price.', 1),
  ('How much does it cost?', '£20 a shirt, with free tracked UK delivery on sets. You''ll see the exact total before you pay — no surprises at checkout.', 2),
  ('How long does delivery take?', 'Every set is printed to order: 3–5 working days to print, then 1–3 working days tracked delivery. Enter your stag date in the builder and we''ll tell you straight away if we can make it.', 3),
  ('I don''t know everyone''s size yet.', 'Build the set anyway and hit ''Share lineup'' — send the link to the group chat so everyone can check their design and size, then come back and pay. Most lads take L if you''re really stuck.', 4),
  ('Can I put names on the shirts?', 'Add a nickname to each person in the builder so we know who''s who in the parcel. Printed names aren''t available yet.', 5),
  ('What if something''s wrong with a shirt?', 'If anything arrives misprinted, damaged or wrong we''ll reprint and resend it free. Just email us a photo within 14 days.', 6),
  ('Can I return shirts?', 'Yes — unworn, unwashed shirts can be returned within 14 days of delivery for a refund. Full details on our delivery & returns page.', 7),
  ('How do I pay?', 'Apple Pay, Google Pay or any major card, through Stripe''s secure checkout. We never see or store your card details.', 8);

-- Example offers, all inactive. Switch on in /admin/offers.
insert into public.offers (name, kind, config, active, priority) values
  ('Free delivery banner', 'banner', '{"text": "Free tracked UK delivery on every stag set", "link": "/build"}', false, 10),
  ('8+ shirts: £10 off', 'quantity_discount', '{"min_items": 8, "amount_off_pence": 1000, "label": "£10 off 8+ shirts"}', false, 5),
  ('10+ shirts: £20 off', 'quantity_discount', '{"min_items": 10, "amount_off_pence": 2000, "label": "£20 off 10+ shirts"}', false, 5);
