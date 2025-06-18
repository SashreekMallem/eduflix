"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface Atom {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
  children?: Atom[];
  description?: string;
}

interface MolecularNavigationProps {
  onAtomSelect?: (atom: Atom) => void;
}

// Knowledge hierarchy - bright and attractive colors
const knowledgeTree: Atom = {
  id: 'root',
  name: 'Complete Learning',
  color: '#FF6B6B', // Bright coral red
  icon: '🧠',
  position: new THREE.Vector3(0, 0, 0),
  description: 'Master all domains of knowledge',
  children: [
    {
      id: 'ai-ml',
      name: 'AI & Machine Learning',
      color: '#4ECDC4', // Bright turquoise
      icon: '🤖',
      position: new THREE.Vector3(0, 0, 0),
      description: 'Artificial Intelligence and Machine Learning',
      children: [
        { 
          id: 'neural-networks', 
          name: 'Neural Networks', 
          color: '#45B7D1', 
          icon: '🧩', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'Deep learning fundamentals',
          children: [
            { id: 'cnn', name: 'Convolutional Neural Networks', color: '#3498DB', icon: '🔍', position: new THREE.Vector3(0, 0, 0), description: 'Image processing networks',
              children: [
                { id: 'resnet', name: 'ResNet Architecture', color: '#2980B9', icon: '🏗️', position: new THREE.Vector3(0, 0, 0), description: 'Residual networks' },
                { id: 'vgg', name: 'VGG Networks', color: '#1F4E79', icon: '🔧', position: new THREE.Vector3(0, 0, 0), description: 'Very deep networks' }
              ]
            },
            { id: 'rnn', name: 'Recurrent Neural Networks', color: '#5DADE2', icon: '🔄', position: new THREE.Vector3(0, 0, 0), description: 'Sequential data processing',
              children: [
                { id: 'lstm', name: 'LSTM Networks', color: '#2E86C1', icon: '💾', position: new THREE.Vector3(0, 0, 0), description: 'Long short-term memory' },
                { id: 'gru', name: 'GRU Networks', color: '#1B4F72', icon: '⚡', position: new THREE.Vector3(0, 0, 0), description: 'Gated recurrent units' }
              ]
            }
          ]
        },
        { 
          id: 'computer-vision', 
          name: 'Computer Vision', 
          color: '#96CEB4', 
          icon: '👁️', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'Image and video analysis',
          children: [
            { id: 'object-detection', name: 'Object Detection', color: '#7FB069', icon: '🎯', position: new THREE.Vector3(0, 0, 0), description: 'Detecting objects in images',
              children: [
                { id: 'yolo', name: 'YOLO Algorithm', color: '#6A994E', icon: '🚀', position: new THREE.Vector3(0, 0, 0), description: 'You Only Look Once' },
                { id: 'rcnn', name: 'R-CNN Family', color: '#52734D', icon: '🔍', position: new THREE.Vector3(0, 0, 0), description: 'Region-based CNN' }
              ]
            },
            { id: 'image-segmentation', name: 'Image Segmentation', color: '#A7C957', icon: '✂️', position: new THREE.Vector3(0, 0, 0), description: 'Pixel-level classification' }
          ]
        },
        { 
          id: 'nlp', 
          name: 'Natural Language Processing', 
          color: '#FFEAA7', 
          icon: '💬', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'Language understanding',
          children: [
            { id: 'transformers', name: 'Transformer Models', color: '#FDCB6E', icon: '🔄', position: new THREE.Vector3(0, 0, 0), description: 'Attention-based models',
              children: [
                { id: 'bert', name: 'BERT', color: '#E17055', icon: '📖', position: new THREE.Vector3(0, 0, 0), description: 'Bidirectional encoder representations' },
                { id: 'gpt', name: 'GPT Models', color: '#D63031', icon: '✍️', position: new THREE.Vector3(0, 0, 0), description: 'Generative pre-trained transformers' }
              ]
            },
            { id: 'sentiment-analysis', name: 'Sentiment Analysis', color: '#F39C12', icon: '😊', position: new THREE.Vector3(0, 0, 0), description: 'Emotion detection in text' }
          ]
        },
        { 
          id: 'reinforcement', 
          name: 'Reinforcement Learning', 
          color: '#FD79A8', 
          icon: '🎮', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'Learning through interaction',
          children: [
            { id: 'q-learning', name: 'Q-Learning', color: '#E84393', icon: '🎯', position: new THREE.Vector3(0, 0, 0), description: 'Value-based learning' },
            { id: 'policy-gradient', name: 'Policy Gradient', color: '#A29BFE', icon: '🎲', position: new THREE.Vector3(0, 0, 0), description: 'Direct policy optimization' }
          ]
        }
      ]
    },
    {
      id: 'web-dev',
      name: 'Web Development',
      color: '#A29BFE', // Bright purple
      icon: '🌐',
      position: new THREE.Vector3(0, 0, 0),
      description: 'Full-stack web development',
      children: [
        { 
          id: 'frontend', 
          name: 'Frontend', 
          color: '#74B9FF', 
          icon: '🎨', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'User interface development',
          children: [
            { id: 'react', name: 'React.js', color: '#61DAFB', icon: '⚛️', position: new THREE.Vector3(0, 0, 0), description: 'Component-based library',
              children: [
                { id: 'hooks', name: 'React Hooks', color: '#21618C', icon: '🪝', position: new THREE.Vector3(0, 0, 0), description: 'Functional component state' },
                { id: 'context', name: 'Context API', color: '#1B4F72', icon: '🌐', position: new THREE.Vector3(0, 0, 0), description: 'State management' }
              ]
            },
            { id: 'vue', name: 'Vue.js', color: '#4FC08D', icon: '💚', position: new THREE.Vector3(0, 0, 0), description: 'Progressive framework' },
            { id: 'angular', name: 'Angular', color: '#DD0031', icon: '🅰️', position: new THREE.Vector3(0, 0, 0), description: 'Full-featured framework' }
          ]
        },
        { 
          id: 'backend', 
          name: 'Backend', 
          color: '#6C5CE7', 
          icon: '⚙️', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'Server-side development',
          children: [
            { id: 'nodejs', name: 'Node.js', color: '#68A063', icon: '🟢', position: new THREE.Vector3(0, 0, 0), description: 'JavaScript runtime',
              children: [
                { id: 'express', name: 'Express.js', color: '#404D59', icon: '🚂', position: new THREE.Vector3(0, 0, 0), description: 'Web framework' },
                { id: 'nestjs', name: 'NestJS', color: '#E0234E', icon: '🏰', position: new THREE.Vector3(0, 0, 0), description: 'Progressive framework' }
              ]
            },
            { id: 'python', name: 'Python', color: '#3776AB', icon: '🐍', position: new THREE.Vector3(0, 0, 0), description: 'Versatile language',
              children: [
                { id: 'django', name: 'Django', color: '#092E20', icon: '🎯', position: new THREE.Vector3(0, 0, 0), description: 'High-level framework' },
                { id: 'fastapi', name: 'FastAPI', color: '#009688', icon: '⚡', position: new THREE.Vector3(0, 0, 0), description: 'Modern, fast API framework' }
              ]
            }
          ]
        },
        { 
          id: 'database', 
          name: 'Databases', 
          color: '#00B894', 
          icon: '🗄️', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'Data storage and management',
          children: [
            { id: 'sql', name: 'SQL Databases', color: '#0984E3', icon: '📊', position: new THREE.Vector3(0, 0, 0), description: 'Relational databases',
              children: [
                { id: 'postgresql', name: 'PostgreSQL', color: '#336791', icon: '🐘', position: new THREE.Vector3(0, 0, 0), description: 'Advanced relational DB' },
                { id: 'mysql', name: 'MySQL', color: '#4479A1', icon: '🐬', position: new THREE.Vector3(0, 0, 0), description: 'Popular relational DB' }
              ]
            },
            { id: 'nosql', name: 'NoSQL Databases', color: '#00CEC9', icon: '📈', position: new THREE.Vector3(0, 0, 0), description: 'Non-relational databases',
              children: [
                { id: 'mongodb', name: 'MongoDB', color: '#47A248', icon: '🍃', position: new THREE.Vector3(0, 0, 0), description: 'Document database' },
                { id: 'redis', name: 'Redis', color: '#DC382D', icon: '⚡', position: new THREE.Vector3(0, 0, 0), description: 'In-memory data store' }
              ]
            }
          ]
        },
        { 
          id: 'devops', 
          name: 'DevOps', 
          color: '#00CEC9', 
          icon: '🚀', 
          position: new THREE.Vector3(0, 0, 0), 
          description: 'Deployment and operations',
          children: [
            { id: 'docker', name: 'Docker', color: '#2496ED', icon: '🐳', position: new THREE.Vector3(0, 0, 0), description: 'Containerization platform' },
            { id: 'kubernetes', name: 'Kubernetes', color: '#326CE5', icon: '☸️', position: new THREE.Vector3(0, 0, 0), description: 'Container orchestration' }
          ]
        }
      ]
    },
    {
      id: 'data-science',
      name: 'Data Science',
      color: '#FDCB6E', // Bright yellow
      icon: '📊',
      position: new THREE.Vector3(0, 0, 0),
      description: 'Data analysis and insights',
      children: [
        { id: 'statistics', name: 'Statistics', color: '#E17055', icon: '📈', position: new THREE.Vector3(0, 0, 0), description: 'Statistical analysis' },
        { id: 'visualization', name: 'Data Visualization', color: '#F39C12', icon: '📉', position: new THREE.Vector3(0, 0, 0), description: 'Visual data representation' },
        { id: 'big-data', name: 'Big Data', color: '#E67E22', icon: '💾', position: new THREE.Vector3(0, 0, 0), description: 'Large-scale data processing' }
      ]
    },
    {
      id: 'mobile',
      name: 'Mobile Development',
      color: '#FF7675', // Bright coral pink
      icon: '📱',
      position: new THREE.Vector3(0, 0, 0),
      description: 'Mobile app development',
      children: [
        { id: 'ios', name: 'iOS Development', color: '#E84393', icon: '🍎', position: new THREE.Vector3(0, 0, 0), description: 'iPhone and iPad apps' },
        { id: 'android', name: 'Android Development', color: '#F368E0', icon: '🤖', position: new THREE.Vector3(0, 0, 0), description: 'Android apps' },
        { id: 'react-native', name: 'React Native', color: '#FD79A8', icon: '⚛️', position: new THREE.Vector3(0, 0, 0), description: 'Cross-platform development' }
      ]
    },
    {
      id: 'security',
      name: 'Cybersecurity',
      color: '#55A3FF', // Bright blue
      icon: '🔒',
      position: new THREE.Vector3(0, 0, 0),
      description: 'Digital security and protection',
      children: [
        { id: 'ethical-hacking', name: 'Ethical Hacking', color: '#0984E3', icon: '🕵️', position: new THREE.Vector3(0, 0, 0), description: 'Penetration testing' },
        { id: 'cryptography', name: 'Cryptography', color: '#74B9FF', icon: '🔐', position: new THREE.Vector3(0, 0, 0), description: 'Encryption and security' },
        { id: 'network-security', name: 'Network Security', color: '#00B894', icon: '🛡️', position: new THREE.Vector3(0, 0, 0), description: 'Network protection' }
      ]
    }
  ]
};

const MolecularNavigation: React.FC<MolecularNavigationProps> = ({ onAtomSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const atomsRef = useRef<Atom[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Atom[]>([]);
  const [centerAtom, setCenterAtom] = useState<Atom | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [hoveredAtom, setHoveredAtom] = useState<Atom | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<Atom | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Array<{center: Atom, level: Atom[]}>>([]);

  // Efficient atom material creation - solid metal colors
  const createAtomMaterial = useCallback((atom: Atom, isCenter: boolean = false) => {
    const baseColor = new THREE.Color(atom.color);
    
    return new THREE.MeshPhysicalMaterial({
      color: baseColor,
      metalness: 0.8, // More metallic
      roughness: 0.2, // Slightly rougher for realistic metal
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: baseColor,
      emissiveIntensity: isCenter ? 0.15 : 0.05, // Less glow
      transparent: false, // Solid, no transparency
      opacity: 1.0 // Fully opaque
    });
  }, []);

  // Create optimized atom mesh - clear size hierarchy with smaller center
  const createAtomMesh = useCallback((atom: Atom, isCenter: boolean = false) => {
    const scale = isCenter ? 0.9 : 0.3; // Smaller center, same small orbiting atoms
    const geometry = new THREE.DodecahedronGeometry(scale);
    const material = createAtomMaterial(atom, isCenter);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(atom.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { atom };

    // Add subtle rotation
    mesh.rotation.x = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;

    return mesh;
  }, [createAtomMaterial]);

  // Dynamic atom positioning - handles any number of atoms
  // Uses spherical distribution to position atoms evenly around the center
  // Automatically scales based on atoms.length - works with 1, 5, 50, or any number
  const positionAtoms = useCallback((atoms: Atom[]) => {
    const radius = 3.5; // Distance from center atom
    atoms.forEach((atom, index) => {
      // Spherical coordinate distribution for even spacing
      const phi = Math.acos(-1 + (index / atoms.length) * 2);
      const theta = Math.sqrt(atoms.length * Math.PI) * phi;
      
      atom.position.x = radius * Math.sin(phi) * Math.cos(theta);
      atom.position.y = radius * Math.sin(phi) * Math.sin(theta);
      atom.position.z = radius * Math.cos(phi);
    });
  }, []);

  // Scene initialization
  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8); // Fixed initial position
    cameraRef.current = camera;

    // Renderer - high-quality cinematic settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" // Use dedicated GPU
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // High DPI support
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic tone mapping
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting for movie-quality rendering
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main directional light with high-quality shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Higher resolution shadows
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Add rim lighting for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.8);
    rimLight.position.set(-10, 5, -5);
    scene.add(rimLight);

    // Point light for additional fill
    const pointLight = new THREE.PointLight(0xffffff, 0.6, 50);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // Mouse interaction setup
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Initialize with root level
    setCenterAtom(knowledgeTree);
    setCurrentLevel(knowledgeTree.children || []);
  }, []);

  // Update scene efficiently
  const updateScene = useCallback(() => {
    if (!sceneRef.current) return;

    // Clear existing atoms
    const atomsToRemove = sceneRef.current.children.filter(child => 
      child.userData && child.userData.atom
    );
    atomsToRemove.forEach(atom => sceneRef.current!.remove(atom));

    atomsRef.current = [];

    // Add center atom
    if (centerAtom) {
      centerAtom.position.set(0, 0, 0);
      const centerMesh = createAtomMesh(centerAtom, true);
      sceneRef.current.add(centerMesh);
      centerAtom.mesh = centerMesh;
      atomsRef.current.push(centerAtom);
    }

    // Position and add orbiting atoms
    positionAtoms(currentLevel);
    currentLevel.forEach(atom => {
      const mesh = createAtomMesh(atom, false);
      sceneRef.current!.add(mesh);
      atom.mesh = mesh;
      atomsRef.current.push(atom);
    });
  }, [centerAtom, currentLevel, createAtomMesh, positionAtoms]);

  // Handle atom selection - supports infinite depth navigation
  // The system will create as many atoms as needed based on the data structure
  // Each atom can have unlimited children, and navigation works recursively
  const handleAtomClick = useCallback((atom: Atom) => {
    // Only allow navigation if atom has children (supports any depth)
    if (isTransitioning || !atom.children?.length) return;

    setIsTransitioning(true);
    
    // Save current state to navigation history for back button
    if (centerAtom) {
      setNavigationHistory(prev => [...prev, { center: centerAtom, level: currentLevel }]);
    }
    
    // Navigate to the selected atom's children (any number of them)
    setTimeout(() => {
      setCenterAtom(atom);
      setCurrentLevel(atom.children || []); // Will display all children atoms
      setIsTransitioning(false);
      onAtomSelect?.(atom);
    }, 300);
  }, [isTransitioning, onAtomSelect, centerAtom, currentLevel]);

  // Handle back navigation
  const handleGoBack = useCallback(() => {
    if (navigationHistory.length === 0 || isTransitioning) return;

    setIsTransitioning(true);
    
    const previousState = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory(prev => prev.slice(0, -1));
    
    setTimeout(() => {
      setCenterAtom(previousState.center);
      setCurrentLevel(previousState.level);
      setIsTransitioning(false);
    }, 300);
  }, [navigationHistory, isTransitioning]);

  // Mouse interaction
  const handleMouseClick = useCallback((event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !raycasterRef.current || !mouseRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    const meshes = atomsRef.current.map(atom => atom.mesh).filter(Boolean) as THREE.Mesh[];
    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const atom = intersects[0].object.userData.atom as Atom;
      if (atom.id !== centerAtom?.id) {
        setSelectedAtom(atom); // Set selected atom for info panel
        handleAtomClick(atom);
      }
    }
  }, [centerAtom, handleAtomClick]);

  // Mouse interaction with hover detection
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !raycasterRef.current || !mouseRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    const meshes = atomsRef.current.map(atom => atom.mesh).filter(Boolean) as THREE.Mesh[];
    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const atom = intersects[0].object.userData.atom as Atom;
      setHoveredAtom(atom);
      if (mountRef.current) {
        mountRef.current.style.cursor = 'pointer';
      }
    } else {
      setHoveredAtom(null);
      if (mountRef.current) {
        mountRef.current.style.cursor = 'default';
      }
    }
  }, []);

  // Optimized animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Rotate atoms efficiently
    currentLevel.forEach((atom, index) => {
      if (atom.mesh) {
        const time = Date.now() * 0.001;
        const speed = 0.3 + index * 0.05;
        const radius = atom.position.length();
        
        atom.mesh.position.x = radius * Math.cos(time * speed);
        atom.mesh.position.z = radius * Math.sin(time * speed);
        atom.mesh.position.y = Math.sin(time * speed * 0.3) * 1.5;
        
        atom.mesh.rotation.y += 0.01;
      }
    });

    // Rotate center atom
    if (centerAtom?.mesh) {
      centerAtom.mesh.rotation.y += 0.02;
      centerAtom.mesh.rotation.x += 0.01;
    }

    // Gentle camera orbit - using zoom level
    const time = Date.now() * 0.0003;
    cameraRef.current.position.x = Math.cos(time) * zoomLevel;
    cameraRef.current.position.z = Math.sin(time) * zoomLevel;
    cameraRef.current.lookAt(0, 0, 0);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameIdRef.current = requestAnimationFrame(animate);
  }, [currentLevel, centerAtom, zoomLevel]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Effects
  useEffect(() => {
    const currentMount = mountRef.current;
    initScene();
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current && currentMount) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
    };
  }, [initScene]);

  useEffect(() => {
    updateScene();
  }, [updateScene]);

  useEffect(() => {
    animate();
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (currentMount) {
      currentMount.addEventListener('click', handleMouseClick);
      currentMount.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (currentMount) {
        currentMount.removeEventListener('click', handleMouseClick);
        currentMount.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [handleMouseClick, handleMouseMove, handleResize]);

  // Handle zoom changes without reinitializing scene
  useEffect(() => {
    if (cameraRef.current) {
      // Update camera position for zoom, but maintain the orbit
      const time = Date.now() * 0.0003;
      const x = Math.cos(time) * zoomLevel;
      const z = Math.sin(time) * zoomLevel;
      const y = cameraRef.current.position.y;
      cameraRef.current.position.set(x, y, z);
    }
  }, [zoomLevel]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full min-h-[600px]" />
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          {centerAtom?.name || 'Knowledge Structure'}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {centerAtom?.description || 'Click on any atom to explore deeper'}
        </p>
        <div className="text-xs text-gray-500">
          <p>🎯 Center: {centerAtom?.name}</p>
          <p>🔬 Exploring: {currentLevel.length} topics</p>
          <p>📍 Depth: Level {navigationHistory.length + 1}</p>
        </div>
      </div>

      {/* Back Button */}
      {navigationHistory.length > 0 && (
        <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200">
          <button 
            onClick={handleGoBack}
            disabled={isTransitioning}
            className="w-16 h-10 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go Back"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200">
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 2, 4))}
            className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center font-bold text-lg"
            aria-label="Zoom In"
          >
            +
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 2, 20))}
            className="w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center font-bold text-lg"
            aria-label="Zoom Out"
          >
            −
          </button>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredAtom && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-lg">{hoveredAtom.icon}</span>
              <span className="font-semibold text-gray-800">{hoveredAtom.name}</span>
            </div>
            <p className="text-xs text-gray-600">{hoveredAtom.description}</p>
            <p className="text-xs text-blue-600 mt-1">Click to explore →</p>
          </div>
        </div>
      )}

      {/* Selection Info Panel */}
      {selectedAtom && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 max-w-64">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{selectedAtom.icon}</span>
              <span className="font-bold text-gray-800">{selectedAtom.name}</span>
            </div>
            <button 
              onClick={() => setSelectedAtom(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">{selectedAtom.description}</p>
          {selectedAtom.children && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Sub-topics:</p>
              <div className="space-y-1">
                {selectedAtom.children.map(child => (
                  <div key={child.id} className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>{child.icon}</span>
                    <span>{child.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MolecularNavigation;
