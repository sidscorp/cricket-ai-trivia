/**
 * AnecdoteGenerator - Phase 1 of V2 Pipeline
 * 
 * Uses Perplexity Sonar to generate cricket anecdotes with web search capability.
 * Focuses on dramatic, specific cricket incidents with proper source attribution.
 */

import chalk from 'chalk';
import { getOpenRouterService } from '../../shared/services/OpenRouterService.js';
import { config } from '../utils/config.js';
import { getEnhancedFilterSystem } from '../utils/enhanced-filters.js';

export class AnecdoteGenerator {
  constructor() {
    this.openRouter = getOpenRouterService();
    this.config = config.openRouter;
    this.filterSystem = getEnhancedFilterSystem();
  }

  /**
   * Generate cricket anecdotes based on filters and category
   * @param {Object} options - Generation options
   * @param {Object} options.filters - Cricket filters (era, countries, etc.)
   * @param {string} options.category - Question category
   * @param {number} options.count - Number of anecdotes to generate
   * @param {string} options.model - Specific model to use (optional)
   * @returns {Promise<Array>} Array of cricket anecdotes
   */
  async generateAnecdotes(options) {
    const {
      filters = {},
      category = 'legendary_moments',
      count = 10,
      model = null
    } = options;

    console.log(chalk.blue(`🎪 Phase 1: Generating ${count} cricket anecdotes...`));
    
    try {
      // Validate count within limits
      const validatedCount = this.validateAnecdoteCount(count);
      
      // Build enhanced request with randomization
      const request = this.buildAnecdoteRequest({
        filters,
        category,
        count: validatedCount,
        model: model ? this.selectBestSearchModel(model) : this.selectBestSearchModel()
      });

      // Generate anecdotes using OpenRouter
      const anecdotes = await this.openRouter.generateAnecdotes(request);
      
      // Validate and enhance anecdotes
      const processedAnecdotes = this.processAnecdotes(anecdotes);
      
      console.log(chalk.green(`✅ Generated ${processedAnecdotes.length} anecdotes`));
      
      return processedAnecdotes;
    } catch (error) {
      console.error(chalk.red('❌ Anecdote generation failed:'), error.message);
      throw new Error(`AnecdoteGenerator failed: ${error.message}`);
    }
  }

  /**
   * Validate anecdote count within configured limits
   */
  validateAnecdoteCount(count) {
    const { min, max, default: defaultCount } = this.config.v2Pipeline.anecdoteCount;
    
    if (count < min) {
      console.warn(chalk.yellow(`⚠️ Count ${count} below minimum (${min}), using ${min}`));
      return min;
    }
    
    if (count > max) {
      console.warn(chalk.yellow(`⚠️ Count ${count} above maximum (${max}), using ${max}`));
      return max;
    }
    
    return count;
  }

  /**
   * Select the best search model based on current configuration
   */
  selectBestSearchModel(modelHint = null) {
    const searchModels = this.config.models.search;
    
    // Handle model hints/aliases
    if (modelHint) {
      if (modelHint === 'fast') return searchModels.fast || searchModels.default;
      if (modelHint === 'pro') return searchModels.pro;
      if (modelHint === 'reasoning') return searchModels.reasoning;
      // If it's a full model ID, return it directly
      if (modelHint.includes('/')) return modelHint;
    }
    
    // Default priority order: default > pro > reasoning
    return searchModels.default;
  }

  /**
   * Build enhanced anecdote request with advanced randomization
   */
  buildAnecdoteRequest({ filters, category, count, model }) {
    return {
      filters: this.enhanceFilters(filters, category),
      category,
      count,
      model,
      timestamp: Date.now(),
      randomSeed: Math.random()
    };
  }

  /**
   * Enhance filters using the advanced filter system
   */
  enhanceFilters(filters, category) {
    console.log(chalk.gray('🎯 Applying enhanced filter system...'));
    return this.filterSystem.generateEnhancedFilters(filters, category);
  }

  /**
   * Process and validate generated anecdotes
   */
  processAnecdotes(anecdotes) {
    if (!Array.isArray(anecdotes)) {
      throw new Error('Invalid anecdotes format - expected array');
    }

    return anecdotes
      .filter(anecdote => this.validateAnecdote(anecdote))
      .map(anecdote => this.enhanceAnecdote(anecdote));
  }

  /**
   * Validate individual anecdote structure
   */
  validateAnecdote(anecdote) {
    const required = ['title', 'story', 'key_facts'];
    const missing = required.filter(field => !anecdote[field]);
    
    if (missing.length > 0) {
      console.warn(chalk.yellow(`⚠️ Anecdote missing fields: ${missing.join(', ')}`));
      return false;
    }
    
    if (anecdote.story.length < 100) {
      console.warn(chalk.yellow(`⚠️ Anecdote story too short: ${anecdote.story.length} chars`));
      return false;
    }
    
    return true;
  }

  /**
   * Enhance anecdote with metadata and quality scores
   */
  enhanceAnecdote(anecdote) {
    return {
      ...anecdote,
      id: `anecdote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wordCount: anecdote.story.split(' ').length,
      dramaTags: this.extractDramaTags(anecdote.story),
      sourceCount: Array.isArray(anecdote.sources) ? anecdote.sources.length : 0,
      qualityScore: this.calculateQualityScore(anecdote),
      generatedAt: new Date().toISOString(),
      phase: 'anecdote_generation'
    };
  }

  /**
   * Extract drama-related tags from story content
   */
  extractDramaTags(story) {
    const dramaKeywords = {
      tension: ['last-ball', 'final over', 'needed', 'pressure', 'crucial'],
      emotion: ['dramatic', 'stunning', 'incredible', 'shocking', 'emotional'],
      conflict: ['controversial', 'disputed', 'argument', 'confrontation', 'rivalry'],
      achievement: ['record', 'milestone', 'first-ever', 'breakthrough', 'historic']
    };
    
    const storyLower = story.toLowerCase();
    const tags = [];
    
    Object.entries(dramaKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => storyLower.includes(keyword))) {
        tags.push(category);
      }
    });
    
    return tags;
  }

  /**
   * Calculate quality score for anecdote
   */
  calculateQualityScore(anecdote) {
    let score = 0;
    
    // Story length (optimal 200-400 words)
    const wordCount = anecdote.story.split(' ').length;
    if (wordCount >= 200 && wordCount <= 400) score += 20;
    else if (wordCount >= 150) score += 10;
    
    // Key facts count (more facts = better)
    score += Math.min(anecdote.key_facts.length * 5, 25);
    
    // Source attribution
    if (anecdote.sources && anecdote.sources.length > 0) score += 15;
    
    // Drama indicators
    const storyLower = anecdote.story.toLowerCase();
    const dramaWords = ['dramatic', 'stunning', 'incredible', 'last-ball', 'controversial'];
    score += dramaWords.filter(word => storyLower.includes(word)).length * 5;
    
    // Title engagement
    if (anecdote.title.length > 10 && anecdote.title.length < 100) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Test connection to OpenRouter service
   */
  async testConnection() {
    try {
      const result = await this.openRouter.testConnection();
      if (result) {
        console.log(chalk.green('✅ AnecdoteGenerator: OpenRouter connection successful'));
      } else {
        console.log(chalk.red('❌ AnecdoteGenerator: OpenRouter connection failed'));
      }
      return result;
    } catch (error) {
      console.error(chalk.red('❌ AnecdoteGenerator connection test failed:'), error.message);
      return false;
    }
  }
}

// Export singleton getter
let anecdoteGeneratorInstance = null;

export const getAnecdoteGenerator = () => {
  if (!anecdoteGeneratorInstance) {
    anecdoteGeneratorInstance = new AnecdoteGenerator();
  }
  return anecdoteGeneratorInstance;
};

export default AnecdoteGenerator;