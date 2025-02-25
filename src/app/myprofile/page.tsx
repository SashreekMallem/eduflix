"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { FaCrown, FaMedal, FaTrophy, FaDownload, FaLock, FaRocket } from 'react-icons/fa';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface Profile {
  user_id: string;
  full_name: string;
  date_of_birth: string;
  username: string;
  current_status: string;
  resume_filename: string;
  transcript_filenames: string[]; // updated to an array
  university: string;
  degree: string;
  field_of_study: string;
  relevant_courses: string[];
  added_degrees: {
    university: string;
    degree: string;
    field_of_study: string;
    relevant_courses: string[];
  }[];
  certifications: { type: string; title?: string; name?: string; issuer: string; verificationLink?: string }[];
  online_courses: { name: string; issuer: string }[];
  work_experience: {
    company: string;
    title: string;
    description: string;
  }[];
  preferred_learning_pace: string;
  learning_commitment: string;
  preferred_learning_methods: string[];
  learning_goals: string[];
  project_file: string;
  project_description: string;
  extracted_skills: string[];
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
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const authUserId = localStorage.getItem("auth_user_id");
    if (authUserId) {
      fetch(`http://localhost:8000/onboarding-details?user_id=${authUserId}`)
        .then(res => {
          if (!res.ok) throw new Error("Profile not found");
          return res.json();
        })
        .then(data => setProfile(data))
        .catch(err => setError(err.message));
    } else {
      setError("No logged-in user found.");
    }
  }, []);

  if (error) return <div>{error}</div>;
  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="bg-[#0B0F19] text-white min-h-screen font-poppins">
      <header className="bg-[#121826] p-6 shadow-lg">
        <h1
          className="text-3xl font-bold cursor-pointer"
          onClick={() => router.push('/home')}
        >
          Edu Profile
        </h1>
      </header>
      <div className="container mx-auto p-8">
        {/* 1. Hero Section (Profile Overview) */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <div className="flex items-center mb-4">
            <div className="w-32 h-32 bg-gray-300 rounded-full mr-6 flex-shrink-0"></div>
            <div>
              <h1 className="text-4xl font-bold">{profile.full_name}</h1>
              <p className="text-gray-400 text-lg">
                {profile.current_status} • {profile.date_of_birth}
              </p>
              <p className="text-gray-400 text-lg">
                Welcome {profile.username}, ready to conquer the next challenge?
              </p>
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
          <div className="mt-4">
            <p className="text-gray-400">
              Transcript Files: {(profile.transcript_filenames ?? []).length ? profile.transcript_filenames.join(', ') : "None"}
            </p>
          </div>
        </section>

        {/* 2. Education Section */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Education</h2>
          {profile.added_degrees && profile.added_degrees.length > 0 ? (
            profile.added_degrees.map((degree, index) => (
              <div key={index} className="mb-4">
                <p className="text-gray-400"><strong>Institution:</strong> {degree.university}</p>
                <p className="text-gray-400"><strong>Degree:</strong> {degree.degree}</p>
                <p className="text-gray-400"><strong>Field of Study:</strong> {degree.field_of_study}</p>
                <p className="text-gray-400"><strong>Courses:</strong> {degree.relevant_courses.join(', ') || "None"}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No degrees added yet.</p>
          )}
        </section>

        {/* 3. Skill Strengths & Learning Breakdown */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Skill Strengths & Learning Breakdown</h2>
          <div className="flex justify-around mb-6">
            {profile.extracted_skills && profile.extracted_skills.length > 0 ? (
              profile.extracted_skills.map((skill, index) => (
                <SkillProgress key={index} skill={skill} value={Math.floor(Math.random() * 100)} />
              ))
            ) : (
              <p className="text-gray-500">No skills extracted yet.</p>
            )}
          </div>
          <div className="mb-4">
            <p className="text-gray-400">Total Hours: 98h ⏳</p>
            <p className="text-gray-400">Weekly Average: 15h 📈</p>
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
          {profile.work_experience && profile.work_experience.length > 0 ? (
            profile.work_experience.map((exp, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-700 rounded">
                <p className="text-gray-300"><strong>Company:</strong> {exp.company}</p>
                <p className="text-gray-300"><strong>Title:</strong> {exp.title}</p>
                <p className="text-gray-300"><strong>Description:</strong> {exp.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No work experience provided.</p>
          )}
        </section>

        {/* 5. Projects Section */}
        <section className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Projects</h2>
          <p className="text-gray-400">
            <strong>File:</strong> {profile.project_file || "Not provided"}
          </p>
          <p className="text-gray-400">
            <strong>Description:</strong> {profile.project_description || "Not provided"}
          </p>
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
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Learning Commitment</h3>
            <p className="text-gray-400">{profile.learning_commitment || "Not provided"}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Learning Goals</h3>
            <p className="text-gray-400">{profile.learning_goals && profile.learning_goals.length ? profile.learning_goals.join(', ') : "Not provided"}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
