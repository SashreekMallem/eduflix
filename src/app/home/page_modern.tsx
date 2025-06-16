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
import gsap from 'gsap';
import { createClient } from '@/lib/supabase';

// Interfaces
interface Reel {
  title: string;
  videoId: string;
  thumbnail: string;
  url?: string;
}

interface Friend {
  name: string;
  commonGroups?: string[];
  lastMessage?: string;
}

interface CatalogItemProps {
  title: string;
  type: string;
  thumbnail: string;
}

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

const CourseCard = ({ reel, router }: { reel: Reel; router: any }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300"
  >
    <h3 className="text-xl font-semibold text-white mb-3">{reel.title}</h3>
    {reel.thumbnail ? (
      <img src={reel.thumbnail} alt={reel.title} className="mb-4 rounded-lg w-full h-32 object-cover" />
    ) : (
      <div className="mb-4 rounded-lg w-full h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
        <FaPlay className="text-white/60 text-2xl" />
      </div>
    )}
  </motion.div>
);

const StudyGroupCard = ({ friend, router }: { friend: Friend; router: any }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300"
  >
    <h3 className="text-xl font-semibold text-white mb-3">
      <Link href={`/profile/${friend.name}`} className="hover:underline">
        {friend.name}
      </Link>
    </h3>
    <p className="text-white/60">Common Groups: {friend.commonGroups?.join(', ') || 'None'}</p>
  </motion.div>
);

const CatalogItem = ({ item }: { item: CatalogItemProps }) => (
  <motion.div 
    whileHover={{ scale: 1.05, y: -5 }}
    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300"
  >
    <img src={item.thumbnail} alt={item.title} className="w-full h-36 object-cover" />
    <div className="p-5">
      <h3 className="text-xl font-semibold text-white truncate">{item.title}</h3>
      <p className="text-white/60 text-sm truncate">{item.type}</p>
    </div>
  </motion.div>
);

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [eduReels, setEduReels] = useState<Reel[]>([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    { text: "Hello! I'm NJAN, your personal learning assistant. How can I help you today?", sender: "ai" }
  ]);
  const [eduNews, setEduNews] = useState([
    "EduFlix launches new AI-powered personalized learning pathways!",
    "Top 10 courses to boost your career in 2025.",
    "EduFlix partners with leading universities for exclusive content.",
    "New features added to EduFlix for enhanced learning experience.",
    "EduFlix introduces gamified learning to keep students engaged.",
    "EduFlix now supports offline learning for premium users.",
    "Join the EduFlix community and start your learning journey today!",
    "EduFlix offers scholarships for top-performing students.",
    "EduFlix collaborates with industry experts for exclusive content.",
    "EduFlix launches new coding bootcamp for aspiring developers.",
  ]);
  const [leaderboard, setLeaderboard] = useState([
    { name: 'Alice', points: 1200 },
    { name: 'Bob', points: 1100 },
    { name: 'Charlie', points: 1050 },
    { name: 'David', points: 1000 },
    { name: 'Eve', points: 950 },
  ]);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);
  const [assignments, setAssignments] = useState([
    { date: new Date(2025, 2, 13), title: 'Assignment 1', description: 'Description for Assignment 1' },
    { date: new Date(2025, 2, 17), title: 'Assignment 2', description: 'Description for Assignment 2' },
    { date: new Date(2025, 2, 24), title: 'Assignment 3', description: 'Description for Assignment 3' },
    { date: new Date(2025, 2, 6), title: 'Assignment 4', description: 'Description for Assignment 4' },
    { date: new Date(2025, 2, 10), title: 'Assignment 5', description: 'Description for Assignment 5' },
  ]);
  const [friends, setFriends] = useState<{ name: string; lastMessage?: string }[]>([]);
  const [userId, setUserId] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth_user_id");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingReels, setLoadingReels] = useState(false);
  const [reelsError, setReelsError] = useState(null);
  const [contentCatalog, setContentCatalog] = useState([
    { title: "Intro to JavaScript", type: "Video", thumbnail: "https://via.placeholder.com/300x150?text=JS" },
    { title: "Data Science Basics", type: "Blog", thumbnail: "https://via.placeholder.com/300x150?text=DS" },
    { title: "Python for Beginners", type: "Interactive Project", thumbnail: "https://via.placeholder.com/300x150?text=PY" },
    { title: "React Fundamentals", type: "Quiz", thumbnail: "https://via.placeholder.com/300x150?text=RE" },
    { title: "AI Ethics", type: "Reading Material", thumbnail: "https://via.placeholder.com/300x150?text=AI" },
    { title: "Machine Learning", type: "Podcast", thumbnail: "https://via.placeholder.com/300x150?text=ML" },
    { title: "Web Development", type: "Flashcards", thumbnail: "https://via.placeholder.com/300x150?text=WD" },
    { title: "Data Structures", type: "Video", thumbnail: "https://via.placeholder.com/300x150?text=ST" },
    { title: "Algorithms", type: "Blog", thumbnail: "https://via.placeholder.com/300x150?text=AL" },
    { title: "Cybersecurity", type: "Interactive Project", thumbnail: "https://via.placeholder.com/300x150?text=CS" },
  ]);

  const API_BASE_URL = "http://localhost:8000";
  const threeRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReelMinimized, setIsReelMinimized] = useState(false);

  const maxPoints = leaderboard.reduce((max, user) => Math.max(max, user.points), 0);

  // Navigation handlers
  const handlePrevReel = () => {
    setCurrentReelIndex((prevIndex) =>
      prevIndex === 0 ? eduReels.length - 1 : prevIndex - 1
    );
  };

  const handleNextReel = () => {
    setCurrentReelIndex((prevIndex) =>
      prevIndex === eduReels.length - 1 ? 0 : prevIndex + 1
    );
  };

  const toggleReelMinimize = () => {
    setIsReelMinimized(!isReelMinimized);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextReel();
      } else {
        handlePrevReel();
      }
    }
    
    setTouchStartX(null);
  };

  const handleDateClick = (date: Date) => {
    const assignment = assignments.find(a => a.date.toDateString() === date.toDateString());
    if (assignment) {
      alert(`Assignment: ${assignment.title}\n${assignment.description}`);
    }
  };

  const handleAssistantToggle = () => {
    setShowAssistant(!showAssistant);
  };

  const handleAssistantMessage = (message: string) => {
    setAssistantMessages([...assistantMessages, { text: message, sender: "user" }]);
    
    fetch(`${API_BASE_URL}/chat/llama-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })
    .then(response => response.json())
    .then(data => {
      setAssistantMessages(prev => [...prev, { text: data.response || "I'm here to help!", sender: "ai" }]);
    })
    .catch(error => {
      console.error('Error:', error);
      setAssistantMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting. Please try again later.", sender: "ai" }]);
    });
  };

  const replayCurrentReel = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
  };

  // Initialize 3D background
  useEffect(() => {
    if (!threeRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 400 / 400, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(400, 400);
    renderer.setClearColor(0x000000, 0);
    
    if (threeRef.current) {
      threeRef.current.appendChild(renderer.domElement);
    }
    
    // Initialize CSS2DRenderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(400, 400);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    if (threeRef.current) {
      threeRef.current.appendChild(labelRenderer.domElement);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create main molecule
    const mainGeometry = new THREE.DodecahedronGeometry(1.7, 0);
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      metalness: 1.0,
      roughness: 0.2,
    });
    const mainMolecule = new THREE.Mesh(mainGeometry, mainMaterial);
    scene.add(mainMolecule);

    // Create orbiting molecules
    const orbitingMolecules: THREE.Mesh[] = [];
    const skillCategories = [
      { name: "JS", color: 0xf59e0b, position: [3, 0, 0] },
      { name: "AI", color: 0x10b981, position: [-3, 0, 0] },
      { name: "PY", color: 0x3b82f6, position: [0, 3, 0] },
      { name: "ML", color: 0x8b5cf6, position: [0, -3, 0] },
      { name: "WD", color: 0xef4444, position: [2, 2, 2] },
      { name: "DS", color: 0x06b6d4, position: [-2, -2, -2] }
    ];

    skillCategories.forEach((skill, index) => {
      const geometry = new THREE.OctahedronGeometry(0.5, 0);
      const material = new THREE.MeshStandardMaterial({
        color: skill.color,
        metalness: 0.8,
        roughness: 0.3,
      });
      const molecule = new THREE.Mesh(geometry, material);
      molecule.position.set(...skill.position);
      scene.add(molecule);
      orbitingMolecules.push(molecule);
    });

    camera.position.z = 8;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      mainMolecule.rotation.x += 0.01;
      mainMolecule.rotation.y += 0.01;
      
      orbitingMolecules.forEach((molecule, index) => {
        const time = Date.now() * 0.001;
        const radius = 4;
        molecule.position.x = Math.cos(time + index) * radius;
        molecule.position.z = Math.sin(time + index) * radius;
        molecule.rotation.x += 0.02;
        molecule.rotation.y += 0.02;
      });
      
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      scene.remove(mainMolecule);
      mainGeometry.dispose();
      mainMaterial.dispose();
      
      orbitingMolecules.forEach((molecule) => {
        scene.remove(molecule);
        molecule.geometry.dispose();
        const material = molecule.material;
        if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
        } else {
          material.dispose();
        }
      });
      
      renderer.dispose();
      if (threeRef.current) {
        threeRef.current.removeChild(renderer.domElement);
        threeRef.current.removeChild(labelRenderer.domElement);
      }
    };
  }, []);

  // Initialize data
  useEffect(() => {
    const reels = [{
      title: "Test Reel",
      videoId: "3rOBx84g-VQ",
      thumbnail: "",
      url: "https://youtube.com/shorts/3rOBx84g-VQ?si=sZKdX2GBAybnEe6Y"
    }];
    setEduReels(reels);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('profileData');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.username) {
        setUsername(data.username);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetch(`${API_BASE_URL}/friends?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.friends) {
            setFriends(data.friends);
          }
        })
        .catch(err => console.error("Error fetching friends:", err));
    }
  }, [userId]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-20"></div>
        <motion.div 
          animate={{ 
            background: [
              "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <FaGraduationCap className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">EduFlix AI</h1>
              <p className="text-white/60 text-sm">Welcome back, {username || 'Student'}!</p>
            </div>
          </motion.div>

          <nav className="flex items-center space-x-6">
            <Link href="/learning-pathway" className="text-white/80 hover:text-white transition-colors font-semibold">
              Learning Path
            </Link>
            <Link href="/discussion" className="text-white/80 hover:text-white transition-colors font-semibold">
              Discussion
            </Link>
            <Link href="/study-group" className="text-white/80 hover:text-white transition-colors font-semibold">
              Study Groups
            </Link>
            <button
              onClick={() => router.push(`/myprofile`)}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors font-semibold"
            >
              <FaUser className="mr-2 inline-block" />
              Profile
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex justify-end items-start p-4 space-x-4 overflow-y-auto mt-6 mb-40">
        {/* Leaderboard */}
        <motion.aside 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-72 mt-[-16px]"
        >
          <h3 className="text-2xl font-bold mb-4 text-center text-white font-sans">
            Leaderboard
          </h3>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl">
            {leaderboard.map((user, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="mb-4 flex items-center"
              >
                <span className="w-8 text-center">
                  {index === 0 && <FaCrown className="text-yellow-400" />}
                  {index === 1 && <FaMedal className="text-gray-300" />}
                  {index === 2 && <FaTrophy className="text-orange-400" />}
                  {index > 2 && <span className="text-white">{index + 1}.</span>}
                </span>
                <span className="ml-2 w-24 text-white">
                  <Link href={`/profile/${user.name}`} className="hover:underline">
                    {user.name}
                  </Link>
                </span>
                <div className="w-20 h-20 ml-4">
                  <CircularProgressbar
                    value={(user.points / maxPoints) * 100}
                    text={`${user.points}`}
                    styles={buildStyles({
                      textColor: '#ffffff',
                      trailColor: 'rgba(255,255,255,0.1)',
                      pathColor: '#8b5cf6',
                    })}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>

        {/* EduReels */}
        <motion.aside 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`w-60 mt-0 relative ${isReelMinimized ? 'h-16 transform fixed right-0 bottom-1/2 -translate-y-1/2' : 'h-[650px]'}`}
        >
          <div 
            className="absolute top-0 left-0 w-full h-16 bg-white/10 backdrop-blur-xl border border-white/20 p-4 text-white text-center font-bold text-2xl z-10 cursor-pointer flex items-center justify-center rounded-t-3xl"
            onClick={toggleReelMinimize}
          >
            EduReels
          </div>
          <div 
            className={`relative w-full ${isReelMinimized ? 'h-16' : 'h-full'} overflow-hidden bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {loadingReels ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-white">Loading reels...</span>
              </div>
            ) : reelsError ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-white">{reelsError}</span>
              </div>
            ) : eduReels.length > 0 && !isReelMinimized && (
              <>
                <iframe
                  ref={iframeRef}
                  className="w-full h-full rounded-3xl"
                  src={
                    eduReels[currentReelIndex].url?.includes("autoplay=1")
                      ? eduReels[currentReelIndex].url
                      : `${eduReels[currentReelIndex].url}?autoplay=1&enablejsapi=1`
                  }
                  title={eduReels[currentReelIndex].title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <div className="absolute top-1/2 transform -translate-y-1/2 left-2 z-10">
                  <button onClick={handlePrevReel} className="p-3 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 transition-all duration-200">
                    <FaChevronLeft size={16} />
                  </button>
                </div>
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 z-10">
                  <button onClick={handleNextReel} className="p-3 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 transition-all duration-200">
                    <FaChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.aside>
      </main>

      {/* Content Catalog */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 p-10 bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl mb-8 ml-24 mr-4"
      >
        <h2 className="text-3xl font-bold text-white mb-6">Content Catalog</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contentCatalog.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <CatalogItem item={item} />
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-8 py-3 rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg">
            See More
          </button>
        </div>
      </motion.section>

      {/* EduNews Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-xl border-t border-white/20 text-center flex items-center shadow-2xl">
        <span className="text-white font-bold mr-4">EduNews</span>
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <motion.div 
            animate={{ x: [1000, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex"
          >
            {eduNews.concat(eduNews).map((news, index) => (
              <span key={index} className="mx-4 text-white/80">
                {news}
              </span>
            ))}
          </motion.div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      {/* NJAN AI Assistant */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-64 left-4 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAssistantToggle}
          className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-2xl border border-white/20"
        >
          {showAssistant ? (
            <FaTimes className="text-white h-6 w-6" />
          ) : (
            <span className="text-white text-sm font-bold">NJAN</span>
          )}
        </motion.button>

        <AnimatePresence>
          {showAssistant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-full left-0 mb-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-80 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: '300px' }}>
                {assistantMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-purple-500/80 text-right self-end text-white ml-8' : 'bg-white/10 text-left self-start text-white mr-8'}`}
                  >
                    {msg.text}
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-white/20 p-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-3 bg-white/10 text-white placeholder-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim()) {
                          handleAssistantMessage(target.value);
                          target.value = '';
                        }
                      }
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Ask me anything..."]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        handleAssistantMessage(input.value);
                        input.value = '';
                      }
                    }}
                    className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-2xl shadow-lg"
                  >
                    <FaPaperPlane className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Study Buddies */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.0 }}
        className="fixed bottom-40 left-4 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFriends(!showFriends)}
          className="p-4 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full shadow-2xl border border-white/20"
        >
          <FaUserFriends className="text-white h-6 w-6" />
        </motion.button>

        <AnimatePresence>
          {showFriends && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 left-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-80 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h3 className="text-white text-xl font-bold">Study Buddies</h3>
                <button className="text-white/60 hover:text-white">
                  <FaEllipsisV />
                </button>
              </div>
              <div className="flex items-center mb-2 px-4 py-2">
                <FaSearch className="text-white/60 mr-2" />
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-white/10 text-white placeholder-white/50 rounded-full px-3 py-2 w-full focus:outline-none border border-white/20"
                />
              </div>
              <ul className="text-white max-h-64 overflow-y-auto">
                {friends.map((friend, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="px-4 py-3 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600"></div>
                        <div>
                          <Link
                            href={`/messenger/${friend.name || "friend"}?lastMessage=${friend.lastMessage || ""}`}
                            className="font-medium hover:underline"
                          >
                            {friend.name || "My Friend"}
                          </Link>
                          <div className="text-sm text-white/60">
                            {friend.lastMessage || "No recent message"}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/messenger/${friend.name || "friend"}?lastMessage=${friend.lastMessage || ""}`}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
                      >
                        Chat
                      </Link>
                    </div>
                  </motion.li>
                ))}
              </ul>
              <Link href="/friends" className="absolute top-4 right-12 text-white/60 hover:text-white text-sm">
                See All
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Calendar/Assignments */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-20 left-4 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAssignments(!showAssignments)}
          className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl border border-white/20"
        >
          <FaCalendarAlt className="text-white h-6 w-6" />
        </motion.button>

        <AnimatePresence>
          {showAssignments && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 left-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl w-80"
            >
              <h3 className="text-white text-xl font-bold mb-4">Pending Assignments</h3>
              <Calendar
                onClickDay={handleDateClick}
                tileClassName={({ date, view }) => {
                  if (assignments.find(a => a.date.toDateString() === date.toDateString())) {
                    return 'bg-purple-500 text-white rounded-lg';
                  }
                  return 'text-white hover:bg-white/10 rounded-lg';
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3D Molecular Background */}
      <div ref={threeRef} className="fixed top-40 left-20 w-96 h-96 z-0 opacity-60"></div>
    </div>
  );
}
