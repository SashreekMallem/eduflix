"use client";

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FilmReelEffect from './FilmReelEffect';
import Head from "next/head";
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'onboarding', label: 'Onboarding', color: 'emerald-700' },
    { id: 'curation', label: 'Curation', color: 'sky-700' },
    { id: 'personalization', label: 'Personalization', color: 'amber-700' },
    { id: 'engagement', label: 'Engagement', color: 'rose-700' },
    { id: 'certifications', label: 'Certifications', color: 'fuchsia-700' },
    { id: 'meet-njan', label: 'NJAN', color: 'indigo-700' },
    { id: 'testimonials', label: 'Testimonials', color: 'gray-700' }
  ];

  useEffect(() => {
    if (logoRef.current) {
      gsap.to(logoRef.current, { opacity: 1, duration: 1 });
      setLogoLoaded(true);
    }

    const sectionsArray = gsap.utils.toArray("section");
    sectionsArray.forEach(section => {
      gsap.fromTo(
        section as Element,
        { opacity: 0, scale: 0.95, y: 50 }, // More subtle initial state
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2, // Reduced duration for snappier animation
          ease: "power3.out", // Adjusted easing
          scrollTrigger: {
            trigger: section as Element,
            start: "top 70%",
            end: "bottom 30%",
            scrub: 0.5, // Adjusted scrub
            toggleActions: "play none none reverse",
            onEnter: () => setActiveSection((section as HTMLElement).id),
            onEnterBack: () => setActiveSection((section as HTMLElement).id),
          }
        }
      );

      // Entrance animations for individual elements
      const elementsArray = gsap.utils.toArray((section as HTMLElement).querySelectorAll("h3, p, .bg-white"));
      elementsArray.forEach(element => {
        gsap.fromTo(element as Element,
          { opacity: 0, y: 20 }, // More subtle initial state
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: element as Element,
              start: "top 80%",
              end: "bottom 20%",
              scrub: 0.5,
              toggleActions: "play none none reverse"
            }
          });
      });
    });

    // Parallax effect for Hero Section
    gsap.to(heroRef.current, {
      yPercent: -15, // Reduced parallax intensity
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, []);

  const setLogoRef = (node: HTMLDivElement | null) => {
    logoRef.current = node;
  };

  return (
    <div className="relative bg-gray-100 text-gray-700 overflow-hidden font-geometric antialiased">
      <Head>
        <meta name="description" content="EduFlix: Transform your career through personalized, curated, adaptive, and engaging education. Learn, Create, and Succeed." />
        <meta name="keywords" content="EduFlix, online learning, personalized education, certifications, adaptive learning, career, courses" />
        {/* Replace GA_MEASUREMENT_ID with your Google Analytics measurement ID */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID', { page_path: window.location.pathname });
            `,
          }}
        />
      </Head>

      {/* Dynamic Island Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/70 backdrop-blur-md shadow-lg rounded-full py-2 px-4 transition-all duration-300">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Updated EduFlix AI Logo with NJAN info */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-1 px-2 rounded-md shadow-md whitespace-nowrap">
            <span>EduFlix AI</span>
            <span className="text-xs font-normal opacity-80">Powered by NJAN</span>
          </div>
          <nav className="ml-4 flex-1">
            <ul className="flex space-x-4 justify-center">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`text-sm font-medium hover:text-blue-500 transition-colors duration-300 ${
                      activeSection === section.id ? `text-${section.color}` : 'text-gray-700'
                    }`}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {/* Updated Login/Sign Up Buttons without Notification Badge */}
          <div className="flex items-center space-x-2 ml-4">
            <Link href="/Login">
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-1 px-2 rounded-md shadow-md transition-colors duration-300 hover:from-purple-600 hover:to-blue-600 whitespace-nowrap text-sm">
                Login
              </button>
            </Link>
            <Link href="/Login">
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-1 px-2 rounded-md shadow-md transition-colors duration-300 hover:from-purple-600 hover:to-blue-600 whitespace-nowrap text-sm">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Header Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100"> {/* Updated gradient */}
        <div className="absolute inset-8 bg-white rounded-3xl shadow-md transition-shadow duration-300 hover:shadow-2xl"></div>
        <div
          ref={setLogoRef}
          className={`text-center relative z-10 ${logoLoaded ? '' : 'invisible'}`}
        >
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 inline-block">E</span>
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 inline-block">d</span>
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 inline-block">u</span>
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 inline-block">F</span>
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 inline-block">l</span>
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 inline-block">i</span>
          <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 inline-block">x</span>
          <span className="inline-block ml-2">
            <FilmReelEffect color="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700" />
          </span>
          {/* Animated Tagline */}
          <div className="text-3xl font-semibold text-gray-700 mt-4">
            Curate | Personalize | Adapt | Engage
          </div>
          <p className="text-gray-500">
            Powered by Neural Justification & Adaptive Nexus; NJAN (/ˈen.dʒɪn/)
          </p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-48 bg-gray-50 overflow-hidden" ref={heroRef}> {/* Parallax container */}
        <div className="absolute inset-0">
          {/* Animated Mesh Gradient - Replace with actual implementation */}
          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 animate-gradient"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-6xl font-semibold mb-12 text-gray-800 leading-tight">
            What Powers EduFlix AI?
          </h2>
          <p className="text-2xl text-gray-600 leading-relaxed">
            EduFlix AI is driven by NJAN a Neural Justification & Adaptive Nexus an advanced AI engine that curates, personalizes, and optimizes learning in real time.
            NJAN adapts to each learner, delivering the right content, at the right pace, with the right engagement, ensuring a truly intelligent and interactive learning experience.
          </p>
          
        </div>

      </section>

      {/* Feature Sections */}
      <section className="relative py-24 bg-gradient-to-br from-blue-50 to-emerald-50" id="onboarding"> {/* Added ID */}
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-semibold text-emerald-700 mb-12 text-left">EduFlix User Onboarding</h3>
          <div className="flex flex-wrap items-stretch">
            <div className="w-full md:w-1/3 p-6">
              <div className="bg-gray-50 rounded-3xl shadow-md p-6 mb-6 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h3 className="text-2xl font-semibold mb-4 text-emerald-700">First Step</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  The first stage of your EduFlix journey is User Onboarding, where <strong>NJAN</strong> collects essential information to build a customized learning experience tailored to your needs.
                </p>
                <video loop autoPlay muted className="w-full h-64 rounded-2xl shadow-sm object-cover">
                  <source src="/Useronboaridng.mov" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-6">
              <div className="bg-gray-50 rounded-3xl shadow-md p-6 mb-6 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h3 className="text-2xl font-semibold mb-4 text-emerald-700">What We Collect</h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  ✔ <strong>Profile & Auto-Fill Data</strong> – Resume, and academic transcript to extract education, experience, and skills using <strong>NJAN-Insight</strong>.<br /><br />
                  ✔ <strong>Education & Certifications</strong> – University, degrees, coursework, certifications, and online courses, analyzed by <strong>NJAN-Curate</strong>.<br /><br />
                  ✔ <strong>Work & Projects</strong> – Job roles, past projects, and real-world experience, assessed by <strong>NJAN-Personal</strong>.<br /><br />
                  ✔ <strong>Learning Preferences</strong> – Pace, commitment level, and preferred content formats (videos, articles, projects, etc.), optimized by <strong>NJAN-Engage</strong>.<br /><br />
                  ✔ <strong>Self-Assessment</strong> – Skill levels, knowledge gaps, and future goals, understood by <strong>NJAN-Connect</strong>.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-6">
              <div className="bg-gray-50 rounded-3xl shadow-md p-6 mb-6 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h3 className="text-2xl font-semibold mb-4 text-emerald-700">What We Do With It</h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  ✔ <strong>Understand Your Depth</strong> – <strong>NJAN-Insight</strong> assesses your expertise to recommend the right content.<br /><br />
                  ✔ <strong>Adapt to Your Learning Style</strong> – <strong>NJAN-Personal</strong> delivers courses in formats that suit you best.<br /><br />
                  ✔ <strong>Fill Knowledge Gaps</strong> – <strong>NJAN-Curate</strong> identifies missing skills and suggests relevant courses.<br /><br />
                  ✔ <strong>Align with Career Goals</strong> – <strong>NJAN-Connect</strong> personalizes your learning to match professional aspirations.<br /><br />
                  Your journey, your rules. Let EduFlix tailor your learning experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Curation Section */}
      <section className="relative py-24 bg-gradient-to-br from-emerald-50 to-sky-50" id="curation"> {/* Added ID */}
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-semibold text-sky-700 mb-12 text-left">Content Curation</h3>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            At EduFlix, we don’t just give you content, we give you the right content. Our intelligent curation process, powered by <strong>NJAN-Curate</strong>, ensures that every course, tutorial, and resource is high-quality, relevant, and tailored to your learning needs.
          </p>
          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-3xl shadow-md p-6 mb-6 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-sky-700 mb-4">What We Do</h4>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {/* Replace bullet points with custom icons */}
                  ✔ <strong>Source from the Best</strong> – We bring together content from top educational platforms, industry experts, and trusted learning communities using <strong>NJAN-Curate</strong>.<br /><br />
                  ✔ <strong>Quality-Driven Selection</strong> – Every course is evaluated based on engagement, effectiveness, and real learner feedback by <strong>NJAN-Insight</strong>.<br /><br />
                  ✔ <strong>Personalized Learning Paths</strong> – Content is structured based on your proficiency level, learning pace, and career goals with <strong>NJAN-Personal</strong>.<br /><br />
                  ✔ <strong>Continuously Updated</strong> – As new trends emerge, our recommendations evolve to keep you ahead, thanks to <strong>NJAN-Curate</strong>.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-3xl shadow-md p-6 mb-6 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-sky-700 mb-4">Why It Matters</h4>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {/* Replace bullet points with custom icons */}
                  ✔ <strong>No More Searching</strong> – The best courses, handpicked and ranked for you by <strong>NJAN-Curate</strong>.<br /><br />
                  ✔ <strong>Always Relevant</strong> – Learning that adapts to your goals and progress with <strong>NJAN-Personal</strong>.<br /><br />
                  ✔ <strong>Expert-Backed</strong> – Content that meets real-world industry standards, validated by <strong>NJAN-Insight</strong>.<br /><br />
                  ✔ <strong>Multi-Format Flexibility</strong> – Videos, articles, hands-on projects, and interactive learning delivered your way, orchestrated by <strong>NJAN</strong>.<br /><br />
                  Your time is valuable. Let EduFlix tailor your learning experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EduFlix Personalization Section */}
      <section className="relative py-24 bg-gradient-to-br from-sky-50 to-amber-50" id="personalization"> {/* Added ID */}
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-semibold text-amber-700 mb-12 text-left">EduFlix Personalization</h3>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            At EduFlix, learning isn’t one-size-fits-all. Our <strong>NJAN-Personal</strong> dynamically adapts to your pace, preferences, and behavior, ensuring a truly personalized experience.
          </p>
          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-3xl shadow-md p-6 mb-6 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-amber-700 mb-4">What We Do</h4>
                <p className="text-lg text-black leading-relaxed">
                  ✔ <strong>Adaptive Learning Paths</strong> – <strong>NJAN-Personal</strong> modifies, replaces, or adjusts content, learning methods, and pace to match your style.<br /><br />
                  ✔ <strong>Behavior-Based Personalization</strong> – <strong>NJAN-Engage</strong> learns from your interactions to refine recommendations in real time.<br /><br />
                  ✔ <strong>Full Flexibility</strong> – Choose how you learn videos, articles, projects, or discussions on your terms, guided by <strong>NJAN</strong>.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-3xl shadow-md p-6 mb-6 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-amber-700 mb-4">Why It Matters</h4>
                <p className="text-lg text-black leading-relaxed">
                  ✔ <strong>Smarter Recommendations</strong> – Content evolves as you progress, thanks to <strong>NJAN-Curate</strong>.<br /><br />
                  ✔ <strong>Effortless Learning</strong> – The right pace, the right content, at the right time, orchestrated by <strong>NJAN-Personal</strong>.<br /><br />
                  ✔ <strong>Total Control</strong> – A platform that adapts to you, not the other way around, powered by <strong>NJAN</strong>.<br /><br />
                  Your journey, your rules. Let EduFlix tailor your learning experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EduFlix Engagement Section */}
      <section className="relative py-24 bg-gradient-to-br from-amber-50 to-rose-50" id="engagement"> {/* Added ID */}
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-semibold text-rose-700 mb-12 text-left">EduFlix Engagement</h3>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            At EduFlix, we go beyond just learning—we make it interactive, engaging, and community-driven to keep you motivated every step of the way, all powered by <strong>NJAN-Engage</strong>.
          </p>
          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-xl shadow-lg p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-rose-700 mb-4">What We Do</h4>
                <p className="text-lg text-gray-700 leading-relaxed">
                  ✔ <strong>Edureels & Edunews</strong> – Bite-sized, high-impact learning updates and industry insights to keep you informed and inspired, curated by <strong>NJAN-Curate</strong>.<br /><br />
                  ✔ <strong>Leaderboards & Healthy Competition</strong> – Earn points based on test scores, completion rates, engagement, and helping others, tracked by <strong>NJAN-Engage</strong>.<br /><br />
                  ✔ <strong>Real-Time Community Interaction</strong> – Connect with peers through study groups, discussion rooms, and direct messaging, facilitated by <strong>NJAN-Connect</strong>.<br /><br />
                  ✔ <strong>Peer-to-Peer Support</strong> – Learn faster and stay motivated by helping and getting help from other learners, guided by <strong>NJAN-Tutor</strong>.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-xl shadow-lg p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-rose-700 mb-4">Why It Matters</h4>
                <p className="text-lg text-gray-700 leading-relaxed">
                  ✔ <strong>Stay Motivated</strong> – Compete, collaborate, and celebrate your progress, all fueled by <strong>NJAN-Engage</strong>.<br /><br />
                  ✔ <strong>Never Feel Isolated</strong> – Engage in active discussions and real-time learning support, facilitated by <strong>NJAN-Connect</strong>.<br /><br />
                  ✔ <strong>Learn Beyond Courses</strong> – Get the latest insights and trends in your field, curated by <strong>NJAN-Curate</strong>.<br /><br />
                  EduFlix isn’t just a platform it’s a thriving learning community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EduFlix Certifications & Hiring Section */}
      <section className="relative py-24 bg-gradient-to-br from-rose-50 to-fuchsia-50" id="certifications"> {/* Added ID */}
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-semibold text-fuchsia-700 mb-12 text-left">EduFlix Certifications & Hiring</h3>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            EduFlix goes beyond traditional certifications. We don’t just partner with companies and institutions—we collaborate with technical teams to create certifications that directly match industry needs, all powered by <strong>NJAN</strong>.
          </p>
          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-xl shadow-lg p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-fuchsia-700 mb-4">What We Do</h4>
                <p className="text-lg text-black leading-relaxed">
                  ✔ <strong>Industry-Aligned Certifications</strong> – Designed in collaboration with technical teams, ensuring real-world relevance, guided by <strong>NJAN-Insight</strong>.<br /><br />
                  ✔ <strong>Job Simulation Certifications</strong> – Hands-on projects and real-world problem-solving to make users job-ready, assessed by <strong>NJAN-Personal</strong>.<br /><br />
                  ✔ <strong>Direct Hiring Pipeline</strong> – Our certifications match recruiter expectations, making it easier for companies to hire from our talent pool, facilitated by <strong>NJAN-Connect</strong>.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2 p-6">
              <div className="bg-gray-50 rounded-xl shadow-lg p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"> {/* Neumorphic background */}
                <h4 className="text-2xl font-semibold text-fuchsia-700 mb-4">Why It Matters</h4>
                <p className="text-lg text-black leading-relaxed">
                  ✔ <strong>More Than a Certificate</strong> – Gain skills that match actual job requirements, validated by <strong>NJAN-Insight</strong>.<br /><br />
                  ✔ <strong>Industry-Driven Learning</strong> – Certifications built with real professionals, not just academic frameworks, powered by <strong>NJAN</strong>.<br /><br />
                  ✔ <strong>Fast-Track to Hiring</strong> – A seamless bridge between learning and career opportunities, facilitated by <strong>NJAN-Connect</strong>.<br /><br />
                  EduFlix isn’t just about learning it’s about landing your dream job.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Section: Meet NJAN – The AI Brain of EduFlix */}
      <section className="relative py-24 bg-gradient-to-br from-fuchsia-50 to-gray-50 transition-all duration-300" id="meet-njan">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-semibold text-indigo-700 mb-12">Meet NJAN The AI Brain of EduFlix</h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            NJAN a Neural Justification & Adaptive Nexus is the AI engine that powers EduFlix. It's a sophisticated ecosystem of AI models working seamlessly to provide a personalized and effective learning experience.
          </p>
          <div className="flex flex-wrap justify-center">
            {/* NJAN Sub-models */}
            <div className="w-full md:w-1/3 p-4">
              <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <h4 className="text-xl font-semibold text-indigo-700">NJAN-Curate</h4>
                <p className="text-gray-600">AI-driven content selection that picks the best courses for you.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <h4 className="text-xl font-semibold text-indigo-700">NJAN-Personal</h4>
                <p className="text-gray-600">Adaptive learning AI that modifies courses based on your progress.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <h4 className="text-xl font-semibold text-indigo-700">NJAN-Engage</h4>
                <p className="text-gray-600">Motivation & Gamification AI that tracks streaks and sends engagement triggers.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <h4 className="text-xl font-semibold text-indigo-700">NJAN-Tutor</h4>
                <p className="text-gray-600">AI-powered tutor that answers questions and acts as a virtual mentor.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <h4 className="text-xl font-semibold text-indigo-700">NJAN-Insight</h4>
                <p className="text-gray-600">AI Analytics & Progress Reports that track performance & suggest improvements.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <h4 className="text-xl font-semibold text-indigo-700">NJAN-Connect</h4>
                <p className="text-gray-600">Networking AI that suggests mentors, study groups, and live discussions.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="bg-white rounded-xl shadow-md p-4 mb-4 h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <h4 className="text-xl font-semibold text-indigo-700 ">NJAN-Voice</h4>
                <p className="text-gray-600">Voice-based AI assistant that helps users navigate EduFlix.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW Testimonials Section (inserted before the Call to Action) */}
      <section className="relative py-24 bg-gradient-to-br from-gray-50 to-gray-200 transition-all duration-300" id="testimonials">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-semibold text-gray-800 mb-8">Testimonials</h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-12">
            Hear from our learners who transformed their careers with EduFlix.
          </p>
          {/* ...Insert testimonials content here... */}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-32 bg-gradient-to-br from-blue-400 to-purple-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-8">Ready to Transform Your Skills?</h2>
          <p className="text-2xl mb-8">Unlock your potential with EduFlix today!</p>
          <Link href="/Login">
            <button className="bg-white text-blue-500 font-bold py-3 px-8 rounded-full transform transition-transform duration-300 hover:scale-110 hover:shadow-lg">
              Sign Up Now
            </button>
          </Link>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2023 EduFlix. All rights reserved.</p>
            <div className="mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white mx-2">Terms of Service</a>
              <a href="#" className="text-gray-300 hover:text-white mx-2">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-white mx-2">Contact Us</a>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">Powered by NJAN – The AI Engine That Learns, Adapts & Guides</p>
        </div>
      </footer>
    </div>
  );
}
