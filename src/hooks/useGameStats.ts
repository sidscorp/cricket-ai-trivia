/**
 * Reusable Game Statistics Hook
 * 
 * Tracks game metrics that can be used across different game modes.
 * Provides a consistent interface for tracking player performance.
 */

import { useState, useCallback } from 'react';

export interface GameStats {
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentStreak: number;
  bestStreak: number;
  totalTimePlayed: number; // in seconds
  averageResponseTime: number;
  categoryPerformance: Record<string, {
    attempted: number;
    correct: number;
  }>;
  difficultyPerformance: Record<string, {
    attempted: number;
    correct: number;
  }>;
}

export interface AnswerRecord {
  questionId: string;
  isCorrect: boolean;
  responseTime: number;
  category?: string;
  difficulty?: string;
  timestamp: Date;
}

const initialStats: GameStats = {
  questionsAnswered: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalTimePlayed: 0,
  averageResponseTime: 0,
  categoryPerformance: {},
  difficultyPerformance: {},
};

export const useGameStats = () => {
  const [stats, setStats] = useState<GameStats>(initialStats);
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);

  /**
   * Record an answer and update all relevant statistics
   */
  const recordAnswer = useCallback((record: Omit<AnswerRecord, 'timestamp'>) => {
    const fullRecord: AnswerRecord = {
      ...record,
      timestamp: new Date(),
    };

    setAnswerHistory(prev => [...prev, fullRecord]);

    setStats(prev => {
      const newStats = { ...prev };

      // Update basic counts
      newStats.questionsAnswered++;
      if (record.isCorrect) {
        newStats.correctAnswers++;
        newStats.currentStreak++;
        newStats.bestStreak = Math.max(newStats.currentStreak, newStats.bestStreak);
      } else {
        newStats.incorrectAnswers++;
        newStats.currentStreak = 0;
      }

      // Update time stats
      newStats.totalTimePlayed += record.responseTime;
      newStats.averageResponseTime = newStats.totalTimePlayed / newStats.questionsAnswered;

      // Update category performance
      if (record.category) {
        if (!newStats.categoryPerformance[record.category]) {
          newStats.categoryPerformance[record.category] = { attempted: 0, correct: 0 };
        }
        newStats.categoryPerformance[record.category].attempted++;
        if (record.isCorrect) {
          newStats.categoryPerformance[record.category].correct++;
        }
      }

      // Update difficulty performance
      if (record.difficulty) {
        if (!newStats.difficultyPerformance[record.difficulty]) {
          newStats.difficultyPerformance[record.difficulty] = { attempted: 0, correct: 0 };
        }
        newStats.difficultyPerformance[record.difficulty].attempted++;
        if (record.isCorrect) {
          newStats.difficultyPerformance[record.difficulty].correct++;
        }
      }

      return newStats;
    });
  }, []);

  /**
   * Get accuracy percentage
   */
  const getAccuracy = useCallback(() => {
    if (stats.questionsAnswered === 0) return 0;
    return (stats.correctAnswers / stats.questionsAnswered) * 100;
  }, [stats]);

  /**
   * Get performance by category
   */
  const getCategoryAccuracy = useCallback((category: string) => {
    const perf = stats.categoryPerformance[category];
    if (!perf || perf.attempted === 0) return 0;
    return (perf.correct / perf.attempted) * 100;
  }, [stats]);

  /**
   * Get performance by difficulty
   */
  const getDifficultyAccuracy = useCallback((difficulty: string) => {
    const perf = stats.difficultyPerformance[difficulty];
    if (!perf || perf.attempted === 0) return 0;
    return (perf.correct / perf.attempted) * 100;
  }, [stats]);

  /**
   * Get weak areas (categories with <50% accuracy)
   */
  const getWeakAreas = useCallback(() => {
    return Object.entries(stats.categoryPerformance)
      .filter(([_, perf]) => perf.attempted >= 3 && (perf.correct / perf.attempted) < 0.5)
      .map(([category]) => category);
  }, [stats]);

  /**
   * Get strong areas (categories with >80% accuracy)
   */
  const getStrongAreas = useCallback(() => {
    return Object.entries(stats.categoryPerformance)
      .filter(([_, perf]) => perf.attempted >= 3 && (perf.correct / perf.attempted) > 0.8)
      .map(([category]) => category);
  }, [stats]);

  /**
   * Reset all statistics
   */
  const reset = useCallback(() => {
    setStats(initialStats);
    setAnswerHistory([]);
  }, []);

  /**
   * Get a summary of current performance
   */
  const getSummary = useCallback(() => {
    const accuracy = getAccuracy();
    const weakAreas = getWeakAreas();
    const strongAreas = getStrongAreas();

    return {
      totalQuestions: stats.questionsAnswered,
      accuracy: accuracy.toFixed(1),
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      averageTime: stats.averageResponseTime.toFixed(1),
      weakAreas,
      strongAreas,
      performanceLevel: 
        accuracy >= 80 ? 'Excellent' :
        accuracy >= 60 ? 'Good' :
        accuracy >= 40 ? 'Fair' : 'Needs Practice'
    };
  }, [stats, getAccuracy, getWeakAreas, getStrongAreas]);

  return {
    stats,
    answerHistory,
    recordAnswer,
    getAccuracy,
    getCategoryAccuracy,
    getDifficultyAccuracy,
    getWeakAreas,
    getStrongAreas,
    getSummary,
    reset,
  };
};

/**
 * Cricket-specific stats formatter
 */
export const formatCricketStats = (stats: GameStats) => {
  const runs = stats.correctAnswers; // Simple mapping for now
  const balls = stats.questionsAnswered;
  const wickets = stats.incorrectAnswers;
  const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
  
  return {
    runs,
    wickets,
    balls,
    overs: Math.floor(balls / 6) + '.' + (balls % 6),
    strikeRate: strikeRate.toFixed(1),
    average: wickets > 0 ? (runs / wickets).toFixed(1) : runs.toFixed(1),
  };
};