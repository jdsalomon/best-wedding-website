-- =============================================================================
-- WEDDING EVENTS TABLE CREATION SCRIPT
-- =============================================================================
-- This script creates the events table for the wedding RSVP system
-- Run this in your Supabase SQL editor or PostgreSQL client

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    -- Primary key (UUID)
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Custom event identifier (e.g., 'ceremony', 'reception', 'brunch')
    -- This allows for easy reference in code and APIs
    event_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Event display name (e.g., 'Wedding Ceremony', 'Reception Dinner')
    name VARCHAR(200) NOT NULL,
    
    -- Event description/details
    description TEXT,
    
    -- Event date and time (with timezone support)
    date TIMESTAMPTZ NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on event_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id);

-- Create index on date for ordering events
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS events_updated_at_trigger ON events;
CREATE TRIGGER events_updated_at_trigger
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
-- Allow all authenticated users to read events
CREATE POLICY "Anyone can view events" ON events
    FOR SELECT 
    USING (true);

-- Allow only authenticated users to insert/update/delete events (admin only in practice)
CREATE POLICY "Authenticated users can manage events" ON events
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Insert some sample events for testing
INSERT INTO events (event_id, name, description, date) VALUES
    ('ceremony', 'Wedding Ceremony', 'The main wedding ceremony where we exchange vows', '2024-09-15 15:30:00+02'),
    ('reception', 'Wedding Reception', 'Dinner, dancing, and celebration following the ceremony', '2024-09-15 19:00:00+02'),
    ('brunch', 'Day-After Brunch', 'Casual brunch to continue the celebration', '2024-09-16 11:00:00+02')
ON CONFLICT (event_id) DO NOTHING;

-- Verify table creation and data
SELECT * FROM events ORDER BY date;

-- =============================================================================
-- NOTES FOR SETUP:
-- 1. Run this script in your Supabase SQL editor
-- 2. Verify the sample data appears correctly
-- 3. Update the sample event dates to match your actual wedding dates
-- 4. Add or modify events as needed for your specific wedding schedule
-- =============================================================================