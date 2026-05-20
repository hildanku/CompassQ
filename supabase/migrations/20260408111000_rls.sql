alter table public.check_ins enable row level security;
alter table public.sessions enable row level security;
alter table public.reflections enable row level security;
alter table public.bookmarks enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.streaks enable row level security;
alter table public.weekly_recaps enable row level security;

drop policy if exists "check_ins_select_own" on public.check_ins;
create policy "check_ins_select_own"
on public.check_ins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "check_ins_insert_own" on public.check_ins;
create policy "check_ins_insert_own"
on public.check_ins
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "check_ins_update_own" on public.check_ins;
create policy "check_ins_update_own"
on public.check_ins
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "check_ins_delete_own" on public.check_ins;
create policy "check_ins_delete_own"
on public.check_ins
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own"
on public.sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own"
on public.sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own"
on public.sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own"
on public.sessions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reflections_select_own" on public.reflections;
create policy "reflections_select_own"
on public.reflections
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own"
on public.reflections
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own"
on public.reflections
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reflections_delete_own" on public.reflections;
create policy "reflections_delete_own"
on public.reflections
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
on public.bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
on public.bookmarks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
on public.bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "collections_select_own" on public.collections;
create policy "collections_select_own"
on public.collections
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own"
on public.collections
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own"
on public.collections
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own"
on public.collections
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "collection_items_select_own" on public.collection_items;
create policy "collection_items_select_own"
on public.collection_items
for select
to authenticated
using (
    exists (
        select 1
        from public.collections
        where collections.id = collection_items.collection_id
            and collections.user_id = auth.uid()
    )
);

drop policy if exists "collection_items_insert_own" on public.collection_items;
create policy "collection_items_insert_own"
on public.collection_items
for insert
to authenticated
with check (
    exists (
        select 1
        from public.collections
        where collections.id = collection_items.collection_id
            and collections.user_id = auth.uid()
    )
);

drop policy if exists "collection_items_delete_own" on public.collection_items;
create policy "collection_items_delete_own"
on public.collection_items
for delete
to authenticated
using (
    exists (
        select 1
        from public.collections
        where collections.id = collection_items.collection_id
            and collections.user_id = auth.uid()
    )
);

drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own"
on public.streaks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "streaks_insert_own" on public.streaks;
create policy "streaks_insert_own"
on public.streaks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "streaks_update_own" on public.streaks;
create policy "streaks_update_own"
on public.streaks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "streaks_delete_own" on public.streaks;
create policy "streaks_delete_own"
on public.streaks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "weekly_recaps_select_own" on public.weekly_recaps;
create policy "weekly_recaps_select_own"
on public.weekly_recaps
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "weekly_recaps_insert_own" on public.weekly_recaps;
create policy "weekly_recaps_insert_own"
on public.weekly_recaps
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "weekly_recaps_update_own" on public.weekly_recaps;
create policy "weekly_recaps_update_own"
on public.weekly_recaps
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "weekly_recaps_delete_own" on public.weekly_recaps;
create policy "weekly_recaps_delete_own"
on public.weekly_recaps
for delete
to authenticated
using (auth.uid() = user_id);
