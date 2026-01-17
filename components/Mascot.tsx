
import React from 'react';

interface MascotProps {
  mood: 'happy' | 'thinking' | 'talking' | 'excited';
  className?: string;
}

const Mascot: React.FC<MascotProps> = ({ mood, className = "" }) => {
  const getEmoji = () => {
    switch (mood) {
      case 'happy': return '🦉';
      case 'thinking': return '🤔';
      case 'talking': return '🗣️';
      case 'excited': return '✨';
      default: return '🦉';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`text-6xl mb-2 transition-transform duration-500 ${mood === 'happy' ? 'animate-float' : mood === 'excited' ? 'scale-125' : ''}`}>
        {getEmoji()}
      </div>
      <div className="bg-white px-4 py-2 rounded-2xl shadow-lg relative">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
        <p className="text-blue-600 font-bold text-sm text-center">
          {mood === 'happy' && "Let's learn together!"}
          {mood === 'thinking' && "Hmm, let me see..."}
          {mood === 'talking' && "Listen closely!"}
          {mood === 'excited' && "Wow! Look at that!"}
        </p>
      </div>
    </div>
  );
};

export default Mascot;
