"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FlipCardProps {
  title: string;
  description: string;
}

const FlipCard: React.FC<FlipCardProps> = ({ title, description }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, rotateY: 0 },
    visible: {
      opacity: 1,
      rotateY: isFlipped ? 180 : 0,
      transition: { duration: 0.5, ease: "easeInOut" },
    },
  };

  return (
    <div className="perspective-800">
      <motion.div
        className="relative w-full h-full transition-transform duration-500 transform-style-3d"
        onClick={() => setIsFlipped(!isFlipped)}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Front Side */}
        <motion.div
          className="absolute w-full h-full rounded-xl shadow-md p-4 bg-white text-gray-800 flex flex-col justify-center items-center backface-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        >
          <h4 className="text-xl font-semibold">{title}</h4>
        </motion.div>

        {/* Back Side */}
        <motion.div
          className="absolute w-full h-full rounded-xl shadow-md p-4 bg-gray-800 text-white flex flex-col justify-center items-center backface-hidden rotate-y-180"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <p className="text-center">{description}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FlipCard;
