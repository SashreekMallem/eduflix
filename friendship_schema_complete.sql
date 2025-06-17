-- ==============================================================================
-- EDUFLIX FRIENDSHIP SYSTEM COMPLETE DATABASE SCHEMA
-- ==============================================================================
-- This schema supports:
-- 1. Friend requests and invitations
-- 2. Friendship management (accept, decline, block)
-- 3. Friend suggestions based on mutual connections
-- 4. Study buddy system integration
-- ==============================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS friend_invitations CASCADE;

-- ==============================================================================
-- 1. FRIEND INVITATIONS TABLE
-- ==============================================================================
-- Manages friend requests and invitations between users
CREATE TABLE friend_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT different_users CHECK (sender_id != receiver_id),
    CONSTRAINT unique_invitation UNIQUE (sender_id, receiver_id)
);

-- ==============================================================================
-- 2. FRIENDSHIPS TABLE
-- ==============================================================================
-- Manages established friendships between users
CREATE TABLE friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('accepted', 'blocked')) DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT different_users_friendship CHECK (user_id != friend_id),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
-- Friend invitations indexes
CREATE INDEX idx_friend_invitations_sender_id ON friend_invitations(sender_id);
CREATE INDEX idx_friend_invitations_receiver_id ON friend_invitations(receiver_id);
CREATE INDEX idx_friend_invitations_status ON friend_invitations(status);
CREATE INDEX idx_friend_invitations_created_at ON friend_invitations(created_at);

-- Friendships indexes
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_created_at ON friendships(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_friend_invitations_receiver_status ON friend_invitations(receiver_id, status);
CREATE INDEX idx_friend_invitations_sender_status ON friend_invitations(sender_id, status);
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status ON friendships(friend_id, status);

-- ==============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_friend_invitations_updated_at BEFORE UPDATE ON friend_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- HELPER FUNCTIONS
-- ==============================================================================

-- Function to accept a friend invitation
CREATE OR REPLACE FUNCTION accept_friend_invitation(
    invitation_id UUID,
    accepting_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get the invitation details
    SELECT * INTO invitation_record
    FROM friend_invitations
    WHERE id = invitation_id AND receiver_id = accepting_user_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN 'INVITATION_NOT_FOUND';
    END IF;
    
    -- Update invitation status
    UPDATE friend_invitations
    SET status = 'accepted', updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = invitation_id;
    
    -- Create mutual friendship records
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES 
        (invitation_record.sender_id, invitation_record.receiver_id, 'accepted'),
        (invitation_record.receiver_id, invitation_record.sender_id, 'accepted')
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    RETURN 'ACCEPTED';
END;
$$ LANGUAGE plpgsql;

-- Function to decline a friend invitation
CREATE OR REPLACE FUNCTION decline_friend_invitation(
    invitation_id UUID,
    declining_user_id UUID
)
RETURNS TEXT AS $$
BEGIN
    -- Update invitation status
    UPDATE friend_invitations
    SET status = 'declined', updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = invitation_id AND receiver_id = declining_user_id AND status = 'pending';
    
    IF FOUND THEN
        RETURN 'DECLINED';
    ELSE
        RETURN 'INVITATION_NOT_FOUND';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to remove friendship
CREATE OR REPLACE FUNCTION remove_friendship(
    user_id UUID,
    friend_id UUID
)
RETURNS TEXT AS $$
BEGIN
    -- Remove mutual friendship records
    DELETE FROM friendships
    WHERE (user_id = $1 AND friend_id = $2) 
       OR (user_id = $2 AND friend_id = $1);
    
    IF FOUND THEN
        RETURN 'REMOVED';
    ELSE
        RETURN 'FRIENDSHIP_NOT_FOUND';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get friend suggestions based on mutual connections
CREATE OR REPLACE FUNCTION get_friend_suggestions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    mutual_friends INTEGER,
    common_interests TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH user_friends AS (
        SELECT CASE 
            WHEN f.user_id = p_user_id THEN f.friend_id 
            ELSE f.user_id 
        END AS friend_id
        FROM friendships f
        WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
        AND f.status = 'accepted'
    ),
    friend_of_friends AS (
        SELECT CASE 
            WHEN f2.user_id = uf.friend_id THEN f2.friend_id 
            ELSE f2.user_id 
        END AS potential_friend,
        COUNT(*) as mutual_count
        FROM user_friends uf
        JOIN friendships f2 ON (f2.user_id = uf.friend_id OR f2.friend_id = uf.friend_id)
        WHERE f2.status = 'accepted'
        AND CASE 
            WHEN f2.user_id = uf.friend_id THEN f2.friend_id 
            ELSE f2.user_id 
        END != p_user_id
        AND CASE 
            WHEN f2.user_id = uf.friend_id THEN f2.friend_id 
            ELSE f2.user_id 
        END NOT IN (SELECT friend_id FROM user_friends)
        GROUP BY CASE 
            WHEN f2.user_id = uf.friend_id THEN f2.friend_id 
            ELSE f2.user_id 
        END
    )
    SELECT 
        fof.potential_friend as user_id,
        fof.mutual_count::INTEGER as mutual_friends,
        ARRAY[]::TEXT[] as common_interests
    FROM friend_of_friends fof
    WHERE NOT EXISTS (
        -- Exclude users with pending invitations
        SELECT 1 FROM friend_invitations fi
        WHERE ((fi.sender_id = p_user_id AND fi.receiver_id = fof.potential_friend)
            OR (fi.sender_id = fof.potential_friend AND fi.receiver_id = p_user_id))
        AND fi.status = 'pending'
    )
    ORDER BY fof.mutual_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE friend_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Friend invitations policies
CREATE POLICY "Users can view own invitations" ON friend_invitations 
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send invitations" ON friend_invitations 
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received invitations" ON friend_invitations 
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships 
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "System can manage friendships" ON friendships 
    FOR ALL USING (true);

-- ==============================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ==============================================================================
-- Uncomment to add sample data for testing
/*
-- Insert sample friend invitations (replace with actual user IDs)
INSERT INTO friend_invitations (sender_id, receiver_id, status, message) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'pending', 'Let''s be study buddies!'),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'pending', 'Would love to study together!');

-- Insert sample friendships (replace with actual user IDs)
INSERT INTO friendships (user_id, friend_id, status) VALUES
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'accepted'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'accepted');
*/
