
import React, { useState, useRef, useEffect } from 'react';
import { AppState, LessonContent, TargetLanguage } from './types';
import { analyzeTextbookPage, generateSpeech, generateVideo } from './services/geminiService';
import { decodeBase64, decodeAudioData } from './utils/audio';
import Mascot from './components/Mascot';
import MagicVideo from './components/MagicVideo';
import { Camera, Sparkles, Volume2, ArrowLeft, RefreshCw, Languages, FileText, Image as ImageIcon, Wand2, Info } from 'lucide-react';

/* Define the AIStudio interface to match the environment's expected type and fix declaration conflicts */
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const loadingMessages = [
  "Mixing the magic ink...",
  "The Owl is drawing your story...",
  "Sprinkling fairy dust on the video...",
  "Almost there, little explorer!",
  "Giving the characters their colors...",
  "The animation studio is busy working!"
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [targetLang, setTargetLang] = useState<TargetLanguage>('Spanish');
  const [content, setContent] = useState<LessonContent | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (state === AppState.GENERATING_VIDEO) {
      const interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [state]);

  const ensureApiKey = async () => {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    return true;
  };

  const startCamera = async () => {
    setState(AppState.CAMERA);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("I couldn't open the camera! Please check permissions.");
      setState(AppState.HOME);
    }
  };

  const processFile = async (base64Data: string, mimeType: string) => {
    try {
      await ensureApiKey();
      setState(AppState.PROCESSING);
      
      const result = await analyzeTextbookPage(base64Data, targetLang, mimeType);
      setContent(result);
      
      setState(AppState.GENERATING_VIDEO);
      const url = await generateVideo(result.videoPrompt);
      setVideoUrl(url);
      
      setState(AppState.RESULT);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        alert("Please select a valid paid API key for Video Generation.");
        await window.aistudio.openSelectKey();
      } else {
        alert("Magic malfunction! Let's try again.");
      }
      setState(AppState.HOME);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => processFile((e.target?.result as string).split(',')[1], file.type);
    reader.readAsDataURL(file);
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
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(t => t.stop());
    processFile(base64, 'image/jpeg');
  };

  const playSound = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const audioData = await generateSpeech(text, targetLang);
      const audioBuffer = await decodeAudioData(decodeBase64(audioData), audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-5xl font-bubble text-pink-600 mb-6 drop-shadow-md">LingoLens!</h1>
      <Mascot mood="happy" className="mb-6" />
      
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border-4 border-yellow-300 mb-6">
        <label className="block text-gray-700 font-bold mb-4 flex items-center justify-center gap-2">
          <Languages className="text-blue-500" /> Choose Magic Language:
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi', 'American English', 'British English'] as TargetLanguage[]).map(lang => (
            <button
              key={lang}
              onClick={() => setTargetLang(lang)}
              className={`py-3 rounded-2xl font-bold transition-all text-sm ${
                targetLang === lang ? 'bg-blue-500 text-white scale-105' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button onClick={startCamera} className="bg-green-500 text-white font-bubble text-3xl py-6 rounded-full shadow-[0_10px_0_rgb(22,163,74)] flex items-center justify-center gap-4">
          <Camera size={40} /> Scan Now!
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="bg-purple-500 text-white font-bold py-4 rounded-3xl shadow-[0_6px_0_rgb(126,34,206)] flex flex-col items-center gap-1">
            <ImageIcon size={24} /> <span className="text-xs">Image</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white font-bold py-4 rounded-3xl shadow-[0_6px_0_rgb(37,99,235)] flex flex-col items-center gap-1">
            <FileText size={24} /> <span className="text-xs">PDF</span>
          </button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
      <div className="mt-8 flex items-center gap-2 text-gray-500 text-xs">
        <Info size={14} /> Video magic requires a paid API key!
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <Mascot mood="thinking" className="mb-12" />
      <h2 className="text-3xl font-bubble text-blue-600 mb-4 animate-pulse">
        {state === AppState.GENERATING_VIDEO ? "Crafting Your Animation..." : "Reading the words..."}
      </h2>
      <p className="text-gray-500 mb-8 italic">
        {state === AppState.GENERATING_VIDEO ? loadingMessages[loadingMsgIdx] : "Wait for the magic..."}
      </p>
      {state === AppState.GENERATING_VIDEO && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-dashed border-pink-400 max-w-xs">
          <p className="text-sm font-bold text-pink-500 uppercase tracking-widest mb-2">Director's Script:</p>
          <p className="text-gray-600 text-sm italic">"{content?.videoPrompt}"</p>
        </div>
      )}
      <div className="mt-12 flex space-x-2">
        <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-100"></div>
        <div className="w-4 h-4 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!content) return null;
    return (
      <div className="min-h-screen p-6 pb-32 flex flex-col gap-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => setState(AppState.HOME)} className="bg-white p-3 rounded-2xl shadow-md text-pink-500"><ArrowLeft /></button>
          <h2 className="text-3xl font-bubble text-pink-600">Video Magic!</h2>
          <div className="w-10" />
        </div>

        <MagicVideo videoUrl={videoUrl} />

        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase">Original</span>
            <button onClick={() => playSound(content.originalText)} className="text-blue-500"><Volume2 /></button>
          </div>
          <p className="text-xl font-bold text-gray-800 mb-6">{content.originalText}</p>

          <div className="flex items-center justify-between mb-4">
            <span className="bg-pink-100 text-pink-600 px-4 py-1 rounded-full text-xs font-bold uppercase">{targetLang}</span>
            <button onClick={() => playSound(content.translatedText)} className="text-pink-500"><Volume2 /></button>
          </div>
          <p className="text-3xl font-bubble text-pink-600 mb-2">{content.translatedText}</p>
          <p className="text-sm text-gray-500">Say it like: <span className="text-blue-500 font-bold">{content.pronunciation}</span></p>
        </div>

        <div className="bg-yellow-200 rounded-3xl p-6 border-2 border-yellow-400">
          <h3 className="font-bold text-yellow-800 mb-1 flex items-center gap-2">🌟 Fun Discovery!</h3>
          <p className="text-yellow-900 text-sm leading-snug">{content.funFact}</p>
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-6">
          <button onClick={() => setState(AppState.HOME)} className="w-full bg-blue-500 text-white font-bubble text-2xl py-5 rounded-2xl shadow-[0_6px_0_rgb(37,99,235)] flex items-center justify-center gap-3">
            <RefreshCw /> New Adventure!
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-yellow-50 overflow-x-hidden">
      {state === AppState.HOME && renderHome()}
      {state === AppState.CAMERA && (
        <div className="fixed inset-0 bg-black flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          <div className="absolute top-4 left-4"><button onClick={() => setState(AppState.HOME)} className="text-white bg-black/50 p-3 rounded-full"><ArrowLeft /></button></div>
          <div className="p-8 bg-gray-900/50 flex justify-center"><button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-gray-300 flex items-center justify-center"><div className="w-12 h-12 bg-pink-500 rounded-full" /></button></div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      {(state === AppState.PROCESSING || state === AppState.GENERATING_VIDEO) && renderProcessing()}
      {state === AppState.RESULT && renderResult()}
    </div>
  );
};

export default App;
