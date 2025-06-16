"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  FaTimes, FaCrown, FaMedal, FaTrophy, FaUserFriends, FaCalendarAlt, 
  FaChevronLeft, FaChevronRight, FaUser, FaPaperPlane, FaSearch, 
  FaEllipsisV, FaPlay, FaBookmark, FaClock, FaStar, FaFire, 
  FaGraduationCap, FaRocket, FaLightbulb, FaChartLine, FaBell,
  FaHeart, FaShare, FaComment, FaPlus, FaArrowRight, FaAward
} from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-theme.css';
import * as THREE from 'three';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import gsap from 'gsap';
import { createClient } from '@/lib/supabase';

// Modern Component Interfaces
interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar?: string;
  points: number;
  streak: number;
  level: number;
  career_goals?: string[];
  current_skills?: string[];
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  instructor: string;
  rating: number;
  enrolled: number;
  category: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'studying';
  lastActive: string;
  currentCourse?: string;
}

// Premium Learning Card Component
const PremiumLearningCard = ({ module }: { module: LearningModule }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'from-green-500 to-emerald-600';
      case 'intermediate': return 'from-yellow-500 to-orange-600';
      case 'advanced': return 'from-red-500 to-pink-600';
      default: return 'from-blue-500 to-purple-600';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Gradient Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getDifficultyColor(module.difficulty)} text-white`}>
            {module.difficulty.toUpperCase()}
          </div>
          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <FaBookmark className="text-white/70 hover:text-white" />
          </button>
        </div>

        {/* Thumbnail */}
        <div className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="aspect-video flex items-center justify-center">
            <FaPlay className="text-4xl text-white/50" />
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white">
            {module.duration}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
          {module.title}
        </h3>
        <p className="text-white/70 text-sm mb-4 line-clamp-2">
          {module.description}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Progress</span>
            <span>{module.progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${module.progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FaStar className="text-yellow-400 mr-1" />
              {module.rating}
            </div>
            <div className="flex items-center">
              <FaUser className="mr-1" />
              {module.enrolled.toLocaleString()}
            </div>
          </div>
          <span className="text-white/40">{module.instructor}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Achievement Badge Component
const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600';
      case 'rare': return 'from-blue-500 to-blue-600';
      case 'epic': return 'from-purple-500 to-purple-600';
      case 'legendary': return 'from-yellow-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 5 }}
      className={`relative p-4 rounded-2xl bg-gradient-to-br ${getRarityGradient(achievement.rarity)} text-white text-center min-w-[120px]`}
    >
      <div className="text-2xl mb-2">{achievement.icon}</div>
      <h4 className="font-bold text-sm mb-1">{achievement.title}</h4>
      <p className="text-xs opacity-80">{achievement.description}</p>
    </motion.div>
  );
};

// Friend Card Component
const FriendCard = ({ friend }: { friend: Friend }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'studying': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
            {friend.name.charAt(0)}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(friend.status)} rounded-full border-2 border-white`} />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold">{friend.name}</h4>
          <p className="text-white/60 text-xs">
            {friend.status === 'studying' ? `Studying ${friend.currentCourse}` : friend.lastActive}
          </p>
        </div>
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <FaComment className="text-white/70" />
        </button>
      </div>
    </motion.div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend?: number }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <FaChartLine className="mr-1" />
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-white/60 text-sm">{title}</p>
  </div>
);

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data - replace with real data from your backend
  const [featuredModules] = useState<LearningModule[]>([
    {
      id: '1',
      title: 'Advanced React Patterns',
      description: 'Master advanced React patterns including hooks, context, and performance optimization.',
      thumbnail: '',
      duration: '4h 32m',
      difficulty: 'advanced',
      progress: 65,
      instructor: 'Sarah Chen',
      rating: 4.8,
      enrolled: 12453,
      category: 'Frontend'
    },
    {
      id: '2',
      title: 'Machine Learning Fundamentals',
      description: 'Complete introduction to ML algorithms, data preprocessing, and model evaluation.',
      thumbnail: '',
      duration: '8h 15m',
      difficulty: 'intermediate',
      progress: 32,
      instructor: 'Dr. James Wilson',
      rating: 4.9,
      enrolled: 8921,
      category: 'AI/ML'
    },
    {
      id: '3',
      title: 'System Design Mastery',
      description: 'Learn to design scalable systems from scratch with real-world examples.',
      thumbnail: '',
      duration: '12h 45m',
      difficulty: 'advanced',
      progress: 0,
      instructor: 'Alex Rodriguez',
      rating: 4.7,
      enrolled: 15672,
      category: 'Backend'
    }
  ]);

  const [recentAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Speed Learner',
      description: 'Completed 5 modules this week',
      icon: <FaRocket />,
      unlockedAt: new Date(),
      rarity: 'rare'
    },
    {
      id: '2',
      title: 'First Steps',
      description: 'Completed your first course',
      icon: <FaGraduationCap />,
      unlockedAt: new Date(),
      rarity: 'common'
    }
  ]);

  const [friends] = useState<Friend[]>([
    {
      id: '1',
      name: 'Alice Chen',
      status: 'studying',
      lastActive: '2 min ago',
      currentCourse: 'React Advanced'
    },
    {
      id: '2',
      name: 'Bob Wilson',
      status: 'online',
      lastActive: 'Active now',
    },
    {
      id: '3',
      name: 'Carol Davis',
      status: 'offline',
      lastActive: '1 hour ago',
    }
  ]);

  const categories = ['All', 'AI/ML', 'Frontend', 'Backend', 'DevOps', 'Design', 'Data Science'];

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setUserProfile({
        id: '1',
        username: 'learner123',
        full_name: 'Alex Johnson',
        points: 2450,
        streak: 12,
        level: 8,
        career_goals: ['Senior Software Engineer', 'Tech Lead'],
        current_skills: ['JavaScript', 'React', 'Node.js']
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/home" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FaGraduationCap className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                EduFlix AI
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search courses, topics, or instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                />
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative">
                <FaBell className="text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>
              
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-white font-semibold text-sm">{userProfile?.full_name}</p>
                  <p className="text-white/60 text-xs">Level {userProfile?.level}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">{userProfile?.full_name?.split(' ')[0]}</span>
            </h1>
            <p className="text-xl text-white/70 mb-8">Ready to continue your learning journey?</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Points"
              value={userProfile?.points?.toLocaleString() || '0'}
              icon={<FaStar />}
              trend={12}
            />
            <StatsCard
              title="Learning Streak"
              value={`${userProfile?.streak || 0} days`}
              icon={<FaFire />}
              trend={5}
            />
            <StatsCard
              title="Courses Completed"
              value="23"
              icon={<FaGraduationCap />}
              trend={8}
            />
            <StatsCard
              title="Study Hours"
              value="142h"
              icon={<FaClock />}
              trend={15}
            />
          </div>
        </section>

        {/* Course Categories */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Continue Learning</h2>
            <Link href="/learning-pathway" className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors">
              <span>View Learning Path</span>
              <FaArrowRight />
            </Link>
          </div>

          {/* Category Filter */}
          <div className="flex space-x-3 mb-8 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category.toLowerCase())}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === category.toLowerCase()
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Courses */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredModules.map((module) => (
              <PremiumLearningCard key={module.id} module={module} />
            ))}
          </div>
        </section>

        {/* Bottom Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Achievements */}
          <section>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FaAward className="mr-3 text-yellow-400" />
              Recent Achievements
            </h3>
            <div className="space-y-4">
              {recentAchievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>

          {/* Study Buddies */}
          <section>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FaUserFriends className="mr-3 text-blue-400" />
              Study Buddies
            </h3>
            <div className="space-y-4">
              {friends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FaRocket className="mr-3 text-purple-400" />
              Quick Actions
            </h3>
            <div className="space-y-4">
              <Link href="/learning-pathway" className="block">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Create Learning Path</h4>
                      <p className="text-white/60 text-sm">Generate AI-powered study plan</p>
                    </div>
                    <FaLightbulb className="text-2xl text-yellow-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </Link>

              <Link href="/study-group" className="block">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Join Study Group</h4>
                      <p className="text-white/60 text-sm">Connect with fellow learners</p>
                    </div>
                    <FaUserFriends className="text-2xl text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </Link>

              <button 
                onClick={() => setShowAIAssistant(true)}
                className="w-full"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Ask NJAN AI</h4>
                      <p className="text-white/60 text-sm">Get personalized help</p>
                    </div>
                    <FaRocket className="text-2xl text-purple-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAIAssistant(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">NJAN AI Assistant</h3>
                <button
                  onClick={() => setShowAIAssistant(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <FaTimes className="text-white" />
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaRocket className="text-white text-2xl" />
                </div>
                <p className="text-white/70 mb-6">
                  Hi! I'm NJAN, your AI learning assistant. How can I help you today?
                </p>
                <div className="flex space-x-3">
                  <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:scale-105 transition-transform">
                    Start Chat
                  </button>
                  <button 
                    onClick={() => setShowAIAssistant(false)}
                    className="px-6 py-3 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
