-- Refactor guests table for direct CSV import with +1 relationships
-- Adds source tracking and +1 linking capabilities

-- Add source column to track CSV source for each guest
ALTER TABLE guests ADD COLUMN source VARCHAR(255);

-- Add plus_one_of column to track +1 relationships
ALTER TABLE guests ADD COLUMN plus_one_of UUID REFERENCES guests(id) ON DELETE SET NULL;

-- Create unique constraint to prevent duplicates (same name + source)
ALTER TABLE guests ADD CONSTRAINT unique_guest_per_source 
UNIQUE (first_name, last_name, source);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_guests_source ON guests(source);
CREATE INDEX IF NOT EXISTS idx_guests_plus_one_of ON guests(plus_one_of);

-- Create index for grouping queries (lastname + source combination)
CREATE INDEX IF NOT EXISTS idx_guests_lastname_source ON guests(last_name, source);

-- Update existing guests to have 'legacy' as their source
UPDATE guests SET source = 'legacy' WHERE source IS NULL;

-- Make source column NOT NULL after setting default values
ALTER TABLE guests ALTER COLUMN source SET NOT NULL;

-- Add comment to explain the plus_one_of relationship
COMMENT ON COLUMN guests.plus_one_of IS 'References the main guest if this guest is their +1. NULL for main guests.';
COMMENT ON COLUMN guests.source IS 'Source of the guest data (e.g., CSV file name, manual entry, etc.)';