"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface FilmReelEffectProps {
  color: string;
}

const FilmReelEffect: React.FC<FilmReelEffectProps> = ({ color }) => {
  const scrollingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollingRef.current) {
      const letterWidth = 64; // 4rem ~ 64px per letter
      gsap.to(scrollingRef.current, {
        x: -21 * letterWidth, // scroll through 4 letters * 5 times + 1 blank space
        duration: 1., // Increased duration for longer animation
        ease: "power2.inOut",
      });
    }
  }, []);

  return (
    <div className="flex items-center" style={{ height: "4rem", position: "relative" }}>
      {/* Static Letter A */}
      <span
        className={`text-7xl font-extrabold text-transparent bg-clip-text ${color}`}
        style={{ width: "4rem", lineHeight: "4rem" }}
      >
        A
      </span>
      {/* Film-reel scrolling window overlaps A using negative margin */}
      <div
        className="overflow-hidden flex items-center gap-0"
        style={{ width: "4rem", height: "4rem", marginLeft: "-1.8rem" }}
      >
        <div
          ref={scrollingRef}
          className="flex gap-0 items-center"
          style={{ width: "88rem", lineHeight: "4rem" }} // Increased width to accommodate 5 cycles + blank space
        >
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            &nbsp;
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            J
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            A
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            J
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            A
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            J
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            A
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            J
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            A
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            J
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            A
          </div>
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            N
          </div>
          
          {/* Final Letter I with white gradient effect */}
          <div className={`w-16 flex items-center justify-center text-7xl font-extrabold text-transparent bg-clip-text ${color}`} style={{ lineHeight: "4rem" }}>
            I
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilmReelEffect;




