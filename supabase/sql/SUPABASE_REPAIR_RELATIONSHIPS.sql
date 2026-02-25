-- 🛠️ CLUB YOUNIVERSE - DATABASE RELATIONSHIP REPAIR
-- This script ensures the Foreign Key relationships between broadcasts and songs are properly defined.
-- This resolves the "PGRST200: Could not find a relationship" error in PostgREST.

-- 1. Ensure Columns Exist (Defensive)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'broadcasts' AND column_name = 'current_song_id') THEN
        ALTER TABLE public.broadcasts ADD COLUMN current_song_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'broadcasts' AND column_name = 'next_song_id') THEN
        ALTER TABLE public.broadcasts ADD COLUMN next_song_id UUID;
    END IF;
END $$;

-- 2. Drop existing constraints if they exist to avoid conflicts
ALTER TABLE public.broadcasts DROP CONSTRAINT IF EXISTS broadcasts_current_song_id_fkey;
ALTER TABLE public.broadcasts DROP CONSTRAINT IF EXISTS broadcasts_next_song_id_fkey;

-- 3. Re-add constraints EXPLICITLY
-- We use 'REFERENCES public.songs(id)' to ensure PostgREST detects the relationship.
ALTER TABLE public.broadcasts 
    ADD CONSTRAINT broadcasts_current_song_id_fkey 
    FOREIGN KEY (current_song_id) 
    REFERENCES public.songs(id)
    ON DELETE SET NULL;

ALTER TABLE public.broadcasts 
    ADD CONSTRAINT broadcasts_next_song_id_fkey 
    FOREIGN KEY (next_song_id) 
    REFERENCES public.songs(id)
    ON DELETE SET NULL;

-- 4. Verify/Fix the initial broadcast row
INSERT INTO public.broadcasts (id, radio_state)
VALUES ('00000000-0000-0000-0000-000000000000', 'POOL')
ON CONFLICT (id) DO NOTHING;

-- 5. Force PostgREST to reload schema cache
-- Note: In Supabase, this happens automatically, but sometimes needs a nudge via a DDL change like above.
NOTIFY pgrst, 'reload schema';

SELECT 'Relationships repaired successfully!' as status;
