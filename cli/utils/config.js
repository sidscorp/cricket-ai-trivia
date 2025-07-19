/**
 * Configuration Management for Cricket Trivia CLI
 * 
 * Handles API keys, environment variables, and CLI settings
 */

import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

export class Config {
  constructor() {
    this.validateEnvironment();
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    // Check for Gemini API key (required for generation)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      console.error(chalk.red('\n❌ Missing Gemini API key!'));
      console.error(chalk.yellow('💡 Set one of these environment variables:'));
      console.error(chalk.gray('   export GEMINI_API_KEY=your_gemini_key'));
      console.error(chalk.gray('   or EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key'));
      process.exit(1);
    }

    // Check for Google Search keys (optional - warn if missing)
    const hasGoogleSearch = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    if (!hasGoogleSearch) {
      console.warn(chalk.yellow('\n⚠️  Google Custom Search not configured:'));
      console.warn(chalk.gray('   • GOOGLE_CUSTOM_SEARCH_API_KEY (missing)'));
      console.warn(chalk.gray('   • GOOGLE_CUSTOM_SEARCH_ENGINE_ID (missing)'));
      console.warn(chalk.cyan('   📝 Web verification will be skipped. Generation and basic testing will still work.\n'));
    }
  }

  /**
   * Get Gemini API configuration
   */
  get gemini() {
    return {
      apiKey: process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    };
  }

  /**
   * Get Google Custom Search configuration
   */
  get googleSearch() {
    return {
      apiKey: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      searchEngineId: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
      maxResults: 5
    };
  }

  /**
   * Get performance targets
   */
  get performance() {
    return {
      targetTimeMs: 4000, // 4 second target
      warningTimeMs: 3000, // Show warning if under 3s
      maxTimeMs: 6000 // Fail if over 6s
    };
  }

  /**
   * Get cricket context for searches
   */
  get cricketContext() {
    return {
      searchTerms: ['cricket', 'cricket match', 'cricket player', 'cricket history'],
      trustedSources: [
        'espncricinfo.com',
        'cricbuzz.com',
        'bbc.com/sport/cricket',
        'icc-cricket.com',
        'cricket.com.au',
        'ecb.co.uk',
        'bcci.tv'
      ],
      excludeTerms: ['fake', 'rumor', 'speculation', 'unconfirmed']
    };
  }
}

export const config = new Config();