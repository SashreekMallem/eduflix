"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  FaShare, FaDownload, FaUser,
  FaCalendarAlt, FaCode, FaBriefcase, FaProjectDiagram,
  FaUniversity, FaCertificate, FaGraduationCap, FaBookOpen,
  FaBuilding, FaTools, FaHeart, FaRocket,
  FaLightbulb, FaGithub, FaLinkedin,
  FaEye, FaLock
} from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Header from '@/components/Header';

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
  profile: UserProfile | null;
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
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: Math.random() * 0.5 }}
    className="relative group"
  >
    <div className="w-20 h-20 mb-3">
      <CircularProgressbar
        value={value}
        text={`${value}%`}
        styles={buildStyles({
          textColor: '#374151',
          trailColor: '#f3f4f6',
          pathColor: value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#3B82F6',
          backgroundColor: 'transparent',
        })}
      />
    </div>
    <p className="text-center text-sm font-medium text-gray-700">{skill}</p>
  </motion.div>
);

export default function PublicProfilePage() {
  const { username } = useParams() as { username: string };
  const router = useRouter();
  const [userData, setUserData] = useState<CompleteUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        // Get current session to check if viewing own profile
        const { data: { session } } = await supabase.auth.getSession();
        
        // Find user by username
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          setError("Profile not found");
          setLoading(false);
          return;
        }

        // Check if this is the current user's profile
        if (session?.user?.id === profileData.user_id) {
          setIsCurrentUser(true);
        }

        const userId = profileData.user_id;

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
          // Only fetch documents if it's the current user's profile
          session?.user?.id === profileData.user_id 
            ? supabase.from('user_documents').select('*').eq('user_id', userId)
            : { data: [] }
        ]);

        // Combine all data
        const completeUserData: CompleteUserProfile = {
          profile: profileData,
          education: education || [],
          workExperience: workExperience || [],
          projects: projects || [],
          certifications: certifications || [],
          onlineCourses: onlineCourses || [],
          skillProficiencies: skillProficiencies || [],
          documents: documents || []
        };

        setUserData(completeUserData);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/home')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!userData || !userData.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900">Profile not found</div>
      </div>
    );
  }

  const { profile, education, workExperience, projects, certifications, onlineCourses, skillProficiencies, documents } = userData;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="h-full w-full" 
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #8b5cf6 0%, transparent 50%), 
                            radial-gradient(circle at 75% 75%, #06b6d4 0%, transparent 50%)`,
            backgroundSize: '400px 400px'
          }}
        />
      </div>

      {/* Navigation */}
      <Header currentPage="profile" currentUser={profile ? { profile: { full_name: profile.full_name } } : null} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section - Personal Overview */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 mb-8 shadow-lg"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 lg:mb-0">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white">
                  {profile.full_name?.charAt(0) || 'U'}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 text-gray-900">{profile.full_name}</h1>
                <p className="text-gray-600 mb-2">@{profile.username}</p>
                <p className="text-gray-600 mb-3">{profile.current_status}</p>
                <div className="flex items-center space-x-4 text-sm">
                  {profile.date_of_birth && (
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="text-blue-500" />
                      <span className="text-gray-700">Born: {new Date(profile.date_of_birth).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                <div className="flex items-center space-x-4 mt-4">
                  {profile.linkedin_profile && (
                    <a
                      href={profile.linkedin_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
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
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-800 transition-colors"
                    >
                      <FaGithub />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Only show documents to current user */}
            {isCurrentUser && (
              <div className="flex flex-col space-y-3">
                {documents.some(doc => doc.document_type === 'resume') && (
                  <button className="flex items-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2 rounded-xl font-semibold transition-colors">
                    <FaDownload />
                    <span>Download Resume</span>
                  </button>
                )}
                {documents.some(doc => doc.document_type === 'transcript') && (
                  <button className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-semibold transition-colors">
                    <FaLock />
                    <span>View Transcripts</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{education.length}</div>
                <div className="text-sm text-gray-600">Education</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{workExperience.length}</div>
                <div className="text-sm text-gray-600">Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{projects.length}</div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{certifications.length}</div>
                <div className="text-sm text-gray-600">Certificates</div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Education Section */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center text-gray-900">
                  <FaUniversity className="mr-3 text-blue-500" />
                  Education
                </h2>
              </div>
              
              {education.length > 0 ? (
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/50">
                      <div className="flex items-center mb-3">
                        <FaGraduationCap className="text-blue-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">{edu.degree} in {edu.field_of_study}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">University</p>
                          <p className="text-gray-900 font-medium">{edu.university}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Graduation Year</p>
                          <p className="text-gray-900 font-medium">{edu.graduation_year || 'In Progress'}</p>
                        </div>
                        {edu.grade && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Grade</p>
                            <p className="text-gray-900 font-medium">{edu.grade}</p>
                          </div>
                        )}
                        {edu.relevant_courses?.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Relevant Courses</p>
                            <div className="flex flex-wrap gap-1">
                              {edu.relevant_courses.map((course, index) => (
                                <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {course}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaUniversity className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No education information available</p>
                </div>
              )}
            </motion.section>

            {/* Skills & Expertise */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center text-gray-900">
                  <FaCode className="mr-3 text-green-500" />
                  Skills & Proficiencies
                </h2>
              </div>
              
              {/* User Skills from Profile */}
              {profile.skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Proficiencies */}
              {skillProficiencies.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-600">Skill Proficiencies</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {skillProficiencies.map((skill) => {
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
                <div className="text-center py-8">
                  <FaTools className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No skill proficiencies recorded</p>
                </div>
              )}
            </motion.section>

            {/* Work Experience */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center text-gray-900">
                  <FaBriefcase className="mr-3 text-purple-500" />
                  Work Experience
                </h2>
              </div>
              
              {workExperience.length > 0 ? (
                <div className="space-y-4">
                  {workExperience.map((exp) => (
                    <div key={exp.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/50">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                          <FaBuilding className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{exp.position}</h3>
                          <p className="text-purple-600 font-medium mb-2">{exp.company}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span>
                              {exp.start_date && new Date(exp.start_date).toLocaleDateString()} - {' '}
                              {exp.current ? 'Present' : (exp.end_date && new Date(exp.end_date).toLocaleDateString())}
                            </span>
                            {exp.current && (
                              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                                Current
                              </span>
                            )}
                          </div>
                          {exp.description && (
                            <p className="text-gray-700 text-sm">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No work experience available</p>
                </div>
              )}
            </motion.section>

            {/* Projects */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center text-gray-900">
                  <FaProjectDiagram className="mr-3 text-orange-500" />
                  Projects
                </h2>
              </div>
              
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/50">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                          <FaProjectDiagram className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{project.title}</h3>
                          {project.description && (
                            <p className="text-gray-700 text-sm mb-3">{project.description}</p>
                          )}
                          
                          {/* Technologies */}
                          {project.technologies?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-1">Technologies</p>
                              <div className="flex flex-wrap gap-1">
                                {project.technologies.map((tech, index) => (
                                  <span key={index} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Links */}
                          <div className="flex items-center space-x-4 text-sm">
                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
                              >
                                <FaEye />
                                <span>Live Demo</span>
                              </a>
                            )}
                            {project.github_link && (
                              <a
                                href={project.github_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-700 hover:underline flex items-center space-x-1"
                              >
                                <FaGithub />
                                <span>GitHub</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaProjectDiagram className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No projects available</p>
                </div>
              )}
            </motion.section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Certifications */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <FaCertificate className="mr-3 text-yellow-500" />
                Certifications
              </h2>
              
              {certifications.length > 0 ? (
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
                      <h3 className="font-semibold text-gray-900 mb-1">{cert.title}</h3>
                      <p className="text-yellow-600 text-sm font-medium mb-1">{cert.issuer}</p>
                      {cert.date_obtained && (
                        <p className="text-gray-600 text-xs mb-1">
                          Obtained: {new Date(cert.date_obtained).toLocaleDateString()}
                        </p>
                      )}
                      {cert.verification_link && (
                        <a 
                          href={cert.verification_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs hover:underline"
                        >
                          View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FaCertificate className="text-3xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No certifications available</p>
                </div>
              )}
            </motion.section>

            {/* Online Courses */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <FaBookOpen className="mr-3 text-green-500" />
                Online Courses
              </h2>
              
              {onlineCourses.length > 0 ? (
                <div className="space-y-3">
                  {onlineCourses.map((course) => (
                    <div key={course.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
                      <h3 className="font-medium text-gray-900 mb-1">{course.name}</h3>
                      <p className="text-green-600 text-sm mb-1">{course.company}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          course.status === 'completed' ? 'bg-green-100 text-green-700' :
                          course.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {course.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {course.verification_link && (
                          <a
                            href={course.verification_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-xs hover:underline"
                          >
                            View Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FaBookOpen className="text-3xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No online courses available</p>
                </div>
              )}
            </motion.section>

            {/* Learning Preferences */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <FaLightbulb className="mr-3 text-blue-500" />
                Learning Preferences
              </h2>
              
              <div className="space-y-4">
                {profile.learning_pace && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Learning Pace</p>
                    <p className="text-gray-900 font-medium">{profile.learning_pace}</p>
                  </div>
                )}
                
                {profile.learning_commitment && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Commitment</p>
                    <p className="text-gray-900 font-medium">{profile.learning_commitment}</p>
                  </div>
                )}
                
                {profile.learning_methods?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Preferred Methods</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.learning_methods.map((method, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.career_goals?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Career Goals</p>
                    <div className="space-y-1">
                      {profile.career_goals.map((goal, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <FaRocket className="text-purple-500 text-xs" />
                          <span className="text-gray-700">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Learning Goals */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <FaRocket className="mr-3 text-purple-500" />
                Learning Goals
              </h2>
              
              {profile.learning_goals?.length > 0 ? (
                <div className="space-y-2">
                  {profile.learning_goals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl">
                      <FaHeart className="text-purple-500" />
                      <span className="text-gray-900">{goal}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FaRocket className="text-3xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No learning goals available</p>
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
