export enum DifficultyTier {
  BEGINNER = 'Beginner (Basic Communication)',
  INTERMEDIATE = 'Intermediate (Technical Discussion)',
  ADVANCED = 'Advanced (Management & Strategy)'
}

export interface UserState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  history: ExerciseResult[];
}

export interface ExerciseResult {
  id: string;
  type: 'reading' | 'writing';
  score: number;
  date: string;
  level: number;
}

export interface ReadingQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ReadingExercise {
  subject: string;
  sender: string;
  body: string;
  questions: ReadingQuestion[];
}

export interface WritingScenario {
  context: string;
  recipientRole: string;
  goal: string;
  keyPoints: string[];
}

export interface WritingFeedback {
  score: number; // 0-100
  critique: string;
  improvedVersion: string;
  grammarMistakes: string[];
}

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  READING = 'READING',
  WRITING = 'WRITING'
}