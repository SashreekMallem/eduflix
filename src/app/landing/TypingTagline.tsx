"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const TypingTagline: React.FC = () => {
  const taglineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(taglineRef.current, { opacity: 0 }, { opacity: 1, duration: 1 });
    }, taglineRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={taglineRef} className="text-2xl font-semibold">
      Your tagline goes here
    </div>
  );
};

export default TypingTagline;
