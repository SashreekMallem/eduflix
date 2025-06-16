"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FaArrowLeft, FaPaperPlane, FaCircle, FaPhone, FaVideo, FaInfo, 
  FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaTimes
} from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

// Interfaces
interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  current_status: string;
  skills: string[];
  career_goals: string[];
  learning_goals: string[];
  created_at: string;
}

interface CurrentUser {
  id: string;
  authId: string;
  profile: UserProfile;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system' | 'deleted';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  thumbnail_url?: string;
  reply_to_message_id?: string;
  forwarded_from_message_id?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  delivered_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sender_profile?: UserProfile;
}

interface UserStatus {
  user_id: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  last_seen: string;
  status_message?: string;
  updated_at: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const friendName = params.friendName as string;
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [friend, setFriend] = useState<UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<UserStatus | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Call states
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [incomingCall, setIncomingCall] = useState<{type: 'voice' | 'video', from: string, fromName: string, offer?: RTCSessionDescriptionInit} | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize user and fetch friend data
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          router.push('/auth/login');
          return;
        }

        // Get current user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error('Profile fetch error:', profileError);
          return;
        }

        setCurrentUser({
          id: profile.id,
          authId: session.user.id,
          profile: profile
        });

        // Find friend by username
        const { data: friendProfile, error: friendError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', friendName)
          .single();

        if (friendError || !friendProfile) {
          console.error('Friend not found:', friendError);
          router.push('/messenger');
          return;
        }

        setFriend(friendProfile);

        // Fetch friend status
        await fetchFriendStatus(friendProfile.user_id);

        // Fetch messages between current user and friend
        await fetchMessages(session.user.id, friendProfile.user_id);

      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    if (friendName) {
      initializeChat();
    }
  }, [friendName, router]);

  const fetchFriendStatus = async (friendUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .eq('user_id', friendUserId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows

      if (error) {
        console.error('Error fetching friend status:', error);
        return;
      }

      // If no status record exists, create a default offline status
      if (!data) {
        setFriendStatus({
          user_id: friendUserId,
          status: 'offline',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        setFriendStatus(data);
      }
    } catch (error) {
      console.error('Error fetching friend status:', error);
    }
  };

  const fetchMessages = async (currentUserId: string, friendUserId: string) => {
    try {
      // First, get or create a conversation between the two users
      const { data: conversationId, error: convError } = await supabase
        .rpc('create_direct_conversation', {
          user1_id: currentUserId,
          user2_id: friendUserId
        });

      if (convError) {
        console.error('Error creating/getting conversation:', convError);
        return;
      }

      // Now fetch messages for this conversation
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch sender profiles separately to avoid foreign key issues
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', senderIds);

      // Combine messages with sender profiles
      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        sender_profile: profiles?.find(p => p.user_id === message.sender_id)
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !friend || sending) return;

    setSending(true);

    try {
      // First, get or create the conversation
      const { data: conversationId, error: convError } = await supabase
        .rpc('create_direct_conversation', {
          user1_id: currentUser.authId,
          user2_id: friend.user_id
        });

      if (convError) {
        console.error('Error getting conversation:', convError);
        setSending(false);
        return;
      }

      // Insert the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.authId,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select('*')
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        setSending(false);
        return;
      }

      // Get sender profile separately
      const { data: senderProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.authId)
        .single();

      // Add message with profile to local state
      const messageWithProfile = {
        ...messageData,
        sender_profile: senderProfile
      };

      setMessages(prev => [...prev, messageWithProfile]);
      setNewMessage("");

      // Mark message as read for the sender
      await markMessageAsRead(messageData.id);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('message_read_receipts')
        .upsert({
          message_id: messageId,
          user_id: currentUser.authId
        });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!currentUser || !friend) return;

    const markMessageAsReadCallback = async (messageId: string) => {
      if (!currentUser) return;

      try {
        await supabase
          .from('message_read_receipts')
          .upsert({
            message_id: messageId,
            user_id: currentUser.authId
          });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    };

    let cleanup: (() => void) | null = null;

    // Get conversation ID for filtering real-time messages
    const setupRealtime = async () => {
      try {
        const { data: conversationId } = await supabase
          .rpc('create_direct_conversation', {
            user1_id: currentUser.authId,
            user2_id: friend.user_id
          });

        if (!conversationId) return;

        const channel = supabase
          .channel(`messages-${conversationId}-${Date.now()}`) // Unique channel name
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`
            },
            async (payload) => {
              // Fetch the sender profile separately
              const { data: senderProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', payload.new.sender_id)
                .single();

              const messageWithProfile: Message = {
                ...payload.new as Message,
                sender_profile: senderProfile
              };

              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                if (prev.some(msg => msg.id === messageWithProfile.id)) {
                  return prev;
                }
                return [...prev, messageWithProfile];
              });

              // Mark as read if we're not the sender
              if (payload.new.sender_id !== currentUser.authId) {
                await markMessageAsReadCallback(payload.new.id);
              }
            }
          )
          .subscribe();

        cleanup = () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error setting up realtime:', error);
      }
    };

    setupRealtime();

    return () => {
      if (cleanup) cleanup();
    };
  }, [currentUser, friend]);

  // WebRTC Configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Initialize WebRTC connection
  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection({ iceServers });
    
    pc.onicecandidate = (event) => {
      if (event.candidate && friend) {
        // Send ICE candidate through Supabase signaling
        sendSignalingMessage('ice-candidate', {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  // Send signaling messages through Supabase
  const sendSignalingMessage = useCallback(async (type: string, data: Record<string, unknown>) => {
    if (!friend || !currentUser) return;

    await supabase
      .from('signaling_messages')
      .insert({
        from_user_id: currentUser.authId,
        to_user_id: friend.user_id,
        type,
        data,
        created_at: new Date().toISOString()
      });
  }, [friend, currentUser]);

  // Start a video call
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      setCallType('video');
      setIsInCall(true);

      const pc = initializePeerConnection();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send call invitation
      await sendSignalingMessage('call-offer', {
        type: 'video',
        offer: offer,
        from: currentUser?.profile.full_name || 'Unknown User'
      });

    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please check your camera and microphone permissions.');
    }
  };

  // Start a voice call
  const startVoiceCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: true 
      });
      
      setLocalStream(stream);
      setCallType('voice');
      setIsInCall(true);

      const pc = initializePeerConnection();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send call invitation
      await sendSignalingMessage('call-offer', {
        type: 'voice',
        offer: offer,
        from: currentUser?.profile.full_name || 'Unknown User'
      });

    } catch (error) {
      console.error('Error starting voice call:', error);
      alert('Failed to start voice call. Please check your microphone permissions.');
    }
  };

  // Answer incoming call
  const answerCall = async (offer: RTCSessionDescriptionInit) => {
    try {
      const constraints = callType === 'video' ? 
        { video: true, audio: true } : 
        { video: false, audio: true };
        
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      const pc = initializePeerConnection();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Set remote offer and create answer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer
      await sendSignalingMessage('call-answer', {
        type: answer.type,
        sdp: answer.sdp
      });
      
      setIsInCall(true);
      setIncomingCall(null);

    } catch (error) {
      console.error('Error answering call:', error);
      alert('Failed to answer call. Please check your camera and microphone permissions.');
    }
  };

  // Toggle audio mute
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video mute
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // End call
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    // Reset states
    setRemoteStream(null);
    setIsInCall(false);
    setCallType(null);
    setIncomingCall(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);

    // Send end call message
    if (friend) {
      sendSignalingMessage('call-end', {});
    }
  }, [localStream, peerConnection, friend, sendSignalingMessage]);

  // Decline incoming call
  const declineCall = () => {
    setIncomingCall(null);
    if (friend) {
      sendSignalingMessage('call-decline', {});
    }
  };

  // Handle incoming signaling messages
  useEffect(() => {
    if (!currentUser || !friend) return;

    const channel = supabase
      .channel('signaling')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signaling_messages',
          filter: `to_user_id=eq.${currentUser.authId}`
        },
        async (payload) => {
          const message = payload.new;
          if (message.from_user_id !== friend.user_id) return;

          switch (message.type) {
            case 'call-offer':
              setIncomingCall({
                type: message.data.type,
                from: message.from_user_id,
                fromName: message.data.from,
                offer: message.data.offer
              });
              setCallType(message.data.type);
              break;

            case 'call-answer':
              if (peerConnection) {
                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(message.data)
                );
              }
              break;

            case 'ice-candidate':
              if (peerConnection) {
                await peerConnection.addIceCandidate(
                  new RTCIceCandidate({
                    candidate: message.data.candidate,
                    sdpMid: message.data.sdpMid,
                    sdpMLineIndex: message.data.sdpMLineIndex
                  })
                );
              }
              break;

            case 'call-end':
            case 'call-decline':
              endCall();
              break;
          }

          // Delete the signaling message after processing
          await supabase
            .from('signaling_messages')
            .delete()
            .eq('id', message.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, friend, peerConnection, endCall]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <button
            onClick={() => router.push('/messenger')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/messenger')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {friend.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${getStatusColor(friendStatus?.status || 'offline')}`}></div>
                </div>
                
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{friend.full_name}</h1>
                  <p className="text-sm text-gray-500">
                    {friendStatus?.status === 'online' ? 'Active now' : 
                     friendStatus?.last_seen ? `Last seen ${formatTime(friendStatus.last_seen)}` : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={startVoiceCall}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isInCall}
              >
                <FaPhone className="text-gray-600" />
              </button>
              <button 
                onClick={startVideoCall}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isInCall}
              >
                <FaVideo className="text-gray-600" />
              </button>
              <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors">
                <FaInfo className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: 'calc(100vh - 280px)' }}>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCircle className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Start a conversation</h3>
              <p className="text-gray-500">Send a message to {friend.full_name} to get started!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUser?.authId;
                const showDate = index === 0 || 
                  formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isCurrentUser 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isCurrentUser ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Message ${friend.full_name}...`}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={sending}
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FaPaperPlane className="text-sm" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-sm mx-4"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
                {incomingCall.fromName?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{incomingCall.fromName}</h3>
              <p className="text-gray-600 mb-6">
                Incoming {incomingCall.type} call
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={declineCall}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => incomingCall?.offer && answerCall(incomingCall.offer)}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Answer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active Call Modal */}
      {isInCall && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
          <div className="flex-1 relative">
            {/* Remote Video */}
            {callType === 'video' && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Local Video (Picture-in-Picture) */}
            {callType === 'video' && localStream && (
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Voice Call UI */}
            {callType === 'voice' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-4xl mx-auto mb-4">
                    {friend?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{friend?.full_name}</h2>
                  <p className="text-gray-300">Voice call in progress...</p>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-6">
              {callType === 'video' && (
                <>
                  <button
                    onClick={toggleVideo}
                    className={`p-4 ${isVideoMuted ? 'bg-red-600' : 'bg-gray-600'} text-white rounded-full hover:bg-gray-700 transition-colors`}
                  >
                    {isVideoMuted ? <FaVideoSlash className="text-xl" /> : <FaVideo className="text-xl" />}
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`p-4 ${isAudioMuted ? 'bg-red-600' : 'bg-gray-600'} text-white rounded-full hover:bg-gray-700 transition-colors`}
                  >
                    {isAudioMuted ? <FaMicrophoneSlash className="text-xl" /> : <FaMicrophone className="text-xl" />}
                  </button>
                </>
              )}
              
              {callType === 'voice' && (
                <button
                  onClick={toggleAudio}
                  className={`p-4 ${isAudioMuted ? 'bg-red-600' : 'bg-gray-600'} text-white rounded-full hover:bg-gray-700 transition-colors`}
                >
                  {isAudioMuted ? <FaMicrophoneSlash className="text-xl" /> : <FaMicrophone className="text-xl" />}
                </button>
              )}
              
              <button
                onClick={endCall}
                className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
