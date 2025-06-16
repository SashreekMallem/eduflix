"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaUsers, FaHome, FaUser, FaComments } from 'react-icons/fa';

interface HeaderProps {
  currentPage?: string;
  currentUser?: {
    profile: {
      full_name: string;
    };
  } | null;
  pageIcon?: React.ReactNode;
  pageTitle?: string;
}

export default function Header({ currentPage = '', currentUser, pageIcon, pageTitle }: HeaderProps) {
  const router = useRouter();

  const getPageIcon = () => {
    if (pageIcon) return pageIcon;
    switch (currentPage) {
      case 'friends': return <FaUsers className="w-4 h-4 text-white" />;
      case 'home': return <FaHome className="w-4 h-4 text-white" />;
      case 'profile': return <FaUser className="w-4 h-4 text-white" />;
      case 'messenger': return <FaComments className="w-4 h-4 text-white" />;
      default: return <FaHome className="w-4 h-4 text-white" />;
    }
  };

  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    switch (currentPage) {
      case 'friends': return 'Study Network';
      case 'home': return 'Dashboard';
      case 'profile': return 'Profile';
      case 'myprofile': return 'My Profile';
      case 'messenger': return 'Messages';
      default: return 'EduFlix AI';
    }
  };

  return (
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
            {currentPage && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    {getPageIcon()}
                  </div>
                  <span className="text-xl font-bold text-gray-900">{getPageTitle()}</span>
                </div>
              </>
            )}
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
  );
}
