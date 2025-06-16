"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FaUser, 
  FaUpload, 
  FaGraduationCap,
  FaBriefcase,
  FaBullseye,
  FaClock,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaBrain,
  FaRocket
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Type definitions
interface PersonalInfo {
  fullName: string;
  username: string;
  dateOfBirth: string;
  currentStatus: string;
  linkedinProfile?: string;
  githubProfile?: string;
}

interface Education {
  university: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  grade: string;
  relevantCourses: string[];
}

interface WorkExperience {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface Project {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  githubLink?: string;
}

interface OnlineCourse {
  name: string;
  company: string;
  status: string;
  certificate?: File;
  verificationLink?: string;
}

interface Certification {
  title: string;
  issuer: string;
  dateObtained: string;
  verificationLink?: string;
}

interface LearningPreferences {
  pace: string;
  commitment: string;
  methods: string[];
  goals: string[];
  careerGoals: string[];
}

interface OnboardingData {
  personalInfo: PersonalInfo;
  education: Education[];
  workExperience: WorkExperience[];
  projects: Project[];
  certifications: Certification[];
  onlineCourses: OnlineCourse[];
  skills: string[];
  skillProficiencyLevels: Record<string, string>;
  learningPreferences: LearningPreferences;
  resumeFile?: File;
  transcriptFiles: File[];
}

const OnboardingPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // Neural network animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Onboarding data state
  const [data, setData] = useState<OnboardingData>({
    personalInfo: {
      fullName: '',
      username: '',
      dateOfBirth: '',
      currentStatus: '',
      linkedinProfile: '',
      githubProfile: ''
    },
    education: [],
    workExperience: [],
    projects: [],
    certifications: [],
    onlineCourses: [],
    skills: [],
    skillProficiencyLevels: {},
    learningPreferences: {
      pace: '',
      commitment: '',
      methods: [],
      goals: [],
      careerGoals: []
    },
    transcriptFiles: []
  });

  // Neural network animation
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
    const nodes: Array<{x: number, y: number, vx: number, vy: number, connections: number[]}> = [];
    const nodeCount = 25;
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: []
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
      });

      // Draw connections
      ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 + (currentStep / 6) * 0.2})`;
      ctx.lineWidth = 1;
      nodes.forEach((node, _index) => {
        node.connections.forEach(targetIndex => {
          const target = nodes[targetIndex];
          const distance = Math.sqrt((target.x - node.x) ** 2 + (target.y - node.y) ** 2);
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach((node, index) => {
        const isActive = index < (currentStep * 4);
        ctx.beginPath();
        ctx.arc(node.x, node.y, isActive ? 4 : 2, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? 
          `rgba(99, 102, 241, ${0.8 + Math.sin(Date.now() * 0.005 + index) * 0.2})` : 
          'rgba(148, 163, 184, 0.3)';
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

  // Get user ID from Supabase
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        router.push('/auth');
      }
    };
    getUserId();
  }, [router]);

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Data update functions
  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addEducation = (education: Education) => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, education]
    }));
  };

  const removeEducation = (index: number) => {
    setData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addWorkExperience = (work: WorkExperience) => {
    setData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, work]
    }));
  };

  const removeWorkExperience = (index: number) => {
    setData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  const addProject = (project: Project) => {
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, project]
    }));
  };

  const removeProject = (index: number) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const addCertification = (cert: Certification) => {
    setData(prev => ({
      ...prev,
      certifications: [...prev.certifications, cert]
    }));
  };

  const removeCertification = (index: number) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill && !data.skills.includes(skill)) {
      setData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const updateLearningPreferences = (field: keyof LearningPreferences, value: string | string[]) => {
    setData(prev => ({
      ...prev,
      learningPreferences: { ...prev.learningPreferences, [field]: value }
    }));
  };

  // File upload handlers
  const handleResumeUpload = (file: File) => {
    setData(prev => ({ ...prev, resumeFile: file }));
  };

  const handleTranscriptUpload = (files: File[]) => {
    setData(prev => ({ ...prev, transcriptFiles: [...prev.transcriptFiles, ...files] }));
  };

  // Submit function
  const submitOnboarding = async () => {
    setIsLoading(true);
    try {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: data.personalInfo.fullName,
          username: data.personalInfo.username,
          date_of_birth: data.personalInfo.dateOfBirth,
          current_status: data.personalInfo.currentStatus,
          linkedin_profile: data.personalInfo.linkedinProfile,
          github_profile: data.personalInfo.githubProfile,
          skills: data.skills,
          career_goals: data.learningPreferences.careerGoals,
          learning_goals: data.learningPreferences.goals,
          learning_pace: data.learningPreferences.pace,
          learning_commitment: data.learningPreferences.commitment,
          learning_methods: data.learningPreferences.methods,
          onboarding_completed: true
        });

      if (profileError) throw profileError;

      // Save education records
      if (data.education.length > 0) {
        const { error: educationError } = await supabase
          .from('user_education')
          .insert(data.education.map(edu => ({ ...edu, user_id: userId })));
        
        if (educationError) throw educationError;
      }

      // Save work experience
      if (data.workExperience.length > 0) {
        const { error: workError } = await supabase
          .from('user_work_experience')
          .insert(data.workExperience.map(work => ({ ...work, user_id: userId })));
        
        if (workError) throw workError;
      }

      // Save projects
      if (data.projects.length > 0) {
        const { error: projectsError } = await supabase
          .from('user_projects')
          .insert(data.projects.map(project => ({ ...project, user_id: userId })));
        
        if (projectsError) throw projectsError;
      }

      // Save online courses
      if (data.onlineCourses.length > 0) {
        const { error: coursesError } = await supabase
          .from('user_online_courses')
          .insert(data.onlineCourses.map(course => ({ ...course, user_id: userId })));
        
        if (coursesError) throw coursesError;
      }

      // Save certifications
      if (data.certifications.length > 0) {
        const { error: certsError } = await supabase
          .from('user_certifications')
          .insert(data.certifications.map(cert => ({ ...cert, user_id: userId })));
        
        if (certsError) throw certsError;
      }

      // Save skill proficiency levels
      if (Object.keys(data.skillProficiencyLevels).length > 0) {
        const skillProficiencies = Object.entries(data.skillProficiencyLevels).map(([skill, level]) => ({
          user_id: userId,
          skill_name: skill,
          proficiency_level: level
        }));
        
        const { error: skillsError } = await supabase
          .from('user_skill_proficiencies')
          .insert(skillProficiencies);
        
        if (skillsError) throw skillsError;
      }

      // Handle file uploads (resume and transcripts)
      if (data.resumeFile) {
        const fileName = `${userId}/resume_${Date.now()}.${data.resumeFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(fileName, data.resumeFile);
        
        if (uploadError) throw uploadError;
      }

      toast.success('Onboarding completed successfully!');
      router.push('/learning-pathway');
    } catch (error: unknown) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.personalInfo.fullName && data.personalInfo.username && data.personalInfo.currentStatus;
      case 2:
        return data.education.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return data.skills.length > 0;
      case 5:
        return data.learningPreferences.pace && data.learningPreferences.commitment;
      default:
        return true;
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: FaUser },
    { number: 2, title: 'Education', icon: FaGraduationCap },
    { number: 3, title: 'Experience', icon: FaBriefcase },
    { number: 4, title: 'Skills', icon: FaBrain },
    { number: 5, title: 'Goals', icon: FaBullseye },
    { number: 6, title: 'Review', icon: FaCheckCircle }
  ];

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
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div 
          className="p-6 text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="text-slate-200">Edu</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Flix</span>
          </h1>
          <p className="text-slate-400 text-lg">Neural Learning Profile Setup</p>
          <div className="h-0.5 w-24 mx-auto mt-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="px-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <motion.div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent text-white'
                        : 'border-slate-600 text-slate-400 bg-slate-800/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentStep > step.number ? (
                      <FaCheckCircle className="text-lg" />
                    ) : (
                      <step.icon className="text-lg" />
                    )}
                    {currentStep >= step.number && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 transition-colors duration-500 ${
                      currentStep > step.number 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                        : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium">{steps[currentStep - 1]?.title}</p>
              <p className="text-slate-500 text-sm">Step {currentStep} of {steps.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Step Content */}
        <div className="flex-1 px-6 pb-6">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/50"
              >
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                  <PersonalInfoStep 
                    data={data.personalInfo}
                    updateData={updatePersonalInfo}
                    onResumeUpload={handleResumeUpload}
                    onTranscriptUpload={handleTranscriptUpload}
                    resumeFile={data.resumeFile}
                    transcriptFiles={data.transcriptFiles}
                  />
                )}

                {/* Step 2: Education */}
                {currentStep === 2 && (
                  <EducationStep 
                    education={data.education}
                    addEducation={addEducation}
                    removeEducation={removeEducation}
                  />
                )}

                {/* Step 3: Work Experience & Projects */}
                {currentStep === 3 && (
                  <ExperienceStep 
                    workExperience={data.workExperience}
                    projects={data.projects}
                    addWorkExperience={addWorkExperience}
                    removeWorkExperience={removeWorkExperience}
                    addProject={addProject}
                    removeProject={removeProject}
                  />
                )}

                {/* Step 4: Skills & Certifications */}
                {currentStep === 4 && (
                  <SkillsStep 
                    skills={data.skills}
                    certifications={data.certifications}
                    addSkill={addSkill}
                    removeSkill={removeSkill}
                    addCertification={addCertification}
                    removeCertification={removeCertification}
                  />
                )}

                {/* Step 5: Learning Preferences & Goals */}
                {currentStep === 5 && (
                  <GoalsStep 
                    preferences={data.learningPreferences}
                    updatePreferences={updateLearningPreferences}
                  />
                )}

                {/* Step 6: Review & Submit */}
                {currentStep === 6 && (
                  <ReviewStep 
                    data={data}
                    onSubmit={submitOnboarding}
                    isLoading={isLoading}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <motion.div 
          className="p-6 border-t border-slate-700/50"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <motion.button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                currentStep === 1
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
              whileHover={currentStep > 1 ? { scale: 1.02 } : {}}
              whileTap={currentStep > 1 ? { scale: 0.98 } : {}}
            >
              <FaArrowLeft />
              <span>Previous</span>
            </motion.button>

            <div className="text-center">
              <p className="text-slate-400 text-sm">
                {currentStep < 6 ? `${currentStep} of ${steps.length} steps` : 'Ready to complete'}
              </p>
            </div>

            {currentStep < 6 ? (
              <motion.button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  canProceed()
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                whileHover={canProceed() ? { scale: 1.02 } : {}}
                whileTap={canProceed() ? { scale: 0.98 } : {}}
              >
                <span>Next</span>
                <FaArrowRight />
              </motion.button>
            ) : (
              <motion.button
                onClick={submitOnboarding}
                disabled={isLoading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg disabled:opacity-70"
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <FaRocket />
                    <span>Complete Setup</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Step Components
interface PersonalInfoStepProps {
  data: PersonalInfo;
  updateData: (field: keyof PersonalInfo, value: string) => void;
  onResumeUpload: (file: File) => void;
  onTranscriptUpload: (files: File[]) => void;
  resumeFile?: File;
  transcriptFiles: File[];
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ 
  data, 
  updateData, 
  onResumeUpload, 
  onTranscriptUpload, 
  resumeFile, 
  transcriptFiles 
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'transcript') => {
    const files = event.target.files;
    if (!files) return;

    if (type === 'resume') {
      onResumeUpload(files[0]);
    } else {
      onTranscriptUpload(Array.from(files));
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Tell us about yourself</h2>
        <p className="text-slate-400">Let&apos;s start building your AI learning profile</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-3">Full Name *</label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => updateData('fullName', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            placeholder="Enter your full name"
            required
          />
        </motion.div>

        {/* Username */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-3">Username *</label>
          <input
            type="text"
            value={data.username}
            onChange={(e) => updateData('username', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            placeholder="Choose a username"
            required
          />
        </motion.div>

        {/* Date of Birth */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-3">Date of Birth</label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => updateData('dateOfBirth', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
          />
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-3">Current Status *</label>
          <select
            value={data.currentStatus}
            onChange={(e) => updateData('currentStatus', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            required
          >
            <option value="">Select your current status</option>
            <option value="student">Student</option>
            <option value="professional">Working Professional</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="career_changer">Career Changer</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </motion.div>

        {/* LinkedIn Profile */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-3">LinkedIn Profile</label>
          <input
            type="url"
            value={data.linkedinProfile}
            onChange={(e) => updateData('linkedinProfile', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            placeholder="https://linkedin.com/in/your-profile"
          />
        </motion.div>

        {/* GitHub Profile */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-3">GitHub Profile</label>
          <input
            type="url"
            value={data.githubProfile}
            onChange={(e) => updateData('githubProfile', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            placeholder="https://github.com/your-username"
          />
        </motion.div>
      </div>

      {/* File Uploads */}
      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-semibold text-white">Documents (Optional)</h3>
        
        {/* Resume Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-blue-400/50 transition-colors duration-300"
        >
          <FaUpload className="mx-auto text-3xl text-slate-400 mb-4" />
          <p className="text-slate-300 mb-2">Upload Resume</p>
          <p className="text-slate-500 text-sm mb-4">PDF, DOC, or DOCX format</p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, 'resume')}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Choose File
          </label>
          {resumeFile && (
            <p className="mt-2 text-green-400 text-sm">✓ {resumeFile.name}</p>
          )}
        </motion.div>

        {/* Transcript Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-blue-400/50 transition-colors duration-300"
        >
          <FaUpload className="mx-auto text-3xl text-slate-400 mb-4" />
          <p className="text-slate-300 mb-2">Upload Transcripts</p>
          <p className="text-slate-500 text-sm mb-4">Multiple files allowed</p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            onChange={(e) => handleFileUpload(e, 'transcript')}
            className="hidden"
            id="transcript-upload"
          />
          <label
            htmlFor="transcript-upload"
            className="inline-block px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer"
          >
            Choose Files
          </label>
          {transcriptFiles.length > 0 && (
            <div className="mt-2 text-green-400 text-sm">
              ✓ {transcriptFiles.length} file(s) selected
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

interface EducationStepProps {
  education: Education[];
  addEducation: (education: Education) => void;
  removeEducation: (index: number) => void;
}

const EducationStep: React.FC<EducationStepProps> = ({ education, addEducation, removeEducation }) => {
  const [currentEducation, setCurrentEducation] = useState<Education>({
    university: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: '',
    grade: '',
    relevantCourses: []
  });
  const [currentCourse, setCurrentCourse] = useState('');

  const handleAddEducation = () => {
    if (currentEducation.university && currentEducation.degree && currentEducation.fieldOfStudy) {
      addEducation(currentEducation);
      setCurrentEducation({
        university: '',
        degree: '',
        fieldOfStudy: '',
        graduationYear: '',
        grade: '',
        relevantCourses: []
      });
    }
  };

  const addCourse = () => {
    if (currentCourse.trim()) {
      setCurrentEducation({
        ...currentEducation,
        relevantCourses: [...currentEducation.relevantCourses, currentCourse.trim()]
      });
      setCurrentCourse('');
    }
  };

  const removeCourse = (index: number) => {
    setCurrentEducation({
      ...currentEducation,
      relevantCourses: currentEducation.relevantCourses.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Education Background</h2>
        <p className="text-slate-400">Tell us about your academic journey</p>
      </motion.div>

      {/* Add Education Form */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Add Education</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">University/Institution *</label>
            <input
              type="text"
              value={currentEducation.university}
              onChange={(e) => setCurrentEducation({...currentEducation, university: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="University name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Degree *</label>
            <select
              value={currentEducation.degree}
              onChange={(e) => setCurrentEducation({...currentEducation, degree: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            >
              <option value="">Select degree</option>
              <option value="High School">High School Diploma</option>
              <option value="Certificate">Certificate</option>
              <option value="Associate">Associate Degree</option>
              <option value="Bachelor">Bachelor&apos;s Degree</option>
              <option value="Master">Master&apos;s Degree</option>
              <option value="PhD">PhD</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Field of Study *</label>
            <input
              type="text"
              value={currentEducation.fieldOfStudy}
              onChange={(e) => setCurrentEducation({...currentEducation, fieldOfStudy: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Computer Science, Business, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Graduation Year</label>
            <input
              type="text"
              value={currentEducation.graduationYear}
              onChange={(e) => setCurrentEducation({...currentEducation, graduationYear: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="2024"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Grade/GPA</label>
            <input
              type="text"
              value={currentEducation.grade}
              onChange={(e) => setCurrentEducation({...currentEducation, grade: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="3.8 GPA, First Class, etc."
            />
          </div>
        </div>

        {/* Relevant Courses */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Relevant Courses</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentCourse}
              onChange={(e) => setCurrentCourse(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCourse()}
              className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Add a course"
            />
            <button
              onClick={addCourse}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaPlus />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentEducation.relevantCourses.map((course, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
              >
                {course}
                <button onClick={() => removeCourse(index)} className="hover:text-red-400">
                  <FaTimes />
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddEducation}
          disabled={!currentEducation.university || !currentEducation.degree || !currentEducation.fieldOfStudy}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Education
        </button>
      </div>

      {/* Education List */}
      {education.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Added Education</h3>
          {education.map((edu, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 flex justify-between items-start"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-white">{edu.degree} in {edu.fieldOfStudy}</h4>
                <p className="text-slate-300">{edu.university}</p>
                {edu.graduationYear && <p className="text-slate-400 text-sm">Graduated: {edu.graduationYear}</p>}
                {edu.grade && <p className="text-slate-400 text-sm">Grade: {edu.grade}</p>}
                {edu.relevantCourses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {edu.relevantCourses.map((course, courseIndex) => (
                      <span key={courseIndex} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {course}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeEducation(index)}
                className="text-red-400 hover:text-red-300 ml-4"
              >
                <FaTimes />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ExperienceStepProps {
  workExperience: WorkExperience[];
  projects: Project[];
  addWorkExperience: (work: WorkExperience) => void;
  removeWorkExperience: (index: number) => void;
  addProject: (project: Project) => void;
  removeProject: (index: number) => void;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({
  workExperience,
  projects,
  addWorkExperience,
  removeWorkExperience,
  addProject,
  removeProject
}) => {
  const [currentWork, setCurrentWork] = useState<WorkExperience>({
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    current: false
  });

  const [currentProject, setCurrentProject] = useState<Project>({
    title: '',
    description: '',
    technologies: [],
    link: '',
    githubLink: ''
  });

  const [currentTech, setCurrentTech] = useState('');

  const handleAddWork = () => {
    if (currentWork.company && currentWork.position) {
      addWorkExperience(currentWork);
      setCurrentWork({
        company: '',
        position: '',
        description: '',
        startDate: '',
        endDate: '',
        current: false
      });
    }
  };

  const handleAddProject = () => {
    if (currentProject.title && currentProject.description) {
      addProject(currentProject);
      setCurrentProject({
        title: '',
        description: '',
        technologies: [],
        link: '',
        githubLink: ''
      });
    }
  };

  const addTechnology = () => {
    if (currentTech.trim() && !currentProject.technologies.includes(currentTech.trim())) {
      setCurrentProject({
        ...currentProject,
        technologies: [...currentProject.technologies, currentTech.trim()]
      });
      setCurrentTech('');
    }
  };

  const removeTechnology = (tech: string) => {
    setCurrentProject({
      ...currentProject,
      technologies: currentProject.technologies.filter(t => t !== tech)
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Experience & Projects</h2>
        <p className="text-slate-400">Share your professional journey and showcase your work</p>
      </motion.div>

      {/* Work Experience Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Work Experience</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
            <input
              type="text"
              value={currentWork.company}
              onChange={(e) => setCurrentWork({...currentWork, company: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
            <input
              type="text"
              value={currentWork.position}
              onChange={(e) => setCurrentWork({...currentWork, position: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Job title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              value={currentWork.startDate}
              onChange={(e) => setCurrentWork({...currentWork, startDate: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              value={currentWork.endDate}
              onChange={(e) => setCurrentWork({...currentWork, endDate: e.target.value})}
              disabled={currentWork.current}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 disabled:opacity-50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center text-slate-300 mb-4">
              <input
                type="checkbox"
                checked={currentWork.current}
                onChange={(e) => setCurrentWork({...currentWork, current: e.target.checked, endDate: e.target.checked ? '' : currentWork.endDate})}
                className="mr-2 rounded"
              />
              Currently working here
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={currentWork.description}
              onChange={(e) => setCurrentWork({...currentWork, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Describe your role and achievements..."
            />
          </div>
        </div>

        <button
          onClick={handleAddWork}
          disabled={!currentWork.company || !currentWork.position}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Work Experience
        </button>
      </div>

      {/* Projects Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Projects</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project Title</label>
            <input
              type="text"
              value={currentProject.title}
              onChange={(e) => setCurrentProject({...currentProject, title: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={currentProject.description}
              onChange={(e) => setCurrentProject({...currentProject, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Describe your project..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Technologies Used</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={currentTech}
                onChange={(e) => setCurrentTech(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTechnology()}
                className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
                placeholder="Add technology"
              />
              <button
                onClick={addTechnology}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaPlus />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentProject.technologies.map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm"
                >
                  {tech}
                  <button onClick={() => removeTechnology(tech)} className="hover:text-red-400">
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Live Demo Link</label>
              <input
                type="url"
                value={currentProject.link}
                onChange={(e) => setCurrentProject({...currentProject, link: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
                placeholder="https://your-project.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">GitHub Repository</label>
              <input
                type="url"
                value={currentProject.githubLink}
                onChange={(e) => setCurrentProject({...currentProject, githubLink: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
                placeholder="https://github.com/username/repo"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleAddProject}
          disabled={!currentProject.title || !currentProject.description}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Project
        </button>
      </div>

      {/* Display Added Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Experience List */}
        {workExperience.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Work Experience</h3>
            <div className="space-y-3">
              {workExperience.map((work, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{work.position}</h4>
                    <p className="text-slate-300">{work.company}</p>
                    <p className="text-slate-400 text-sm">
                      {work.startDate} - {work.current ? 'Present' : work.endDate}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWorkExperience(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FaTimes />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Projects List */}
        {projects.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Projects</h3>
            <div className="space-y-3">
              {projects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{project.title}</h4>
                    <p className="text-slate-400 text-sm mb-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech, techIndex) => (
                        <span key={techIndex} className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs">
                          +{project.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeProject(index)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    <FaTimes />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SkillsStepProps {
  skills: string[];
  certifications: Certification[];
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addCertification: (cert: Certification) => void;
  removeCertification: (index: number) => void;
}

const SkillsStep: React.FC<SkillsStepProps> = ({
  skills,
  certifications,
  addSkill,
  removeSkill,
  addCertification,
  removeCertification
}) => {
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentCert, setCurrentCert] = useState<Certification>({
    title: '',
    issuer: '',
    dateObtained: '',
    verificationLink: ''
  });

  const handleAddSkill = () => {
    if (currentSkill.trim()) {
      addSkill(currentSkill.trim());
      setCurrentSkill('');
    }
  };

  const handleAddCertification = () => {
    if (currentCert.title && currentCert.issuer) {
      addCertification(currentCert);
      setCurrentCert({
        title: '',
        issuer: '',
        dateObtained: '',
        verificationLink: ''
      });
    }
  };

  const suggestedSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'SQL',
    'Machine Learning', 'Data Analysis', 'Project Management', 'Leadership',
    'Communication', 'Problem Solving', 'Critical Thinking', 'Team Collaboration'
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Skills & Certifications</h2>
        <p className="text-slate-400">Tell us about your expertise and achievements</p>
      </motion.div>

      {/* Skills Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Skills</h3>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={currentSkill}
            onChange={(e) => setCurrentSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            placeholder="Add a skill"
          />
          <button
            onClick={handleAddSkill}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <FaPlus />
          </button>
        </div>

        {/* Suggested Skills */}
        <div className="mb-6">
          <p className="text-slate-300 text-sm mb-3">Suggested skills:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedSkills.filter(skill => !skills.includes(skill)).map((skill) => (
              <button
                key={skill}
                onClick={() => addSkill(skill)}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Added Skills */}
        {skills.length > 0 && (
          <div>
            <p className="text-slate-300 text-sm mb-3">Your skills:</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-400">
                    <FaTimes />
                  </button>
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certifications Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Certifications</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Certification Title</label>
            <input
              type="text"
              value={currentCert.title}
              onChange={(e) => setCurrentCert({...currentCert, title: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="AWS Solutions Architect, Google Analytics, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Issuing Organization</label>
            <input
              type="text"
              value={currentCert.issuer}
              onChange={(e) => setCurrentCert({...currentCert, issuer: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Amazon, Google, Microsoft, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date Obtained</label>
            <input
              type="date"
              value={currentCert.dateObtained}
              onChange={(e) => setCurrentCert({...currentCert, dateObtained: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Verification Link</label>
            <input
              type="url"
              value={currentCert.verificationLink}
              onChange={(e) => setCurrentCert({...currentCert, verificationLink: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
              placeholder="Verification URL (optional)"
            />
          </div>
        </div>

        <button
          onClick={handleAddCertification}
          disabled={!currentCert.title || !currentCert.issuer}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Certification
        </button>
      </div>

      {/* Certifications List */}
      {certifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Added Certifications</h3>
          {certifications.map((cert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 flex justify-between items-start"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-white">{cert.title}</h4>
                <p className="text-slate-300">{cert.issuer}</p>
                {cert.dateObtained && <p className="text-slate-400 text-sm">Obtained: {cert.dateObtained}</p>}
                {cert.verificationLink && (
                  <a
                    href={cert.verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm hover:text-blue-300 inline-flex items-center gap-1 mt-1"
                  >
                    View Certificate <FaArrowRight className="text-xs" />
                  </a>
                )}
              </div>
              <button
                onClick={() => removeCertification(index)}
                className="text-red-400 hover:text-red-300 ml-4"
              >
                <FaTimes />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

interface GoalsStepProps {
  preferences: LearningPreferences;
  updatePreferences: (field: keyof LearningPreferences, value: string | string[]) => void;
}

const GoalsStep: React.FC<GoalsStepProps> = ({ preferences, updatePreferences }) => {
  const [currentGoal, setCurrentGoal] = useState('');
  const [currentCareerGoal, setCurrentCareerGoal] = useState('');

  const addGoal = () => {
    if (currentGoal.trim() && !preferences.goals.includes(currentGoal.trim())) {
      updatePreferences('goals', [...preferences.goals, currentGoal.trim()]);
      setCurrentGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    updatePreferences('goals', preferences.goals.filter(g => g !== goal));
  };

  const addCareerGoal = () => {
    if (currentCareerGoal.trim() && !preferences.careerGoals.includes(currentCareerGoal.trim())) {
      updatePreferences('careerGoals', [...preferences.careerGoals, currentCareerGoal.trim()]);
      setCurrentCareerGoal('');
    }
  };

  const removeCareerGoal = (goal: string) => {
    updatePreferences('careerGoals', preferences.careerGoals.filter(g => g !== goal));
  };

  const toggleMethod = (method: string) => {
    const methods = preferences.methods.includes(method)
      ? preferences.methods.filter(m => m !== method)
      : [...preferences.methods, method];
    updatePreferences('methods', methods);
  };

  const learningMethods = [
    'Video Lectures',
    'Interactive Tutorials',
    'Hands-on Projects',
    'Reading Materials',
    'Live Sessions',
    'Peer Collaboration',
    'Practice Exercises',
    'Case Studies'
  ];

  const suggestedGoals = [
    'Learn a new programming language',
    'Master data science',
    'Improve problem-solving skills',
    'Build portfolio projects',
    'Prepare for certifications',
    'Advance career prospects'
  ];

  const suggestedCareerGoals = [
    'Software Engineer',
    'Data Scientist',
    'Product Manager',
    'DevOps Engineer',
    'UI/UX Designer',
    'Machine Learning Engineer',
    'Cybersecurity Specialist',
    'Cloud Architect'
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Learning Goals & Preferences</h2>
        <p className="text-slate-400">Help us personalize your learning experience</p>
      </motion.div>

      {/* Learning Pace */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Learning Pace</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Slow and Steady', 'Moderate', 'Fast Track'].map((pace) => (
            <motion.button
              key={pace}
              onClick={() => updatePreferences('pace', pace)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                preferences.pace === pace
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-slate-600 bg-slate-800/30 text-slate-300 hover:border-slate-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <FaClock className="mx-auto text-2xl mb-2" />
                <p className="font-medium">{pace}</p>
                <p className="text-sm opacity-70 mt-1">
                  {pace === 'Slow and Steady' && '1-2 hours/day'}
                  {pace === 'Moderate' && '2-4 hours/day'}
                  {pace === 'Fast Track' && '4+ hours/day'}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Weekly Commitment */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Weekly Time Commitment</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['5-10 hours', '10-15 hours', '15-20 hours', '20+ hours'].map((commitment) => (
            <motion.button
              key={commitment}
              onClick={() => updatePreferences('commitment', commitment)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                preferences.commitment === commitment
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                  : 'border-slate-600 bg-slate-800/30 text-slate-300 hover:border-slate-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <p className="font-medium">{commitment}</p>
                <p className="text-xs opacity-70 mt-1">per week</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Learning Methods */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Preferred Learning Methods</h3>
        <p className="text-slate-400 text-sm mb-4">Select all that apply:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {learningMethods.map((method) => (
            <motion.button
              key={method}
              onClick={() => toggleMethod(method)}
              className={`p-3 rounded-lg border transition-all duration-300 text-sm ${
                preferences.methods.includes(method)
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-slate-600 bg-slate-800/30 text-slate-300 hover:border-slate-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {method}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Learning Goals */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Learning Goals</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={currentGoal}
            onChange={(e) => setCurrentGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            placeholder="Add a learning goal"
          />
          <button
            onClick={addGoal}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <FaPlus />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-slate-300 text-sm mb-3">Suggested goals:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedGoals.filter(goal => !preferences.goals.includes(goal)).map((goal) => (
              <button
                key={goal}
                onClick={() => updatePreferences('goals', [...preferences.goals, goal])}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300"
              >
                + {goal}
              </button>
            ))}
          </div>
        </div>

        {preferences.goals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {preferences.goals.map((goal) => (
              <span
                key={goal}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30"
              >
                {goal}
                <button onClick={() => removeGoal(goal)} className="hover:text-red-400">
                  <FaTimes />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Career Goals */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-white mb-6">Career Goals</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={currentCareerGoal}
            onChange={(e) => setCurrentCareerGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCareerGoal()}
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300"
            placeholder="Add a career goal"
          />
          <button
            onClick={addCareerGoal}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
          >
            <FaPlus />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-slate-300 text-sm mb-3">Popular career paths:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedCareerGoals.filter(goal => !preferences.careerGoals.includes(goal)).map((goal) => (
              <button
                key={goal}
                onClick={() => updatePreferences('careerGoals', [...preferences.careerGoals, goal])}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300"
              >
                + {goal}
              </button>
            ))}
          </div>
        </div>

        {preferences.careerGoals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {preferences.careerGoals.map((goal) => (
              <span
                key={goal}
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm border border-purple-500/30"
              >
                {goal}
                <button onClick={() => removeCareerGoal(goal)} className="hover:text-red-400">
                  <FaTimes />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ReviewStepProps {
  data: OnboardingData;
  onSubmit: () => void;
  isLoading: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data, onSubmit, isLoading }) => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Review Your Profile</h2>
        <p className="text-slate-400">Make sure everything looks good before we create your learning plan</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaUser className="text-blue-400" />
            Personal Information
          </h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-slate-400">Name:</span> <span className="text-white">{data.personalInfo.fullName}</span></div>
            <div><span className="text-slate-400">Username:</span> <span className="text-white">{data.personalInfo.username}</span></div>
            <div><span className="text-slate-400">Status:</span> <span className="text-white">{data.personalInfo.currentStatus}</span></div>
            {data.personalInfo.dateOfBirth && (
              <div><span className="text-slate-400">Date of Birth:</span> <span className="text-white">{data.personalInfo.dateOfBirth}</span></div>
            )}
            {data.personalInfo.linkedinProfile && (
              <div><span className="text-slate-400">LinkedIn:</span> <span className="text-blue-400">{data.personalInfo.linkedinProfile}</span></div>
            )}
            {data.personalInfo.githubProfile && (
              <div><span className="text-slate-400">GitHub:</span> <span className="text-blue-400">{data.personalInfo.githubProfile}</span></div>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaGraduationCap className="text-green-400" />
            Education ({data.education.length})
          </h3>
          <div className="space-y-3">
            {data.education.map((edu, index) => (
              <div key={index} className="border-l-2 border-green-400/30 pl-3">
                <p className="text-white font-medium">{edu.degree} in {edu.fieldOfStudy}</p>
                <p className="text-slate-400 text-sm">{edu.university}</p>
                {edu.graduationYear && <p className="text-slate-500 text-xs">{edu.graduationYear}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Work Experience */}
        {data.workExperience.length > 0 && (
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaBriefcase className="text-purple-400" />
              Work Experience ({data.workExperience.length})
            </h3>
            <div className="space-y-3">
              {data.workExperience.map((work, index) => (
                <div key={index} className="border-l-2 border-purple-400/30 pl-3">
                  <p className="text-white font-medium">{work.position}</p>
                  <p className="text-slate-400 text-sm">{work.company}</p>
                  <p className="text-slate-500 text-xs">{work.startDate} - {work.current ? 'Present' : work.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaRocket className="text-pink-400" />
              Projects ({data.projects.length})
            </h3>
            <div className="space-y-3">
              {data.projects.map((project, index) => (
                <div key={index} className="border-l-2 border-pink-400/30 pl-3">
                  <p className="text-white font-medium">{project.title}</p>
                  <p className="text-slate-400 text-sm mb-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech, techIndex) => (
                      <span key={techIndex} className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs">
                        +{project.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaBrain className="text-orange-400" />
            Skills ({data.skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-cyan-400" />
              Certifications ({data.certifications.length})
            </h3>
            <div className="space-y-3">
              {data.certifications.map((cert, index) => (
                <div key={index} className="border-l-2 border-cyan-400/30 pl-3">
                  <p className="text-white font-medium">{cert.title}</p>
                  <p className="text-slate-400 text-sm">{cert.issuer}</p>
                  {cert.dateObtained && <p className="text-slate-500 text-xs">{cert.dateObtained}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Preferences */}
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 lg:col-span-2">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaBullseye className="text-indigo-400" />
            Learning Preferences & Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-2">Learning Pace:</p>
              <p className="text-white">{data.learningPreferences.pace}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Weekly Commitment:</p>
              <p className="text-white">{data.learningPreferences.commitment}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Preferred Methods:</p>
              <div className="flex flex-wrap gap-1">
                {data.learningPreferences.methods.map((method, index) => (
                  <span key={index} className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                    {method}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Learning Goals:</p>
              <div className="flex flex-wrap gap-1">
                {data.learningPreferences.goals.map((goal, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-400 text-sm mb-2">Career Goals:</p>
              <div className="flex flex-wrap gap-1">
                {data.learningPreferences.careerGoals.map((goal, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20"
        >
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Your AI Learning Journey?</h3>
          <p className="text-slate-400 mb-6">
            Our NJAN neural network will analyze your profile and create a personalized learning pathway just for you.
          </p>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="px-12 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-semibold rounded-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Creating Your Profile...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <FaRocket />
                <span>Launch My Learning Journey</span>
              </div>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;
