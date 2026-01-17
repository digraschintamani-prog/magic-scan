
import React from 'react';

interface MagicAnimationProps {
  emoji: string;
  action: string;
  color: string;
  description: string;
}

const MagicAnimation: React.FC<MagicAnimationProps> = ({ emoji, action, color, description }) => {
  const getAnimationClass = () => {
    switch (action) {
      case 'bounce': return 'animate-bounce';
      case 'spin': return 'animate-spin';
      case 'wiggle': return 'animate-[wiggle_1s_ease-in-out_infinite]';
      case 'pulse': return 'animate-pulse';
      default: return 'animate-bounce';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-3xl" style={{ backgroundColor: `${color}20` }}>
      <div className={`text-9xl mb-6 transition-all duration-1000 ${getAnimationClass()}`}>
        {emoji}
      </div>
      <div className="text-center max-w-xs">
        <p className="text-gray-700 font-medium italic">"{description}"</p>
      </div>
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

export default MagicAnimation;
