-- ===========================================
-- FINAL FIX for EduFlix Friends System RLS Policies
-- ===========================================
-- The issue: RLS policies were incorrectly mapping auth.uid() to user_profiles.id
-- The fix: Map auth.uid() to user_profiles.user_id (which references auth.users.id)

-- ===========================================
-- FRIEND INVITATIONS TABLE
-- ===========================================

-- Drop all existing policies for friend_invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON friend_invitations;
DROP POLICY IF EXISTS "Users can insert invitations" ON friend_invitations;  
DROP POLICY IF EXISTS "Users can update their invitations" ON friend_invitations;
DROP POLICY IF EXISTS "Users can delete their invitations" ON friend_invitations;

-- Create correct policies that map auth.uid() to user_profiles.user_id
CREATE POLICY "Users can view their invitations" ON friend_invitations
    FOR SELECT USING (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert invitations" ON friend_invitations
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their invitations" ON friend_invitations
    FOR UPDATE USING (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their invitations" ON friend_invitations
    FOR DELETE USING (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- ===========================================
-- FRIENDSHIPS TABLE
-- ===========================================

-- Drop all existing policies for friendships
DROP POLICY IF EXISTS "Users can view friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;

-- Create correct policies for friendships table
CREATE POLICY "Users can view friendships" ON friendships
    FOR SELECT USING (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        friend_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert friendships" ON friendships
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update friendships" ON friendships
    FOR UPDATE USING (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        friend_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete friendships" ON friendships
    FOR DELETE USING (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        friend_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- ===========================================
-- FRIEND SUGGESTIONS TABLE
-- ===========================================

-- Drop all existing policies for friend_suggestions
DROP POLICY IF EXISTS "Users can view suggestions" ON friend_suggestions;
DROP POLICY IF EXISTS "Users can insert suggestions" ON friend_suggestions;
DROP POLICY IF EXISTS "Users can update suggestions" ON friend_suggestions;
DROP POLICY IF EXISTS "Users can delete suggestions" ON friend_suggestions;

-- Create correct policies for friend_suggestions table
CREATE POLICY "Users can view suggestions" ON friend_suggestions
    FOR SELECT USING (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert suggestions" ON friend_suggestions
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update suggestions" ON friend_suggestions
    FOR UPDATE USING (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete suggestions" ON friend_suggestions
    FOR DELETE USING (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- ===========================================
-- USER PROFILES TABLE - Allow public viewing for friends system
-- ===========================================

-- Drop existing restrictive policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- Create new policies that allow public viewing of basic profile info
-- This is essential for the friends system to work properly
CREATE POLICY "Public profiles viewable" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- ENABLE RLS (if not already enabled)
-- ===========================================

-- Ensure RLS is enabled on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_suggestions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Use these queries to verify the policies are working:
-- 1. Check if you can view user profiles: SELECT * FROM user_profiles LIMIT 5;
-- 2. Check if you can view your invitations: SELECT * FROM friend_invitations;
-- 3. Check if you can insert an invitation: 
--    INSERT INTO friend_invitations (sender_id, receiver_id) 
--    VALUES ((SELECT id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1), 'some-uuid');
-- 4. Check current user: SELECT auth.uid();
-- 5. Check your profile ID: SELECT id FROM user_profiles WHERE user_id = auth.uid();
