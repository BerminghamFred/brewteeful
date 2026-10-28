-- Allow homepage layout experiments (overrides.home_layout).
alter table public.experiments drop constraint if exists experiments_variable_check;
alter table public.experiments add constraint experiments_variable_check
  check (variable in ('price', 'headline', 'cta', 'hero_image', 'offer', 'free_shipping', 'min_group_size', 'homepage'));
