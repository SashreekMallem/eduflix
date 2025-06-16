-- ===========================================
-- FRIENDS SYSTEM RLS POLICIES - CORRECT VERSION
-- ===========================================
-- This fixes the RLS policies for friendships and friend_invitations tables
-- Both tables use auth.uid() (auth user IDs) in their foreign key columns

-- Drop all existing policies first to start clean
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friendships;

DROP POLICY IF EXISTS "Users can view invitations involving them" ON friend_invitations;
DROP POLICY IF EXISTS "Users can send invitations" ON friend_invitations;
DROP POLICY IF EXISTS "Users can update invitations involving them" ON friend_invitations;
DROP POLICY IF EXISTS "Users can delete own sent invitations" ON friend_invitations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON friend_invitations;

-- ===========================================
-- FRIENDSHIPS TABLE POLICIES
-- ===========================================

-- Enable RLS on friendships table
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view friendships where they are either user_id or friend_id
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = friend_id
    );

-- INSERT: Users can create friendships where they are the user_id
CREATE POLICY "Users can create friendships" ON friendships
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- UPDATE: Users can update friendships where they are involved
CREATE POLICY "Users can update own friendships" ON friendships
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = friend_id
    );

-- DELETE: Users can delete friendships where they are involved
CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.uid() = friend_id
    );

-- ===========================================
-- FRIEND_INVITATIONS TABLE POLICIES
-- ===========================================
-- NOTE: friend_invitations table uses PROFILE IDs (user_profiles.id), not auth user IDs

-- Enable RLS on friend_invitations table
ALTER TABLE friend_invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view invitations where their profile ID is sender or receiver
CREATE POLICY "Users can view invitations involving them" ON friend_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND (user_profiles.id = sender_id OR user_profiles.id = receiver_id)
        )
    );

-- INSERT: Users can send invitations where their profile ID is the sender
CREATE POLICY "Users can send invitations" ON friend_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.id = sender_id
        )
    );

-- UPDATE: Users can update invitations where their profile ID is involved (for accepting/declining)
CREATE POLICY "Users can update invitations involving them" ON friend_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND (user_profiles.id = sender_id OR user_profiles.id = receiver_id)
        )
    );

-- DELETE: Users can delete invitations where their profile ID is involved
CREATE POLICY "Users can delete invitations involving them" ON friend_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND (user_profiles.id = sender_id OR user_profiles.id = receiver_id)
        )
    );

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check that policies were created successfully
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename IN ('friendships', 'friend_invitations')
ORDER BY tablename, policyname;

-- Show current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('friendships', 'friend_invitations');

-- ===========================================
-- NOTES
-- ===========================================
/*
These policies ensure:

1. FRIENDSHIPS TABLE:
   - Uses AUTH USER IDs (auth.uid()) in user_id and friend_id columns
   - Users can only see friendships they're part of
   - Users can only create friendships where they're the primary user
   - Users can update/delete friendships they're involved in
   - Bidirectional access (user_id or friend_id matches auth.uid())

2. FRIEND_INVITATIONS TABLE:
   - Uses PROFILE IDs (user_profiles.id) in sender_id and receiver_id columns
   - Policies use subqueries to match auth.uid() with profile ownership
   - Users can only see/manage invitations involving their profiles
   - Users can only send invitations as their own profile
   - Users can update invitations they're involved in (for accepting/declining)

3. ARCHITECTURE:
   - Friendships: auth.uid() ↔ auth.uid()
   - Invitations: profile.id ↔ profile.id (but validated against auth.uid())
   - When accepting invitations, profile IDs are converted to auth.uid() for friendship creation

4. SECURITY:
   - All policies ensure users can only access their own data
   - Subqueries in invitation policies prevent unauthorized access
   - Insert policies ensure users can't impersonate others
   - Update/Delete policies allow legitimate operations while maintaining security
*/
