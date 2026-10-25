-- Recipes can carry any number of tags, used to filter the recipe book
-- and the shared library.
alter table public.recipes
add column if not exists tags text[] not null default '{}';

create index if not exists recipes_tags_idx on public.recipes using gin (tags);
