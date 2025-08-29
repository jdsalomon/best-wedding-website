-- Add preferred_language column to guests table
-- Each guest has their own language preference (French, English, Spanish, etc.)
-- Frontend UI will be French if language is "French", otherwise English
-- AI will respond in the actual language specified by the guest

ALTER TABLE guests ADD COLUMN preferred_language TEXT DEFAULT 'French';

-- Create index for faster language-based queries
CREATE INDEX IF NOT EXISTS idx_guests_preferred_language ON guests(preferred_language);

-- Update any existing guests to explicitly have French as their language
UPDATE guests SET preferred_language = 'French' WHERE preferred_language IS NULL;