/**
 * Shared Constants
 * 
 * Game constants used across CLI and UI.
 */

export const LEARN_CRICKET_CONSTANTS = {
  // Questions per over
  QUESTIONS_PER_OVER: 6,
  
  // Total overs in Learn Cricket mode
  TOTAL_OVERS: 2,
  
  // Total questions
  TOTAL_QUESTIONS: 12,
  
  // Timer settings (seconds)
  QUESTION_TIME_LIMIT: 15,
  
  // Scoring
  MAX_RUNS_PER_QUESTION: 6,
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    EXCELLENT: 0.8,  // 80%+ accuracy
    GOOD: 0.6,       // 60-79% accuracy
    NEEDS_PRACTICE: 0.5, // Below 50% accuracy
  }
};

export const SCORING_RULES = {
  // Time-based scoring (milliseconds)
  FAST_RESPONSE: 3000,    // Under 3 seconds = 6 runs
  MEDIUM_RESPONSE: 7000,  // Under 7 seconds = 4 runs
  SLOW_RESPONSE: 15000,   // Under 15 seconds = 1 run
  
  // Points mapping
  POINTS: {
    SIX: 6,
    FOUR: 4,
    SINGLE: 1,
    DOT: 0,
  }
};

// Environment detection
export const isCliEnvironment = () => {
  return typeof process !== 'undefined' && 
         process.versions && 
         process.versions.node &&
         !process.env.EXPO_PUBLIC_API_URL;
};

export const isUIEnvironment = () => {
  return typeof process !== 'undefined' && 
         process.env.EXPO_PUBLIC_API_URL !== undefined;
};

export default {
  LEARN_CRICKET_CONSTANTS,
  SCORING_RULES,
  isCliEnvironment,
  isUIEnvironment,
};