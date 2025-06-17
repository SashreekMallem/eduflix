"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  FaTimes, FaCrown, FaMedal, FaTrophy, FaUserFriends, FaCalendarAlt, 
  FaChevronLeft, FaChevronRight, FaUser, FaPaperPlane, FaSearch, 
  FaEllipsisV, FaPlay, FaBookmark, FaClock, FaStar, FaFire, 
  FaGraduationCap, FaRocket, FaLightbulb, FaChartLine, FaBell,
  FaHeart, FaShare, FaComment
} from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-theme.css';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Link from 'next/link';
import gsap from 'gsap';
import { createClient } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// New CourseCard component
interface Reel {
  title: string;
  videoId: string;
  thumbnail: string;
}

const CourseCard = ({ reel, router }: { reel: Reel; router: any }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg w-64 hover:scale-105 transition-transform duration-200 border border-gray-200">
    <h3 className="text-xl font-semibold text-gray-800 mb-3">{reel.title}</h3>
    {reel.thumbnail ? (
      <img src={reel.thumbnail} alt={reel.title} className="mb-4 rounded-lg" />
    ) : null}
  </div>
);

// New StudyGroupCard component
interface Friend {
  name: string;
  commonGroups: string[];
}

const StudyGroupCard = ({ friend, router }: { friend: Friend; router: any }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg w-64 hover:scale-105 transition-transform duration-200 border border-gray-200">
    <h3 className="text-xl font-semibold text-gray-800 mb-3">
      <Link href={`/profile/${friend.name}`} className="hover:underline">
        {friend.name}
      </Link>
    </h3>
    <p className="text-gray-500">Common Groups: {friend.commonGroups.join(', ')}</p>
  </div>
);

// New ParallaxSection component
const ParallaxSection = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const sectionTop = rect.top;
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY;

      // Calculate the offset based on the scroll position
      const parallaxOffset = (sectionTop - scrollPosition) * 0.2; // Adjust the multiplier for the desired parallax speed
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call to set the initial offset

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={ref}
      className="relative"
      style={{
        transform: `translateY(${offset}px)`,
      }}
    >
      {children}
    </section>
  );
};

// New component for catalog item
interface CatalogItemProps {
  title: string;
  type: string;
  thumbnail: string;
}

const CatalogItem = ({ item }: { item: CatalogItemProps }) => (
  <div className="w-80 h-56 rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer">
    <img src={item.thumbnail} alt={item.title} className="w-full h-36 object-cover" />
    <div className="p-5 bg-white">
      <h3 className="text-xl font-semibold text-gray-800 truncate">{item.title}</h3>
      <p className="text-gray-500 text-sm truncate">{item.type}</p>
    </div>
  </div>
);

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState(''); // Placeholder for username
  const [eduReels, setEduReels] = useState<Reel[]>([]); // updated via API fetch
  const [currentReelIndex, setCurrentReelIndex] = useState(0); // Index for the current EduReel
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    { text: "Hello! I'm NJAN, your personal learning assistant. How can I help you today?", sender: "ai" }
  ]);
  const [eduNews, setEduNews] = useState([
    "EduFlix launches new AI-powered personalized learning pathways!",
    "Top 10 courses to boost your career in 2023.",
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
    { name: 'David', points: 0 },
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
  const [currentUser, setCurrentUser] = useState<{ profile: { full_name: string } } | null>(null);
  const API_BASE_URL = "http://localhost:8000";
  const [currentTime, setCurrentTime] = useState(new Date());
  // New state for ad carousel
  const carouselItems = [
    { type: "text", value: "Update: System update available!" },
    { type: "image", src: "https://via.placeholder.com/300x50?text=Ad" },
    { type: "text", value: "Notification: You have 3 new messages" },
    { type: "image", src: "https://via.placeholder.com/300x50?text=Ad" },
    { type: "text", value: "Feedback: We value your opinion!" },
    { type: "image", src: "https://via.placeholder.com/300x50?text=Ad" }
  ];
  const [adIndex, setAdIndex] = useState(0);
  // New states for dynamic fetching
  const [loadingReels, setLoadingReels] = useState(false);
  const [reelsError, setReelsError] = useState(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReelMinimized, setIsReelMinimized] = useState(false);

  const toggleReelMinimize = () => {
    setIsReelMinimized(!isReelMinimized);
  };

  const maxPoints = leaderboard.reduce((max, user) => Math.max(max, user.points), 0);

  // Function to generate fake courses for a category
  const generateFakeCourses = (category: string, count: number) => {
    const courses = [];
    for (let i = 1; i <= count; i++) {
      courses.push({
        title: `${category} Course ${i}`,
        videoId: `fakeVideoId${i}`,
        thumbnail: `https://via.placeholder.com/150?text=${category}+${i}`,
      });
    }
    return courses;
  };

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

  useEffect(() => {
    // const fetchEduReels = () => {
    //   const themes = ["Programming", "AI", "Tech", "Shorts"];
    //   const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    //   setLoadingReels(true);
    //   fetch(
    //     `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoSyndicated=true&safeSearch=none&videoDuration=short&q=${encodeURIComponent(randomTheme)}&key=AIzaSyAzVQKKRHG1g6DhdBQ23nksJsSWsLfNGlc`
    //   )
    //     .then((res) => {
    //       if (!res.ok) {
    //         throw new Error(`HTTP error! status: ${res.status}`);
    //       }
    //       return res.json();
    //     })
    //     .then((data) => {
    //       const reels = data.items.map((item) => ({
    //         title: item.snippet.title,
    //         videoId: item.id.videoId,
    //         thumbnail: item.snippet.thumbnails.medium.url,
    //         url: `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1&enablejsapi=1`
    //       }));
    //       setEduReels(reels);
    //       setLoadingReels(false);
    //     })
    //     .catch((error) => {
    //       console.error("Error fetching reels:", error);
    //       setReelsError("Failed to load reels. Check API key and network.");
    //       setLoadingReels(false);
    //     });
    // };

    //fetchEduReels();
    const reels = [{
      title: "Test Reel",
      videoId: "3rOBx84g-VQ",
      thumbnail: "",
      url: "https://youtube.com/shorts/3rOBx84g-VQ?si=sZKdX2GBAybnEe6Y"
    }];
    setEduReels(reels);

    // Update time every second
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

  const replayCurrentReel = () => {
    if (iframeRef.current?.contentWindow) { // Added optional chaining to check for contentWindow
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    }
  };

  const handleContinueLearning = (course: { title: string }) => { // Added type annotation for course parameter
    // Redirect to the course page
    router.push(`/course/${course.title}`);
  };

  const handleAssistantToggle = () => {
    setShowAssistant(!showAssistant);
  };

  // Update the assistant message handler to use full backend URL and add logging for debugging
  const handleAssistantMessage = (message: string) => {
    setAssistantMessages([...assistantMessages, { text: message, sender: "user" }]);
    // Call Llama chat API using the full URL
    fetch(`${API_BASE_URL}/chat/llama-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ prompt: message })
    })
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) {
          throw new Error("Network response was not ok: " + res.statusText);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Received data:", data);
        setAssistantMessages((prevMessages) => [
          ...prevMessages,
          { text: data.response, sender: "ai" }
        ]);
      })
      .catch((err) => {
        console.error("Error fetching chatbot response:", err);
        setAssistantMessages((prevMessages) => [
          ...prevMessages,
          { text: "Error: " + err, sender: "ai" }
        ]);
      });
  };

  const fetchEduReels = () => {
    // For now, reset to a test reel.
    setEduReels([{
      title: "Test Reel",
      videoId: "3rOBx84g-VQ",
      thumbnail: "",
      url: "https://youtube.com/shorts/3rOBx84g-VQ?si=sZKdX2GBAybnEe6Y"
    }]);
  };

  const handleNextReel = () => {
    if (currentReelIndex === eduReels.length - 1) {
      fetchEduReels();
    } else {
      setCurrentReelIndex((prevIndex) => (prevIndex + 1) % eduReels.length);
    }
    // Use optional chaining to safely access contentWindow
    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
  };

  const handlePrevReel = () => {
    setCurrentReelIndex((prevIndex) => (prevIndex - 1 + eduReels.length) % eduReels.length);
    // Use optional chaining to safely access contentWindow
    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX !== null) {
      const diff = touchStartX - touchEndX;
      const threshold = 50; // pixels to detect swipe
      if (diff > threshold) handleNextReel();
      else if (diff < -threshold) handlePrevReel();
    }
    setTouchStartX(null);
  };

  const handleDateClick = (date: Date) => { // Added type annotation for date parameter
    const assignment = assignments.find(a => a.date.toDateString() === date.toDateString());
    if (assignment) {
      alert(`Title: ${assignment.title}\nDescription: ${assignment.description}`);
      // Optionally, redirect to the assignment page
      // router.push(`/assignment/${assignment.title}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 overflow-hidden pb-20">
      <Header currentPage="home" currentUser={currentUser} />
      <main className="flex-grow relative flex justify-end items-start p-4 space-x-4 overflow-y-auto mt-24 mb-40">
        <aside className="w-72 mt-[-16px]">
          <h3 className="text-2xl font-bold mb-4 text-center text-purple-400 font-sans">
            {/* Leaderboard */}
          </h3>
          <div className="bg-white bg-opacity-70 backdrop-blur-lg rounded-lg p-6 shadow-lg">
            {leaderboard.map((user, index) => (
              <div key={index} className="mb-4 flex items-center">
                <span className="w-8 text-center">
                  {index === 0 && <FaCrown className="text-yellow-400" />}
                  {index === 1 && <FaMedal className="text-gray-400" />}
                  {index === 2 && <FaTrophy className="text-orange-400" />}
                  {index > 2 && <span>{index + 1}.</span>}
                </span>
                <span className="ml-2 w-24">
                  <Link href={`/profile/${user.name}`} className="hover:underline">
                  {user.name}
                  </Link>
                </span>
                <div className="w-20 h-20 ml-4">
                  <CircularProgressbar
                    value={(user.points / maxPoints) * 100}
                    text={`${user.points}`}
                    styles={buildStyles({
                      textColor: '#6b7280',
                      trailColor: '#e5e7eb',
                      pathColor: '#9f7aea',
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
        {/* EduReels section */}
        <aside className={`w-60 mt-0 relative ${isReelMinimized ? 'h-16 transform fixed right-0 bottom-1/2 -translate-y-1/2' : 'h-[650px]'}`}>
          <div className="absolute top-0 left-0 w-full h-16 bg-gray-100 border border-gray-200 p-4 text-gray-800 text-center font-bold text-2xl z-10 cursor-pointer flex items-center justify-center rounded-t-lg"
            onClick={toggleReelMinimize}
          >
            {isReelMinimized ? 'EduReels' : 'EduReels'}
          </div>
          <div 
            className={`relative w-full ${isReelMinimized ? 'h-16' : 'h-full'} overflow-hidden border border-gray-200 rounded-lg shadow-lg`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {loadingReels ? (
              <div className="flex items-center justify-center h-full">
                <span>Loading reels...</span>
              </div>
            ) : reelsError ? (
              <div className="flex items-center justify-center h-full">
                <span>{reelsError}</span>
              </div>
            ) : eduReels.length > 0 && !isReelMinimized && (
              <>
                <iframe
                  ref={iframeRef}
                  className="w-full h-full"
                  src={
                    eduReels[currentReelIndex].url.includes("autoplay=1")
                      ? eduReels[currentReelIndex].url
                      : `${eduReels[currentReelIndex].url}?autoplay=1&enablejsapi=1`
                  }
                  title={eduReels[currentReelIndex].title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <div className="absolute top-1/2 transform -translate-y-1/2 left-2 z-10">
                  <button onClick={handlePrevReel} className="p-1 bg-gray-800 bg-opacity-20 text-white rounded-full hover:bg-opacity-50 transition-opacity duration-200">
                    <FaChevronLeft size={16} />
                  </button>
                </div>
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 z-10">
                  <button onClick={handleNextReel} className="p-1 bg-gray-800 bg-opacity-20 text-white rounded-full hover:bg-opacity-50 transition-opacity duration-200">
                    <FaChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </main>
      {/* Content Catalog Section */}
      <section className="p-10 bg-white bg-opacity-70 shadow-lg rounded-3xl mb-8 ml-24">
        <h2 className="text-4xl font-bold text-purple-400 mb-8">Explore Our Catalog</h2>
        <div className="flex overflow-x-auto space-x-8">
          {contentCatalog.slice(0, 5).map((item, index) => (
            <CatalogItem key={index} item={item} />
          ))}
        </div>
        <button className="mt-8 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full block mx-auto">
          See More
        </button>
      </section>
      
      <div className="fixed bottom-64 left-4 hover:scale-110 transition-transform z-50">
        <button
          onClick={handleAssistantToggle}
          className="w-16 h-16 flex items-center justify-center bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg"
        >
          {showAssistant ? (
            <FaTimes className="text-white h-6 w-6" />
          ) : (
            <span className="text-white text-base">NJAN</span>
          )}
        </button>
        {showAssistant && (
          <div className="absolute bottom-full left-0 mb-4 bg-gray-900 bg-opacity-90 rounded-lg shadow-lg w-80 z-50 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: '300px' }}>
              {assistantMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 ${msg.sender === 'user' ? 'bg-purple-700 text-right self-end' : 'bg-gray-800 text-left self-start'}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 p-3">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none shadow-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement; // Cast to HTMLInputElement
                      handleAssistantMessage(target.value);
                      target.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('.flex-1') as HTMLInputElement;
                    if (input?.value) {
                      handleAssistantMessage(input.value);
                      input.value = '';
                    }
                  }}
                  className="ml-2 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md shadow-md"
                >
                  <FaPaperPlane className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-40 left-4 hover:scale-110 transition-transform z-50">
        <button
          onClick={() => setShowFriends(!showFriends)}
          className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg relative"
        >
          <FaUserFriends className="text-white h-6 w-6" />
        </button>
        {showFriends && (
          <div className="absolute bottom-16 left-0 bg-gray-900 bg-opacity-90 rounded-lg shadow-lg w-80 z-50">
            {/* Messenger-like Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 className="text-white text-xl font-bold">
                Study Buddies
              </h3>
              <button className="text-gray-400 hover:text-white">
                <FaEllipsisV />
              </button>
            </div>
            {/* Search Bar */}
            <div className="flex items-center mb-2 px-4 py-1">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="bg-gray-800 text-white rounded-full px-3 py-2 w-full focus:outline-none"
              />
            </div>
            {/* Friends List */}
            <ul className="text-white">
              {friends.map((friend, index) => (
                <li
                  key={index}
                  className="px-4 py-3 hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700">
                        {/* Placeholder for friend's profile picture */}
                      </div>
                      <div>
                        <Link
                          href={`/messenger/${friend.name || "friend"}?lastMessage=${friend.lastMessage || ""}`}
                          className="font-medium hover:underline"
                        >
                          {friend.name || "My Friend"}
                        </Link>
                        <div className="text-sm text-gray-400">
                          {friend.lastMessage || "No recent message"}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/messenger/${friend.name || "friend"}?lastMessage=${friend.lastMessage || ""}`}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-full shadow-md"
                    >
                      Chat
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/friends" className="absolute top-2 right-2 text-gray-400 hover:text-white">
              See All
            </Link>
          </div>
        )}
      </div>
      <div className="fixed bottom-20 left-4 hover:scale-110 transition-transform z-50">
        <button
          onClick={() => setShowAssignments(!showAssignments)}
          className="p-4 bg-green-600 hover:bg-green-700 rounded-full shadow-lg"
        >
          <FaCalendarAlt className="text-white h-6 w-6" />
        </button>
        {showAssignments && (
          <div className="absolute bottom-16 left-0 bg-gray-900 bg-opacity-90 rounded-lg p-4 shadow-lg w-80 z-50">
            <h3 className="text-white text-xl font-bold mb-4">Pending Assignments</h3>
            <Calendar
              onClickDay={handleDateClick}
              tileClassName={({ date, view }) => {
                if (assignments.find(a => a.date.toDateString() === date.toDateString())) {
                  return 'bg-purple-500 text-white';
                }
              }}
            />
          </div>
        )}
      </div>
      
      {/* Fixed Footer Component */}
      <Footer eduNews={eduNews} showEduNews={true} />
    </div>
  );
}

