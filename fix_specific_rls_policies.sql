-- Fix the specific RLS policies that are causing 403 errors
-- The issue is that policies need to handle profile IDs correctly

-- 1. Fix friend_invitations UPDATE policy
DROP POLICY IF EXISTS "Users can update their invitations" ON friend_invitations;

CREATE POLICY "Users can update their invitations" ON friend_invitations
    FOR UPDATE USING (
        -- Allow if user is sender (using profile ID)
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        -- Allow if user is receiver (using profile ID) 
        receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        -- Same conditions for the new values
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- 2. Fix friendships INSERT policy  
DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;

CREATE POLICY "Users can insert friendships" ON friendships
    FOR INSERT WITH CHECK (
        -- Allow if the user_id is the current user's profile ID
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        -- Allow if the friend_id is the current user's profile ID (for mutual friendship creation)
        friend_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- Debug: Test the policies with actual data
DO $$
DECLARE
    current_auth_id uuid;
    current_profile_id uuid;
BEGIN
    -- Get current auth user ID (if running as authenticated user)
    current_auth_id := auth.uid();
    
    -- Get current user's profile ID
    SELECT id INTO current_profile_id 
    FROM user_profiles 
    WHERE user_id = current_auth_id;
    
    RAISE NOTICE 'Auth ID: %, Profile ID: %', current_auth_id, current_profile_id;
    
    -- Test if the policies would work
    IF current_profile_id IS NOT NULL THEN
        RAISE NOTICE 'Profile found - policies should work';
    ELSE
        RAISE NOTICE 'No profile found - user needs to complete onboarding';
    END IF;
END $$;
