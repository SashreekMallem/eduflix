"use client";
import { useState } from "react";
import { FaPlus, FaHashtag, FaMicrophone, FaHeadphones, FaCog, FaUsers } from 'react-icons/fa';
import Link from 'next/link';

export default function StudyGroupPage() {
  // Dummy data
  const initialChannels = ["javascript", "python", "react", "data-science", "global", "course", "friends"];
  const initialMessages = {
    javascript: [
      { user: "Alice", text: "Hi everyone!" },
      { user: "Bob", text: "Hello Alice!" },
      { user: "Charlie", text: "Anyone up for a study session?" },
    ],
    python: [{ user: "David", text: "This is a random channel!" }],
    react: [{ user: "Eve", text: "New course available!" }],
    "data-science": [{ user: "Alice", text: "Need help with this assignment." }],
    global: [{ user: "GlobalUser1", text: "Welcome to the global channel!" }],
    course: [{ user: "CourseUser1", text: "Discussing the course content here." }],
    friends: [{ user: "Alice", text: "Hey friends, let's study together!" }],
  };
  const members = [
    { name: "Alice", status: "online" },
    { name: "Bob", status: "idle" },
    { name: "Charlie", status: "dnd" },
    { name: "David", status: "offline" },
    { name: "Eve", status: "online" },
  ];
  const globalMembers = Array.from({ length: 1000 }, (_, i) => ({
    name: `GlobalUser${i + 1}`,
    status: Math.random() > 0.5 ? "online" : "offline",
  }));
  const courseMembers = Array.from({ length: 500 }, (_, i) => ({
    name: `CourseUser${i + 1}`,
    status: Math.random() > 0.5 ? "online" : "offline",
  }));
  const friendsMembers = [
    { name: "Alice", status: "online" },
    { name: "Bob", status: "idle" },
    { name: "Charlie", status: "dnd" },
  ];

  const [channels, setChannels] = useState(initialChannels);
  const [messages, setMessages] = useState(initialMessages);
  const [currentChannel, setCurrentChannel] = useState("javascript");
  const [input, setInput] = useState("");
  const [showStatusMembers, setShowStatusMembers] = useState({
    online: false,
    idle: false,
    dnd: false,
    offline: false,
  });

  const sendMessage = () => {
    if (input.trim() !== "") {
      const newMessage = { user: "You", text: input };
      setMessages({
        ...messages,
        [currentChannel]: [...messages[currentChannel], newMessage],
      });
      setInput("");
    }
  };

  const handleChannelClick = (channel) => {
    setCurrentChannel(channel);
    setShowStatusMembers({ online: false, idle: false, dnd: false, offline: false });
  };

  const getMembersForChannel = (channel) => {
    switch (channel) {
      case "global":
        return globalMembers;
      case "course":
        return courseMembers;
      case "friends":
        return friendsMembers;
      default:
        return members;
    }
  };

  const currentMembers = getMembersForChannel(currentChannel);

  const getStatusCounts = (members) => {
    return members.reduce(
      (acc, member) => {
        acc[member.status]++;
        return acc;
      },
      { online: 0, idle: 0, dnd: 0, offline: 0 }
    );
  };

  const statusCounts = getStatusCounts(currentMembers);

  const toggleStatusMembers = (status) => {
    setShowStatusMembers({
      ...Object.keys(showStatusMembers).reduce((acc, key) => {
        acc[key] = key === status ? !showStatusMembers[key] : false;
        return acc;
      }, {}),
      [status]: !showStatusMembers[status],
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Left Sidebar - Channels */}
      <div className="w-64 border-r border-gray-700 flex flex-col p-3 bg-gradient-to-br from-purple-900 to-gray-900 shadow-lg">
        <h2 className="text-2xl font-bold mb-3 text-center text-purple-400">EduFlix Study</h2>
        <div className="flex items-center justify-between mb-2">
          <h3 className="uppercase text-sm text-gray-400">Channels</h3>
          <button className="text-gray-400 hover:text-white">
            <FaPlus />
          </button>
        </div>
        <ul>
          {channels.map((channel, idx) => (
            <li
              key={idx}
              className={`flex items-center py-2 px-3 rounded-lg hover:bg-purple-800 cursor-pointer transition-colors duration-200 ${
                currentChannel === channel ? "bg-purple-800" : ""
              }`}
              onClick={() => handleChannelClick(channel)}
            >
              <FaHashtag className="mr-2 text-gray-500" />
              {channel}
            </li>
          ))}
        </ul>
      </div>

      {/* Center Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg rounded-lg mx-4">
        {/* Chat Header */}
        <div className="border-b border-gray-700 p-3 flex items-center justify-between bg-gradient-to-r from-purple-900 to-gray-900 rounded-t-lg">
          <h2 className="text-xl font-semibold flex items-center text-purple-400">
            <FaHashtag className="mr-2" />
            {currentChannel}
          </h2>
          <div>
            <button className="p-2 text-gray-400 hover:text-white">
              <FaMicrophone />
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <FaHeadphones />
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <FaCog />
            </button>
            <Link href="/discussion" className="p-2 text-gray-400 hover:text-white">
              <FaUsers />
            </Link>
          </div>
        </div>
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages[currentChannel]?.map((msg, idx) => (
            <div key={idx} className="flex space-x-2 items-start">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0" />
              <div className="bg-gray-800 p-3 rounded-lg shadow-md">
                <p className="text-sm font-bold text-purple-400">{msg.user}</p>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Chat Input */}
        <div className="border-t border-gray-700 p-3 bg-gradient-to-r from-purple-900 to-gray-900 rounded-b-lg">
          <div className="flex items-center">
            <input
              type="text"
              placeholder={`Message #${currentChannel}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-gray-800 rounded-lg px-4 py-2 focus:outline-none shadow-md"
            />
            <button
              onClick={sendMessage}
              className="ml-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-colors duration-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Members */}
      <div className="w-64 border-l border-gray-700 flex flex-col p-3 bg-gradient-to-br from-purple-900 to-gray-900 shadow-lg">
        <h3 className="uppercase text-sm text-gray-400 mb-2">
          Members {currentMembers.length}
        </h3>
        <ul className="space-y-2">
          {Object.keys(statusCounts).map((status) => (
            <li key={status} className="flex flex-col">
              <div className="flex items-center space-x-2 cursor-pointer hover:underline" onClick={() => toggleStatusMembers(status)}>
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
                <span className="text-sm">{status} {statusCounts[status]}</span>
              </div>
              {showStatusMembers[status] && (
                <div
                  className="mt-2 p-2 border border-gray-700 rounded-lg overflow-y-auto bg-gray-800 shadow-md"
                  style={{ maxHeight: "200px" }}
                >
                  <h4 className="text-sm text-gray-400">
                    {status.charAt(0).toUpperCase() + status.slice(1)} Members
                  </h4>
                  <ul className="space-y-1">
                    {currentMembers
                      .filter((member) => member.status === status)
                      .map((member, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <span className="text-sm">{member.name}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

