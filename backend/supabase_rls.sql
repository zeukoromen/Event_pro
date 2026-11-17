-- ============================================================================
-- Event Pro — Supabase Row Level Security (RLS) Policies
-- Run this script in the Supabase SQL Editor after running migrations.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ── 1. Profiles Table Policies ───────────────────────────────────────────────
-- Allow users to read profiles (needed for event attendee rosters and organizer info)
CREATE POLICY "Public profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- ── 2. Events Table Policies ─────────────────────────────────────────────────
-- Anyone can view published events (for the public invitation /e/:token page)
CREATE POLICY "Public events viewable by anyone"
ON events FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Organizers have full access to their own events
CREATE POLICY "Organizers have full access to own events"
ON events FOR ALL
TO authenticated
USING (auth.uid()::text = organizer_id)
WITH CHECK (auth.uid()::text = organizer_id);

-- ── 3. Attendees Table Policies ──────────────────────────────────────────────
-- Organizers can view all attendees for their events
CREATE POLICY "Organizers can view event attendees"
ON attendees FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = attendees.event_id
        AND events.organizer_id = auth.uid()::text
    )
);

-- Organizers can manage all attendees for their events
CREATE POLICY "Organizers can manage event attendees"
ON attendees FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = attendees.event_id
        AND events.organizer_id = auth.uid()::text
    )
);

-- Visitors and guests can insert RSVP responses without requiring an account
CREATE POLICY "Anyone can submit an RSVP"
ON attendees FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ── 4. Tasks Table Policies ──────────────────────────────────────────────────
-- Organizers have full access to tasks for their events
CREATE POLICY "Organizers can manage tasks"
ON tasks FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = tasks.event_id
        AND events.organizer_id = auth.uid()::text
    )
);

-- Attendees can view tasks for events they attend
CREATE POLICY "Attendees can view assigned tasks"
ON tasks FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM attendees
        WHERE attendees.id = tasks.assignee_id
        AND attendees.user_id = auth.uid()::text
    )
);
