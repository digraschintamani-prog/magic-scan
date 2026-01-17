
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LessonContent, TargetLanguage } from "../types";

const API_KEY = process.env.API_KEY || '';

export const analyzeTextbookPage = async (
  base64Image: string,
  targetLang: TargetLanguage
): Promise<LessonContent> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `You are a friendly cartoon teacher. Look at this textbook page and:
  1. Extract the main sentence or paragraph.
  2. Translate it into ${targetLang}.
  3. Give a simplified phonetic pronunciation for kids.
  4. Provide a fun fact for children about the content.
  5. Suggest a simple animation: pick a representative emoji, an action (bounce, spin, wiggle, pulse), a bright color name, and a short 1-sentence description of what's happening.
  
  Format the output strictly as JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
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
          animationPrompt: {
            type: Type.OBJECT,
            properties: {
              emoji: { type: Type.STRING },
              action: { type: Type.STRING, description: 'Must be bounce, spin, wiggle, or pulse' },
              color: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['emoji', 'action', 'color', 'description']
          }
        },
        required: ['originalText', 'translatedText', 'pronunciation', 'funFact', 'animationPrompt']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateSpeech = async (text: string, lang: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Pick a friendly voice
  const voiceName = lang === 'Japanese' ? 'Kore' : 'Puck'; 

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
