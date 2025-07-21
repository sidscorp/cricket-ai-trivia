/**
 * TypeScript definitions for Learn Cricket shared service
 */

export interface LearnCricketQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface PerformanceMetrics {
  correct: number;
  total: number;
  accuracy: number;
  correctTopics: string[];
  incorrectTopics: string[];
}

export interface GenerationContext {
  overNumber: number;
  previousQuestions?: LearnCricketQuestion[];
  previousAnswers?: number[];
  performance?: PerformanceMetrics;
}

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: any) => void;
  success: (message: string) => void;
}

export interface OpenRouterService {
  callOpenRouterAPI: (params: any) => Promise<any>;
}

export interface LearnCricketServiceOptions {
  logger?: Logger;
  openRouterService?: OpenRouterService;
  model?: string;
}

export declare class LearnCricketService {
  constructor(options?: LearnCricketServiceOptions);
  
  generateOverQuestions(context?: GenerationContext): Promise<LearnCricketQuestion[]>;
  calculatePerformance(questions: LearnCricketQuestion[], userAnswers: number[]): PerformanceMetrics;
  formatQuestionsForDisplay(questions: LearnCricketQuestion[]): any[];
  parseUserAnswers(input: string): number[];
}