-- 🎵 CLUB YOUNIVERSE - LAUNCH UPDATE SCRIPT
-- Run this to update the schema for the new persistent radio flow.

-- 1. Update Songs Status Check
ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_status_check;
ALTER TABLE public.songs ADD CONSTRAINT songs_status_check 
  CHECK (status IN ('pool', 'in_box', 'next_play', 'now_playing', 'graveyard', 'debut'));

-- 2. Update Broadcasts Table for NextPlay support and Leadership
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS next_song_id UUID REFERENCES public.songs(id);
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES auth.users(id);
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS dj_voice_id TEXT;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS site_command JSONB; 

-- 3. Ensure the initial broadcast row exists and is clean
INSERT INTO public.broadcasts (id, radio_state)
VALUES ('00000000-0000-0000-0000-000000000000', 'POOL')
ON CONFLICT (id) DO UPDATE 
SET radio_state = 'POOL', 
    current_song_id = NULL, 
    next_song_id = NULL;
