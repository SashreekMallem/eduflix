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
const FriendCard = ({ friend, onChat }: { 
  friend: Friend; 
  onChat: (username: string) => void;
}) => (
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
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
              <HiDotsHorizontal className="w-5 h-5" />
            </button>
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

// Premium Invitation Card with enhanced visual appeal
const InvitationCard = ({ invitation, onAccept, onDecline }: {
  invitation: FriendInvitation;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    whileHover={{ scale: 1.02 }}
    className="bg-gradient-to-r from-white to-indigo-50/30 rounded-2xl p-5 shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
  >
    {/* Decorative accent */}
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
    
    <div className="flex items-center space-x-4">
      <div className="relative">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {invitation.sender_profile.full_name?.charAt(0) || 'U'}
        </div>
        {/* New invitation indicator */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-gray-900 mb-1">
          {invitation.sender_profile.full_name}
        </h4>
        <p className="text-sm text-gray-600 mb-2">@{invitation.sender_profile.username}</p>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <HiSparkles className="w-3 h-3 text-yellow-500" />
          <span>Wants to connect</span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAccept(invitation.id)}
          className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl flex items-center justify-center text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <FaCheck />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDecline(invitation.id)}
          className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl flex items-center justify-center text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <FaTimes />
        </motion.button>
      </div>
    </div>
    
    {invitation.message && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-indigo-50/50 rounded-xl border border-gray-100"
      >
        <p className="text-sm text-gray-700 italic leading-relaxed">
          &ldquo;{invitation.message}&rdquo;
        </p>
      </motion.div>
    )}
  </motion.div>
);

// Premium Suggestion Card with world-class design
const SuggestionCard = ({ suggestion, onConnect, connecting }: {
  suggestion: UserSuggestion;
  onConnect: (userId: string) => void;
  connecting: boolean;
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
        onClick={() => onConnect(suggestion.profile.user_id)}
        disabled={connecting}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform ${
          connecting
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
        }`}
      >
        {connecting ? (
          <div className="flex items-center justify-center space-x-2">
            <FaCheck className="w-4 h-4" />
            <span>Invitation Sent</span>
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
  const [currentUser, setCurrentUser] = useState<{ id: string; profile: UserProfile } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<FriendInvitation[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());

  const initializeUser = useCallback(async () => {
    console.log('🚀 ===== INITIALIZING USER =====');
    try {
      setLoading(true);
      
      console.log('🚀 Getting Supabase session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🚀 Session check result:', { 
        sessionExists: !!session, 
        userExists: !!session?.user, 
        userId: session?.user?.id, 
        error: sessionError 
      });
      
      if (sessionError) {
        console.error('🚀 Session error:', sessionError);
        router.push('/auth/login');
        return;
      }
      
      if (!session?.user) {
        console.log('🚀 No session found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      const userId = session.user.id;
      console.log('🚀 Valid user ID found:', userId);
      
      console.log('🚀 Fetching user profile...');
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('🚀 Profile fetch result:', { 
        profileExists: !!profile, 
        profile: profile, 
        error: profileError 
      });

      if (profileError) {
        console.error('🚀 Profile fetch error:', profileError);
        if (profileError.code === 'PGRST116') {
          console.log('🚀 No profile found for user, user may need to complete onboarding');
        }
        setLoading(false);
        return;
      }

      if (profile) {
        const currentUserData = { id: userId, profile };
        setCurrentUser(currentUserData);
        console.log('🚀 Current user set successfully:', currentUserData);
        
        // Fetch all data after setting current user
        console.log('🚀 Fetching all data (friends, invitations, suggestions)...');
        const fetchPromises = [
          fetchFriendsForUser(userId),
          fetchInvitationsForUser(userId),
          fetchSuggestions(userId)
        ];
        
        await Promise.all(fetchPromises);
        console.log('🚀 All data fetched successfully');
      } else {
        console.log('🚀 No profile data returned');
      }
      
      setLoading(false);
      console.log('🚀 ===== INITIALIZATION COMPLETE =====');
    } catch (error) {
      console.error('🚀 ===== INITIALIZATION ERROR =====');
      console.error('🚀 Error initializing user:', error);
      console.error('🚀 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setLoading(false);
    }
  }, [router]);

  // Helper functions that don't depend on currentUser state
  const fetchFriendsForUser = async (userId: string) => {
    try {
      console.log('Fetching friends for user:', userId);
      
      // Simple query without complex joins first
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        setFriends([]);
        return;
      }

      console.log('Raw friendships data:', friendships);
      
      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      // Get friend profiles separately
      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', friendIds);

      if (profileError) {
        console.error('Error fetching friend profiles:', profileError);
        setFriends([]);
        return;
      }

      // Combine data manually
      const transformedFriends: Friend[] = friendships.map(friendship => {
        const profile = profiles?.find(p => p.user_id === friendship.friend_id);
        return {
          id: friendship.id,
          user_id: friendship.user_id,
          friend_id: friendship.friend_id,
          status: friendship.status as 'pending' | 'accepted' | 'blocked',
          created_at: friendship.created_at,
          friend_profile: profile as UserProfile,
          friend_education: [] // Will fetch separately if needed
        };
      }).filter(f => f.friend_profile); // Filter out friends without profiles

      console.log('Transformed friends:', transformedFriends);
      setFriends(transformedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    }
  };

  const fetchInvitationsForUser = async (userId: string) => {
    try {
      console.log('Fetching invitations for user:', userId);
      
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

      console.log('Raw invitations data:', invitations);

      if (!invitations || invitations.length === 0) {
        setInvitations([]);
        return;
      }

      // Get sender profiles separately
      const senderIds = invitations.map(inv => inv.sender_id);
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', senderIds);

      if (profileError) {
        console.error('Error fetching sender profiles:', profileError);
        setInvitations([]);
        return;
      }

      // Combine data manually
      const transformedInvitations: FriendInvitation[] = invitations.map(invitation => {
        const profile = profiles?.find(p => p.user_id === invitation.sender_id);
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

      console.log('Transformed invitations:', transformedInvitations);
      setInvitations(transformedInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    }
  };

  const fetchFriends = async () => {
    if (!currentUser) return;
    await fetchFriendsForUser(currentUser.id);
  };

  const fetchInvitations = async () => {
    if (!currentUser) return;
    await fetchInvitationsForUser(currentUser.id);
  };

  const fetchSuggestions = async (userId: string) => {
    try {
      console.log('Fetching suggestions for user:', userId);
      
      // Simplified approach - just get some users and create basic suggestions
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, username, current_status, skills, career_goals, learning_goals, created_at')
        .neq('user_id', userId)
        .limit(10);

      if (error) {
        console.error('Error fetching user profiles for suggestions:', error);
        setSuggestions([]);
        return;
      }

      console.log('Profiles for suggestions:', profiles);

      if (!profiles || profiles.length === 0) {
        setSuggestions([]);
        return;
      }

      // Get current user's profile for comparison
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('skills, career_goals, learning_goals')
        .eq('user_id', userId)
        .single();

      // Create suggestions with basic compatibility scoring
      const suggestions: UserSuggestion[] = profiles.map(profile => {
        const userSkills = userProfile?.skills || [];
        const profileSkills = profile.skills || [];
        
        // Calculate shared skills
        const sharedSkills = userSkills.filter((skill: string) => profileSkills.includes(skill));
        
        // Basic compatibility score
        const compatibilityScore = Math.min(100, Math.max(60, 
          (sharedSkills.length * 20) + Math.floor(Math.random() * 30) + 50
        ));

        return {
          profile: profile as UserProfile,
          compatibility_score: compatibilityScore,
          shared_interests: sharedSkills.slice(0, 3),
          mutual_connections: Math.floor(Math.random() * 3)
        };
      }).sort((a, b) => b.compatibility_score - a.compatibility_score).slice(0, 6);

      console.log('Generated suggestions:', suggestions);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    // Debug Supabase connection on component mount
    const debugSupabaseConnection = async () => {
      console.log('🔧 ===== DEBUGGING SUPABASE CONNECTION =====');
      console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔧 Supabase Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
      console.log('🔧 Supabase client:', supabase);
      
      try {
        console.log('🔧 Testing basic connection...');
        const { data, error } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        
        console.log('🔧 Connection test result:', { data, error });
        
        if (error) {
          console.error('🔧 Connection failed:', error);
        } else {
          console.log('🔧 ✅ Supabase connection successful!');
        }
      } catch (err) {
        console.error('🔧 Connection exception:', err);
      }
    };
    
    // Diagnostic function to check database content
    const debugDatabaseContent = async () => {
      try {
        console.log('🔍 ===== DATABASE CONTENT DIAGNOSTIC =====');
        
        // Check user_profiles table
        const { data: allProfiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*');
        
        console.log('🔍 All user profiles in database:');
        console.log('🔍 Count:', allProfiles?.length || 0);
        console.log('🔍 Data:', allProfiles);
        console.log('🔍 Error:', profileError);

        // Check if current user has a profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: currentUserProfile, error: currentUserError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id);
          
          console.log('🔍 Current user profile:');
          console.log('🔍 User ID:', session.user.id);
          console.log('🔍 Profile data:', currentUserProfile);
          console.log('🔍 Profile error:', currentUserError);
        }

        // Test manual profile creation
        console.log('🔍 Testing manual profile lookup...');
        const { data: testProfile, error: testError } = await supabase
          .from('user_profiles')
          .select('*')
          .ilike('full_name', '%emily%');
        
        console.log('🔍 Emily search test:');
        console.log('🔍 Results:', testProfile);
        console.log('🔍 Error:', testError);

        // Check if there are any other tables with users
        const { data: authUsers, error: authError } = await supabase.auth.getUser();
        console.log('🔍 Current auth user:', authUsers);
        console.log('🔍 Auth error:', authError);

      } catch (error) {
        console.error('🔍 Database diagnostic error:', error);
      }
    };
    
    debugSupabaseConnection();
    debugDatabaseContent();
    initializeUser();
  }, [initializeUser]);

  const searchUsers = async (query: string) => {
    console.log('🔍 ===== SEARCH FUNCTION CALLED =====');
    console.log('🔍 Query:', query);
    console.log('🔍 Query length:', query.length);
    console.log('🔍 Query trimmed:', query.trim());
    console.log('🔍 Current user:', currentUser);
    console.log('🔍 Supabase client:', supabase);
    
    if (!query.trim()) {
      console.log('🔍 Empty query detected, clearing results');
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    if (!currentUser) {
      console.log('🔍 No current user found, cannot search');
      console.log('🔍 currentUser state:', currentUser);
      setSearchResults([]);
      setSearching(false);
      return;
    }

    try {
      setSearching(true);
      console.log('🔍 ===== STARTING SUPABASE SEARCH =====');
      console.log('🔍 Search query:', query);
      console.log('🔍 Current user ID:', currentUser.id);
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      console.log('🔍 Supabase connection test:', { testData, testError });
      
      if (testError) {
        console.error('🔍 Supabase connection failed:', testError);
        setSearchResults([]);
        setSearching(false);
        return;
      }
      
      console.log('🔍 Executing search query...');
      
      // Simple search without complex filtering first
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, username, current_status, skills, career_goals, learning_goals, created_at')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('user_id', currentUser.id)
        .limit(10);

      console.log('🔍 ===== SUPABASE SEARCH COMPLETE =====');
      console.log('🔍 Profiles found:', profiles);
      console.log('🔍 Profiles count:', profiles?.length || 0);
      console.log('🔍 Search error:', error);

      if (error) {
        console.error('🔍 Error searching users:', error);
        console.error('🔍 Error details:', JSON.stringify(error, null, 2));
        setSearchResults([]);
        setSearching(false);
        return;
      }

      const results = (profiles as UserProfile[]) || [];
      console.log('🔍 Transformed results:', results);
      console.log('🔍 Results count:', results.length);
      console.log('🔍 Setting search results...');
      
      setSearchResults(results);
      setSearching(false);
      
      console.log('🔍 ===== SEARCH RESULTS SET =====');
      console.log('🔍 Final results:', results);
    } catch (error) {
      console.error('🔍 ===== SEARCH EXCEPTION =====');
      console.error('🔍 Exception in search:', error);
      console.error('🔍 Exception stack:', error instanceof Error ? error.stack : 'No stack trace');
      setSearchResults([]);
      setSearching(false);
    }
  };

  const sendInvitation = async (receiverId: string, message?: string) => {
    if (!currentUser) return;

    setConnectingUsers(prev => new Set(prev).add(receiverId));
    
    try {
      console.log('Sending invitation from', currentUser.id, 'to', receiverId);
      
      // Simple insertion without complex checks first
      const { error } = await supabase
        .from('friend_invitations')
        .insert([{
          sender_id: currentUser.id,
          receiver_id: receiverId,
          status: 'pending',
          message: message || null
        }]);

      if (error) {
        console.error('Error sending invitation:', error);
      } else {
        console.log('Invitation sent successfully');
        // Remove from suggestions or search results
        setSuggestions(prev => prev.filter(s => s.profile.user_id !== receiverId));
        setSearchResults(prev => prev.filter(s => s.user_id !== receiverId));
      }
      
      // Show success feedback
      setTimeout(() => {
        setConnectingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(receiverId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiverId);
        return newSet;
      });
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!currentUser) return;

    try {
      console.log('Accepting invitation:', invitationId);
      
      // Update invitation status
      const { error } = await supabase
        .from('friend_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error accepting invitation:', error);
        return;
      }

      console.log('Invitation accepted successfully');
      
      // Refresh data to show the changes
      await Promise.all([
        fetchFriends(),
        fetchInvitations()
      ]);

    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (!currentUser) return;

    try {
      console.log('Declining invitation:', invitationId);
      
      const { error } = await supabase
        .from('friend_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error declining invitation:', error);
        return;
      }

      console.log('Invitation declined successfully');
      
      // Refresh invitations list
      await fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const handleChat = (username: string) => {
    router.push(`/messenger/${username}`);
  };

  // Fix the debouncing issue with useRef
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log('🔍 ===== SEARCH INPUT CHANGED =====');
    console.log('🔍 New query value:', query);
    console.log('🔍 Event target:', e.target);
    console.log('🔍 Previous query:', searchQuery);
    
    setSearchQuery(query);
    console.log('🔍 Query state updated to:', query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      console.log('🔍 Clearing previous timeout');
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    console.log('🔍 Setting new timeout for 300ms');
    searchTimeoutRef.current = setTimeout(() => {
      console.log('🔍 ===== DEBOUNCED SEARCH TRIGGERED =====');
      console.log('🔍 Executing search for:', query);
      console.log('🔍 Current user available:', !!currentUser);
      console.log('🔍 Supabase client available:', !!supabase);
      searchUsers(query);
    }, 300);
    
    console.log('🔍 Timeout set, waiting for debounce...');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Premium Header with glass morphism effect */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <button
                onClick={() => router.push('/home')}
                className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                EduFlix AI
              </button>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FaUsers className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Study Network</span>
              </div>
            </motion.div>
            
            {/* Premium user info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              {currentUser && (
                <div className="flex items-center space-x-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full px-4 py-2 border border-indigo-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {currentUser.profile.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {currentUser.profile.full_name}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

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
                {searchResults.map((user) => (
                  <SuggestionCard
                    key={user.id}
                    suggestion={{
                      profile: user,
                      mutual_connections: 0,
                      compatibility_score: 85,
                      shared_interests: user.skills?.slice(0, 2) || []
                    }}
                    onConnect={sendInvitation}
                    connecting={connectingUsers.has(user.user_id)}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Premium Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Enhanced Pending Invitations */}
            {invitations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3">
                    <FaUserPlus className="text-white" />
                  </div>
                  Study Invites
                  <span className="ml-3 px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs font-bold">
                    {invitations.length}
                  </span>
                </h3>
                <div className="space-y-4">
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
              
              {/* Progress indicator */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-700">Network Growth</span>
                  <span className="text-xs font-bold text-purple-600">85%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-4/5"></div>
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
                        console.log('🎯 ===== DISCOVER STUDY PARTNERS CLICKED =====');
                        console.log('🎯 Current user:', currentUser);
                        console.log('🎯 Current suggestions:', suggestions);
                        console.log('🎯 Suggestions length:', suggestions.length);
                        
                        const suggestionsElement = document.getElementById('suggestions');
                        console.log('🎯 Suggestions element found:', suggestionsElement);
                        
                        if (suggestionsElement) {
                          console.log('🎯 Suggestions element exists, scrolling...');
                          suggestionsElement.scrollIntoView({ behavior: 'smooth' });
                          console.log('🎯 Scroll command executed');
                        } else {
                          console.log('🎯 No suggestions element found, checking current state...');
                          console.log('🎯 Current user ID:', currentUser?.id);
                          console.log('🎯 Will fetch suggestions...');
                          
                          // If no suggestions are available, trigger a new fetch
                          if (currentUser) {
                            console.log('🎯 Fetching suggestions for user:', currentUser.id);
                            fetchSuggestions(currentUser.id);
                          } else {
                            console.log('🎯 No current user, cannot fetch suggestions');
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
                          connecting={connectingUsers.has(suggestion.profile.user_id)}
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
    </div>
  );
}

