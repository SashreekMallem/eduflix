"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FaSearch, FaUserPlus, FaCheck, FaTimes, FaUsers
} from 'react-icons/fa';
import { 
  HiSparkles, HiLightningBolt, HiTrendingUp, HiAcademicCap,
  HiChat, HiDotsHorizontal, HiChatAlt2, HiUserGroup
} from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Supabase Schema Interfaces
interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  current_status: string;
  skills: string[];
  career_goals: string[];
  learning_goals: string[];
  created_at: string;
}

interface UserEducation {
  id: string;
  user_id: string;
  university: string;
  degree: string;
  field_of_study: string;
  graduation_year: string | null;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_profile: UserProfile;
  friend_education?: UserEducation[];
}

interface FriendInvitation {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  created_at: string;
  sender_profile: UserProfile;
}

interface UserSuggestion {
  profile: UserProfile;
  education?: UserEducation[];
  mutual_connections: number;
  compatibility_score: number;
  shared_interests: string[];
}

// Premium Friend Card with enhanced visual design
const FriendCard = ({ 
  friend, 
  onChat, 
  onRemove, 
  isDropdownOpen, 
  onToggleDropdown 
}: { 
  friend: Friend; 
  onChat: (username: string) => void;
  onRemove: (friendshipId: string, friendName: string) => void;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isDropdownOpen) {
          onToggleDropdown();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, onToggleDropdown]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 relative overflow-hidden"
    >
      {/* Premium background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status indicator */}
      <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm" />
      
      <div className="relative z-10">
        {/* Enhanced Avatar Section */}
        <div className="flex items-start space-x-6 mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              {friend.friend_profile.full_name?.charAt(0) || 'U'}
            </div>
            {/* Achievement badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <HiSparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                  {friend.friend_profile.full_name}
                </h3>
                <p className="text-sm text-gray-600 font-medium">@{friend.friend_profile.username}</p>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={onToggleDropdown}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <HiDotsHorizontal className="w-5 h-5" />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <button
                      onClick={() => onRemove(friend.id, friend.friend_profile.full_name)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-2"
                    >
                      <FaTimes className="w-3 h-3" />
                      <span>Remove as Study Buddy</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <HiLightningBolt className="w-3 h-3 text-yellow-500" />
                <span>Study Streak: 12 days</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <HiTrendingUp className="w-3 h-3 text-green-500" />
                <span>Rising Star</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Education */}
        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">{friend.friend_profile.current_status}</p>
          
          {friend.friend_education && friend.friend_education.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
              <HiAcademicCap className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700 font-medium">
                {friend.friend_education[0].degree} at {friend.friend_education[0].university}
              </span>
            </div>
          )}
        </div>
        
        {/* Premium Skills Display */}
        {friend.friend_profile.skills && friend.friend_profile.skills.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {friend.friend_profile.skills.slice(0, 4).map((skill, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full border border-indigo-200 hover:from-indigo-200 hover:to-purple-200 transition-all duration-200"
                >
                  {skill}
                </motion.span>
              ))}
              {friend.friend_profile.skills.length > 4 && (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  +{friend.friend_profile.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Premium Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChat(friend.friend_profile.username)}
            className="group/btn flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <HiChat className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            <span>Chat</span>
          </button>
          <Link
            href={`/profile/${friend.friend_profile.username}`}
            className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transform hover:scale-105"
          >
            <HiUserGroup className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// Premium Invitation Card with profile preview and enhanced design
const InvitationCard = ({ invitation, onAccept, onDecline }: {
  invitation: FriendInvitation;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) => {
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-4 shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
    >
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      
      <div className="flex flex-col space-y-3">
        {/* Header with user info - more compact */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {invitation.sender_profile.full_name?.charAt(0) || 'U'}
            </div>
            {/* New invitation indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">
              {invitation.sender_profile.full_name}
            </h4>
            <p className="text-xs text-gray-600 truncate">@{invitation.sender_profile.username}</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <HiSparkles className="w-3 h-3 text-yellow-500" />
              <span>Study buddy request</span>
            </div>
          </div>
        </div>

        {/* Quick preview of their info - more compact */}
        <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg p-3">
          <div className="text-xs text-gray-700">
            <p className="mb-1 truncate"><span className="font-semibold">Status:</span> {invitation.sender_profile.current_status}</p>
            {invitation.sender_profile.skills && invitation.sender_profile.skills.length > 0 && (
              <div>
                <span className="font-semibold">Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {invitation.sender_profile.skills.slice(0, 2).map((skill, index) => (
                    <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                  {invitation.sender_profile.skills.length > 2 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{invitation.sender_profile.skills.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message if exists - more compact */}
        {invitation.message && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
            <p className="text-xs text-gray-700 italic leading-relaxed line-clamp-2">
              &ldquo;{invitation.message}&rdquo;
            </p>
          </div>
        )}

        {/* Action buttons - compact and properly spaced */}
        <div className="flex flex-col space-y-2 pt-1">
          <button
            onClick={() => router.push(`/profile/${invitation.sender_profile.username}`)}
            className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200 text-xs"
          >
            View Full Profile
          </button>
          
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAccept(invitation.id)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-1 text-xs"
            >
              <FaCheck className="w-3 h-3" />
              <span>Accept</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDecline(invitation.id)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-1 text-xs"
            >
              <FaTimes className="w-3 h-3" />
              <span>Decline</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Premium Suggestion Card with world-class design
const SuggestionCard = ({ suggestion, onConnect, connecting, inviteSent }: {
  suggestion: UserSuggestion;
  onConnect: (userId: string) => void;
  connecting: boolean;
  inviteSent?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -12, scale: 1.03 }}
    className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 relative overflow-hidden"
  >
    {/* Premium background patterns */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-white to-pink-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
    
    <div className="relative z-10 text-center">
      {/* Enhanced Avatar with floating elements */}
      <div className="relative inline-block mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-2xl group-hover:shadow-purple-500/25 transition-all duration-300 transform group-hover:rotate-3">
          {suggestion.profile.full_name?.charAt(0) || 'U'}
        </div>
        
        {/* Floating compatibility badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white"
        >
          {suggestion.compatibility_score}%
        </motion.div>
        
        {/* Floating sparkles */}
        <div className="absolute -top-1 -left-1 w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <HiSparkles />
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <HiSparkles />
        </div>
      </div>
      
      {/* Profile Information */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
          {suggestion.profile.full_name}
        </h3>
        <p className="text-sm text-gray-600 font-medium mb-1">@{suggestion.profile.username}</p>
        <p className="text-sm text-gray-500 leading-relaxed">{suggestion.profile.current_status}</p>
      </div>
      
      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
          <div className="text-2xl font-bold text-purple-600 mb-1">{suggestion.compatibility_score}%</div>
          <div className="text-xs text-purple-700 font-medium">Compatibility</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
          <div className="text-2xl font-bold text-emerald-600 mb-1">{suggestion.mutual_connections}</div>
          <div className="text-xs text-emerald-700 font-medium">Mutual Friends</div>
        </div>
      </div>
      
      {/* Premium Shared Interests */}
      {suggestion.shared_interests.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Shared Interests</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestion.shared_interests.slice(0, 3).map((interest, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full border border-purple-200 hover:from-purple-200 hover:to-pink-200 transition-all duration-200"
              >
                {interest}
              </motion.span>
            ))}
            {suggestion.shared_interests.length > 3 && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                +{suggestion.shared_interests.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Mutual Connections indicator */}
      {suggestion.mutual_connections > 0 && (
        <div className="flex items-center justify-center mb-6 space-x-2 text-sm text-gray-600">
          <div className="flex -space-x-2">
            {[...Array(Math.min(suggestion.mutual_connections, 3))].map((_, i) => (
              <div key={i} className="w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full border-2 border-white" />
            ))}
          </div>
          <span className="font-medium">
            {suggestion.mutual_connections} mutual friend{suggestion.mutual_connections !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      {/* Premium Connect Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onConnect(suggestion.profile.id)} // Use profile ID for invitations
        disabled={connecting || inviteSent}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform ${
          inviteSent
            ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white cursor-not-allowed'
            : connecting
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
        }`}
      >
        {inviteSent ? (
          <div className="flex items-center justify-center space-x-2">
            <FaCheck className="w-4 h-4" />
            <span>Invite Sent</span>
          </div>
        ) : connecting ? (
          <div className="flex items-center justify-center space-x-2">
            <FaCheck className="w-4 h-4" />
            <span>Sending...</span>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <FaUserPlus className="w-4 h-4" />
            <span>Connect & Study Together</span>
          </div>
        )}
      </motion.button>
    </div>
  </motion.div>
);

export default function FriendsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; authId: string; profile: UserProfile } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<FriendInvitation[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());
  const [sentInvitations, setSentInvitations] = useState<Set<string>>(new Set());
  const [newInvitationAlert, setNewInvitationAlert] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Show alert when new invitations arrive
  useEffect(() => {
    if (invitations.length > 0) {
      setNewInvitationAlert(true);
      const timer = setTimeout(() => setNewInvitationAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [invitations.length]);

  // Unified compatibility calculation function
  const calculateCompatibilityScore = (userProfile: UserProfile | null, targetProfile: UserProfile) => {
    const userSkills = userProfile?.skills || [];
    const userCareerGoals = userProfile?.career_goals || [];
    const userLearningGoals = userProfile?.learning_goals || [];
    
    const targetSkills = targetProfile?.skills || [];
    const targetCareerGoals = targetProfile?.career_goals || [];
    const targetLearningGoals = targetProfile?.learning_goals || [];
    
    // Calculate shared interests across multiple categories
    const sharedSkills = userSkills.filter((skill: string) => targetSkills.includes(skill));
    const sharedCareerGoals = userCareerGoals.filter((goal: string) => targetCareerGoals.includes(goal));
    const sharedLearningGoals = userLearningGoals.filter((goal: string) => targetLearningGoals.includes(goal));
    
    // Advanced compatibility score calculation
    let compatibilityScore = 30; // Lower base score for more realistic results
    
    // Skills compatibility (40% weight)
    if (userSkills.length > 0 && targetSkills.length > 0) {
      const skillsMatchRatio = sharedSkills.length / Math.max(userSkills.length, targetSkills.length);
      compatibilityScore += skillsMatchRatio * 40;
    }
    
    // Career goals compatibility (30% weight)
    if (userCareerGoals.length > 0 && targetCareerGoals.length > 0) {
      const careerMatchRatio = sharedCareerGoals.length / Math.max(userCareerGoals.length, targetCareerGoals.length);
      compatibilityScore += careerMatchRatio * 30;
    }
    
    // Learning goals compatibility (30% weight)
    if (userLearningGoals.length > 0 && targetLearningGoals.length > 0) {
      const learningMatchRatio = sharedLearningGoals.length / Math.max(userLearningGoals.length, targetLearningGoals.length);
      compatibilityScore += learningMatchRatio * 30;
    }
    
    // Ensure score is within valid range
    compatibilityScore = Math.min(100, Math.max(0, Math.round(compatibilityScore)));
    
    // Combine all shared interests
    const allSharedInterests = [...new Set([...sharedSkills, ...sharedCareerGoals, ...sharedLearningGoals])];

    return {
      score: compatibilityScore,
      sharedInterests: allSharedInterests,
      breakdown: {
        skills: sharedSkills,
        careerGoals: sharedCareerGoals,
        learningGoals: sharedLearningGoals
      }
    };
  };

  // Calculate actual mutual friends (not based on shared interests)
  const calculateMutualFriends = async (userId1: string, userId2: string) => {
    try {
      // Get friends of user1
      const { data: user1Friends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId1)
        .eq('status', 'accepted');

      // Get friends of user2  
      const { data: user2Friends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId2)
        .eq('status', 'accepted');

      if (!user1Friends || !user2Friends) return 0;

      // Find common friend IDs
      const user1FriendIds = user1Friends.map(f => f.friend_id);
      const user2FriendIds = user2Friends.map(f => f.friend_id);
      const mutualFriendIds = user1FriendIds.filter(id => user2FriendIds.includes(id));

      return mutualFriendIds.length;
    } catch (error) {
      console.error('Error calculating mutual friends:', error);
      return 0;
    }
  };

  const initializeUser = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        router.push('/auth/login');
        return;
      }
      
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      const userId = session.user.id;
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        if (profileError.code === 'PGRST116') {
          // No profile found - user may need to complete onboarding
        }
        setLoading(false);
        return;
      }

      if (profile) {
        const currentUserData = { id: profile.id, authId: userId, profile }; // id = profile ID, authId = auth user ID
        setCurrentUser(currentUserData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing user:', error);
      setLoading(false);
    }
  }, [router]);

  // Helper functions that don't depend on currentUser state
  const fetchFriendsForUser = async (userId: string) => {
    try {
      // Query for friendships in both directions (user_id and friend_id)
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        setFriends([]);
        return;
      }
      
      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      // Get friend IDs - need to get the "other" user in each friendship
      const friendIds = friendships.map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', friendIds);

      if (profileError) {
        console.error('Error fetching friend profiles:', profileError);
        setFriends([]);
        return;
      }

      // Combine data manually and remove duplicates
      const seenFriendIds = new Set();
      const transformedFriends: Friend[] = friendships.map(friendship => {
        // Get the friend's ID (the "other" user in the friendship)
        const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
        const profile = profiles?.find(p => p.user_id === friendId);
        
        return {
          id: friendship.id,
          user_id: friendship.user_id,
          friend_id: friendship.friend_id,
          status: friendship.status as 'pending' | 'accepted' | 'blocked',
          created_at: friendship.created_at,
          friend_profile: profile as UserProfile,
          friend_education: [] // Will fetch separately if needed
        };
      }).filter(f => {
        if (!f.friend_profile) return false;
        // Remove duplicates based on friend's user_id
        const friendUserId = f.friend_profile.user_id;
        if (seenFriendIds.has(friendUserId)) {
          return false;
        }
        seenFriendIds.add(friendUserId);
        return true;
      });

      setFriends(transformedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    }
  };

  const fetchInvitationsForUser = async (userId: string) => {
    try {
      // Simple query without complex joins first
      const { data: invitations, error } = await supabase
        .from('friend_invitations')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching invitations:', error);
        setInvitations([]);
        return;
      }

      if (!invitations || invitations.length === 0) {
        setInvitations([]);
        return;
      }

      // Get sender profiles separately
      const senderIds = invitations.map(inv => inv.sender_id);
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', senderIds); // sender_id is profile ID, match with user_profiles.id

      if (profileError) {
        console.error('Error fetching sender profiles:', profileError);
        setInvitations([]);
        return;
      }

      // Combine data manually
      const transformedInvitations: FriendInvitation[] = invitations.map(invitation => {
        const profile = profiles?.find(p => p.id === invitation.sender_id); // sender_id is profile ID
        return {
          id: invitation.id,
          sender_id: invitation.sender_id,
          receiver_id: invitation.receiver_id,
          status: invitation.status as 'pending' | 'accepted' | 'declined',
          message: invitation.message,
          created_at: invitation.created_at,
          sender_profile: profile as UserProfile
        };
      }).filter(inv => inv.sender_profile); // Filter out invitations without profiles

      setInvitations(transformedInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    }
  };

  const fetchFriends = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    
    if (!currentUser.authId) {
      return;
    }
    
    await fetchFriendsForUser(currentUser.authId); // Use authId (auth.users.id) instead of profile id
  }, [currentUser]);

  const fetchInvitations = useCallback(async () => {
    if (!currentUser) return;
    await fetchInvitationsForUser(currentUser.id); // Use profile ID for invitations
  }, [currentUser]);

  const fetchSuggestions = useCallback(async (userId: string) => {
    try {
      // Get current user's existing friends to exclude them from suggestions
      const { data: existingFriends, error: friendsError } = await supabase
        .from('friendships')
        .select('friend_id, user_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching existing friends for suggestions:', friendsError);
      }

      // Get friend IDs to exclude
      const friendIds = existingFriends ? existingFriends.map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      ) : [];

      // Get user profiles excluding current user and existing friends
      let query = supabase
        .from('user_profiles')
        .select('id, user_id, full_name, username, current_status, skills, career_goals, learning_goals, created_at')
        .neq('user_id', userId)
        .limit(10);

      // Exclude existing friends
      if (friendIds.length > 0) {
        query = query.not('user_id', 'in', `(${friendIds.join(',')})`);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching user profiles for suggestions:', error);
        setSuggestions([]);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setSuggestions([]);
        return;
      }

      // Get current user's full profile for compatibility calculation
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Create suggestions with advanced compatibility scoring using unified function
      const suggestions: UserSuggestion[] = await Promise.all(
        profiles.map(async (profile) => {
          const compatibility = calculateCompatibilityScore(userProfile, profile);
          const mutualConnections = await calculateMutualFriends(userId, profile.user_id);

          return {
            profile: profile as UserProfile,
            compatibility_score: compatibility.score,
            shared_interests: compatibility.sharedInterests.slice(0, 3),
            mutual_connections: mutualConnections
          };
        })
      );

      // Sort by compatibility score
      const sortedSuggestions = suggestions
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, 6);

      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  }, []); // No dependencies needed for fetchSuggestions

  useEffect(() => {
    // Set up real-time subscription for new invitations
    const setupRealTimeUpdates = () => {
      if (!currentUser?.id) return;

      // Subscribe to new friend invitations
      const invitationsSubscription = supabase
        .channel('friend_invitations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_invitations',
            filter: `receiver_id=eq.${currentUser.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              // New invitation received - refresh invitations
              fetchInvitations();
            } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
              // Invitation status changed or deleted - refresh invitations
              fetchInvitations();
            }
          }
        )
        .subscribe();

      return () => {
        invitationsSubscription.unsubscribe();
      };
    };

    const cleanup = setupRealTimeUpdates();
    return cleanup;
  }, [currentUser?.id, fetchInvitations]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    if (!currentUser) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    try {
      setSearching(true);
      
      // Test Supabase connection first
      const { error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection failed:', testError);
        setSearchResults([]);
        setSearching(false);
        return;
      }
      
      // Simple search without complex filtering first
      const { data: searchProfiles, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, username, current_status, skills, career_goals, learning_goals, created_at')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('user_id', currentUser.authId)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
        setSearching(false);
        return;
      }

      const searchProfilesList = (searchProfiles as UserProfile[]) || [];

      // Calculate compatibility for each search result
      const resultsWithCompatibility = await Promise.all(
        searchProfilesList.map(async (profile) => {
          const compatibility = calculateCompatibilityScore(currentUser.profile, profile);
          const mutualConnections = await calculateMutualFriends(currentUser.authId, profile.user_id);

          return {
            profile: profile,
            compatibility_score: compatibility.score,
            shared_interests: compatibility.sharedInterests.slice(0, 3),
            mutual_connections: mutualConnections
          };
        })
      );
      
      setSearchResults(resultsWithCompatibility);
      setSearching(false);
    } catch (error) {
      console.error('Exception in search:', error);
      setSearchResults([]);
      setSearching(false);
    }
  };

  const sendInvitation = async (receiverId: string, message?: string) => {
    if (!currentUser) return;

    setConnectingUsers(prev => new Set(prev).add(receiverId));
    
    try {
      // First, check if there's already an existing invitation between these users
      const { data: existingInvitations, error: checkError } = await supabase
        .from('friend_invitations')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
        .in('status', ['pending', 'accepted']);

      if (checkError) {
        console.error('Error checking existing invitations:', checkError);
        throw checkError;
      }

      if (existingInvitations && existingInvitations.length > 0) {
        const existing = existingInvitations[0];
        if (existing.status === 'pending') {
          alert('An invitation is already pending between you and this user.');
          return;
        } else if (existing.status === 'accepted') {
          alert('You are already friends with this user.');
          return;
        }
      }

      // Check if there are any declined invitations that we need to update
      const { data: declinedInvitations, error: declinedError } = await supabase
        .from('friend_invitations')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`)
        .eq('status', 'declined')
        .order('created_at', { ascending: false })
        .limit(1);

      if (declinedError) {
        console.error('Error checking declined invitations:', declinedError);
      }

      let insertResult;

      if (declinedInvitations && declinedInvitations.length > 0) {
        // Update the existing declined invitation to pending
        const declinedInvitation = declinedInvitations[0];
        insertResult = await supabase
          .from('friend_invitations')
          .update({
            sender_id: currentUser.id,
            receiver_id: receiverId,
            status: 'pending',
            message: message || null,
            created_at: new Date().toISOString()
          })
          .eq('id', declinedInvitation.id);
      } else {
        // Insert a new invitation
        insertResult = await supabase
          .from('friend_invitations')
          .insert([{
            sender_id: currentUser.id,
            receiver_id: receiverId,
            status: 'pending',
            message: message || null
          }]);
      }

      if (insertResult.error) {
        console.error('Error sending invitation:', insertResult.error);
        console.error('Error details:', {
          code: insertResult.error.code,
          message: insertResult.error.message,
          details: insertResult.error.details,
          hint: insertResult.error.hint
        });
        
        // Provide specific error messages based on error type
        let errorMessage = 'Failed to send invitation';
        if (insertResult.error.code === '42501' || insertResult.error.message.includes('policy')) {
          errorMessage = 'Permission denied. Please check your authentication and try again.';
        } else if (insertResult.error.code === '23505') {
          errorMessage = 'An invitation already exists between you and this user.';
        } else if (insertResult.error.message) {
          errorMessage = `Failed to send invitation: ${insertResult.error.message}`;
        }
        
        alert(errorMessage);
        throw insertResult.error;
      } else {
        // Remove from suggestions or search results (compare with profile.id since receiverId is profile ID)
        setSuggestions(prev => prev.filter(s => s.profile.id !== receiverId));
        setSearchResults(prev => prev.filter(s => s.profile.id !== receiverId));
        
        // Add to sent invitations set
        setSentInvitations(prev => new Set(prev).add(receiverId));
        
        // Show success message
        alert('Study invitation sent successfully!');
      }
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert(`Failed to send invitation. Please try again.`);
    } finally {
      // Always remove loading state
      setTimeout(() => {
        setConnectingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(receiverId);
          return newSet;
        });
      }, 1000);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!currentUser) return;

    try {
      // First, try to get the invitation without .single() to see what's there
      const { data: invitationCheck, error: checkError } = await supabase
        .from('friend_invitations')
        .select('*')
        .eq('id', invitationId);

      if (checkError) {
        console.error('Error checking invitation:', checkError);
        alert(`Failed to check invitation: ${checkError.message}`);
        return;
      }

      if (!invitationCheck || invitationCheck.length === 0) {
        console.error('No invitation found with ID:', invitationId);
        alert('Invitation not found. It may have been removed or you may not have permission to view it.');
        return;
      }

      if (invitationCheck.length > 1) {
        console.error('Multiple invitations found with same ID:', invitationCheck);
        alert('Database error: Multiple invitations with same ID found.');
        return;
      }

      const invitation = invitationCheck[0];

      // Verify this is the correct receiver (invitation uses profile IDs, not auth IDs)
      if (invitation.receiver_id !== currentUser?.id) {
        console.error('User is not the receiver of this invitation:', {
          invitationReceiver: invitation.receiver_id,
          currentUserProfileId: currentUser?.id
        });
        alert('You are not authorized to accept this invitation.');
        return;
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        console.error('Invitation is not pending:', invitation.status);
        alert(`This invitation has already been ${invitation.status}.`);
        // Refresh data to show current state
        await Promise.all([fetchFriends(), fetchInvitations()]);
        return;
      }
      // Update invitation status to accepted
      const { error: updateError } = await supabase
        .from('friend_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        alert(`Failed to update invitation: ${updateError.message}`);
        return;
      }

      // Convert profile IDs from invitation to auth user IDs for friendship creation
      const { data: senderProfile, error: senderError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('id', invitation.sender_id)
        .single();

      const { data: receiverProfile, error: receiverError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('id', invitation.receiver_id)
        .single();

      if (senderError || receiverError) {
        console.error('Error converting profile IDs to auth IDs:', { senderError, receiverError });
        alert('Failed to create friendship - could not resolve user IDs');
        return;
      }

      // Create mutual friendship records in the friendships table using auth user IDs
      const friendshipData = [
        {
          user_id: senderProfile.user_id,
          friend_id: receiverProfile.user_id,
          status: 'accepted'
        },
        {
          user_id: receiverProfile.user_id,
          friend_id: senderProfile.user_id,
          status: 'accepted'
        }
      ];

      // Check if friendships already exist to avoid duplicates (using auth user IDs)
      const { data: existingFriendships, error: friendshipCheckError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${senderProfile.user_id},friend_id.eq.${receiverProfile.user_id}),and(user_id.eq.${receiverProfile.user_id},friend_id.eq.${senderProfile.user_id})`);

      if (friendshipCheckError) {
        console.error('Error checking existing friendships:', friendshipCheckError);
        // If we can't check, revert the invitation status
        await supabase
          .from('friend_invitations')
          .update({ status: 'pending' })
          .eq('id', invitationId);
        alert(`Failed to check existing friendships: ${friendshipCheckError.message}`);
        return;
      }

      if (existingFriendships && existingFriendships.length > 0) {
        // Friendships already exist
      } else {
        // Create new friendships only if they don't exist
        const { error: friendshipError } = await supabase
          .from('friendships')
          .insert(friendshipData);

        if (friendshipError) {
          console.error('Error creating friendships:', friendshipError);
          
          // Check if it's a duplicate key error
          if (friendshipError.code === '23505') {
            // Duplicate friendship detected - this is expected if friendship was created elsewhere
          } else {
            // For other errors, revert the invitation status
            await supabase
              .from('friend_invitations')
              .update({ status: 'pending' })
              .eq('id', invitationId);
            alert(`Failed to create friendship: ${friendshipError.message}`);
            return;
          }
        }
      }
      
      // Refresh data to show the changes
      await Promise.all([
        fetchFriends(),
        fetchInvitations(),
        fetchSuggestions(currentUser.authId) // Refresh suggestions to remove the new friend
      ]);

      alert('Study buddy request accepted! You are now connected.');

    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('friend_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error declining invitation:', error);
        return;
      }
      
      // Refresh invitations list
      await fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const handleChat = (username: string) => {
    router.push(`/messenger/${username}`);
  };

  const removeFriend = async (friendshipId: string, friendName: string) => {
    if (!currentUser) return;

    const confirmed = confirm(`Are you sure you want to remove ${friendName} as a study buddy? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      // First, get the friendship record to find the friend's ID
      const { data: friendship, error: fetchError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('id', friendshipId)
        .single();

      if (fetchError || !friendship) {
        console.error('Error fetching friendship:', fetchError);
        alert('Failed to find friendship record.');
        return;
      }

      const friendId = friendship.user_id === currentUser.authId ? friendship.friend_id : friendship.user_id;

      // Get the friend's profile ID for invitation cleanup (invitations use profile IDs)
      const { data: friendProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', friendId)
        .single();

      if (profileError) {
        console.warn('Could not find friend profile for invitation cleanup:', profileError);
      }

      const friendProfileId = friendProfile?.id;
      const currentUserProfileId = currentUser.profile?.id;

      // Delete ALL friendships between these two users (both directions)
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUser.authId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.authId})`);

      if (deleteError) {
        console.error('Error removing friend:', deleteError);
        alert(`Failed to remove study buddy: ${deleteError.message}`);
        return;
      }

      // Also remove any related friend invitations (both directions)
      if (currentUserProfileId && friendProfileId) {
        const { error: inviteDeleteError } = await supabase
          .from('friend_invitations')
          .delete()
          .or(`and(sender_id.eq.${currentUserProfileId},receiver_id.eq.${friendProfileId}),and(sender_id.eq.${friendProfileId},receiver_id.eq.${currentUserProfileId})`);

        if (inviteDeleteError) {
          console.warn('Error removing related invitations (non-critical):', inviteDeleteError);
          // Don't fail the operation for invitation cleanup errors
        }
      }
      
      // Close the dropdown menu
      setOpenDropdownId(null);
      
      // Refresh both friends and invitations lists
      await Promise.all([fetchFriends(), fetchInvitations()]);
      
      // Show success message
      alert(`${friendName} has been removed from your study buddies.`);
      
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove study buddy. Please try again.');
    }
  };

  // Fix the debouncing issue with useRef
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  useEffect(() => {
    // Load initial data when currentUser is available
    if (currentUser?.id) {
      const loadInitialData = async () => {
        try {
          // Load all data in parallel
          await Promise.all([
            fetchFriends(),
            fetchInvitations(),
            fetchSuggestions(currentUser.profile.user_id)
          ]);
        } catch (error) {
          console.error('❌ Error loading initial data:', error);
        }
      };
      
      loadInitialData();
    }
  }, [currentUser?.id, currentUser?.profile?.user_id, fetchInvitations, fetchFriends, fetchSuggestions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 pb-20">
      {/* Premium Header with glass morphism effect */}
      <Header currentPage="friends" currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Premium Search Section with advanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Your Study
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Community</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with passionate learners, find study partners, and build meaningful academic relationships
            </p>
          </div>
          
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <FaSearch className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-14 pr-6 py-4 border-2 border-gray-200 rounded-2xl leading-6 bg-white/70 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
              placeholder="Search for brilliant minds to study with..."
            />
            <div className="absolute inset-y-0 right-0 pr-6 flex items-center">
              {searching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
                />
              ) : (
                <motion.div
                  animate={{ rotate: searchQuery ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
                >
                  <HiSparkles className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Premium Search Results */}
        {searchResults.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <HiSparkles className="mr-3 text-yellow-500" />
                Search Results
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-semibold">
                  {searchResults.length} found
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchResults.map((result) => (
                  <SuggestionCard
                    key={result.profile.id}
                    suggestion={result}
                    onConnect={sendInvitation}
                    connecting={connectingUsers.has(result.profile.id)}
                    inviteSent={sentInvitations.has(result.profile.id)}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Premium Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Enhanced Pending Invitations - Fixed container */}
            {invitations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-200 overflow-visible"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center flex-wrap">
                  <div className={`w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-2 ${newInvitationAlert ? 'animate-pulse' : ''}`}>
                    <FaUserPlus className="text-white text-sm" />
                  </div>
                  <span>Study Invites</span>
                  <span className={`ml-2 px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs font-bold ${newInvitationAlert ? 'animate-bounce' : ''}`}>
                    {invitations.length}
                  </span>
                  {newInvitationAlert && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="ml-2 text-green-600 text-sm font-semibold"
                    >
                      New!
                    </motion.span>
                  )}
                </h3>
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {invitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={acceptInvitation}
                      onDecline={declineInvitation}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Premium Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 rounded-3xl p-8 shadow-xl border border-gray-200"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                  <HiTrendingUp className="text-white" />
                </div>
                Network Stats
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-indigo-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <FaUsers className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Study Buddies</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">{friends.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-orange-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <HiChatAlt2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Pending Invites</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{invitations.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <HiSparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Suggestions</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{suggestions.length}</span>
                </div>
              </div>
              
              {/* Progress indicator - Network Growth */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-700">Network Growth</span>
                  <span className="text-xs font-bold text-purple-600">
                    {Math.min(100, Math.round((friends.length + invitations.length) * 10))}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (friends.length + invitations.length) * 10)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  {friends.length + invitations.length < 10 
                    ? `Connect with ${10 - (friends.length + invitations.length)} more people to reach 100%`
                    : 'Great networking progress! Keep growing your study community.'
                  }
                </div>
              </div>
            </motion.div>
          </div>

          {/* Premium Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Enhanced My Study Buddies Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                      <FaUsers className="text-white text-xl" />
                    </div>
                    My Study Buddies
                    <span className="ml-4 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-lg font-semibold">
                      {friends.length}
                    </span>
                  </h2>
                  
                  {friends.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <button className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center space-x-2">
                        <HiChat className="w-4 h-4" />
                        <span>Message All</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {friends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {friends.map((friend, index) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <FriendCard
                          friend={friend}
                          onChat={handleChat}
                          onRemove={removeFriend}
                          isDropdownOpen={openDropdownId === friend.id}
                          onToggleDropdown={() => setOpenDropdownId(openDropdownId === friend.id ? null : friend.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-3xl border-2 border-dashed border-gray-300"
                  >
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FaUsers className="w-12 h-12 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No study buddies yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                      Start building your learning network! Connect with passionate students and create meaningful study partnerships.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const suggestionsElement = document.getElementById('suggestions');
                        
                        if (suggestionsElement) {
                          suggestionsElement.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          // If no suggestions are available, trigger a new fetch
                          if (currentUser) {
                            fetchSuggestions(currentUser.authId);
                          }
                        }
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Discover Study Partners
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.section>

            {/* Premium Suggested Connections */}
            {suggestions.length > 0 && (
              <motion.section
                id="suggestions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 rounded-3xl p-8 border border-gray-200 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
                        <HiSparkles className="text-white text-xl" />
                      </div>
                      Suggested Study Buddies
                      <span className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-lg font-semibold">
                        Personalized
                      </span>
                    </h2>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span>AI-Powered Matching</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.profile.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SuggestionCard
                          suggestion={suggestion}
                          onConnect={sendInvitation}
                          connecting={connectingUsers.has(suggestion.profile.id)}
                          inviteSent={sentInvitations.has(suggestion.profile.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Load more suggestions */}
                  <div className="text-center mt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-3 bg-white/80 hover:bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Load More Suggestions
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </div>
      
      {/* Universal Footer */}
      <Footer showEduNews={true} />
    </div>
  );
}

