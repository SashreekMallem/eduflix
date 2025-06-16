"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main auth page
    router.replace('/auth');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1f3a] to-[#0B0F19] flex items-center justify-center">
      <div className="text-white">Redirecting to login...</div>
    </div>
  );
}
