/**
 * UI Adapter for Learn Cricket Service
 * 
 * Integrates the shared LearnCricketService with the React Native UI.
 */

import LearnCricketService from '../../shared/services/LearnCricketService';
import { getOpenRouterService } from '../../shared/services/OpenRouterService';
import { TriviaQuestion } from '../types/Question';
import { LearnCricketQuestion, PerformanceMetrics } from '../../shared/types/learn-cricket';

// UI-specific logger (no colors, just console)
const uiLogger = {
  info: (msg: string) => console.log(`[Learn Cricket] ${msg}`),
  warn: (msg: string) => console.warn(`[Learn Cricket] ${msg}`),
  error: (msg: string, error?: any) => console.error(`[Learn Cricket] ${msg}`, error || ''),
  success: (msg: string) => console.log(`[Learn Cricket] ✓ ${msg}`),
};

/**
 * Convert shared question format to UI TriviaQuestion format
 */
function convertToTriviaQuestion(question: LearnCricketQuestion): TriviaQuestion {
  return {
    id: question.id,
    question: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    category: 'tutorial' as const,
    difficulty: question.difficulty === 'beginner' ? 'easy' : 
               question.difficulty === 'intermediate' ? 'medium' : 'hard',
    source: 'ai',
    generatedAt: new Date(),
    model: 'learn-cricket',
    topic: question.topic,
  };
}

/**
 * UI-specific Learn Cricket Service
 */
export class LearnCricketUIService {
  private service: LearnCricketService;
  
  constructor() {
    // Initialize with OpenRouter service from UI
    const openRouterService = getOpenRouterService();
    
    this.service = new LearnCricketService({
      logger: uiLogger,
      openRouterService: openRouterService as any,
      // Model will be picked from shared config/environment
    });
  }
  
  /**
   * Generate questions for an over (UI-friendly version)
   */
  async generateOverQuestions(
    overNumber: number = 1,
    previousQuestions?: TriviaQuestion[],
    previousAnswers?: number[],
    performance?: PerformanceMetrics
  ): Promise<TriviaQuestion[]> {
    try {
      // Convert UI questions back to shared format if needed
      const sharedPreviousQuestions = previousQuestions?.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic || 'general',
        difficulty: 'beginner' as const,
        category: 'tutorial',
      }));
      
      // Call shared service
      const questions = await this.service.generateOverQuestions({
        overNumber,
        previousQuestions: sharedPreviousQuestions,
        previousAnswers,
        performance,
      });
      
      // Convert to UI format
      return questions.map(convertToTriviaQuestion);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      throw error;
    }
  }
  
  /**
   * Calculate performance (delegates to shared service)
   */
  calculatePerformance(questions: TriviaQuestion[], userAnswers: number[]): PerformanceMetrics {
    // Convert to shared format for calculation
    const sharedQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      topic: q.topic || 'general',
      difficulty: 'beginner' as const,
      category: 'tutorial',
    }));
    
    return this.service.calculatePerformance(sharedQuestions, userAnswers);
  }
  
  /**
   * Parse user answers (for future use if needed)
   */
  parseUserAnswers(input: string): number[] {
    return this.service.parseUserAnswers(input);
  }
}

// Singleton instance
let learnCricketUIServiceInstance: LearnCricketUIService | null = null;

/**
 * Get or create Learn Cricket UI service instance
 */
export function getLearnCricketUIService(): LearnCricketUIService {
  if (!learnCricketUIServiceInstance) {
    learnCricketUIServiceInstance = new LearnCricketUIService();
  }
  return learnCricketUIServiceInstance;
}

export default LearnCricketUIService;