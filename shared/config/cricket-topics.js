/**
 * Shared Cricket Topics Configuration
 * 
 * Centralized list of cricket topics used for Learn Cricket mode.
 * Used by both CLI and UI for consistent topic coverage.
 */

export const CRICKET_TOPICS = [
  'basic rules',
  'field positions',
  'batting techniques',
  'bowling types',
  'match formats',
  'scoring system',
  'equipment',
  'cricket terminology',
  'famous players',
  'cricket history'
];

// Extended topic descriptions for better question generation
export const TOPIC_DESCRIPTIONS = {
  'basic rules': 'Fundamental rules of cricket including overs, innings, and dismissals',
  'field positions': 'Fielding positions like slip, gully, mid-wicket, and point',
  'batting techniques': 'Batting shots, stances, and strategies',
  'bowling types': 'Different bowling styles including pace, spin, and swing',
  'match formats': 'Test, ODI, T20, and other cricket formats',
  'scoring system': 'How runs are scored, extras, and scorekeeping',
  'equipment': 'Cricket gear including bat, ball, pads, and protective equipment',
  'cricket terminology': 'Common cricket terms like googly, yorker, and maiden over',
  'famous players': 'Legendary cricketers and their achievements',
  'cricket history': 'Evolution of cricket and historic moments'
};

// Topic difficulty levels
export const TOPIC_DIFFICULTY = {
  'basic rules': 'beginner',
  'field positions': 'beginner',
  'batting techniques': 'intermediate',
  'bowling types': 'intermediate',
  'match formats': 'beginner',
  'scoring system': 'beginner',
  'equipment': 'beginner',
  'cricket terminology': 'intermediate',
  'famous players': 'beginner',
  'cricket history': 'intermediate'
};

// Get random topics for question generation
export function getRandomTopics(count = 6) {
  const shuffled = [...CRICKET_TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get topics by difficulty
export function getTopicsByDifficulty(difficulty) {
  return CRICKET_TOPICS.filter(topic => 
    TOPIC_DIFFICULTY[topic] === difficulty
  );
}

export default {
  CRICKET_TOPICS,
  TOPIC_DESCRIPTIONS,
  TOPIC_DIFFICULTY,
  getRandomTopics,
  getTopicsByDifficulty,
};