/**
 * Learning Context Service
 * 
 * Tracks and analyzes player learning progress to enable
 * adaptive question generation and personalized learning paths.
 */

import { PlayerProgress, QuestionProgress } from '../types/Game';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LearningMetrics {
  overallAccuracy: number;
  recentAccuracy: number; // Last 10 questions
  averageResponseTime: number;
  topicMastery: Record<string, number>; // Topic -> mastery percentage
  difficultyProgression: number; // 0-1 scale
  engagementScore: number; // Based on consistency and streaks
}

export interface AdaptiveRecommendation {
  suggestedDifficulty: 'easy' | 'medium' | 'hard';
  focusTopics: string[];
  reviewTopics: string[];
  readyForAdvanced: boolean;
}

export class LearningContextService {
  private static STORAGE_KEY = 'cricket_learning_context';
  private progress: PlayerProgress;

  constructor() {
    this.progress = this.createInitialProgress();
  }

  /**
   * Initialize with empty progress
   */
  private createInitialProgress(): PlayerProgress {
    return {
      questionsHistory: [],
      currentStreak: 0,
      weakAreas: [],
      strongAreas: [],
      knowledgeLevel: 'beginner'
    };
  }

  /**
   * Load progress from storage
   */
  async loadProgress(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(LearningContextService.STORAGE_KEY);
      if (stored) {
        this.progress = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load learning progress:', error);
    }
  }

  /**
   * Save progress to storage
   */
  async saveProgress(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        LearningContextService.STORAGE_KEY,
        JSON.stringify(this.progress)
      );
    } catch (error) {
      console.error('Failed to save learning progress:', error);
    }
  }

  /**
   * Record a question attempt and update progress
   */
  async recordQuestionAttempt(
    questionId: string,
    topic: string,
    wasCorrect: boolean,
    responseTime: number,
    difficulty: string
  ): Promise<void> {
    const questionProgress: QuestionProgress = {
      questionId,
      topic,
      wasCorrect,
      responseTime,
      difficulty
    };

    // Add to history
    this.progress.questionsHistory.push(questionProgress);
    
    // Keep only last 100 questions
    if (this.progress.questionsHistory.length > 100) {
      this.progress.questionsHistory = this.progress.questionsHistory.slice(-100);
    }

    // Update streak
    if (wasCorrect) {
      this.progress.currentStreak++;
    } else {
      this.progress.currentStreak = 0;
    }

    // Update areas of strength/weakness
    this.updateLearningAreas();
    
    // Update knowledge level
    this.updateKnowledgeLevel();

    // Save to storage
    await this.saveProgress();
  }

  /**
   * Analyze performance and identify weak/strong areas
   */
  private updateLearningAreas(): void {
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    
    // Analyze last 30 questions for recent performance
    const recentQuestions = this.progress.questionsHistory.slice(-30);
    
    recentQuestions.forEach(q => {
      if (!topicPerformance[q.topic]) {
        topicPerformance[q.topic] = { correct: 0, total: 0 };
      }
      topicPerformance[q.topic].total++;
      if (q.wasCorrect) {
        topicPerformance[q.topic].correct++;
      }
    });

    // Identify weak and strong areas
    const weakAreas: string[] = [];
    const strongAreas: string[] = [];

    Object.entries(topicPerformance).forEach(([topic, performance]) => {
      if (performance.total >= 3) { // Need at least 3 attempts
        const accuracy = performance.correct / performance.total;
        if (accuracy < 0.5) {
          weakAreas.push(topic);
        } else if (accuracy > 0.8) {
          strongAreas.push(topic);
        }
      }
    });

    this.progress.weakAreas = weakAreas;
    this.progress.strongAreas = strongAreas;
  }

  /**
   * Update knowledge level based on overall performance
   */
  private updateKnowledgeLevel(): void {
    const metrics = this.calculateMetrics();
    
    if (metrics.overallAccuracy > 0.8 && metrics.difficultyProgression > 0.7) {
      this.progress.knowledgeLevel = 'advanced';
    } else if (metrics.overallAccuracy > 0.6 && metrics.difficultyProgression > 0.4) {
      this.progress.knowledgeLevel = 'intermediate';
    } else {
      this.progress.knowledgeLevel = 'beginner';
    }
  }

  /**
   * Calculate comprehensive learning metrics
   */
  calculateMetrics(): LearningMetrics {
    const history = this.progress.questionsHistory;
    if (history.length === 0) {
      return {
        overallAccuracy: 0,
        recentAccuracy: 0,
        averageResponseTime: 0,
        topicMastery: {},
        difficultyProgression: 0,
        engagementScore: 0
      };
    }

    // Overall accuracy
    const correctCount = history.filter(q => q.wasCorrect).length;
    const overallAccuracy = correctCount / history.length;

    // Recent accuracy (last 10)
    const recentQuestions = history.slice(-10);
    const recentCorrect = recentQuestions.filter(q => q.wasCorrect).length;
    const recentAccuracy = recentQuestions.length > 0 
      ? recentCorrect / recentQuestions.length 
      : 0;

    // Average response time
    const totalTime = history.reduce((sum, q) => sum + q.responseTime, 0);
    const averageResponseTime = totalTime / history.length;

    // Topic mastery
    const topicMastery: Record<string, number> = {};
    const topicStats: Record<string, { correct: number; total: number }> = {};
    
    history.forEach(q => {
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { correct: 0, total: 0 };
      }
      topicStats[q.topic].total++;
      if (q.wasCorrect) {
        topicStats[q.topic].correct++;
      }
    });

    Object.entries(topicStats).forEach(([topic, stats]) => {
      topicMastery[topic] = stats.correct / stats.total;
    });

    // Difficulty progression (0-1 scale)
    const difficultyScores = { easy: 0, medium: 0.5, hard: 1 };
    const recentDifficulties = history.slice(-20).map(q => 
      difficultyScores[q.difficulty as keyof typeof difficultyScores] || 0
    );
    const difficultyProgression = recentDifficulties.length > 0
      ? recentDifficulties.reduce((a, b) => a + b, 0) / recentDifficulties.length
      : 0;

    // Engagement score (based on streaks and consistency)
    const engagementScore = Math.min(
      (this.progress.currentStreak * 0.1) + (overallAccuracy * 0.5) + (recentAccuracy * 0.4),
      1
    );

    return {
      overallAccuracy,
      recentAccuracy,
      averageResponseTime,
      topicMastery,
      difficultyProgression,
      engagementScore
    };
  }

  /**
   * Get adaptive recommendations for next questions
   */
  getAdaptiveRecommendations(): AdaptiveRecommendation {
    const metrics = this.calculateMetrics();
    
    // Determine suggested difficulty
    let suggestedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (metrics.recentAccuracy < 0.4) {
      suggestedDifficulty = 'easy';
    } else if (metrics.recentAccuracy > 0.8 && metrics.averageResponseTime < 5) {
      suggestedDifficulty = 'hard';
    }

    // Topics that need focus (low mastery)
    const focusTopics = Object.entries(metrics.topicMastery)
      .filter(([_, mastery]) => mastery < 0.5)
      .map(([topic]) => topic);

    // Topics for review (medium mastery)
    const reviewTopics = Object.entries(metrics.topicMastery)
      .filter(([_, mastery]) => mastery >= 0.5 && mastery < 0.8)
      .map(([topic]) => topic);

    // Ready for advanced content?
    const readyForAdvanced = 
      metrics.overallAccuracy > 0.7 && 
      metrics.difficultyProgression > 0.6 &&
      this.progress.questionsHistory.length > 20;

    return {
      suggestedDifficulty,
      focusTopics,
      reviewTopics,
      readyForAdvanced
    };
  }

  /**
   * Get current progress
   */
  getProgress(): PlayerProgress {
    return { ...this.progress };
  }

  /**
   * Reset learning progress
   */
  async resetProgress(): Promise<void> {
    this.progress = this.createInitialProgress();
    await this.saveProgress();
  }

  /**
   * Get a learning summary for display
   */
  getLearningSummary() {
    const metrics = this.calculateMetrics();
    const totalQuestions = this.progress.questionsHistory.length;
    
    return {
      questionsAttempted: totalQuestions,
      knowledgeLevel: this.progress.knowledgeLevel,
      currentStreak: this.progress.currentStreak,
      accuracy: (metrics.overallAccuracy * 100).toFixed(1) + '%',
      averageTime: metrics.averageResponseTime.toFixed(1) + 's',
      strongTopics: this.progress.strongAreas,
      needsPractice: this.progress.weakAreas,
      readyForNextLevel: metrics.overallAccuracy > 0.8 && totalQuestions > 10
    };
  }
}

// Singleton instance
let learningContextInstance: LearningContextService | null = null;

export const getLearningContextService = (): LearningContextService => {
  if (!learningContextInstance) {
    learningContextInstance = new LearningContextService();
  }
  return learningContextInstance;
};