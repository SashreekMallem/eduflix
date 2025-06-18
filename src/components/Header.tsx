"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaUser, FaComments, FaUsers, FaHome } from 'react-icons/fa';
import { IoPlay, IoPeople, IoSchool, IoChatbubble, IoHome } from 'react-icons/io5';
import EduReels from './EduReels';

interface HeaderProps {
  currentPage?: string;
  currentUser?: {
    profile: {
      full_name: string;
    };
  } | null;
  pageTitle?: string;
}

// Navigation pages configuration
const navigationPages = [
  { id: 'home', title: 'Dashboard', emoji: '🏠', path: '/home', icon: FaHome },
  { id: 'discussion', title: 'Discussion Room', emoji: '💬', path: '/discussion', icon: IoChatbubble },
  { id: 'messenger', title: 'Messages', emoji: '📱', path: '/messenger', icon: FaComments },
  { id: 'friends', title: 'Study Network', emoji: '👥', path: '/friends', icon: FaUsers },
  { id: 'study-group', title: 'Study Groups', emoji: '📚', path: '/study-group', icon: IoSchool },
  { id: 'myprofile', title: 'My Profile', emoji: '👤', path: '/myprofile', icon: FaUser }
];

export default function Header({ currentPage = '', currentUser, pageTitle }: HeaderProps) {
  const router = useRouter();
  const [showEduReels, setShowEduReels] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);

  const getCurrentPageData = () => {
    const currentPageData = navigationPages.find(page => 
      page.id === currentPage || 
      page.title === pageTitle ||
      (currentPage === 'profile' && page.id === 'myprofile')
    );
    return currentPageData || navigationPages[0]; // Default to Dashboard
  };

  const getPageIcon = () => {
    // When hovering, show icon for the carousel page, otherwise current page
    const targetPage = isHovering ? navigationPages[currentCarouselIndex] : getCurrentPageData();
    const IconComponent = targetPage.icon;
    return <IconComponent className="w-4 h-4 text-white" />;
  };

  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    return getCurrentPageData().title;
  };

  const handleCarouselScroll = (e: React.WheelEvent) => {
    console.log('Scroll event triggered:', { isHovering, deltaY: e.deltaY }); // Debug
    
    if (!isHovering) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Throttle scrolling - only allow one change per 300ms
    const now = Date.now();
    if (now - lastScrollTime.current < 300) {
      console.log('Scroll throttled - too fast'); // Debug
      return;
    }
    lastScrollTime.current = now;
    
    // Simple scroll detection - any movement counts
    const direction = e.deltaY > 0 ? 1 : -1;
    console.log('Changing carousel direction:', direction); // Debug
    
    setCurrentCarouselIndex(prev => {
      const newIndex = prev + direction;
      const finalIndex = newIndex >= navigationPages.length ? 0 : 
                        newIndex < 0 ? navigationPages.length - 1 : newIndex;
      console.log('Carousel index changed from', prev, 'to', finalIndex); // Debug
      return finalIndex;
    });
  };

  const handleCarouselClick = () => {
    const selectedPage = navigationPages[currentCarouselIndex];
    if (selectedPage.path !== `/${currentPage}`) {
      router.push(selectedPage.path);
    }
    setIsHovering(false);
  };

  // Initialize carousel to current page when starting to hover
  const handleMouseEnter = () => {
    console.log('Mouse entered, setting hover to true'); // Debug
    setIsHovering(true);
    // Set carousel to current page immediately when hovering starts
    const currentPageData = navigationPages.find(page => 
      page.id === currentPage || 
      page.title === pageTitle ||
      (currentPage === 'profile' && page.id === 'myprofile')
    ) || navigationPages[0];
    
    const currentIndex = navigationPages.findIndex(page => page.id === currentPageData.id);
    setCurrentCarouselIndex(currentIndex >= 0 ? currentIndex : 0);
    console.log('Set carousel to current page index:', currentIndex); // Debug
  };

  useEffect(() => {
    // Initialize carousel to current page on mount
    const currentPageData = navigationPages.find(page => 
      page.id === currentPage || 
      page.title === pageTitle ||
      (currentPage === 'profile' && page.id === 'myprofile')
    ) || navigationPages[0];
    
    const currentIndex = navigationPages.findIndex(page => page.id === currentPageData.id);
    setCurrentCarouselIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [currentPage, pageTitle]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
      <div className="max-w-7xl mx-auto pl-2 pr-4">
        <div className="flex justify-between items-center h-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <button
              onClick={() => router.push('/home')}
              className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              EduFlix AI
            </button>
            {currentPage && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  {/* Original Purple Icon - Always visible */}
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    {getPageIcon()}
                  </div>
                  
                  {/* Page Title with Invisible Carousel - Fixed Position */}
                  <div 
                    ref={carouselRef}
                    className="relative cursor-pointer"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setIsHovering(false)}
                    onWheel={handleCarouselScroll}
                    onClick={handleCarouselClick}
                  >
                    {/* Page Title - Changes on scroll */}
                    <span className="text-xl font-bold text-gray-900 select-none">
                      {isHovering 
                        ? navigationPages[currentCarouselIndex].title
                        : getPageTitle()
                      }
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
          
          {/* Premium user info and EduReels */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            {/* EduReels Button */}
            <button
              onClick={() => setShowEduReels(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <IoPlay className="w-4 h-4" />
              <span className="text-sm">EduReels</span>
            </button>

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

      {/* EduReels Component */}
      <EduReels 
        isOpen={showEduReels} 
        onCloseAction={() => setShowEduReels(false)} 
      />
    </header>
  );
}
