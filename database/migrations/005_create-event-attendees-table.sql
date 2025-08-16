-- =============================================================================
-- EVENT ATTENDEES TABLE CREATION SCRIPT  
-- =============================================================================
-- This script creates the event_attendees table for tracking RSVP responses
-- Run this AFTER creating the events table
-- Run this in your Supabase SQL editor or PostgreSQL client

-- Create custom enum type for RSVP responses
CREATE TYPE rsvp_response AS ENUM ('yes', 'no', 'no_answer');

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    -- Primary key (UUID)
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign key to events table
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Foreign key to guests table  
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    
    -- RSVP response: 'yes', 'no', or 'no_answer' (default)
    response rsvp_response NOT NULL DEFAULT 'no_answer',
    
    -- Optional notes from the guest (e.g., dietary restrictions, special requests)
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure each guest can only have one response per event
    CONSTRAINT unique_guest_event UNIQUE (event_id, guest_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_guest_id ON event_attendees(guest_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_response ON event_attendees(response);

-- Composite index for common queries (get all responses for an event)
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_response ON event_attendees(event_id, response);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_attendees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS event_attendees_updated_at_trigger ON event_attendees;
CREATE TRIGGER event_attendees_updated_at_trigger
    BEFORE UPDATE ON event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_event_attendees_updated_at();

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Create policies for event_attendees table

-- Allow authenticated users to view attendee data
-- In practice, this will be further restricted by application logic
CREATE POLICY "Authenticated users can view attendee data" ON event_attendees
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own RSVP responses
-- Application logic will ensure users can only RSVP for their group members
CREATE POLICY "Authenticated users can insert RSVP responses" ON event_attendees
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update RSVP responses
-- Application logic will ensure users can only update their group members' responses
CREATE POLICY "Authenticated users can update RSVP responses" ON event_attendees
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete RSVP responses (for corrections)
CREATE POLICY "Authenticated users can delete RSVP responses" ON event_attendees
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create a view for easy RSVP summary queries
CREATE OR REPLACE VIEW event_rsvp_summary AS
SELECT 
    e.event_id,
    e.name as event_name,
    e.date as event_date,
    COUNT(ea.id) as total_responses,
    COUNT(CASE WHEN ea.response = 'yes' THEN 1 END) as yes_count,
    COUNT(CASE WHEN ea.response = 'no' THEN 1 END) as no_count,
    COUNT(CASE WHEN ea.response = 'no_answer' THEN 1 END) as no_answer_count,
    ROUND(
        COUNT(CASE WHEN ea.response = 'yes' THEN 1 END)::numeric / 
        NULLIF(COUNT(ea.id), 0) * 100, 
        2
    ) as yes_percentage
FROM events e
LEFT JOIN event_attendees ea ON e.id = ea.event_id
GROUP BY e.id, e.event_id, e.name, e.date
ORDER BY e.date;

-- Create a view for detailed RSVP data with guest information
CREATE OR REPLACE VIEW event_attendees_detailed AS
SELECT 
    e.event_id,
    e.name as event_name,
    e.date as event_date,
    g.first_name,
    g.last_name,
    g.email,
    g.phone,
    gr.name as group_name,
    ea.response,
    ea.notes,
    ea.created_at as rsvp_date,
    ea.updated_at as last_updated
FROM events e
JOIN event_attendees ea ON e.id = ea.event_id
JOIN guests g ON ea.guest_id = g.id
LEFT JOIN groups gr ON g.group_id = gr.id
ORDER BY e.date, gr.name, g.last_name, g.first_name;

-- Grant permissions on views to authenticated users
GRANT SELECT ON event_rsvp_summary TO authenticated;
GRANT SELECT ON event_attendees_detailed TO authenticated;

-- =============================================================================
-- UTILITY FUNCTIONS FOR RSVP MANAGEMENT
-- =============================================================================

-- Function to get RSVP status for a specific group
CREATE OR REPLACE FUNCTION get_group_rsvp_status(group_uuid UUID)
RETURNS TABLE (
    event_id VARCHAR(100),
    event_name VARCHAR(200),
    event_date TIMESTAMPTZ,
    guest_id UUID,
    guest_first_name VARCHAR(100),
    guest_last_name VARCHAR(100),
    response rsvp_response,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.event_id::VARCHAR(100),
        e.name::VARCHAR(200),
        e.date,
        g.id,
        g.first_name::VARCHAR(100),
        g.last_name::VARCHAR(100),
        COALESCE(ea.response, 'no_answer'::rsvp_response) as response,
        ea.notes
    FROM events e
    CROSS JOIN guests g
    LEFT JOIN event_attendees ea ON e.id = ea.event_id AND g.id = ea.guest_id
    WHERE g.group_id = group_uuid
    ORDER BY e.date, g.last_name, g.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert (insert or update) RSVP response
CREATE OR REPLACE FUNCTION upsert_rsvp_response(
    p_event_id UUID,
    p_guest_id UUID,
    p_response rsvp_response,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    attendee_id UUID;
BEGIN
    INSERT INTO event_attendees (event_id, guest_id, response, notes)
    VALUES (p_event_id, p_guest_id, p_response, p_notes)
    ON CONFLICT (event_id, guest_id) 
    DO UPDATE SET 
        response = EXCLUDED.response,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING id INTO attendee_id;
    
    RETURN attendee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================
-- Uncomment the following section if you want to insert sample RSVP data
-- Make sure you have actual guest IDs and event IDs from your database

/*
-- Sample RSVP responses (replace with actual guest IDs)
INSERT INTO event_attendees (event_id, guest_id, response, notes) 
SELECT 
    e.id as event_id,
    g.id as guest_id,
    'no_answer'::rsvp_response,
    NULL
FROM events e
CROSS JOIN guests g
LIMIT 20
ON CONFLICT (event_id, guest_id) DO NOTHING;
*/

-- Verify table creation
SELECT 'Events' as table_name, COUNT(*) as row_count FROM events
UNION ALL
SELECT 'Event Attendees', COUNT(*) FROM event_attendees
UNION ALL  
SELECT 'RSVP Summary View', COUNT(*) FROM event_rsvp_summary;

-- =============================================================================
-- NOTES FOR SETUP:
-- 1. Run the events table script first
-- 2. Run this script in your Supabase SQL editor
-- 3. The table starts empty - RSVP responses will be added through the app
-- 4. Use the utility functions for complex RSVP operations
-- 5. The views provide easy access to aggregated RSVP data
-- =============================================================================