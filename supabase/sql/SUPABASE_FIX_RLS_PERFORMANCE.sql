-- 🛠️ CLUB YOUNIVERSE - RLS PERFORMANCE FIX
-- Consolidate multiple permissive UPDATE policies on public.songs into a single policy.
-- This resolves the "multiple_permissive_policies" warning and improves query performance.

-- 1. Clean up all known variations of the update policy
DROP POLICY IF EXISTS "Users can update their own songs." ON public.songs;
DROP POLICY IF EXISTS "Admins can update any song." ON public.songs;
DROP POLICY IF EXISTS "Admins have full update access" ON public.songs;
DROP POLICY IF EXISTS "songs_master_update_policy" ON public.songs;
DROP POLICY IF EXISTS "songs_update_policy" ON public.songs;

-- 2. Create a single consolidated policy
-- This allows:
-- - The uploader to update their song
-- - Admins to update any song (needed for radio automation/DJ Booth)
CREATE POLICY "songs_update_policy"
ON public.songs FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = uploader_id 
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = (SELECT auth.uid()) AND is_admin = true)
);

-- Verification
-- SELECT * FROM pg_policies WHERE tablename = 'songs' AND cmd = 'UPDATE';
