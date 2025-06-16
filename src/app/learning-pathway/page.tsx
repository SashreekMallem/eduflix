"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FaBrain, 
  FaBullseye,
  FaCheckCircle, 
  FaTimes, 
  FaPlus, 
  FaSave,
  FaArrowRight,
  FaLightbulb,
  FaGraduationCap,
  FaRocket,
  FaChartLine,
  FaCog,
  FaBookOpen,
  FaClock,
  FaUser
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Types
interface UserProfile {
  full_name: string;
  current_status: string;
  skills: string[];
  career_goals: string[];
  learning_goals: string[];
  learning_pace: string;
  learning_commitment: string;
  learning_methods: string[];
}

interface SkillGap {
  skill: string;
  currentLevel: string;
  requiredLevel: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  skills: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'suggested' | 'added' | 'completed' | 'skipped';
  subtopics: SubTopic[];
}

interface SubTopic {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  resources: Resource[];
  status: 'pending' | 'in_progress' | 'completed';
}

interface Resource {
  type: 'video' | 'article' | 'exercise' | 'project' | 'book';
  title: string;
  url?: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface LearningPathway {
  id: string;
  userId: string;
  title: string;
  description: string;
  careerGoal: string;
  estimatedCompletionTime: string;
  modules: LearningModule[];
  skillGaps: SkillGap[];
  createdAt: string;
  updatedAt: string;
}

const LearningPathwayCreator = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // Data states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [suggestedModules, setSuggestedModules] = useState<LearningModule[]>([]);
  const [customModules, setCustomModules] = useState<LearningModule[]>([]);
  
  // UI states
  const [currentStep, setCurrentStep] = useState(1); // 1: Analysis, 2: Review, 3: Customize, 4: Finalize
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  
  // Neural network animation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Get user data on component mount
  useEffect(() => {
    // AI-powered skill gap analysis
    const analyzeSkillGaps = async (profile: UserProfile) => {
      setIsAnalyzing(true);
      
      try {
        // Mock AI analysis - in production, this would call your AI service
        const gaps = await performSkillGapAnalysis(profile);
        setSkillGaps(gaps);
        
        // Generate suggested modules based on gaps
        const modules = await generateLearningModules(gaps, profile);
        setSuggestedModules(modules);
        
        setCurrentStep(2);
      } catch (error) {
        console.error('Error in skill gap analysis:', error);
        toast.error('Failed to analyze skill gaps');
      } finally {
        setIsAnalyzing(false);
      }
    };

    const fetchUserProfile = async (uid: string) => {
      try {
        // Fetch main profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', uid)
          .single();

        if (profileError) throw profileError;

        setUserProfile(profile);

        // TODO: These will be used in the full AI analysis implementation
        // const { data: education } = await supabase
        //   .from('user_education')
        //   .select('*')
        //   .eq('user_id', uid);

        // const { data: workExperience } = await supabase
        //   .from('user_work_experience')
        //   .select('*')
        //   .eq('user_id', uid);

        // const { data: certifications } = await supabase
        //   .from('user_certifications')
        //   .select('*')
        //   .eq('user_id', uid);

        // const { data: skillProficiencies } = await supabase
        //   .from('user_skill_proficiencies')
        //   .select('*')
        //   .eq('user_id', uid);

        // Start gap analysis
        await analyzeSkillGaps(profile);
        
      } catch (error: unknown) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to fetch user profile');
      } finally {
        setIsLoading(false);
      }
    };

    const initializeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }
        
        setUserId(user.id);
        await fetchUserProfile(user.id);
      } catch (error) {
        console.error('Error initializing:', error);
        toast.error('Failed to load user data');
      }
    };
    
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Manual analysis function for the button
  const startManualAnalysis = async () => {
    if (!userProfile) return;
    
    setIsAnalyzing(true);
    try {
      const gaps = await performSkillGapAnalysis(userProfile);
      setSkillGaps(gaps);
      
      const modules = await generateLearningModules(gaps, userProfile);
      setSuggestedModules(modules);
      
      setCurrentStep(2);
    } catch (error) {
      console.error('Error in skill gap analysis:', error);
      toast.error('Failed to analyze skill gaps');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mock skill gap analysis function (replace with actual AI logic)
  const performSkillGapAnalysis = async (profile: UserProfile): Promise<SkillGap[]> => {
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const careerGoalSkillMap: Record<string, string[]> = {
      'Senior Software Engineer': ['Advanced JavaScript', 'System Design', 'Leadership', 'Architecture Patterns', 'Performance Optimization'],
      'Data Scientist': ['Machine Learning', 'Python', 'Statistics', 'Deep Learning', 'Data Visualization'],
      'Product Manager': ['Product Strategy', 'Market Research', 'Analytics', 'User Research', 'Agile Methodologies'],
      'DevOps Engineer': ['Kubernetes', 'Docker', 'CI/CD', 'Infrastructure as Code', 'Monitoring'],
      'Full Stack Developer': ['React', 'Node.js', 'Database Design', 'API Development', 'Testing'],
      'Software Engineer': ['JavaScript', 'React', 'Node.js', 'Git', 'Testing'],
      'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'Statistics'],
      'UI/UX Designer': ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Usability Testing'],
      'Cloud Architect': ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'System Design'],
      'Cybersecurity Specialist': ['Network Security', 'Penetration Testing', 'Risk Assessment', 'Compliance', 'Incident Response']
    };

    // Learning goal to skills mapping
    const learningGoalSkillMap: Record<string, string[]> = {
      'Learn a new programming language': ['Python', 'JavaScript', 'Java', 'Go', 'Rust'],
      'Master data science': ['Python', 'R', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization'],
      'Improve problem-solving skills': ['Algorithms', 'Data Structures', 'System Design', 'Debugging'],
      'Build portfolio projects': ['Project Management', 'Git', 'Deployment', 'Testing', 'Documentation'],
      'Prepare for certifications': ['AWS Certified', 'Google Cloud', 'Azure', 'CompTIA', 'Cisco'],
      'Advance career prospects': ['Leadership', 'Communication', 'Team Management', 'Strategic Thinking']
    };

    const currentSkills = profile.skills || [];
    const userCareerGoals = profile.career_goals || [];
    const userLearningGoals = profile.learning_goals || [];
    
    const gaps: SkillGap[] = [];
    
    // Analyze career goals
    userCareerGoals.forEach((goal: string) => {
      const requiredSkills = careerGoalSkillMap[goal] || [];
      
      requiredSkills.forEach(skill => {
        const hasSkill = currentSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(userSkill.toLowerCase())
        );
        
        if (!hasSkill) {
          gaps.push({
            skill,
            currentLevel: 'none',
            requiredLevel: 'intermediate',
            priority: requiredSkills.indexOf(skill) < 2 ? 'high' : 'medium',
            category: getCategoryForSkill(skill)
          });
        }
      });
    });

    // Analyze learning goals
    userLearningGoals.forEach((goal: string) => {
      const requiredSkills = learningGoalSkillMap[goal] || [];
      
      requiredSkills.forEach(skill => {
        const hasSkill = currentSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(userSkill.toLowerCase())
        );
        
        // Check if this skill gap already exists from career goals
        const existingGap = gaps.find(gap => gap.skill === skill);
        
        if (!hasSkill && !existingGap) {
          gaps.push({
            skill,
            currentLevel: 'none',
            requiredLevel: 'beginner',
            priority: 'medium',
            category: getCategoryForSkill(skill)
          });
        } else if (existingGap) {
          // If skill gap exists from career goals, potentially upgrade priority
          existingGap.priority = existingGap.priority === 'low' ? 'medium' : existingGap.priority;
        }
      });
    });

    return gaps;
  };

  // Generate learning modules based on skill gaps
  const generateLearningModules = async (gaps: SkillGap[], profile: UserProfile): Promise<LearningModule[]> => {
    const modules: LearningModule[] = [];
    
    gaps.forEach((gap, index) => {
      const careerGoalText = profile.career_goals?.[0] ? `career goal (${profile.career_goals[0]})` : 'career goals';
      const learningGoalText = profile.learning_goals?.length > 0 ? ` and learning objectives` : '';
      
      const learningModule: LearningModule = {
        id: `module_${index + 1}`,
        title: `Master ${gap.skill}`,
        description: `Comprehensive course to develop ${gap.skill} skills for your ${careerGoalText}${learningGoalText}`,
        category: gap.category,
        difficulty: gap.requiredLevel as 'beginner' | 'intermediate' | 'advanced',
        estimatedHours: getEstimatedHours(gap.skill, gap.requiredLevel),
        prerequisites: getPrerequisites(gap.skill),
        skills: [gap.skill],
        priority: gap.priority,
        status: 'suggested',
        subtopics: generateSubTopics(gap.skill)
      };
      
      modules.push(learningModule);
    });

    return modules.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Helper functions
  const getCategoryForSkill = (skill: string): string => {
    const categoryMap: Record<string, string> = {
      'JavaScript': 'Programming',
      'React': 'Frontend',
      'Node.js': 'Backend',
      'Python': 'Programming',
      'Machine Learning': 'AI/ML',
      'System Design': 'Architecture',
      'Leadership': 'Soft Skills',
      'Docker': 'DevOps',
      'Kubernetes': 'DevOps',
      'Product Strategy': 'Product',
    };
    
    return categoryMap[skill] || 'General';
  };

  const getEstimatedHours = (skill: string, level: string): number => {
    const baseHours: Record<string, number> = {
      'beginner': 20,
      'intermediate': 40,
      'advanced': 80
    };
    
    const skillMultiplier: Record<string, number> = {
      'System Design': 1.5,
      'Machine Learning': 2,
      'Leadership': 1.2,
    };
    
    return Math.round(baseHours[level] * (skillMultiplier[skill] || 1));
  };

  const getPrerequisites = (skill: string): string[] => {
    const prerequisiteMap: Record<string, string[]> = {
      'Advanced JavaScript': ['JavaScript Fundamentals', 'ES6+'],
      'React': ['JavaScript', 'HTML/CSS'],
      'System Design': ['Software Architecture', 'Database Design'],
      'Machine Learning': ['Python', 'Statistics', 'Linear Algebra'],
      'Leadership': ['Communication Skills', 'Team Collaboration'],
    };
    
    return prerequisiteMap[skill] || [];
  };

  const generateSubTopics = (skill: string): SubTopic[] => {
    const subtopicMap: Record<string, SubTopic[]> = {
      'Advanced JavaScript': [
        {
          id: 'js_1',
          title: 'Closures and Scope',
          description: 'Master JavaScript closures and lexical scoping',
          estimatedHours: 8,
          resources: [
            { type: 'video', title: 'JavaScript Closures Explained', duration: '45 min', difficulty: 'intermediate' },
            { type: 'exercise', title: 'Closure Practice Problems', duration: '2 hours', difficulty: 'intermediate' }
          ],
          status: 'pending'
        },
        {
          id: 'js_2',
          title: 'Asynchronous Programming',
          description: 'Promises, async/await, and event loop',
          estimatedHours: 12,
          resources: [
            { type: 'video', title: 'Async JavaScript Deep Dive', duration: '1.5 hours', difficulty: 'advanced' },
            { type: 'project', title: 'Build Async Data Fetcher', duration: '4 hours', difficulty: 'advanced' }
          ],
          status: 'pending'
        }
      ],
      'System Design': [
        {
          id: 'sd_1',
          title: 'Scalability Principles',
          description: 'Learn horizontal and vertical scaling strategies',
          estimatedHours: 15,
          resources: [
            { type: 'article', title: 'Scalability Patterns', duration: '30 min', difficulty: 'intermediate' },
            { type: 'video', title: 'System Design Interview Prep', duration: '2 hours', difficulty: 'advanced' }
          ],
          status: 'pending'
        }
      ]
    };
    
    return subtopicMap[skill] || [
      {
        id: `${skill.replace(/\s+/g, '_').toLowerCase()}_1`,
        title: `${skill} Fundamentals`,
        description: `Core concepts and principles of ${skill}`,
        estimatedHours: 10,
        resources: [
          { type: 'video', title: `${skill} Introduction`, duration: '1 hour', difficulty: 'beginner' },
          { type: 'exercise', title: `${skill} Practice`, duration: '2 hours', difficulty: 'beginner' }
        ],
        status: 'pending'
      }
    ];
  };

  // Neural network background animation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Neural network nodes
    const nodes: Array<{x: number, y: number, vx: number, vy: number, connections: number[], intensity: number}> = [];
    const nodeCount = 30;
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
        intensity: Math.random()
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      const connectionCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < connectionCount; j++) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i && !node.connections.includes(target)) {
          node.connections.push(target);
        }
      }
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off edges
        if (node.x <= 0 || node.x >= canvas.width) node.vx *= -1;
        if (node.y <= 0 || node.y >= canvas.height) node.vy *= -1;
        
        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
        
        // Update intensity based on analysis progress
        node.intensity = 0.3 + (currentStep / 4) * 0.7;
      });

      // Draw connections
      ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 + (currentStep / 4) * 0.3})`;
      ctx.lineWidth = 1;
      nodes.forEach(node => {
        node.connections.forEach(targetIndex => {
          const target = nodes[targetIndex];
          const distance = Math.sqrt((target.x - node.x) ** 2 + (target.y - node.y) ** 2);
          if (distance < 200) {
            const opacity = (200 - distance) / 200 * node.intensity;
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.intensity * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${node.intensity})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentStep]);

  // Save pathway
  const savePathway = async () => {
    if (!userId || !userProfile) return;
    
    setIsSaving(true);
    try {
      const pathwayTitle = userProfile.career_goals?.[0] 
        ? `${userProfile.career_goals[0]} Learning Path`
        : userProfile.learning_goals?.[0]
        ? `${userProfile.learning_goals[0]} Pathway`
        : 'Personalized Learning Path';
        
      const pathwayDescription = `AI-generated learning pathway based on your ${
        userProfile.career_goals?.length > 0 ? 'career goals' : ''
      }${
        userProfile.career_goals?.length > 0 && userProfile.learning_goals?.length > 0 ? ' and ' : ''
      }${
        userProfile.learning_goals?.length > 0 ? 'learning objectives' : ''
      } with comprehensive skill gap analysis`;

      const pathwayData: LearningPathway = {
        id: `pathway_${userId}_${Date.now()}`,
        userId,
        title: pathwayTitle,
        description: pathwayDescription,
        careerGoal: userProfile.career_goals?.[0] || '',
        estimatedCompletionTime: calculateTotalTime(),
        modules: [...suggestedModules, ...customModules].filter(m => m.status === 'added'),
        skillGaps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to Supabase (you'll need to create this table)
      const { error } = await supabase
        .from('learning_pathways')
        .upsert(pathwayData);

      if (error) throw error;

      toast.success('Learning pathway saved successfully!');
      router.push('/home');
    } catch (error: unknown) {
      console.error('Error saving pathway:', error);
      toast.error('Failed to save learning pathway');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalTime = (): string => {
    const totalHours = [...suggestedModules, ...customModules]
      .filter(m => m.status === 'added')
      .reduce((sum, module) => sum + module.estimatedHours, 0);
    
    const weeks = Math.ceil(totalHours / 10); // Assuming 10 hours per week
    return `${weeks} weeks (${totalHours} hours)`;
  };

  // Module management functions
  const toggleModuleStatus = (moduleId: string, isSuggested: boolean = true) => {
    const updateModules = isSuggested ? setSuggestedModules : setCustomModules;
    
    updateModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { 
            ...module, 
            status: module.status === 'added' ? 'suggested' : 'added' 
          }
        : module
    ));
  };

  const removeModule = (moduleId: string, isSuggested: boolean = true) => {
    const updateModules = isSuggested ? setSuggestedModules : setCustomModules;
    
    updateModules(prev => prev.filter(module => module.id !== moduleId));
  };

  const addCustomModule = (module: Omit<LearningModule, 'id'>) => {
    const newModule: LearningModule = {
      ...module,
      id: `custom_${Date.now()}`,
      status: 'added'
    };
    
    setCustomModules(prev => [...prev, newModule]);
    setShowAddModuleModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Neural Network Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-20"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}
      />
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-slate-200">AI Learning</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"> Pathway</span>
              </h1>
              <p className="text-slate-400">
                {userProfile?.full_name && `Welcome ${userProfile.full_name.split(' ')[0]}! `}
                Let&apos;s create your personalized learning journey
              </p>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-0.5 mx-2 transition-colors duration-300 ${
                      currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-7xl mx-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Analysis */}
            {currentStep === 1 && (
              <AnalysisStep 
                isAnalyzing={isAnalyzing}
                userProfile={userProfile}
                onStartAnalysis={startManualAnalysis}
              />
            )}

            {/* Step 2: Review Gaps */}
            {currentStep === 2 && (
              <GapReviewStep 
                skillGaps={skillGaps}
                suggestedModules={suggestedModules}
                onNext={() => setCurrentStep(3)}
                onToggleModule={toggleModuleStatus}
              />
            )}

            {/* Step 3: Customize Pathway */}
            {currentStep === 3 && (
              <CustomizeStep 
                suggestedModules={suggestedModules}
                customModules={customModules}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onToggleModule={toggleModuleStatus}
                onRemoveModule={removeModule}
                onAddCustomModule={() => setShowAddModuleModal(true)}
                onNext={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
              />
            )}

            {/* Step 4: Finalize */}
            {currentStep === 4 && (
              <FinalizeStep 
                suggestedModules={suggestedModules}
                customModules={customModules}
                estimatedTime={calculateTotalTime()}
                onSave={savePathway}
                onBack={() => setCurrentStep(3)}
                isSaving={isSaving}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Module Modal */}
      {showAddModuleModal && (
        <AddModuleModal 
          onClose={() => setShowAddModuleModal(false)}
          onAdd={addCustomModule}
        />
      )}
    </div>
  );
};

// Step Components will be added next...

// Step 1: Analysis Component
const AnalysisStep: React.FC<{
  isAnalyzing: boolean;
  userProfile: UserProfile | null;
  onStartAnalysis: () => void;
}> = ({ isAnalyzing, userProfile, onStartAnalysis }) => {
  return (
    <motion.div
      key="analysis"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <FaBrain className="text-3xl text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-200 mb-4">AI Skill Analysis</h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Our AI will analyze your profile, education, work experience, and goals to identify skill gaps and create a personalized learning pathway.
        </p>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
            <FaUser className="mr-3 text-blue-400" />
            Profile Summary
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-slate-300 font-medium mb-2">Career Goals</h4>
              <div className="flex flex-wrap gap-2">
                {userProfile.career_goals?.map((goal, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                    {goal}
                  </span>
                )) || <span className="text-slate-500">No goals set</span>}
              </div>
            </div>
            <div>
              <h4 className="text-slate-300 font-medium mb-2">Learning Goals</h4>
              <div className="flex flex-wrap gap-2">
                {userProfile.learning_goals?.map((goal, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {goal}
                  </span>
                )) || <span className="text-slate-500">No goals set</span>}
              </div>
            </div>
            <div>
              <h4 className="text-slate-300 font-medium mb-2">Current Skills</h4>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills?.slice(0, 6).map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                    {skill}
                  </span>
                )) || <span className="text-slate-500">No skills listed</span>}
                {userProfile.skills?.length > 6 && (
                  <span className="px-3 py-1 bg-slate-600 text-slate-300 rounded-full text-sm">
                    +{userProfile.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Status */}
      {isAnalyzing ? (
        <div className="text-center py-12">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-4 border-transparent border-t-purple-500 rounded-full animate-spin animate-reverse"></div>
            <div className="absolute inset-8 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Analyzing Your Profile</h3>
          <p className="text-slate-400">AI is processing your data to identify skill gaps and opportunities...</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <button
            onClick={onStartAnalysis}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25"
          >
            <span className="flex items-center space-x-2">
              <FaRocket className="text-lg group-hover:animate-pulse" />
              <span>Start AI Analysis</span>
            </span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Step 2: Gap Review Component
const GapReviewStep: React.FC<{
  skillGaps: SkillGap[];
  suggestedModules: LearningModule[];
  onNext: () => void;
  onToggleModule: (moduleId: string, isSuggested?: boolean) => void;
}> = ({ skillGaps, suggestedModules, onNext, onToggleModule }) => {
  const groupedGaps = skillGaps.reduce((acc, gap) => {
    if (!acc[gap.category]) acc[gap.category] = [];
    acc[gap.category].push(gap);
    return acc;
  }, {} as Record<string, SkillGap[]>);

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <FaBullseye className="text-3xl text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-200 mb-4">Skill Gap Analysis</h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Review the identified skill gaps and our AI-suggested learning modules to bridge them.
        </p>
      </div>

      {/* Skill Gaps Overview */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Skill Gaps */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center">
            <FaChartLine className="mr-3 text-orange-400" />
            Identified Gaps
          </h3>
          <div className="space-y-4">
            {Object.entries(groupedGaps).map(([category, gaps]) => (
              <div key={category} className="border border-slate-700/30 rounded-lg p-4">
                <h4 className="font-medium text-slate-300 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                  {category}
                </h4>
                <div className="space-y-2">
                  {gaps.map((gap, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{gap.skill}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        gap.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        gap.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {gap.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Modules */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center">
            <FaLightbulb className="mr-3 text-yellow-400" />
            AI Suggestions
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {suggestedModules.map((module) => (
              <div key={module.id} className="border border-slate-700/30 rounded-lg p-4 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-200 mb-1">{module.title}</h4>
                    <p className="text-slate-400 text-sm mb-2">{module.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span className="flex items-center">
                        <FaClock className="mr-1" />
                        {module.estimatedHours}h
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                        module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {module.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        module.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        module.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {module.priority} priority
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleModule(module.id)}
                    className={`ml-4 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      module.status === 'added'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30'
                    }`}
                  >
                    {module.status === 'added' ? 'Added' : 'Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onNext}
          className="group px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center space-x-2"
        >
          <span>Customize Pathway</span>
          <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

// Step 3: Customize Component
const CustomizeStep: React.FC<{
  suggestedModules: LearningModule[];
  customModules: LearningModule[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onToggleModule: (moduleId: string, isSuggested?: boolean) => void;
  onRemoveModule: (moduleId: string, isSuggested?: boolean) => void;
  onAddCustomModule: () => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ 
  suggestedModules, 
  customModules, 
  selectedCategory, 
  onCategoryChange, 
  onToggleModule, 
  onRemoveModule, 
  onAddCustomModule, 
  onNext, 
  onBack 
}) => {
  const categories = ['all', 'Programming', 'Frontend', 'Backend', 'AI/ML', 'DevOps', 'Product', 'Soft Skills'];
  
  const filteredSuggested = selectedCategory === 'all' 
    ? suggestedModules 
    : suggestedModules.filter(m => m.category === selectedCategory);

  const filteredCustom = selectedCategory === 'all' 
    ? customModules 
    : customModules.filter(m => m.category === selectedCategory);

  const addedModules = [...suggestedModules, ...customModules].filter(m => m.status === 'added');

  return (
    <motion.div
      key="customize"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <FaCog className="text-3xl text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-200 mb-4">Customize Your Pathway</h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Fine-tune your learning journey by adding, removing, or customizing modules.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Suggested Modules */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-200 flex items-center">
              <FaLightbulb className="mr-3 text-yellow-400" />
              Available Modules
            </h3>
            <button
              onClick={onAddCustomModule}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPlus className="text-sm" />
              <span>Add Custom</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Suggested Modules */}
            {filteredSuggested.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onToggle={() => onToggleModule(module.id)}
                onRemove={() => onRemoveModule(module.id)}
                showRemove={false}
              />
            ))}
            
            {/* Custom Modules */}
            {filteredCustom.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onToggle={() => onToggleModule(module.id, false)}
                onRemove={() => onRemoveModule(module.id, false)}
                showRemove={true}
                isCustom={true}
              />
            ))}
          </div>
        </div>

        {/* Selected Modules Preview */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center">
            <FaCheckCircle className="mr-3 text-green-400" />
            Selected Modules ({addedModules.length})
          </h3>
          
          {addedModules.length === 0 ? (
            <div className="text-center py-8">
              <FaGraduationCap className="text-4xl text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No modules selected yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {addedModules.map((module) => (
                <div key={module.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                  <h4 className="font-medium text-slate-200 text-sm mb-1">{module.title}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{module.estimatedHours}h</span>
                    <span className="capitalize">{module.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-slate-700/30">
            <div className="text-sm text-slate-400 mb-2">Total Estimated Time:</div>
            <div className="text-lg font-semibold text-blue-400">
              {addedModules.reduce((sum, module) => sum + module.estimatedHours, 0)} hours
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={addedModules.length === 0}
          className="group px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span>Finalize Pathway</span>
          <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

// Step 4: Finalize Component
const FinalizeStep: React.FC<{
  suggestedModules: LearningModule[];
  customModules: LearningModule[];
  estimatedTime: string;
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
}> = ({ suggestedModules, customModules, estimatedTime, onSave, onBack, isSaving }) => {
  const finalModules = [...suggestedModules, ...customModules].filter(m => m.status === 'added');
  
  return (
    <motion.div
      key="finalize"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <FaRocket className="text-3xl text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-200 mb-4">Finalize Your Learning Pathway</h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Review your personalized learning journey and start your path to success.
        </p>
      </div>

      {/* Pathway Overview */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{finalModules.length}</div>
            <div className="text-slate-400">Learning Modules</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {finalModules.reduce((sum, m) => sum + m.estimatedHours, 0)}h
            </div>
            <div className="text-slate-400">Total Hours</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{estimatedTime.split(' ')[0]}</div>
            <div className="text-slate-400">Estimated Weeks</div>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center">
          <FaBookOpen className="mr-3 text-blue-400" />
          Your Learning Modules
        </h3>
        
        <div className="grid gap-4">
          {finalModules.map((module, index) => (
            <div key={module.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200 mb-1">{module.title}</h4>
                    <p className="text-slate-400 text-sm mb-2">{module.description}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center text-slate-500">
                        <FaClock className="mr-1" />
                        {module.estimatedHours}h
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                        module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {module.difficulty}
                      </span>
                      <span className="text-slate-500">{module.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    module.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    module.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {module.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-8">
        <button
          onClick={onBack}
          disabled={isSaving}
          className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="group px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaSave />
              <span>Save & Start Learning</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// Module Card Component
const ModuleCard: React.FC<{
  module: LearningModule;
  onToggle: () => void;
  onRemove: () => void;
  showRemove: boolean;
  isCustom?: boolean;
}> = ({ module, onToggle, onRemove, showRemove, isCustom = false }) => {
  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-lg ${
      module.status === 'added' 
        ? 'border-green-500/50 bg-green-500/5' 
        : 'border-slate-700/50 bg-slate-800/50 hover:border-blue-500/50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-slate-200">{module.title}</h4>
            {isCustom && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                Custom
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mb-3">{module.description}</p>
          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center">
              <FaClock className="mr-1" />
              {module.estimatedHours}h
            </span>
            <span className={`px-2 py-1 rounded-full ${
              module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
              module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}>
              {module.difficulty}
            </span>
            <span className={`px-2 py-1 rounded-full ${
              module.priority === 'high' ? 'bg-red-500/20 text-red-300' :
              module.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {module.priority}
            </span>
            <span className="text-slate-400">{module.category}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onToggle}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              module.status === 'added'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30'
            }`}
          >
            {module.status === 'added' ? 'Added' : 'Add'}
          </button>
          {showRemove && (
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Module Modal Component
const AddModuleModal: React.FC<{
  onClose: () => void;
  onAdd: (module: Omit<LearningModule, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Programming',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedHours: 10,
    skills: '',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newModuleData: Omit<LearningModule, 'id'> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      estimatedHours: formData.estimatedHours,
      prerequisites: [],
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      priority: formData.priority,
      status: 'suggested',
      subtopics: [{
        id: 'custom_1',
        title: `${formData.title} Fundamentals`,
        description: `Core concepts of ${formData.title}`,
        estimatedHours: Math.round(formData.estimatedHours * 0.6),
        resources: [
          { type: 'video', title: `${formData.title} Introduction`, duration: '1 hour', difficulty: formData.difficulty }
        ],
        status: 'pending'
      }]
    };

    onAdd(newModuleData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-700/50"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-200">Add Custom Module</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Module Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Advanced React Patterns"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 h-20 resize-none"
              placeholder="Describe what this module covers..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Programming">Programming</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="AI/ML">AI/ML</option>
                <option value="DevOps">DevOps</option>
                <option value="Product">Product</option>
                <option value="Soft Skills">Soft Skills</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g., React, State Management, Hooks"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Add Module
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LearningPathwayCreator;
