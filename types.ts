
export interface LessonContent {
  originalText: string;
  translatedText: string;
  pronunciation: string;
  funFact: string;
  videoPrompt: string; // Detailed prompt for Veo video generation
}

export enum AppState {
  HOME,
  CAMERA,
  PROCESSING, // OCR/Translation phase
  GENERATING_VIDEO, // Veo generation phase
  RESULT
}

export type TargetLanguage = 'Spanish' | 'French' | 'German' | 'Japanese' | 'Chinese' | 'Hindi' | 'American English' | 'British English';
