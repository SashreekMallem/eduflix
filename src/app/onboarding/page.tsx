"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { FaUpload, FaLinkedin } from "react-icons/fa";
import { useRouter } from 'next/navigation';

export default function NeuralNetworkBackground() {
  const [expandedNode, setExpandedNode] = useState<number | null>(null);
  interface Node {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
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
  const [workExperienceStart, setWorkExperienceStart] = useState(""); // New state for start date
  const [workExperienceEnd, setWorkExperienceEnd] = useState("");     // New state for end date
  interface WorkExperience {
    company: string;
    title: string;
    description: string;
    start_date: string; // New field for work experience start date
    end_date: string;   // New field for work experience end date
  }

  const [addedWorkExperiences, setAddedWorkExperiences] = useState<WorkExperience[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [projectLink, setProjectLink] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  interface Project {
    link: string;
    title: string;
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
  const [grade, setGrade] = useState(""); // New state for grade
  interface Degree {
    university: string;
    degree: string;
    field_of_study: string;
    relevant_courses: string[];
    grade: string; // Include grade in Degree interface
  }

  const [addedDegrees, setAddedDegrees] = useState<Degree[]>([]);
  const [proficiencyLevels, setProficiencyLevels] = useState({});
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [careerGoals, setCareerGoals] = useState<string[]>([]); // Add this line
  const [debugMessages, setDebugMessages] = useState<string[]>([]); // Add this line
  const [skills, setSkills] = useState<string[]>([]); // Add a new state for skills if not present
  // Add a ref for latest skills
  const skillsRef = useRef<string[]>(skills);

  // Update ref on skills change
  useEffect(() => {
    skillsRef.current = skills;
    console.log("Updated Skills:", skills); // logs updated skills
  }, [skills]);

  // Add a ref for careerGoals
  const careerGoalsRef = useRef<string[]>(careerGoals);

  // Update ref on careerGoals change
  useEffect(() => {
    careerGoalsRef.current = careerGoals;
    console.log("Updated Career Goals:", careerGoals);
  }, [careerGoals]);

  const handleAddDegree = () => {
    if (university && degree && fieldOfStudy) {
      setAddedDegrees([
        ...addedDegrees,
        {
          university,
          degree,
          field_of_study: fieldOfStudy,
          grade,                         // Include grade in added degree
          relevant_courses: relevantCourses,
        },
      ]);
      setUniversity("");
      setDegree("High School");
      setFieldOfStudy("");
      setRelevantCourses([]);
      setGrade(""); // Reset grade input
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
      workExperienceDescription.trim() !== "" &&
      workExperienceStart.trim() !== "" &&
      workExperienceEnd.trim() !== ""
    ) {
      setAddedWorkExperiences([
        ...addedWorkExperiences,
        {
          company: workExperienceCompany.trim(),
          title: workExperienceTitle.trim(),
          description: workExperienceDescription.trim(),
          start_date: workExperienceStart.trim(), // add start date
          end_date: workExperienceEnd.trim(),       // add end date
        },
      ]);
      setWorkExperienceCompany("");
      setWorkExperienceTitle("");
      setWorkExperienceDescription("");
      setWorkExperienceStart(""); // reset start date
      setWorkExperienceEnd("");   // reset end date
    }
  };

  const handleAddProject = () => {
    if (projectTitle.trim() !== "" && projectDescription.trim() !== "") {
      setAddedProjects([
        ...addedProjects,
        {
          title: projectTitle.trim(),
          description: projectDescription.trim(),
          link: projectLink.trim(),
        },
      ]);
      setProjectTitle("");
      setProjectDescription("");
      setProjectLink("");
    }
  };

  // Add this helper function at the top of the component (after state declarations, for example)
  const handleAddLearningGoal = (goal: string) => {
    setLearningGoals((prevGoals) => [...prevGoals, goal]);
  };

  const handleAddCareerGoal = (goal: string) => {
    setCareerGoals((prevGoals) => [...prevGoals, goal]);
  };

  const handleAddSkill = (skill: string) => {
    setSkills((prevSkills) => [...prevSkills, skill]);
  };

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
          <input type="text" id="learningGoalsInput" class="flex-grow h-full px-3 py-2 bg-transparent text-white placeholder-gray-400 rounded-md focus:outline-none" placeholder="Career Goals..." />
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
  
      // New flag to check if career goal has been entered
      let careerGoalEntered = false;
      
      const learningGoalsInput = document.getElementById('learningGoalsInput');
      const searchBarButton = document.getElementById('searchBarButton');
      let intervalId: NodeJS.Timeout;
      
      learningGoalsInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const text = (learningGoalsInput as HTMLInputElement).value.trim();
          if (text) {
            // If career goal not yet set, treat as career goal
            if (!careerGoalEntered) {
              // Pin the available node to center
              const availableNode = nodes.find(node => !node.isStatic && !node.textPinned);
              if (availableNode) {
                availableNode.textPinned = true;
                gsap.to(availableNode, {
                  x: centerX,
                  y: window.innerHeight / 2,
                  duration: 1,
                  ease: "power2.inOut",
                  onUpdate: () => setNodes([...nodes]),
                  onComplete: () => {
                    // Pin the node by zeroing its velocity and marking it static
                    availableNode.vx = 0;
                    availableNode.vy = 0;
                    availableNode.isStatic = true;
                    // Create and display career goal text container
                    const careerGoalContainer = document.createElement('div');
                    careerGoalContainer.classList.add("career-goals-tag");
                    careerGoalContainer.style.position = 'absolute';
                    careerGoalContainer.style.left = `${availableNode.x}px`;
                    careerGoalContainer.style.top = `${availableNode.y}px`;
                    careerGoalContainer.style.transform = 'translate(-50%, -50%)';
                    careerGoalContainer.style.color = 'white';
                    careerGoalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    careerGoalContainer.style.padding = '10px';
                    careerGoalContainer.style.borderRadius = '10px';
                    careerGoalContainer.style.zIndex = '1000';
                    careerGoalContainer.innerText = text;
                    document.body.appendChild(careerGoalContainer);
                  },
                });
              }
              // Save the career goal (if needed, e.g., via a separate state)
              handleAddCareerGoal(text);
              careerGoalEntered = true;
              // Change input placeholder for subsequent entries to "Learning Goals..."
              (learningGoalsInput as HTMLInputElement).placeholder = "Learning Goals...";
              (learningGoalsInput as HTMLInputElement).value = "";
            } else {
              // For subsequent entries, behave as before for learning goals
              handleAddLearningGoal(text);
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
                    // ...existing styling and positioning...
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
                    intervalId = setInterval(() => {
                      textContainer.style.left = `${availableNode.x}px`;
                      textContainer.style.top = `${availableNode.y}px`;
                    }, 16);
                  },
                });
              }
            }
          }
        }
      });
  
      searchBarButton?.addEventListener('click', async () => {
        clearInterval(intervalId);
        // Remove all career goals and learning goals tag elements
        document.querySelectorAll('.career-goals-tag, .learning-goals-tag').forEach(tag => tag.remove());
        gsap.to(searchBarContainer, {
          opacity: 0,
          duration: 1,
          onComplete: () => {
            document.body.removeChild(searchBarContainer);
            // Create new search bar container for collecting skills
            const skillsSearchContainer = document.createElement('div');
            skillsSearchContainer.style.position = 'absolute';
            skillsSearchContainer.style.left = `${centerX - 300}px`;
            skillsSearchContainer.style.top = '50px';
            skillsSearchContainer.style.width = '600px';
            skillsSearchContainer.style.height = '50px';
            skillsSearchContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            skillsSearchContainer.style.borderRadius = '25px';
            skillsSearchContainer.style.padding = '10px';
            skillsSearchContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
            skillsSearchContainer.style.zIndex = '1000';
            skillsSearchContainer.style.opacity = '0';
      
            skillsSearchContainer.innerHTML = `
              <div class="flex items-center w-full h-full">
                <input type="text" id="skillsInput" class="flex-grow h-full px-3 py-2 bg-transparent text-white placeholder-gray-400 rounded-md focus:outline-none" placeholder="Enter Skills..." />
                <button id="skillsSearchButton" class="ml-2 p-2 bg-purple-500 hover:bg-purple-600 rounded-full">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
              </div>
            `;
            document.body.appendChild(skillsSearchContainer);
            gsap.to(skillsSearchContainer, { opacity: 1, duration: 1 });
      
            // NEW: Add keydown listener for skills tagging
            const skillsInput = document.getElementById('skillsInput');
            skillsInput?.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const inputEl = skillsInput as HTMLInputElement;
                const text = inputEl.value.trim();
                if (text) {
                  // Update the skills state (same as learning goals logic)
                  setSkills(prevSkills => [...prevSkills, text]);
                  // Create and show a skills tag that follows the assigned node's position (or a new node at center)
                  let availableNode = nodes.find(node => !node.textPinned);
                  if (!availableNode) {
                    availableNode = {
                      id: nodes.length,
                      x: window.innerWidth / 2,
                      y: window.innerHeight / 2,
                      vx: 0,
                      vy: 0,
                      size: 4,
                      connectedTo: [],
                      isStatic: false,
                      textPinned: false,
                    };
                    nodes.push(availableNode);
                    setNodes([...nodes]);
                  }
                  availableNode.textPinned = true;
                  const skillsTagContainer = document.createElement('div');
                  skillsTagContainer.classList.add("skills-tag");
                  skillsTagContainer.style.position = 'absolute';
                  skillsTagContainer.style.left = `${availableNode.x}px`;
                  skillsTagContainer.style.top = `${availableNode.y}px`;
                  skillsTagContainer.style.transform = 'translate(-50%, -50%)';
                  skillsTagContainer.style.color = 'white';
                  skillsTagContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  skillsTagContainer.style.padding = '10px';
                  skillsTagContainer.style.borderRadius = '10px';
                  skillsTagContainer.style.zIndex = '1000';
                  skillsTagContainer.innerText = text;
                  document.body.appendChild(skillsTagContainer);
                  setInterval(() => {
                    skillsTagContainer.style.left = `${availableNode.x}px`;
                    skillsTagContainer.style.top = `${availableNode.y}px`;
                  }, 16);
                  inputEl.value = "";
                }
              }
            });
      
            const skillsSearchButton = document.getElementById('skillsSearchButton');
            skillsSearchButton?.addEventListener('click', async () => {
              clearInterval(intervalId);
              // Remove all skills tag elements
              document.querySelectorAll('.skills-tag').forEach(tag => tag.remove());
              gsap.to(skillsSearchContainer, {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                  document.body.removeChild(skillsSearchContainer);
                  // Now, position nodes as rectangle and display final summary
                  positionNodesForSummary();
                  setTimeout(() => {
                    const infoContainer = document.createElement('div');
                    infoContainer.id = "infoContainer";
                    infoContainer.style.position = 'absolute';
                    infoContainer.style.left = `${centerX - rectWidth / 2}px`;
                    infoContainer.style.top = `${window.innerHeight - rectHeight}px`;
                    infoContainer.style.width = `${rectWidth}px`;
                    infoContainer.style.height = `${rectHeight}px`;
                    infoContainer.style.backgroundColor = 'transparent';
                    infoContainer.style.borderRadius = '10px';
                    infoContainer.style.padding = '20px';
                    infoContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
                    infoContainer.style.overflowY = 'auto';
                    infoContainer.style.zIndex = '1000';
                    infoContainer.innerHTML = `
                      <div style="font-family: 'Arial', sans-serif; color: #e0e0e0; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                        <h2 class="text-center text-3xl font-bold mb-8" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Final Summary</h2>
      
                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Personal Details</h3>
                          <div class="ml-6">
                            <p class="mb-2 text-lg"><strong>Full Name:</strong> ${fullName || "Not provided"}</p>
                            <p class="mb-2 text-lg"><strong>Username:</strong> ${username || "Not provided"}</p>
                            <p class="mb-2 text-lg"><strong>Date of Birth:</strong> ${dob || "Not provided"}</p>
                            <p class="mb-2 text-lg"><strong>Current Status:</strong> ${currentStatus || "Not provided"}</p>
                          </div>
                        </section>
      
                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Documents</h3>
                          <div class="ml-6">
                            <p class="mb-2 text-lg"><strong>Resume:</strong> ${resumeFile ? resumeFile.name : "Not provided"}</p>
                            <p class="mb-2 text-lg"><strong>Transcripts:</strong> ${transcriptFiles.length ? transcriptFiles.map(file => file.name).join(', ') : "Not provided"}</p>
                          </div>
                        </section>
      
                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Academic Information</h3>
                          <div class="ml-6">
                            ${addedDegrees.length 
                              ? addedDegrees.map(degree => `
                                <div class="mb-4 p-3 rounded-md" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                                  <p class="mb-2 text-lg"><strong>Institution:</strong> ${degree.university}</p>
                                  <p class="mb-2 text-lg"><strong>Degree:</strong> ${degree.degree}</p>
                                  <p class="mb-2 text-lg"><strong>Field:</strong> ${degree.field_of_study}</p>
                                  <p class="mb-2 text-lg"><strong>Grade:</strong> ${degree.grade}</p>
                                  <p class="mb-2 text-lg"><strong>Courses:</strong> ${
                                    degree.relevant_courses && degree.relevant_courses.length 
                                      ? degree.relevant_courses.join(', ') 
                                      : "None"
                                  }</p>
                                </div>
                              `).join('')
                              : "<p>No degrees added yet.</p>"
                            }
                          </div>
                        </section>
      
                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Certifications / Online Courses</h3>
                          <div class="ml-6">
                            ${addedItems.length ? addedItems.map(item => `
                              <div class="mb-4 p-3 rounded-md" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                                <p class="mb-2 text-lg"><strong>Type:</strong> ${item.type}</p>
                                <p class="mb-2 text-lg"><strong>Title:</strong> ${item.title || "N/A"}</p>
                                <p class="mb-2 text-lg"><strong>Issuer:</strong> ${item.issuer}</p>
                                ${item.verificationLink ? `<p class="mb-2 text-lg"><strong>Link:</strong> ${item.verificationLink}</p>` : ""}
                              </div>
                            `).join('') : "<p>Not provided</p>"}
                          </div>
                        </section>
      
                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Work Experience</h3>
                          <div class="ml-6">
                            ${addedWorkExperiences.length ? addedWorkExperiences.map(exp => `
                              <div class="mb-4 p-4 border border-white rounded-md">
                                <div class="flex justify-between items-center mb-3">
                                  <strong style="margin-right: 10px;">Company:</strong> <span>${exp.company}</span>
                                  <strong style="margin-right: 10px;">Title:</strong> <span>${exp.title}</span>
                                </div>
                                <p class="mb-2 text-lg"><strong>Duration:</strong> ${exp.start_date || "N/A"} - ${exp.end_date || "N/A"}</p>
                                <div class="p-3 rounded-md" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                                  <p>${exp.description}</p>
                                </div>
                              </div>
                            `).join('') : "<p>Not provided</p>"}
                          </div>
                        </section>
      
                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Project Information</h3>
                          <div class="ml-6">
                            ${
                              addedProjects.length
                              ? addedProjects.map(project => `
                                <div class="mb-4 p-3 rounded-md" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                                  <p class="mb-2 text-lg"><strong>Project Link:</strong> ${project.link}</p>
                                  <p class="mb-2 text-lg"><strong>Project Title:</strong> ${project.title}</p>
                                  <p class="mb-2 text-lg"><strong>Project Description:</strong> ${project.description}</p>
                                </div>
                              `).join('')
                              : `
                                <p class="mb-2 text-lg"><strong>Project Link:</strong> ${projectLink ? projectLink : "Not provided"}</p>
                                <p class="mb-2 text-lg"><strong>Project Title:</strong> ${projectTitle}</p>
                              `
                            }
                          </div>
                        </section>
      
                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Career Goals & Skills</h3>
                          <div class="ml-6">
                            <p class="mb-2 text-lg"><strong>Career Goal:</strong> ${learningGoalsRef.current.length ? learningGoalsRef.current[0] : "Not provided"}</p>
                            <p class="mb-2 text-lg"><strong>Skills:</strong> ${
                              learningGoalsRef.current.length > 1 ? learningGoalsRef.current.slice(1).join(', ') : "Not provided"
                            }</p>
                          </div>
                        </section>

                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Learning Goals</h3>
                          <div class="ml-6">
                            <p class="mb-2 text-lg"><strong>Learning Goals:</strong> ${learningGoalsRef.current.length ? learningGoalsRef.current.join(', ') : "Not provided"}</p>
                          </div>
                        </section>

                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Publications</h3>
                          <div class="ml-6">
                            ${addedPublications.length ? addedPublications.map(pub => `
                              <div class="mb-4 p-3 rounded-md" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                                <p class="mb-2 text-lg"><strong>Title:</strong> ${pub.title}</p>
                                <p class="mb-2 text-lg"><strong>Journal:</strong> ${pub.journal}</p>
                                <p class="mb-2 text-lg"><strong>Date:</strong> ${pub.date}</p>
                                ${pub.link ? `<p class="mb-2 text-lg"><strong>Link:</strong> ${pub.link}</p>` : ""}
                              </div>
                            `).join('') : "<p>Not provided</p>"}
                          </div>
                        </section>

                        <section class="mb-8">
                          <h3 class="text-2xl font-semibold mb-4" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.9);">Learning Preferences and Goals</h3>
                          <div class="ml-6">
                            <p class="mb-2 text-lg"><strong>Preferred Learning Pace:</strong> ${preferredLearningPace || "Not provided"}</p>
                            <p class="mb-2 text-lg"><strong>Learning Commitment Level:</strong> ${learningCommitment || "Not provided"}</p>
                            <p class="mb-2 text-lg"><strong>Preferred Learning Methods:</strong> ${preferredLearningMethods.length ? preferredLearningMethods.join(', ') : "Not provided"}</p>
                          </div>
                        </section>
      
                        <button class="w-full mt-6 bg-purple-500 text-white px-5 py-3 rounded-md font-semibold hover:bg-purple-700 transition duration-300" style="font-weight: bold;" onClick={handleSave}>Save</button>
                      </div>
                    `;
                    document.body.appendChild(infoContainer);
                    gsap.fromTo(infoContainer, { opacity: 0 }, { opacity: 1, duration: 1 });
                    infoContainer.querySelector('button')?.addEventListener('click', async () => {
                      if (!userId) {
                        console.error("No valid user id available for onboarding.");
                        return;
                      }
                      const formData = new FormData();
                      formData.append("user_id", userId);
                      formData.append("full_name", fullName); // Collected from Step 2 (Personal Details)
                      formData.append("date_of_birth", dob || null);  // Collected from Step 2 (Personal Details)
                      formData.append("username", username);   // Collected from Step 2 (Personal Details)
                      formData.append("current_status", currentStatus); // Collected from Step 2 (Personal Details)
                      if (resumeFile) formData.append("resume_file", resumeFile); // Step 1 (Documents)
                      if (transcriptFiles.length) {
                        transcriptFiles.forEach(file => formData.append("transcript_files", file)); // Step 1 (Documents)
                      }
                      formData.append("university", university); // Displayed from Step 3 but final education is in added_degrees
                      formData.append("degree", degree);           // Displayed from Step 3 but final education is in added_degrees
                      formData.append("field_of_study", fieldOfStudy); // Step 3 (Academic Information)
                      formData.append("relevant_courses", JSON.stringify(relevantCourses)); // Step 3 (Academic Information)
                      formData.append("added_degrees", JSON.stringify(addedDegrees)); // Final education info as collected in Step 3 (combined in added_degrees)
                      formData.append("certifications", JSON.stringify(addedItems)); // Step 4 (Certifications / Online Courses)
                      formData.append("online_courses", JSON.stringify(onlineCourses || [])); // Step 4 (Certifications / Online Courses)
                      formData.append("work_experience", JSON.stringify(addedWorkExperiences.map(exp => ({
                        ...exp,
                        start_date: exp.start_date || null,
                        end_date: exp.end_date || null,
                      })))); // Step 5 (Work Experience)
                      formData.append("preferred_learning_pace", preferredLearningPace); // Step 7 (Learning Preferences)
                      formData.append("learning_commitment", learningCommitment); // Step 7 (Learning Preferences)
                      formData.append("preferred_learning_methods", JSON.stringify(preferredLearningMethods)); // Step 8 (Learning Preferences)
                      formData.append("learning_goals", JSON.stringify(learningGoalsRef.current || [])); // Updated here
                      formData.append("projects", JSON.stringify(addedProjects)); // Step 6 (Project Information)
                      formData.append("publications", JSON.stringify(addedPublications)); // Step 7 (Publications)
                      formData.append("career_goals", JSON.stringify(careerGoalsRef.current || [])); // Add career goals
                      formData.append("skills", JSON.stringify(skillsRef.current)); // Initialize skills as an empty array
  
                      console.log("Submitting onboarding data:");
                      console.log("User ID:", userId);
                      console.log("Full Name:", fullName);
                      console.log("Date of Birth:", dob);
                      console.log("Username:", username);
                      console.log("Current Status:", currentStatus);
                      console.log("Resume File:", resumeFile ? resumeFile.name : null);
                      console.log("Transcript Files:", transcriptFiles.map(file => file.name));
                      console.log("University:", university);
                      console.log("Degree:", degree);
                      console.log("Field of Study:", fieldOfStudy);
                      console.log("Relevant Courses:", relevantCourses);
                      console.log("Added Degrees:", addedDegrees);
                      console.log("Certifications:", addedItems);
                      console.log("Online Courses:", onlineCourses);
                      console.log("Work Experience:", addedWorkExperiences);
                      console.log("Preferred Learning Pace:", preferredLearningPace);
                      console.log("Learning Commitment:", learningCommitment);
                      console.log("Preferred Learning Methods:", preferredLearningMethods);
                      console.log("Learning Goals:", learningGoals);
                      console.log("Projects:", addedProjects);
                      console.log("Publications:", addedPublications);
                      console.log("Career Goals:", careerGoals);
                      console.log("Skills:", []);

                      console.log("Final Career Goals (before sending):", careerGoals);
                      console.log("Final Learning Goals (before sending):", learningGoals);
                      console.log("Final Skills (before sending):", skillsRef.current);

                      console.log("Checking formData entries:");
                      for (const [key, value] of formData.entries()) {
                        console.log(`${key}:`, value);
                      }

                      try {
                        const res = await fetch("http://localhost:8000/onboarding", {
                          method: "POST",
                          body: formData,
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          throw new Error(err.detail || "Onboarding submission failed");
                        }

                        // Send data to skill_extraction.py
                        const skillExtractionRes = await fetch("http://localhost:8000/skill-extraction", {
                          method: "POST",
                          headers: {
                              "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                              user_id: userId,
                              full_name: fullName,
                              date_of_birth: dob,
                              username: username,
                              current_status: currentStatus,
                              resume_file: resumeFile ? resumeFile.name : null,
                              transcript_files: transcriptFiles.map(file => file.name),
                              university: university,
                              degree: degree,
                              field_of_study: fieldOfStudy,
                              relevant_courses: relevantCourses,
                              added_degrees: addedDegrees,
                              certifications: addedItems,
                              online_courses: onlineCourses,
                              work_experience: addedWorkExperiences,
                              preferred_learning_pace: preferredLearningPace,
                              learning_commitment: learningCommitment,
                              preferred_learning_methods: preferredLearningMethods,
                              learning_goals: learningGoals,
                              projects: addedProjects,
                              publications: addedPublications,
                              career_goals: careerGoals,
                              skills: [], // Initialize skills as an empty array
                          }),
                        });
                        if (!skillExtractionRes.ok) {
                          const err = await skillExtractionRes.json();
                          throw new Error(err.detail || "Skill extraction submission failed");
                        }

                        const debugData = await skillExtractionRes.json();
                        setDebugMessages(debugData.debugMessages || []);

                        // Remove the summary container before routing
                        infoContainer.remove();
                        router.push("/home");
                      } catch (error: any) {
                        console.error("Onboarding submission error:", error.message);
                      }
                    });
                  }, 1000);
                }
              });
            });
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
    setFieldOfStudy(item.field_of_study);
    setRelevantCourses(item.relevant_courses);
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

  // Add handler to edit a given section by setting form step accordingly
  const handleEditSection = (section: string) => {
    switch(section) {
      case "personalDetails":
        setStep(2);
        break;
      case "documents":
        setStep(1);
        break;
      case "academicInformation":
        setStep(3);
        break;
      case "certifications":
        setStep(4);
        break;
      case "workExperience":
        setStep(5);
        break;
      case "projectInformation":
        setStep(6);
        break;
      case "learningPreferences":
        setStep(7);
        break;
      default:
        break;
    }
    // Remove the summary container from DOM if it exists.
    const infoContainer = document.getElementById("infoContainer");
    if (infoContainer) infoContainer.remove();
  };

  // Expose the handler globally so that inline onclick in summary HTML can call it
  useEffect(() => {
    (window as any).handleEditSection = handleEditSection;
  }, [handleEditSection]);

  // Modify createRectangleWithNodes:
  const learningGoalsRef = useRef<string[]>([]);
  useEffect(() => {
    learningGoalsRef.current = learningGoals;
  }, [learningGoals]);

  const [publicationTitle, setPublicationTitle] = useState("");
  const [publicationJournal, setPublicationJournal] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [publicationLink, setPublicationLink] = useState("");
  interface Publication {
    title: string;
    journal: string;
    date: string;
    link: string;
  }
  const [addedPublications, setAddedPublications] = useState<Publication[]>([]);

  const handleAddPublication = () => {
    if (publicationTitle.trim() !== "" && publicationJournal.trim() !== "" && publicationDate.trim() !== "") {
      setAddedPublications([
        ...addedPublications,
        {
          title: publicationTitle.trim(),
          journal: publicationJournal.trim(),
          date: publicationDate.trim(),
          link: publicationLink.trim(),
        },
      ]);
      setPublicationTitle("");
      setPublicationJournal("");
      setPublicationDate("");
      setPublicationLink("");
    }
  };

  const handleRemovePublication = (index: number) => {
    const newPublications = [...addedPublications];
    newPublications.splice(index, 1);
    setAddedPublications(newPublications);
  };

  const handleEditPublication = (index: number) => {
    const item = addedPublications[index];
    setPublicationTitle(item.title);
    setPublicationJournal(item.journal);
    setPublicationDate(item.date);
    setPublicationLink(item.link);
  };

  const handleSave = async () => {
    if (!userId) {
      console.error("No valid user id available for onboarding.");
      return;
    }
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("full_name", fullName); // Collected from Step 2 (Personal Details)
    formData.append("date_of_birth", dob || null);  // Collected from Step 2 (Personal Details)
    formData.append("username", username);   // Collected from Step 2 (Personal Details)
    formData.append("current_status", currentStatus); // Collected from Step 2 (Personal Details)
    if (resumeFile) formData.append("resume_file", resumeFile); // Step 1 (Documents)
    if (transcriptFiles.length) {
      transcriptFiles.forEach(file => formData.append("transcript_files", file)); // Step 1 (Documents)
    }
    formData.append("university", university); // Displayed from Step 3 but final education is in added_degrees
    formData.append("degree", degree);           // Displayed from Step 3 but final education is in added_degrees
    formData.append("field_of_study", fieldOfStudy); // Step 3 (Academic Information)
    formData.append("relevant_courses", JSON.stringify(relevantCourses)); // Step 3 (Academic Information)
    formData.append("added_degrees", JSON.stringify(addedDegrees)); // Final education info as collected in Step 3 (combined in added_degrees)
    formData.append("certifications", JSON.stringify(addedItems)); // Step 4 (Certifications / Online Courses)
    formData.append("online_courses", JSON.stringify(onlineCourses || [])); // Step 4 (Certifications / Online Courses)
    formData.append("work_experience", JSON.stringify(addedWorkExperiences.map(exp => ({
      ...exp,
      start_date: exp.start_date || null,
      end_date: exp.end_date || null,
    })))); // Step 5 (Work Experience)
    formData.append("preferred_learning_pace", preferredLearningPace); // Step 7 (Learning Preferences)
    formData.append("learning_commitment", learningCommitment); // Step 7 (Learning Preferences)
    formData.append("preferred_learning_methods", JSON.stringify(preferredLearningMethods)); // Step 8 (Learning Preferences)
    formData.append("learning_goals", JSON.stringify(learningGoalsRef.current || [])); // Updated here
    formData.append("projects", JSON.stringify(addedProjects)); // Step 6 (Project Information)
    formData.append("publications", JSON.stringify(addedPublications)); // Step 7 (Publications)
    formData.append("career_goals", JSON.stringify(careerGoalsRef.current || [])); // Add career goals
    formData.append("skills", JSON.stringify(skillsRef.current)); // Initialize skills as an empty array

    console.log("Submitting onboarding data:");
    console.log("User ID:", userId);
    console.log("Full Name:", fullName);
    console.log("Date of Birth:", dob);
    console.log("Username:", username);
    console.log("Current Status:", currentStatus);
    console.log("Resume File:", resumeFile ? resumeFile.name : null);
    console.log("Transcript Files:", transcriptFiles.map(file => file.name));
    console.log("University:", university);
    console.log("Degree:", degree);
    console.log("Field of Study:", fieldOfStudy);
    console.log("Relevant Courses:", relevantCourses);
    console.log("Added Degrees:", addedDegrees);
    console.log("Certifications:", addedItems);
    console.log("Online Courses:", onlineCourses);
    console.log("Work Experience:", addedWorkExperiences);
    console.log("Preferred Learning Pace:", preferredLearningPace);
    console.log("Learning Commitment:", learningCommitment);
    console.log("Preferred Learning Methods:", preferredLearningMethods);
    console.log("Learning Goals:", learningGoals);
    console.log("Projects:", addedProjects);
    console.log("Final Career Goals (before sending):", careerGoals);
    console.log("Final Learning Goals (before sending):", learningGoals);
    console.log("Final Skills (before sending):", skillsRef.current);

    console.log("Checking formData entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const res = await fetch("http://localhost:8000/onboarding", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Onboarding submission failed");
      }
  
      // Send data to skill_extraction.py
      const skillExtractionRes = await fetch("http://localhost:8000/skill-extraction", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: userId,
            full_name: fullName,
            date_of_birth: dob,
            username: username,
            current_status: currentStatus,
            resume_file: resumeFile ? resumeFile.name : null,
            transcript_files: transcriptFiles.map(file => file.name),
            university: university,
            degree: degree,
            field_of_study: fieldOfStudy,
            relevant_courses: relevantCourses,
            added_degrees: addedDegrees,
            certifications: addedItems,
            online_courses: onlineCourses,
            work_experience: addedWorkExperiences,
            preferred_learning_pace: preferredLearningPace,
            learning_commitment: learningCommitment,
            preferred_learning_methods: preferredLearningMethods,
            learning_goals: learningGoalsRef.current, // Updated here
            projects: addedProjects,
            publications: addedPublications,
            career_goals: careerGoalsRef.current, // Add career goals
            skills: [], // Initialize skills as an empty array
        }),
      });
      if (!skillExtractionRes.ok) {
        const err = await skillExtractionRes.json();
        throw new Error(err.detail || "Skill extraction submission failed");
      }
  
      const debugData = await skillExtractionRes.json();
      setDebugMessages(debugData.debugMessages || []);
  
      // Remove the summary container before routing
      const infoContainer = document.getElementById("infoContainer");
      if (infoContainer) infoContainer.remove();
      router.push("/home");
    } catch (error: any) {
      console.error("Onboarding submission error:", error.message);
    }
  };

  // Add the following useEffect block near your state declarations for debugging:
  useEffect(() => {
    console.log("Updated Learning Goals:", learningGoals);
  }, [learningGoals]);

  useEffect(() => {
    console.log("Updated Career Goals:", careerGoals);
  }, [careerGoals]);

  useEffect(() => {
    console.log("Updated Skills:", skills);
  }, [skills]);

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
                  onClick={handleSubmit}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-full"
                  style={{ width: "130px", height: "40px" }}
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
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
              </label>
              <input
                type="text"
                placeholder="Enter your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Username:
              </label>
              <input
                type="text"
                placeholder="Enter your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Date of Birth:
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
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
                onClick={handleSubmit}
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

              <label className="text-white mb-2 block text-center font-bold text-xl">
                Field of Study (Degree In):
              </label>
              <input
                type="text"
                placeholder="Enter Field of Study"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />

              {/* New Grade input */}
              <label className="text-white mb-2 block text-center font-bold text-xl">
                Grade (e.g., 3.8/4.0):
              </label>
              <input
                type="text"
                placeholder="Enter your grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />

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
                        {item.university} - {item.degree} {item.grade ? `(${item.grade})` : ""}
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
                onClick={handleSubmit}
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

              <button
                onClick={handleSubmit}
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

              {/* New input fields for Start Date and End Date */}
              <label className="text-white mb-4 block text-center font-bold text-lg">
                Start Date:
              </label>
              <input
                type="date"
                value={workExperienceStart}
                onChange={(e) => setWorkExperienceStart(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <label className="text-white mb-4 block text-center font-bold text-lg">
                End Date:
              </label>
              <input
                type="date"
                value={workExperienceEnd}
                onChange={(e) => setWorkExperienceEnd(e.target.value)}
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

              <button
                onClick={handleSubmit}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 6 ? (
            <>
              <label className="text-white mb-4 block text-center font-bold text-lg">
                Project Link:
              </label>
              <input
                type="text"
                placeholder="Enter project link"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />
              <label className="text-white mb-4 block text-center font-bold text-lg">
                Project Title:
              </label>
              <input
                type="text"
                placeholder="Enter project title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Project Description:
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
                        {item.link}
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
                  onClick={handleSubmit}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-full"
                  style={{ width: "130px", height: "40px" }}
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  className="mt-4 bg-white text-black px-4 py-2 rounded-full"
                  style={{ width: "130px", height: "40px" }}
                >
                  Continue
                </button>
              </div>
            </>
          ) : step === 7 ? (
            <>
              <label className="text-white mb-4 block text-center font-bold text-lg">
                Publication Title:
              </label>
              <input
                type="text"
                placeholder="Enter Publication Title"
                value={publicationTitle}
                onChange={(e) => setPublicationTitle(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Journal Name:
              </label>
              <input
                type="text"
                placeholder="Enter Journal Name"
                value={publicationJournal}
                onChange={(e) => setPublicationJournal(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Publication Date:
              </label>
              <input
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <label className="text-white mb-4 block text-center font-bold text-lg">
                Publication Link (Optional):
              </label>
              <input
                type="text"
                placeholder="Enter Publication Link"
                value={publicationLink}
                onChange={(e) => setPublicationLink(e.target.value)}
                className="px-4 py-2 rounded bg-white text-black text-center mb-3"
                style={{ width: "250px" }}
              />

              <button
                onClick={handleAddPublication}
                className="mt-2 bg-white text-black px-4 py-2 rounded"
              >
                Add Publication
              </button>

              <div className="mt-4 text-white">
                Added Publications:
                <div className="max-h-48 overflow-y-auto bg-gray-900 p-2 rounded" style={{ width: "300px" }}>
                  {addedPublications.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between"
                      style={{ wordBreak: "break-all", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEditPublication(index)}
                      >
                        {item.title} - {item.journal}
                      </span>
                      <button
                        onClick={() => handleRemovePublication(index)}
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
                onClick={handleSubmit}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 8 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Preferred Learning Pace:
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
                onClick={handleSubmit}
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 9 ? (
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
                onClick={handleFinishStep7} 
                className="mt-6 bg-white text-black px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : null }
        </div>
      )}
      {debugMessages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
            <h2 className="text-2xl font-bold mb-4">Debug Messages</h2>
            <ul className="list-disc pl-5">
              {debugMessages.map((msg, index) => (
                <li key={index} className="mb-2">{msg}</li>
              ))}
            </ul>
            <button
              onClick={() => setDebugMessages([])}
              className="mt-4 bg-purple-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



