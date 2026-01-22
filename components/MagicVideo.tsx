
import React from 'react';
import { Play } from 'lucide-react';

interface MagicVideoProps {
  videoUrl: string;
}

const MagicVideo: React.FC<MagicVideoProps> = ({ videoUrl }) => {
  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-black group">
      <video 
        src={videoUrl} 
        controls 
        autoPlay 
        loop 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 pointer-events-none border-4 border-pink-400/30 rounded-3xl"></div>
    </div>
  );
};

export default MagicVideo;
