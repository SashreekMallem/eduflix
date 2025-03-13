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

// Define an interface for the learning pathway
interface LearningPathway {
    beginner: { modules: LearningModule[] };
    intermediate: { modules: LearningModule[] };
    advanced: { modules: LearningModule[] };
    career_goal?: string;
}

const LearningPathwayPage: React.FC = () => {
    const [learningPathway, setLearningPathway] = useState<LearningPathway | null>(null);
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    
    // Reference for 3D elements
    const threeContainerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const atomsRef = useRef<{[key: string]: THREE.Object3D}>({});
    const frameIdRef = useRef<number | null>(null);

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
                setLearningPathway({ ...verifiedData, career_goal: careerData.career_goal });
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
        
        // Create central atom (career goal)
        const createAtom = (name: string, color: number, size: number, position: THREE.Vector3) => {
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
            
            return { group, nucleus };
        };
        
        // Use career goal from the output if available, fallback if not.
        const careerGoalLabel = learningPathway.career_goal || "Your Career Goal";
        const centralPosition = new THREE.Vector3(0, 0, 0);
        const { group: centralGroup } = createAtom(
            careerGoalLabel,
            0x9370DB,
            2.5,
            centralPosition
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
                position
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
                // Create a random color variation based on the level's base color
                const baseColor = new THREE.Color(levelColors[level as keyof typeof levelColors]);
                const hsl = { h: 0, s: 0, l: 0 };
                baseColor.getHSL(hsl);
                hsl.h += (Math.random() - 0.5) * 0.1;
                hsl.s = Math.min(Math.max(hsl.s + (Math.random() - 0.5) * 0.1, 0), 1);
                hsl.l = Math.min(Math.max(hsl.l + (Math.random() - 0.5) * 0.1, 0), 1);
                baseColor.setHSL(hsl.h, hsl.s, hsl.l);
                const randomModuleColor = baseColor.getHex();
                
                const { group: moduleGroup } = createAtom(
                    module.title,
                    randomModuleColor, 
                    0.5, 
                    modulePosition
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
        };
    }, [learningPathway]);

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
            
            {/* Black hole indicator */}
            <div className={styles.blackHole}></div>
            
            {/* UI overlay */}
            <div className={styles.pageTitle}>Your Learning Pathway</div>
            
            <div className={styles.controls}>
                <button onClick={handleSave} className={styles.saveButton}>Save Pathway</button>
                <button onClick={() => router.push("/home")} className={styles.backButton}>Back to Home</button>
            </div>
            
            {/* Info panel */}
            <div className={styles.infoPanel}>
                <p>Click and drag to rotate the view. Zoom with mouse wheel.</p>
                <p>Explore your personalized learning pathway with interconnected topics.</p>
            </div>
        </div>
    );
};

export default LearningPathwayPage;
