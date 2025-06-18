"use client";

import { useState } from 'react';
import './calendar-theme.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MolecularNavigation from '@/components/MolecularNavigation';

export default function Home() {
  const [eduNews] = useState([
    "EduFlix launches new AI-powered personalized learning pathways!",
    "Top 10 courses to boost your career in 2023.",
    "EduFlix partners with leading universities for exclusive content.",
    "New features added to EduFlix for enhanced learning experience.",
    "EduFlix introduces gamified learning to keep students engaged.",
    "EduFlix now supports offline learning for premium users.",
    "Join the EduFlix community and start your learning journey today!",
    "EduFlix offers scholarships for top-performing students.",
    "EduFlix collaborates with industry experts for exclusive content.",
    "EduFlix launches new coding bootcamp for aspiring developers.",
  ]);
  const [currentUser] = useState<{ profile: { full_name: string } } | null>(null);

  const handleAtomSelect = (atom: { id: string; name: string; description?: string }) => {
    console.log('Selected atom:', atom);
    // Here you can add navigation logic, open detailed views, etc.
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <Header currentPage="home" currentUser={currentUser} />
      </div>
      
      {/* Main content with proper spacing for fixed header */}
      <main className="flex-grow relative flex justify-center items-center pt-20 bg-white">
        {/* 3D Molecular Learning Navigation - Full viewport */}
        <div className="w-full h-screen relative">
          <MolecularNavigation onAtomSelect={handleAtomSelect} />
        </div>
      </main>
      
      {/* Fixed Footer Component */}
      <Footer eduNews={eduNews} showEduNews={true} />
    </div>
  );
}

