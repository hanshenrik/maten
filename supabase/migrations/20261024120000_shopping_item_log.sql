-- A log of every shopping item name a household has ever had, so the name
-- field can autosuggest names that are no longer on the list (or were
-- deleted outright). One row per distinct name (case- and
-- whitespace-insensitive); the first casing seen wins.
create table if not exists public.shopping_item_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists shopping_item_log_household_name_key
  on public.shopping_item_log (household_id, lower(btrim(name)));

-- Seed the log with everything the household has on the list today, both
-- active and completed. Names deleted before this migration are gone for
-- good — the log starts from what's left.
insert into public.shopping_item_log (household_id, name)
select household_id, name
from public.shopping_items
on conflict do nothing;

-- Keep the log growing from now on: every item that lands on a list (or is
-- renamed to something new) logs its name. The trigger covers every write
-- path, not just the shopping page.
create or replace function public.log_shopping_item_name()
returns trigger
language plpgsql
as $$
begin
  insert into public.shopping_item_log (household_id, name)
  values (new.household_id, new.name)
  on conflict (household_id, lower(btrim(name))) do nothing;
  return new;
end;
$$;

drop trigger if exists shopping_items_log_name on public.shopping_items;
create trigger shopping_items_log_name
  after insert or update of name on public.shopping_items
  for each row
  execute function public.log_shopping_item_name();

alter table public.shopping_item_log enable row level security;

-- Match the shape of the other household tables: members can see and manage
-- their household's log, nobody else's.
drop policy if exists "Members can read their household's item log"
  on public.shopping_item_log;
create policy "Members can read their household's item log"
  on public.shopping_item_log
  for select
  using (
    exists (
      select 1 from public.household_members m
      where m.household_id = shopping_item_log.household_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Members can delete from their household's item log"
  on public.shopping_item_log;
create policy "Members can delete from their household's item log"
  on public.shopping_item_log
  for delete
  using (
    exists (
      select 1 from public.household_members m
      where m.household_id = shopping_item_log.household_id
        and m.user_id = auth.uid()
    )
  );

-- The trigger writes as the signed-in member, so inserts just need the same
-- membership check.
drop policy if exists "Members can insert into their household's item log"
  on public.shopping_item_log;
create policy "Members can insert into their household's item log"
  on public.shopping_item_log
  for insert
  with check (
    exists (
      select 1 from public.household_members m
      where m.household_id = shopping_item_log.household_id
        and m.user_id = auth.uid()
    )
  );

-- Lets the shopping page keep its suggestions in sync live between members.
alter publication supabase_realtime add table public.shopping_item_log;
