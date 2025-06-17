# Study Groups Implementation Plan - Reusing Existing Patterns

## Overview
This document outlines how to implement the study groups feature by reusing proven patterns from the existing messenger, messenger chat, and friends systems in EduFlix.

## Reusable Components and Patterns

### 1. From Messenger Page (`/messenger/page.tsx`)

#### **Reusable UI Components:**
- **Tab Navigation** → Adapt for (Joined Groups/Discover/Trending)
- **Search Bar** → For finding groups by name/subject/tags
- **Card Layout** → Group cards instead of conversation cards
- **Status Indicators** → Group activity status (active/idle)
- **Empty States** → No groups joined/discovered
- **Filter System** → All/Unread/Favorites → All/Recent/Bookmarked

#### **Reusable Logic:**
```typescript
// From messenger: Real-time subscriptions pattern
const setupRealtimeSubscriptions = () => {
  // Adapt for study groups
  const groupSubscription = supabase
    .channel('study_groups')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'study_groups' },
      () => loadStudyGroups()
    )
    .subscribe();
    
  const memberSubscription = supabase
    .channel('study_group_members')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'study_group_members' },
      () => loadUserGroups()
    )
    .subscribe();
};

// From messenger: Search and filter logic
const getFilteredGroups = () => {
  let filtered = studyGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  switch (activeTab) {
    case 'unread':
      filtered = filtered.filter(group => group.unread_count > 0);
      break;
    case 'bookmarked':
      filtered = filtered.filter(group => group.is_bookmarked);
      break;
  }

  return filtered;
};

// From messenger: Time formatting (can reuse directly)
const formatTime = (timestamp: string) => {
  // Same logic from messenger
};

// From messenger: Status indicators (adapt for group activity)
const getGroupActivityStatus = (lastActivity: string) => {
  const diffInHours = (new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
  if (diffInHours < 1) return 'active';
  if (diffInHours < 24) return 'recent';
  if (diffInHours < 168) return 'idle';
  return 'inactive';
};
```

### 2. From Messenger Chat (`/messenger/[friendName]/page.tsx`)

#### **Reusable UI Components:**
- **Message Bubbles** → Group chat messages
- **Message Input** → Group message composer
- **File Upload** → Group resource sharing
- **User Avatar Grid** → Group member list
- **Typing Indicators** → Multiple users typing
- **Message Actions** → React/Reply/Pin for group messages

#### **Reusable Logic:**
```typescript
// From messenger chat: Message handling (adapt for group chat)
const sendGroupMessage = async (groupId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('study_group_messages')
      .insert({
        group_id: groupId,
        sender_id: currentUser.id,
        content: content,
        message_type: 'text'
      });

    if (error) throw error;
    // Real-time will update automatically
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// From messenger chat: Real-time message subscription (adapt for groups)
const subscribeToGroupMessages = (groupId: string) => {
  return supabase
    .channel(`group-messages-${groupId}`)
    .on('postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'study_group_messages',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      }
    )
    .subscribe();
};

// From messenger chat: File upload handling (reuse directly)
const handleFileUpload = async (file: File, groupId: string) => {
  // Same logic, but upload to study-group-files bucket
  const filePath = `${groupId}/${currentUser.id}/${file.name}`;
  // Upload and create message with file_url
};
```

### 3. From Friends Page (`/friends/page.tsx`)

#### **Reusable UI Components:**
- **Premium Card Design** → Group cards with gradients and animations
- **Invitation Cards** → Group invitation system
- **Action Dropdowns** → Group management options
- **Search Interface** → Group discovery
- **Suggestion Algorithm** → Recommended groups
- **Modal Forms** → Create group modal

#### **Reusable Logic:**
```typescript
// From friends: Invitation system (adapt for group invitations)
const sendGroupInvitation = async (groupId: string, inviteeId: string, message?: string) => {
  try {
    const { data, error } = await supabase
      .from('study_group_invitations')
      .insert({
        group_id: groupId,
        inviter_id: currentUser.id,
        invitee_id: inviteeId,
        message: message
      });

    if (error) throw error;
    // Show success message
  } catch (error) {
    console.error('Error sending invitation:', error);
  }
};

// From friends: Accept invitation logic (adapt for groups)
const acceptGroupInvitation = async (invitationId: string) => {
  try {
    // Update invitation status
    const { error: inviteError } = await supabase
      .from('study_group_invitations')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (inviteError) throw inviteError;

    // Add user to group members
    const invitation = await supabase
      .from('study_group_invitations')
      .select('group_id, invitee_id')
      .eq('id', invitationId)
      .single();

    if (invitation.data) {
      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: invitation.data.group_id,
          user_id: invitation.data.invitee_id,
          role: 'member'
        });

      if (memberError) throw memberError;
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
  }
};

// From friends: Search and discovery (adapt for groups)
const searchGroups = async (query: string, filters: any) => {
  let baseQuery = supabase
    .from('study_groups')
    .select(`
      *,
      study_group_members!inner(count)
    `)
    .eq('is_private', false);

  if (query) {
    baseQuery = baseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (filters.subject) {
    baseQuery = baseQuery.eq('subject', filters.subject);
  }

  if (filters.difficulty) {
    baseQuery = baseQuery.eq('difficulty', filters.difficulty);
  }

  const { data, error } = await baseQuery.order('last_activity_at', { ascending: false });
  
  return data || [];
};

// From friends: Suggestion algorithm (adapt for group recommendations)
const getGroupSuggestions = async () => {
  try {
    const { data, error } = await supabase
      .rpc('suggest_study_groups_for_user', {
        p_user_id: currentUser.id,
        p_limit: 10
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting group suggestions:', error);
    return [];
  }
};
```

## Component Structure Reuse

### StudyGroupCard Component (adapted from FriendCard)
```typescript
const StudyGroupCard = ({ 
  group, 
  onJoin, 
  onLeave, 
  onChat,
  isDropdownOpen, 
  onToggleDropdown 
}: StudyGroupCardProps) => {
  // Same premium card design from friends
  // Adapt content for group info (member count, activity, subject)
  // Reuse dropdown menu pattern
  // Reuse hover animations and gradient backgrounds
};
```

### StudyGroupChat Component (adapted from messenger chat)
```typescript
const StudyGroupChat = ({ groupId }: { groupId: string }) => {
  // Reuse message bubble components
  // Adapt for multiple users (show avatars in group messages)
  // Reuse typing indicators (show multiple users typing)
  // Reuse file upload and media handling
  // Add group-specific features (pin messages, member mentions)
};
```

### GroupInvitationCard Component (adapted from friend invitation)
```typescript
const GroupInvitationCard = ({ 
  invitation, 
  onAccept, 
  onDecline 
}: GroupInvitationCardProps) => {
  // Same card design from friends invitations
  // Adapt content to show group info instead of user info
  // Reuse accept/decline action buttons
  // Reuse animation patterns
};
```

## Database Integration Patterns

### Real-time Subscriptions (reuse pattern)
```typescript
// Same pattern from messenger/friends, adapted for study groups
const useStudyGroupSubscriptions = (currentUser: User) => {
  useEffect(() => {
    if (!currentUser) return;

    const subscriptions = [
      // Group updates
      supabase.channel('study_groups').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'study_groups' },
        handleGroupUpdate
      ),
      
      // Member changes
      supabase.channel('study_group_members').on('postgres_changes',
        { event: '*', schema: 'public', table: 'study_group_members' },
        handleMemberUpdate
      ),
      
      // Message updates
      supabase.channel('study_group_messages').on('postgres_changes',
        { event: '*', schema: 'public', table: 'study_group_messages' },
        handleMessageUpdate
      ),
      
      // Invitation updates
      supabase.channel('study_group_invitations').on('postgres_changes',
        { event: '*', schema: 'public', table: 'study_group_invitations' },
        handleInvitationUpdate
      )
    ];

    subscriptions.forEach(sub => sub.subscribe());

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [currentUser]);
};
```

## UI/UX Patterns to Reuse

### 1. Loading States
- Reuse skeleton loaders from messenger
- Reuse spinner animations from friends
- Reuse error state handling

### 2. Empty States
- Reuse empty conversation designs
- Adapt messaging for "No groups joined" / "No groups found"
- Reuse call-to-action button patterns

### 3. Modal Patterns
- Reuse modal animations from friends
- Adapt friend search modal → group discovery modal
- Reuse form validation patterns

### 4. Premium Visual Design
- Reuse gradient backgrounds
- Reuse card hover effects and animations
- Reuse status indicators and badges
- Reuse typography hierarchy

## Implementation Order

1. **Study Groups List Page** (reuse messenger list patterns)
2. **Group Discovery** (reuse friends search/suggestions)
3. **Group Chat** (reuse messenger chat)
4. **Group Management** (reuse friends invitation system)
5. **Group Creation** (reuse friends modal patterns)

## Key Benefits of This Approach

1. **Consistent UX** - Users familiar with messenger/friends will intuitively understand study groups
2. **Proven Patterns** - Reusing tested real-time subscriptions and UI patterns
3. **Faster Development** - Adapting existing components instead of building from scratch
4. **Maintainable Code** - Consistent patterns across the app
5. **Performance** - Reusing optimized queries and subscription patterns

This approach ensures the study groups feature feels native to the EduFlix ecosystem while leveraging all the proven patterns from existing features.
