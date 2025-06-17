-- ==============================================================================
-- EDUFLIX STUDY GROUPS REAL-TIME OPTIMIZED DATABASE SCHEMA
-- ==============================================================================
-- This schema supports:
-- 1. Real-time group management and discovery
-- 2. Scalable group messaging with reactions and replies
-- 3. Advanced member management with roles and permissions
-- 4. Group suggestion and trending algorithms
-- 5. Study session scheduling and resource sharing
-- 6. Activity tracking and analytics
-- 7. Search optimization and performance indexing
-- 8. Integration with existing messenger and friends systems
-- ==============================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS study_group_message_reactions CASCADE;
DROP TABLE IF EXISTS study_group_message_read_receipts CASCADE;
DROP TABLE IF EXISTS study_group_resources CASCADE;
DROP TABLE IF EXISTS study_group_sessions CASCADE;
DROP TABLE IF EXISTS study_group_invitations CASCADE;
DROP TABLE IF EXISTS study_group_suggestions CASCADE;
DROP TABLE IF EXISTS study_group_analytics CASCADE;
DROP TABLE IF EXISTS study_group_messages CASCADE;
DROP TABLE IF EXISTS study_group_members CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;

-- ==============================================================================
-- 1. STUDY GROUPS TABLE
-- ==============================================================================
-- Core study groups with metadata and configuration
CREATE TABLE study_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    description TEXT CHECK (char_length(description) <= 1000),
    subject TEXT NOT NULL CHECK (char_length(subject) >= 2 AND char_length(subject) <= 50),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    
    -- Privacy and access control
    is_private BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Group limits and settings
    max_members INTEGER DEFAULT 50 CHECK (max_members > 0 AND max_members <= 500),
    member_count INTEGER DEFAULT 0 CHECK (member_count >= 0),
    
    -- Creator and admin info
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    
    -- Content and branding
    avatar_url TEXT,
    cover_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Activity tracking
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_message_id UUID, -- Will reference study_group_messages(id)
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and visibility
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Study-specific fields
    study_schedule JSONB DEFAULT '{}'::jsonb, -- Weekly schedule, study sessions
    learning_objectives TEXT[],
    prerequisites TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 2. STUDY GROUP MEMBERS TABLE
-- ==============================================================================
-- Manages group membership with roles and permissions
CREATE TABLE study_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role and permissions
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')) DEFAULT 'member',
    permissions JSONB DEFAULT '{
        "can_invite": false,
        "can_kick": false,
        "can_moderate": false,
        "can_edit_group": false,
        "can_delete_messages": false,
        "can_pin_messages": false
    }'::jsonb,
    
    -- Membership status
    status TEXT NOT NULL CHECK (status IN ('active', 'muted', 'banned', 'left')) DEFAULT 'active',
    
    -- Activity tracking
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_read_message_id UUID, -- Will reference study_group_messages(id)
    last_read_at TIMESTAMP WITH TIME ZONE,
    
    -- Notification settings
    notification_settings JSONB DEFAULT '{
        "mentions": true,
        "all_messages": true,
        "group_updates": true,
        "member_joins": false,
        "session_reminders": true
    }'::jsonb,
    
    -- Study tracking
    study_streak INTEGER DEFAULT 0,
    total_study_hours DECIMAL(10,2) DEFAULT 0,
    contribution_score INTEGER DEFAULT 0,
    
    -- Membership dates
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    banned_at TIMESTAMP WITH TIME ZONE,
    banned_reason TEXT,
    banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique active membership per user per group
    CONSTRAINT unique_active_user_group UNIQUE (group_id, user_id),
    
    -- Constraints for banned members
    CONSTRAINT banned_member_check CHECK (
        (status != 'banned') OR 
        (status = 'banned' AND banned_at IS NOT NULL AND banned_by IS NOT NULL)
    )
);

-- ==============================================================================
-- 3. STUDY GROUP MESSAGES TABLE
-- ==============================================================================
-- Real-time messaging system for groups
CREATE TABLE study_group_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Message content and type
    content TEXT,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'file', 'video', 'voice', 'announcement', 'system', 'poll', 'study_resource')) DEFAULT 'text',
    
    -- File and media support
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER, -- File size in bytes
    file_type TEXT, -- MIME type
    thumbnail_url TEXT, -- For images/videos
    
    -- Message features
    reply_to_message_id UUID REFERENCES study_group_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pinned_at TIMESTAMP WITH TIME ZONE,
    
    -- Message status
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Study-specific features
    is_study_material BOOLEAN DEFAULT FALSE,
    study_tags TEXT[],
    
    -- Rich content support
    metadata JSONB, -- For polls, resources, rich embeds, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT content_required_for_text CHECK (
        (message_type != 'text') OR (message_type = 'text' AND content IS NOT NULL AND content != '')
    ),
    CONSTRAINT file_data_required_for_files CHECK (
        (message_type IN ('text', 'system', 'announcement', 'poll')) OR 
        (message_type NOT IN ('text', 'system', 'announcement', 'poll') AND file_url IS NOT NULL)
    ),
    CONSTRAINT pinned_message_check CHECK (
        (is_pinned = FALSE) OR 
        (is_pinned = TRUE AND pinned_by IS NOT NULL AND pinned_at IS NOT NULL)
    )
);

-- Add foreign key reference for last_message_id in study_groups
ALTER TABLE study_groups ADD CONSTRAINT fk_study_groups_last_message 
    FOREIGN KEY (last_message_id) REFERENCES study_group_messages(id) ON DELETE SET NULL;

-- Add foreign key reference for last_read_message_id in study_group_members
ALTER TABLE study_group_members ADD CONSTRAINT fk_members_last_read_message 
    FOREIGN KEY (last_read_message_id) REFERENCES study_group_messages(id) ON DELETE SET NULL;

-- ==============================================================================
-- 4. MESSAGE REACTIONS TABLE
-- ==============================================================================
-- Support for emoji reactions on group messages
CREATE TABLE study_group_message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES study_group_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL, -- emoji or reaction identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique reaction per user per message
    CONSTRAINT unique_user_message_group_reaction UNIQUE (message_id, user_id, reaction)
);

-- ==============================================================================
-- 5. MESSAGE READ RECEIPTS TABLE
-- ==============================================================================
-- Track message read status for group members
CREATE TABLE study_group_message_read_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES study_group_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique read receipt per user per message
    CONSTRAINT unique_user_message_group_read UNIQUE (message_id, user_id)
);

-- ==============================================================================
-- 6. STUDY GROUP INVITATIONS TABLE
-- ==============================================================================
-- Handle group invitations and join requests (reusing friends pattern)
CREATE TABLE study_group_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invitation type and status
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('direct_invite', 'join_request', 'admin_invite')) DEFAULT 'direct_invite',
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')) DEFAULT 'pending',
    
    -- Content
    message TEXT,
    
    -- Timestamps
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days') NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique pending invitation per user per group
    CONSTRAINT unique_pending_group_invitation UNIQUE (group_id, invitee_id, status)
    DEFERRABLE INITIALLY DEFERRED
);

-- ==============================================================================
-- 7. STUDY GROUP SUGGESTIONS TABLE
-- ==============================================================================
-- AI-powered group suggestions (reusing friends pattern)
CREATE TABLE study_group_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    
    -- Suggestion metadata
    compatibility_score DECIMAL(3,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
    suggestion_reasons TEXT[],
    algorithm_version TEXT DEFAULT 'v1.0',
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('active', 'dismissed', 'joined', 'expired')) DEFAULT 'active',
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '30 days') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique suggestion per user per group
    CONSTRAINT unique_user_group_suggestion UNIQUE (user_id, group_id)
);

-- ==============================================================================
-- 8. STUDY GROUP RESOURCES TABLE
-- ==============================================================================
-- Shared study materials and resources
CREATE TABLE study_group_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Resource metadata
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    description TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'video', 'link', 'presentation', 'quiz', 'assignment', 'note')),
    
    -- File information
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    thumbnail_url TEXT,
    
    -- Organization
    folder_path TEXT DEFAULT '/',
    tags TEXT[],
    
    -- Study metadata
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_study_time INTEGER, -- in minutes
    
    -- Access and status
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 9. STUDY SESSIONS TABLE
-- ==============================================================================
-- Scheduled study sessions for groups
CREATE TABLE study_group_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session details
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    description TEXT,
    session_type TEXT NOT NULL CHECK (session_type IN ('study', 'discussion', 'quiz', 'presentation', 'review', 'exam_prep')) DEFAULT 'study',
    
    -- Scheduling
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- For recurring sessions
    
    -- Virtual meeting info
    meeting_url TEXT,
    meeting_platform TEXT, -- zoom, teams, meet, etc.
    meeting_id TEXT,
    meeting_password TEXT,
    
    -- Limits and settings
    max_participants INTEGER,
    requires_signup BOOLEAN DEFAULT FALSE,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')) DEFAULT 'scheduled',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_session_time CHECK (end_time > start_time)
    -- Note: Future session time validation should be handled in application logic
);

-- ==============================================================================
-- 10. STUDY GROUP ANALYTICS TABLE
-- ==============================================================================
-- Track group activity and engagement metrics
CREATE TABLE study_group_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    
    -- Date for tracking
    date DATE NOT NULL,
    
    -- Activity metrics
    message_count INTEGER DEFAULT 0,
    active_member_count INTEGER DEFAULT 0,
    new_member_count INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    resource_upload_count INTEGER DEFAULT 0,
    
    -- Engagement metrics
    total_study_hours DECIMAL(10,2) DEFAULT 0,
    average_session_duration DECIMAL(10,2) DEFAULT 0,
    member_retention_rate DECIMAL(5,2),
    
    -- Generated metrics
    activity_score DECIMAL(10,2) DEFAULT 0,
    trending_score DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique analytics per group per date
    CONSTRAINT unique_group_date_analytics UNIQUE (group_id, date)
);

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================

-- Study Groups indexes
CREATE INDEX idx_study_groups_subject ON study_groups(subject);
CREATE INDEX idx_study_groups_difficulty ON study_groups(difficulty);
CREATE INDEX idx_study_groups_is_private ON study_groups(is_private);
CREATE INDEX idx_study_groups_is_active ON study_groups(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX idx_study_groups_last_activity ON study_groups(last_activity_at DESC);
CREATE INDEX idx_study_groups_member_count ON study_groups(member_count DESC);
CREATE INDEX idx_study_groups_featured ON study_groups(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_study_groups_tags ON study_groups USING gin(tags);
CREATE INDEX idx_study_groups_search ON study_groups USING gin(to_tsvector('english', name || ' ' || description || ' ' || subject));

-- Study Group Members indexes
CREATE INDEX idx_study_group_members_group_id ON study_group_members(group_id);
CREATE INDEX idx_study_group_members_user_id ON study_group_members(user_id);
CREATE INDEX idx_study_group_members_active ON study_group_members(group_id, user_id) WHERE status = 'active' AND left_at IS NULL;
CREATE INDEX idx_study_group_members_role ON study_group_members(role);
CREATE INDEX idx_study_group_members_last_active ON study_group_members(last_active_at DESC);
CREATE INDEX idx_study_group_members_joined_at ON study_group_members(joined_at DESC);

-- Messages indexes (optimized for real-time queries)
CREATE INDEX idx_study_group_messages_group_created ON study_group_messages(group_id, created_at DESC);
CREATE INDEX idx_study_group_messages_sender ON study_group_messages(sender_id);
CREATE INDEX idx_study_group_messages_undeleted ON study_group_messages(group_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_study_group_messages_pinned ON study_group_messages(group_id, pinned_at DESC) WHERE is_pinned = TRUE;
CREATE INDEX idx_study_group_messages_type ON study_group_messages(message_type);
CREATE INDEX idx_study_group_messages_reply_to ON study_group_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX idx_study_group_messages_search ON study_group_messages USING gin(to_tsvector('english', content)) WHERE content IS NOT NULL;

-- Message Reactions indexes
CREATE INDEX idx_study_group_reactions_message_id ON study_group_message_reactions(message_id);
CREATE INDEX idx_study_group_reactions_user_id ON study_group_message_reactions(user_id);

-- Message Read Receipts indexes
CREATE INDEX idx_study_group_read_receipts_message_id ON study_group_message_read_receipts(message_id);
CREATE INDEX idx_study_group_read_receipts_user_id ON study_group_message_read_receipts(user_id);

-- Invitations indexes
CREATE INDEX idx_study_group_invitations_group_id ON study_group_invitations(group_id);
CREATE INDEX idx_study_group_invitations_invitee_id ON study_group_invitations(invitee_id);
CREATE INDEX idx_study_group_invitations_inviter_id ON study_group_invitations(inviter_id);
CREATE INDEX idx_study_group_invitations_status ON study_group_invitations(status);
CREATE INDEX idx_study_group_invitations_pending ON study_group_invitations(invitee_id, status) WHERE status = 'pending';
CREATE INDEX idx_study_group_invitations_expires ON study_group_invitations(expires_at);

-- Suggestions indexes
CREATE INDEX idx_study_group_suggestions_user_id ON study_group_suggestions(user_id);
CREATE INDEX idx_study_group_suggestions_group_id ON study_group_suggestions(group_id);
CREATE INDEX idx_study_group_suggestions_active ON study_group_suggestions(user_id, compatibility_score DESC) WHERE status = 'active';
CREATE INDEX idx_study_group_suggestions_expires ON study_group_suggestions(expires_at);

-- Resources indexes
CREATE INDEX idx_study_group_resources_group_id ON study_group_resources(group_id);
CREATE INDEX idx_study_group_resources_uploader_id ON study_group_resources(uploader_id);
CREATE INDEX idx_study_group_resources_type ON study_group_resources(resource_type);
CREATE INDEX idx_study_group_resources_public ON study_group_resources(group_id, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX idx_study_group_resources_tags ON study_group_resources USING gin(tags);
CREATE INDEX idx_study_group_resources_search ON study_group_resources USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Sessions indexes
CREATE INDEX idx_study_group_sessions_group_id ON study_group_sessions(group_id);
CREATE INDEX idx_study_group_sessions_organizer_id ON study_group_sessions(organizer_id);
CREATE INDEX idx_study_group_sessions_start_time ON study_group_sessions(start_time);
CREATE INDEX idx_study_group_sessions_status ON study_group_sessions(status);
CREATE INDEX idx_study_group_sessions_upcoming ON study_group_sessions(group_id, start_time) WHERE status = 'scheduled';

-- Analytics indexes
CREATE INDEX idx_study_group_analytics_group_id ON study_group_analytics(group_id);
CREATE INDEX idx_study_group_analytics_date ON study_group_analytics(date DESC);
CREATE INDEX idx_study_group_analytics_trending ON study_group_analytics(trending_score DESC, date DESC);

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
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_members_updated_at BEFORE UPDATE ON study_group_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_messages_updated_at BEFORE UPDATE ON study_group_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_invitations_updated_at BEFORE UPDATE ON study_group_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_suggestions_updated_at BEFORE UPDATE ON study_group_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_resources_updated_at BEFORE UPDATE ON study_group_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_sessions_updated_at BEFORE UPDATE ON study_group_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_group_analytics_updated_at BEFORE UPDATE ON study_group_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- AUTOMATIC GROUP MANAGEMENT
-- ==============================================================================

-- Function to update group metadata when messages are sent
CREATE OR REPLACE FUNCTION handle_new_group_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update group's last message info
    UPDATE study_groups SET
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        last_activity_at = NEW.created_at,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.group_id;
    
    -- Update sender's last active time
    UPDATE study_group_members SET
        last_active_at = NEW.created_at,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE group_id = NEW.group_id AND user_id = NEW.sender_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update member count when members join/leave
CREATE OR REPLACE FUNCTION handle_group_membership_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- New member joined
        IF NEW.status = 'active' AND NEW.left_at IS NULL THEN
            UPDATE study_groups SET
                member_count = member_count + 1,
                last_activity_at = TIMEZONE('utc'::text, NOW()),
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = NEW.group_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Member status changed
        IF OLD.status = 'active' AND OLD.left_at IS NULL AND 
           (NEW.status != 'active' OR NEW.left_at IS NOT NULL) THEN
            -- Member left or was removed
            UPDATE study_groups SET
                member_count = member_count - 1,
                last_activity_at = TIMEZONE('utc'::text, NOW()),
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = NEW.group_id;
        ELSIF (OLD.status != 'active' OR OLD.left_at IS NOT NULL) AND 
              NEW.status = 'active' AND NEW.left_at IS NULL THEN
            -- Member rejoined
            UPDATE study_groups SET
                member_count = member_count + 1,
                last_activity_at = TIMEZONE('utc'::text, NOW()),
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = NEW.group_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Member record deleted
        IF OLD.status = 'active' AND OLD.left_at IS NULL THEN
            UPDATE study_groups SET
                member_count = member_count - 1,
                last_activity_at = TIMEZONE('utc'::text, NOW()),
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = OLD.group_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for automatic group management
CREATE TRIGGER handle_new_group_message_trigger
    AFTER INSERT ON study_group_messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_group_message();

CREATE TRIGGER handle_group_membership_trigger
    AFTER INSERT OR UPDATE OR DELETE ON study_group_members
    FOR EACH ROW
    EXECUTE FUNCTION handle_group_membership_change();

-- ==============================================================================
-- REAL-TIME HELPER FUNCTIONS (REUSING MESSENGER/FRIENDS PATTERNS)
-- ==============================================================================

-- Function to create a study group
CREATE OR REPLACE FUNCTION create_study_group(
    p_name TEXT,
    p_description TEXT,
    p_subject TEXT,
    p_difficulty TEXT DEFAULT 'beginner',
    p_is_private BOOLEAN DEFAULT FALSE,
    p_max_members INTEGER DEFAULT 50,
    p_tags TEXT[] DEFAULT '{}',
    p_creator_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    group_id UUID;
    creator_user_id UUID;
BEGIN
    -- Use provided creator_id or get from auth context
    creator_user_id := COALESCE(p_creator_id, auth.uid());
    
    IF creator_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- Create the study group
    INSERT INTO study_groups (
        name, description, subject, difficulty, is_private, max_members, tags, created_by
    ) VALUES (
        p_name, p_description, p_subject, p_difficulty, p_is_private, p_max_members, p_tags, creator_user_id
    ) RETURNING id INTO group_id;
    
    -- Add creator as owner
    INSERT INTO study_group_members (
        group_id, user_id, role, permissions, status
    ) VALUES (
        group_id, creator_user_id, 'owner', '{
            "can_invite": true,
            "can_kick": true,
            "can_moderate": true,
            "can_edit_group": true,
            "can_delete_messages": true,
            "can_pin_messages": true
        }'::jsonb, 'active'
    );
    
    RETURN group_id;
END;
$$ language 'plpgsql';

-- Function to join a study group (reusing friends invitation pattern)
CREATE OR REPLACE FUNCTION join_study_group(
    p_group_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    group_record RECORD;
    existing_member_id UUID;
    pending_invitation_id UUID;
    current_user_id UUID;
BEGIN
    -- Use provided user_id or get from auth context
    current_user_id := COALESCE(p_user_id, auth.uid());
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- Get group info
    SELECT * INTO group_record FROM study_groups WHERE id = p_group_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found or inactive';
    END IF;
    
    -- Check if user is already a member
    SELECT id INTO existing_member_id 
    FROM study_group_members 
    WHERE group_id = p_group_id AND user_id = current_user_id AND status = 'active' AND left_at IS NULL;
    
    IF existing_member_id IS NOT NULL THEN
        RETURN 'ALREADY_MEMBER';
    END IF;
    
    -- Check member limit
    IF group_record.member_count >= group_record.max_members THEN
        RETURN 'GROUP_FULL';
    END IF;
    
    -- Check if there's a pending invitation
    SELECT id INTO pending_invitation_id
    FROM study_group_invitations
    WHERE group_id = p_group_id AND invitee_id = current_user_id AND status = 'pending'
    AND expires_at > TIMEZONE('utc'::text, NOW());
    
    IF pending_invitation_id IS NOT NULL THEN
        -- Accept the invitation
        UPDATE study_group_invitations SET
            status = 'accepted',
            responded_at = TIMEZONE('utc'::text, NOW())
        WHERE id = pending_invitation_id;
        
        -- Add as member
        INSERT INTO study_group_members (group_id, user_id, role, status)
        VALUES (p_group_id, current_user_id, 'member', 'active');
        
        RETURN 'JOINED';
    END IF;
    
    -- For private groups, create join request
    IF group_record.is_private OR group_record.requires_approval THEN
        -- Check for existing join request
        IF EXISTS (
            SELECT 1 FROM study_group_invitations
            WHERE group_id = p_group_id AND invitee_id = current_user_id 
            AND invitation_type = 'join_request' AND status = 'pending'
        ) THEN
            RETURN 'REQUEST_PENDING';
        END IF;
        
        -- Create join request
        INSERT INTO study_group_invitations (
            group_id, inviter_id, invitee_id, invitation_type, status
        ) VALUES (
            p_group_id, current_user_id, current_user_id, 'join_request', 'pending'
        );
        
        RETURN 'REQUEST_SENT';
    ELSE
        -- Public group, join directly
        INSERT INTO study_group_members (group_id, user_id, role, status)
        VALUES (p_group_id, current_user_id, 'member', 'active');
        
        RETURN 'JOINED';
    END IF;
END;
$$ language 'plpgsql';

-- Function to suggest study groups for a user (reusing friends suggestion pattern)
CREATE OR REPLACE FUNCTION suggest_study_groups_for_user(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    group_id UUID,
    group_name TEXT,
    group_description TEXT,
    group_subject TEXT,
    group_difficulty TEXT,
    member_count INTEGER,
    compatibility_score DECIMAL,
    suggestion_reasons TEXT[]
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Use provided user_id or get from auth context
    current_user_id := COALESCE(p_user_id, auth.uid());
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    RETURN QUERY
    SELECT 
        sg.id,
        sg.name,
        sg.description,
        sg.subject,
        sg.difficulty,
        sg.member_count,
        ROUND((RANDOM() * 0.5 + 0.5)::NUMERIC, 2) AS compatibility_score, -- Simplified scoring for now
        ARRAY['Similar interests', 'Active community']::TEXT[] AS suggestion_reasons
    FROM study_groups sg
    WHERE sg.is_active = TRUE
    AND sg.is_private = FALSE
    AND sg.id NOT IN (
        -- Exclude groups user is already in
        SELECT sgm.group_id 
        FROM study_group_members sgm 
        WHERE sgm.user_id = current_user_id AND sgm.status = 'active' AND sgm.left_at IS NULL
    )
    AND sg.id NOT IN (
        -- Exclude groups with pending invitations
        SELECT sgi.group_id
        FROM study_group_invitations sgi
        WHERE sgi.invitee_id = current_user_id AND sgi.status = 'pending'
    )
    AND sg.member_count < sg.max_members
    ORDER BY sg.last_activity_at DESC, sg.member_count DESC
    LIMIT p_limit;
END;
$$ language 'plpgsql';

-- Function to get unread message count for a user in a group
CREATE OR REPLACE FUNCTION get_group_unread_count(p_group_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    last_read_message_created_at TIMESTAMP WITH TIME ZONE;
    unread_count INTEGER;
BEGIN
    -- Get the timestamp of the last read message
    SELECT m.created_at INTO last_read_message_created_at
    FROM study_group_members sgm
    LEFT JOIN study_group_messages m ON sgm.last_read_message_id = m.id
    WHERE sgm.group_id = p_group_id AND sgm.user_id = p_user_id;
    
    -- Count messages after the last read message
    SELECT COUNT(*) INTO unread_count
    FROM study_group_messages
    WHERE group_id = p_group_id
    AND sender_id != p_user_id
    AND is_deleted = FALSE
    AND (last_read_message_created_at IS NULL OR created_at > last_read_message_created_at);
    
    RETURN COALESCE(unread_count, 0);
END;
$$ language 'plpgsql';

-- Function to mark group messages as read
CREATE OR REPLACE FUNCTION mark_group_messages_as_read(
    p_group_id UUID, 
    p_user_id UUID DEFAULT NULL, 
    p_up_to_message_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    target_message_id UUID;
    target_created_at TIMESTAMP WITH TIME ZONE;
    current_user_id UUID;
BEGIN
    -- Use provided user_id or get from auth context
    current_user_id := COALESCE(p_user_id, auth.uid());
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found';
    END IF;
    
    -- If no specific message provided, use the latest message in group
    IF p_up_to_message_id IS NULL THEN
        SELECT id, created_at INTO target_message_id, target_created_at
        FROM study_group_messages
        WHERE group_id = p_group_id
        AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT 1;
    ELSE
        SELECT id, created_at INTO target_message_id, target_created_at
        FROM study_group_messages
        WHERE id = p_up_to_message_id;
    END IF;
    
    IF target_message_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Insert read receipts for unread messages
    INSERT INTO study_group_message_read_receipts (message_id, user_id)
    SELECT m.id, current_user_id
    FROM study_group_messages m
    WHERE m.group_id = p_group_id
    AND m.created_at <= target_created_at
    AND m.sender_id != current_user_id
    AND m.is_deleted = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM study_group_message_read_receipts sgmrr
        WHERE sgmrr.message_id = m.id AND sgmrr.user_id = current_user_id
    );
    
    -- Update member's last read message
    UPDATE study_group_members SET
        last_read_message_id = target_message_id,
        last_read_at = TIMEZONE('utc'::text, NOW())
    WHERE group_id = p_group_id AND user_id = current_user_id;
END;
$$ language 'plpgsql';

-- Function to get trending study groups
CREATE OR REPLACE FUNCTION get_trending_study_groups(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    group_id UUID,
    group_name TEXT,
    group_description TEXT,
    group_subject TEXT,
    group_difficulty TEXT,
    member_count INTEGER,
    activity_score DECIMAL,
    trending_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sg.id,
        sg.name,
        sg.description,
        sg.subject,
        sg.difficulty,
        sg.member_count,
        COALESCE(sga.activity_score, 0) AS activity_score,
        COALESCE(sga.trending_score, 0) AS trending_score
    FROM study_groups sg
    LEFT JOIN study_group_analytics sga ON sg.id = sga.group_id 
        AND sga.date = CURRENT_DATE
    WHERE sg.is_active = TRUE
    AND sg.is_private = FALSE
    ORDER BY 
        COALESCE(sga.trending_score, 0) DESC,
        sg.member_count DESC,
        sg.last_activity_at DESC
    LIMIT p_limit;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- CLEANUP FUNCTIONS
-- ==============================================================================

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_group_invitations()
RETURNS VOID AS $$
BEGIN
    UPDATE study_group_invitations SET
        status = 'expired',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE status = 'pending' 
    AND expires_at < TIMEZONE('utc'::text, NOW());
END;
$$ language 'plpgsql';

-- Function to clean up expired suggestions
CREATE OR REPLACE FUNCTION cleanup_expired_group_suggestions()
RETURNS VOID AS $$
BEGIN
    UPDATE study_group_suggestions SET
        status = 'expired',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE status = 'active'
    AND expires_at < TIMEZONE('utc'::text, NOW());
END;
$$ language 'plpgsql';

-- ==============================================================================
-- REAL-TIME OPTIMIZATIONS
-- ==============================================================================

-- Enable real-time for all tables (you'll need to enable this in Supabase dashboard)
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_groups;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_message_reactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_message_read_receipts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_invitations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_suggestions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_resources;
-- ALTER PUBLICATION supabase_realtime ADD TABLE study_group_sessions;

-- ==============================================================================
-- SAMPLE DATA (OPTIONAL - for testing)
-- ==============================================================================

-- Note: Uncomment these if you want sample data for testing
-- Replace user IDs with actual authenticated user IDs from your system

/*
-- Sample study groups
INSERT INTO study_groups (name, description, subject, difficulty, created_by, tags) VALUES
('Advanced React Patterns', 'Deep dive into React hooks, context, and performance optimization', 'Programming', 'advanced', 'user-id-1', ARRAY['react', 'javascript', 'frontend']),
('Calculus Study Group', 'Weekly calculus problem solving sessions', 'Mathematics', 'intermediate', 'user-id-2', ARRAY['calculus', 'math', 'problem-solving']),
('AI/ML Fundamentals', 'Learn the basics of artificial intelligence and machine learning', 'Computer Science', 'beginner', 'user-id-3', ARRAY['ai', 'ml', 'python']);

-- Sample group members (replace with actual user IDs)
INSERT INTO study_group_members (group_id, user_id, role, status) VALUES
((SELECT id FROM study_groups WHERE name = 'Advanced React Patterns'), 'user-id-2', 'member', 'active'),
((SELECT id FROM study_groups WHERE name = 'Calculus Study Group'), 'user-id-1', 'member', 'active'),
((SELECT id FROM study_groups WHERE name = 'Calculus Study Group'), 'user-id-3', 'member', 'active');

-- Sample messages
INSERT INTO study_group_messages (group_id, sender_id, content, message_type) VALUES
((SELECT id FROM study_groups WHERE name = 'Advanced React Patterns'), 'user-id-1', 'Welcome to our React study group! Let''s start with hooks.', 'text'),
((SELECT id FROM study_groups WHERE name = 'Calculus Study Group'), 'user-id-2', 'Today we''ll work on integration by parts', 'text');
*/

-- ==============================================================================
-- MIGRATION: Fix existing member counts
-- ==============================================================================
-- Run this after applying the schema to fix any existing groups with incorrect member counts

-- Update member counts to reflect actual active members
UPDATE study_groups 
SET member_count = (
    SELECT COUNT(*) 
    FROM study_group_members 
    WHERE study_group_members.group_id = study_groups.id 
    AND status = 'active' 
    AND left_at IS NULL
);

-- ==============================================================================
