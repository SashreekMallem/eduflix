"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from 'next/link';
import { FaUser, FaSearch, FaUserPlus, FaCheck, FaTimes, FaUsers, FaEllipsisV, FaCrown, FaMedal, FaTrophy } from 'react-icons/fa';

const API_BASE_URL = 'https://api.example.com';

interface Friend {
  user_id: number;
  username: string;
  name: string;
  headline: string;
  mutual: number;
  university?: string;
  degree?: string;
  relevant_courses?: string[];
}

const FriendCard = ({ friend }: { friend: Friend }) => (
  <div className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-6 mb-4 shadow-lg border border-gray-700">
    <div className="flex items-center mb-4">
      <div className="w-16 h-16 bg-gray-300 rounded-full mr-4"></div>
      <div>
        <h3 className="text-2xl font-bold">{friend.username}</h3>
        <p className="text-gray-400">{friend.headline}</p>
        <p className="text-gray-500">{friend.mutual} mutual connections</p>
      </div>
    </div>
    <div className="flex justify-start">
      <Link href={`/messenger/${friend.username}`} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full mr-4 flex items-center">
        Chat
      </Link>
      <Link href={`/profile/${friend.username}`} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full flex items-center">
        View Profile
      </Link>
    </div>
  </div>
);

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitations, setInvitations] = useState<{invite_id: number, sender: string}[]>([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [userId, setUserId] = useState<number>(0);
  // New state for search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{user_id: number, username: string}[]>([]);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{user_id: number, username: string}[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user_id");
    if (stored) setUserId(parseInt(stored, 10));
  }, []);

  useEffect(() => {
    if(userId){
      fetchFriends();
      fetchInvitations();
      fetchSuggestions();
    }
  }, [userId]);

  const fetchFriends = async () => {
    try {
      const res = await fetch(`http://localhost:8000/friends?user_id=${userId}`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`http://localhost:8000/friends/invitations?user_id=${userId}`);
      const data = await res.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  };

  // New function to search users
  const searchUsers = async (query: string) => {
    try {
      const res = await fetch(`http://localhost:8000/user/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error("Error searching users:", err);
    }
  };

  // Update search query and trigger search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if(query.trim()){
      searchUsers(query.trim());
    } else {
      setSearchResults([]);
    }
  };

  // Reuse sendInvite for search result invites
  const sendInvite = async (receiverUsername: string) => {
    try {
      // Prevent duplicate animation if already sent
      if(sentInvites.includes(receiverUsername)) return;
      const formData = new FormData();
      formData.append("sender_id", userId.toString());
      formData.append("receiver_username", receiverUsername);
      await fetch("http://localhost:8000/friends/invite", {
        method: "POST",
        body: formData,
      });
      // Set sent invitation state to trigger button animation
      setSentInvites(prev => [...prev, receiverUsername]);
      // Remove the animation after 3 seconds
      setTimeout(() => {
        setSentInvites(prev => prev.filter(name => name !== receiverUsername));
      }, 3000);
      fetchInvitations();
    } catch (err) {
      console.error("Error sending invite:", err);
    }
  };

  const acceptInvite = async (invite_id: number) => {
    try {
      const formData = new FormData();
      formData.append("invite_id", invite_id.toString());
      const res = await fetch("http://localhost:8000/friends/accept", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log(data.message);
      fetchInvitations();
      fetchFriends();
      fetchSuggestions();
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  // New function to fetch suggestions from backend
  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`http://localhost:8000/user/suggestions?user_id=${userId}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // Function to update user activity status
  const updateUserActivity = async () => {
    try {
      const formData = new FormData();
      formData.append("user_id", userId.toString());
      await fetch(`${API_BASE_URL}/user/activity`, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Error updating user activity status:", err);
    }
  };

  useEffect(() => {
    // Periodically update user activity status
    const interval = setInterval(() => {
      updateUserActivity();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="bg-[#0B0F19] text-white min-h-screen font-poppins">
      <header className="bg-[#121826] p-6 shadow-lg">
        <h1 className="text-3xl font-bold">Edu Network</h1>
      </header>
      <div className="container mx-auto p-8 flex">
        <aside className="w-1/4 pr-8">
          <div className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-4 mb-4 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <FaUserPlus className="mr-2" /> Study Invites
            </h2>
            <ul>
              {invitations.map((invite) => (
                <li key={invite.invite_id} className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div>
                    <Link href={`/profile/${invite.sender}`} className="hover:underline">
                      {invite.sender}
                    </Link>
                  </div>
                  <div>
                    <button onClick={() => acceptInvite(invite.invite_id)} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-full mr-2">
                      <FaCheck />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="w-3/4">
          <div className="flex items-center mb-4">
            <FaSearch className="mr-2" />
            <input
              type="text"
              placeholder="Search study buddies..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-gray-700 text-white rounded-full px-4 py-2 w-full focus:outline-none shadow-md"
            />
          </div>
          {/* Render search results */}
          {searchResults.length > 0 && (
            <div className="mb-4 bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-2">Search Results</h2>
              <ul>
                {searchResults.map(user => (
                  <li key={user.user_id} className="flex items-center justify-between py-2 border-b border-gray-700">
                    <span>{user.username}</span>
                    <button
                      onClick={() => sendInvite(user.username)}
                      disabled={sentInvites.includes(user.username)}
                      className={`${
                        sentInvites.includes(user.username) 
                          ? "bg-green-500 animate-pulse" 
                          : "bg-purple-600 hover:bg-purple-700"
                      } text-white px-4 py-1 rounded-full flex items-center`}
                    >
                      {sentInvites.includes(user.username) ? "Sent" : (<><FaUserPlus className="inline-block mr-1"/> Send Invite</>)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-4 mb-4 shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold flex items-center">
                <FaUsers className="mr-2" /> My Study Buddies
              </h2>
            </div>
            <ul>
              {friends.map((friend) => (
                <li key={friend.user_id} className="py-2">
                  <FriendCard friend={friend} />
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-800 bg-opacity-20 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <FaUserPlus className="mr-2" /> Suggested Study Buddies
            </h2>
            <ul>
              {suggestions.map((sugg) => (
                <li key={sugg.user_id} className="flex items-center justify-between py-2 border-b border-gray-700">
                  <span>{sugg.username}</span>
                  <button
                    onClick={() => sendInvite(sugg.username)}
                    disabled={sentInvites.includes(sugg.username)}
                    className={`${
                      sentInvites.includes(sugg.username) 
                        ? "bg-green-500 animate-pulse" 
                        : "bg-purple-600 hover:bg-purple-700"
                    } text-white px-4 py-1 rounded-full flex items-center`}
                  >
                    {sentInvites.includes(sugg.username) ? "Sent" : (<><FaUserPlus className="inline-block mr-1"/> Connect</>)}
                  </button>
                </li>
              ))}
            </ul>
            <button className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full">
              Find More
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

