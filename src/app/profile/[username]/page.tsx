"use client";
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaCrown, FaMedal, FaTrophy, FaDownload, FaLock, FaRocket, FaUniversity, FaBook, FaCertificate, FaBriefcase, FaProjectDiagram } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface UserProfile {
  username: string;
  resume_file?: string;
  transcript_file?: string;
  university?: string;
  degree?: string;
  relevant_courses: string[];
  certifications: { title: string; issuer: string }[];
  online_courses: { name: string; platform: string }[];
  work_experience_title?: string;
  work_experience_description?: string;
  preferred_learning_pace?: string;
  preferred_learning_methods: string[];
  project_file?: string;
  project_description?: string;
  learning_goals?: string;
}

const SkillProgress = ({ skill, value }: { skill: string; value: number }) => (
  <div className="w-24 h-24">
    <CircularProgressbar
      value={value}
      text={`${value}%`}
      styles={buildStyles({
        textColor: '#fff',
        trailColor: '#4a5568',
        pathColor: '#9A3BFF',
      })}
    />
    <p className="text-center mt-2 text-gray-400">{skill}</p>
  </div>
);

const ProjectCard = ({ project }: { project: string }) => (
  <div className="w-80 h-56 rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer">
    <img src="https://via.placeholder.com/300x150?text=Project+Thumbnail" alt={project} className="w-full h-36 object-cover" />
    <div className="p-5 bg-gray-800">
      <h3 className="text-xl font-semibold text-white truncate">{project}</h3>
      <p className="text-gray-400 text-sm truncate">Interactive Project</p>
    </div>
  </div>
);

export default function ProfilePage() {
  const { username } = useParams() as { username: string };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username) {
      fetchProfile(username);
    }
  }, [username]);

  const fetchProfile = async (username: string) => {
    try {
      const res = await fetch(`http://localhost:8000/user/profile?username=${username}`);
      const data = await res.json();
      setProfile({
        ...data,
        relevant_courses: data.relevant_courses || [],
        certifications: data.certifications || [],
        online_courses: data.online_courses || [],
        preferred_learning_methods: data.preferred_learning_methods || [],
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Error fetching profile");
    }
  };

  if (error) return <div>{error}</div>;
  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="bg-[#0B0F19] text-white min-h-screen font-poppins">
      <header className="bg-[#121826] p-6 shadow-lg">
        <h1 className="text-3xl font-bold">Profile</h1>
      </header>
      <div className="container mx-auto p-8">
        {/* 1. Hero Section (Profile Overview) */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          {/* Profile & Quick Stats */}
          <div className="flex items-center mb-4">
            <div className="w-32 h-32 bg-gray-300 rounded-full mr-6 flex-shrink-0"></div>
            <div>
              <h1 className="text-4xl font-bold">{profile.username}</h1>
              <p className="text-gray-400 text-lg">Good Evening, {profile.username}! Ready to conquer the next challenge?</p>
              <div className="mt-2">
                <span className="text-yellow-400 mr-2">
                  <FaCrown className="inline-block mr-1" /> Elite Learner Badge
                </span>
                <span className="text-green-400 mr-2">
                  <FaMedal className="inline-block mr-1" /> Top 5% in AI Learning
                </span>
                <span className="text-blue-400">
                  <FaTrophy className="inline-block mr-1" /> Current Streak: 10 Days
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-start">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full mr-4 flex items-center">
              Download Resume <FaDownload className="ml-2" />
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full flex items-center">
              View Transcript <FaLock className="ml-2" />
            </button>
          </div>
          <div className="mt-6">
            <p className="text-green-400">
              <FaRocket className="inline-block mr-1" /> Suggested Next Course: Deep Learning with TensorFlow
            </p>
          </div>
        </section>

        {/* 2. Education Section */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Education</h2>
          <p className="text-gray-400"><strong>University:</strong> {profile.university || "Not provided"}</p>
          <p className="text-gray-400"><strong>Degree:</strong> {profile.degree || "Not provided"}</p>
          <div>
            <h3 className="text-xl font-semibold mb-2">Relevant Courses</h3>
            {profile.relevant_courses && profile.relevant_courses.length > 0 ? (
              <ul className="list-disc list-inside">
                {profile.relevant_courses.map((course, index) => (
                  <li key={index} className="text-gray-400">{course}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No relevant courses added yet.</p>
            )}
          </div>
        </section>

        {/* 3. Skill Strengths & Learning Breakdown */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Skill Strengths & Learning Breakdown</h2>
          <div className="flex justify-around mb-6">
            <SkillProgress skill="Python" value={90} />
            <SkillProgress skill="Machine Learning" value={75} />
            <SkillProgress skill="Deep Learning" value={60} />
          </div>
          <div className="mb-4">
            <p className="text-gray-400">Total Hours: 98h ⏳</p>
            <p className="text-gray-400">Current Weekly Average: 15h 📈</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Certification Showcase</h3>
            <div className="flex space-x-4">
              {profile.certifications && profile.certifications.length > 0 ? (
                profile.certifications.map((cert, index) => (
                  <div key={index} className="bg-gray-700 p-3 rounded-lg">{cert.title}</div>
                ))
              ) : (
                <div className="text-gray-500">No certifications added yet.</div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Work Experience Section */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Work Experience</h2>
          <p className="text-gray-400"><strong>Title:</strong> {profile.work_experience_title || "Not provided"}</p>
          <p className="text-gray-400"><strong>Description:</strong> {profile.work_experience_description || "Not provided"}</p>
        </section>

        {/* 5. Projects Section */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Projects</h2>
          <p className="text-gray-400"><strong>File:</strong> {profile.project_file || "Not provided"}</p>
          <p className="text-gray-400"><strong>Description:</strong> {profile.project_description || "Not provided"}</p>
        </section>

        {/* 6. Personalized Learning Insights */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Personalized Learning Insights</h2>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Preferred Learning Methods</h3>
            <ul className="list-disc list-inside">
              {profile.preferred_learning_methods && profile.preferred_learning_methods.length > 0 ? (
                profile.preferred_learning_methods.map((method, index) => (
                  <li key={index} className="text-gray-400">{method}</li>
                ))
              ) : (
                <li className="text-gray-500">No preferred learning methods added yet.</li>
              )}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Preferred Learning Pace</h3>
            <p className="text-gray-400">{profile.preferred_learning_pace || "Not provided"}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Learning Goals</h3>
            <p className="text-gray-400">{profile.learning_goals || "Not provided"}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
