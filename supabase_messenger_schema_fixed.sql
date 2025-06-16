-- Messages schema for real-time chat functionality
-- This aligns with the existing EduFlix friends system that uses user_profiles

-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file', 'voice', 'video_call', 'voice_call')) DEFAULT 'text',
    file_url TEXT, -- For image/file messages
    file_name TEXT, -- Original filename for files
    file_size INTEGER, -- File size in bytes
    mime_type TEXT, -- MIME type for files
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- For replying to messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure a user can't message themselves
    CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

-- Create message_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL, -- emoji or reaction type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique reaction per user per message
    CONSTRAINT unique_user_reaction UNIQUE (message_id, user_profile_id, reaction)
);

-- Create message_read_status table for read receipts
CREATE TABLE IF NOT EXISTS message_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique read status per user per message
    CONSTRAINT unique_user_read_status UNIQUE (message_id, user_profile_id)
);

-- Create conversations table for conversation metadata
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    participant_1_archived BOOLEAN DEFAULT FALSE,
    participant_2_archived BOOLEAN DEFAULT FALSE,
    participant_1_muted BOOLEAN DEFAULT FALSE,
    participant_2_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique conversation between two users
    CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id),
    -- Ensure a user can't have a conversation with themselves
    CONSTRAINT no_self_conversation CHECK (participant_1_id != participant_2_id)
);

-- Create user_status table for online/offline status (references user_profiles)
CREATE TABLE IF NOT EXISTS user_status (
    user_profile_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'idle', 'dnd', 'offline')) DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_profile_id ON message_reactions(user_profile_id);

CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_profile_id ON message_read_status(user_profile_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_user_status_status ON user_status(status);
CREATE INDEX IF NOT EXISTS idx_user_status_last_seen ON user_status(last_seen);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages (using user_profiles)
CREATE POLICY "Users can view messages they sent or received" ON messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert messages they send" ON messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update messages they sent" ON messages
    FOR UPDATE USING (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete messages they sent" ON messages
    FOR DELETE USING (
        sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions on accessible messages" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = message_reactions.message_id 
            AND (
                messages.sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
                messages.receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can add reactions" ON message_reactions
    FOR INSERT WITH CHECK (
        user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own reactions" ON message_reactions
    FOR DELETE USING (
        user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- RLS Policies for message_read_status
CREATE POLICY "Users can view read status of accessible messages" ON message_read_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = message_read_status.message_id 
            AND (
                messages.sender_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
                messages.receiver_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can mark messages as read" ON message_read_status
    FOR INSERT WITH CHECK (
        user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        participant_1_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        participant_2_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (
        participant_1_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid()) OR
        participant_2_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- RLS Policies for user_status
CREATE POLICY "Users can view all user statuses" ON user_status
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own status" ON user_status
    FOR INSERT WITH CHECK (
        user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own status record" ON user_status
    FOR UPDATE USING (
        user_profile_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_status_updated_at BEFORE UPDATE ON user_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create/update conversation when a message is sent
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update conversation
    INSERT INTO conversations (participant_1_id, participant_2_id, last_message_id, last_message_at)
    VALUES (
        LEAST(NEW.sender_id, NEW.receiver_id),
        GREATEST(NEW.sender_id, NEW.receiver_id),
        NEW.id,
        NEW.created_at
    )
    ON CONFLICT (participant_1_id, participant_2_id)
    DO UPDATE SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        updated_at = TIMEZONE('utc'::text, NOW());
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic conversation management
CREATE TRIGGER handle_new_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message();

-- Function to get conversation messages between two user profiles
CREATE OR REPLACE FUNCTION get_conversation_messages(user_profile_1_id UUID, user_profile_2_id UUID, limit_count INTEGER DEFAULT 50, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    receiver_id UUID,
    content TEXT,
    message_type TEXT,
    file_url TEXT,
    file_name TEXT,
    is_read BOOLEAN,
    is_edited BOOLEAN,
    edited_at TIMESTAMP WITH TIME ZONE,
    reply_to_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_username TEXT,
    sender_full_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.message_type,
        m.file_url,
        m.file_name,
        m.is_read,
        m.is_edited,
        m.edited_at,
        m.reply_to_id,
        m.created_at,
        p.username as sender_username,
        p.full_name as sender_full_name
    FROM messages m
    LEFT JOIN user_profiles p ON m.sender_id = p.id
    WHERE (m.sender_id = user_profile_1_id AND m.receiver_id = user_profile_2_id)
       OR (m.sender_id = user_profile_2_id AND m.receiver_id = user_profile_1_id)
    ORDER BY m.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ language 'plpgsql';

-- Drop the old functions and recreate with correct references
DROP FUNCTION IF EXISTS get_conversation_messages(UUID, UUID, INTEGER, INTEGER);

-- Function to get user profile conversations
CREATE OR REPLACE FUNCTION get_user_conversations(current_user_profile_id UUID)
RETURNS TABLE (
    conversation_id UUID,
    other_participant_id UUID,
    other_participant_username TEXT,
    other_participant_full_name TEXT,
    other_participant_avatar TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        CASE 
            WHEN c.participant_1_id = current_user_profile_id THEN c.participant_2_id
            ELSE c.participant_1_id
        END as other_participant_id,
        up.username as other_participant_username,
        up.full_name as other_participant_full_name,
        up.avatar_url as other_participant_avatar,
        m.content as last_message_content,
        c.last_message_at,
        COALESCE(unread.count, 0) as unread_count
    FROM conversations c
    LEFT JOIN user_profiles up ON (
        CASE 
            WHEN c.participant_1_id = current_user_profile_id THEN c.participant_2_id
            ELSE c.participant_1_id
        END = up.id
    )
    LEFT JOIN messages m ON c.last_message_id = m.id
    LEFT JOIN (
        SELECT 
            CASE 
                WHEN sender_id = current_user_profile_id THEN receiver_id
                ELSE sender_id
            END as other_id,
            COUNT(*) as count
        FROM messages msg
        WHERE (sender_id = current_user_profile_id OR receiver_id = current_user_profile_id)
        AND receiver_id = current_user_profile_id
        AND NOT EXISTS (
            SELECT 1 FROM message_read_status mrs 
            WHERE mrs.message_id = msg.id 
            AND mrs.user_profile_id = current_user_profile_id
        )
        GROUP BY other_id
    ) unread ON unread.other_id = CASE 
        WHEN c.participant_1_id = current_user_profile_id THEN c.participant_2_id
        ELSE c.participant_1_id
    END
    WHERE c.participant_1_id = current_user_profile_id OR c.participant_2_id = current_user_profile_id
    ORDER BY c.last_message_at DESC;
END;
$$ language 'plpgsql';
