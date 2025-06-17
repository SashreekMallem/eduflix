'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Image from 'next/image';
import {
  IoSearch,
  IoChatbubble,
  IoCheckmarkDone,
  IoCheckmark,
  IoAdd,
  IoCall,
  IoVideocam,
  IoSend,
  IoHeart,
  IoStarOutline,
} from 'react-icons/io5';

interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    status: 'online' | 'idle' | 'dnd' | 'away' | 'offline';
    last_seen: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isFromCurrentUser: boolean;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export default function MessengerPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'favorites'>('all');
  const router = useRouter();

  useEffect(() => {
    initializeMessenger();
    const cleanup = setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const initializeMessenger = async () => {
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
          id: user.id, // Keep the auth user ID for consistency
          username: userProfile.username,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
        });

        // Load conversations using auth user ID
        await loadConversations(user.id);
      }
    } catch (error) {
      console.error('Error initializing messenger:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async (userId: string) => {
    try {
      // Get all accepted friendships where current user is involved (using auth user_id)
      const { data: friendsData, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friendships:', error);
        setConversations([]);
        return;
      }

      if (!friendsData || friendsData.length === 0) {
        setConversations([]);
        return;
      }

      // Get friend user_ids - need to get the "other" user in each friendship
      const friendUserIds = friendsData.map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      // Get friend profiles using user_id
      const { data: friendProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', friendUserIds);

      if (profileError) {
        console.error('Error fetching friend profiles:', profileError);
        setConversations([]);
        return;
      }

      // Build conversations from friends
      const conversationsPromises = friendProfiles.map(async (friendProfile) => {
        // Get the latest message between current user and this friend (using auth user IDs)
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendProfile.user_id}),and(sender_id.eq.${friendProfile.user_id},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread message count for this conversation (using auth user IDs)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', friendProfile.user_id)
          .eq('receiver_id', userId)
          .eq('is_read', false);

        // Get friend's online status (using auth user ID)
        const { data: friendStatus } = await supabase
          .from('user_status')
          .select('status, last_seen')
          .eq('user_id', friendProfile.user_id)
          .single();

        const conversation: Conversation = {
          id: `${userId}-${friendProfile.user_id}`,
          participant: {
            id: friendProfile.user_id, // Use auth user ID for consistency
            username: friendProfile.username,
            full_name: friendProfile.full_name,
            avatar_url: friendProfile.avatar_url,
            status: friendStatus?.status || 'offline',
            last_seen: friendStatus?.last_seen || new Date().toISOString(),
          },
          lastMessage: latestMessage ? {
            content: latestMessage.content,
            timestamp: latestMessage.created_at,
            isFromCurrentUser: latestMessage.sender_id === userId,
            isRead: latestMessage.is_read,
          } : null,
          unreadCount: unreadCount || 0,
        };

        return conversation;
      });

      const conversationsList = await Promise.all(conversationsPromises);
      
      // Sort by last message timestamp
      conversationsList.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      });

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!currentUser) return;

    // Subscribe to friendship changes
    const friendshipSubscription = supabase
      .channel('friendships')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          // Reload conversations when friendships change
          loadConversations(currentUser.id);
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          // Reload conversations when new messages arrive
          if (currentUser) {
            loadConversations(currentUser.id);
          }
        }
      )
      .subscribe();

    // Subscribe to message read status changes
    const readStatusSubscription = supabase
      .channel('message_read_status')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'message_read_status' },
        () => {
          // Reload conversations when read status changes
          if (currentUser) {
            loadConversations(currentUser.id);
          }
        }
      )
      .subscribe();

    // Subscribe to user status changes
    const statusSubscription = supabase
      .channel('user_status')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_status' },
        () => {
          // Reload conversations when user status changes
          if (currentUser) {
            loadConversations(currentUser.id);
          }
        }
      )
      .subscribe();

    return () => {
      friendshipSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      readStatusSubscription.unsubscribe();
      statusSubscription.unsubscribe();
    };
  };

  const handleConversationClick = (conversation: Conversation) => {
    router.push(`/messenger/${conversation.participant.username}`);
  };

  const getFilteredConversations = () => {
    let filtered = conversations.filter(conv =>
      conv.participant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'favorites':
        // Mock favorites - in real app, you'd have a favorites system
        filtered = filtered.filter(() => Math.random() > 0.7);
        break;
      default:
        break;
    }

    return filtered;
  };

  const formatTime = (timestamp: string) => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'idle': return 'bg-yellow-400';
      case 'dnd': return 'bg-red-400';
      case 'away': return 'bg-yellow-400';
      default: return 'bg-gray-300';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online': return 'ring-green-100';
      case 'idle': return 'ring-yellow-100';
      case 'dnd': return 'ring-red-100';
      case 'away': return 'ring-yellow-100';
      default: return 'ring-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header currentPage="messenger" currentUser={currentUser ? { profile: { full_name: currentUser.full_name } } : null} />
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="ml-3 text-gray-600 font-medium">Loading conversations...</span>
        </div>
      </div>
    );
  }

  const filteredConversations = getFilteredConversations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header currentPage="messenger" currentUser={currentUser ? { profile: { full_name: currentUser.full_name } } : null} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Study Chat
                </h1>
                <p className="text-gray-600 mt-2">Connect with your study buddies and collaborate</p>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/friends')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <IoAdd className="w-5 h-5" />
                  <span>Find Study Buddies</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Tab Navigation */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1 bg-white rounded-lg p-1">
                    {(['all', 'unread', 'favorites'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          activeTab === tab
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {tab === 'all' && 'All Chats'}
                        {tab === 'unread' && 'Unread'}
                        {tab === 'favorites' && 'Favorites'}
                        {tab === 'unread' && conversations.filter(c => c.unreadCount > 0).length > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {conversations.filter(c => c.unreadCount > 0).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-gray-200">
                <div className="relative">
                  <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-16">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <IoChatbubble className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {searchQuery ? 'No conversations found' : conversations.length === 0 ? 'No study buddies yet' : 'No conversations match your filter'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {conversations.length === 0 
                        ? 'Connect with study buddies to start collaborating!'
                        : searchQuery 
                        ? 'Try a different search term'
                        : 'All conversations are read'}
                    </p>
                    {conversations.length === 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/friends')}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Find Study Buddies
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {filteredConversations.map((conversation, index) => (
                        <motion.div
                          key={conversation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ backgroundColor: '#f8fafc' }}
                          onClick={() => handleConversationClick(conversation)}
                          className="p-6 cursor-pointer transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {conversation.participant.avatar_url ? (
                                <Image
                                  src={conversation.participant.avatar_url}
                                  alt={conversation.participant.full_name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                  {conversation.participant.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(conversation.participant.status)} ${getStatusDot(conversation.participant.status)} ring-2`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {conversation.participant.full_name}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  {conversation.lastMessage && (
                                    <span className="text-sm text-gray-500">
                                      {formatTime(conversation.lastMessage.timestamp)}
                                    </span>
                                  )}
                                  {conversation.unreadCount > 0 && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="bg-indigo-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium"
                                    >
                                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  {conversation.lastMessage && conversation.lastMessage.isFromCurrentUser && (
                                    <div className="text-gray-400">
                                      {conversation.lastMessage.isRead ? (
                                        <IoCheckmarkDone className="w-4 h-4 text-indigo-500" />
                                      ) : (
                                        <IoCheckmark className="w-4 h-4" />
                                      )}
                                    </div>
                                  )}
                                  <p className="text-gray-600 text-sm truncate">
                                    {conversation.lastMessage?.content || 'No messages yet - start the conversation!'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {conversation.participant.status === 'online' ? 'Online now' : 
                                   conversation.participant.status === 'idle' ? 'Idle' :
                                   conversation.participant.status === 'dnd' ? 'Do not disturb' :
                                   conversation.participant.status === 'away' ? 'Away' :
                                   `Last seen ${formatTime(conversation.participant.last_seen)}`}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle call
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                  >
                                    <IoCall className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle video call
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                  >
                                    <IoVideocam className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <IoSend className="w-5 h-5 text-indigo-500 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/friends')}
                  className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border border-indigo-100"
                >
                  <div className="font-medium text-gray-900">Find Study Partners</div>
                  <div className="text-sm text-gray-600">Discover new study buddies</div>
                </button>
                <button
                  onClick={() => router.push('/study-group')}
                  className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 border border-purple-100"
                >
                  <div className="font-medium text-gray-900">Join Study Groups</div>
                  <div className="text-sm text-gray-600">Collaborate in groups</div>
                </button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <IoStarOutline className="w-5 h-5 text-yellow-500 mr-2" />
                Your Network
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Study Buddies</span>
                  <span className="font-semibold text-indigo-600">{conversations.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Unread Messages</span>
                  <span className="font-semibold text-purple-600">
                    {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Online Now</span>
                  <span className="font-semibold text-green-600">
                    {conversations.filter(conv => conv.participant.status === 'online').length}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white"
            >
              <div className="flex items-center mb-3">
                <IoHeart className="w-5 h-5 mr-2" />
                <h3 className="font-semibold">Study Tip</h3>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Collaborate with study buddies to improve learning outcomes by up to 40%! 
                Share resources, discuss concepts, and motivate each other.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
