-- Adds the is_canvas boolean to the songs table for the Dance Floor Canvas Video feature.

ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS is_canvas BOOLEAN DEFAULT false;
