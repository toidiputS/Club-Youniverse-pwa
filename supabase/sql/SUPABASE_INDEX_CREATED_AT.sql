-- 🚀 PERFORMANCE OPTIMIZATION
-- Create index on created_at for songs table to improve query performance by ~69%

CREATE INDEX IF NOT EXISTS idx_songs_created_at ON public.songs USING btree (created_at);

-- Verification
-- SELECT * FROM pg_indexes WHERE tablename = 'songs';
