"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaPaperPlane, FaSearch, FaEllipsisV, FaPhone, FaVideo, FaUsers } from 'react-icons/fa';
import Link from 'next/link';

export default function MessengerPage() {
  const { friendName } = useParams();
  const searchParams = useSearchParams();
  const lastMessage = searchParams.get('lastMessage') || '';
  const [messages, setMessages] = useState([{ sender: 'Them', text: lastMessage }]);
  const [input, setInput] = useState('');
  const [friends, setFriends] = useState([
    { name: 'Alice', lastMessage: "Hey, let's study tonight!", status: 'online' },
    { name: 'Bob', lastMessage: "Did you finish the assignment?", status: 'idle' },
    { name: 'Charlie', lastMessage: "I need help with this.", status: 'dnd' },
    { name: 'David', lastMessage: "See you later!", status: 'offline' },
    { name: 'Eve', lastMessage: "New course available!", status: 'online' },
  ]);
  const [currentFriend, setCurrentFriend] = useState(friendName);

  useEffect(() => {
    setCurrentFriend(friendName);
  }, [friendName]);

  const sendMessage = () => {
    if (input.trim() !== '') {
      setMessages([...messages, { sender: 'You', text: input }]);
      setInput('');
    }
  };

  const currentFriendData = friends.find(friend => friend.name === currentFriend);
  const status = currentFriendData ? currentFriendData.status : 'offline';

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar - Friends List */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <h3 className="text-xl font-bold">Study Buddies</h3>
          <button className="text-gray-400 hover:text-white">
            <FaEllipsisV />
          </button>
        </div>
        {/* Search Bar */}
        <div className="flex items-center mb-2 px-4 py-1">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search"
            className="bg-gray-800 text-white rounded-full px-3 py-2 w-full focus:outline-none"
          />
        </div>
        {/* Friends List */}
        <ul className="flex-1 overflow-y-auto">
          {friends.map((friend, index) => (
            <li
              key={index}
              className={`px-4 py-3 hover:bg-gray-800 transition-colors duration-200 cursor-pointer ${
                currentFriend === friend.name ? 'bg-gray-800' : ''
              }`}
            >
              <Link href={`/messenger/${friend.name}?lastMessage=${friend.lastMessage}`} className="block">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700">
                    {/* Placeholder for friend's profile picture */}
                  </div>
                  <div>
                    <div className="font-medium">{friend.name}</div>
                    <div className="text-sm text-gray-400">{friend.lastMessage}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <Link href={`/profile/${currentFriend}`} className="text-2xl font-bold mr-3 hover:underline">
              {currentFriend}
            </Link>
            <div
              className={`w-3 h-3 rounded-full ${
                status === "online"
                  ? "bg-green-500"
                  : status === "idle"
                  ? "bg-yellow-500"
                  : status === "dnd"
                  ? "bg-red-500"
                  : "bg-gray-500"
              }`}
            />
          </div>
          <div>
            <button className="p-2 text-gray-400 hover:text-white">
              <FaPhone />
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <FaVideo />
            </button>
            <Link href="/discussion" className="p-2 text-gray-400 hover:text-white">
              <FaUsers />
            </Link>
          </div>
        </div>
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`rounded-lg p-3 ${msg.sender === 'You' ? 'bg-purple-700 text-right self-end' : 'bg-gray-800 text-left self-start'}`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        {/* Chat Input */}
        <div className="border-t border-gray-700 p-3">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none shadow-md"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="ml-2 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md shadow-md"
            >
              <FaPaperPlane className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
