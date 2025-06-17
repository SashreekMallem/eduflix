"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import {
  IoAdd,
  IoSearch,
  IoSend,
  IoPeople,
  IoSettings,
  IoBookOutline,
  IoPersonAdd,
  IoClose,
  IoEllipsisHorizontal,
  IoVideocam,
  IoMic,
  IoDocument,
  IoImage,
  IoLink,
  IoSchool
} from 'react-icons/io5';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  last_seen: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender: User;
  created_at: string;
  message_type: 'text' | 'image' | 'file' | 'video' | 'voice' | 'announcement' | 'system' | 'poll' | 'study_resource';
  reactions?: { emoji: string; count: number; users: string[] }[];
  replies?: Message[];
  is_deleted?: boolean;
  is_pinned?: boolean;
  reply_to_message_id?: string;
  file_url?: string;
  file_name?: string;
  metadata?: Record<string, unknown>;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  member_count: number;
  is_private: boolean;
  created_at: string;
  created_by: string;
  tags: string[];
  avatar_url?: string;
  active_members?: number;
  last_activity_at?: string;
  max_members?: number;
  is_active?: boolean;
}

export default function StudyGroupPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'joined' | 'discover' | 'trending'>('joined');
  const [discoveredGroups, setDiscoveredGroups] = useState<StudyGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);

  // Join group function (reusing friends invitation pattern)
  const joinGroup = async (groupId: string) => {
    if (!currentUser) return;

    try {
      const result = await supabase
        .rpc('join_study_group', {
          p_group_id: groupId,
          p_user_id: currentUser.id
        });

      if (result.data === 'JOINED') {
        // Group joined successfully, reload groups
        await loadStudyGroups(currentUser.id);
        await loadGroupSuggestions();
      } else if (result.data === 'INVITATION_SENT') {
        // Invitation sent, show message
        console.log('Invitation sent!');
      }
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };
  
  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  
  // Create group form
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    subject: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    is_private: false,
    tags: [] as string[]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load group suggestions (reusing friends suggestion pattern)
  const loadGroupSuggestions = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const { data: suggestions, error } = await supabase
        .rpc('suggest_study_groups_for_user', {
          p_user_id: currentUser.id,
          p_limit: 20
        });

      if (error) {
        console.error('Error loading group suggestions:', error);
        return;
      }

      // Transform suggestions to StudyGroup format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suggestedGroups: StudyGroup[] = suggestions?.map((suggestion: any) => ({
        id: suggestion.group_id,
        name: suggestion.group_name,
        description: suggestion.group_description,
        subject: suggestion.group_subject,
        difficulty: suggestion.group_difficulty || 'beginner',
        member_count: suggestion.member_count || 0,
        is_private: false,
        created_at: new Date().toISOString(),
        created_by: '',
        tags: [],
        active_members: 0
      })) || [];

      setDiscoveredGroups(suggestedGroups);
    } catch (error) {
      console.error('Error loading group suggestions:', error);
    }
  }, [currentUser]);

  const initializeStudyGroups = useCallback(async () => {
    try {
      // Get current user (reusing messenger pattern)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get user profile (reusing messenger pattern)
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userProfile) {
        setCurrentUser({
          id: user.id,
          username: userProfile.username,
          full_name: userProfile.full_name,
          avatar_url: undefined, // No avatar support yet
          status: 'online',
          last_seen: new Date().toISOString()
        });

        // Load study groups using auth user ID (reusing messenger pattern)
        await loadStudyGroups(user.id);
        
        // Load group suggestions for discovery (reusing friends pattern)
        await loadGroupSuggestions();
      }
    } catch (error) {
      console.error('Error initializing study groups:', error);
    } finally {
      setLoading(false);
    }
  }, [router, loadGroupSuggestions]);

  useEffect(() => {
    initializeStudyGroups();
    
    // Setup real-time subscriptions (reusing messenger pattern)
    const cleanup = setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeStudyGroups]);

  // Setup real-time subscriptions (reusing messenger pattern)
  const setupRealtimeSubscriptions = () => {
    if (!currentUser) return;

    // Subscribe to study group changes
    const groupSubscription = supabase
      .channel('study_groups')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'study_groups' },
        () => {
          // Reload groups when they change
          if (currentUser) loadStudyGroups(currentUser.id);
        }
      )
      .subscribe();

    // Subscribe to member changes
    const memberSubscription = supabase
      .channel('study_group_members')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'study_group_members' },
        () => {
          // Reload groups when membership changes
          if (currentUser) loadStudyGroups(currentUser.id);
        }
      )
      .subscribe();

    // Subscribe to new messages in current group
    let messageSubscription = null;
    if (currentGroup) {
      messageSubscription = supabase
        .channel(`group-messages-${currentGroup.id}`)
        .on('postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'study_group_messages',
            filter: `group_id=eq.${currentGroup.id}`
          },
          () => {
            // Reload messages when new message arrives
            loadGroupMessages(currentGroup.id);
          }
        )
        .subscribe();
    }

    return () => {
      groupSubscription.unsubscribe();
      memberSubscription.unsubscribe();
      if (messageSubscription) messageSubscription.unsubscribe();
    };
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load messages and members when group is selected (reusing messenger chat pattern)
  useEffect(() => {
    if (currentGroup) {
      loadGroupMessages(currentGroup.id);
      loadGroupMembers(currentGroup.id);
    } else {
      setMessages([]);
      setGroupMembers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroup]); // loadGroupMessages and loadGroupMembers are stable (useCallback)

  // Load suggestions when discover tab is selected (reusing friends pattern)
  useEffect(() => {
    if (activeTab === 'discover' && currentUser) {
      loadGroupSuggestions();
    }
  }, [activeTab, currentUser, loadGroupSuggestions]);

  // Load study groups from Supabase (reusing messenger conversation loading pattern)
  const loadStudyGroups = async (userId: string) => {
    try {
      // Get user's groups (similar to messenger's conversation loading)
      const { data: userGroups, error } = await supabase
        .from('study_group_members')
        .select(`
          study_groups (
            id,
            name,
            description,
            subject,
            difficulty,
            is_private,
            created_at,
            created_by,
            tags,
            avatar_url,
            member_count,
            last_activity_at
          )
        `)
        .eq('user_id', userId)
        .is('left_at', null)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user groups:', error);
        setStudyGroups([]);
        return;
      }

      if (!userGroups || userGroups.length === 0) {
        setStudyGroups([]);
        return;
      }

      // Transform the data and get additional info for each group (reusing messenger pattern)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groupsPromises = userGroups.map(async (userGroup: any) => {
        const group = userGroup.study_groups;
        if (!group) return null;

        try {
          // Get active members count (similar to messenger online status)
          const { data: activeMembers } = await supabase
            .from('study_group_members')
            .select('user_id')
            .eq('group_id', group.id)
            .is('left_at', null)
            .eq('status', 'active')
            .gte('last_active_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Active in last 24h

          const studyGroup: StudyGroup = {
            id: group.id,
            name: group.name,
            description: group.description,
            subject: group.subject,
            difficulty: group.difficulty,
            member_count: group.member_count,
            is_private: group.is_private,
            created_at: group.created_at,
            created_by: group.created_by,
            tags: group.tags || [],
            avatar_url: group.avatar_url,
            active_members: activeMembers?.length || 0
          };

          return studyGroup;
        } catch (error) {
          console.error('Error building group data:', group.name, error);
          return null;
        }
      });

      const groupsList = (await Promise.all(groupsPromises))
        .filter(group => group !== null) as StudyGroup[];
      
      // Sort by last activity (same pattern as messenger)
      groupsList.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setStudyGroups(groupsList);
    } catch (error) {
      console.error('Error loading study groups:', error);
      setStudyGroups([]);
    }
  };

  // Load messages for a specific group (reusing messenger chat pattern)
  const loadGroupMessages = useCallback(async (groupId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('study_group_messages')
        .select(`
          id,
          content,
          sender_id,
          message_type,
          created_at,
          is_deleted,
          is_pinned,
          reply_to_message_id,
          file_url,
          file_name,
          metadata
        `)
        .eq('group_id', groupId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Get sender profiles for messages (reusing messenger pattern)
      const senderIds = [...new Set(messagesData?.map(msg => msg.sender_id) || [])];
      
      if (senderIds.length > 0) {
        const { data: senderProfiles } = await supabase
          .from('user_profiles')
          .select('user_id, username, full_name')
          .in('user_id', senderIds);

        const senderMap = new Map(senderProfiles?.map(profile => [profile.user_id, profile]) || []);

        const transformedMessages: Message[] = messagesData?.map(msg => {
          const senderProfile = senderMap.get(msg.sender_id);
          const isCurrentUser = msg.sender_id === currentUser?.id;
          return {
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id,
            sender: {
              id: msg.sender_id,
              username: senderProfile?.username || 'Unknown',
              full_name: isCurrentUser ? 'You' : (senderProfile?.full_name || 'Unknown User'),
              avatar_url: undefined,
              status: 'offline',
              last_seen: new Date().toISOString()
            },
            created_at: msg.created_at,
            message_type: msg.message_type as 'text' | 'image' | 'file' | 'video' | 'voice' | 'announcement' | 'system' | 'poll' | 'study_resource'
          };
        }) || [];

        setMessages(transformedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading group messages:', error);
      setMessages([]);
    }
  }, [currentUser]);

  // Send message function (reusing messenger pattern)
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !currentGroup) return;

    try {
      const { error } = await supabase
        .from('study_group_messages')
        .insert({
          group_id: currentGroup.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Create group function (reusing friends invitation pattern)
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.name.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .rpc('create_study_group', {
          p_name: newGroupForm.name,
          p_description: newGroupForm.description,
          p_subject: newGroupForm.subject,
          p_difficulty: newGroupForm.difficulty,
          p_is_private: newGroupForm.is_private,
          p_max_members: 50,
          p_tags: newGroupForm.tags,
          p_creator_id: currentUser.id
        });

      if (error) {
        console.error('Error creating group:', error);
        return;
      }

      // Reload groups to show the new one
      await loadStudyGroups(currentUser.id);
      
      setShowCreateGroup(false);
      setNewGroupForm({
        name: '',
        description: '',
        subject: '',
        difficulty: 'beginner',
        is_private: false,
        tags: []
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Load group members (reusing messenger pattern)
  const loadGroupMembers = useCallback(async (groupId: string) => {
    try {
      // First, get the member data
      const { data: membersData, error: membersError } = await supabase
        .from('study_group_members')
        .select(`
          user_id,
          role,
          joined_at,
          last_active_at
        `)
        .eq('group_id', groupId)
        .eq('status', 'active')
        .is('left_at', null)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.error('Error loading group members:', membersError);
        return;
      }

      if (!membersData || membersData.length === 0) {
        setGroupMembers([]);
        return;
      }

      // Get user profile data for all members
      const userIds = membersData.map(member => member.user_id);
      console.log('Loading profiles for user IDs:', userIds);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username, full_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error loading member profiles:', profilesError);
        return;
      }

      console.log('Loaded profiles data:', profilesData);

      // Create a map of user profiles for easy lookup
      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

      // Transform the data to User format
      const members: User[] = membersData.map(member => {
        const profile = profilesMap.get(member.user_id);
        const isCurrentUser = member.user_id === currentUser?.id;
        return {
          id: member.user_id,
          username: profile?.username || 'Unknown',
          full_name: isCurrentUser ? 'You' : (profile?.full_name || 'Unknown User'),
          avatar_url: undefined, // No avatar support in current schema
          status: 'offline', // Will be updated with real status later
          last_seen: member.last_active_at || member.joined_at
        };
      });

      setGroupMembers(members);
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    }
  }, [currentUser]);

  // Handle member profile click
  const handleMemberClick = (member: User) => {
    // Navigate to their profile page
    router.push(`/profile/${member.username}`);
  };

  // Get filtered groups based on active tab (reusing messenger filtering pattern)
  const getFilteredGroups = () => {
    let groupsToFilter: StudyGroup[] = [];
    
    switch (activeTab) {
      case 'joined':
        groupsToFilter = studyGroups;
        break;
      case 'discover':
        groupsToFilter = discoveredGroups;
        break;
      case 'trending':
        // For trending, show public groups sorted by activity
        groupsToFilter = discoveredGroups.slice(0, 10);
        break;
      default:
        groupsToFilter = studyGroups;
    }

    return groupsToFilter.filter(group => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-600 bg-emerald-50';
      case 'intermediate': return 'text-amber-600 bg-amber-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-400';
      case 'idle': return 'bg-amber-400';
      case 'dnd': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header 
        currentPage="study-group" 
        pageIcon={<IoSchool className="w-4 h-4 text-white" />}
        pageTitle="Study Groups"
        currentUser={currentUser ? { profile: { full_name: currentUser.full_name } } : null}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          
          {/* Left Sidebar - Groups List */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl h-full flex flex-col">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <IoSchool className="mr-2 text-blue-600" />
                    Study Groups
                  </h2>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <IoAdd className="w-5 h-5" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mt-4 bg-gray-100 rounded-xl p-1">
                  {['joined', 'discover', 'trending'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as 'joined' | 'discover' | 'trending')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Groups List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {getFilteredGroups().length > 0 ? (
                  getFilteredGroups().map((group) => (
                    <motion.div
                      key={group.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => activeTab === 'joined' ? setCurrentGroup(group) : null}
                      className={`p-4 rounded-xl transition-all ${
                        activeTab === 'joined' && currentGroup?.id === group.id
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-md cursor-pointer'
                          : activeTab === 'joined'
                          ? 'bg-white/60 border border-gray-100 hover:bg-white/80 hover:shadow-md cursor-pointer'
                          : 'bg-white/60 border border-gray-100 hover:bg-white/80 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{group.name}</h3>
                        {activeTab === 'joined' ? (
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></div>
                            {group.active_members}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinGroup(group.id);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <IoPersonAdd className="w-3 h-3" />
                            <span>Join</span>
                          </button>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDifficultyColor(group.difficulty)}`}>
                          {group.difficulty}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <IoPeople className="w-3 h-3 mr-1" />
                          {group.member_count}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {group.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                            #{tag}
                          </span>
                        ))}
                        {group.tags.length > 2 && (
                          <span className="text-xs text-gray-400">+{group.tags.length - 2}</span>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <IoSchool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {activeTab === 'joined' ? 'No Study Groups Joined' : 
                       activeTab === 'discover' ? 'No Groups Found' : 
                       'No Trending Groups'}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {searchQuery ? 'Try adjusting your search terms' : 
                       activeTab === 'joined' ? 'Create your first study group to get started' :
                       'Check back later for group suggestions'}
                    </p>
                    {!searchQuery && activeTab === 'joined' && (
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                      >
                        Create Study Group
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl h-full flex flex-col">
              
              {/* Chat Header */}
              {currentGroup && (
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                        <IoBookOutline className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-800">{currentGroup.name}</h2>
                        <p className="text-sm text-gray-600">{currentGroup.member_count} members • {currentGroup.active_members} online</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IoVideocam className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IoMic className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IoSettings className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!currentGroup ? (
                  <div className="text-center py-20">
                    <IoBookOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Group Selected</h3>
                    <p className="text-gray-500 text-sm">Choose a study group to start chatting</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group"
                    >
                      <div className="flex space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {message.sender.full_name.charAt(0)}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(message.sender.status)} rounded-full border-2 border-white`}></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline space-x-2 mb-1">
                            <span className="font-semibold text-gray-800">{message.sender.full_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 rounded-2xl px-4 py-3 max-w-2xl">
                            <p className="text-gray-800">{message.content}</p>
                          </div>
                          
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex space-x-1 mt-2">
                              {message.reactions.map((reaction, idx) => (
                                <button
                                  key={idx}
                                  className="flex items-center space-x-1 px-2 py-1 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-xs text-gray-600">{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <IoEllipsisHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <IoPeople className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Messages Yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Be the first to start the conversation!</p>
                    <p className="text-gray-400 text-xs">Send a message below to get started</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IoDocument className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IoImage className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IoLink className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={`Message ${currentGroup?.name || 'group'}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                  >
                    <IoSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Members */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl h-full flex flex-col">
              
              {/* Members Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <IoPeople className="mr-2 text-blue-600" />
                    Members
                  </h3>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <IoPersonAdd className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Member Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-emerald-600">{currentGroup?.active_members || 0}</div>
                    <div className="text-xs text-emerald-600">Online</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-gray-600">{currentGroup?.member_count || 0}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentGroup && groupMembers.length > 0 ? (
                  groupMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleMemberClick(member)}
                      className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              alt={member.full_name} 
                              className="w-10 h-10 rounded-full object-cover" 
                            />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {member.full_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">{member.full_name}</div>
                        <div className="text-xs text-gray-500">@{member.username}</div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {new Date(member.last_seen).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))
                ) : !currentGroup ? (
                  <div className="text-center py-8">
                    <IoPeople className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No group selected</p>
                    <p className="text-gray-400 text-xs mt-1">Select a study group to see members</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IoPeople className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading members...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Create Study Group</h3>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter group name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newGroupForm.description}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Describe your study group..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={newGroupForm.subject}
                      onChange={(e) => setNewGroupForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={newGroupForm.difficulty}
                      onChange={(e) => setNewGroupForm(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newGroupForm.is_private}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, is_private: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="private" className="ml-2 text-sm text-gray-700">Private Group</label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
