-- Run this in Supabase SQL Editor to fix the 2 songs stuck in "now_playing" status
UPDATE songs 
SET status = 'pool'
WHERE status = 'now_playing';
