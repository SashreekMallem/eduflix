"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaLinkedin, FaGithub, FaGoogle } from 'react-icons/fa';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password_hash: password }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.detail && err.detail.includes("Account already exists")) {
          throw new Error("Account already exists. Please log in.");
        }
        throw new Error(err.detail || "Sign up failed");
      }
      const data = await res.json();
      localStorage.setItem("auth_user_id", data.auth_user_id); // Store auth_user_id in local storage
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password_hash: password }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 401) {
          throw new Error("No account found. Please sign up.");
        }
        throw new Error(err.detail || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("auth_user_id", data.auth_user_id); // Store auth_user_id in local storage
      localStorage.setItem("profileData", JSON.stringify(data.profile_data)); // Store profile data in local storage
      data.profile_data ? router.push("/home") : router.push("/onboarding");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="flex flex-col items-center">
        <div className="mb-8">
          <h1 className="text-6xl font-extrabold text-purple-400">EduFlix</h1>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 shadow-lg max-w-md w-full">
          <form className="space-y-6" onSubmit={handleSignIn}>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Sign In
              </button>
            </div>
            <div>
              <button 
                type="button" 
                onClick={handleSignUp}
                className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Sign Up
              </button>
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

