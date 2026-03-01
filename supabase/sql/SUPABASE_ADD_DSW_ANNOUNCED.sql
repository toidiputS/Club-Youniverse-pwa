-- Add flag to track if DJ Python has announced a Dead Song Walking
ALTER TABLE songs ADD COLUMN IF NOT EXISTS dsw_announced BOOLEAN DEFAULT FALSE;
