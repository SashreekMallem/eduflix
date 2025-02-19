"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SlidingWordsProps {
  leftWord: string;
  rightWord: string;
}

const SlidingWords: React.FC<SlidingWordsProps> = ({ leftWord, rightWord }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftWordRef = useRef<HTMLSpanElement>(null);
  const rightWordRef = useRef<HTMLSpanElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("SlidingWords component mounted");
    console.log("leftWord:", leftWord);
    console.log("rightWord:", rightWord);

    const ctx = gsap.context(() => {
      // Initial setup: words are positioned outside, divider is centered
      gsap.set(leftWordRef.current, { x: "-110%", opacity: 1 });
      gsap.set(rightWordRef.current, { x: "110%", opacity: 1 });
      gsap.set(dividerRef.current, { xPercent: -50, yPercent: -50, opacity: 0 });

      const tl = gsap.timeline({ defaults: { duration: 1, ease: "power2.out" } });

      // Animation: divider appears, then words slide inwards
      tl.to(dividerRef.current, { opacity: 1, duration: 0.5 })
        .to(leftWordRef.current, { x: "0%", opacity: 1 }, "+=0.2")
        .to(rightWordRef.current, { x: "0%", opacity: 1 }, "<");

      return () => ctx.revert(); // cleanup
    }, containerRef);

    return () => ctx.revert();
  }, [leftWord, rightWord]);

  return (
    <div className="relative flex items-center justify-center overflow-hidden" ref={containerRef}>
      <span
        className="text-5xl font-bold absolute left-0 whitespace-nowrap"
        ref={leftWordRef}
      >
        {leftWord}
      </span>
      <div
        className="absolute h-16 bg-white w-1 transform -translate-x-1/2 -translate-y-1/2"
        ref={dividerRef}
        style={{ opacity: 0 }}
      ></div>
      <span
        className="text-5xl font-bold absolute right-0 whitespace-nowrap"
        ref={rightWordRef}
      >
        {rightWord}
      </span>
    </div>
  );
};

export default SlidingWords;
