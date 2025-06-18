"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { IoPlay, IoClose, IoHeart, IoShare, IoBookmark, IoVolumeHigh, IoVolumeMute, IoChevronUp, IoChevronDown } from 'react-icons/io5';

interface EduReel {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  category: 'tech' | 'business' | 'career' | 'skills' | 'motivation' | 'finance' | 'design' | 'data';
  duration: string;
  likes: number;
  isLiked: boolean;
  author: string;
  isNew?: boolean;
}

interface EduReelsProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function EduReels({ isOpen, onCloseAction }: EduReelsProps) {
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced mock data with more variety - replace with API call
  const [reels] = useState<EduReel[]>([
    {
      id: '1',
      title: '5-Minute Python Tips',
      description: 'Quick Python tricks that will boost your productivity instantly! 🐍✨',
      videoUrl: '/videos/python-tips.mp4',
      thumbnail: 'https://img.youtube.com/vi/3rOBx84g-VQ/maxresdefault.jpg',
      category: 'tech',
      duration: '0:45',
      likes: 1248,
      isLiked: false,
      author: 'TechMaster Pro',
      isNew: true
    },
    {
      id: '2',
      title: 'Career Growth Mindset',
      description: 'Transform your career with these mindset shifts! 🚀💼',
      videoUrl: '/videos/career-growth.mp4',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      category: 'career',
      duration: '1:20',
      likes: 2156,
      isLiked: true,
      author: 'CareerCoach Sarah'
    },
    {
      id: '3',
      title: 'React Hooks Explained',
      description: 'Master React Hooks in under 2 minutes! ⚛️🎯',
      videoUrl: '/videos/react-hooks.mp4',
      thumbnail: 'https://img.youtube.com/vi/3rOBx84g-VQ/maxresdefault.jpg',
      category: 'tech',
      duration: '1:45',
      likes: 3892,
      isLiked: false,
      author: 'DevExpert Mike'
    },
    {
      id: '4',
      title: 'Leadership Principles',
      description: 'Essential leadership skills for modern managers 👥💡',
      videoUrl: '/videos/leadership.mp4',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      category: 'business',
      duration: '2:10',
      likes: 1567,
      isLiked: false,
      author: 'Business Guru Alex'
    },
    {
      id: '5',
      title: 'Data Science Basics',
      description: 'Get started with data science in just 3 minutes! 📊🔍',
      videoUrl: '/videos/data-science.mp4',
      thumbnail: 'https://img.youtube.com/vi/3rOBx84g-VQ/maxresdefault.jpg',
      category: 'data',
      duration: '2:45',
      likes: 4321,
      isLiked: true,
      author: 'DataPro Analytics',
      isNew: true
    },
    {
      id: '6',
      title: 'Personal Finance 101',
      description: 'Smart money management tips for young professionals 💰📈',
      videoUrl: '/videos/finance.mp4',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      category: 'finance',
      duration: '1:30',
      likes: 2890,
      isLiked: false,
      author: 'FinanceWise Emma'
    },
    {
      id: '7',
      title: 'UI Design Principles',
      description: 'Create beautiful interfaces with these design rules! 🎨✨',
      videoUrl: '/videos/ui-design.mp4',
      thumbnail: 'https://img.youtube.com/vi/3rOBx84g-VQ/maxresdefault.jpg',
      category: 'design',
      duration: '2:20',
      likes: 3456,
      isLiked: true,
      author: 'DesignMaster Lisa'
    },
    {
      id: '8',
      title: 'Morning Motivation',
      description: 'Start your day with purpose and energy! ☀️💪',
      videoUrl: '/videos/motivation.mp4',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      category: 'motivation',
      duration: '1:15',
      likes: 5672,
      isLiked: false,
      author: 'MotivationDaily'
    }
  ]);

  // Seamless infinite scroll with auto-advance
  const navigateToReel = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentReelIndex((prev) => (prev + 1) % reels.length);
    } else {
      setCurrentReelIndex((prev) => (prev - 1 + reels.length) % reels.length);
    }
  }, [reels.length]);

  // Auto-advance timer for infinity pool effect
  useEffect(() => {
    if (isOpen && isPlaying) {
      autoAdvanceRef.current = setTimeout(() => {
        navigateToReel('next');
      }, 8000); // Auto-advance every 8 seconds
    }
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, [currentReelIndex, isOpen, isPlaying, navigateToReel]);

  // Auto-play when reel changes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
    }
  }, [currentReelIndex, isOpen]);

  // Handle swipe gestures for mobile
  const handleSwipe = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up') {
      navigateToReel('next');
    } else {
      navigateToReel('prev');
    }
  }, [navigateToReel]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleLike = () => {
    // Toggle like status - in real app, this would call an API
    console.log('Liked reel:', reels[currentReelIndex].id);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      tech: 'from-blue-500 to-cyan-500',
      business: 'from-purple-500 to-indigo-500',
      career: 'from-green-500 to-emerald-500',
      skills: 'from-orange-500 to-red-500',
      motivation: 'from-pink-500 to-rose-500',
      finance: 'from-yellow-500 to-orange-500',
      design: 'from-violet-500 to-purple-500',
      data: 'from-teal-500 to-blue-500'
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const currentReel = reels[currentReelIndex];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        ref={containerRef}
        onDrag={(_, info) => {
          if (info.offset.y > 100) {
            handleSwipe('down');
          } else if (info.offset.y < -100) {
            handleSwipe('up');
          }
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
      >
        {/* Enhanced Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onCloseAction}
          className="absolute top-6 right-6 z-60 w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
        >
          <IoClose className="w-6 h-6" />
        </motion.button>

        {/* Infinity Pool Container */}
        <motion.div 
          key={currentReelIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md h-full bg-black overflow-hidden"
        >
          
          {/* Enhanced Video Background with Smooth Transition */}
          <div className="absolute inset-0">
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Image
                src={currentReel.thumbnail}
                alt={currentReel.title}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
            {/* Enhanced Gradient Overlay for Infinity Pool Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
          </div>

          {/* Seamless Navigation Controls */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-6 z-40">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToReel('prev')}
              className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-md border border-white/10"
            >
              <IoChevronUp className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToReel('next')}
              className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-md border border-white/10"
            >
              <IoChevronDown className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Enhanced Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-24 h-24 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 border border-white/10"
                >
                  <IoPlay className="w-12 h-12 text-white ml-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Volume Control */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className="absolute top-6 left-6 z-40 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300"
          >
            {isMuted ? <IoVolumeMute className="w-5 h-5" /> : <IoVolumeHigh className="w-5 h-5" />}
          </motion.button>

          {/* Enhanced Content Overlay */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 p-6 text-white z-40"
          >
            
            {/* New Badge and Category */}
            <div className="flex items-center space-x-3 mb-4">
              {currentReel.isNew && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
                >
                  NEW
                </motion.span>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getCategoryColor(currentReel.category)} text-white shadow-lg`}>
                {currentReel.category.toUpperCase()}
              </span>
            </div>

            {/* Title and Author */}
            <motion.h3 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2 leading-tight"
            >
              {currentReel.title}
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-300 mb-1"
            >
              by {currentReel.author}
            </motion.p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-200 mb-4 leading-relaxed"
            >
              {currentReel.description}
            </motion.p>

            {/* Duration and Auto-play indicator */}
            <div className="flex items-center space-x-4 text-xs text-gray-300 mb-6">
              <span>Duration: {currentReel.duration}</span>
              {isPlaying && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Auto-playing</span>
                </div>
              )}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center space-x-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className="flex flex-col items-center space-y-2 group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentReel.isLiked 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'bg-white/20 text-white group-hover:bg-white/30 backdrop-blur-sm'
                }`}>
                  <IoHeart className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold">{(currentReel.likes / 1000).toFixed(1)}k</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center space-y-2 group"
              >
                <div className="w-14 h-14 bg-white/20 group-hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300">
                  <IoShare className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold">Share</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center space-y-2 group"
              >
                <div className="w-14 h-14 bg-white/20 group-hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300">
                  <IoBookmark className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold">Save</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Enhanced Progress Indicators - Infinity Pool Style */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-3 z-40">
            {reels.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ 
                  scale: index === currentReelIndex ? 1.2 : 0.8,
                  opacity: index === currentReelIndex ? 1 : 0.4 
                }}
                transition={{ duration: 0.3 }}
                className={`w-1.5 h-10 rounded-full transition-all duration-500 ${
                  index === currentReelIndex 
                    ? `bg-gradient-to-b ${getCategoryColor(currentReel.category)} shadow-lg` 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Auto-advance Progress Bar */}
          {isPlaying && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-50">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 8, ease: "linear" }}
                className={`h-full bg-gradient-to-r ${getCategoryColor(currentReel.category)}`}
                key={currentReelIndex}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
