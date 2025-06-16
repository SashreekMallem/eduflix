-- =============================================
-- EDUFLIX FRIENDS SYSTEM - RLS POLICY UPDATES ONLY
-- =============================================
-- This file ONLY updates RLS policies for existing tables
-- NO TABLE CREATION OR DELETION - just policy changes

-- =============================================
-- 1. UPDATE USER_PROFILES RLS POLICIES
-- =============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON user_profiles;

-- Create new RLS policies for user_profiles
-- Allow everyone to view profiles (for search functionality) OR users to see their own
CREATE POLICY "Public profiles viewable for search" ON user_profiles
    FOR SELECT USING (true);

-- Allow users to insert their own profile  
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 2. UPDATE RELATED PROFILE TABLES
-- =============================================

-- user_education table
DROP POLICY IF EXISTS "Users can view own education" ON user_education;
DROP POLICY IF EXISTS "Public education viewable" ON user_education;
CREATE POLICY "Public education viewable" ON user_education FOR SELECT USING (true);

-- user_work_experience table  
DROP POLICY IF EXISTS "Users can view own work experience" ON user_work_experience;
DROP POLICY IF EXISTS "Public work experience viewable" ON user_work_experience;
CREATE POLICY "Public work experience viewable" ON user_work_experience FOR SELECT USING (true);

-- user_projects table
DROP POLICY IF EXISTS "Users can view own projects" ON user_projects;
DROP POLICY IF EXISTS "Public projects viewable" ON user_projects;
CREATE POLICY "Public projects viewable" ON user_projects FOR SELECT USING (true);

-- user_certifications table
DROP POLICY IF EXISTS "Users can view own certifications" ON user_certifications;
DROP POLICY IF EXISTS "Public certifications viewable" ON user_certifications;
CREATE POLICY "Public certifications viewable" ON user_certifications FOR SELECT USING (true);

-- user_online_courses table
DROP POLICY IF EXISTS "Users can view own courses" ON user_online_courses;
DROP POLICY IF EXISTS "Public courses viewable" ON user_online_courses;
CREATE POLICY "Public courses viewable" ON user_online_courses FOR SELECT USING (true);

-- user_skill_proficiencies table
DROP POLICY IF EXISTS "Users can view own skill proficiencies" ON user_skill_proficiencies;
DROP POLICY IF EXISTS "Public skill proficiencies viewable" ON user_skill_proficiencies;
CREATE POLICY "Public skill proficiencies viewable" ON user_skill_proficiencies FOR SELECT USING (true);

-- user_documents table (keep private)
-- No changes needed - documents should remain private

-- =============================================
-- 3. UPDATE FRIENDS SYSTEM TABLES (if they exist)
-- =============================================

-- friendships table
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friendships;
CREATE POLICY "Users can view friendships" ON friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friendships" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendships" ON friendships
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- friend_invitations table
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friend_invitations;
CREATE POLICY "Users can view their invitations" ON friend_invitations
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert invitations" ON friend_invitations
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their invitations" ON friend_invitations
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- friend_suggestions table
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friend_suggestions;
CREATE POLICY "Users can view their suggestions" ON friend_suggestions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their suggestions" ON friend_suggestions
    FOR UPDATE USING (auth.uid() = user_id);

-- connection_analytics table
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON connection_analytics;
CREATE POLICY "Users can view their analytics" ON connection_analytics
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their analytics" ON connection_analytics
    FOR UPDATE USING (auth.uid() = user_id);
