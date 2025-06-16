-- ==============================================================================
-- EDUFLIX MESSENGER REAL-TIME OPTIMIZED DATABASE SCHEMA
-- ==============================================================================
-- This schema supports:
-- 1. Real-time messaging with read receipts
-- 2. User online/offline status tracking
-- 3. Conversation management
-- 4. Message reactions and replies
-- 5. File/media sharing
-- 6. Typing indicators
-- 7. Message search and pagination
-- 8. Delivery confirmations
-- ==============================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS message_read_receipts CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;

-- ==============================================================================
-- 1. USER STATUS TABLE
-- ==============================================================================
-- Tracks online/offline status and last seen for each user
CREATE TABLE user_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'idle', 'dnd', 'offline')) DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status_message TEXT,
    is_typing_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who they're typing to
    typing_started_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 2. CONVERSATIONS TABLE
-- ==============================================================================
-- Manages conversation metadata between users
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
    name TEXT, -- For group conversations
    description TEXT, -- For group conversations
    avatar_url TEXT, -- For group conversations
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_message_id UUID, -- Will reference messages(id) after messages table is created
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 3. CONVERSATION PARTICIPANTS TABLE
-- ==============================================================================
-- Links users to conversations with their specific settings
CREATE TABLE conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    last_read_message_id UUID, -- Will reference messages(id) after messages table is created
    last_read_at TIMESTAMP WITH TIME ZONE,
    notification_settings JSONB DEFAULT '{"mentions": true, "all_messages": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique user per conversation
    CONSTRAINT unique_user_conversation UNIQUE (conversation_id, user_id)
);

-- ==============================================================================
-- 4. MESSAGES TABLE
-- ==============================================================================
-- Core messages table with support for various message types
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT, -- Can be null for non-text messages
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file', 'voice', 'video', 'system', 'deleted')) DEFAULT 'text',
    
    -- File/Media support
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER, -- File size in bytes
    file_type TEXT, -- MIME type
    thumbnail_url TEXT, -- For images/videos
    
    -- Message features
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    forwarded_from_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Rich content support
    metadata JSONB, -- For storing rich content like links, mentions, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT content_required_for_text CHECK (
        (message_type != 'text') OR (message_type = 'text' AND content IS NOT NULL AND content != '')
    ),
    CONSTRAINT file_data_required_for_files CHECK (
        (message_type IN ('text', 'system', 'deleted')) OR 
        (message_type NOT IN ('text', 'system', 'deleted') AND file_url IS NOT NULL)
    )
);

-- Create explicit foreign key names for Supabase PostgREST to recognize relationships
-- This is crucial for the JOIN queries to work properly
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key reference for last_message_id in conversations
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message 
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Add foreign key reference for last_read_message_id in conversation_participants
ALTER TABLE conversation_participants ADD CONSTRAINT fk_participants_last_read_message 
    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ==============================================================================
-- 5. MESSAGE READ RECEIPTS TABLE
-- ==============================================================================
-- Tracks who has read which messages (for read receipts)
CREATE TABLE message_read_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique read receipt per user per message
    CONSTRAINT unique_user_message_read UNIQUE (message_id, user_id)
);

-- ==============================================================================
-- 6. MESSAGE REACTIONS TABLE
-- ==============================================================================
-- Supports emoji reactions on messages
CREATE TABLE message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL, -- emoji or reaction identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique reaction per user per message
    CONSTRAINT unique_user_message_reaction UNIQUE (message_id, user_id, reaction)
);

-- ==============================================================================
-- 7. TYPING INDICATORS TABLE
-- ==============================================================================
-- Real-time typing indicators
CREATE TABLE typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '10 seconds') NOT NULL,
    
    -- Ensure unique typing indicator per user per conversation
    CONSTRAINT unique_user_conversation_typing UNIQUE (conversation_id, user_id)
);

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================

-- User Status indexes
CREATE INDEX idx_user_status_status ON user_status(status);
CREATE INDEX idx_user_status_last_seen ON user_status(last_seen);
CREATE INDEX idx_user_status_typing ON user_status(is_typing_to) WHERE is_typing_to IS NOT NULL;

-- Conversations indexes
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);

-- Conversation Participants indexes
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_active ON conversation_participants(conversation_id, user_id) WHERE left_at IS NULL;

-- Messages indexes (optimized for real-time queries)
CREATE INDEX idx_messages_conversation_id_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX idx_messages_undeleted ON messages(conversation_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_messages_search ON messages USING gin(to_tsvector('english', content)) WHERE content IS NOT NULL;

-- Message Read Receipts indexes
CREATE INDEX idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user_id ON message_read_receipts(user_id);
CREATE INDEX idx_message_read_receipts_read_at ON message_read_receipts(read_at DESC);

-- Message Reactions indexes
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_reaction ON message_reactions(reaction);

-- Typing Indicators indexes
CREATE INDEX idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_expires_at ON typing_indicators(expires_at);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP UPDATES
-- ==============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_status_updated_at BEFORE UPDATE ON user_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_participants_updated_at BEFORE UPDATE ON conversation_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- AUTOMATIC CONVERSATION MANAGEMENT
-- ==============================================================================

-- Function to automatically update conversation metadata when messages are sent
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update conversation's last message info
    UPDATE conversations SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.conversation_id;
    
    -- Mark message as delivered
    UPDATE messages SET
        delivered_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic conversation management
CREATE TRIGGER handle_new_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message();

-- ==============================================================================
-- HELPER FUNCTIONS FOR REAL-TIME FEATURES
-- ==============================================================================

-- Function to create a direct conversation between two users
CREATE OR REPLACE FUNCTION create_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    existing_conversation_id UUID;
BEGIN
    -- Check if conversation already exists between these users
    SELECT c.id INTO existing_conversation_id
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = user1_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = user2_id
    WHERE c.type = 'direct'
    AND cp1.left_at IS NULL
    AND cp2.left_at IS NULL;
    
    -- Return existing conversation if found
    IF existing_conversation_id IS NOT NULL THEN
        RETURN existing_conversation_id;
    END IF;
    
    -- Create new conversation
    INSERT INTO conversations (type, created_by)
    VALUES ('direct', user1_id)
    RETURNING id INTO conversation_id;
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES 
        (conversation_id, user1_id, 'member'),
        (conversation_id, user2_id, 'member');
    
    RETURN conversation_id;
END;
$$ language 'plpgsql';

-- Function to get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    last_read_message_created_at TIMESTAMP WITH TIME ZONE;
    unread_count INTEGER;
BEGIN
    -- Get the timestamp of the last read message
    SELECT m.created_at INTO last_read_message_created_at
    FROM conversation_participants cp
    LEFT JOIN messages m ON cp.last_read_message_id = m.id
    WHERE cp.conversation_id = p_conversation_id 
    AND cp.user_id = p_user_id;
    
    -- Count messages after the last read message
    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_deleted = FALSE
    AND (last_read_message_created_at IS NULL OR created_at > last_read_message_created_at);
    
    RETURN COALESCE(unread_count, 0);
END;
$$ language 'plpgsql';

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID, p_up_to_message_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    target_message_id UUID;
    target_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- If no specific message provided, use the latest message in conversation
    IF p_up_to_message_id IS NULL THEN
        SELECT id, created_at INTO target_message_id, target_created_at
        FROM messages
        WHERE conversation_id = p_conversation_id
        AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT 1;
    ELSE
        SELECT id, created_at INTO target_message_id, target_created_at
        FROM messages
        WHERE id = p_up_to_message_id;
    END IF;
    
    IF target_message_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Insert read receipts for unread messages
    INSERT INTO message_read_receipts (message_id, user_id)
    SELECT m.id, p_user_id
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    AND m.created_at <= target_created_at
    AND m.sender_id != p_user_id
    AND m.is_deleted = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM message_read_receipts mrr
        WHERE mrr.message_id = m.id AND mrr.user_id = p_user_id
    );
    
    -- Update participant's last read message
    UPDATE conversation_participants SET
        last_read_message_id = target_message_id,
        last_read_at = TIMEZONE('utc'::text, NOW())
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ language 'plpgsql';

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS VOID AS $$
BEGIN
    DELETE FROM typing_indicators
    WHERE expires_at < TIMEZONE('utc'::text, NOW());
END;
$$ language 'plpgsql';

-- ==============================================================================
-- REAL-TIME OPTIMIZATIONS
-- ==============================================================================

-- Enable real-time for all tables (you'll need to enable this in Supabase dashboard)
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_status;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- ==============================================================================
-- SAMPLE DATA (OPTIONAL - for testing)
-- ==============================================================================

-- Note: You can uncomment these if you want some sample data for testing
-- This assumes you have auth users with these IDs (replace with real user IDs)

/*
-- Sample user status
INSERT INTO user_status (user_id, status, status_message) VALUES
('user-id-1', 'online', 'Ready to study!'),
('user-id-2', 'idle', 'Taking a break');

-- Create a sample direct conversation
SELECT create_direct_conversation('user-id-1', 'user-id-2');

-- Sample messages (replace conversation_id with actual ID from above)
INSERT INTO messages (conversation_id, sender_id, content) VALUES
('conversation-id', 'user-id-1', 'Hey! Ready for our study session?'),
('conversation-id', 'user-id-2', 'Absolutely! Let me grab my notes.');
*/
