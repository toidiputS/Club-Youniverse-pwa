-- Add leader election columns to broadcasts table
ALTER TABLE public.broadcasts 
ADD COLUMN IF NOT EXISTS leader_id UUID,
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;

-- Allow any authenticated user to claim leadership if:
-- 1. Calculated logic matches (done in client, enforced here if possible, but hard with RLS)
-- 2. We just rely on the existing "Authenticated users can update" policy which covers this.

-- We might want a function to atomic claim, but simple UPDATE is usually fine for low-concurrency radio.
