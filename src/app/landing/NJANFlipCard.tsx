
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface NJANFlipCardProps {
  title: string;
  description: string;
}

const NJANFlipCard: React.FC<NJANFlipCardProps> = ({ title, description }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = () => {
	setIsFlipped(!isFlipped);
  };

  return (
	<div className="w-full md:w-1/3 p-4 perspective-500" onClick={flipCard}>
	  <motion.div
		className="relative rounded-xl shadow-md h-full cursor-pointer"
		style={{ perspective: 1000 }}
		initial={false}
		animate={{ rotateY: isFlipped ? 180 : 0 }}
		transition={{ duration: 0.5 }}
	  >
		<motion.div className="absolute w-full h-full backface-hidden">
		  <div className="bg-white rounded-xl shadow-md p-4 h-full flex flex-col justify-center items-center">
			<h4 className="text-xl font-semibold text-gray-800">{title}</h4>
			<p className="text-gray-600 text-center">{description}</p>
		  </div>
		</motion.div>
		<motion.div className="absolute w-full h-full backface-hidden rotate-y-180">
		  <div className="bg-white rounded-xl shadow-md p-4 h-full flex flex-col justify-center items-center">
			{/* Add content for the back side of the card here */}
		  </div>
		</motion.div>
	  </motion.div>
	</div>
  );
};

export default NJANFlipCard;