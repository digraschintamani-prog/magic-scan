
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LessonContent, TargetLanguage } from "../types";

// Note: For Veo, we re-instantiate with the latest key to avoid race conditions.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeTextbookPage = async (
  base64Data: string,
  targetLang: TargetLanguage,
  mimeType: string = 'image/jpeg'
): Promise<LessonContent> => {
  const ai = getAI();
  
  const prompt = `You are a friendly cartoon teacher. Look at this ${mimeType.includes('pdf') ? 'document' : 'textbook page'} and:
  1. Extract the main sentence or paragraph.
  2. Translate it into ${targetLang}.
  3. Give a simplified phonetic pronunciation for kids.
  4. Provide a fun fact for children about the content.
  5. Create a "Video Prompt": Describe a beautiful, 3D animated scene (Pixar/Disney style) that visualizes this text. Make it vivid, colorful, and child-friendly.
  
  Format the output strictly as JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          translatedText: { type: Type.STRING },
          pronunciation: { type: Type.STRING },
          funFact: { type: Type.STRING },
          videoPrompt: { type: Type.STRING }
        },
        required: ['originalText', 'translatedText', 'pronunciation', 'funFact', 'videoPrompt']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateVideo = async (prompt: string): Promise<string> => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `${prompt}, high quality 3D animation, bright colors, cinematic lighting, child-friendly style`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");
  
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const generateSpeech = async (text: string, lang: TargetLanguage): Promise<string> => {
  const ai = getAI();
  
  let voiceName = 'Zephyr';
  if (lang === 'Japanese') voiceName = 'Kore';
  else if (lang === 'British English') voiceName = 'Puck';
  else if (lang === 'American English') voiceName = 'Zephyr';
  else voiceName = 'Puck';

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly and slowly for a child: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};
