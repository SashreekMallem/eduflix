"use client";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { FaPlus, FaHashtag, FaMicrophone, FaHeadphones, FaCog, FaUsers, FaPaperPlane, FaSearch, FaEllipsisV, FaCheck, FaQuoteLeft, FaHeart, FaLaugh, FaRocket, FaThumbtack, FaCode, FaChartBar, FaQuestionCircle } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Friend {
  name: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

interface Message {
  message_id?: number;
  user: string;
  text: string;
  timestamp?: string;
}

interface StudyGroup {
  group_id: number;
  name: string;
  description?: string;
}

export default function StudyGroupPage() {
  const API_BASE_URL = "http://localhost:8000";
  const router = useRouter();
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [userId, setUserId] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("auth_user_id");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [currentChannel, setCurrentChannel] = useState("");
  const [input, setInput] = useState("");
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [showStatusMembers, setShowStatusMembers] = useState({
    online: false,
    idle: false,
    dnd: false,
    offline: false,
  });
  const [typing, setTyping] = useState(false);
  const [lastTypedTime, setLastTypedTime] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState("");
  const [groupMembers, setGroupMembers] = useState<Friend[]>([]);
  // New state for adding members to an existing group
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState("");

  useEffect(() => {
    // Fetch study groups from the backend including the logged-in userId in query params
    fetch(`${API_BASE_URL}/study-groups?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.study_groups) {
          const groups: StudyGroup[] = data.study_groups.map((g: any) => ({
            group_id: g[0],
            name: g[1],
            description: g[2]
          }));
          setStudyGroups(groups);
          if (groups.length && !currentChannel) {
            setCurrentChannel(groups[0].name);
          }
        }
      })
      .catch(err => console.error("Error fetching study groups:", err));
  }, [userId]);

  useEffect(() => {
    // Fetch messages from backend when currentChannel changes
    const currentGroup = studyGroups.find(group => group.name === currentChannel);
    if (currentGroup) {
      fetch(`${API_BASE_URL}/study-groups/${currentGroup.group_id}/messages`)
        .then(res => res.json())
        .then(data => {
          setMessages(prev => ({
            ...prev,
            [currentChannel]: data.messages.map((msg: any) => ({
              user: msg.user_id === userId ? "You" : msg.username,
              text: msg.text,
              timestamp: msg.timestamp,
              message_id: msg.message_id
            }))
          }));
        })
        .catch(err => console.error("Error fetching messages:", err));
      fetch(`${API_BASE_URL}/study-groups/${currentGroup.group_id}/members`)
        .then(res => res.json())
        .then(data => {
          // Expecting data.members to be an array of Friend objects
          setGroupMembers(data.members);
        })
        .catch(err => console.error("Error fetching group members:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannel, studyGroups]);

  useEffect(() => {
    // Simulate typing indicator
    if (typing) {
      const now = Date.now();
      if (now - lastTypedTime > 1000) {
        setTyping(false);
      }
    }
  }, [typing, lastTypedTime]);

  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      setTyping(false);
    }, 1000);

    return () => clearTimeout(typingTimeout);
  }, [input]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setTyping(true);
    setLastTypedTime(Date.now());
  };

  const sendMessage = async () => {
    if (input.trim() !== "") {
      const currentGroup = studyGroups.find(group => group.name === currentChannel);
      if (currentGroup) {
        try {
          const formData = new FormData();
          formData.append("user_id", userId.toString());
          formData.append("text", input);
          const res = await fetch(`${API_BASE_URL}/study-groups/${currentGroup.group_id}/messages`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          // Optionally, update messages with backend response
          setMessages(prev => ({
            ...prev,
            [currentChannel]: [
              ...(prev[currentChannel] || []),
              { user: "You", text: input, message_id: data.message_id }
            ]
          }));
        } catch (err) {
          console.error("Error sending message:", err);
        }
      }
      setInput("");
      setTyping(false);
    }
  };

  const handleChannelClick = (channel: string) => {
    setCurrentChannel(channel);
    setShowStatusMembers({ online: false, idle: false, dnd: false, offline: false });
  };

  const getMembersForChannel = (channel: string): Friend[] => {
    return groupMembers;
  };

  const currentMembers = getMembersForChannel(currentChannel) || [];

  const getStatusCounts = (members: Friend[] = []) => {
    return members.reduce(
      (acc: { [key: string]: number }, member: Friend) => {
        acc[member.status] = (acc[member.status] || 0) + 1;
        return acc;
      },
      { online: 0, idle: 0, dnd: 0, offline: 0 }
    );
  };

  const statusCounts = getStatusCounts(currentMembers);

  const toggleStatusMembers = (status: keyof typeof showStatusMembers) => {
    setShowStatusMembers({
      ...Object.keys(showStatusMembers).reduce((acc, key) => {
        acc[key as keyof typeof showStatusMembers] = key === status ? !showStatusMembers[key as keyof typeof showStatusMembers] : false;
        return acc;
      }, {} as { [key in keyof typeof showStatusMembers]: boolean }),
      [status]: !showStatusMembers[status],
    });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", newGroupName);
      formData.append("description", newGroupDesc);
      const res = await fetch(`${API_BASE_URL}/study-groups`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      // Update studyGroups state with the new group.
      setStudyGroups([...studyGroups, { group_id: data.group_id, name: newGroupName, description: newGroupDesc }]);
      // Optionally, send join request for invited members if provided.
      const inviteList = newGroupMembers.split(",").map(m => m.trim()).filter(m => m);
      for (const memberId of inviteList) {
        const joinForm = new FormData();
        joinForm.append("user_id", memberId);
        await fetch(`${API_BASE_URL}/study-groups/${data.group_id}/join`, {
          method: "POST",
          body: joinForm,
        });
      }
      // Set new group as current and hide form
      setCurrentChannel(newGroupName);
      setShowCreateGroup(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setNewGroupMembers("");
    } catch (err) {
      console.error("Error creating study group:", err);
    }
  };

  // New function: add members to current study group and refetch members
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberInput.trim()) return;
    const currentGroup = studyGroups.find(group => group.name === currentChannel);
    if (currentGroup) {
      const inviteList = newMemberInput
        .split(",")
        .map(m => m.trim())
        .filter(m => m);
      for (const memberId of inviteList) {
        const joinForm = new FormData();
        joinForm.append("user_id", memberId);
        await fetch(`${API_BASE_URL}/study-groups/${currentGroup.group_id}/join`, {
          method: "POST",
          body: joinForm,
        });
      }
      // Refetch group members after addition
      fetch(`${API_BASE_URL}/study-groups/${currentGroup.group_id}/members`)
        .then(res => res.json())
        .then(data => setGroupMembers(data.members))
        .catch(err => console.error("Error updating group members:", err));
      setNewMemberInput("");
      setShowAddMember(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-white font-sans overflow-hidden">
      {/* Left Sidebar - Study Groups */}
      <aside className="w-64 border-r border-gray-700 flex flex-col p-3 bg-gradient-to-br from-purple-900 to-gray-800 shadow-lg glassmorphic">
        <h2 className="text-2xl font-bold mb-3 text-center text-purple-400">EduFlix Study</h2>
        <div className="flex items-center justify-between mb-2">
          <h3 className="uppercase text-sm text-gray-400">Study Groups</h3>
          <button className="text-gray-400 hover:text-white" onClick={() => setShowCreateGroup(true)}>
            <FaPlus />
          </button>
        </div>
        <ul>
          {studyGroups.map((group, idx) => (
            <motion.li
              key={idx}
              className={`flex items-center py-2 px-3 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors duration-200 ${
                currentChannel === group.name ? "bg-purple-700" : ""
              }`}
              onClick={() => handleChannelClick(group.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaHashtag className="mr-2 text-gray-500" />
              {group.name}
            </motion.li>
          ))}
        </ul>
      </aside>

      {/* Center Chat Area */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg rounded-lg mx-4 glassmorphic">
        {/* Chat Header */}
        <header className="border-b border-gray-700 p-3 flex items-center justify-between bg-gradient-to-r from-purple-900 to-gray-800 rounded-t-lg">
          <h2 className="text-xl font-semibold flex items-center text-purple-400">
            <FaHashtag className="mr-2" />
            {currentChannel}
          </h2>
          <div className="flex items-center">
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
        </header>

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
          {typing && (
            <div className="flex space-x-2 items-start">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0" />
              <div className="bg-gray-800 p-3 rounded-lg shadow-md">
                <p className="text-sm font-bold text-purple-400">You</p>
                <p className="text-sm">Typing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-700 p-3 bg-gradient-to-r from-purple-900 to-gray-800 rounded-b-lg">
          <div className="flex items-center">
            <input
              type="text"
              placeholder={`Message #${currentChannel}`}
              value={input}
              onChange={handleInputChange}
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
      </main>

      {/* Right Sidebar - Members */}
      <div className="w-64 border-l border-gray-700 flex flex-col p-3 bg-gradient-to-br from-purple-900 to-gray-800 shadow-lg glassmorphic">
        <div className="flex items-center justify-between">
          <h3 className="uppercase text-sm text-gray-400 mb-2">
            Members {currentMembers.length}
          </h3>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={() => setShowAddMember(true)}
          >
            Add Member
          </button>
        </div>
        <ul className="space-y-2">
          {Object.keys(statusCounts).map((status) => (
            <li key={status} className="flex flex-col">
              <div className={`flex items-center space-x-2 cursor-pointer hover:underline neon ${status}`} onClick={() => toggleStatusMembers(status as keyof typeof showStatusMembers)}>
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
                <span className="text-sm">{status.charAt(0).toUpperCase() + status.slice(1)} Members</span>
                <span className="text-sm">{statusCounts[status]}</span>
              </div>
              {showStatusMembers[status as keyof typeof showStatusMembers] && (
                <div className="mt-2 p-2 border border-gray-700 rounded-lg overflow-y-auto bg-gray-800 shadow-md" style={{ maxHeight: "200px" }}>
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

      {/* Create Group Modal Popup */}
      {showCreateGroup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-60"></div>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-2xl font-semibold text-purple-400 text-center mb-4">Create Study Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                placeholder="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Invite Member IDs (comma separated)"
                value={newGroupMembers}
                onChange={(e) => setNewGroupMembers(e.target.value)}
                className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Add Member Modal Popup */}
      {showAddMember && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-60"></div>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-2xl font-semibold text-purple-400 text-center mb-4">Add Member(s) to {currentChannel}</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <input
                type="text"
                placeholder="Member IDs (comma separated)"
                value={newMemberInput}
                onChange={(e) => setNewMemberInput(e.target.value)}
                className="w-full bg-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


