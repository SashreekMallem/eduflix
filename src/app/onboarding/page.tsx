"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { FaUpload, FaLinkedin } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from "react-tooltip"; // Updated import

export default function NeuralNetworkBackground() {
  interface Node {
    id: number;
    x: number;
    y: number;
    vx: number;
    size: number;
    connectedTo: number[];
    isStatic: boolean;
    textPinned?: boolean; // Add this line
  }
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [username, setUsername] = useState("");
  const [formVisible, setFormVisible] = useState(true);
  const [step, setStep] = useState(1);
  const [expandedNode, setExpandedNode] = useState<number | null>(null); // NEW state added

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [transcriptFiles, setTranscriptFiles] = useState<File[]>([]);
  const [currentCourse, setCurrentCourse] = useState("");
  interface Certification {
    title: string;
    issuer: string;
  }
  
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [currentCertificationTitle, setCurrentCertificationTitle] = useState("");
  const [currentCertificationIssuer, setCurrentCertificationIssuer] = useState("");
  interface OnlineCourse {
    name: string;
    company: string;
  }
  
  const [onlineCourses, setOnlineCourses] = useState<OnlineCourse[]>([]);
  const [currentOnlineCourseName, setCurrentOnlineCourseName] = useState("");
  const [currentOnlineCourseIssuer, setCurrentOnlineCourseIssuer] = useState("");
  const [currentOnlineCourseStatus, setCurrentOnlineCourseStatus] = useState("");
  const [onlineCourseCertificate, setOnlineCourseCertificate] = useState(null);
  const [addedCertifications, setAddedCertifications] = useState([]);
  const [addedOnlineCourses, setAddedOnlineCourses] = useState([]);
  const [addedItems, setAddedItems] = useState<{ type: string; title?: string; name?: string; issuer: string; verificationLink?: string }[]>([]);
  const [currentVerificationLink, setCurrentVerificationLink] = useState("");
  const [showVerificationLinkInput, setShowVerificationLinkInput] = useState(false);
  const [currentType, setCurrentType] = useState("certification");
  const [workExperienceCompany, setWorkExperienceCompany] = useState("");
  const [workExperienceTitle, setWorkExperienceTitle] = useState("");
  const [workExperienceDescription, setWorkExperienceDescription] = useState("");
  interface WorkExperience {
    company: string;
    title: string;
    description: string;
  }

  const [addedWorkExperiences, setAddedWorkExperiences] = useState<WorkExperience[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [projectDescription, setProjectDescription] = useState("");
  interface Project {
    file: File;
    description: string;
  }
  
  const [addedProjects, setAddedProjects] = useState<Project[]>([]);
  // New state variables for work experience
  // New state variables for steps 6 and 7
  const [preferredLearningPace, setPreferredLearningPace] = useState("");
  const [learningCommitment, setLearningCommitment] = useState("");
  const [preferredLearningMethods, setPreferredLearningMethods] = useState<string[]>([]);
  // New state variables for project
  const [userId, setUserId] = useState(""); // New state for storing the auth user id
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("High School");
  const [currentStatus, setCurrentStatus] = useState(""); // New state for current status
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [relevantCourses, setRelevantCourses] = useState<string[]>([]);
  interface Degree {
    university: string;
    degree: string;
    fieldOfStudy: string;
    relevantCourses: string[];
  }

  const [addedDegrees, setAddedDegrees] = useState<Degree[]>([]);
  const [proficiencyLevels, setProficiencyLevels] = useState({});
  const [learningGoals, setLearningGoals] = useState<string[]>([]);

  const handleAddDegree = () => {
    if (university && degree && fieldOfStudy) {
      setAddedDegrees([
        ...addedDegrees,
      ]);
      setUniversity("");
      setDegree("High School");
      setFieldOfStudy("");
      setRelevantCourses([]);
    }
  };

  const handleRemoveDegree = (index: number) => {
    const newDegrees = [...addedDegrees];
    newDegrees.splice(index, 1);
    setAddedDegrees(newDegrees);
  };

  // Add a ref to the form container
  const formContainerRef = useRef<HTMLDivElement>(null);
  // Add a new ref for the whiteboard container
  const summaryContainerRef = useRef<HTMLDivElement>(null);

  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (formContainerRef.current) {
      const { offsetWidth, offsetHeight } = formContainerRef.current;
      setContainerDims({ width: offsetWidth, height: offsetHeight });
    }
  }, [step]); // update when step changes

  useEffect(() => {
    const storedUserId = localStorage.getItem("auth_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setFile(file);
    }
  };

  const handleMultipleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setFiles: React.Dispatch<React.SetStateAction<File[]>>) => {
    const files = Array.from(event.target.files || []);
    setFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleRemoveCourse = (index: number) => {
    setRelevantCourses(relevantCourses.filter((_, i) => i !== index));
  };

  const handleAddCertification = () => {
    if (currentCertificationTitle.trim() !== "" && currentCertificationIssuer.trim() !== "") {
      setAddedItems([
        ...addedItems,
        {
          type: currentType,
          title: currentCertificationTitle.trim(),
          issuer: currentCertificationIssuer.trim(),
          verificationLink: currentVerificationLink.trim(),
        },
      ]);
      setCurrentCertificationTitle("");
      setCurrentCertificationIssuer("");
      setCurrentVerificationLink("");
      setCurrentType("certification");
    }
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleAddOnlineCourse = () => {
    if (currentOnlineCourseName.trim() !== "" && currentOnlineCourseIssuer.trim() !== "") {
      setAddedItems([
        ...addedItems,
        {
          type: "onlineCourse",
          name: currentOnlineCourseName.trim(),
          issuer: currentOnlineCourseIssuer.trim(),
        },
      ]);
      setCurrentOnlineCourseName("");
      setCurrentOnlineCourseIssuer("");
    }
  };

  const handleRemoveOnlineCourse = (index: number) => {
    setOnlineCourses(onlineCourses.filter((_, i) => i !== index));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...addedItems];
    newItems.splice(index, 1);
    setAddedItems(newItems);
  };

  const handleEditItem = (index: number) => {
    const item = addedItems[index];
    setSelectedItemIndex(index);
    if (item.type === "certification" || item.type === "onlineCourse") {
      setCurrentType(item.type);
      setCurrentCertificationTitle(item.title || "");
      setCurrentCertificationIssuer(item.issuer);
      setCurrentVerificationLink(item.verificationLink || "");
    }
  };

  const handleUpdateItem = () => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...addedItems];
      updatedItems[selectedItemIndex] = {
        type: currentType,
        title: currentCertificationTitle.trim(),
        issuer: currentCertificationIssuer.trim(),
        verificationLink: currentVerificationLink.trim(),
      };
      setAddedItems(updatedItems);
      setSelectedItemIndex(null);
      setCurrentCertificationTitle("");
      setCurrentCertificationIssuer("");
      setCurrentVerificationLink("");
    }
  };

  const toggleVerificationLinkInput = () => {
    setShowVerificationLinkInput(!showVerificationLinkInput);
  };

  // Add missing handleAddWorkExperience function
  const handleAddWorkExperience = () => {
    if (
      workExperienceCompany.trim() !== "" &&
      workExperienceTitle.trim() !== "" &&
      workExperienceDescription.trim() !== ""
    ) {
      setAddedWorkExperiences([
        ...addedWorkExperiences,
        {
          company: workExperienceCompany.trim(),
          title: workExperienceTitle.trim(),
          description: workExperienceDescription.trim(),
        },
      ]);
      setWorkExperienceCompany("");
      setWorkExperienceTitle("");
      setWorkExperienceDescription("");
    }
  };

  const handleAddProject = () => {
    if (projectFile) {
      setAddedProjects([
        ...addedProjects,
        {
          file: projectFile,
          description: projectDescription.trim(),
        },
      ]);
      setProjectFile(null);
      setProjectDescription("");
    }
  };

  const handleRemoveProject = (index: number) => {
    const newProjects = [...addedProjects];
    newProjects.splice(index, 1);
    setAddedProjects(newProjects);
  };

  const handleEditProject = (index: number) => {
    const item = addedProjects[index];
    setProjectFile(item.file);
    setProjectDescription(item.description);
  };

  // Add this helper function at the top of the component (after state declarations, for example)
  const margin = 50;
  const getSafePosition = (pos: number, containerSize: number, totalSize: number) =>
    Math.min(Math.max(pos, containerSize / 2 + margin), totalSize - containerSize / 2 - margin);

  // Add this new helper function (e.g., after togglePreferredLearningMethod)
  const handleAddCourse = () => {
    if (currentCourse.trim() !== "") {
      setRelevantCourses([...relevantCourses, currentCourse.trim()]);
      setCurrentCourse("");
    }
  };

  // Add new state near other state declarations
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Initialize canvas and nodes
  useEffect(() => {
    const canvas = document.getElementById("networkCanvas");
    if (!canvas) return;
    const ctx = (canvas as HTMLCanvasElement).getContext("2d");
    (canvas as HTMLCanvasElement).width = window.innerWidth;
    (canvas as HTMLCanvasElement).height = window.innerHeight;

    // Increase the number of nodes from 25 to 30
    const generatedNodes = Array.from({ length: 35 }, (_, index) => ({
      id: index,
      x: Math.random() * (canvas as HTMLCanvasElement).width,
      y: Math.random() * (canvas as HTMLCanvasElement).height,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
      size: 4, // Initial size
      connectedTo: [] as number[],
      isStatic: false,
    }));

    function updateConnections() {
      for (let i = 0; i < generatedNodes.length; i++) {
        generatedNodes[i].connectedTo = [];
        for (let j = 0; j < generatedNodes.length; j++) {
          if (i !== j) {
            const dist = Math.hypot(
              generatedNodes[i].x - generatedNodes[j].x,
              generatedNodes[i].y - generatedNodes[j].y
            );
            if (dist < 250) {
              generatedNodes[i].connectedTo.push(j);
            }
          }
        }
      }
    }

    updateConnections();
    setNodes(generatedNodes);

    function drawNetwork() {
      if (ctx) {
        if (ctx && canvas) {
          ctx.clearRect(0, 0, (canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height);
        }
      }

      generatedNodes.forEach((node) => {
        if (!ctx) return;
        ctx.fillStyle = "rgba(147, 112, 219, 0.8)";
        ctx.beginPath();

        // Draw hexagon
        const numberOfSides = 8;
        const size = node.size;
        ctx.moveTo(node.x + size * Math.cos(0), node.y + size * Math.sin(0));
        for (let i = 1; i <= numberOfSides; i++) {
          ctx.lineTo(node.x + size * Math.cos(i * 2 * Math.PI / numberOfSides), node.y + size * Math.sin(i * 2 * Math.PI / numberOfSides));
        }

        ctx.closePath();
        ctx.fill();

        if (!node.isStatic) {
          node.x += node.vx;
          node.y += node.vy;
          if (canvas) {
            if (node.x < 0 || node.x > (canvas as HTMLCanvasElement).width) node.vx *= -1;
            if (node.y < 0 || node.y > (canvas as HTMLCanvasElement).height) node.vy *= -1;
          }
        }
      });

      for (let i = 0; i < generatedNodes.length; i++) {
        for (const j of generatedNodes[i].connectedTo) {
          const dist = Math.hypot(
            generatedNodes[i].x - generatedNodes[j].x,
            generatedNodes[i].y - generatedNodes[j].y
          );
          if (dist < 250) {
            if (ctx) {
              ctx.strokeStyle = `rgba(147, 112, 219, ${1 - dist / 250})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(generatedNodes[i].x, generatedNodes[i].y);
              ctx.lineTo(generatedNodes[j].x, generatedNodes[j].y);
              ctx.stroke();
            }
          }
        }
      }

      updateConnections();
      requestAnimationFrame(drawNetwork);
    }

    drawNetwork();

    const handleResize = () => {
      (canvas as HTMLCanvasElement).width = window.innerWidth;
      (canvas as HTMLCanvasElement).height = window.innerHeight;
      updateConnections();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // When no node is expanded and no animation is running, select the closest node to the center
  useEffect(() => {
    // Only expand a node if we're still before step 7
    if (!expandedNode && !isAnimating && nodes.length && step < 7 && formVisible && !hasAutoExpanded) {
      const closestNode = nodes.reduce(
        (closest: { id: number; dist: number }, node: Node) => {
          const distToCenter = Math.hypot(
            node.x - window.innerWidth / 2,
            node.y - window.innerHeight / 2
          );
          return distToCenter < closest.dist
            ? { id: node.id, dist: distToCenter }
            : closest;
        },
        { id: -1, dist: Infinity }
      );

      const selectedNode = nodes.find((node) => node.id === closestNode.id);
      if (selectedNode) {
        nodes.forEach((node) => (node.isStatic = false));
        selectedNode.isStatic = true;
        setIsAnimating(true);
        gsap.to(selectedNode, {
          size: calculateNodeSize(), // Use new function for size
          x: getSafePosition(selectedNode.x, containerDims.width, window.innerWidth),
          y: getSafePosition(selectedNode.y, containerDims.height, window.innerHeight),
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => setNodes([...nodes]),
          onComplete: () => {
            setExpandedNode(selectedNode.id);
            setIsAnimating(false);
            setHasAutoExpanded(true); // prevent further auto expansions this step
          },
        });
      }
    }
  }, [nodes, expandedNode, isAnimating, step, formVisible, hasAutoExpanded]);

  // Reset auto expansion flag when step changes
  useEffect(() => {
    setHasAutoExpanded(false);
  }, [step]);

  // Replace the calculateNodeSize function with this manual version:
  const manualSizes: { [key: number]: number } = {
    1: 350, // Increased size for step 1
    2: 550,
    3: 350,
    4: 350,
    5: 350,
    6: 350,
    7: 350,
  };

  const calculateNodeSize = () => {
    return manualSizes[step] || 100;
  };

  // When the form is submitted, animate the current node to shrink, then animate the next node.
  const handleSubmit = () => {
    if (isAnimating) return;

    gsap.to("#formContainer", {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        setFormVisible(false);
        const shrinkingNode = nodes.find((node) => node.id === expandedNode);
        if (shrinkingNode) {
          setIsAnimating(true);
          gsap.to(shrinkingNode, {
            size: 4,
            duration: 1,
            ease: "power2.inOut",
            onUpdate: () => setNodes([...nodes]),
            onComplete: () => {
              shrinkingNode.isStatic = false;
              setExpandedNode(null);
              const nextNodeId = shrinkingNode.connectedTo.find(
                (id) => {
                  const node = nodes.find((n) => n.id === id);
                  return node ? !node.isStatic : false;
                }
              );
              const nextNode = nodes.find((node) => node.id === nextNodeId);
              if (nextNode) {
                nodes.forEach((node) => (node.isStatic = false));
                nextNode.isStatic = true;
                setExpandedNode(nextNode.id);
                setFormVisible(true);
                setStep(step + 1);
                gsap.to(nextNode, {
                  x: getSafePosition(nextNode.x, containerDims.width, window.innerWidth),
                  y: getSafePosition(nextNode.y, containerDims.height, window.innerHeight),
                  size: calculateNodeSize(),
                  duration: 1.5,
                  ease: "power2.inOut",
                  onUpdate: () => setNodes([...nodes]),
                  onComplete: () => setIsAnimating(false),
                });
              } else {
                setIsAnimating(false);
              }
            },
          });
        }
      },
    });
  };

  const router = useRouter();

  // Add a new helper function near other helper functions:
  const positionNodesForSummary = () => {
    const centerX = window.innerWidth / 2;
    const rectWidth = 900;
    const rectHeight = 800;
    const nodesInRectangle = nodes.slice(0, 20);
    nodesInRectangle.forEach((node, index) => {
        node.isStatic = true;
        let x, y;
        if (index < 5) {
            x = centerX - rectWidth / 2 + (index % 5) * (rectWidth / 5);
            y = window.innerHeight - rectHeight;
        } else {
            x = index % 2 === 0 ? centerX - rectWidth / 2 : centerX + rectWidth / 2;
            y = window.innerHeight - rectHeight + (index % 10) * (rectHeight / 10);
        }
        gsap.to(node, {
            x,
            y,
            duration: 1,
            ease: "power2.inOut",
            onUpdate: () => setNodes([...nodes]),
        });
    });
};

// Modify createRectangleWithNodes:
const createRectangleWithNodes = () => {
    const centerX = window.innerWidth / 2;
    const rectWidth = 900; // For summary form
    const rectHeight = 800;
    
    // --- Removed rectangle formation code here ---
    // const nodesInRectangle = nodes.slice(0, 20);
    // nodesInRectangle.forEach(...);
    
    // Directly create the search bar container:
    setTimeout(() => {
      const searchBarContainer = document.createElement('div');
      searchBarContainer.style.position = 'absolute';
      searchBarContainer.style.left = `${centerX - 300}px`;
      searchBarContainer.style.top = '50px';
      searchBarContainer.style.width = '600px';
      searchBarContainer.style.height = '50px';
      searchBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      searchBarContainer.style.borderRadius = '25px';
      searchBarContainer.style.padding = '10px';
      searchBarContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
      searchBarContainer.style.zIndex = '1000';
      searchBarContainer.style.opacity = '0';
  
      searchBarContainer.innerHTML = `
        <div class="flex items-center w-full h-full">
          <input type="text" id="learningGoalsInput" class="flex-grow h-full px-3 py-2 bg-transparent text-white placeholder-gray-400 rounded-md focus:outline-none" placeholder="Learning Goals..." />
          <button id="searchBarButton" class="ml-2 p-2 bg-purple-500 hover:bg-purple-600 rounded-full">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(searchBarContainer);
      const searchBarNodes = nodes.slice(20, 30);
      searchBarNodes.forEach((node, index) => {
        let x, y;
        if (index < 3) {
          x = centerX - 300 + (index % 3) * (600 / 3);
          y = 50;
        } else if (index < 6) {
          x = centerX - 300 + ((index - 3) % 3) * (600 / 3);
          y = 100;
        } else if (index < 8) {
          x = centerX - 300;
          y = 50 + ((index - 6) % 2) * 50;
        } else {
          x = centerX + 300;
          y = 50 + ((index - 8) % 2) * 50;
        }
        gsap.to(node, {
          x,
          y,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => setNodes([...nodes]),
          onComplete: () => {
            gsap.to(searchBarContainer, { opacity: 1, duration: 1 });
          },
        });
      });
  
      const learningGoalsInput = document.getElementById('learningGoalsInput');
      const searchBarButton = document.getElementById('searchBarButton');
      let intervalId: NodeJS.Timeout;
      learningGoalsInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const text = (learningGoalsInput as HTMLInputElement).value.trim();
          if (text) {
            // Update learningGoals state
            setLearningGoals(prev => [...prev, text]);
            const availableNode = nodes.find(node => !node.isStatic && !node.textPinned);
            if (availableNode) {
              availableNode.textPinned = true;
              gsap.to(availableNode, {
                width: 100,
                height: 100,
                duration: 1,
                ease: "power2.inOut",
                onUpdate: () => setNodes([...nodes]),
                onComplete: () => {
                  const textContainer = document.createElement('div');
                  // Add class for later removal
                  textContainer.classList.add("learning-goals-tag");
                  textContainer.style.position = 'absolute';
                  textContainer.style.left = `${availableNode.x}px`;
                  textContainer.style.top = `${availableNode.y}px`;
                  textContainer.style.transform = 'translate(-50%, -50%)';
                  textContainer.style.color = 'white';
                  textContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  textContainer.style.padding = '10px';
                  textContainer.style.borderRadius = '10px';
                  textContainer.style.zIndex = '1000';
                  textContainer.innerText = text;
                  document.body.appendChild(textContainer);
                  gsap.fromTo(textContainer, { opacity: 0 }, { opacity: 1, duration: 1 });
                  (learningGoalsInput as HTMLInputElement).value = '';
                  const updateTextPosition = () => {
                    textContainer.style.left = `${availableNode.x}px`;
                    textContainer.style.top = `${availableNode.y}px`;
                  };
                  intervalId = setInterval(updateTextPosition, 16);
                },
              });
            }
          }
        }
      });
  
      searchBarButton?.addEventListener('click', async () => {
        clearInterval(intervalId);
        // Remove all learning goals tag elements
        document.querySelectorAll('.learning-goals-tag').forEach(tag => tag.remove());
        gsap.to(searchBarContainer, {
          opacity: 0,
          duration: 1,
          onComplete: () => {
            document.body.removeChild(searchBarContainer);
            // Position nodes in a rectangle then display the summary form
            positionNodesForSummary();
            setTimeout(() => {
              const infoContainer = document.createElement('div');
              infoContainer.style.position = 'absolute';
              infoContainer.style.left = `${centerX - rectWidth / 2}px`;
              infoContainer.style.top = `${window.innerHeight - rectHeight}px`;
              infoContainer.style.width = `${rectWidth}px`;
              infoContainer.style.height = `${rectHeight}px`;
              infoContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              infoContainer.style.borderRadius = '10px';
              infoContainer.style.padding = '20px';
              infoContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
              infoContainer.style.overflowY = 'auto';
              infoContainer.style.zIndex = '1000';
              infoContainer.innerHTML = `
                <h2 class="text-black text-center text-2xl font-bold mb-6">Final Summary</h2>
                <!-- Personal Info -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Full Name:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${username || "Not provided"}" readonly />
                </div>
                <!-- Documents -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Resume:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${resumeFile ? resumeFile.name : "Not provided"}" readonly />
                </div>
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Transcripts:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${
                    transcriptFiles.length ? transcriptFiles.map(file => file.name).join(', ') : "Not provided"
                  }" readonly />
                </div>
                <!-- Academic Info -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">University / College:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${university || "Not provided"}" readonly />
                </div>
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Degree:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${degree || "Not provided"}" readonly />
                </div>
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Field of Study:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${fieldOfStudy || "Not provided"}" readonly />
                </div>
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Relevant Courses:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${
                    relevantCourses.length ? relevantCourses.join(', ') : "Not provided"
                  }" readonly />
                </div>
                <!-- Certifications / Online Courses -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Certifications/Online Courses:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${
                    addedItems.length ? addedItems.map(item => item.title || "N/A").join(', ') : "Not provided"
                  }" readonly />
                </div>
                <!-- Work Experience -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Work Experience:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${
                    addedWorkExperiences.length ? addedWorkExperiences.map(exp => exp.title).join(', ') : "Not provided"
                  }" readonly />
                </div>
                <!-- Project -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Project File:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${projectFile ? projectFile.name : "Not provided"}" readonly />
                </div>
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Project Description:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${projectDescription || "Not provided"}" readonly />
                </div>
                <!-- Learning Preferences -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Preferred Learning Pace:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${preferredLearningPace || "Not provided"}" readonly />
                </div>
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Learning Commitment Level:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${learningCommitment || "Not provided"}" readonly />
                </div>
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Preferred Learning Methods:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${
                    preferredLearningMethods.length ? preferredLearningMethods.join(', ') : "Not provided"
                  }" readonly />
                </div>
                <!-- Learning Goals -->
                <div class="mb-4">
                  <label class="text-black font-bold text-xl">Learning Goals:</label>
                  <input type="text" class="w-full px-3 py-2 rounded" value="${
                    learningGoals.length ? learningGoals.join(', ') : "Not provided"
                  }" readonly />
                </div>
                <button class="mt-6 bg-purple-500 text-white px-5 py-2 rounded">Save</button>
              `;
              document.body.appendChild(infoContainer);
              gsap.fromTo(infoContainer, { opacity: 0 }, { opacity: 1, duration: 1 });
              infoContainer.querySelector('button')?.addEventListener('click', () => {
                // ...handle save and animate nodes back...
              });
            }, 1000);
          }
        });
      });
  
      const preventNodeOverlap = () => {
        nodes.forEach(node => {
          if (node.size > 4) {
            if (
              node.x > centerX - 300 &&
              node.x < centerX + 300 &&
              node.y > 50 &&
              node.y < 100
            ) {
              node.vx *= -1;
              node.vy *= -1;
            }
          }
        });
      };
      setInterval(preventNodeOverlap, 16);
    }, 2000);
};

  // Update the handleFinishStep7 function to call createRectangleWithNodes after 3 seconds
  const handleFinishStep7 = () => {
    if (!expandedNode) return;
    gsap.to("#formContainer", {
      duration: 0.5,
      opacity: 0,
      y: -50, // slight upward movement for fade-out effect
      scale: 0.7,
      onComplete: () => {
        const shrinkingNode = nodes.find((node) => node.id === expandedNode);
        if (shrinkingNode) {
          setIsAnimating(true);
          gsap.to(shrinkingNode, {
            size: 4,
            duration: 0.5,
            ease: "power2.inOut",
            onUpdate: () => setNodes([...nodes]),
            onComplete: () => {
              shrinkingNode.isStatic = false;
              setExpandedNode(null);
              setIsAnimating(false);
              setStep(8);
              setTimeout(() => {
                nodes.forEach((node) => {
                  gsap.to(node, {
                    size: 4,
                    duration: 0.5,
                    ease: "power2.inOut",
                    onUpdate: () => setNodes([...nodes]),
                  });
                });
                setTimeout(createRectangleWithNodes, 3000); // Call the function after 3 seconds
              }, 3000);
            },
          });
        } else {
          setStep(8);
          setTimeout(() => {
            nodes.forEach((node) => {
              gsap.to(node, {
                size: 4,
                duration: 0.5,
                ease: "power2.inOut",
                onUpdate: () => setNodes([...nodes]),
              });
            });
            setTimeout(createRectangleWithNodes, 3000); // Call the function after 3 seconds
          }, 3000);
        }
      },
    });
  };

  // Animate summary whiteboard when step becomes 8
  useEffect(() => {
    if (step === 8 && summaryContainerRef.current) {
      gsap.fromTo(
        summaryContainerRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.5 }
      );
    }
  }, [step]);

  const handleRemoveFile = (index: number, fileType: string) => {
    if (fileType === "resume") {
      setResumeFile(null);
    } else if (fileType === "transcript") {
      setTranscriptFiles(transcriptFiles.filter((_, i) => i !== index));
    }
  };

  const handleEditDegree = (index: number) => {
    const item = addedDegrees[index];
    setUniversity(item.university);
    setDegree(item.degree);
    setFieldOfStudy(item.fieldOfStudy);
    setRelevantCourses(item.relevantCourses);
  };

  const handleEditWorkExperience = (index: number) => {
    const item = addedWorkExperiences[index];
    setWorkExperienceCompany(item.company);
    setWorkExperienceTitle(item.title);
    setWorkExperienceDescription(item.description);
  };

  const handleRemoveWorkExperience = (index: number) => {
    const newWorkExperiences = [...addedWorkExperiences];
    newWorkExperiences.splice(index, 1);
    setAddedWorkExperiences(newWorkExperiences);
  };

  const togglePreferredLearningMethod = (method: string) => {
    setPreferredLearningMethods((prevMethods) =>
      prevMethods.includes(method)
        ? prevMethods.filter((m) => m !== method)
        : [...prevMethods, method]
    );
  };

  // Add new state for form errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Create a helper function to validate required fields per step
  const validateStep = (): boolean => {
    let errors: { [key: string]: string } = {};

    // Step 2: Full Name and Username required
    if (step === 2) {
      // Assume the Full Name input value is stored in a ref or state; if not, use DOM lookup.
      if (!username.trim()) {
        errors.username = "Username is required";
      }
      // For example, if you store full name value in a variable 'fullName'
      const fullNameInput = (document.querySelector('input[placeholder="Enter your Full Name"]') as HTMLInputElement)?.value;
      if (!fullNameInput || !fullNameInput.trim()) {
        errors.fullName = "Full Name is required";
      }
    }

    // Step 3: Degree and Field of Study required
    if (step === 3) {
      if (!degree.trim()) {
        errors.degree = "Degree is required";
      }
      if (!fieldOfStudy.trim()) {
        errors.fieldOfStudy = "Field of Study is required";
      }
    }

    // Step 4: At least one Certification or Online Course is required
    if (step === 4 && addedItems.length === 0) {
      errors.certifications = "At least one certification or online course is required";
    }

    // Step 5: Work Experience required
    if (step === 5 && addedWorkExperiences.length === 0) {
      errors.workExperience = "Work Experience is required";
    }

    // Step 7: Learning Goals required
    if (step === 7 && learningGoals.length === 0) {
      errors.learningGoals = "Learning Goals are required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Wrap existing handleSubmit to first validate required fields
  const handleSubmitWrapper = () => {
    if (validateStep()) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black">
      <canvas id="networkCanvas" className="w-full h-full"></canvas>
      {expandedNode !== null && formVisible && (
        <div
          ref={formContainerRef}
          id="formContainer"
          className="absolute flex flex-col items-center justify-center"
          style={{
            left:
              nodes[expandedNode]?.x !== undefined
                ? Math.min(
                    Math.max(nodes[expandedNode].x, containerDims.width / 2 + 50),
                    window.innerWidth - containerDims.width / 2 - 50
                  )
                : 0,
            top:
              nodes[expandedNode]?.y !== undefined
                ? Math.min(
                    Math.max(nodes[expandedNode].y, containerDims.height / 2 + 50),
                    window.innerHeight - containerDims.height / 2 - 50
                  )
                : 0,
            transform: "translate(-50%, -50%)",
            opacity: isAnimating ? 0 : 1,
          }}
        >
          {step === 1 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Upload Your Resume (Optional):
              </label>
              <input
                type="file"
                id="resumeInput"
                style={{ display: "none" }}
                onChange={(e) => handleFileUpload(e, setResumeFile)}
              />
              <button
                onClick={() => document.getElementById("resumeInput")?.click()}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "280px", height: "40px" }}
              >
                <FaUpload className="mr-2" /> Upload Your Resume
              </button>

              <label className="text-white mb-6 block text-center font-bold text-xl">
                Upload Your Academic Transcripts (Optional):
              </label>
              <input
                type="file"
                id="transcriptInput"
                style={{ display: "none" }}
                multiple // Allow multiple files
                onChange={(e) => handleMultipleFileUpload(e, setTranscriptFiles)}
              />
              <button
                onClick={() => document.getElementById("transcriptInput")?.click()}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "280px", height: "40px" }}
              >
                <FaUpload className="mr-2" /> Upload Your Transcripts
              </button>

              <label className="text-white mb-6 block text-center font-bold text-xl">
                Import from LinkedIn (Optional):
              </label>
              <button
                onClick={() => alert("LinkedIn data imported")}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "280px", height: "40px" }}
              >
                <FaLinkedin className="mr-2" /> Import from LinkedIn
              </button>

              <div className="flex justify-around w-full">
                <button
                  onClick={handleSubmitWrapper}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-full"
                  style={{ width: "130px", height: "40px" }}
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmitWrapper}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-full"
                  style={{ width: "130px", height: "40px" }}
                >
                  Continue
                </button>
              </div>
              <div className="mt-4 text-white">
                Uploaded Files:
                <div className="max-h-32 overflow-y-auto bg-gray-900 p-2 rounded" style={{ width: "280px" }}>
                  {resumeFile && (
                    <div
                      className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between"
                      style={{ wordBreak: "break-all" }}
                    >
                      <span>{resumeFile.name} (Resume)</span>
                      <button
                        onClick={() => handleRemoveFile(0, "resume")}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {transcriptFiles.length > 0 &&
                    transcriptFiles.map((file, index) => (
                      <div
                        key={index}
                        className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between"
                        style={{ wordBreak: "break-all" }}
                      >
                        <span>{file.name} (Transcript)</span>
                        <button
                          onClick={() => handleRemoveFile(index, "transcript")}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : step === 2 ? (
            <>
              <label className="text-white mb-2 block text-center font-bold text-xl">
                Full Name:
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Enter your full legal name as it appears on official documents."
                >
                  &#9432;
                </span>
              </label>
              <input
                type="text"
                placeholder="Enter your Full Name"
                className="px-6 py-3 rounded bg-white text-black text-center mb-1"
                style={{ width: "300px" }}
              />
              {formErrors.fullName && <p className="text-red-500 text-sm text-center">{formErrors.fullName}</p>}

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Username:
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Choose a unique username for your profile. It will be visible to other users."
                >
                  &#9432;
                </span>
              </label>
              <input
                type="text"
                placeholder="Enter your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-1"
                style={{ width: "300px" }}
              />
              {formErrors.username && <p className="text-red-500 text-sm text-center">{formErrors.username}</p>}

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Date of Birth:
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="This helps us provide age-appropriate content and recommendations."
                >
                  &#9432;
                </span>
              </label>
              <input
                type="date"
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Current Status:
              </label>
              <select
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
              >
                <option>Student (High School / University)</option>
                <option>Recent Graduate</option>
                <option>Working Professional</option>
                <option>Freelancer</option>
                <option>Entrepreneur</option>
                <option>Unemployed (Looking for Opportunities)</option>
                <option>Other</option>
              </select>
              {currentStatus === "Other" && (
                <input
                  type="text"
                  placeholder="Enter your status"
                  className="px-6 py-3 rounded bg-white text-black text-center mt-2"
                  style={{ width: "300px" }}
                />
              )}

              <button
                onClick={handleSubmitWrapper}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 3 ? (
            <>
              <label className="text-white mb-2 block text-center font-bold text-xl">
                University Name(s):
              </label>
              <input
                type="text"
                placeholder="Enter University Name(s)"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Degree:
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Select the highest degree you have completed or are currently pursuing."
                >
                  &#9432;
                </span>
              </label>
              <select
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
              >
                <option>High School</option>
                <option>Bachelor’s</option>
                <option>Master’s</option>
                <option>PhD</option>
                <option>Diploma</option>
              </select>
              {formErrors.degree && <p className="text-red-500 text-sm text-center">{formErrors.degree}</p>}

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Field of Study (Degree In):
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Specify your major or primary field of study. E.g., Computer Science, Business Administration."
                >
                  &#9432;
                </span>
              </label>
              <input
                type="text"
                placeholder="Enter Field of Study"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />
              {formErrors.fieldOfStudy && <p className="text-red-500 text-sm text-center">{formErrors.fieldOfStudy}</p>}

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Relevant Courses Completed:
              </label>
              <div
                className="flex items-center px-3 py-2 bg-gray-100 text-black rounded overflow-hidden"
                style={{ width: "300px", minHeight: "50px" }}
              >
                {relevantCourses.map((course, index) => (
                  <div
                    key={index}
                    className="flex items-center px-4 py-1 bg-purple-600 text-white rounded-full mr-2"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {course}
                    <button
                      onClick={() => handleRemoveCourse(index)}
                      className="ml-2 text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={currentCourse}
                  placeholder="Add a course"
                  onChange={(e) => setCurrentCourse(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCourse()}
                  className="flex-grow text-black bg-transparent focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddDegree}
                className="mt-2 bg-white text-black px-4 py-2 rounded"
              >
                Add Degree
              </button>

              <div className="mt-4 text-white">
                Added Degrees:
                <div className="max-h-48 overflow-y-auto bg-gray-900 p-2 rounded" style={{ width: "300px" }}>
                  {addedDegrees.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between"
                      style={{ wordBreak: "break-all", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEditDegree(index)}
                      >
                        {item.university}
                      </span>
                      <button
                        onClick={() => handleRemoveDegree(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmitWrapper}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 4 ? (
            <>
              <label className="text-white mb-4 block text-center font-bold text-lg">
                Type:
              </label>
              <select
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
                value={currentType}
                onChange={(e) => setCurrentType(e.target.value)}
              >
                <option value="certification">Certification</option>
                <option value="onlineCourse">Online Course</option>
              </select>

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Title:
              </label>
              <input
                type="text"
                placeholder={currentType === "certification" ? "Certification Name" : "Course Name"}
                value={currentCertificationTitle}
                onChange={(e) => setCurrentCertificationTitle(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Issuer:
              </label>
              <input
                type="text"
                placeholder={currentType === "certification" ? "Issued By (Organization)" : "Platform (Website)"}
                value={currentCertificationIssuer}
                onChange={(e) => setCurrentCertificationIssuer(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <button
                onClick={handleAddCertification}
                className="mt-2 bg-white text-black px-4 py-2 rounded"
              >
                Add Item
              </button>

              <div className="mt-4 text-white">
                Added Items:
                <div className="max-h-48 overflow-y-auto bg-gray-900 p-2 rounded" style={{ width: "300px" }}>
                  {addedItems.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between"
                      style={{ wordBreak: "break-all", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onClick={() => handleEditItem(index)}
                    >
                      <span>
                        {item.type === "certification"
                          ? `${item.title} (Certification)`
                          : `${item.title} (Online Course)`}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {formErrors.certifications && <p className="text-red-500 text-sm text-center">{formErrors.certifications}</p>}

              <button
                onClick={handleSubmitWrapper}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 5 ? (
            <>
              <label className="text-white mb-4 block text-center font-bold text-lg">
                Company:
              </label>
              <input
                type="text"
                placeholder="Company Name"
                value={workExperienceCompany}
                onChange={(e) => setWorkExperienceCompany(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Title:
              </label>
              <input
                type="text"
                placeholder="Title"
                value={workExperienceTitle}
                onChange={(e) => setWorkExperienceTitle(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Description:
              </label>
              <textarea
                placeholder="Description"
                value={workExperienceDescription}
                onChange={(e) => setWorkExperienceDescription(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px", height: "100px" }}
              />

              <button
                onClick={handleAddWorkExperience}
                className="mt-2 bg-white text-black px-4 py-2 rounded"
              >
                Add Work Experience
              </button>

              <div className="mt-4 text-white">
                Added Work Experiences:
                <div className="max-h-48 overflow-y-auto bg-gray-900 p-2 rounded" style={{ width: "300px" }}>
                  {addedWorkExperiences.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between"
                      style={{ wordBreak: "break-all", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                    <span
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEditWorkExperience(index)}
                      >
                        {item.company} - {item.title}
                      </span>
                      <button
                        onClick={() => handleRemoveWorkExperience(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {formErrors.workExperience && <p className="text-red-500 text-sm text-center">{formErrors.workExperience}</p>}

              <button
                onClick={handleSubmitWrapper}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 6 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Project File:
              </label>
              <input
                type="file"
                id="projectInput"
                style={{ display: "none" }}
                onChange={(e) => handleFileUpload(e, setProjectFile)}
              />
              <button
                onClick={() => document.getElementById("projectInput")?.click()}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "280px", height: "40px" }}
              >
                <FaUpload className="mr-2" /> Upload Project
              </button>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Project Description:
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Describe your project’s objective, technologies used, and outcomes."
                >
                  &#9432;
                </span>
              </label>
              <textarea
                placeholder="Enter your project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px", height: "150px" }}
              />

              <button
                onClick={handleAddProject}
                className="mt-2 bg-white text-black px-4 py-2 rounded"
              >
                Add Project
              </button>

              <div className="mt-4 text-white">
                Added Projects:
                <div className="max-h-48 overflow-y-auto bg-gray-900 p-2 rounded" style={{ width: "300px" }}>
                  {addedProjects.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between"
                      style={{ wordBreak: "break-all", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEditProject(index)}
                      >
                        {item.file.name}
                      </span>
                      <button
                        onClick={() => handleRemoveProject(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-around w-full">
                <button
                  onClick={handleSubmitWrapper}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-full"
                  style={{ width: "130px", height: "40px" }}
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmitWrapper}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-full"
                  style={{ width: "130px", height: "40px" }}
                >
                  Continue
                </button>
              </div>
            </>
          ) : step === 7 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Preferred Learning Pace:
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Choose a pace that matches your availability and learning style."
                >
                  &#9432;
                </span>
              </label>
              <select
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
                value={preferredLearningPace}
                onChange={(e) => setPreferredLearningPace(e.target.value)}
              >
                <option value="">Select Learning Pace</option>
                <option value="Fast-Paced">Fast-Paced</option>
                <option value="Medium-Paced">Medium-Paced</option>
                <option value="Slow-Paced">Slow-Paced</option>
              </select>

              <label className="text-white mb-6 block text-center font-bold text-xl">
                Learning Commitment Level:
                <span
                  className="ml-2 text-blue-300 cursor-help"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Estimate how many hours you can dedicate weekly to learning."
                >
                  &#9432;
                </span>
              </label>
              <select
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
                value={learningCommitment}
                onChange={(e) => setLearningCommitment(e.target.value)}
              >
                <option value="">Select Commitment Level</option>
                <option value="Casual">Casual</option>
                <option value="Moderate">Moderate</option>
                <option value="Intensive">Intensive</option>
              </select>

              <button
                onClick={handleSubmitWrapper}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 8 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Preferred Learning Methods:
              </label>
              <div className="flex flex-col space-y-2 mb-4" style={{ width: "300px" }}>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Video Tutorials & Lectures"
                    checked={preferredLearningMethods.includes("Video Tutorials & Lectures")}
                    onChange={(e) => togglePreferredLearningMethod(e.target.value)}
                    className="mr-2"
                  />
                  Video Tutorials & Lectures
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Text-Based Articles & PDFs"
                    checked={preferredLearningMethods.includes("Text-Based Articles & PDFs")}
                    onChange={(e) => togglePreferredLearningMethod(e.target.value)}
                    className="mr-2"
                  />
                  Text-Based Articles & PDFs
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Hands-on Projects & Case Studies"
                    checked={preferredLearningMethods.includes("Hands-on Projects & Case Studies")}
                    onChange={(e) => togglePreferredLearningMethod(e.target.value)}
                    className="mr-2"
                  />
                  Hands-on Projects & Case Studies
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Interactive Exercises & Quizzes"
                    checked={preferredLearningMethods.includes("Interactive Exercises & Quizzes")}
                    onChange={(e) => togglePreferredLearningMethod(e.target.value)}
                    className="mr-2"
                  />
                  Interactive Exercises & Quizzes
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="One-on-One Coaching or Mentorship"
                    checked={preferredLearningMethods.includes("One-on-One Coaching or Mentorship")}
                    onChange={(e) => togglePreferredLearningMethod(e.target.value)}
                    className="mr-2"
                  />
                  One-on-One Coaching or Mentorship
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Live Webinars & Group Discussions"
                    checked={preferredLearningMethods.includes("Live Webinars & Group Discussions")}
                    onChange={(e) => togglePreferredLearningMethod(e.target.value)}
                    className="mr-2"
                  />
                  Live Webinars & Group Discussions
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="Podcasts & Audio Lessons"
                    checked={preferredLearningMethods.includes("Podcasts & Audio Lessons")}
                    onChange={(e) => togglePreferredLearningMethod(e.target.value)}
                    className="mr-2"
                  />
                  Podcasts & Audio Lessons
                </label>
              </div>

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Would you like to take a short quiz to fine-tune recommendations?
              </label>
              <div className="flex flex-col space-y-2 mb-4" style={{ width: "300px" }}>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="quizOption"
                    value="yes"
                    className="mr-2"
                  />
                  Yes, let’s do it!
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="quizOption"
                    value="no"
                    className="mr-2"
                  />
                  No, skip for now
                </label>
              </div>

              <button
                onClick={handleFinishStep7} // changed from handleSubmit to handleFinishStep7
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : null }
        </div>
      )}
      {/* Render Tooltip component */}
      <Tooltip id="my-tooltip" place="top" effect="solid" />
    </div>
  );
}



