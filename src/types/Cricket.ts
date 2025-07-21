/**
 * Cricket-Specific Types
 * 
 * Types specific to cricket-themed game modes
 */

export type BallResult = '6' | '4' | '1' | '0' | 'W' | '-';

export interface CricketGameState {
  runs: number;
  wickets: number;
  balls: number;
  overs: string; // e.g., "1.3" for 1 over and 3 balls
  currentOver: number;
  currentBall: number;
  boundaries: {
    fours: number;
    sixes: number;
  };
  dotBalls: number;
  singles: number;
  strikeRate: number;
  runRate: number;
  ballResults: BallResult[]; // Track each ball's result
}

export interface CricketScoring {
  type: 'six' | 'four' | 'single' | 'dot' | 'wicket';
  runs: number;
  description: string;
  celebration?: boolean;
}

export interface LearnCricketConfig {
  totalOvers: number;
  totalWickets: number;
  timingThresholds: {
    six: number;    // < 3 seconds
    four: number;   // < 5 seconds
    single: number; // < 10 seconds
  };
  showIntroPopup: boolean;
  enableAnimations: boolean;
  adaptiveDifficulty: boolean;
}

export interface CricketPerformance {
  totalRuns: number;
  wicketsLost: number;
  ballsFaced: number;
  oversPlayed: string;
  boundaries: {
    fours: number;
    sixes: number;
  };
  dotBalls: number;
  singles: number;
  strikeRate: number;
  runRate: number;
  topicsLearned: string[];
  areasToImprove: string[];
}

export const CRICKET_CONSTANTS = {
  BALLS_PER_OVER: 6,
  DEFAULT_WICKETS: 5,
  DEFAULT_OVERS: 2,
  TIMING_THRESHOLDS: {
    SIX: 3,
    FOUR: 5,
    SINGLE: 10,
  },
  CELEBRATIONS: {
    FOUR: 'boundary',
    SIX: 'maximum',
    FIFTY: 'half-century',
    CENTURY: 'century',
  }
};