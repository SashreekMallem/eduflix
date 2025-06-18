"use client";

import { motion } from 'framer-motion';
import { IoNewspaper, IoFlash } from 'react-icons/io5';

interface FooterProps {
  eduNews?: string[];
  showEduNews?: boolean;
}

export default function Footer({ eduNews = [], showEduNews = true }: FooterProps) {
  const defaultNews = [
    "EduFlix launches new AI-powered personalized learning pathways!",
    "Top 10 courses to boost your career in 2024.",
    "EduFlix partners with leading universities for exclusive content.",
    "New features added to EduFlix for enhanced learning experience.",
    "EduFlix introduces gamified learning to keep students engaged.",
    "EduFlix now supports offline learning for premium users.",
    "Join the EduFlix community and start your learning journey today!",
  ];

  const newsItems = eduNews.length > 0 ? eduNews : defaultNews;

  if (!showEduNews) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
      <div className="max-w-7xl mx-auto pl-2 pr-4">
        <div className="flex items-center h-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 mr-4"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <IoNewspaper className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                EduNews
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-1 text-amber-600">
              <IoFlash className="w-4 h-4" />
              <span className="text-xs font-medium">Live Updates</span>
            </div>
          </motion.div>
          
          {/* News Ticker */}
          <div className="flex-1 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="animate-marquee flex">
                {newsItems.concat(newsItems).map((news, index) => (
                  <span 
                    key={index} 
                    className="mx-8 text-gray-700 font-medium text-sm hover:text-indigo-600 transition-colors duration-300"
                  >
                    {news}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
