-- ===========================================
-- EduFlix AI Friends System - CORRECTED Supabase Schema
-- ===========================================
-- This version fixes the foreign key references and RLS policies

-- First, let's check if we need to drop existing tables that might have issues
DROP TABLE IF EXISTS connection_analytics CASCADE;
DROP TABLE IF EXISTS friend_suggestions CASCADE;
DROP TABLE IF EXISTS friend_invitations CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Drop any existing views
DROP VIEW IF EXISTS friends_with_profiles CASCADE;
DROP VIEW IF EXISTS pending_invitations_with_profiles CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS generate_friend_suggestions(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_invitations() CASCADE;
DROP FUNCTION IF EXISTS update_connection_analytics() CASCADE;
DROP FUNCTION IF EXISTS handle_accepted_invitation() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ===========================================
-- RECREATE TABLES WITH CORRECT REFERENCES
-- ===========================================

-- Create friendships table for managing connections between users
-- Using user_profiles.user_id instead of auth.users(id)
CREATE TABLE friendships (
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
CREATE TABLE friend_invitations (
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
CREATE TABLE friend_suggestions (
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
CREATE TABLE connection_analytics (
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

-- Friendships indexes
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_created_at ON friendships(created_at);
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);

-- Friend invitations indexes
CREATE INDEX idx_invitations_sender_id ON friend_invitations(sender_id);
CREATE INDEX idx_invitations_receiver_id ON friend_invitations(receiver_id);
CREATE INDEX idx_invitations_status ON friend_invitations(status);
CREATE INDEX idx_invitations_created_at ON friend_invitations(created_at);
CREATE INDEX idx_invitations_receiver_status ON friend_invitations(receiver_id, status);
CREATE INDEX idx_invitations_expires_at ON friend_invitations(expires_at);

-- Friend suggestions indexes
CREATE INDEX idx_suggestions_user_id ON friend_suggestions(user_id);
CREATE INDEX idx_suggestions_suggested_user_id ON friend_suggestions(suggested_user_id);
CREATE INDEX idx_suggestions_compatibility_score ON friend_suggestions(compatibility_score);
CREATE INDEX idx_suggestions_dismissed ON friend_suggestions(is_dismissed);
CREATE INDEX idx_suggestions_user_active ON friend_suggestions(user_id, is_dismissed);

-- Connection analytics indexes
CREATE INDEX idx_analytics_user_id ON connection_analytics(user_id);
CREATE INDEX idx_analytics_last_activity ON connection_analytics(last_activity);

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_analytics ENABLE ROW LEVEL SECURITY;

-- Friendships policies - SIMPLIFIED for debugging
CREATE POLICY "Enable all operations for authenticated users" ON friendships
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Friend invitations policies - SIMPLIFIED for debugging
CREATE POLICY "Enable all operations for authenticated users" ON friend_invitations
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Friend suggestions policies - SIMPLIFIED for debugging
CREATE POLICY "Enable all operations for authenticated users" ON friend_suggestions
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Connection analytics policies - SIMPLIFIED for debugging
CREATE POLICY "Enable all operations for authenticated users" ON connection_analytics
    FOR ALL USING (auth.uid() IS NOT NULL);

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

-- Triggers for updating timestamps
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON friend_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON friend_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON connection_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger for handling accepted invitations
CREATE TRIGGER on_invitation_accepted 
    AFTER UPDATE ON friend_invitations
    FOR EACH ROW 
    EXECUTE FUNCTION handle_accepted_invitation();

-- ===========================================
-- INITIAL SETUP
-- ===========================================

-- Insert initial analytics records for existing users (if user_profiles table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        INSERT INTO connection_analytics (user_id, total_friends)
        SELECT 
            up.user_id,
            0
        FROM user_profiles up
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE friendships IS 'Stores confirmed friendships between users';
COMMENT ON TABLE friend_invitations IS 'Manages friend requests and invitations';
COMMENT ON TABLE friend_suggestions IS 'AI-generated friend suggestions for users';
COMMENT ON TABLE connection_analytics IS 'Analytics and metrics for user connections';
