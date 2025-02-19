"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSearch, FaEllipsisV, FaPhone, FaVideo, FaUsers, FaSmile, FaMicrophone, FaImage, FaCheck, FaStop } from 'react-icons/fa';
import Link from 'next/link';

interface Friend {
  name: string;
  lastMessage: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

interface Message {
  sender: 'You' | 'Them';
  text: string;
  username: string; // Add username field
}

export default function MessengerPage() {
  const params = useParams() as { friendName: string }; // Cast to include friendName
  const friendName = params.friendName;
  const searchParams = useSearchParams();
  const lastMessage = searchParams?.get('lastMessage') || '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentFriend, setCurrentFriend] = useState(friendName);
  const [friendStatus, setFriendStatus] = useState<'online' | 'idle' | 'dnd' | 'offline'>('offline');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false); // State for voice message recording

  // Added API base and current user id from localStorage
  const API_BASE_URL = "http://localhost:8000";
  const [userId, setUserId] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("auth_user_id");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [offerSent, setOfferSent] = useState(false);
  const [wsConnected, setWsConnected] = useState(false); // Track WebSocket connection state
  const offerTimeout = useRef<NodeJS.Timeout | null>(null); // useRef to hold the timeout
  const [incomingCall, setIncomingCall] = useState(false); // State to track incoming call
  const [callerId, setCallerId] = useState<number | null>(null); // State to store the caller's ID

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (offerTimeout.current) {
        clearTimeout(offerTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentFriend(friendName);
  }, [friendName]);

  useEffect(() => {
    // Scroll to the bottom of the chat when messages change
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch conversation messages from backend
  useEffect(() => {
    if(userId && friendName) {
      fetch(`${API_BASE_URL}/messenger/${friendName}/messages?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if(data.messages) {
            setMessages(data.messages.map((m: any) => ({
              sender: m.sender_id === userId ? "You" : "Them",
              text: m.text,
              username: m.sender_id === userId ? "You" : friendName // Use "You" for current user and friendName for friend
            })));
          }
        })
        .catch(err => console.error("Error fetching messenger messages:", err));
    }
  }, [userId, friendName]);

  // Fetch friend's status from backend
  useEffect(() => {
    if(friendName) {
      fetch(`${API_BASE_URL}/user/status?username=${friendName}`)
        .then(res => res.json())
        .then(data => {
          if(data.status) {
            setFriendStatus(data.status);
          } else {
            setFriendStatus('offline'); // Default to offline if no status is found
          }
        })
        .catch(err => {
          console.error("Error fetching friend status:", err);
          setFriendStatus('offline'); // Default to offline on error
        });
    }
  }, [friendName]);

  // Fetch friends or recent conversations
  useEffect(() => {
    if(userId) {
      fetch(`${API_BASE_URL}/friends?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if(data.friends) {
            setFriends(data.friends.map((f: any) => ({
              name: f.username,
              lastMessage: "Last message preview", // Placeholder for last message
              status: 'offline' // Default to offline, can be updated with actual status
            })));
          }
        })
        .catch(err => console.error("Error fetching friends:", err));
    }
  }, [userId]);

  const initializeWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
    setWebSocket(ws);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const handleMessage = async (message: any) => {
        try {
          console.log('Received message:', message);
          if (message.type === 'message' && message.to === userId) {
            setMessages(prev => [...prev, {
              sender: message.from === userId ? 'You' : 'Them',
              text: message.text,
              username: message.from === userId ? 'You' : currentFriend
            }]);
          } else if (message.type === 'offer' && peerConnection && peerConnection.signalingState === 'stable') {
            console.log('ws.onmessage: offer');
            try {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);
              ws.send(JSON.stringify(peerConnection.localDescription));
            } catch (e) {
              console.error('Error handling offer:', e);
            }
          } else if (message.type === 'answer' && peerConnection && peerConnection.signalingState === 'have-remote-offer') {
            console.log('ws.onmessage: answer');
            try {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
            } catch (e) {
              console.error('Error handling answer:', e);
            }
          } else if (message.type === 'candidate') {
            console.log('ws.onmessage: candidate');
            try {
              await peerConnection?.addIceCandidate(new RTCIceCandidate(message.candidate));
            } catch (e) {
              console.error('Error adding ICE candidate:', e);
            }
          } else if (message.type === 'ringing') {
            // Handle incoming call notification
            console.log('Incoming call from:', message.from);
            setIncomingCall(true);
            setCallerId(message.from);
          } else if (message.type === 'accept') {
            // Handle call accept
            console.log('Call accepted');
            clearTimeout(offerTimeout.current as NodeJS.Timeout);
          } else if (message.type === 'reject') {
            // Handle call reject
            console.log('Call rejected');
            clearTimeout(offerTimeout.current as NodeJS.Timeout);
            hangUp();
          } else if (message.type === 'hangup') {
            // Handle call hangup
            console.log('Call ended by remote peer');
            hangUp();
          } else {
            console.warn('Received unknown message type:', message.type);
          }
        } catch (e) {
          console.error('ws.onmessage: error', e);
        }
      };

      const message = JSON.parse(event.data);
      handleMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      // Reinitialize WebSocket connection if it gets closed
      initializeWebSocket();
    };
  };

  useEffect(() => {
    initializeWebSocket();
  }, [userId, currentFriend]);

  const sendMessage = () => {
    if (input.trim() !== '') {
      // Fetch the friend's user ID and send it as the 'to' field
      fetch(`${API_BASE_URL}/user/profile?username=${currentFriend}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.user_id) {
            const recipientId = data.user_id;
            const message = {
              type: 'message',
              to: recipientId, // Send to the friend's user ID
              from: userId,
              text: input
            };
            webSocket?.send(JSON.stringify(message));
            setMessages(prevMessages => [...prevMessages, { sender: 'You', text: input, username: 'You' }]);
            setInput('');
          } else {
            console.error("Could not fetch recipient's user ID.");
          }
        })
        .catch(err => console.error("Error fetching recipient's user ID:", err));
    }
  };

  const initiateVoiceCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      const pc = new RTCPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate);
          webSocket?.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState);
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection State Change:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State Change:', pc.iceConnectionState);
      };

      pc.ontrack = (event) => {
        console.log('ontrack', event);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
      setWebSocket(ws);

      ws.onopen = async () => {
        console.log('ws.onopen');
        setWsConnected(true); // Set WebSocket connected state

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);

            if (message.type === 'offer' && pc.signalingState === 'stable') {
              console.log('ws.onmessage: offer');
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(message));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify(pc.localDescription));
              } catch (e) {
                console.error('Error handling offer:', e);
              }
            } else if (message.type === 'answer' && pc.signalingState === 'have-remote-offer') {
              console.log('ws.onmessage: answer');
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(message));
              } catch (e) {
                console.error('Error handling answer:', e);
              }
            } else if (message.type === 'candidate') {
              console.log('ws.onmessage: candidate');
              try {
                await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            } else if (message.type === 'ringing') {
              // Handle incoming call notification
              console.log('Incoming call from:', message.from);
              setIncomingCall(true);
              setCallerId(message.from);
            } else if (message.type === 'accept') {
              // Handle call accept
              console.log('Call accepted');
              clearTimeout(offerTimeout.current as NodeJS.Timeout);
            } else if (message.type === 'reject') {
              // Handle call reject
              console.log('Call rejected');
              clearTimeout(offerTimeout.current as NodeJS.Timeout);
              hangUp();
            } else if (message.type === 'hangup') {
              // Handle call hangup
              console.log('Call ended by remote peer');
              hangUp();
            } else {
              console.warn('Received unknown message type:', message.type);
            }
          } catch (e) {
            console.error('ws.onmessage: error', e);
          }
        };

        ws.onerror = (error) => {
          console.error('ws.onerror', error);
        };

        ws.onclose = () => {
          console.log('ws.onclose');
          setWsConnected(false); // Reset WebSocket connected state
          setOfferSent(false);
          setIncomingCall(false);
          setCallerId(null);
        };

        // Send "ringing" notification
        // Fetch the friend's user ID and send it as the 'to' field
        fetch(`${API_BASE_URL}/user/profile?username=${friendName}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.user_id) {
              const recipientId = data.user_id;
              ws.send(JSON.stringify({ type: 'ringing', to: recipientId, from: userId }));
            } else {
              console.error("Could not fetch recipient's user ID.");
            }
          })
          .catch(err => console.error("Error fetching recipient's user ID:", err));

        // Send offer only once
        if (!offerSent) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify(pc.localDescription));
            setOfferSent(true);

            // Set a timeout to stop sending offers after 10 seconds
            offerTimeout.current = setTimeout(() => {
              console.log('Offer timeout reached. Stopping offer attempts.');
              setOfferSent(false);
              hangUp(); // Hang up the call
            }, 10000);
          } catch (e) {
            console.error('Error creating and sending offer:', e);
          }
        }
      };
    } catch (err) {
      console.error('initiateVoiceCall: error', err);
    }
  };

  const acceptCall = async () => {
    console.log('Accepting call');
    webSocket?.send(JSON.stringify({ type: 'accept', to: callerId, from: userId }));
    setIncomingCall(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      const pc = new RTCPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate:', event.candidate);
          webSocket?.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState);
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection State Change:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State Change:', pc.iceConnectionState);
      };

      pc.ontrack = (event) => {
        console.log('ontrack', event);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
      setWebSocket(ws);

      ws.onopen = async () => {
        console.log('ws.onopen');
        setWsConnected(true); // Set WebSocket connected state

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);

            if (message.type === 'offer' && pc.signalingState === 'stable') {
              console.log('ws.onmessage: offer');
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(message));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify(pc.localDescription));
              } catch (e) {
                console.error('Error handling offer:', e);
              }
            } else if (message.type === 'answer' && pc.signalingState === 'have-remote-offer') {
              console.log('ws.onmessage: answer');
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(message));
              } catch (e) {
                console.error('Error handling answer:', e);
              }
            } else if (message.type === 'candidate') {
              console.log('ws.onmessage: candidate');
              try {
                await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            } else if (message.type === 'ringing') {
              // Handle incoming call notification
              console.log('Incoming call from:', message.from);
              setIncomingCall(true);
              setCallerId(message.from);
            } else if (message.type === 'accept') {
              // Handle call accept
              console.log('Call accepted');
              clearTimeout(offerTimeout.current as NodeJS.Timeout);
            } else if (message.type === 'reject') {
              // Handle call reject
              console.log('Call rejected');
              clearTimeout(offerTimeout.current as NodeJS.Timeout);
              hangUp();
            } else if (message.type === 'hangup') {
              // Handle call hangup
              console.log('Call ended by remote peer');
              hangUp();
            } else {
              console.warn('Received unknown message type:', message.type);
            }
          } catch (e) {
            console.error('ws.onmessage: error', e);
          }
        };

        ws.onerror = (error) => {
          console.error('ws.onerror', error);
        };

        ws.onclose = () => {
          console.log('ws.onclose');
          setWsConnected(false); // Reset WebSocket connected state
          setOfferSent(false);
          setIncomingCall(false);
          setCallerId(null);
        };
      };
    } catch (err) {
      console.error('acceptCall: error', err);
    }
  };

  // Added rejectCall function to handle call rejection
  const rejectCall = () => {
    console.log('Rejecting call');
    webSocket?.send(JSON.stringify({ type: 'reject', to: callerId, from: userId }));
    setIncomingCall(false);
    setCallerId(null);
    hangUp(); // Optionally close and clean up the call
  };

  const initiateVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      const pc = new RTCPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      setPeerConnection(pc);

      const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
      setWebSocket(ws);

      ws.onopen = async () => {
        // Set up ws.onmessage and pc callbacks inside onopen
        ws.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(message));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify(pc.localDescription));
          } else if (message.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(message));
          } else if (message.type === 'candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
          }
        };

        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        // Create and send offer only when ws is open
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify(pc.localDescription));
      };

      ws.onerror = (err) => {
        console.error("Error in WebSocket connection:", err);
      };
    } catch (err) {
      console.error("Error initiating video call:", err);
    }
  };

  const hangUp = () => {
    console.log('hangUp');
    peerConnection?.close();
    setPeerConnection(null);
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setOfferSent(false);
    setIncomingCall(false);
    setCallerId(null);
    webSocket?.send(JSON.stringify({ type: 'hangup', to: callerId, from: userId })); // Send hangup message
  };

  const currentFriendData = friends.find(friend => friend.name === currentFriend);
  const status = currentFriendData ? currentFriendData.status : 'offline';
  const chatBackgroundStyle = {
    backgroundImage: 'url("https://picsum.photos/800/600")', // Updated with a valid URL
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.3, // Adjust opacity for a subtle effect
  };

  const handleSwipeLeft = (index: number) => {};

  const handleHold = (index: number) => {};

  const handleDoubleTap = (index: number) => {};

  const handleVoiceMessage = () => {
    // Implement voice message recording logic
    setIsRecording(!isRecording);
    alert('Voice message recording started/stopped');
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
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans overflow-hidden">
      {/* Left Sidebar - Friends List */}
      <aside className="w-64 border-r border-gray-700 flex flex-col glassmorphism">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <h3 className="text-xl font-bold">Study Buddies</h3>
          <button className="text-gray-400 hover:text-white">
            <FaEllipsisV />
          </button>
        </div>
        {/* Search Bar with AI Suggestions */}
        <div className="flex items-center mb-2 px-4 py-1">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Find friends learning Deep Learning 🚀"
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
                  <div className="w-8 h-8 rounded-full bg-gray-700 relative">
                    {/* 3D Profile Avatars with Live Status Animations */}
                    <div
                      className={`absolute inset-0 rounded-full border-2 ${
                        friend.status === 'online' ? 'border-green-500 animate-pulse' : 'border-transparent'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{friend.name}</div>
                    <div className="text-sm text-gray-400">
                      {/* Last Message Preview & Read Receipts */}
                      {friend.lastMessage} <FaCheck className="inline-block ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Dynamic Chat Background */}
        <div className="absolute inset-0" style={chatBackgroundStyle} />
        {/* Chat Header */}
        <header className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between relative z-10">
          <div className="flex items-center">
            <Link href={`/profile/${currentFriend}`} className="text-2xl font-bold mr-3 hover:underline">
              {currentFriend}
            </Link>
            <div
              className={`w-3 h-3 rounded-full ${
                friendStatus === "online"
                  ? "bg-green-500"
                  : friendStatus === "idle"
                  ? "bg-yellow-500"
                  : friendStatus === "dnd"
                  ? "bg-red-500"
                  : "bg-gray-500"
              }`}
            />
          </div>
          <div className="flex space-x-3">
            {/* Floating Call Button */}
            <button className="p-2 text-gray-400 hover:text-white" onClick={initiateVoiceCall}>
              <FaPhone />
            </button>
            <button className="p-2 text-gray-400 hover:text-white" onClick={initiateVideoCall}>
              <FaVideo />
            </button>
            <Link href="/discussion" className="p-2 text-gray-400 hover:text-white">
              <FaUsers />
            </Link>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start ${msg.sender === 'You' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center ${msg.sender === 'You' ? 'ml-3' : 'mr-3'}`}>
                {msg.username.charAt(0).toUpperCase()}
              </div>
              <div className={`rounded-lg p-3 ${msg.sender === 'You' ? 'bg-purple-700 text-right self-end' : 'bg-gray-800 text-left self-start'} cinematic-chat-bubble`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} /> {/* Scroll anchor */}
        </div>

        {/* Chat Input */}
        <footer className="border-t border-gray-700 p-3 relative z-10">
          <div className="flex items-center">
            {/* Expandable Input Box */}
            <input
              type="text"
              placeholder="Type a message... Need help with Python? 💡"
              className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none shadow-md expandable-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            {/* Send Button Animation */}
            <button
              onClick={sendMessage}
              className="ml-2 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md shadow-md glowing-paper-plane"
            >
              <FaPaperPlane className="h-5 w-5" />
            </button>
            {/* Additional Actions */}
            <div className="flex space-x-2 ml-2">
              <button className="p-2 text-gray-400 hover:text-white">
                <FaSmile />
              </button>
              <button className="p-2 text-gray-400 hover:text-white" onClick={handleVoiceMessage}>
                {isRecording ? <FaStop /> : <FaMicrophone />}
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <FaImage />
              </button>
            </div>
          </div>
          {/* Smart Reply Buttons */}
          <div className="mt-2 flex space-x-2">
            <button className="smart-reply-button">Let's study now! 📚</button>
            <button className="smart-reply-button">Need help with this topic? 🤔</button>
            <button className="smart-reply-button">Taking a break, be back later! ☕</button>
          </div>
        </footer>
      </main>

      {/* Video Call Modal */}
      {localStream && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Video Call</h2>
            <div className="flex space-x-4">
              <video className="w-64 h-48 bg-black" ref={localVideoRef} muted autoPlay />
              <video className="w-64 h-48 bg-black" ref={remoteVideoRef} autoPlay />
            </div>
            <button onClick={hangUp} className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full">
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Incoming Call</h2>
            <p className="mb-4">Accept or Reject the call.</p>
            <div className="flex space-x-4">
              <button onClick={acceptCall} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full">
                Accept
              </button>
              <button onClick={rejectCall} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


