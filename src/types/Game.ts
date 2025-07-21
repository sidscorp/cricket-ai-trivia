/**
 * Generic Game Types
 * 
 * Shared types that can be used across different game modes
 */

export interface GameMode {
  id: string;
  name: string;
  description: string;
  icon?: string;
  config: GameConfig;
}

export interface GameConfig {
  questionCount?: number;
  timeLimit?: number; // in seconds
  lives?: number;
  scoringMode: 'standard' | 'cricket' | 'streak' | 'custom';
  difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
}

export interface GameState {
  mode: string;
  status: 'idle' | 'playing' | 'paused' | 'completed';
  score: number;
  questionsAnswered: number;
  startTime: Date;
  endTime?: Date;
}

export interface GameResult {
  mode: string;
  finalScore: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  timePlayed: number; // in seconds
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  unlockedAt: Date;
}

export interface PlayerProgress {
  questionsHistory: QuestionProgress[];
  currentStreak: number;
  weakAreas: string[];
  strongAreas: string[];
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface QuestionProgress {
  questionId: string;
  topic: string;
  wasCorrect: boolean;
  responseTime: number;
  difficulty: string;
}