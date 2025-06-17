"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar, { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import {
  IoHelpCircle,
  IoMic,
  IoVideocam,
  IoCheckmark,
  IoClose,
  IoSend,
  IoCalendar,
  IoTrophy,
  IoFlame,
  IoStar,
  IoChatbubble,
  IoRocket,
  IoPlay,
  IoSchool,
  IoBulb,
  IoTime
} from 'react-icons/io5';

// Types for better type safety
interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  name: string;
  description: string;
  videos: Video[];
}

interface Video {
  id: string;
  title: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface Helper {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  courses: string[];
  rating: number;
  totalSessions: number;
  responseTime: string;
  isOnline: boolean;
  expertise: string[];
  bio: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

const TimeOptions = () => {
  const times = [];
  for (let i = 0; i < 24; i++) {
    times.push(`${i.toString().padStart(2, '0')}:00`);
    times.push(`${i.toString().padStart(2, '0')}:30`);
  }
  return times;
};

export default function DiscussionPage() {
  const router = useRouter();
  
  // Core state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [question, setQuestion] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  
  // Helper matching state
  const [potentialHelpers, setPotentialHelpers] = useState<Helper[]>([]);
  const [selectedHelper, setSelectedHelper] = useState<Helper | null>(null);
  const [isLoadingHelpers, setIsLoadingHelpers] = useState(false);
  const [isAwaitingHelper, setIsAwaitingHelper] = useState(false);
  const [isHelperAccepted, setIsHelperAccepted] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scheduling state
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  
  // Gamification state
  const [xp, setXp] = useState(1250);
  const [streak, setStreak] = useState(7);
  const [level, setLevel] = useState(5);

  // Mock data (will be replaced with Supabase)
  const [availableCourses] = useState<Course[]>([
    {
      id: '1',
      name: 'Data Structures & Algorithms',
      description: 'Master fundamental computer science concepts',
      chapters: [
        {
          id: '1',
          name: 'Arrays & Strings',
          description: 'Basic data structures and operations',
          videos: [
            { id: '1', title: 'Introduction to Arrays', duration: '12:30', difficulty: 'beginner' },
            { id: '2', title: 'Array Operations & Complexity', duration: '18:45', difficulty: 'intermediate' },
            { id: '3', title: 'String Manipulation Techniques', duration: '15:20', difficulty: 'intermediate' }
          ]
        },
        {
          id: '2',
          name: 'Linked Lists',
          description: 'Dynamic data structures and pointers',
          videos: [
            { id: '4', title: 'Singly Linked Lists', duration: '20:15', difficulty: 'beginner' },
            { id: '5', title: 'Doubly Linked Lists', duration: '16:30', difficulty: 'intermediate' },
            { id: '6', title: 'Circular Linked Lists', duration: '14:45', difficulty: 'advanced' }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Web Development',
      description: 'Build modern web applications',
      chapters: [
        {
          id: '3',
          name: 'Frontend Fundamentals',
          description: 'HTML, CSS, and JavaScript basics',
          videos: [
            { id: '7', title: 'HTML5 Semantic Elements', duration: '25:10', difficulty: 'beginner' },
            { id: '8', title: 'CSS Grid & Flexbox', duration: '32:45', difficulty: 'intermediate' },
            { id: '9', title: 'JavaScript ES6+ Features', duration: '28:30', difficulty: 'intermediate' }
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Machine Learning',
      description: 'AI and data science fundamentals',
      chapters: [
        {
          id: '4',
          name: 'Introduction to ML',
          description: 'Basic concepts and algorithms',
          videos: [
            { id: '10', title: 'What is Machine Learning?', duration: '18:20', difficulty: 'beginner' },
            { id: '11', title: 'Supervised vs Unsupervised Learning', duration: '22:15', difficulty: 'intermediate' }
          ]
        }
      ]
    }
  ]);

  const [mockHelpers] = useState<Helper[]>([
    {
      id: '1',
      name: 'Alex Chen',
      username: 'alexchen',
      courses: ['Data Structures & Algorithms', 'Web Development'],
      rating: 4.9,
      totalSessions: 127,
      responseTime: '< 2 min',
      isOnline: true,
      expertise: ['JavaScript', 'Python', 'React', 'Algorithms'],
      bio: 'Computer Science grad with 3+ years experience in full-stack development.'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      username: 'sarahj',
      courses: ['Machine Learning', 'Data Structures & Algorithms'],
      rating: 4.8,
      totalSessions: 89,
      responseTime: '< 5 min',
      isOnline: true,
      expertise: ['Python', 'TensorFlow', 'Statistics', 'Data Science'],
      bio: 'ML Engineer passionate about teaching data science concepts.'
    },
    {
      id: '3',
      name: 'Michael Rodriguez',
      username: 'mrodriguez',
      courses: ['Web Development', 'Data Structures & Algorithms'],
      rating: 4.7,
      totalSessions: 156,
      responseTime: '< 3 min',
      isOnline: false,
      expertise: ['React', 'Node.js', 'TypeScript', 'AWS'],
      bio: 'Senior developer with expertise in modern web technologies.'
    }
  ]);

  // Initialization
  useEffect(() => {
    const initializeUser = async () => {
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
          });
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [router]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Mock API call to find helpers
  useEffect(() => {
    const fetchHelpers = async () => {
      if (selectedCourse && question.trim()) {
        setIsLoadingHelpers(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Filter helpers based on selected course
        const relevantHelpers = mockHelpers.filter(helper => 
          helper.courses.includes(selectedCourse)
        );
        
        setPotentialHelpers(relevantHelpers);
        setIsLoadingHelpers(false);
      } else {
        setPotentialHelpers([]);
        setIsLoadingHelpers(false);
      }
    };

    if (isLoadingHelpers) {
      fetchHelpers();
    }
  }, [selectedCourse, question, isLoadingHelpers, mockHelpers]);

  const handleSubmitQuestion = () => {
    if (!selectedCourse || !question.trim()) {
      return;
    }
    setIsLoadingHelpers(true);
  };

  const handleSelectHelper = (helper: Helper) => {
    setSelectedHelper(helper);
    setShowConfirmation(true);
  };

  const handleConfirmHelpRequest = () => {
    setShowConfirmation(false);
    setIsAwaitingHelper(true);

    // Simulate helper accepting after delay
    setTimeout(() => {
      setIsAwaitingHelper(false);
      setIsHelperAccepted(true);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: selectedHelper?.name || 'Helper',
        text: `Hi! I'm here to help you with ${selectedCourse}. What specific part are you struggling with?`,
        timestamp: new Date(),
        isCurrentUser: false
      };
      setChatMessages([welcomeMessage]);
    }, 3000);
  };

  const handleCancelConfirmation = () => {
    setSelectedHelper(null);
    setShowConfirmation(false);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !currentUser) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: currentUser.full_name,
      text: chatInput,
      timestamp: new Date(),
      isCurrentUser: true
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setXp(prev => prev + 10);

    // Simulate helper response
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me explain...",
        "I can help you with that. Here's what I'd suggest...",
        "Good point! Have you tried this approach?",
        "Let me share a resource that might help...",
        "That's a common issue. Here's how to solve it..."
      ];
      
      const helperResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: selectedHelper?.name || 'Helper',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        isCurrentUser: false
      };
      
      setChatMessages(prev => [...prev, helperResponse]);
    }, 1000 + Math.random() * 2000);
  };

  const handleStartSession = () => {
    setXp(prev => prev + 50);
    if (streak === 6) {
      setStreak(7);
      setLevel(prev => prev + 1);
    }
  };

  const handleDateChange: CalendarProps['onChange'] = (date) => {
    if (date instanceof Date) {
      setScheduledTime(date);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
  };

  const handleFinalizeSchedule = () => {
    if (scheduledTime && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDate = new Date(scheduledTime);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setScheduledTime(newDate);
      setShowCalendar(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-600 bg-emerald-50';
      case 'intermediate': return 'text-amber-600 bg-amber-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSelectedCourseData = () => {
    return availableCourses.find(course => course.name === selectedCourse);
  };

  const getSelectedChapterData = () => {
    const course = getSelectedCourseData();
    return course?.chapters.find(chapter => chapter.name === selectedChapter);
  };

  const getSelectedVideoData = () => {
    const chapter = getSelectedChapterData();
    return chapter?.videos.find(video => video.title === selectedVideo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header 
        currentPage="discussion" 
        pageIcon={<IoChatbubble className="w-4 h-4 text-white" />}
        pageTitle="Discussion Room"
        currentUser={currentUser ? { profile: { full_name: currentUser.full_name } } : undefined}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <IoBulb className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Help from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Expert Peers</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with knowledgeable students and get personalized help on any topic. 
            Join thousands of collaborative learning sessions.
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center space-x-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">12.5k+</div>
              <div className="text-sm text-gray-600">Help Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">4.9★</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">&lt; 3 min</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Question Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <IoHelpCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Ask Your Question</h2>
              </div>

              {/* Course Selection */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      setSelectedChapter('');
                      setSelectedVideo('');
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Choose a course...</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                  {getSelectedCourseData() && (
                    <p className="text-sm text-gray-600 mt-2">
                      {getSelectedCourseData()?.description}
                    </p>
                  )}
                </div>

                {/* Chapter Selection */}
                {selectedCourse && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Chapter
                    </label>
                    <select
                      value={selectedChapter}
                      onChange={(e) => {
                        setSelectedChapter(e.target.value);
                        setSelectedVideo('');
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Choose a chapter...</option>
                      {getSelectedCourseData()?.chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.name}>
                          {chapter.name}
                        </option>
                      ))}
                    </select>
                    {getSelectedChapterData() && (
                      <p className="text-sm text-gray-600 mt-2">
                        {getSelectedChapterData()?.description}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Video Selection */}
                {selectedChapter && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Video (Optional)
                    </label>
                    <select
                      value={selectedVideo}
                      onChange={(e) => setSelectedVideo(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Choose a specific video...</option>
                      {getSelectedChapterData()?.videos.map((video) => (
                        <option key={video.id} value={video.title}>
                          {video.title}
                        </option>
                      ))}
                    </select>
                    {getSelectedVideoData() && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{getSelectedVideoData()?.title}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(getSelectedVideoData()?.difficulty || '')}`}>
                              {getSelectedVideoData()?.difficulty}
                            </span>
                            <span className="text-sm text-gray-600">{getSelectedVideoData()?.duration}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Question Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Your Question
                  </label>
                  <textarea
                    placeholder="Describe what you're struggling with or what you'd like to learn more about..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    rows={4}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {question.length}/500 characters
                    </span>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <IoBulb className="w-4 h-4" />
                      <span>Be specific for better help</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  onClick={handleSubmitQuestion}
                  disabled={!selectedCourse || !question.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <IoRocket className="w-5 h-5 inline-block mr-2" />
                  Find Expert Help
                </motion.button>
              </div>
            </motion.div>

            {/* Loading State */}
            <AnimatePresence>
              {isLoadingHelpers && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8"
                >
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Finding Expert Helpers</h3>
                      <p className="text-gray-600">Matching you with the best tutors for {selectedCourse}...</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Available Helpers */}
            <AnimatePresence>
              {potentialHelpers.length > 0 && !selectedHelper && !isAwaitingHelper && !isHelperAccepted && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                      <IoSchool className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Available Helpers</h3>
                      <p className="text-gray-600">Choose from our top-rated tutors</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {potentialHelpers.map((helper, index) => (
                      <motion.div
                        key={helper.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                        onClick={() => handleSelectHelper(helper)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {helper.name.charAt(0)}
                                </span>
                              </div>
                              {helper.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-lg font-semibold text-gray-900">{helper.name}</h4>
                                <span className="text-sm text-gray-500">@{helper.username}</span>
                                {helper.isOnline && (
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                    Online
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">{helper.bio}</p>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <IoStar className="w-4 h-4 text-amber-500 mr-1" />
                                  <span className="font-medium">{helper.rating}</span>
                                </div>
                                <div className="flex items-center">
                                  <IoSchool className="w-4 h-4 mr-1" />
                                  <span>{helper.totalSessions} sessions</span>
                                </div>
                                <div className="flex items-center">
                                  <IoTime className="w-4 h-4 mr-1" />
                                  <span>Responds {helper.responseTime}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-3">
                                {helper.expertise.slice(0, 3).map((skill, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {skill}
                                  </span>
                                ))}
                                {helper.expertise.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{helper.expertise.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow">
                            Request Help
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
              {selectedHelper && showConfirmation && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IoCheckmark className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Help Request</h3>
                    <p className="text-gray-600 mb-6">
                      Send a help request to <span className="font-semibold">{selectedHelper.name}</span>?
                    </p>
                    
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={handleConfirmHelpRequest}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                      >
                        <IoCheckmark className="w-5 h-5 inline-block mr-2" />
                        Confirm Request
                      </button>
                      <button
                        onClick={handleCancelConfirmation}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                      >
                        <IoClose className="w-5 h-5 inline-block mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Awaiting Helper */}
            <AnimatePresence>
              {isAwaitingHelper && selectedHelper && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h3>
                    <p className="text-gray-600">
                      Waiting for <span className="font-semibold">{selectedHelper.name}</span> to respond...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Average response time: {selectedHelper.responseTime}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Session */}
            <AnimatePresence>
              {isHelperAccepted && selectedHelper && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                        <span className="text-white font-semibold">
                          {selectedHelper.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Session with {selectedHelper.name}
                        </h3>
                        <p className="text-emerald-600 font-medium">Connected and ready to help!</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleStartSession}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                      >
                        <IoVideocam className="w-5 h-5 inline-block mr-2" />
                        Start Video Call
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IoMic className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Chat</h4>
                    
                    <div className="bg-gray-50 rounded-xl p-4 h-64 overflow-y-auto mb-4">
                      {chatMessages.length > 0 ? (
                        <div className="space-y-4">
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                message.isCurrentUser 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}>
                                <p className="text-sm">{message.text}</p>
                                <p className={`text-xs mt-1 ${
                                  message.isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                                }`}>
                                  {message.timestamp.toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 mt-8">
                          <IoChatbubble className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Start the conversation by sending a message!</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim()}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <IoSend className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Session Actions */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Session Options</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={handleStartSession}
                        className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                      >
                        <IoPlay className="w-5 h-5 mr-2" />
                        Start Now
                      </button>
                      
                      <button
                        onClick={() => setShowCalendar(true)}
                        className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                      >
                        <IoCalendar className="w-5 h-5 mr-2" />
                        Schedule Later
                      </button>
                    </div>

                    {scheduledTime && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                        <p className="text-blue-900 font-medium">
                          Scheduled for: {scheduledTime.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* User Stats */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Progress</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IoTrophy className="w-5 h-5 text-amber-500 mr-2" />
                      <span className="text-gray-700">Level {level}</span>
                    </div>
                    <span className="font-bold text-gray-900">{xp} XP</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(xp % 1000) / 10}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IoFlame className="w-5 h-5 text-orange-500 mr-2" />
                      <span className="text-gray-700">Streak</span>
                    </div>
                    <span className="font-bold text-gray-900">{streak} days</span>
                  </div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Sessions</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">AC</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Data Structures Help</p>
                      <p className="text-xs text-gray-500">with Alex Chen • 2 hours ago</p>
                    </div>
                    <IoStar className="w-4 h-4 text-amber-500" />
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">SJ</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">ML Algorithms</p>
                      <p className="text-xs text-gray-500">with Sarah Johnson • Yesterday</p>
                    </div>
                    <IoStar className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
              </motion.div>

              {/* Tips */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center mb-3">
                  <IoBulb className="w-6 h-6 mr-2" />
                  <h3 className="text-lg font-bold">Pro Tip</h3>
                </div>
                <p className="text-blue-100 text-sm">
                  Be specific about what you&apos;re struggling with to get better help. 
                  Share your code or specific error messages for faster solutions!
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Calendar Modal */}
        <AnimatePresence>
          {showCalendar && (
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
                  <h3 className="text-xl font-bold text-gray-800">Schedule Session</h3>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>

                <Calendar
                  onChange={handleDateChange}
                  value={scheduledTime}
                  className="w-full mb-4"
                  minDate={new Date()}
                />

                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  onChange={(e) => handleTimeChange(e.target.value)}
                  value={selectedTime}
                >
                  <option value="">Select Time</option>
                  {TimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalizeSchedule}
                    disabled={!scheduledTime || !selectedTime}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Schedule
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
