
export interface LessonContent {
  originalText: string;
  translatedText: string;
  pronunciation: string;
  funFact: string;
  animationPrompt: {
    emoji: string;
    action: 'bounce' | 'spin' | 'wiggle' | 'pulse';
    color: string;
    description: string;
  };
}

export enum AppState {
  HOME,
  CAMERA,
  PROCESSING,
  RESULT
}

export type TargetLanguage = 'Spanish' | 'French' | 'German' | 'Japanese' | 'Chinese' | 'Hindi';
