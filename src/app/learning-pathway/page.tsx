"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import styles from './learning-pathway.module.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import gsap from 'gsap';
import { DragControls } from 'three/examples/jsm/controls/DragControls';

// Define an interface for a learning module
interface LearningModule {
    title: string;
    description?: string;
    subtopics?: LearningModule[];
}

// Define a more flexible interface for the learning pathway that doesn't rely on predefined levels
interface LearningPathway {
    [key: string]: { modules: LearningModule[] };
    career_goal?: string;
}

// Add interface for selected module tracking
interface SelectedModule {
  id: string; // Unique identifier for the module
  level: string; // beginner, intermediate, advanced
  moduleIndex?: number; // Index within the level's modules array
  object: THREE.Object3D; // Reference to the THREE.js object
}

const LearningPathwayPage: React.FC = () => {
    const [learningPathway, setLearningPathway] = useState<LearningPathway | null>(null);
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    
    // NEW: Add state for selection mode
    const [selectionMode, setSelectionMode] = useState<boolean>(false);
    const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
    
    // NEW: Add a ref to hold the initial learning pathway data
    const initialLearningPathway = useRef<LearningPathway | null>(null);
    
    // Reference for 3D elements
    const threeContainerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const atomsRef = useRef<{[key: string]: THREE.Object3D}>({});
    const frameIdRef = useRef<number | null>(null);

    // Add new state for the dialog box and level selection
    const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
    const [newLevelName, setNewLevelName] = useState<string>("");
    const [newModuleName, setNewModuleName] = useState<string>("");

    // NEW: Add a ref to store the createAtom function
    const createAtomRef = useRef<any>(null);

    // Fetch learning pathway data
    useEffect(() => {
        if (!userId) {
            console.error("User ID not found in search params");
            return;
        }

        const fetchCareerGoals = async () => {
            try {
                const res = await fetch(`/api/get-career-goals?userId=${userId}`);
                if (!res.ok) throw new Error(`Failed to fetch career goals: ${res.status}`);
                return await res.json();
            } catch (err) {
                console.error("Error fetching career goals:", err);
                return { career_goal: "Your Career Goal" };
            }
        };

        const fetchLearningPathway = async () => {
            try {
                const verifiedResponse = await fetch(`/api/generate-learning-pathway?userId=${userId}`);
                if (!verifiedResponse.ok) throw new Error(`Failed to fetch learning pathway: ${verifiedResponse.status}`);
                const verifiedData = await verifiedResponse.json();

                const careerData = await fetchCareerGoals();
                // Merge verified pathway with career goals from user_profiles
                const initialPathway = { ...verifiedData, career_goal: careerData.career_goal };
                setLearningPathway(initialPathway);
                initialLearningPathway.current = initialPathway; // Store initial data in ref
                setIsLoading(false); // Added to stop loading indicator
            } catch (error: any) {
                console.error("Error fetching learning pathway:", error);
            }
        };

        fetchLearningPathway();
    }, [userId]);

    // Save learning pathway
    const handleSave = async () => {
        if (!userId || !learningPathway) return;

        try {
            const response = await fetch(`/api/save-learning-pathway?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(learningPathway),
            });

            if (response.ok) {
                console.log("Learning pathway saved successfully");
                router.push("/home");
            } else {
                throw new Error(`Failed to save learning pathway: ${response.status}`);
            }
        } catch (error: any) {
            console.error("Error saving learning pathway:", error);
        }
    };

    // Molecule visualization setup
    useEffect(() => {
        if (!threeContainerRef.current || !learningPathway) return;
        
        // Clear container
        while (threeContainerRef.current.firstChild) {
            threeContainerRef.current.removeChild(threeContainerRef.current.firstChild);
        }
        
        // Setup scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        // Setup camera
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 20);
        cameraRef.current = camera;
        
        // Setup renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff, 1);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;
        threeContainerRef.current.appendChild(renderer.domElement);
        
        // Create CSS2D renderer for labels
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        threeContainerRef.current.appendChild(labelRenderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(1, 1, 1);
        scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight2.position.set(-1, -1, -1);
        scene.add(directionalLight2);
        
        // Create central atom (career goal) - MODIFIED with selection tracking
        const createAtom = (name: string, color: number, size: number, position: THREE.Vector3, isCentral: boolean = false, level?: string, moduleIndex?: number) => {
            const group = new THREE.Group();
            
            // Nucleus
            const geometry = new THREE.IcosahedronGeometry(size, 0);
            const material = new THREE.MeshPhysicalMaterial({
                color: color,
                metalness: 0.7,
                roughness: 0.3,
                clearcoat: 0.5,
                clearcoatRoughness: 0.3,
                reflectivity: 0.5,
            });
            
            const nucleus = new THREE.Mesh(geometry, material);
            group.add(nucleus);
            
            // Store original color for selection toggle
            group.userData.originalColor = new THREE.Color(color);
            group.userData.isCentral = isCentral;
            group.userData.level = level;
            group.userData.moduleIndex = moduleIndex;
            group.userData.name = name;
            
            // Generate a unique ID for the module
            group.userData.id = `${level || 'central'}-${moduleIndex !== undefined ? moduleIndex : 'goal'}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Label
            const textDiv = document.createElement('div');
            textDiv.className = styles.atomLabel;
            textDiv.textContent = name;
            textDiv.style.color = '#333';
            textDiv.style.background = 'rgba(255,255,255,0.8)';
            textDiv.style.padding = '3px 6px';
            textDiv.style.borderRadius = '4px';
            textDiv.style.fontWeight = 'bold';
            
            const label = new CSS2DObject(textDiv);
            label.position.set(0, -size - 0.5, 0);
            group.add(label);
            
            group.position.copy(position);
            scene.add(group);
            
            // Make non-central atoms clickable for selection - FIXED: add click handler to the nucleus
            if (!isCentral) {
                // Add click handler to toggle selection for both group and nucleus
                const toggleSelection = () => {
                    // Only allow selection when in selection mode
                    if (!selectionMode) return;
                    
                    console.log(`Toggling selection for: ${name}`);
                    
                    if (group.userData.isSelected) {
                        // Deselect
                        material.color.copy(group.userData.originalColor);
                        group.userData.isSelected = false;
                        setSelectedModules(prev => prev.filter(m => m.id !== group.userData.id));
                    } else {
                        // Select
                        material.color.set(0xff0000); // Red for selected
                        group.userData.isSelected = true;
                        setSelectedModules(prev => [...prev, {
                            id: group.userData.id,
                            level: group.userData.level,
                            moduleIndex: group.userData.moduleIndex,
                            object: group
                        }]);
                    }
                };
                
                // Set the onClick handler on both the group and the nucleus
                group.userData.onClick = toggleSelection;
                nucleus.userData.onClick = toggleSelection;
                
                // Add click interaction area data to both objects
                group.userData.clickable = true;
                nucleus.userData.clickable = true;
            }
            
            return { group, nucleus };
        };
        
        // Store the function in a ref so it can be accessed outside this useEffect
        createAtomRef.current = createAtom;
        
        // Use career goal from the output if available, fallback if not.
        const careerGoalLabel = learningPathway.career_goal || "Your Career Goal";
        const centralPosition = new THREE.Vector3(0, 0, 0);
        const { group: centralGroup } = createAtom(
            careerGoalLabel,
            0x9370DB,
            2.5,
            centralPosition,
            true // is central
        );
        atomsRef.current.central = centralGroup;
        
        // Create level atoms with consistent orbits
        const levels = Object.keys(learningPathway).filter(k => k !== "career_goal");
        const levelRadius = 8;
        const levelColors = {
            beginner: 0x6366f1,
            intermediate: 0x8b5cf6,
            advanced: 0xd946ef
        };
        
        levels.forEach((level, index) => {
            const angle = (index / levels.length) * Math.PI * 2;
            const x = Math.cos(angle) * levelRadius;
            const y = Math.sin(angle) * levelRadius;
            
            const position = new THREE.Vector3(x, y, 0);
            const { group: levelGroup, nucleus: levelNucleus } = createAtom(
                level.charAt(0).toUpperCase() + level.slice(1),
                levelColors[level as keyof typeof levelColors], 
                1.5, 
                position,
                false, // not central
                level  // level name
            );
            
            // Add complete orbit ring around central atom - but make it invisible (opacity 0)
            const ringGeometry = new THREE.TorusGeometry(
                levelRadius, // radius
                0.05, // tube thickness
                16, // tubular segments
                100, // radial segments
                Math.PI * 2 // Full circle (2π)
            );
            
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: levelColors[level as keyof typeof levelColors],
                transparent: true,
                opacity: 0, // Set opacity to 0 to make invisible
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2; // Rotate to lie flat on XZ plane
            centralGroup.add(ring);
            
            atomsRef.current[level] = levelGroup;
            
            // Safely retrieve modules array; default to empty if undefined
            const modules = Array.isArray(learningPathway[level]?.modules) ? learningPathway[level].modules : [];
            
            // Create module atoms for this level
            const moduleRadius = 3.5;
            
            // Create a complete orbit ring for modules around this level - but make it invisible
            const moduleOrbitGeometry = new THREE.TorusGeometry(
                moduleRadius, // radius
                0.03, // tube thickness
                16, // tubular segments
                100, // radial segments
                Math.PI * 2 // Full circle (2π)
            );
            
            const moduleOrbitMaterial = new THREE.MeshBasicMaterial({
                color: levelColors[level as keyof typeof levelColors],
                transparent: true,
                opacity: 0, // Set opacity to 0 to make invisible
            });
            
            const moduleOrbitRing = new THREE.Mesh(moduleOrbitGeometry, moduleOrbitMaterial);
            moduleOrbitRing.rotation.x = Math.PI / 2; // Rotate to lie flat on XZ plane
            levelGroup.add(moduleOrbitRing);
            
            // Place modules evenly around the orbit
            modules.forEach((module, moduleIndex) => {
                const moduleAngle = (moduleIndex / modules.length) * Math.PI * 2;
                const moduleX = Math.cos(moduleAngle) * moduleRadius;
                const moduleY = Math.sin(moduleAngle) * moduleRadius;
                
                const modulePosition = new THREE.Vector3(moduleX, moduleY, 0);
                const { group: moduleGroup } = createAtom(
                    module.title,
                    levelColors[level as keyof typeof levelColors], 
                    0.5, 
                    modulePosition,
                    false, // not central
                    level,  // level name
                    moduleIndex // module index
                );
                
                // Use a pivot group for clean orbital motion
                const pivotGroup = new THREE.Group();
                pivotGroup.add(moduleGroup);
                levelGroup.add(pivotGroup);
                
                // Store consistent orbital speeds
                moduleGroup.userData = {
                    pivot: pivotGroup,
                    orbitalSpeed: 0.005, // Constant speed for all modules
                    selfRotationSpeed: 0.01, // Constant rotation speed
                    initialAngle: moduleAngle
                };

                // After creating the module atom, check for subtopics:
                if (module.subtopics && module.subtopics.length > 0) {
                    const subRadius = 1.5;
                    module.subtopics.forEach((subtopic, subIndex) => {
                        const subAngle = (subIndex / module.subtopics.length) * Math.PI * 2;
                        const subX = Math.cos(subAngle) * subRadius;
                        const subY = Math.sin(subAngle) * subRadius;
                        const subPosition = new THREE.Vector3(subX, subY, 0);
                        // Create a smaller sub atom for the subtopic
                        const { group: subGroup } = createAtom(
                            subtopic.title,
                            levelColors[level as keyof typeof levelColors],
                            0.3,
                            subPosition
                        );
                        // Position the sub atom relative to its module
                        subGroup.position.add(moduleGroup.position);
                        // Attach the sub atom to the module group so it moves together
                        moduleGroup.add(subGroup);
                    });
                }
            });
            
            // Setup consistent level orbit
            const levelPivot = new THREE.Group();
            levelPivot.add(levelGroup);
            centralGroup.add(levelPivot);
            
            // Store consistent speeds for level orbits
            levelGroup.userData = {
                pivot: levelPivot,
                orbitalSpeed: 0.001, // Constant orbit speed for all levels
                selfRotationSpeed: 0.005, // Constant rotation speed
                initialAngle: angle
            };
        });

        // Store original positions for snap-back functionality
        const originalPositions = new Map();
        
        // Drag controls with improved vacuum effect and freezing motion during drag
        const dragControls = new DragControls(Object.values(atomsRef.current), camera, renderer.domElement);
        dragControls.addEventListener('dragstart', (event) => {
            controlsRef.current.enabled = false;
            const object = event.object;
            // Store original position when starting drag
            originalPositions.set(object.id, object.position.clone());
            
            // Store original animation parameters
            if (object.userData) {
                object.userData.originalOrbitalSpeed = object.userData.orbitalSpeed;
                object.userData.originalSelfRotationSpeed = object.userData.selfRotationSpeed;
                
                // Freeze all animation during drag
                object.userData.orbitalSpeed = 0;
                object.userData.selfRotationSpeed = 0;
                
                // Also freeze the parent pivot if it exists
                if (object.userData.pivot) {
                    object.userData.pivot.userData = object.userData.pivot.userData || {};
                    object.userData.pivot.userData.originalRotationZ = object.userData.pivot.rotation.z;
                    object.userData.pivot.userData.originalOrbitalSpeed = object.userData.pivot.userData.orbitalSpeed || 0;
                    object.userData.pivot.userData.orbitalSpeed = 0; // Freeze orbit
                }
            }
        });
        
        dragControls.addEventListener('dragend', (event) => {
            controlsRef.current.enabled = true;
            const object = event.object;
            const originalPos = originalPositions.get(object.id);
            
            // If dragged far enough left, vacuum to black hole
            if (object.position.x < -10) {
                // Create black hole vacuum effect
                gsap.to(object.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 0.7,
                    ease: "power3.in",
                    onComplete: () => {
                        scene.remove(object);
                    }
                });
                gsap.to(object.position, {
                    x: -15,
                    y: 0,
                    z: 0,
                    duration: 0.7,
                    ease: "power3.in",
                    onComplete: () => {
                        // Ensure the object is removed from the scene
                        scene.remove(object);
                    }
                });
            } 
            // Otherwise snap back to original position
            else if (originalPos) {
                gsap.to(object.position, {
                    x: originalPos.x,
                    y: originalPos.y,
                    z: originalPos.z,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.5)",
                    onComplete: () => {
                        // Restore original animation parameters after snap back animation completes
                        if (object.userData) {
                            object.userData.orbitalSpeed = object.userData.originalOrbitalSpeed || 0;
                            object.userData.selfRotationSpeed = object.userData.originalSelfRotationSpeed || 0;
                            if (object.userData.pivot) {
                                object.userData.pivot.userData.orbitalSpeed = object.userData.pivot.userData.originalOrbitalSpeed || 0;
                            }
                        }
                    }
                });
            }
        });
        
        // During drag, add visual feedback
        dragControls.addEventListener('drag', (event) => {
            const object = event.object;
            
            // Visual feedback - scale down slightly when moving towards the black hole
            if (object.position.x < 0) {
                const scaleFactor = Math.max(0.8, 1 - Math.abs(object.position.x) / 20);
                object.scale.set(scaleFactor, scaleFactor, scaleFactor);
            } else {
                // Reset scale when not moving towards the black hole
                object.scale.set(1, 1, 1);
            }
        });

        // Add click handler detection for selection - IMPROVED RAYCASTER SETTINGS
        const raycaster = new THREE.Raycaster();
        // Increase precision by adjusting the threshold
        raycaster.params.Points.threshold = 0.1;
        raycaster.params.Line.threshold = 0.1;
        const mouse = new THREE.Vector2();
        
        const handleClick = (event: MouseEvent) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            console.log('Click detected at', mouse.x, mouse.y);
            
            // Update the picking ray
            raycaster.setFromCamera(mouse, camera);
            
            // Find intersections - INCLUDE ALL OBJECTS, NOT JUST CHILDREN
            const intersects = raycaster.intersectObjects(scene.children, true);
            console.log('Intersections found:', intersects.length);
            
            if (intersects.length > 0) {
                // Improved traversal to find clickable objects
                for (const intersect of intersects) {
                    let currentObject: THREE.Object3D | null = intersect.object;
                    
                    // Check if this object or any of its parents have an onClick handler
                    while (currentObject) {
                        if (currentObject.userData && currentObject.userData.onClick) {
                            console.log('Found clickable object:', currentObject.userData.name || 'unnamed');
                            currentObject.userData.onClick();
                            return; // Stop after handling one click
                        }
                        currentObject = currentObject.parent;
                    }
                }
                console.log('No clickable objects found in intersections');
            }
        };
        
        // Attach the click handler
        renderer.domElement.addEventListener('click', handleClick);
        
        // Animation loop with consistent speeds
        const animate = () => {
            if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
            
            // Rotate central atom
            if (atomsRef.current.central) {
                atomsRef.current.central.rotation.y += 0.003;
            }
            
            // Update animation for all objects with consistent orbital motion
            scene.traverse((object) => {
                if (object instanceof THREE.Group && object.userData && object.userData.pivot) {
                    // Orbital animation - now with consistent speeds
                    if (object.userData.pivot) {
                        object.userData.pivot.rotation.z += object.userData.orbitalSpeed;
                    }
                    
                    // Self rotation animation - now with consistent speeds
                    object.rotation.y += object.userData.selfRotationSpeed;
                }
            });
            
            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);
            
            frameIdRef.current = requestAnimationFrame(animate);
        };
        
        // Start animation
        frameIdRef.current = requestAnimationFrame(animate);
        
        // Add orbit controls for interactive camera movement
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 30;
        controlsRef.current = controls;
        
        // Handle window resize
        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current) return;
            
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            
            if (frameIdRef.current !== null) {
                cancelAnimationFrame(frameIdRef.current);
            }
            
            if (controlsRef.current) {
                controlsRef.current.dispose();
            }
            
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
            
            // Dispose geometries and materials
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });

            renderer.domElement.removeEventListener('click', handleClick);
        };
    }, [learningPathway, selectionMode]); // Add selectionMode to dependency array

    // Add helper to dispose of a 3D object
    function disposeObject(object: THREE.Object3D) {
        // Dispose geometries and materials for each mesh in this object
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    // Updated function to toggle selection mode instead of immediately removing
    const handleRemoveModeToggle = () => {
        // If already in selection mode with modules selected, show confirmation dialog
        if (selectionMode && selectedModules.length > 0) {
            if (confirm(`Are you sure you want to remove ${selectedModules.length} selected module(s)?`)) {
                // Create a copy of the pathway from the ref
                const updatedPathway = {
                    ...initialLearningPathway.current,
                    beginner: { ...initialLearningPathway.current?.beginner },
                    intermediate: { ...initialLearningPathway.current?.intermediate },
                    advanced: { ...initialLearningPathway.current?.advanced }
                };
        
                // Sort selectedModules by moduleIndex in descending order to avoid index shifting issues
                const sortedSelectedModules = [...selectedModules].sort((a, b) => (b.moduleIndex || 0) - (a.moduleIndex || 0));
        
                // Remove selected modules from the 3D scene and data structure
                sortedSelectedModules.forEach(selectedModule => {
                    const { level, moduleIndex, object } = selectedModule;
        
                    // Remove from 3D scene
                    if (object && object.parent) {
                        object.parent.remove(object);
                        disposeObject(object);
                    } else {
                        sceneRef.current?.remove(object);
                        disposeObject(object);
                    }
        
                    // Remove from data structure
                    if (level && moduleIndex !== undefined && updatedPathway[level]?.modules) {
                        updatedPathway[level].modules.splice(moduleIndex, 1);
                    }
                });
        
                // Update learning pathway state
                setLearningPathway(updatedPathway);
        
                // Clear selection
                setSelectedModules([]);
                // Exit selection mode
                setSelectionMode(false);
            }
        }
        // If in selection mode but nothing selected, simply cancel selection mode:
        else if (selectionMode) {
            setSelectionMode(false);
            selectedModules.forEach(module => {
                if (module.object && module.object.userData && module.object.userData.originalColor) {
                    const material = (module.object.children[0] as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
                    material.color.copy(module.object.userData.originalColor);
                    module.object.userData.isSelected = false;
                }
            });
            setSelectedModules([]);
        }
        // Otherwise, enter selection mode:
        else {
            setSelectionMode(true);
        }
    };

    // Create an actual 3D module directly in the scene - UPDATED to make moduleName optional
    const addMolecule = (levelName: string, moduleName?: string) => {
        if (!learningPathway || !levelName.trim() || !createAtomRef.current) return;

        // Use the createAtom function from the ref
        const createAtom = createAtomRef.current;
        
        // 1. Create a copy of the current pathway
        const updatedPathway = { ...learningPathway };
        
        // 2. Check if level exists, if not create it
        if (!updatedPathway[levelName]) {
          updatedPathway[levelName] = { modules: [] };
        }
        
        // 3. Add new module to the level ONLY if moduleName is provided
        if (moduleName && moduleName.trim()) {
          const newModuleIndex = updatedPathway[levelName].modules.length;
          updatedPathway[levelName].modules.push({ title: moduleName, subtopics: [] });
        }
        
        // 4. Update both the state and the ref
        setLearningPathway(updatedPathway);
        initialLearningPathway.current = updatedPathway;
        
        // 5. Create visual representation in the 3D scene
        if (!sceneRef.current) return;
        
        // Create a new level atom if it doesn't exist
        if (!atomsRef.current[levelName]) {
          // Calculate position for the new level
          const existingLevels = Object.keys(atomsRef.current).filter(key => key !== 'central');
          const levelRadius = 8;
          const angle = (existingLevels.length / (existingLevels.length + 1)) * Math.PI * 2;
          const x = Math.cos(angle) * levelRadius;
          const y = Math.sin(angle) * levelRadius;
          const position = new THREE.Vector3(x, y, 0);
          
          // Generate a random color for the new level
          const levelColor = new THREE.Color(
            0.4 + Math.random() * 0.6,
            0.4 + Math.random() * 0.6,
            0.4 + Math.random() * 0.6
          ).getHex();
          
          // Create the level atom
          const { group: levelGroup } = createAtom(
            levelName,
            levelColor,
            1.5,
            position,
            false,
            levelName
          );
          
          // Add orbit ring
          const ringGeometry = new THREE.TorusGeometry(
            levelRadius,
            0.05,
            16,
            100,
            Math.PI * 2
          );
          
          const ringMaterial = new THREE.MeshBasicMaterial({
            color: levelColor,
            transparent: true,
            opacity: 0,
          });
          
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.rotation.x = Math.PI / 2;
          atomsRef.current.central.add(ring);
          
          // Setup level orbit
          const levelPivot = new THREE.Group();
          levelPivot.add(levelGroup);
          atomsRef.current.central.add(levelPivot);
          
          // Store level speeds
          levelGroup.userData = {
            pivot: levelPivot,
            orbitalSpeed: 0.001,
            selfRotationSpeed: 0.005,
            initialAngle: angle
          };
          
          // Store in the refs
          atomsRef.current[levelName] = levelGroup;
          
          console.log(`Added new level: ${levelName}`);
        }
        
        // Only add a module if moduleName is provided
        if (moduleName && moduleName.trim()) {
          // Now add the module to the level
          const levelGroup = atomsRef.current[levelName];
          const moduleRadius = 3.5;
          const modules = updatedPathway[levelName].modules;
          const newModuleIndex = modules.length - 1; // Module was already added to array
          const moduleAngle = (newModuleIndex / modules.length) * Math.PI * 2;
          const moduleX = Math.cos(moduleAngle) * moduleRadius;
          const moduleY = Math.sin(moduleAngle) * moduleRadius;
          const modulePosition = new THREE.Vector3(moduleX, moduleY, 0);
          
          // Create module
          // ...existing module creation code...
          
          console.log(`Added module: ${moduleName} to level: ${levelName}`);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading your personalized learning pathway...</p>
            </div>
        );
    }

    return (
        <div className={styles.fullscreenContainer}>
            {/* 3D visualization container */}
            <div ref={threeContainerRef} className={styles.fullscreenThreeContainer}></div>
            
            {/* UI overlay */}
            <div className={styles.pageTitle}>Your Learning Pathway</div>
            
            <div className={styles.controls}>
                <button onClick={handleSave} className={styles.saveButton}>Save Pathway</button>
                <button onClick={() => router.push("/home")} className={styles.backButton}>Back to Home</button>
            </div>
            
            {/* Info panel - UPDATED to show selection mode info */}
            <div className={styles.infoPanel}>
                {selectionMode ? (
                    <p className={styles.selectionModeText}>
                        Selection mode active. Click on modules to select them for removal.
                        {selectedModules.length > 0 && ` (${selectedModules.length} selected)`}
                    </p>
                ) : (
                    <p>Click and drag to rotate the view. Zoom with mouse wheel.</p>
                )}
                <p>Explore your personalized learning pathway with interconnected topics.</p>
            </div>
            
            {/* Hovering buttons - UPDATED for selection mode */}
            <div className={styles.hoveringButtons}>
                <button 
                  className={styles.hoveringButton}
                  onClick={() => setShowAddDialog(true)}>
                  Add
                </button>
                <button 
                  className={`${styles.hoveringButton} ${selectionMode ? styles.hoveringButtonActive : ''}`}
                  onClick={handleRemoveModeToggle}>
                  {selectionMode 
                    ? `Confirm Removal${selectedModules.length > 0 ? ` (${selectedModules.length})` : ''}`
                    : 'Remove'}
                </button>
                {/* Show cancel button when in selection mode */}
                {selectionMode && (
                    <button 
                      className={styles.hoveringButtonCancel}
                      onClick={() => {
                        setSelectionMode(false);
                        // Reset any selections
                        selectedModules.forEach(module => {
                            if (module.object && module.object.userData && module.object.userData.originalColor) {
                                const material = (module.object.children[0] as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
                                material.color.copy(module.object.userData.originalColor);
                                module.object.userData.isSelected = false;
                            }
                        });
                        setSelectedModules([]);
                      }}>
                      Cancel
                    </button>
                )}
            </div>

            {/* Add the dialog box for adding modules */}
            {showAddDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        minWidth: '300px'
                    }}>
                        <label style={{ display: 'block', marginBottom: '10px' }}>Level Name:</label>
                        <input 
                            type="text" 
                            value={newLevelName} 
                            placeholder="Enter a new level name"
                            onChange={e => setNewLevelName(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                        />
                        
                        <label style={{ display: 'block', marginBottom: '10px' }}>Module Name (Optional):</label>
                        <input 
                            type="text" 
                            value={newModuleName} 
                            placeholder="Enter module name (optional)"
                            onChange={e => setNewModuleName(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginBottom: '20px' }}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => {
                                setShowAddDialog(false);
                                setNewLevelName("");
                                setNewModuleName("");
                            }}>Cancel</button>
                            <button onClick={() => {
                                if(newLevelName.trim()){
                                  // Call addMolecule with or without moduleName
                                  addMolecule(newLevelName.trim(), newModuleName.trim() || undefined);
                                  setShowAddDialog(false);
                                  setNewLevelName("");
                                  setNewModuleName("");
                                }
                            }}>Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningPathwayPage;
