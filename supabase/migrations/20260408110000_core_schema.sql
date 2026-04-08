create type public.check_in_category as enum (
    'anxiety',
    'gratitude',
    'patience',
    'guidance',
    'hope',
    'discipline',
    'feeling_distant',
    'need_comfort'
);

create table if not exists public.quran_references (
    id uuid primary key default gen_random_uuid(),
    source text not null default 'qf',
    surah_number integer not null check (surah_number > 0),
    ayah_number integer not null check (ayah_number > 0),
    ayah_key text not null unique,
    arabic_text text,
    translation_text text,
    tafsir_snippet text,
    audio_url text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (source, surah_number, ayah_number)
);

drop trigger if exists quran_references_set_updated_at on public.quran_references;
create trigger quran_references_set_updated_at
before update on public.quran_references
for each row
execute function public.set_updated_at();

create table if not exists public.recommendation_catalog (
    id uuid primary key default gen_random_uuid(),
    category public.check_in_category not null,
    ayah_key text not null references public.quran_references (ayah_key) on delete cascade,
    priority integer not null default 100,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    unique (category, ayah_key)
);

create table if not exists public.check_ins (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    category public.check_in_category not null,
    notes text,
    created_at timestamptz not null default timezone('utc', now()),
    local_date date not null
);

create table if not exists public.sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    check_in_id uuid not null references public.check_ins (id) on delete cascade,
    ayah_key text not null references public.quran_references (ayah_key),
    completed boolean not null default false,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reflections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    session_id uuid not null references public.sessions (id) on delete cascade,
    ayah_key text not null references public.quran_references (ayah_key),
    content varchar(280) not null check (char_length(content) between 1 and 280),
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookmarks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    ayah_key text not null references public.quran_references (ayah_key),
    created_at timestamptz not null default timezone('utc', now()),
    unique (user_id, ayah_key)
);

create table if not exists public.collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    name text not null check (char_length(trim(name)) between 1 and 120),
    created_at timestamptz not null default timezone('utc', now()),
    unique (user_id, name)
);

create table if not exists public.collection_items (
    id uuid primary key default gen_random_uuid(),
    collection_id uuid not null references public.collections (id) on delete cascade,
    ayah_key text not null references public.quran_references (ayah_key),
    created_at timestamptz not null default timezone('utc', now()),
    unique (collection_id, ayah_key)
);

create table if not exists public.streaks (
    user_id uuid primary key references public.profiles (id) on delete cascade,
    current_streak_days integer not null default 0 check (current_streak_days >= 0),
    longest_streak_days integer not null default 0 check (longest_streak_days >= 0),
    last_active_local_date date,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists streaks_set_updated_at on public.streaks;
create trigger streaks_set_updated_at
before update on public.streaks
for each row
execute function public.set_updated_at();

create table if not exists public.weekly_recaps (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    week_start_date date not null,
    return_days integer not null default 0 check (return_days >= 0),
    top_categories jsonb not null default '[]'::jsonb,
    top_ayah_keys jsonb not null default '[]'::jsonb,
    reflection_count integer not null default 0 check (reflection_count >= 0),
    created_at timestamptz not null default timezone('utc', now()),
    unique (user_id, week_start_date)
);

create index if not exists check_ins_user_created_at_idx
    on public.check_ins (user_id, created_at desc);

create index if not exists check_ins_user_local_date_idx
    on public.check_ins (user_id, local_date desc);

create index if not exists recommendation_catalog_lookup_idx
    on public.recommendation_catalog (category, is_active, priority);

create index if not exists sessions_user_created_at_idx
    on public.sessions (user_id, created_at desc);

create index if not exists reflections_user_created_at_idx
    on public.reflections (user_id, created_at desc);

create index if not exists bookmarks_user_created_at_idx
    on public.bookmarks (user_id, created_at desc);

create index if not exists collections_user_created_at_idx
    on public.collections (user_id, created_at desc);

create index if not exists collection_items_collection_created_at_idx
    on public.collection_items (collection_id, created_at desc);

create index if not exists weekly_recaps_user_week_start_idx
    on public.weekly_recaps (user_id, week_start_date desc);
