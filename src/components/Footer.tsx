"use client";

import { motion } from 'framer-motion';
import { IoNewspaper, IoFlash } from 'react-icons/io5';
import { useEffect, useState } from 'react';
import { newsService, type NewsArticle } from '@/lib/newsService';

interface FooterProps {
  showEduNews?: boolean;
}

export default function Footer({ showEduNews = true }: FooterProps) {
  const [eduNews, setEduNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true);
      try {
        const news = await newsService.getNewsArticles();
        setEduNews(news);
      } catch (error) {
        console.error('Failed to load news:', error);
        setEduNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();
    
    // Refresh news every 10 minutes
    const interval = setInterval(loadNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
                {isLoading ? (
                  <span className="mx-8 text-gray-500 font-medium text-sm">
                    Loading education & career news...
                  </span>
                ) : eduNews.length > 0 ? (
                  eduNews.concat(eduNews).map((article: NewsArticle, index: number) => (
                    <a
                      key={index}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mx-8 text-gray-700 font-medium text-sm hover:text-indigo-600 transition-colors duration-300 cursor-pointer"
                    >
                      {article.title}
                    </a>
                  ))
                ) : (
                  <span className="mx-8 text-gray-500 font-medium text-sm">
                    No education news available at the moment...
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
