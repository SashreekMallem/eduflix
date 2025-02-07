"use client";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaBriefcase, FaGraduationCap, FaCode, FaFilePdf, FaExternalLinkAlt, FaUserPlus, FaComment } from 'react-icons/fa';

export default function ProfilePage() {
  const { name } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isFriend, setIsFriend] = useState(false); // New state to track friendship

  useEffect(() => {
    const stored = localStorage.getItem('profileData');
    if (stored) {
      const data = JSON.parse(stored);
      // Optionally check if the profile username matches the URL parameter
      if (data.username === name) {
        setProfile(data);
      }
      // Check if the current profile is in the user's friends list
      if (data.friends && data.friends.some(friend => friend.name === name)) {
        setIsFriend(true);
      }
    }
    // Fallback to fake data if no stored profile exists
    if (!profile) {
      setProfile({
        username: name,
        headline: "Software Engineer | AI Enthusiast",
        location: "San Francisco, CA",
        connections: 500,
        about: "Passionate software engineer with a love for learning and building innovative solutions. Experienced in React, Node.js, and Machine Learning.",
        resumeFile: "resume.pdf",
        transcriptFile: "transcript.pdf",
        relevantCourses: ["Data Structures", "Algorithms", "Web Development"],
        certifications: [
          { title: "Certified Web Developer", issuer: "Coursera" },
          { title: "AWS Certified Cloud Practitioner", issuer: "Amazon" },
        ],
        onlineCourses: [
          { name: "React - The Complete Guide", company: "Udemy" },
          { name: "Node.js API Development", company: "Coursera" },
        ],
        workExperience: [
          {
            title: "Software Engineer",
            company: "Tech Innovations Inc.",
            dates: "2020 - Present",
            description: "Developed and maintained web applications using React and Node.js. Led a team of 5 engineers.",
          },
          {
            title: "Web Developer Intern",
            company: "Startup Solutions",
            dates: "Summer 2019",
            description: "Assisted in the development of a new e-commerce platform.",
          },
        ],
        skills: ["JavaScript", "React", "Node.js", "Python", "Machine Learning"],
        recommendations: [
          {
            recommender: "John Doe",
            title: "Team Lead at Tech Innovations Inc.",
            recommendation: "Jane is a highly skilled and dedicated engineer. She consistently delivers high-quality work and is a valuable asset to our team.",
          },
          {
            recommender: "Alice Smith",
            title: "Professor at University X",
            recommendation: "Jane is a bright and motivated student. She has a strong understanding of computer science principles and is always eager to learn new things.",
          },
        ],
        preferredLearningPace: "Medium",
        preferredLearningMethods: ["Hands-on Projects", "Videos"],
        projectDescription: "A web application for managing tasks and projects.",
      });
    }
  }, [name]);

  const handleBackToHome = () => {
    router.push('/home');
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="bg-gray-800 p-4">
        <button onClick={handleBackToHome} className="text-blue-500 underline">← Back to Home</button>
      </header>
      <div className="container mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Left Sidebar - Profile Summary */}
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="w-full h-32 rounded-full bg-gray-700 mb-4">
                {/* Placeholder for profile picture */}
              </div>
              <h1 className="text-2xl font-bold text-center">{profile?.username}</h1>
              <p className="text-gray-400 text-center">{profile?.headline}</p>
              <p className="text-gray-500 text-center">{profile?.location}</p>
              <p className="text-gray-500 text-center">{profile?.connections} connections</p>
              {!isFriend && (
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full w-full">
                  Connect <FaUserPlus className="inline-block ml-2" />
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* About Section */}
            <section className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center">About</h2>
              <p>{profile?.about}</p>
            </section>

            {/* Experience Section */}
            <section className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center"><FaBriefcase className="mr-2" /> Experience</h2>
              {profile?.workExperience.map((exp, index) => (
                <div key={index} className="mb-4">
                  <h3 className="text-lg font-semibold">{exp.title}</h3>
                  <p className="text-gray-400">{exp.company} - {exp.dates}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </section>

            {/* Skills Section */}
            <section className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center"><FaCode className="mr-2" /> Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile?.skills.map((skill, index) => (
                  <span key={index} className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </section>

            {/* Recommendations Section */}
            <section className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center"><FaComment className="mr-2" /> Recommendations</h2>
              {profile?.recommendations.map((rec, index) => (
                <div key={index} className="mb-4">
                  <h3 className="text-lg font-semibold">{rec.recommender}</h3>
                  <p className="text-gray-400">{rec.title}</p>
                  <p>{rec.recommendation}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

