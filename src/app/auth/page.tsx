"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FaEye, 
  FaEyeSlash, 
  FaGoogle, 
  FaGithub,
  FaEnvelope,
  FaLock,
  FaUser,
  FaArrowLeft,
  FaCheckCircle
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

type AuthMode = 'signin' | 'signup' | 'forgot';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

const AuthPage = () => {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Auto-focus animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, [authMode]);

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation
  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (authMode === 'forgot') return true;

    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (authMode === 'signup') {
      if (!formData.fullName.trim()) {
        toast.error('Please enter your full name');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Welcome back!');
      
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', data.user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/home');
      } else {
        router.push('/onboarding');
      }
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Try signing in instead.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user && !data.session) {
        toast.success('Please check your email to verify your account!');
      } else {
        toast.success('Account created successfully!');
        router.push('/onboarding');
      }
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset email sent! Check your inbox.');
      setAuthMode('signin');
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Social Authentication
  const handleSocialAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        toast.error(`Failed to sign in with ${provider}`);
      }
    } catch (error: unknown) {
      console.error('Social auth error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -50,
      transition: { duration: 0.3 }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: authMode === 'signin' ? -100 : 100 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: authMode === 'signin' ? 100 : -100,
      transition: { duration: 0.3 }
    }
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium geometric background */}
      <div className="absolute inset-0">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"></div>
        
        {/* Premium grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Elegant floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Neural network inspired lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          <path d="M0,100 Q400,50 800,100 T1600,100" stroke="url(#line-gradient)" strokeWidth="2" fill="none"/>
          <path d="M0,200 Q600,150 1200,200 T2400,200" stroke="url(#line-gradient)" strokeWidth="1.5" fill="none"/>
          <path d="M0,300 Q300,250 600,300 T1200,300" stroke="url(#line-gradient)" strokeWidth="1" fill="none"/>
        </svg>
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            color: '#f1f5f9',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative z-10 w-full max-w-md"
      >
        {/* Premium Logo/Header */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative inline-block">
            <h1 className="text-6xl font-bold mb-3 relative">
              <span className="text-slate-200">Edu</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Flix</span>
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
            </h1>
            <div className="h-0.5 w-20 mx-auto bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>
          </div>
          <p className="text-slate-400 text-lg mt-4 font-light tracking-wide">
            {authMode === 'signin' && 'Welcome back to your AI-powered learning journey'}
            {authMode === 'signup' && 'Begin your personalized education experience'}
            {authMode === 'forgot' && 'Recover your learning account'}
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Powered by NJAN Neural Intelligence
          </p>
        </motion.div>

        {/* Premium Auth Card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/50">
            {/* Premium glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>
            
            <div className="relative z-10">
              {/* Auth Mode Tabs (for signin/signup only) */}
              {authMode !== 'forgot' && (
                <div className="flex bg-slate-800/50 rounded-xl p-1 mb-8 backdrop-blur-sm border border-slate-700/30">
                  <button
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                      authMode === 'signin'
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {authMode === 'signin' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-500/80 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">Sign In</span>
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                      authMode === 'signup'
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {authMode === 'signup' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-500/80 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">Sign Up</span>
                  </button>
                </div>
              )}

              {/* Back button for forgot password */}
              {authMode === 'forgot' && (
                <motion.button
                  onClick={() => setAuthMode('signin')}
                  className="flex items-center text-slate-400 hover:text-slate-300 mb-6 transition-colors duration-200 group"
                  whileHover={{ x: -4 }}
                >
                  <FaArrowLeft className="mr-2 group-hover:mr-3 transition-all duration-200" />
                  Back to Sign In
                </motion.button>
              )}

              {/* Forms */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={authMode}
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={
                    authMode === 'signin' ? handleSignIn :
                    authMode === 'signup' ? handleSignUp :
                    handleForgotPassword
                  }
                  className="space-y-6"
                >
                  {/* Full Name (signup only) */}
                  {authMode === 'signup' && (
                    <motion.div
                      variants={inputVariants}
                      whileFocus="focus"
                      className="relative group"
                    >
                      <label className="block text-sm font-medium text-slate-300 mb-3 tracking-wide">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                        <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300 z-10" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="relative w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-slate-800/80 transition-all duration-300 backdrop-blur-sm"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email */}
                  <motion.div
                    variants={inputVariants}
                    whileFocus="focus"
                    className="relative group"
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-3 tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                      <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300 z-10" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="relative w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-slate-800/80 transition-all duration-300 backdrop-blur-sm"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password (not for forgot) */}
                  {authMode !== 'forgot' && (
                    <motion.div
                      variants={inputVariants}
                      whileFocus="focus"
                      className="relative group"
                    >
                      <label className="block text-sm font-medium text-slate-300 mb-3 tracking-wide">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                        <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300 z-10" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="relative w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-slate-800/80 transition-all duration-300 backdrop-blur-sm"
                          placeholder="Enter your password"
                          required
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-200 z-10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Confirm Password (signup only) */}
                  {authMode === 'signup' && (
                    <motion.div
                      variants={inputVariants}
                      whileFocus="focus"
                      className="relative group"
                    >
                      <label className="block text-sm font-medium text-slate-300 mb-3 tracking-wide">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                        <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300 z-10" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="relative w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-slate-800/80 transition-all duration-300 backdrop-blur-sm"
                          placeholder="Confirm your password"
                          required
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-200 z-10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Forgot Password Link (signin only) */}
                  {authMode === 'signin' && (
                    <div className="text-right">
                      <motion.button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 relative group"
                        whileHover={{ scale: 1.02 }}
                      >
                        Forgot your password?
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300"></span>
                      </motion.button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative w-full py-4 px-6 rounded-xl font-semibold text-white shadow-2xl transition-all duration-300 overflow-hidden group ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center space-x-2 z-10">
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <>
                          {authMode === 'forgot' && <FaEnvelope className="text-lg" />}
                          {authMode !== 'forgot' && <FaCheckCircle className="text-lg" />}
                          <span className="text-lg">
                            {authMode === 'signin' && 'Sign In to EduFlix'}
                            {authMode === 'signup' && 'Create Your Account'}
                            {authMode === 'forgot' && 'Send Reset Email'}
                          </span>
                        </>
                      )}
                    </div>
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Social Authentication (not for forgot password) */}
              {authMode !== 'forgot' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <motion.button
                        onClick={() => handleSocialAuth('google')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full inline-flex justify-center py-3 px-4 rounded-xl shadow-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
                      >
                        <FaGoogle className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleSocialAuth('github')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full inline-flex justify-center py-3 px-4 rounded-xl shadow-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
                      >
                        <FaGithub className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-6 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <p>
            Powered by NJAN (Neural Justification & Adaptive Nexus)
          </p>
        </motion.div>
      </motion.div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
