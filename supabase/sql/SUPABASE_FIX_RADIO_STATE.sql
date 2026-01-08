-- 🧹 CLUB YOUNIVERSE - RADIO STATE CLEANUP
-- Logic: Enforce the "Highlander Rule" (There can be only one 'now_playing') and limit The Box to 3.

DO $$
DECLARE
    active_song_id uuid;
    box_song_ids uuid[];
BEGIN
    -- 1. Identify the ONE true 'now_playing' song (most recent)
    SELECT id INTO active_song_id
    FROM public.songs
    WHERE status = 'now_playing'
    ORDER BY last_played_at DESC NULLS LAST, created_at DESC
    LIMIT 1;

    -- If no song is playing, pick one from the pool to start? Or just leave it empty.
    -- For now, if we found one, we fix the others.
    IF active_song_id IS NOT NULL THEN
        RAISE NOTICE 'Keeping active song: %', active_song_id;
        
        -- Reset ALL other 'now_playing' songs to 'pool'
        UPDATE public.songs
        SET status = 'pool', last_played_at = NOW() -- optional: update timestamp to push it back in queue?
        WHERE status = 'now_playing' AND id != active_song_id;
    END IF;

    -- 2. Identify the top 3 'in_box' songs (most recent upload or random? Let's use random to be fair, or recent)
    -- Actually, let's keep the ones that have been in the box the longest (survivors) or just random 3.
    SELECT ARRAY_AGG(id) INTO box_song_ids
    FROM (
        SELECT id FROM public.songs
        WHERE status = 'in_box'
        LIMIT 3
    ) AS sub;

    IF box_song_ids IS NOT NULL THEN
        RAISE NOTICE 'Keeping box songs: %', box_song_ids;

        -- Reset ALL other 'in_box' songs to 'pool'
        UPDATE public.songs
        SET status = 'pool'
        WHERE status = 'in_box' AND NOT (id = ANY(box_song_ids));
    ELSE
        -- If no box songs, that's fine, let the app refill it.
        RAISE NOTICE 'No box songs found, nothing to clean up there.';
    END IF;

    -- 3. Safety: Ensure no songs are stuck in weird states (optional)
    
END $$;
