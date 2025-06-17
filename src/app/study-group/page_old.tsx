"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
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
  IoSchool,
  IoCheckmarkDone,
  IoCheckmark,
  IoCall,
  IoHeart,
  IoStarOutline,
  IoTime,
  IoNotifications,
  IoNotificationsOff,
  IoExit,
  IoShareOutline,
  IoBookmark,
  IoBookmarkOutline,
  IoFilter,
  IoChatbubble,
  IoTrendingUp,
  IoFlash,
  IoRocket
} from 'react-icons/io5';
import {
  HiSparkles,
  HiLightningBolt,
  HiTrendingUp as HiTrendingUpOld,
  HiAcademicCap,
  HiChat,
  HiDotsHorizontal,
  HiChatAlt2,
  HiUserGroup,
  HiUsers,
  HiBadgeCheck,
  HiFire,
  HiStar
} from 'react-icons/hi';

// Interfaces (reusing patterns from messenger and friends)
interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  last_seen: string;
  current_status?: string;
  skills?: string[];
  career_goals?: string[];
}

interface StudyGroupMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_active_at: string;
  permissions: {
    can_invite: boolean;
    can_kick: boolean;
    can_mute: boolean;
    can_manage_resources: boolean;
    can_pin_messages: boolean;
    can_create_events: boolean;
  };
  user_profile: User;
}

interface StudyGroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'announcement' | 'system';
  file_url?: string;
  file_name?: string;
  reply_to_message_id?: string;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender_profile: User;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  member_count: number;
  is_private: boolean;
  auto_accept_requests: boolean;
  last_activity_at: string;
  created_at: string;
  created_by: string;
  tags: string[];
  avatar_url?: string;
  banner_url?: string;
  is_premium: boolean;
  // Computed properties
  unread_count?: number;
  user_role?: string;
  is_bookmarked?: boolean;
  activity_status?: 'active' | 'recent' | 'idle' | 'inactive';
}

interface StudyGroupInvitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  group: StudyGroup;
  inviter_profile: User;
}

interface GroupSuggestion {
  group_id: string;
  group_name: string;
  group_description: string;
  group_subject: string;
  compatibility_score: number;
  shared_interests?: string[];
  member_count?: number;
  activity_level?: string;
}

export default function StudyGroupPage() {
  const router = useRouter();
  
  // State management (reusing messenger patterns)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<StudyGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<StudyGroupMember[]>([]);
  const [messages, setMessages] = useState<StudyGroupMessage[]>([]);
  const [groupInvitations, setGroupInvitations] = useState<StudyGroupInvitation[]>([]);
  const [groupSuggestions, setGroupSuggestions] = useState<GroupSuggestion[]>([]);
  
  // UI state (reusing messenger/friends patterns)
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Tab management (reusing messenger tab pattern)
  const [activeTab, setActiveTab] = useState<'joined' | 'discover' | 'trending'>('joined');
  const [groupTab, setGroupTab] = useState<'chat' | 'members' | 'resources' | 'analytics'>('chat');
  
  // Modals and dropdowns (reusing friends patterns)
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
  
  // Create group form (enhanced from original)
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    subject: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    is_private: false,
    auto_accept_requests: true,
    max_members: 50,
    tags: [] as string[]
  });

  // Utility functions (reusing messenger patterns)
  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'idle': return 'bg-yellow-400';
      case 'dnd': return 'bg-red-400';
      default: return 'bg-gray-300';
    }
  }, []);

  const getActivityStatus = useCallback((lastActivity: string) => {
    const diffInHours = (new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'active';
    if (diffInHours < 24) return 'recent';
    if (diffInHours < 168) return 'idle';
    return 'inactive';
  }, []);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // Real-time subscriptions (reusing messenger patterns)
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!currentUser) return;

    const subscriptions = [
      // Group updates
      supabase
        .channel('study_groups')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'study_groups' },
          () => {
            loadStudyGroups();
          }
        )
        .subscribe(),
      
      // Member changes  
      supabase
        .channel('study_group_members')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'study_group_members' },
          () => {
            loadStudyGroups();
            if (currentGroup) {
              loadGroupMembers(currentGroup.id);
            }
          }
        )
        .subscribe(),
      
      // Message updates
      supabase
        .channel('study_group_messages')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'study_group_messages' },
          (payload) => {
            if (currentGroup && payload.new && (payload.new as any).group_id === currentGroup.id) {
              loadGroupMessages(currentGroup.id);
            }
          }
        )
        .subscribe(),
      
      // Invitation updates
      supabase
        .channel('study_group_invitations')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'study_group_invitations' },
          () => {
            loadGroupInvitations();
          }
        )
        .subscribe()
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [currentUser, currentGroup]);

  // Filter and search functions (reusing messenger/friends patterns)
  const getFilteredGroups = useCallback(() => {
    let filtered = studyGroups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    switch (activeTab) {
      case 'joined':
        filtered = filtered.filter(group => group.user_role);
        break;
      case 'discover':
        filtered = filtered.filter(group => !group.user_role && !group.is_private);
        break;
      case 'trending':
        filtered = filtered
          .filter(group => !group.user_role && !group.is_private)
          .sort((a, b) => {
            const aActivity = getActivityStatus(a.last_activity_at);
            const bActivity = getActivityStatus(b.last_activity_at);
            const activityScore = { active: 4, recent: 3, idle: 2, inactive: 1 };
            return (activityScore[bActivity] || 0) - (activityScore[aActivity] || 0);
          });
        break;
      default:
        break;
    }

    return filtered;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Data loading functions (reusing messenger/friends patterns)
  const loadStudyGroups = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      // TODO: Replace with actual Supabase queries
      // For now, using placeholder data with the expected structure
      setStudyGroups([]);
    } catch (error) {
      console.error('Error loading study groups:', error);
      setStudyGroups([]);
    }
  }, [currentUser]);

  const loadGroupMembers = useCallback(async (groupId: string) => {
    try {
      // TODO: Load group members from Supabase
      setGroupMembers([]);
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembers([]);
    }
  }, []);

  const loadGroupMessages = useCallback(async (groupId: string) => {
    try {
      // TODO: Load group messages from Supabase
      setMessages([]);
    } catch (error) {
      console.error('Error loading group messages:', error);
      setMessages([]);
    }
  }, []);

  const loadGroupInvitations = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      // TODO: Load group invitations from Supabase
      setGroupInvitations([]);
    } catch (error) {
      console.error('Error loading group invitations:', error);
      setGroupInvitations([]);
    }
  }, [currentUser]);

  const loadGroupSuggestions = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      // TODO: Load group suggestions from Supabase
      setGroupSuggestions([]);
    } catch (error) {
      console.error('Error loading group suggestions:', error);
      setGroupSuggestions([]);
    }
  }, [currentUser]);

  const initializeStudyGroups = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get user profile
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
          avatar_url: userProfile.avatar_url,
          status: 'online',
          last_seen: new Date().toISOString()
        });

        // Load study groups
        await loadStudyGroups();
      }
    } catch (error) {
      console.error('Error initializing study groups:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    initializeStudyGroups();
  }, [initializeStudyGroups]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load study groups from Supabase
  const loadStudyGroups = async () => {
    try {
      // TODO: Replace with actual Supabase query
      // const { data: userGroups } = await supabase
      //   .from('study_group_members')
      //   .select(`
      //     study_groups (
      //       id,
      //       name,
      //       description,
      //       subject,
      //       difficulty,
      //       is_private,
      //       created_at,
      //       created_by,
      //       tags,
      //       avatar_url
      //     )
      //   `)
      //   .eq('user_id', currentUser?.id);

      // For now, set empty arrays until backend is ready
      setStudyGroups([]);
      setMessages([]);
    } catch (error) {
      console.error('Error loading study groups:', error);
      setStudyGroups([]);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !currentGroup) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender_id: currentUser.id,
      sender: currentUser,
      created_at: new Date().toISOString(),
      message_type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.name.trim() || !currentUser) return;

    const newGroup: StudyGroup = {
      id: Date.now().toString(),
      ...newGroupForm,
      member_count: 1,
      created_at: new Date().toISOString(),
      created_by: currentUser.id,
      active_members: 1
    };

    setStudyGroups(prev => [newGroup, ...prev]);
    setCurrentGroup(newGroup);
    setShowCreateGroup(false);
    setNewGroupForm({
      name: '',
      description: '',
      subject: '',
      difficulty: 'beginner',
      is_private: false,
      tags: []
    });
  };

  const getFilteredGroups = () => {
    return studyGroups.filter(group => 
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
                      onClick={() => setCurrentGroup(group)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        currentGroup?.id === group.id
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                          : 'bg-white/60 border border-gray-100 hover:bg-white/80 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{group.name}</h3>
                        <div className="flex items-center text-xs text-gray-500">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></div>
                          {group.active_members}
                        </div>
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
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Study Groups Found</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {searchQuery ? 'Try adjusting your search terms' : 'Create your first study group to get started'}
                    </p>
                    {!searchQuery && (
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
                {/* Empty state - will be populated with real data */}
                <div className="text-center py-8">
                  <IoPeople className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No members to show</p>
                  <p className="text-gray-400 text-xs mt-1">Join a study group to see members</p>
                </div>
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
