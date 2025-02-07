"use client";

import { useRouter } from 'next/navigation';
import { FaLinkedin, FaGithub, FaGoogle } from 'react-icons/fa';

export default function Login() {
  const router = useRouter();

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push('/onboarding'); // Redirect to onboarding page after login
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="flex flex-col items-center">
        <div className="mb-8">
          <h1 className="text-6xl font-extrabold text-purple-400">EduFlix</h1>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 shadow-lg max-w-md w-full">
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input type="email" id="email" className="mt-1 block w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <input type="password" id="password" className="mt-1 block w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <button type="submit" className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500">Sign In</button>
            </div>
            <div>
              <button type="button" className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500">Sign Up</button>
            </div>
          </form>
          <div className="mt-6 flex justify-center space-x-4">
            <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full">
              <FaLinkedin className="h-6 w-6 text-white" />
            </button>
            <button className="p-2 bg-gray-900 hover:bg-gray-800 rounded-full">
              <FaGithub className="h-6 w-6 text-white" />
            </button>
            <button className="p-2 bg-red-600 hover:bg-red-700 rounded-full">
              <FaGoogle className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

