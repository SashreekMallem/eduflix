import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Sashreek Mallem",
  description: "About Sashreek Mallem (Sashreek Reddy Mallem), creator of EduFlix AI - an innovative educational platform.",
  alternates: {
    canonical: "https://www.eduflixai.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      {/* SEO: Visually hidden H1 with full name */}
      <h1 className="sr-only">Sashreek Reddy Mallem</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4">About EduFlix AI</h2>
          <p className="text-xl text-gray-300">
            An innovative educational platform designed to revolutionize learning experiences
            through AI-powered technology.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-2xl font-semibold mb-3">Our Mission</h3>
            <p className="text-gray-300">
              EduFlix AI aims to provide personalized, accessible, and engaging educational
              experiences for learners worldwide. We leverage cutting-edge artificial intelligence
              to create adaptive learning pathways that cater to individual needs and learning styles.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3">Features</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>AI-powered personalized learning pathways</li>
              <li>Interactive study groups and collaboration tools</li>
              <li>Real-time discussion forums</li>
              <li>Progress tracking and analytics</li>
              <li>Comprehensive calendar integration</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3">Technology</h3>
            <p className="text-gray-300">
              Built with modern web technologies including Next.js, React, and AI integration,
              EduFlix AI delivers a seamless and responsive user experience across all devices.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3">Contact</h3>
            <p className="text-gray-300">
              For inquiries and support, please reach out through our platform or visit our
              GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
