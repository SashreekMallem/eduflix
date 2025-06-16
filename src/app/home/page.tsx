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
import * as THREE from 'three';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import Link from 'next/link';
import gsap from 'gsap';
import { createClient } from '@/lib/supabase';
import Header from '@/components/Header';

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

  const threeRef = useRef<HTMLDivElement>(null);
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
    const adInterval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % carouselItems.length);
    }, 3000); // change carousel item every 3 seconds
    return () => clearInterval(adInterval);
  }, []);

  useEffect(() => {
    // Reset camera position on mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Clear container to avoid duplicate 3D labels and renderers on remount
    if (threeRef.current) {
      threeRef.current.innerHTML = "";
      // Revert to original dimensions (w-96 h-96 ~ 384px x 384px) and relative positioning
      threeRef.current.style.width = "420px";
      threeRef.current.style.height = "420px";
      threeRef.current.style.position = "fixed";
      threeRef.current.style.top = "10rem"; // adjust as needed
      threeRef.current.style.left = "5rem"; // adjust as needed
      threeRef.current.style.zIndex = "0";
    }
    
    // Initialize Three.js scene with adjusted camera clipping remains
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      384 / 384,
      0.1,
      5000
    );
    // Optionally increase camera z to get a full view of the model
    camera.position.z = 7; // adjust upward if needed
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(384, 384);
    // Improve quality by matching device pixel ratio and using tone mapping.
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.5;
    if (threeRef.current) {
        threeRef.current.appendChild(renderer.domElement);
    }
    
    // Initialize CSS2DRenderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(400, 400);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none'; // <-- added to allow molecule clicks
    if (threeRef.current) {
        threeRef.current.appendChild(labelRenderer.domElement);
    }

    // Set up lights for a premium metallic look
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Fully bright ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8); // Add a second directional light
    directionalLight2.position.set(-5, -5, 5);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6); // Add a third directional light
    directionalLight3.position.set(0, 0, -5);
    scene.add(directionalLight3);

    // Additional point light for extra brightness and highlights
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 0, 7);
    scene.add(pointLight);

    // Helper function: creates a text sprite from a canvas texture
    // Updated createTextSprite with padding and background
    // Updated createTextSprite: use devicePixelRatio to boost resolution
    // Updated createTextSprite for even higher resolution
    function createTextSprite(message: string, parameters = {}) {
      const fontface = parameters.fontface || "Arial";
      const fontsize = parameters.fontsize || 36;
      const fontStyle = parameters.fontStyle || "bold";
      const textColor = parameters.fillStyle || "#FFA500"; // Use orange for high contrast
      const ratio = window.devicePixelRatio || 1;
      const scaleFactor = 2; // Additional scale for boosted resolution
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      context.font = `${fontStyle} ${fontsize}px ${fontface}`;
      const textWidth = context.measureText(message).width;
      
      // Set canvas size based on exact text dimensions
      canvas.width = textWidth * ratio * scaleFactor;
      canvas.height = fontsize * 1.4 * ratio * scaleFactor;
      context.scale(ratio * scaleFactor, ratio * scaleFactor);
      
      // Setup for 3D bold effect: add shadow and stroke for sharp borders
      context.font = `${fontStyle} ${fontsize}px ${fontface}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineJoin = "round"; 
      // Shadow settings: simulates a 3D look
      context.shadowColor = "rgba(0,0,0,0.8)";
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowBlur = 2;
      
      // Stroke settings for sharp borders
      context.strokeStyle = "black";
      context.lineWidth = 2;
      context.strokeText(message, textWidth / 2, fontsize * 0.7);
      
      // Fill text on top
      context.fillStyle = textColor;
      context.fillText(message, textWidth / 2, fontsize * 0.7);
      
      const texture = new THREE.CanvasTexture(canvas);
      // Use NearestFilter for crisp edges
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        color: 0xffffff // full brightness
      });
      
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(textWidth * 0.008, fontsize * 1.4 * 0.008, 1);
      return sprite;
    }

    // Create main molecule with sprite label instead of CSS2DObject
    const mainGeometry = new THREE.DodecahedronGeometry(1.7, 0); // radius increased from 1.3 to 1.7
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,       // Very dark gray
      metalness: 1.0,
      roughness: 0.2,
    });
    const mainMolecule = new THREE.Mesh(mainGeometry, mainMaterial);
    mainMolecule.userData = { goal: "Career as Software Engineer" };
    scene.add(mainMolecule);

    // Remove previous DOM label code and add sprite label:
    const goalSprite = createTextSprite("Career as Software Engineer", { fontsize: 36, fillStyle: "white" });
    goalSprite.position.set(0, -1.8, 0); // adjust position relative to the molecule
    mainMolecule.add(goalSprite);

    // For orbiting molecules, add sprite labels instead of CSS2DObject:
    const orbitPositions = [
      new THREE.Vector3(-2.5, 0, 0),
      new THREE.Vector3(2.5, 0, 0),
      new THREE.Vector3(0, 2.5, 0),
      new THREE.Vector3(0, -2.5, 0),
      new THREE.Vector3(0, 0, 2.5),
      new THREE.Vector3(0, 0, -2.5),
    ];
    const orbitAxes = [
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 1, 0),
    ];
    const orbitingMolecules: THREE.Mesh[] = []; // Explicitly typed as an array of THREE.Mesh
    const chapters = [
      {
        title: "Programming Basics",
        lessons: ["Variables", "Control Structures", "Functions", "Data Types"]
      },
      {
        title: "Data Structures",
        lessons: ["Arrays", "Linked Lists", "Stacks", "Queues"]
      },
      {
        title: "Algorithms",
        lessons: ["Sorting", "Searching", "Graph Algorithms", "Dynamic Programming"]
      },
      {
        title: "Web Development",
        lessons: ["HTML & CSS", "JavaScript", "Frontend Frameworks", "Backend Development"]
      },
      {
        title: "Software Engineering",
        lessons: ["Version Control", "Software Design Patterns", "Testing", "DevOps"]
      },
      {
        title: "Advanced Topics",
        lessons: ["Cloud Computing", "Mobile Development", "AI & Machine Learning", "Cybersecurity"]
      }
    ];

    for (let i = 0; i < chapters.length; i++) {
      // Keep mini molecule size as before
      const orbitGeometry = new THREE.IcosahedronGeometry(0.35, 0); // Increase mini molecule size from 0.25 to 0.35
      const orbitMaterial = new THREE.MeshStandardMaterial({
        color: 0x8A2BE2, // Now blue-violet instead of black
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x111111,
      });
      const orbitMolecule = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitMolecule.userData = { chapter: chapters[i].title, lessons: chapters[i].lessons }; // Attach chapter data
      orbitingMolecules.push(orbitMolecule);
      scene.add(orbitMolecule);

      // Remove CSS2D label code and add sprite text
      const chapterSprite = createTextSprite(chapters[i].title, { fontsize: 28, fillStyle: "white" });
      chapterSprite.position.set(0, -0.5, 0); // adjust for proper placement
      orbitMolecule.add(chapterSprite);
    }

    // Molecule formation effect on fresh page load
    gsap.from(mainMolecule.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.5,
      ease: "back.out(1.7)"
    });
    orbitingMolecules.forEach((molecule, index) => {
      gsap.from(molecule.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "back.out(1.7)",
        delay: index * 0.2
      });
    });

    // Add event listener for molecule clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => { // <-- Explicitly typed parameter
      // Adjust mouse coordinates to match the canvas size
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects([mainMolecule, ...orbitingMolecules]);
      if (intersects.length > 0) {
        const clickedMolecule = intersects[0].object;
        if (clickedMolecule.userData.chapter) {
          animateToMainGoal(clickedMolecule);
        }
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // Right after creating the goalSprite and each orbiting subGoalSprite,
    // store their original scale:
    goalSprite.userData.baseScale = goalSprite.scale.clone();
    orbitingMolecules.forEach((molecule) => {
      // Assuming each child sprite is the label
      molecule.children.forEach((child) => {
        if (child instanceof THREE.Sprite) {
          child.userData.baseScale = child.scale.clone();
        }
      });
    });

    const animateToMainGoal = (clickedMolecule: THREE.Object3D) => {
      // 1. Animate the clicked subgoal to center and scale it up
      gsap.to(clickedMolecule.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: "power2.inOut"
      });
      gsap.to(clickedMolecule.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
        ease: "power2.inOut"
      });
    
      // 2. Animate the main career goal to shrink and move to a corner
      gsap.to(mainMolecule.position, {
        x: -5,
        y: -5,
        z: 0,
        duration: 1.5,
        ease: "power2.inOut"
      });
      gsap.to(mainMolecule.scale, {
        x: 0.5,
        y: 0.5,
        z: 0.5,
        duration: 1.5,
        ease: "power2.inOut"
      });
    
      // 3. Animate out the other orbiting molecules
      orbitingMolecules.forEach(molecule => {
        if (molecule !== clickedMolecule) {
          gsap.to(molecule.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.75,
            ease: "power2.inOut",
            onComplete: () => {
              scene.remove(molecule);
            }
          });
        }
      });
    
      // After animations complete:
      setTimeout(() => {
        // Remove all other orbiting molecules from the array
        orbitingMolecules.forEach(molecule => {
          if (molecule !== clickedMolecule) {
            scene.remove(molecule);
          }
        });
        orbitingMolecules.length = 0;
        orbitingMolecules.push(clickedMolecule);
    
        // 4. Create new sub–subgoal molecules (from clickedMolecule.userData.lessons)
        const lessons = clickedMolecule.userData.lessons;
        const newSubGoals: THREE.Mesh[] = [];
        for (let i = 0; i < lessons.length; i++) {
          const lessonGeometry = new THREE.IcosahedronGeometry(0.35, 0);
          const lessonMaterial = new THREE.MeshStandardMaterial({
            color: 0x8A2BE2,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x111111,
          });
          const subGoal = new THREE.Mesh(lessonGeometry, lessonMaterial);
          subGoal.userData = { lesson: lessons[i] };
    
          // Position sub–subgoals in a circle around the centered subgoal (radius 2)
          const angle = (i / lessons.length) * Math.PI * 2;
          // Randomize initial positions
          const randomRadius = 2 + Math.random() * 1; // Vary the radius
          const x = Math.cos(angle) * randomRadius;
          const y = Math.sin(angle) * randomRadius;
          subGoal.position.set(x, y, 0);
    
          // Add a sprite label for the lesson
          const subGoalLabel = createTextSprite(lessons[i], { fontsize: 28, fillStyle: "white" });
          subGoalLabel.position.set(0, -0.5, 0);
          subGoal.add(subGoalLabel);
    
          // Add sub–subgoal as a child of the centered subgoal so they revolve together
          clickedMolecule.add(subGoal);
          newSubGoals.push(subGoal);
    
          // Animate the sub-subgoals to their final positions
          gsap.fromTo(subGoal.position,
            { // Start from a random position
              x: Math.random() * 4 - 2,
              y: Math.random() * 4 - 2,
              z: Math.random() * 4 - 2
            },
            { // Animate to the calculated position
              x: Math.cos(angle) * randomRadius,
              y: Math.sin(angle) * randomRadius,
              z: 0,
              duration: 1.5,
              ease: "power2.out",
            }
          );
        }
        // Update orbitingMolecules reference if needed
        orbitingMolecules.length = 0;
        orbitingMolecules.push(clickedMolecule, ...newSubGoals);
      }, 1500);
    };
    
    const animate = () => {
      requestAnimationFrame(animate);
    
      // Rotate molecules as before
      mainMolecule.rotation.x += 0.01;
      mainMolecule.rotation.y += 0.02;
      mainMolecule.rotation.z += 0.015;
    
      // Rotate the centered molecule
      if (orbitingMolecules.length > 0) {
        orbitingMolecules[0].rotation.x += 0.01;
        orbitingMolecules[0].rotation.y += 0.02;
        orbitingMolecules[0].rotation.z += 0.015;
      }
    
      const angle = Date.now() * 0.0003;
      orbitingMolecules.slice(1).forEach((molecule, i) => { // Start from index 1 to exclude the centered molecule
        molecule.rotation.x += 0.02;
        molecule.rotation.y += 0.015;
        molecule.rotation.z += 0.025;
    
        const pos = orbitPositions[i % orbitPositions.length].clone();
        const dynamicAxis = orbitAxes[i % orbitAxes.length].clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(angle * 0.5 + i));
        pos.applyAxisAngle(dynamicAxis, angle);
        molecule.position.copy(pos);
      });
    
      // New: update labels based on distance to camera
      const updateLabelScale = (sprite: THREE.Sprite) => {
        const worldPos = new THREE.Vector3();
        sprite.getWorldPosition(worldPos);
        const d = camera.position.distanceTo(worldPos);
        // Define near and far distances and desired scales
        const near = 3, far = 10;
        const maxScale = 1.5, minScale = 0.3;
        let factor = d <= near ? maxScale : d >= far ? minScale : maxScale - ((maxScale - minScale) * ((d - near) / (far - near)));
        if (sprite.userData.baseScale) {
          sprite.scale.copy(sprite.userData.baseScale.clone().multiplyScalar(factor));
        }
      };
    
      // Update main molecule label
      updateLabelScale(goalSprite);
      // Update orbiting molecules labels
      orbitingMolecules.forEach((molecule) => {
        molecule.children.forEach((child) => {
          if (child instanceof THREE.Sprite) {
            updateLabelScale(child);
          }
        });
      });
    
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
        // Maintain the fixed canvas size or update as desired
        renderer.setSize(384, 384);
        labelRenderer.setSize(384, 384);
    };

    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      camera.position.y = -scrollY * 0.01; // Adjust the multiplier to control the scroll effect
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      renderer.domElement.removeEventListener('click', onMouseClick); // Remove event listener

      // Dispose of Three.js objects to prevent memory leaks
      scene.remove(mainMolecule);
      mainGeometry.dispose();
      mainMaterial.dispose();

      orbitingMolecules.forEach((molecule, i) => {
        scene.remove(molecule);
        molecule.geometry.dispose();
        const material = molecule.material;
        if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
        } else {
          material.dispose();
        }
      });

      scene.remove(ambientLight);
      scene.remove(directionalLight);

      renderer.dispose();
      if (threeRef.current) {
        threeRef.current.removeChild(renderer.domElement);
        threeRef.current.removeChild(labelRenderer.domElement); // Remove label renderer element
      }
    };
  }, []);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => { // added MessageEvent type
      if (event.data === 'ended') {
        replayCurrentReel();
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
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
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 overflow-hidden">
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
      <footer className="p-6 bg-gradient-to-br from-gray-900 to-black text-center flex items-center shadow-lg fixed bottom-0 left-0 right-0 z-50">
        <span className="text-white font-bold mr-4">EduNews</span>
        <div className="overflow-hidden whitespace-nowrap">
          <div className="animate-marquee flex">
            {eduNews.concat(eduNews).map((news, index) => (
              <span key={index} className="mx-4 text-white">
                {news}
              </span>
            ))}
          </div>
        </div>
      </footer>
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
      <div ref={threeRef} className="fixed top-40 left-20 w-96 h-96 z-0"></div>
    </div>
  );
}

