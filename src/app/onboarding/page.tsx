"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { FaUpload, FaLinkedin } from "react-icons/fa";
import { useRouter } from 'next/navigation';

export default function NeuralNetworkBackground() {
  const [expandedNode, setExpandedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [username, setUsername] = useState("");
  const [formVisible, setFormVisible] = useState(true);
  const [step, setStep] = useState(1);

  const [resumeFile, setResumeFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [relevantCourses, setRelevantCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState("");
  const [certifications, setCertifications] = useState([]);
  const [currentCertificationTitle, setCurrentCertificationTitle] = useState("");
  const [currentCertificationIssuer, setCurrentCertificationIssuer] = useState("");
  const [onlineCourses, setOnlineCourses] = useState([]);
  const [currentOnlineCourseName, setCurrentOnlineCourseName] = useState("");
  const [currentOnlineCourseCompany, setCurrentOnlineCourseCompany] = useState("");
  // New state variables for work experience
  const [workExperienceTitle, setWorkExperienceTitle] = useState("");
  const [workExperienceDescription, setWorkExperienceDescription] = useState("");
  // New state variables for steps 6 and 7
  const [preferredLearningPace, setPreferredLearningPace] = useState("");
  const [preferredLearningMethods, setPreferredLearningMethods] = useState<string[]>([]);
  // New state variables for project
  const [projectFile, setProjectFile] = useState(null);
  const [projectDescription, setProjectDescription] = useState("");

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

  const handleFileUpload = (event, setFile) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const handleRemoveCourse = (index) => {
    setRelevantCourses(relevantCourses.filter((_, i) => i !== index));
  };

  const handleAddCertification = () => {
    if (currentCertificationTitle.trim() !== "" && currentCertificationIssuer.trim() !== "") {
      setCertifications([...certifications, { title: currentCertificationTitle.trim(), issuer: currentCertificationIssuer.trim() }]);
      setCurrentCertificationTitle("");
      setCurrentCertificationIssuer("");
    }
  };

  const handleRemoveCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleAddOnlineCourse = () => {
    if (currentOnlineCourseName.trim() !== "" && currentOnlineCourseCompany.trim() !== "") {
      setOnlineCourses([...onlineCourses, { name: currentOnlineCourseName.trim(), company: currentOnlineCourseCompany.trim() }]);
      setCurrentOnlineCourseName("");
      setCurrentOnlineCourseCompany("");
    }
  };

  const handleRemoveOnlineCourse = (index) => {
    setOnlineCourses(onlineCourses.filter((_, i) => i !== index));
  };

  // New helper to toggle learning methods selection
  const togglePreferredLearningMethod = (method: string) => {
    if (preferredLearningMethods.includes(method)) {
      setPreferredLearningMethods(preferredLearningMethods.filter(m => m !== method));
    } else {
      setPreferredLearningMethods([...preferredLearningMethods, method]);
    }
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
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Increase the number of nodes from 25 to 30
    const generatedNodes = Array.from({ length: 35 }, (_, index) => ({
      id: index,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
      size: 4,
      connectedTo: [],
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      generatedNodes.forEach((node) => {
        ctx.fillStyle = "rgba(147, 112, 219, 0.8)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        if (!node.isStatic) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        }
      });

      for (let i = 0; i < generatedNodes.length; i++) {
        for (const j of generatedNodes[i].connectedTo) {
          const dist = Math.hypot(
            generatedNodes[i].x - generatedNodes[j].x,
            generatedNodes[i].y - generatedNodes[j].y
          );
          if (dist < 250) {
            ctx.strokeStyle = `rgba(147, 112, 219, ${1 - dist / 250})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(generatedNodes[i].x, generatedNodes[i].y);
            ctx.lineTo(generatedNodes[j].x, generatedNodes[j].y);
            ctx.stroke();
          }
        }
      }

      updateConnections();
      requestAnimationFrame(drawNetwork);
    }

    drawNetwork();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
        (closest, node) => {
          const distToCenter = Math.hypot(
            node.x - window.innerWidth / 2,
            node.y - window.innerHeight / 2
          );
          return distToCenter < closest.dist
            ? { id: node.id, dist: distToCenter }
            : closest;
        },
        { id: null, dist: Infinity }
      );

      const selectedNode = nodes.find((node) => node.id === closestNode.id);
      if (selectedNode) {
        nodes.forEach((node) => (node.isStatic = false));
        selectedNode.isStatic = true;
        setIsAnimating(true);
        gsap.to(selectedNode, {
          size: calculateNodeSize(),
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
  const manualSizes = {
    1: 150,
    2: 300,
    3: 300,
    4: 250,
    5: 300,
    6: 200,
    7: 250,
  };

  const calculateNodeSize = () => {
    return manualSizes[step] || 300;
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
                (id) => !nodes.find((n) => n.id === id).isStatic
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

  // Add this new function to create a rectangle with nodes in the center
  const createRectangleWithNodes = () => {
    const centerX = window.innerWidth / 2;
    const rectWidth = 900; // Width to fit a form
    const rectHeight = 800; // Height to fit a form
    const nodesInRectangle = nodes.slice(0, 20); // Select the first 20 nodes for the rectangle
  
    nodesInRectangle.forEach((node, index) => {
      node.isStatic = true;
      let x, y;
      if (index < 5) {
        // Top side
        x = centerX - rectWidth / 2 + (index % 5) * (rectWidth / 5);
        y = window.innerHeight - rectHeight;
      } else {
        // Left and right sides
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

    // Display the collected information in the rectangle
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
        <h2 class="text-black text-center text-2xl font-bold mb-6">Summary</h2>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Username:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${username || "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Resume:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${resumeFile ? resumeFile.name : "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Transcript:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${transcriptFile ? transcriptFile.name : "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Relevant Courses:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${relevantCourses.length ? relevantCourses.join(', ') : "None"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Certifications:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${certifications.length ? certifications.map(c => `${c.title} (${c.issuer})`).join(', ') : "None"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Online Courses:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${onlineCourses.length ? onlineCourses.map(c => `${c.name} (${c.company})`).join(', ') : "None"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Project File:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${projectFile ? projectFile.name : "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Project Description:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${projectDescription || "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Work Experience Title:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${workExperienceTitle || "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Work Experience Description:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${workExperienceDescription || "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Preferred Learning Pace:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${preferredLearningPace || "Not provided"}" />
        </div>
        <div class="mb-4">
          <label class="text-black font-bold text-xl">Preferred Learning Methods:</label>
          <input type="text" class="text-black w-full px-3 py-2 rounded-md" value="${preferredLearningMethods.length ? preferredLearningMethods.join(', ') : "None"}" />
        </div>
        <button class="mt-6 bg-purple-500 text-white px-5 py-2 rounded">Save</button>
      `;

      document.body.appendChild(infoContainer);

      gsap.fromTo(infoContainer, { opacity: 0 }, { opacity: 1, duration: 1 });

      // Add event listener to save button
      infoContainer.querySelector('button').addEventListener('click', () => {
        const inputs = infoContainer.querySelectorAll('input');
        setUsername(inputs[0].value);
        // Update other state variables similarly
        document.body.removeChild(infoContainer);

        // Dismantle the rectangle and resume animation
        nodesInRectangle.forEach((node) => {
          node.isStatic = false;
          gsap.to(node, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            duration: 1,
            ease: "power2.inOut",
            onUpdate: () => setNodes([...nodes]),
          });
        });
        setFormVisible(true);

        // Create a new rectangle in the size of a search bar like iPhone Dynamic Island
        setTimeout(() => {
          const searchBarContainer = document.createElement('div');
          searchBarContainer.style.position = 'absolute';
          searchBarContainer.style.left = `${centerX - 300}px`; // Increase width to double
          searchBarContainer.style.top = '50px'; // Lower the search bar
          searchBarContainer.style.width = '600px'; // Increase width to double
          searchBarContainer.style.height = '50px';
          searchBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Match background color
          searchBarContainer.style.borderRadius = '25px';
          searchBarContainer.style.padding = '10px';
          searchBarContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
          searchBarContainer.style.zIndex = '1000';
          searchBarContainer.style.opacity = '0'; // Start with opacity 0

          searchBarContainer.innerHTML = `
            <div class="flex items-center w-full h-full">
              <input type="text" id="learningGoalsInput" class="flex-grow h-full px-3 py-2 bg-transparent text-white placeholder-gray-400 rounded-md focus:outline-none" placeholder="Learning Goals..." />
              <button id="searchBarButton" class="ml-2 p-2 bg-purple-500 hover:bg-purple-600 rounded-full">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
            </div>
          `;

          document.body.appendChild(searchBarContainer);

          // Create a border with nodes for the search bar
          const searchBarNodes = nodes.slice(20, 30); // Select the next 10 nodes for the search bar border
          searchBarNodes.forEach((node, index) => {
            let x, y;
            if (index < 3) {
              // Top side
              x = centerX - 300 + (index % 3) * (600 / 3);
              y = 50;
            } else if (index < 6) {
              // Bottom side
              x = centerX - 300 + ((index - 3) % 3) * (600 / 3);
              y = 100;
            } else if (index < 8) {
              // Left side
              x = centerX - 300;
              y = 50 + ((index - 6) % 2) * 50;
            } else {
              // Right side
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
                // Fade in the search bar after the nodes create the border
                gsap.to(searchBarContainer, { opacity: 1, duration: 1 });
              },
            });
          });

          // Add event listener to the input field
          const learningGoalsInput = document.getElementById('learningGoalsInput');
          const searchBarButton = document.getElementById('searchBarButton');
          let intervalId;

          learningGoalsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const text = learningGoalsInput.value.trim();
              if (text) {
                const availableNode = nodes.find(node => !node.isStatic && !node.textPinned);
                if (availableNode) {
                  availableNode.textPinned = true;
                  gsap.to(availableNode, {
                    size: 100,
                    duration: 1,
                    ease: "power2.inOut",
                    onUpdate: () => setNodes([...nodes]),
                    onComplete: () => {
                      const textContainer = document.createElement('div');
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
                      learningGoalsInput.value = ''; // Clear the input field

                      // Pin the text to the node
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

          // Add event listener to the search bar button (learning goals button)
          searchBarButton.addEventListener('click', () => {
            clearInterval(intervalId);
            gsap.to(searchBarContainer, {
              opacity: 0,
              duration: 1,
              onComplete: () => {
                document.body.removeChild(searchBarContainer);
                router.push('/home'); // Redirect to home page when button is clicked
              }
            });
          });

          // Prevent expanded nodes from passing through the search bar
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
        }, 2000); // Delay to allow nodes to resume animation
      });
    }, 2000); // Delay to allow nodes to form the rectangle and additional 1 second delay
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
                Username:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center"
                style={{ width: "250px" }}
              />
              <button
                onClick={handleSubmit}
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Submit
              </button>
            </>
          ) : step === 2 ? (
            <>
              <input
                type="file"
                id="resumeInput"
                style={{ display: "none" }}
                onChange={(e) => handleFileUpload(e, setResumeFile)}
              />
              <input
                type="file"
                id="transcriptInput"
                style={{ display: "none" }}
                onChange={(e) => handleFileUpload(e, setTranscriptFile)}
              />
              <button
                onClick={() => document.getElementById("resumeInput").click()}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "160px", height: "40px" }}
              >
                <FaUpload className="mr-2" /> Resume
              </button>
              <button
                onClick={() => document.getElementById("transcriptInput").click()}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "160px", height: "40px" }}
              >
                <FaUpload className="mr-2" /> Transcripts
              </button>
              <button
                onClick={() => alert("LinkedIn data imported")}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "160px", height: "40px" }}
              >
                <FaLinkedin className="mr-2" /> LinkedIn
              </button>
              <button
                onClick={handleSubmit}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-full"
                style={{ width: "160px", height: "40px" }}
              >
                Skip
              </button>
            </>
          ) : step === 3 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                University/School Name:
              </label>
              <input
                type="text"
                placeholder="Enter your University/School Name"
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Degree:
              </label>
              <input
                type="text"
                placeholder="Enter your Degree"
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Relevant Courses:
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
                onClick={handleSubmit}
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 4 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Certifications:
              </label>
              <div
                className="flex flex-col space-y-2 mb-4"
                style={{ width: "300px" }}
              >
                {certifications.map((certification, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-purple-600 text-white rounded-full px-4 py-1"
                  >
                    <span>{certification.title} - {certification.issuer}</span>
                    <button
                      onClick={() => handleRemoveCertification(index)}
                      className="ml-2 text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={currentCertificationTitle}
                  placeholder="Certification Title"
                  onChange={(e) => setCurrentCertificationTitle(e.target.value)}
                  className="px-3 py-2 rounded bg-white text-black focus:outline-none"
                />
                <input
                  type="text"
                  value={currentCertificationIssuer}
                  placeholder="Issuer"
                  onChange={(e) => setCurrentCertificationIssuer(e.target.value)}
                  className="px-3 py-2 rounded bg-white text-black focus:outline-none"
                />
                <button
                  onClick={handleAddCertification}
                  className="mt-2 bg-purple-500 text-white px-4 py-2 rounded"
                >
                  Add Certification
                </button>
              </div>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Online Courses:
              </label>
              <div
                className="flex flex-col space-y-2"
                style={{ width: "300px" }}
              >
                {onlineCourses.map((onlineCourse, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-purple-600 text-white rounded-full px-4 py-1"
                  >
                    <span>{onlineCourse.name} - {onlineCourse.company}</span>
                    <button
                      onClick={() => handleRemoveOnlineCourse(index)}
                      className="ml-2 text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={currentOnlineCourseName}
                  placeholder="Course Name"
                  onChange={(e) => setCurrentOnlineCourseName(e.target.value)}
                  className="px-3 py-2 rounded bg-white text-black focus:outline-none"
                />
                <input
                  type="text"
                  value={currentOnlineCourseCompany}
                  placeholder="Company"
                  onChange={(e) => setCurrentOnlineCourseCompany(e.target.value)}
                  className="px-3 py-2 rounded bg-white text-black focus:outline-none"
                />
                <button
                  onClick={handleAddOnlineCourse}
                  className="mt-2 bg-purple-500 text-white px-4 py-2 rounded"
                >
                  Add Online Course
                </button>
              </div>
              <button
                onClick={handleSubmit}
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 5 ? (
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
                onClick={() => document.getElementById("projectInput").click()}
                className="flex items-center justify-center px-4 py-2 mb-4 bg-purple-500 text-white rounded-full"
                style={{ width: "160px", height: "40px" }}
              >
                <FaUpload className="mr-2" /> Upload Project
              </button>
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
                onClick={handleSubmit}
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 6 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Work Experience Title:
              </label>
              <input
                type="text"
                placeholder="Enter your work experience title"
                value={workExperienceTitle}
                onChange={(e) => setWorkExperienceTitle(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px" }}
              />
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Work Experience Description:
              </label>
              <textarea
                placeholder="Enter your work experience description"
                value={workExperienceDescription}
                onChange={(e) => setWorkExperienceDescription(e.target.value)}
                className="px-6 py-3 rounded bg-white text-black text-center mb-4"
                style={{ width: "300px", height: "150px" }}
              />
              <button
                onClick={handleSubmit}
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 7 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Preferred Learning Pace:
              </label>
              <div className="flex justify-around mb-4" style={{ width: "300px" }}>
                <button
                  onClick={() => setPreferredLearningPace("Fast")}
                  className={
                    preferredLearningPace === "Fast"
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Fast
                </button>
                <button
                  onClick={() => setPreferredLearningPace("Medium")}
                  className={
                    preferredLearningPace === "Medium"
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Medium
                </button>
                <button
                  onClick={() => setPreferredLearningPace("Slow")}
                  className={
                    preferredLearningPace === "Slow"
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Slow
                </button>
              </div>
              <button
                onClick={handleSubmit}
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Continue
              </button>
            </>
          ) : step === 8 ? (
            <>
              <label className="text-white mb-6 block text-center font-bold text-xl">
                Preferred Learning Method:
              </label>
              <div
                className="flex flex-col space-y-2 mb-4"
                style={{ width: "300px" }}
              >
                <button
                  onClick={() => togglePreferredLearningMethod("Hands-on Projects")}
                  className={
                    preferredLearningMethods.includes("Hands-on Projects")
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Hands-on Projects
                </button>
                <button
                  onClick={() => togglePreferredLearningMethod("Quizzes & MCQs")}
                  className={
                    preferredLearningMethods.includes("Quizzes & MCQs")
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Quizzes & MCQs
                </button>
                <button
                  onClick={() => togglePreferredLearningMethod("Flashcards")}
                  className={
                    preferredLearningMethods.includes("Flashcards")
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Flashcards
                </button>
                <button
                  onClick={() => togglePreferredLearningMethod("Reading-based learning")}
                  className={
                    preferredLearningMethods.includes("Reading-based learning")
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Reading-based learning
                </button>
                <button
                  onClick={() => togglePreferredLearningMethod("Videos")}
                  className={
                    preferredLearningMethods.includes("Videos")
                      ? "bg-purple-500 px-4 py-2 rounded"
                      : "bg-gray-800 text-white px-4 py-2 rounded"
                  }
                >
                  Videos
                </button>
              </div>
              <button
                onClick={handleFinishStep7} // updated to animate node shrink as well
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Finish
              </button>
            </>
          ) : step === 9 ? (
            <div
              ref={summaryContainerRef}
              id="summaryContainer"
              className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full"
              style={{
                // Initial state for animation:
                opacity: 0,
                transform: "translateY(50px)",
              }}
            >
              <h2 className="text-black text-center text-2xl font-bold mb-6">
                Summary
              </h2>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Username:</label>
                <p className="text-black">{username || "Not provided"}</p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Resume:</label>
                <p className="text-black">{resumeFile ? resumeFile.name : "Not provided"}</p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Transcript:</label>
                <p className="text-black">{transcriptFile ? transcriptFile.name : "Not provided"}</p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Relevant Courses:</label>
                <p className="text-black">
                  {relevantCourses.length ? relevantCourses.join(', ') : "None"}
                </p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Certifications:</label>
                <p className="text-black">
                  {certifications.length
                    ? certifications.map(c => `${c.title} (${c.issuer})`).join(', ')
                    : "None"}
                </p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Online Courses:</label>
                <p className="text-black">
                  {onlineCourses.length
                    ? onlineCourses.map(c => `${c.name} (${c.company})`).join(', ')
                    : "None"}
                </p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Work Experience Title:</label>
                <p className="text-black">{workExperienceTitle || "Not provided"}</p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Work Experience Description:</label>
                <p className="text-black">{workExperienceDescription || "Not provided"}</p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Preferred Learning Pace:</label>
                <p className="text-black">{preferredLearningPace || "Not provided"}</p>
              </div>
              <div className="mb-4">
                <label className="text-black font-bold text-xl">Preferred Learning Methods:</label>
                <p className="text-black">
                  {preferredLearningMethods.length ? preferredLearningMethods.join(', ') : "None"}
                </p>
              </div>
              <button
                onClick={() => alert("Submitted!")}
                className="mt-6 bg-purple-500 text-white px-5 py-2 rounded"
              >
                Submit Final Form
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}



