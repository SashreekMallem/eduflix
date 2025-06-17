"use client";
import { useState, useEffect, useRef } from "react";
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
  IoStarOutline,
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
  message_type: 'text' | 'image' | 'file' | 'announcement';
  reactions?: { emoji: string; count: number; users: string[] }[];
  replies?: Message[];
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
}

interface GroupMember {
  id: string;
  user: User;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  contribution_score: number;
}

export default function StudyGroupPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'joined' | 'discover' | 'trending'>('joined');
  
  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  
  // Create group form
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    subject: '',
    difficulty: 'beginner' as const,
    is_private: false,
    tags: [] as string[]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeStudyGroups();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initializeStudyGroups = async () => {
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

        // Load study groups (for now using mock data)
        loadMockData();
      }
    } catch (error) {
      console.error('Error initializing study groups:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for now - we'll replace with Supabase later
  const loadMockData = () => {
    const mockGroups: StudyGroup[] = [
      {
        id: '1',
        name: 'JavaScript Masters',
        description: 'Advanced JavaScript concepts and frameworks',
        subject: 'Programming',
        difficulty: 'advanced',
        member_count: 156,
        is_private: false,
        created_at: '2024-01-15T10:00:00Z',
        created_by: '1',
        tags: ['javascript', 'react', 'nodejs'],
        active_members: 23
      },
      {
        id: '2',
        name: 'Data Science Study Circle',
        description: 'Exploring data science, ML, and analytics together',
        subject: 'Data Science',
        difficulty: 'intermediate',
        member_count: 89,
        is_private: false,
        created_at: '2024-02-01T14:30:00Z',
        created_by: '2',
        tags: ['python', 'machine-learning', 'data-analysis'],
        active_members: 12
      },
      {
        id: '3',
        name: 'UI/UX Design Collective',
        description: 'Learn design principles and create amazing interfaces',
        subject: 'Design',
        difficulty: 'beginner',
        member_count: 234,
        is_private: false,
        created_at: '2024-01-20T09:15:00Z',
        created_by: '3',
        tags: ['figma', 'design-systems', 'user-research'],
        active_members: 45
      }
    ];

    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Hey everyone! Welcome to our JavaScript study group. Let\'s start with discussing React hooks today.',
        sender_id: '1',
        sender: {
          id: '1',
          username: 'alexdev',
          full_name: 'Alex Johnson',
          status: 'online',
          last_seen: new Date().toISOString()
        },
        created_at: '2024-06-16T10:00:00Z',
        message_type: 'text',
        reactions: [
          { emoji: '👍', count: 5, users: ['2', '3', '4', '5', '6'] },
          { emoji: '🚀', count: 3, users: ['2', '7', '8'] }
        ]
      },
      {
        id: '2',
        content: 'Great idea! I\'ve been struggling with useEffect dependencies. Anyone can share some best practices?',
        sender_id: '2',
        sender: {
          id: '2',
          username: 'sarah_codes',
          full_name: 'Sarah Chen',
          status: 'online',
          last_seen: new Date().toISOString()
        },
        created_at: '2024-06-16T10:05:00Z',
        message_type: 'text'
      }
    ];

    setStudyGroups(mockGroups);
    setCurrentGroup(mockGroups[0]);
    setMessages(mockMessages);
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
      <Header />
      
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
                      onClick={() => setActiveTab(tab as any)}
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
                {getFilteredGroups().map((group) => (
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
                ))}
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
                      <button 
                        onClick={() => setShowGroupDetails(true)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <IoSettings className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
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
                ))}
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
                    <div className="text-2xl font-bold text-emerald-600">23</div>
                    <div className="text-xs text-emerald-600">Online</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-2xl font-bold text-gray-600">156</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Mock members data */}
                {[
                  { name: 'Alex Johnson', username: 'alexdev', status: 'online', role: 'admin' },
                  { name: 'Sarah Chen', username: 'sarah_codes', status: 'online', role: 'moderator' },
                  { name: 'Mike Rodriguez', username: 'mike_r', status: 'idle', role: 'member' },
                  { name: 'Emma Wilson', username: 'emma_w', status: 'online', role: 'member' },
                  { name: 'David Kim', username: 'david_k', status: 'offline', role: 'member' }
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/60 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800 text-sm">{member.name}</span>
                        {member.role === 'admin' && (
                          <IoStarOutline className="w-3 h-3 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">@{member.username}</p>
                    </div>
                  </div>
                ))}
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
                      onChange={(e) => setNewGroupForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
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
