"use client";

import { useState, useEffect } from 'react';
import { FaQuestionCircle, FaUser, FaMicrophone, FaVideo, FaCheck, FaTimes, FaPaperPlane, FaCalendarAlt, FaTrophy, FaFire } from 'react-icons/fa';
import Link from 'next/link';
import Calendar, { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion } from 'framer-motion';

const TimeOptions = () => {
  const times = [];
  for (let i = 0; i < 24; i++) {
    times.push(`${i.toString().padStart(2, '0')}:00`);
    times.push(`${i.toString().padStart(2, '0')}:30`);
  }
  return times;
};

export default function DiscussionPage() {
  const [question, setQuestion] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [potentialHelpers, setPotentialHelpers] = useState<{ name: string; courses: string[]; rating: number; }[]>([]);
  const [availableCourses, setAvailableCourses] = useState([
    {
      name: 'Data Structures',
      chapters: [
        { name: 'Arrays', videos: ['Introduction to Arrays', 'Array Operations'] },
        { name: 'Linked Lists', videos: ['Singly Linked Lists', 'Doubly Linked Lists'] },
      ],
    },
    {
      name: 'Algorithms',
      chapters: [
        { name: 'Sorting', videos: ['Bubble Sort', 'Merge Sort'] },
        { name: 'Searching', videos: ['Binary Search', 'Linear Search'] },
      ],
    },
    {
      name: 'Web Development',
      chapters: [
        { name: 'HTML', videos: ['HTML Basics', 'HTML Forms'] },
        { name: 'CSS', videos: ['CSS Selectors', 'CSS Layouts'] },
      ],
    },
  ]);
  const [allUsers, setAllUsers] = useState([
    { name: 'Alice Johnson', courses: ['Data Structures', 'Algorithms'], rating: 4.5 },
    { name: 'Bob Williams', courses: ['Web Development', 'React'], rating: 4.8 },
    { name: 'Charlie Brown', courses: ['Machine Learning', 'Python'], rating: 4.2 },
    { name: 'Diana Miller', courses: ['Data Structures', 'Algorithms'], rating: 4.7 },
    { name: 'Ethan Davis', courses: ['Web Development', 'React'], rating: 4.6 },
  ]);
  const [selectedHelper, setSelectedHelper] = useState<{ name: string; courses: string[]; rating: number; } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingHelpers, setIsLoadingHelpers] = useState(false);
  const [isAwaitingHelper, setIsAwaitingHelper] = useState(false);
  const [isHelperAccepted, setIsHelperAccepted] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSessionFinalized, setIsSessionFinalized] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  useEffect(() => {
    // Simulate fetching helpers from a backend based on the selected course
    const fetchHelpers = async () => {
      if (selectedCourse && question) {
        setIsLoadingHelpers(true);
        // Simulate a delay to mimic a real API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Filter users who have taken the selected course
        const relevantHelpers = allUsers.filter(user => user.courses.includes(selectedCourse));
        setPotentialHelpers(relevantHelpers);
        setIsLoadingHelpers(false);
      } else {
        setPotentialHelpers([]);
        setIsLoadingHelpers(false);
      }
    };

    if (isLoadingHelpers) {
      fetchHelpers();
    }
  }, [selectedCourse, allUsers, question, isLoadingHelpers]);

  const handleSubmitQuestion = () => {
    // Simulate sending the question to the system and getting potential helpers
    // In a real implementation, this would involve an API call
    console.log('Question submitted:', question, 'Course:', selectedCourse, 'Chapter:', selectedChapter, 'Video:', selectedVideo);
    setIsLoadingHelpers(true); // Start looking for helpers after submitting
  };

  const handleSelectHelper = (helper: { name: string; courses: string[]; rating: number; }) => {
    setSelectedHelper(helper);
    setShowConfirmation(true);
  };

  const handleConfirmHelpRequest = () => {
    setShowConfirmation(false);
    setIsAwaitingHelper(true);

    // Simulate helper accepting the request after 5 seconds
    setTimeout(() => {
      setIsAwaitingHelper(false);
      setIsHelperAccepted(true);
    }, 5000);
  };

  const handleCancelConfirmation = () => {
    setSelectedHelper(null);
    setShowConfirmation(false);
  };

  const handleSendMessage = () => {
    if (chatInput.trim() !== '') {
      const newMessage = { sender: 'You', text: chatInput };
      setChatMessages([...chatMessages, newMessage]);
      setChatInput('');
      // Award XP for sending a message
      setXp(prevXp => prevXp + 5);
    }
  };

  const handleConfirmSession = () => {
    if (selectedHelper) {
      // Simulate setting up the session with the selected helper
      // This would involve creating a new "classroom" with whiteboard, voice call, etc.
      console.log('Session confirmed with:', selectedHelper);
      alert(`Session confirmed with ${selectedHelper.name}!`);
      setIsHelperAccepted(false);
    }
  };

  const handleCancelSession = () => {
    setSelectedHelper(null);
    setIsHelperAccepted(false);
  };

  const handleDateChange: CalendarProps['onChange'] = (date) => {
    if (date instanceof Date) {
      setScheduledTime(date);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
  };

  const handleFinalizeSchedule = () => {
    if (scheduledTime && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDate = new Date(scheduledTime);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      setScheduledTime(newDate);
      setShowCalendar(false);
    } else {
      alert('Please select both a date and a time.');
    }
  };

  const aiSmartReply = (message: string) => {
    // Simulate AI generating a smart reply
    return `AI Smart Reply: Is this helpful for you?`;
  };

  return (
    <motion.div
      className="bg-gray-900 text-white min-h-screen transition-opacity duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="bg-gray-800 p-4 shadow-md transition-colors duration-300">
        <h1 className="text-2xl font-bold">Discussion Room</h1>
      </header>
      <div className="container mx-auto p-8">
        <motion.div
          className="mb-6 transition-all duration-300"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <label className="block text-xl font-semibold mb-2">Select Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedChapter('');
              setSelectedVideo('');
            }}
            className="w-full bg-gray-700 text-white rounded-md p-3 focus:outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <option value="">Select a course</option>
            {availableCourses.map((course, index) => (
              <option key={index} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
        </motion.div>
        {selectedCourse && (
          <motion.div
            className="mb-6 transition-all duration-300"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-xl font-semibold mb-2">Select Chapter:</label>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setSelectedVideo('');
              }}
              className="w-full bg-gray-700 text-white rounded-md p-3 focus:outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <option value="">Select a chapter</option>
              {availableCourses
                .find((course) => course.name === selectedCourse)
                ?.chapters.map((chapter, index) => (
                  <option key={index} value={chapter.name}>
                    {chapter.name}
                  </option>
                ))}
            </select>
          </motion.div>
        )}
        {selectedChapter && (
          <motion.div
            className="mb-6 transition-all duration-300"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-xl font-semibold mb-2">Select Video:</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md p-3 focus:outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <option value="">Select a video</option>
              {availableCourses
                .find((course) => course.name === selectedCourse)
                ?.chapters.find((chapter) => chapter.name === selectedChapter)
                ?.videos.map((video, index) => (
                  <option key={index} value={video}>
                    {video}
                  </option>
                ))}
            </select>
          </motion.div>
        )}
        <motion.div
          className="mb-6 transition-all duration-300"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <label className="block text-xl font-semibold mb-2">Ask Your Question:</label>
          <textarea
            placeholder="Type your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-md p-3 focus:outline-none shadow-sm hover:shadow-md transition-shadow duration-200"
            rows={4}
          />
          <button
            onClick={handleSubmitQuestion}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200"
          >
            Submit Question <FaQuestionCircle className="inline-block ml-2 animate-pulse" />
          </button>
        </motion.div>
        {isLoadingHelpers ? (
          <motion.div
            className="bg-gray-800 rounded-lg p-4 mb-6 transition-opacity duration-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h2 className="text-xl font-semibold mb-2">Searching for Helpers...</h2>
            <p>Please wait while we find the best helpers for you.</p>
          </motion.div>
        ) : potentialHelpers.length > 0 && !selectedHelper && !isAwaitingHelper && !isHelperAccepted && (
          <motion.div
            className="bg-gray-800 rounded-lg p-4 mb-6 transition-opacity duration-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-xl font-semibold mb-2">Potential Helpers:</h2>
            <ul>
              {potentialHelpers.map((helper, index) => (
                <motion.li
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-700 transition-colors duration-200 hover:bg-gray-700"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-gray-400" />
                      <Link href={`/profile/${helper.name}`} className="text-lg font-semibold hover:underline">
                        {helper.name}
                      </Link>
                    </div>
                    <p className="text-gray-400 text-sm">Courses: {helper.courses.join(', ')}</p>
                    <p className="text-gray-400 text-sm">Rating: {helper.rating}</p>
                  </div>
                  <button
                    onClick={() => handleSelectHelper(helper)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                  >
                    Help
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
        {selectedHelper && showConfirmation && (
          <motion.div
            className="bg-gray-800 rounded-lg p-4 mb-6 transition-opacity duration-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h2 className="text-xl font-semibold mb-2">Confirm Help Request:</h2>
            <p>
              Are you sure you want to send a help request to {selectedHelper.name}?
            </p>
            <div>
              <button
                onClick={handleConfirmHelpRequest}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md mr-2 transition-colors duration-200"
              >
                Confirm <FaCheck className="inline-block ml-2" />
              </button>
              <button
                onClick={handleCancelConfirmation}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Cancel <FaTimes className="inline-block ml-2" />
              </button>
            </div>
          </motion.div>
        )}
        {isAwaitingHelper && selectedHelper && (
          <motion.div
            className="bg-gray-800 rounded-lg p-4 mb-6 transition-opacity duration-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h2 className="text-xl font-semibold mb-2">Awaiting Helper Response...</h2>
            <p>Please wait while {selectedHelper.name} reviews your request.</p>
          </motion.div>
        )}
        {isHelperAccepted && selectedHelper && !isSessionFinalized && (
          <motion.div
            className="bg-gray-800 rounded-lg p-4 mb-6 transition-opacity duration-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-xl font-semibold mb-2">{selectedHelper.name} Accepted!</h2>
            <p>
              {selectedHelper.name} has accepted your help request. Discuss the details below.
            </p>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Chat with {selectedHelper.name}</h3>
              <div className="overflow-y-auto p-4 space-y-2 max-h-48">
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    className={`flex space-x-2 items-start ${msg.sender === 'You' ? 'flex-row-reverse text-right self-end' : 'flex-row text-left self-start'} transition-opacity duration-200`}
                    initial={{ opacity: 0, x: msg.sender === 'You' ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: msg.sender === 'You' ? 50 : -50 }}
                  >
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0 transition-transform duration-300 hover:scale-110" />
                    <div className="bg-gray-700 p-3 rounded-lg shadow-md transition-shadow duration-200 hover:shadow-lg">
                      <p className="text-sm font-bold text-purple-400">{msg.sender}</p>
                      <p className="text-sm">{msg.text}</p>
                      {msg.sender !== 'You' && (
                        <p className="text-xs text-gray-500 mt-1">{aiSmartReply(msg.text)}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none text-sm shadow-sm hover:shadow-md transition-shadow duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  className="ml-2 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <FaPaperPlane className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Schedule a Session:</h3>
              <p>Discuss with {selectedHelper.name} to decide on a time and date, or start immediately.</p>
              <button onClick={handleConfirmSession} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md mr-2 transition-colors duration-200 shadow-sm hover:shadow-md">
                <FaMicrophone className="inline-block mr-2" /> Start Immediately
              </button>
              <button onClick={() => setShowCalendar(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md">
                <FaCalendarAlt className="inline-block mr-2" /> Schedule Time
              </button>
              {scheduledTime && <p>Scheduled for: {scheduledTime.toLocaleString()}</p>}
              {showCalendar && (
                <div className="absolute z-10 bg-gray-800 rounded-lg p-4 shadow-lg transition-transform duration-300">
                  <Calendar
                    onChange={handleDateChange}
                    value={scheduledTime}
                    className="eduflix-calendar"
                  />
                  <select
                    className="mt-2 bg-gray-700 text-white rounded-md p-2 transition-colors duration-200 shadow-sm hover:shadow-md"
                    onChange={(e) => handleTimeChange(e.target.value)}
                    value={selectedTime}
                  >
                    <option value="">Select Time</option>
                    {TimeOptions().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleFinalizeSchedule}
                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    Set Time
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {selectedHelper && isHelperAccepted && (
          <motion.div
            className="bg-gray-800 rounded-lg p-4 transition-opacity duration-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Classroom with {selectedHelper.name}</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <FaTrophy className="mr-1 text-yellow-500" />
                  <span>XP: {xp}</span>
                </div>
                <div className="flex items-center">
                  <FaFire className="mr-1 text-red-500" />
                  <span>Streak: {streak}</span>
                </div>
              </div>
            </div>
            <p>Whiteboard, voice call, and content materials will be displayed here.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
