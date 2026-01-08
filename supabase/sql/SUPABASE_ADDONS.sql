-- 🛠️ CLUB YOUNIVERSE - ADDONS & SAFETY PATCH
-- Run this to ensure your existing database has all the latest columns without deleting data.
-- This script is "Idempotent" - it won't error if things already exist.

-- ==========================================
-- 1. UPDATE PROFILES TABLE
-- ==========================================
-- Ensure we have the fields for Artist Transition and Debut Tracking
do $$ 
begin
    -- Add is_artist if missing
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_artist') then
        alter table public.profiles add column is_artist boolean default false;
    end if;

    -- Add phone_number if missing
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'phone_number') then
        alter table public.profiles add column phone_number text;
    end if;

    -- Add last_debut_at if missing (For the 24h cooldown rule)
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'last_debut_at') then
        alter table public.profiles add column last_debut_at timestamptz;
    end if;

    -- Add stats if missing
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'stats') then
        alter table public.profiles add column stats jsonb default '{"plays": 0, "uploads": 0, "votes_cast": 0, "graveyard_count": 0}'::jsonb;
    end if;

    -- Add is_premium if missing
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_premium') then
        alter table public.profiles add column is_premium boolean default false;
    end if;

    -- Add roast_consent if missing
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'roast_consent') then
        alter table public.profiles add column roast_consent boolean default false;
    end if;
end $$;

-- ==========================================
-- 2. UPDATE SONGS TABLE
-- ==========================================
-- Ensure we have fields for "The Box" mechanics and persistence
do $$ 
begin
    -- Add stars if missing
    if not exists (select 1 from information_schema.columns where table_name = 'songs' and column_name = 'stars') then
        alter table public.songs add column stars integer default 5;
    end if;

    -- Add box_appearance_count if missing (Tracks consecutive rounds in the box)
    if not exists (select 1 from information_schema.columns where table_name = 'songs' and column_name = 'box_appearance_count') then
        alter table public.songs add column box_appearance_count integer default 0;
    end if;

    -- Add box_rounds_seen/lost
    if not exists (select 1 from information_schema.columns where table_name = 'songs' and column_name = 'box_rounds_seen') then
        alter table public.songs add column box_rounds_seen integer default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'songs' and column_name = 'box_rounds_lost') then
        alter table public.songs add column box_rounds_lost integer default 0;
    end if;

    -- Add play_count and timestamps
    if not exists (select 1 from information_schema.columns where table_name = 'songs' and column_name = 'play_count') then
        alter table public.songs add column play_count integer default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'songs' and column_name = 'last_played_at') then
        alter table public.songs add column last_played_at timestamptz;
    end if;
end $$;

-- ==========================================
-- 3. ENSURE STORAGE BUCKETS
-- ==========================================
-- Safe inserts that do nothing if the bucket exists
insert into storage.buckets (id, name, public) values ('songs', 'songs', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict do nothing;

-- ==========================================
-- 4. PERFORMANCE INDEXES
-- ==========================================
create index if not exists songs_status_idx on public.songs (status);
create index if not exists profiles_is_artist_idx on public.profiles (is_artist);

-- ==========================================
-- 5. CONFIRMATION
-- ==========================================
select 'Addons applied successfully. Database is ready for persistence.' as status;
