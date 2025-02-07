"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUser, FaSearch, FaUserPlus, FaCheck, FaTimes, FaUsers } from 'react-icons/fa';

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([
    { name: 'Jane Smith', headline: 'AI Enthusiast', mutual: 15 },
    { name: 'Mike Johnson', headline: 'Python Developer', mutual: 25 },
  ]);
  const [connectionSuggestions, setConnectionSuggestions] = useState([
    { name: 'Emily Brown', headline: 'Data Scientist', mutual: 60 },
    { name: 'David Wilson', headline: 'Web Developer', mutual: 80 },
  ]);
  const [sortBy, setSortBy] = useState('name'); // Default sorting

  useEffect(() => {
    // Load friends data from local storage or API
    const stored = localStorage.getItem('profileData');
    if (stored) {
      const data = JSON.parse(stored);
      // Assuming friends are stored in profileData
      if (data.friends) {
        setFriends(data.friends);
      } else {
        // Use default friends if not found in local storage
        setDefaultFriends();
      }
    } else {
      // Use default friends if no profile data exists
      setDefaultFriends();
    }
  }, []);

  const setDefaultFriends = () => {
    // Set default friends data
    const defaultFriends = [
      { name: 'Alice', headline: 'AI Engineer', mutual: 55 },
      { name: 'Bob', headline: 'Data Scientist', mutual: 32 },
      { name: 'Charlie', headline: 'Web Developer', mutual: 120 },
      { name: 'David', headline: 'Software Engineer', mutual: 12 },
      { name: 'Eve', headline: 'Machine Learning Expert', mutual: 78 },
    ];
    setFriends(defaultFriends);
  };

  const handleAcceptRequest = (index) => {
    const acceptedRequest = connectionRequests[index];
    setFriends([...friends, acceptedRequest]);
    setConnectionRequests(connectionRequests.filter((_, i) => i !== index));
  };

  const handleDeclineRequest = (index) => {
    setConnectionRequests(connectionRequests.filter((_, i) => i !== index));
  };

  const handleAddSuggestion = (index) => {
    const addedSuggestion = connectionSuggestions[index];
    setFriends([...friends, addedSuggestion]);
    setConnectionSuggestions(connectionSuggestions.filter((_, i) => i !== index));
  };

  const sortedFriends = [...friends].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'mutual') {
      return b.mutual - a.mutual; // Sort by mutual connections, descending
    }
    return 0;
  });

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="bg-gray-800 p-4">
        <h1 className="text-2xl font-bold">Edu Network</h1>
      </header>
      <div className="container mx-auto p-8 flex">
        {/* Left Sidebar - Study Invites */}
        <div className="w-1/4 pr-8">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <FaUserPlus className="mr-2" /> Study Invites
            </h2>
            <ul>
              {connectionRequests.map((request, index) => (
                <li key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div>
                    <Link href={`/profile/${request.name}`} className="hover:underline">
                      {request.name}
                    </Link>
                    <p className="text-gray-400 text-sm">{request.headline}</p>
                  </div>
                  <div>
                    <button onClick={() => handleAcceptRequest(index)} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-full mr-2">
                      <FaCheck />
                    </button>
                    <button onClick={() => handleDeclineRequest(index)} className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded-full">
                      <FaTimes />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content - Study Buddies and Suggestions */}
        <div className="w-3/4">
          <div className="flex items-center mb-4">
            <FaSearch className="mr-2" />
            <input
              type="text"
              placeholder="Search study buddies..."
              className="bg-gray-700 text-white rounded-full px-4 py-2 w-full"
            />
          </div>

          {/* Study Buddies List */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold flex items-center">
                <FaUsers className="mr-2" /> My Study Buddies
              </h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded-full px-4 py-2"
              >
                <option value="name">Sort by Name</option>
                <option value="mutual">Sort by Mutual Study Buddies</option>
              </select>
            </div>
            <ul>
              {sortedFriends.map((friend, index) => (
                <li key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700">
                      {/* Placeholder for friend's profile picture */}
                    </div>
                    <div>
                      <Link href={`/profile/${friend.name}`} className="text-lg font-semibold hover:underline">
                        {friend.name}
                      </Link>
                      <p className="text-gray-400 text-sm">{friend.headline}</p>
                      <p className="text-gray-500 text-sm">{friend.mutual}+ study buddies in common</p>
                    </div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full">
                    Collaborate
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Study Buddies */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <FaUserPlus className="mr-2" /> Suggested Study Buddies
            </h2>
            <ul>
              {connectionSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700">
                      {/* Placeholder for suggestion's profile picture */}
                    </div>
                    <div>
                      <Link href={`/profile/${suggestion.name}`} className="text-lg font-semibold hover:underline">
                        {suggestion.name}
                      </Link>
                      <p className="text-gray-400 text-sm">{suggestion.headline}</p>
                      <p className="text-gray-500 text-sm">{suggestion.mutual}+ study buddies in common</p>
                    </div>
                  </div>
                  <button onClick={() => handleAddSuggestion(index)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full">
                    Invite to Study
                  </button>
                </li>
              ))}
            </ul>
            <button className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full">
              Find More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

