
import React, { useState, useRef, useEffect } from 'react';
import { AppState, LessonContent, TargetLanguage } from './types';
import { analyzeTextbookPage, generateSpeech } from './services/geminiService';
import { decodeBase64, decodeAudioData } from './utils/audio';
import Mascot from './components/Mascot';
import MagicAnimation from './components/MagicAnimation';
import { Camera, Sparkles, Volume2, ArrowLeft, RefreshCw, Languages } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [targetLang, setTargetLang] = useState<TargetLanguage>('Spanish');
  const [content, setContent] = useState<LessonContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startCamera = async () => {
    setState(AppState.CAMERA);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Oops! I couldn't open the camera. Make sure you gave me permission!");
      setState(AppState.HOME);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    // Stop stream
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());

    setState(AppState.PROCESSING);
    setIsLoading(true);

    try {
      const result = await analyzeTextbookPage(base64Image, targetLang);
      setContent(result);
      setState(AppState.RESULT);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("My magic glasses got blurry! Let's try again.");
      setState(AppState.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const playSound = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioData = await generateSpeech(text, targetLang);
      const decodedData = decodeBase64(audioData);
      const audioBuffer = await decodeAudioData(decodedData, audioContextRef.current);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsSpeaking(false);
    }
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-5xl font-bubble text-pink-600 mb-8 drop-shadow-md">LingoLens!</h1>
      <Mascot mood="happy" className="mb-12" />
      
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border-4 border-yellow-300 mb-8">
        <label className="block text-gray-700 font-bold mb-4 flex items-center justify-center gap-2">
          <Languages className="text-blue-500" /> Choose a Magic Language:
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi'] as TargetLanguage[]).map(lang => (
            <button
              key={lang}
              onClick={() => setTargetLang(lang)}
              className={`py-3 rounded-2xl font-bold transition-all ${
                targetLang === lang 
                  ? 'bg-blue-500 text-white scale-105 shadow-md' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={startCamera}
        className="group relative bg-green-500 hover:bg-green-600 text-white font-bubble text-3xl py-6 px-12 rounded-full shadow-[0_10px_0_rgb(22,163,74)] active:shadow-none active:translate-y-2 transition-all flex items-center gap-4"
      >
        <Camera size={40} />
        Start Magic Scan
        <Sparkles className="absolute -top-4 -right-4 text-yellow-400 group-hover:animate-spin" />
      </button>
    </div>
  );

  const renderCamera = () => (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 bg-gray-900/50 backdrop-blur-md z-10">
        <button onClick={() => setState(AppState.HOME)} className="text-white p-2">
          <ArrowLeft size={32} />
        </button>
        <span className="text-white font-bubble text-xl">Point at your textbook!</span>
        <div className="w-8" />
      </div>
      
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
        {/* Scanning Guideline */}
        <div className="absolute inset-8 border-4 border-white/50 rounded-3xl pointer-events-none">
          <div className="absolute inset-0 border-4 border-dashed border-yellow-400/50 rounded-3xl animate-pulse" />
        </div>
      </div>

      <div className="p-8 bg-gray-900/50 backdrop-blur-md flex justify-center z-10">
        <button
          onClick={capturePhoto}
          className="w-20 h-20 bg-white rounded-full border-8 border-gray-300 flex items-center justify-center active:scale-90 transition-transform"
        >
          <div className="w-12 h-12 bg-pink-500 rounded-full" />
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <Mascot mood="thinking" className="mb-12" />
      <h2 className="text-3xl font-bubble text-blue-600 mb-4 animate-pulse">Reading the magic words...</h2>
      <div className="w-64 h-4 bg-blue-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 animate-[loading_2s_infinite]" style={{ width: '40%' }}></div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );

  const renderResult = () => {
    if (!content) return null;
    return (
      <div className="min-h-screen p-6 pb-32 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setState(AppState.HOME)}
            className="bg-white p-3 rounded-2xl shadow-md text-pink-500"
          >
            <ArrowLeft />
          </button>
          <h2 className="text-3xl font-bubble text-pink-600">Magic Result!</h2>
          <div className="w-10" />
        </div>

        <MagicAnimation 
          emoji={content.animationPrompt.emoji} 
          action={content.animationPrompt.action}
          color={content.animationPrompt.color}
          description={content.animationPrompt.description}
        />

        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Original</span>
            <button onClick={() => playSound(content.originalText)} className="text-blue-500 hover:scale-110 transition-transform">
              <Volume2 className={isSpeaking ? "animate-pulse" : ""} />
            </button>
          </div>
          <p className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
            {content.originalText}
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="bg-pink-100 text-pink-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{targetLang}</span>
            <button onClick={() => playSound(content.translatedText)} className="text-pink-500 hover:scale-110 transition-transform">
              <Volume2 className={isSpeaking ? "animate-pulse" : ""} />
            </button>
          </div>
          <p className="text-3xl font-bubble text-pink-600 mb-2">
            {content.translatedText}
          </p>
          <p className="text-sm text-gray-500 italic mb-4">
            How to say it: <span className="text-blue-500 font-bold">{content.pronunciation}</span>
          </p>
        </div>

        <div className="bg-yellow-200 rounded-3xl p-6 border-2 border-yellow-400 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 text-yellow-500 opacity-20">
            <Sparkles size={64} />
          </div>
          <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
            🌟 Fun Discovery!
          </h3>
          <p className="text-yellow-900 leading-snug">
            {content.funFact}
          </p>
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-6">
          <button
            onClick={() => setState(AppState.HOME)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bubble text-2xl py-5 rounded-2xl shadow-[0_6px_0_rgb(37,99,235)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCw /> Try Another!
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-yellow-50 overflow-x-hidden">
      {state === AppState.HOME && renderHome()}
      {state === AppState.CAMERA && renderCamera()}
      {state === AppState.PROCESSING && renderProcessing()}
      {state === AppState.RESULT && renderResult()}
    </div>
  );
};

export default App;
