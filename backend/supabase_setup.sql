-- ============================================================================
-- Event Pro — Master Supabase Database Setup Script
--
-- How to run:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire file, and click "Run" (Ctrl+Enter)
--
-- This creates:
--   - All 4 tables (profiles, events, attendees, tasks)
--   - Foreign key relationships and indexes
--   - Row Level Security (RLS) policies
--   - Automatic profile sync trigger from Google OAuth (auth.users -> profiles)
-- ============================================================================

-- ── 1. Create Profiles Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,                       -- Matches Supabase auth.users.id UUID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS ix_profiles_email ON public.profiles(email);

-- ── 2. Create Events Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Other',
    event_date DATE,
    start_time TEXT,
    end_time TEXT,
    location TEXT,
    cover_image_url TEXT,
    invitation_message TEXT,
    public_token TEXT UNIQUE NOT NULL,         -- Unguessable token for /e/:token
    is_published BOOLEAN NOT NULL DEFAULT true,
    allow_maybe_rsvp BOOLEAN NOT NULL DEFAULT true,
    collect_dietary_preferences BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS ix_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS ix_events_public_token ON public.events(public_token);

-- ── 3. Create Attendees Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendees (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Guest',
    dietary_preferences TEXT,
    rsvp_status TEXT NOT NULL DEFAULT 'pending', -- pending | attending | maybe | declined
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS ix_attendees_event_id ON public.attendees(event_id);
CREATE INDEX IF NOT EXISTS ix_attendees_email ON public.attendees(email);
CREATE INDEX IF NOT EXISTS ix_attendees_rsvp_status ON public.attendees(rsvp_status);

-- ── 4. Create Tasks Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    assignee_id TEXT REFERENCES public.attendees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',    -- low | medium | high
    status TEXT NOT NULL DEFAULT 'to_do',       -- to_do | in_progress | done
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS ix_tasks_event_id ON public.tasks(event_id);
CREATE INDEX IF NOT EXISTS ix_tasks_status ON public.tasks(status);

-- ── 5. Enable Row Level Security (RLS) ──────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

-- Events Policies
DROP POLICY IF EXISTS "Public events viewable by anyone" ON public.events;
CREATE POLICY "Public events viewable by anyone"
ON public.events FOR SELECT TO anon, authenticated
USING (is_published = true);

DROP POLICY IF EXISTS "Organizers have full access to own events" ON public.events;
CREATE POLICY "Organizers have full access to own events"
ON public.events FOR ALL TO authenticated
USING (auth.uid()::text = organizer_id) WITH CHECK (auth.uid()::text = organizer_id);

-- Attendees Policies
DROP POLICY IF EXISTS "Organizers can view event attendees" ON public.attendees;
CREATE POLICY "Organizers can view event attendees"
ON public.attendees FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = attendees.event_id AND events.organizer_id = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "Organizers can manage event attendees" ON public.attendees;
CREATE POLICY "Organizers can manage event attendees"
ON public.attendees FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = attendees.event_id AND events.organizer_id = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "Anyone can submit an RSVP" ON public.attendees;
CREATE POLICY "Anyone can submit an RSVP"
ON public.attendees FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Tasks Policies
DROP POLICY IF EXISTS "Organizers can manage tasks" ON public.tasks;
CREATE POLICY "Organizers can manage tasks"
ON public.tasks FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = tasks.event_id AND events.organizer_id = auth.uid()::text
    )
);

DROP POLICY IF EXISTS "Attendees can view assigned tasks" ON public.tasks;
CREATE POLICY "Attendees can view assigned tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.attendees
        WHERE attendees.id = tasks.assignee_id AND attendees.user_id = auth.uid()::text
    )
);

-- ── 6. Automatic User Profile Trigger (Supabase Auth -> public.profiles) ────
-- Whenever a user signs up with Google OAuth, this automatically creates their row in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id::text,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = timezone('utc', now());
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
