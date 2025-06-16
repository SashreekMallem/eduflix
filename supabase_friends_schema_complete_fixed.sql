-- ===========================================
-- EduFlix AI Friends System - COMPLETE FIXED Supabase Schema
-- ===========================================
-- This version includes ALL necessary fixes for RLS policies to work with friends system

-- First, update the main user_profiles table RLS policies to allow public viewing
-- This is essential for the friends system to work properly

-- Drop existing restrictive policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Create new policies that allow public viewing of basic profile info
-- while keeping personal data secure
CREATE POLICY "Public profiles viewable" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Update other tables to allow viewing of user data for friends system
-- Education - allow public viewing for profile display
DROP POLICY IF EXISTS "Users can view own education" ON user_education;
CREATE POLICY "Public education viewable" ON user_education FOR SELECT USING (true);

-- Work experience - allow public viewing  
DROP POLICY IF EXISTS "Users can view own work experience" ON user_work_experience;
CREATE POLICY "Public work experience viewable" ON user_work_experience FOR SELECT USING (true);

-- Projects - allow public viewing
DROP POLICY IF EXISTS "Users can view own projects" ON user_projects;  
CREATE POLICY "Public projects viewable" ON user_projects FOR SELECT USING (true);

-- Certifications - allow public viewing
DROP POLICY IF EXISTS "Users can view own certifications" ON user_certifications;
CREATE POLICY "Public certifications viewable" ON user_certifications FOR SELECT USING (true);

-- Online courses - allow public viewing
DROP POLICY IF EXISTS "Users can view own courses" ON user_online_courses;
CREATE POLICY "Public courses viewable" ON user_online_courses FOR SELECT USING (true);

-- Skill proficiencies - allow public viewing
DROP POLICY IF EXISTS "Users can view own skill proficiencies" ON user_skill_proficiencies;
CREATE POLICY "Public skill proficiencies viewable" ON user_skill_proficiencies FOR SELECT USING (true);

-- Documents remain private (no change needed)

-- ===========================================
-- FRIENDS SYSTEM TABLES (if not already created)
-- ===========================================

-- Create friendships table for managing connections between users
CREATE TABLE IF NOT EXISTS friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure a user can't be friends with themselves
    CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
    -- Ensure unique friendship pairs (prevent duplicates)
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Create friend_invitations table for managing friend requests
CREATE TABLE IF NOT EXISTS friend_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Ensure a user can't invite themselves
    CONSTRAINT no_self_invitation CHECK (sender_id != receiver_id),
    -- Ensure unique pending invitations (prevent spam)
    CONSTRAINT unique_pending_invitation UNIQUE (sender_id, receiver_id, status)
);

-- Create friend_suggestions table for AI-powered recommendations
CREATE TABLE IF NOT EXISTS friend_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    suggested_user_id UUID NOT NULL,
    compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    shared_interests TEXT[] DEFAULT '{}',
    mutual_connections INTEGER DEFAULT 0,
    suggestion_reason TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure a user can't be suggested to themselves
    CONSTRAINT no_self_suggestion CHECK (user_id != suggested_user_id),
    -- Ensure unique suggestions per user pair
    CONSTRAINT unique_suggestion UNIQUE (user_id, suggested_user_id)
);

-- Create connection_analytics table for tracking network growth
CREATE TABLE IF NOT EXISTS connection_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    total_friends INTEGER DEFAULT 0,
    pending_invitations_sent INTEGER DEFAULT 0,
    pending_invitations_received INTEGER DEFAULT 0,
    suggestions_available INTEGER DEFAULT 0,
    network_growth_rate DECIMAL(5,2) DEFAULT 0.00,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure one analytics record per user
    CONSTRAINT unique_user_analytics UNIQUE (user_id)
);

-- ===========================================
-- INDEXES for Performance Optimization
-- ===========================================

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_created_at ON friendships(created_at);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_invitations_sender_id ON friend_invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_receiver_id ON friend_invitations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON friend_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON friend_invitations(created_at);
CREATE INDEX IF NOT EXISTS idx_invitations_receiver_status ON friend_invitations(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON friend_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON friend_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_suggested_user_id ON friend_suggestions(suggested_user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_compatibility_score ON friend_suggestions(compatibility_score);
CREATE INDEX IF NOT EXISTS idx_suggestions_dismissed ON friend_suggestions(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_active ON friend_suggestions(user_id, is_dismissed);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON connection_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_last_activity ON connection_analytics(last_activity);

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on friends tables
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friendships;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friend_invitations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friend_suggestions;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON connection_analytics;

-- Friendships policies - Users can see friendships they're part of
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);
    
CREATE POLICY "Users can create friendships" ON friendships
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
    
CREATE POLICY "Users can update own friendships" ON friendships
    FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);
    
CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

-- Friend invitations policies
CREATE POLICY "Users can view invitations involving them" ON friend_invitations
    FOR SELECT USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);
    
CREATE POLICY "Users can send invitations" ON friend_invitations
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);
    
CREATE POLICY "Users can update invitations involving them" ON friend_invitations
    FOR UPDATE USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);
    
CREATE POLICY "Users can delete own sent invitations" ON friend_invitations
    FOR DELETE USING (auth.uid()::text = sender_id::text);

-- Friend suggestions policies - Users can only see their own suggestions
CREATE POLICY "Users can view own suggestions" ON friend_suggestions
    FOR SELECT USING (auth.uid()::text = user_id::text);
    
CREATE POLICY "Users can update own suggestions" ON friend_suggestions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Connection analytics policies - Users can only see their own analytics
CREATE POLICY "Users can view own analytics" ON connection_analytics
    FOR SELECT USING (auth.uid()::text = user_id::text);
    
CREATE POLICY "Users can update own analytics" ON connection_analytics
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ===========================================
-- FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_friendships_updated_at') THEN
        CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invitations_updated_at') THEN
        CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON friend_invitations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suggestions_updated_at') THEN
        CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON friend_suggestions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_analytics_updated_at') THEN
        CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON connection_analytics
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to automatically create friendship records when invitation is accepted
CREATE OR REPLACE FUNCTION handle_accepted_invitation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Create mutual friendship records
        INSERT INTO friendships (user_id, friend_id, status)
        VALUES 
            (NEW.sender_id, NEW.receiver_id, 'accepted'),
            (NEW.receiver_id, NEW.sender_id, 'accepted')
        ON CONFLICT (user_id, friend_id) DO NOTHING;
        
        -- Remove any suggestions between these users
        DELETE FROM friend_suggestions 
        WHERE (user_id = NEW.sender_id AND suggested_user_id = NEW.receiver_id)
           OR (user_id = NEW.receiver_id AND suggested_user_id = NEW.sender_id);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for handling accepted invitations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_invitation_accepted') THEN
        CREATE TRIGGER on_invitation_accepted 
            AFTER UPDATE ON friend_invitations
            FOR EACH ROW 
            EXECUTE FUNCTION handle_accepted_invitation();
    END IF;
END $$;

-- ===========================================
-- SAMPLE DATA INSERTION
-- ===========================================

-- Insert sample user profiles for testing (only if user_profiles table is empty)
DO $$
BEGIN
    -- Check if user_profiles table has any data
    IF NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
        -- Insert sample users for testing
        INSERT INTO user_profiles (user_id, full_name, username, current_status, skills, career_goals, learning_goals, onboarding_completed) VALUES
        (gen_random_uuid(), 'Emily Rivera', 'emily_rivera', 'Computer Science Student at MIT', 
         ARRAY['Python', 'Machine Learning', 'Data Science', 'React'], 
         ARRAY['AI Engineer', 'Tech Lead'], 
         ARRAY['Deep Learning', 'Cloud Computing'], true),
        
        (gen_random_uuid(), 'Marcus Chen', 'marcus_chen', 'Software Engineer at Google', 
         ARRAY['JavaScript', 'TypeScript', 'Node.js', 'AWS'], 
         ARRAY['Senior Developer', 'Solution Architect'], 
         ARRAY['System Design', 'Microservices'], true),
        
        (gen_random_uuid(), 'Sarah Johnson', 'sarah_j', 'Product Manager & UX Designer', 
         ARRAY['Product Management', 'UX Design', 'Figma', 'Analytics'], 
         ARRAY['VP of Product', 'Startup Founder'], 
         ARRAY['Growth Strategy', 'User Research'], true),
        
        (gen_random_uuid(), 'Alex Kumar', 'alex_kumar', 'DevOps Engineer specializing in Kubernetes', 
         ARRAY['Docker', 'Kubernetes', 'AWS', 'Terraform'], 
         ARRAY['DevOps Lead', 'Cloud Architect'], 
         ARRAY['Infrastructure as Code', 'Security'], true),
        
        (gen_random_uuid(), 'Lisa Park', 'lisa_park', 'Data Scientist at Netflix', 
         ARRAY['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'], 
         ARRAY['Senior Data Scientist', 'Head of Analytics'], 
         ARRAY['Advanced Statistics', 'MLOps'], true),
        
        (gen_random_uuid(), 'David Wilson', 'david_w', 'Full Stack Developer & Open Source Contributor', 
         ARRAY['React', 'Python', 'PostgreSQL', 'GraphQL'], 
         ARRAY['Tech Lead', 'Open Source Maintainer'], 
         ARRAY['System Architecture', 'API Design'], true);
         
        RAISE NOTICE 'Sample user profiles inserted successfully!';
    ELSE
        RAISE NOTICE 'User profiles table already contains data, skipping sample data insertion.';
    END IF;
END $$;

-- Insert initial analytics records for all users
INSERT INTO connection_analytics (user_id, total_friends)
SELECT 
    up.user_id,
    0
FROM user_profiles up
ON CONFLICT (user_id) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE friendships IS 'Stores confirmed friendships between users';
COMMENT ON TABLE friend_invitations IS 'Manages friend requests and invitations';
COMMENT ON TABLE friend_suggestions IS 'AI-generated friend suggestions for users';
COMMENT ON TABLE connection_analytics IS 'Analytics and metrics for user connections';

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Show summary of what was created/updated
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'EduFlix Friends System Setup Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tables created/verified:';
    RAISE NOTICE '- friendships';
    RAISE NOTICE '- friend_invitations'; 
    RAISE NOTICE '- friend_suggestions';
    RAISE NOTICE '- connection_analytics';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Policies updated for public profile viewing';
    RAISE NOTICE 'Sample data inserted (if needed)';
    RAISE NOTICE 'All indexes and triggers configured';
    RAISE NOTICE '===========================================';
END $$;
