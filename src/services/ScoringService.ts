/**
 * Reusable Scoring Service
 * 
 * A flexible scoring system that supports different scoring strategies
 * for various game modes. Easily extensible for new scoring rules.
 */

export interface ScoringContext {
  responseTime?: number; // in seconds
  isCorrect?: boolean;
  streak?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  [key: string]: any; // Allow custom context properties
}

export interface ScoringResult {
  points: number;
  label?: string; // e.g., "Six!", "Four!", "Single", "Dot Ball"
  bonus?: number;
  explanation?: string;
}

export type ScoringStrategy = (context: ScoringContext) => ScoringResult;

/**
 * Cricket-style time-based scoring for Learn Cricket mode
 */
export const cricketTimeScoringStrategy: ScoringStrategy = (context) => {
  const { responseTime = 0, isCorrect = false } = context;
  
  if (!isCorrect) {
    return {
      points: 0,
      label: 'Out!',
      explanation: 'Wrong answer - lost a wicket'
    };
  }

  if (responseTime < 2) {
    return {
      points: 6,
      label: 'Six!',
      explanation: 'Lightning fast response!'
    };
  } else if (responseTime < 3) {
    return {
      points: 4,
      label: 'Four!',
      explanation: 'Quick thinking!'
    };
  } else if (responseTime < 5) {
    return {
      points: 2,
      label: 'Double',
      explanation: 'Good timing'
    };
  } else if (responseTime < 8) {
    return {
      points: 1,
      label: 'Single',
      explanation: 'Steady response'
    };
  } else {
    return {
      points: 0,
      label: 'Dot Ball',
      explanation: 'Too slow - no runs scored'
    };
  }
};

/**
 * Standard accuracy-based scoring for regular game mode
 */
export const standardScoringStrategy: ScoringStrategy = (context) => {
  const { isCorrect = false, difficulty = 'medium' } = context;
  
  if (!isCorrect) {
    return { points: 0, label: 'Incorrect' };
  }

  const difficultyMultiplier = {
    easy: 10,
    medium: 20,
    hard: 30
  };

  return {
    points: difficultyMultiplier[difficulty],
    label: 'Correct!',
  };
};

/**
 * Streak-based scoring with multipliers
 */
export const streakScoringStrategy: ScoringStrategy = (context) => {
  const { isCorrect = false, streak = 0 } = context;
  
  if (!isCorrect) {
    return { points: 0, label: 'Streak Broken!' };
  }

  const basePoints = 10;
  const streakBonus = Math.min(streak * 5, 50); // Max 50 bonus points
  
  return {
    points: basePoints + streakBonus,
    bonus: streakBonus,
    label: streak >= 5 ? `${streak} in a row!` : 'Correct!',
  };
};

/**
 * Combined scoring strategy that uses multiple strategies
 */
export const combinedScoringStrategy = (
  strategies: ScoringStrategy[]
): ScoringStrategy => {
  return (context) => {
    const results = strategies.map(strategy => strategy(context));
    
    const totalPoints = results.reduce((sum, result) => sum + result.points, 0);
    const totalBonus = results.reduce((sum, result) => sum + (result.bonus || 0), 0);
    
    return {
      points: totalPoints,
      bonus: totalBonus,
      label: results.find(r => r.label)?.label,
      explanation: results.map(r => r.explanation).filter(Boolean).join('. ')
    };
  };
};

/**
 * Main Scoring Service class
 */
export class ScoringService {
  private strategy: ScoringStrategy;
  private totalScore: number = 0;
  private history: ScoringResult[] = [];

  constructor(strategy: ScoringStrategy = standardScoringStrategy) {
    this.strategy = strategy;
  }

  /**
   * Calculate score for a single action
   */
  calculateScore(context: ScoringContext): ScoringResult {
    const result = this.strategy(context);
    this.totalScore += result.points + (result.bonus || 0);
    this.history.push(result);
    return result;
  }

  /**
   * Get current total score
   */
  getTotalScore(): number {
    return this.totalScore;
  }

  /**
   * Get scoring history
   */
  getHistory(): ScoringResult[] {
    return [...this.history];
  }

  /**
   * Reset the scoring service
   */
  reset(): void {
    this.totalScore = 0;
    this.history = [];
  }

  /**
   * Change scoring strategy mid-game if needed
   */
  setStrategy(strategy: ScoringStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get statistics from scoring history
   */
  getStatistics() {
    const totalAttempts = this.history.length;
    const successfulAttempts = this.history.filter(r => r.points > 0).length;
    const averageScore = totalAttempts > 0 ? this.totalScore / totalAttempts : 0;
    
    return {
      totalScore: this.totalScore,
      totalAttempts,
      successfulAttempts,
      accuracy: totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
      averageScore,
      history: this.history
    };
  }
}

/**
 * Factory function to create preset scoring services
 */
export const createScoringService = (mode: 'cricket' | 'standard' | 'streak' | 'combined') => {
  switch (mode) {
    case 'cricket':
      return new ScoringService(cricketTimeScoringStrategy);
    case 'standard':
      return new ScoringService(standardScoringStrategy);
    case 'streak':
      return new ScoringService(streakScoringStrategy);
    case 'combined':
      return new ScoringService(
        combinedScoringStrategy([standardScoringStrategy, streakScoringStrategy])
      );
    default:
      return new ScoringService();
  }
};