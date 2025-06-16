"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  FaEdit, FaShare, FaDownload, FaLock, 
  FaRocket, FaCalendarAlt, FaCode, FaGraduationCap,
  FaBriefcase, FaProjectDiagram, FaCertificate,
  FaLightbulb, FaUniversity, FaBookOpen, FaLinkedin,
  FaBuilding, FaFileAlt, FaTools, FaHeart, FaGithub,
  FaTrophy, FaCheckCircle, FaExternalLinkAlt
} from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

// Supabase data structures matching the database schema
interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  date_of_birth: string | null;
  current_status: string;
  linkedin_profile: string | null;
  github_profile: string | null;
  skills: string[];
  career_goals: string[];
  learning_goals: string[];
  learning_pace: string | null;
  learning_commitment: string | null;
  learning_methods: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface UserEducation {
  id: string;
  user_id: string;
  university: string;
  degree: string;
  field_of_study: string;
  graduation_year: string | null;
  grade: string | null;
  relevant_courses: string[];
  created_at: string;
}

interface UserWorkExperience {
  id: string;
  user_id: string;
  company: string;
  position: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  current: boolean;
  created_at: string;
}

interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description: string;
  technologies: string[];
  link: string | null;
  github_link: string | null;
  created_at: string;
}

interface UserCertification {
  id: string;
  user_id: string;
  title: string;
  issuer: string;
  date_obtained: string | null;
  verification_link: string | null;
  created_at: string;
}

interface UserOnlineCourse {
  id: string;
  user_id: string;
  name: string;
  company: string;
  status: string;
  verification_link: string | null;
  created_at: string;
}

interface UserSkillProficiency {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: string;
  created_at: string;
}

interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface CompleteUserProfile {
  profile: UserProfile;
  education: UserEducation[];
  workExperience: UserWorkExperience[];
  projects: UserProject[];
  certifications: UserCertification[];
  onlineCourses: UserOnlineCourse[];
  skillProficiencies: UserSkillProficiency[];
  documents: UserDocument[];
}

const SkillProgress = ({ skill, value }: { skill: string; value: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: Math.random() * 0.3, duration: 0.5 }}
    className="relative group bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
  >
    <div className="w-20 h-20 mx-auto mb-3">
      <CircularProgressbar
        value={value}
        text={`${value}%`}
        styles={buildStyles({
          textColor: value >= 80 ? '#059669' : value >= 60 ? '#D97706' : '#2563EB',
          trailColor: '#F3F4F6',
          pathColor: value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#3B82F6',
          backgroundColor: 'transparent',
          textSize: '14px',
          pathTransition: 'stroke-dasharray 0.5s ease 0s',
        })}
      />
    </div>
    <p className="text-center text-sm font-semibold text-gray-800">{skill}</p>
    <div className="mt-2 text-center">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        value >= 80 ? 'bg-emerald-100 text-emerald-800' :
        value >= 60 ? 'bg-amber-100 text-amber-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {value >= 80 ? 'Expert' : value >= 60 ? 'Advanced' : value >= 40 ? 'Intermediate' : 'Beginner'}
      </span>
    </div>
  </motion.div>
);

export default function MyProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<CompleteUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchCompleteUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError("Authentication error");
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('No authenticated user found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        const userId = session.user.id;
        console.log('Fetching data for user:', userId);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError);
          setError("Failed to load profile");
          setLoading(false);
          return;
        }

        // Fetch all related data in parallel
        const [
          { data: education },
          { data: workExperience },
          { data: projects },
          { data: certifications },
          { data: onlineCourses },
          { data: skillProficiencies },
          { data: documents }
        ] = await Promise.all([
          supabase.from('user_education').select('*').eq('user_id', userId),
          supabase.from('user_work_experience').select('*').eq('user_id', userId),
          supabase.from('user_projects').select('*').eq('user_id', userId),
          supabase.from('user_certifications').select('*').eq('user_id', userId),
          supabase.from('user_online_courses').select('*').eq('user_id', userId),
          supabase.from('user_skill_proficiencies').select('*').eq('user_id', userId),
          supabase.from('user_documents').select('*').eq('user_id', userId)
        ]);

        // Create default profile if none exists
        const userProfile: UserProfile = profile || {
          id: '',
          user_id: userId,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          username: session.user.email?.split('@')[0] || 'user',
          date_of_birth: null,
          current_status: 'New User',
          linkedin_profile: null,
          github_profile: null,
          skills: [],
          career_goals: [],
          learning_goals: [],
          learning_pace: null,
          learning_commitment: null,
          learning_methods: [],
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Combine all data
        const completeUserData: CompleteUserProfile = {
          profile: userProfile,
          education: education || [],
          workExperience: workExperience || [],
          projects: projects || [],
          certifications: certifications || [],
          onlineCourses: onlineCourses || [],
          skillProficiencies: skillProficiencies || [],
          documents: documents || []
        };

        console.log('Complete user data:', completeUserData);
        setUserData(completeUserData);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    fetchCompleteUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"
          />
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExternalLinkAlt className="text-red-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-gray-600 bg-white rounded-2xl shadow-xl p-8">
          <p className="text-center">No profile data found</p>
        </div>
      </div>
    );
  }

  const { profile, education, workExperience, projects, certifications, onlineCourses, skillProficiencies, documents } = userData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/home')}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              EduFlix AI
            </button>
            <div className="flex items-center space-x-3">
              <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group">
                <FaShare className="text-gray-600 group-hover:text-blue-600 transition-colors" />
              </button>
              <button 
                onClick={() => setEditMode(!editMode)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
              >
                <FaEdit />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section - Personal Overview */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8 relative overflow-hidden"
        >
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100 via-purple-50 to-transparent rounded-full transform translate-x-48 -translate-y-48"></div>
          
          <div className="relative">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
              <div className="flex items-center space-x-8 mb-6 lg:mb-0">
                {/* Profile Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                    {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <FaCheckCircle className="text-white text-sm" />
                  </div>
                </div>
                
                {/* Personal Info */}
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.full_name}</h1>
                  <p className="text-xl text-blue-600 font-semibold mb-1">@{profile.username}</p>
                  <p className="text-lg text-gray-600 mb-4">{profile.current_status}</p>
                  
                  {/* Meta Information */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    {profile.date_of_birth && (
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className="text-blue-500" />
                        <span>Born {new Date(profile.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="text-green-500" />
                      <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center space-x-4">
                    {profile.linkedin_profile && (
                      <a
                        href={profile.linkedin_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        <FaLinkedin />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profile.github_profile && (
                      <a
                        href={profile.github_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                      >
                        <FaGithub />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                {documents.some(doc => doc.document_type === 'resume') && (
                  <button className="flex items-center space-x-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors shadow-md">
                    <FaDownload />
                    <span>Download Resume</span>
                  </button>
                )}
                {documents.some(doc => doc.document_type === 'transcript') && (
                  <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors shadow-md">
                    <FaLock />
                    <span>View Transcripts</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Stats */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{skillProficiencies.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Skills Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{projects.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{certifications.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Certifications</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{onlineCourses.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Courses</div>
                </div>
              </div>
            </div>

            {/* Documents Information */}
            {documents.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FaFileAlt className="mr-3 text-blue-600" />
                  Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.filter(doc => doc.document_type === 'resume').map((doc) => (
                    <div key={doc.id} className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <FaFileAlt className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Resume</h4>
                          <p className="text-sm text-gray-600">{doc.file_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {documents.filter(doc => doc.document_type === 'transcript').length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <FaGraduationCap className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Transcripts ({documents.filter(doc => doc.document_type === 'transcript').length})
                          </h4>
                          <p className="text-sm text-gray-600">Academic records</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Education Section */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <FaUniversity className="text-blue-600 text-xl" />
                  </div>
                  Education
                </h2>
                {education.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {education.length} {education.length === 1 ? 'School' : 'Schools'}
                  </span>
                )}
              </div>
              
              {education.length > 0 ? (
                <div className="space-y-6">
                  {education.map((edu, index) => (
                    <motion.div
                      key={edu.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300"
                    >
                      {/* Timeline connector */}
                      {index < education.length - 1 && (
                        <div className="absolute left-6 bottom-0 w-0.5 h-6 bg-blue-200 transform translate-y-full"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaGraduationCap className="text-white text-lg" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {edu.degree} in {edu.field_of_study}
                          </h3>
                          <p className="text-blue-600 font-semibold text-lg mb-3">{edu.university}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <FaCalendarAlt className="text-gray-500" />
                              <span className="text-gray-700 font-medium">
                                {edu.graduation_year || 'In Progress'}
                              </span>
                            </div>
                            {edu.grade && (
                              <div className="flex items-center space-x-2">
                                <FaTrophy className="text-yellow-500" />
                                <span className="text-gray-700 font-medium">{edu.grade}</span>
                              </div>
                            )}
                          </div>
                          
                          {edu.relevant_courses?.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-2">Relevant Courses</p>
                              <div className="flex flex-wrap gap-2">
                                {edu.relevant_courses.map((course, courseIndex) => (
                                  <span 
                                    key={courseIndex} 
                                    className="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-medium"
                                  >
                                    {course}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaUniversity className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Education Added</h3>
                  <p className="text-gray-600 mb-4">Complete your onboarding to add education details</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                    Add Education
                  </button>
                </div>
              )}
            </motion.section>

            {/* Skills & Expertise */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                    <FaCode className="text-emerald-600 text-xl" />
                  </div>
                  Skills & Proficiencies
                </h2>
                {(profile.skills?.length || 0) + skillProficiencies.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    {(profile.skills?.length || 0) + skillProficiencies.length} Skills
                  </span>
                )}
              </div>
              
              {/* User Skills from Profile */}
              {profile.skills?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FaRocket className="mr-2 text-blue-500" />
                    Your Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {profile.skills.map((skill, index) => (
                      <motion.span 
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Proficiencies */}
              {skillProficiencies.length > 0 ? (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <FaTools className="mr-2 text-emerald-500" />
                    Skill Proficiencies
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {skillProficiencies.map((skill) => {
                      // Convert proficiency level to percentage
                      const getSkillValue = (level: string): number => {
                        switch (level.toLowerCase()) {
                          case 'beginner': return 25;
                          case 'intermediate': return 50;
                          case 'advanced': return 75;
                          case 'expert': return 95;
                          default: return 50;
                        }
                      };

                      return (
                        <SkillProgress
                          key={skill.id}
                          skill={skill.skill_name}
                          value={getSkillValue(skill.proficiency_level)}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                !profile.skills?.length && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FaTools className="text-4xl text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Skills Tracked</h3>
                    <p className="text-gray-600 mb-4">Complete assessments to track your skill levels</p>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                      Take Skill Assessment
                    </button>
                  </div>
                )
              )}
            </motion.section>

            {/* Work Experience */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <FaBriefcase className="text-purple-600 text-xl" />
                  </div>
                  Work Experience
                </h2>
                {workExperience.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {workExperience.length} {workExperience.length === 1 ? 'Role' : 'Roles'}
                  </span>
                )}
              </div>
              
              {workExperience.length > 0 ? (
                <div className="space-y-6">
                  {workExperience.map((exp, index) => (
                    <motion.div
                      key={exp.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-300"
                    >
                      {/* Timeline connector */}
                      {index < workExperience.length - 1 && (
                        <div className="absolute left-6 bottom-0 w-0.5 h-6 bg-purple-200 transform translate-y-full"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaBuilding className="text-white text-lg" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{exp.position}</h3>
                              <p className="text-purple-600 font-semibold text-lg">{exp.company}</p>
                            </div>
                            {exp.current && (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                                CURRENT
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <FaCalendarAlt className="text-gray-500" />
                              <span className="font-medium">
                                {exp.start_date && new Date(exp.start_date).toLocaleDateString()} - {' '}
                                {exp.current ? 'Present' : (exp.end_date && new Date(exp.end_date).toLocaleDateString())}
                              </span>
                            </div>
                          </div>
                          
                          {exp.description && (
                            <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaBriefcase className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Work Experience</h3>
                  <p className="text-gray-600 mb-4">Add your professional experience to showcase your career</p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                    Add Experience
                  </button>
                </div>
              )}
            </motion.section>

            {/* Projects */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                    <FaProjectDiagram className="text-orange-600 text-xl" />
                  </div>
                  Projects
                </h2>
                {projects.length > 0 && (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                    {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                  </span>
                )}
              </div>
              
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FaProjectDiagram className="text-white text-lg" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                            {project.title}
                          </h3>
                          {project.description && (
                            <p className="text-gray-700 text-sm leading-relaxed mb-4">{project.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Technologies */}
                      {project.technologies?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Technologies</p>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, techIndex) => (
                              <span 
                                key={techIndex} 
                                className="text-xs bg-orange-200 text-orange-800 px-3 py-1 rounded-full font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Links */}
                      <div className="flex items-center space-x-4">
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                          >
                            <FaExternalLinkAlt />
                            <span>Live Demo</span>
                          </a>
                        )}
                        {project.github_link && (
                          <a
                            href={project.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                          >
                            <FaGithub />
                            <span>Code</span>
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaProjectDiagram className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 mb-4">Showcase your projects to potential employers</p>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                    Add Project
                  </button>
                </div>
              )}
            </motion.section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Certifications */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <FaCertificate className="text-yellow-600 text-lg" />
                </div>
                Certifications
                {certifications.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium ml-auto">
                    {certifications.length}
                  </span>
                )}
              </h2>
              
              {certifications.length > 0 ? (
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <motion.div
                      key={cert.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaCertificate className="text-white text-sm" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{cert.title}</h3>
                          <p className="text-yellow-600 font-semibold text-sm mb-2">{cert.issuer}</p>
                          {cert.date_obtained && (
                            <p className="text-gray-600 text-xs mb-2">
                              Obtained: {new Date(cert.date_obtained).toLocaleDateString()}
                            </p>
                          )}
                          {cert.verification_link && (
                            <a 
                              href={cert.verification_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                            >
                              <FaExternalLinkAlt />
                              <span>View Certificate</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCertificate className="text-2xl text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No Certifications</h3>
                  <p className="text-gray-600 text-sm mb-3">Add your professional certifications</p>
                  <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Add Certification
                  </button>
                </div>
              )}
            </motion.section>

            {/* Online Courses */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <FaBookOpen className="text-emerald-600 text-lg" />
                </div>
                Online Courses
                {onlineCourses.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium ml-auto">
                    {onlineCourses.length}
                  </span>
                )}
              </h2>
              
              {onlineCourses.length > 0 ? (
                <div className="space-y-4">
                  {onlineCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaBookOpen className="text-white text-sm" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm mb-1">{course.name}</h3>
                          <p className="text-emerald-600 font-semibold text-sm mb-2">{course.company}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              course.status === 'completed' ? 'bg-emerald-200 text-emerald-800' :
                              course.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-700'
                            }`}>
                              {course.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {course.verification_link && (
                              <a
                                href={course.verification_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                              >
                                <FaExternalLinkAlt />
                                <span>View</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBookOpen className="text-2xl text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No Online Courses</h3>
                  <p className="text-gray-600 text-sm mb-3">Track your online learning progress</p>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Add Course
                  </button>
                </div>
              )}
            </motion.section>

            {/* Learning Preferences */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FaLightbulb className="text-blue-600 text-lg" />
                </div>
                Learning Preferences
              </h2>
              
              <div className="space-y-6">
                {profile.learning_pace && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <FaRocket className="text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Learning Pace</h3>
                    </div>
                    <p className="text-blue-700 font-medium capitalize">{profile.learning_pace}</p>
                  </div>
                )}
                
                {profile.learning_commitment && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <FaCalendarAlt className="text-green-600" />
                      <h3 className="font-semibold text-gray-900">Commitment</h3>
                    </div>
                    <p className="text-green-700 font-medium capitalize">{profile.learning_commitment}</p>
                  </div>
                )}
                
                {profile.learning_methods?.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <FaTools className="text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Preferred Methods</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.learning_methods.map((method, index) => (
                        <span key={index} className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-medium">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.career_goals?.length > 0 && (
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <FaRocket className="text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">Career Goals</h3>
                    </div>
                    <div className="space-y-2">
                      {profile.career_goals.map((goal, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <FaCheckCircle className="text-indigo-600 text-sm mt-0.5 flex-shrink-0" />
                          <span className="text-indigo-800 text-sm font-medium">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!profile.learning_pace && !profile.learning_commitment && !profile.learning_methods?.length && !profile.career_goals?.length && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaLightbulb className="text-2xl text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Set Learning Preferences</h3>
                  <p className="text-gray-600 text-sm mb-3">Complete onboarding to personalize your experience</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Complete Onboarding
                  </button>
                </div>
              )}
            </motion.section>

            {/* Learning Goals */}
            {profile.learning_goals?.length > 0 && (
              <motion.section
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                    <FaHeart className="text-pink-600 text-lg" />
                  </div>
                  Learning Goals
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium ml-auto">
                    {profile.learning_goals.length}
                  </span>
                </h2>
                
                <div className="space-y-3">
                  {profile.learning_goals.map((goal, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaHeart className="text-white text-sm" />
                      </div>
                      <span className="text-gray-900 font-medium">{goal}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
