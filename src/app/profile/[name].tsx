"use client";
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { name } = useParams();

  // Fake details for profile
  const fakeProfile = {
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vitae eros eget tellus tristique bibendum.",
    interests: ["Coding", "Reading", "Gaming"],
    position: "Software Engineer",
    location: "New York, USA",
    education: "B.Sc. in Computer Science",
    social: {
      twitter: "https://twitter.com/fake",
      linkedin: "https://linkedin.com/in/fake"
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-300 text-gray-900 font-sans min-h-screen">
      <Link href="/" className="text-purple-600 underline">← Back to Home</Link>
      <h1 className="text-4xl font-bold mt-4">{name}</h1>
      <p className="mt-2">{fakeProfile.bio}</p>
      <ul className="mt-4 list-disc ml-6">
        <li><strong>Position:</strong> {fakeProfile.position}</li>
        <li><strong>Location:</strong> {fakeProfile.location}</li>
        <li><strong>Education:</strong> {fakeProfile.education}</li>
        <li><strong>Interests:</strong> {fakeProfile.interests.join(', ')}</li>
      </ul>
      <div className="mt-4">
        <a href={fakeProfile.social.twitter} className="text-purple-600 underline mr-4">Twitter</a>
        <a href={fakeProfile.social.linkedin} className="text-purple-600 underline">LinkedIn</a>
      </div>
    </div>
  );
}
