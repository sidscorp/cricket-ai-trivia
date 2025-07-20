/**
 * QuestionGenerator - Phase 2 of V2 Pipeline
 * 
 * Uses Claude/GPT-4 to transform cricket anecdotes into engaging trivia questions.
 * Focuses on creative question writing while maintaining factual accuracy.
 */

import chalk from 'chalk';
import { getOpenRouterService } from './OpenRouterService.js';
import { config } from '../utils/config.js';

export class QuestionGenerator {
  constructor() {
    this.openRouter = getOpenRouterService();
    this.config = config.openRouter;
  }

  /**
   * Generate trivia questions from cricket anecdotes with streaming optimization
   * @param {Object} options - Generation options
   * @param {Array} options.anecdotes - Array of cricket anecdotes
   * @param {string} options.category - Question category
   * @param {Object} options.filters - Original filters for context
   * @param {number} options.targetQuestions - Target number of questions
   * @param {string} options.model - Specific model to use (optional)
   * @returns {Promise<Array>} Array of trivia questions
   */
  async generateQuestions(options) {
    const {
      anecdotes = [],
      category = 'legendary_moments',
      filters = {},
      targetQuestions = null,
      model = null
    } = options;

    console.log(chalk.blue(`✍️ Phase 2: Generating questions from ${anecdotes.length} anecdotes...`));
    
    if (!anecdotes.length) {
      throw new Error('No anecdotes provided for question generation');
    }

    try {
      // Calculate target questions if not specified
      const calculatedTarget = targetQuestions || this.calculateTargetQuestions(anecdotes.length);
      
      // Select best anecdotes for question generation
      const selectedAnecdotes = this.selectBestAnecdotes(anecdotes, calculatedTarget);
      
      // Use parallel processing for speed when we have enough anecdotes
      if (selectedAnecdotes.length > 3) {
        console.log(chalk.gray(`   Using parallel question generation for ${selectedAnecdotes.length} anecdotes`));
        return await this.generateQuestionsInParallel(selectedAnecdotes, category, filters, model);
      }
      
      // Single batch for small sets
      const request = this.buildQuestionRequest({
        anecdotes: selectedAnecdotes,
        category,
        filters,
        model: model ? this.selectBestCreativeModel(model) : this.selectBestCreativeModel()
      });
      
      const questions = await this.openRouter.generateQuestionsFromAnecdotes(request);
      const processedQuestions = this.processQuestions(questions, selectedAnecdotes);
      
      console.log(chalk.green(`✅ Generated ${processedQuestions.length} questions`));
      return processedQuestions;
    } catch (error) {
      console.error(chalk.red('❌ Question generation failed:'), error.message);
      throw new Error(`QuestionGenerator failed: ${error.message}`);
    }
  }

  /**
   * Generate questions in parallel batches for speed
   */
  async generateQuestionsInParallel(anecdotes, category, filters, model) {
    // Split into batches of 2-3 anecdotes for parallel processing
    const batchSize = Math.min(3, Math.max(2, Math.ceil(anecdotes.length / 2)));
    const batches = [];
    
    for (let i = 0; i < anecdotes.length; i += batchSize) {
      batches.push(anecdotes.slice(i, i + batchSize));
    }
    
    console.log(chalk.gray(`   Processing ${batches.length} parallel batches of ${batchSize} anecdotes`));
    
    const batchPromises = batches.map(async (batch, index) => {
      const request = this.buildQuestionRequest({
        anecdotes: batch,
        category,
        filters,
        model: model ? this.selectBestCreativeModel(model) : this.selectBestCreativeModel()
      });
      
      const questions = await this.openRouter.generateQuestionsFromAnecdotes(request);
      return this.processQuestions(questions, batch);
    });
    
    const batchResults = await Promise.all(batchPromises);
    const allQuestions = batchResults.flat();
    
    console.log(chalk.green(`✅ Generated ${allQuestions.length} questions via parallel processing`));
    return allQuestions;
  }

  /**
   * Calculate target number of questions based on anecdote count
   */
  calculateTargetQuestions(anecdoteCount) {
    const { target } = this.config.v2Pipeline.questionsPerAnecdote;
    return Math.ceil(anecdoteCount * target);
  }

  /**
   * Select best anecdotes for question generation based on quality scores
   */
  selectBestAnecdotes(anecdotes, targetQuestions) {
    // Sort by quality score (descending)
    const sortedAnecdotes = [...anecdotes].sort((a, b) => 
      (b.qualityScore || 0) - (a.qualityScore || 0)
    );
    
    // Select enough anecdotes to generate target questions
    const questionsPerAnecdote = this.config.v2Pipeline.questionsPerAnecdote.target;
    const neededAnecdotes = Math.ceil(targetQuestions / questionsPerAnecdote);
    
    const selected = sortedAnecdotes.slice(0, Math.min(neededAnecdotes, anecdotes.length));
    
    console.log(chalk.gray(`📊 Selected ${selected.length} best anecdotes (avg quality: ${this.averageQuality(selected).toFixed(1)})`));
    
    return selected;
  }

  /**
   * Calculate average quality score of anecdotes
   */
  averageQuality(anecdotes) {
    const total = anecdotes.reduce((sum, a) => sum + (a.qualityScore || 0), 0);
    return anecdotes.length > 0 ? total / anecdotes.length : 0;
  }

  /**
   * Select the best creative model for question generation
   * Prioritizes speed over maximum capability since we have pre-sourced content
   */
  selectBestCreativeModel(modelHint = null) {
    const creativeModels = this.config.models.creative;
    
    // Handle model hints/aliases
    if (modelHint) {
      if (modelHint === 'fast') return creativeModels.fast || creativeModels.default;
      if (modelHint === 'opus') return creativeModels.opus;
      if (modelHint === 'gpt4') return creativeModels.gpt4;
      // If it's a full model ID, return it directly
      if (modelHint.includes('/')) return modelHint;
    }
    
    // Priority order for question generation: default (sonnet) > gpt4 > gpt4Turbo > opus
    // Sonnet 3.5 is fast and excellent for this structured task
    if (creativeModels.default) return creativeModels.default;
    if (creativeModels.gpt4) return creativeModels.gpt4;
    if (creativeModels.gpt4Turbo) return creativeModels.gpt4Turbo;
    
    // Only use opus if nothing else available (overkill for this task)
    return creativeModels.opus;
  }

  /**
   * Build question generation request
   */
  buildQuestionRequest({ anecdotes, category, filters, model }) {
    return {
      anecdotes: this.prepareAnecdotesForPrompt(anecdotes),
      category,
      filters,
      model,
      timestamp: Date.now()
    };
  }

  /**
   * Prepare anecdotes for prompt by optimizing content
   */
  prepareAnecdotesForPrompt(anecdotes) {
    return anecdotes.map(anecdote => ({
      ...anecdote,
      // Truncate very long stories to fit token limits
      story: anecdote.story.length > 500 
        ? anecdote.story.substring(0, 500) + '...'
        : anecdote.story,
      // Limit key facts to top 5
      key_facts: anecdote.key_facts.slice(0, 5)
    }));
  }

  /**
   * Process and validate generated questions
   */
  processQuestions(questions, sourceAnecdotes) {
    if (!Array.isArray(questions)) {
      throw new Error('Invalid questions format - expected array');
    }

    return questions
      .filter(question => this.validateQuestion(question))
      .map(question => this.enhanceQuestion(question, sourceAnecdotes));
  }

  /**
   * Validate individual question structure
   */
  validateQuestion(question) {
    const required = ['question', 'options', 'correctAnswer'];
    const missing = required.filter(field => question[field] === undefined);
    
    if (missing.length > 0) {
      console.warn(chalk.yellow(`⚠️ Question missing fields: ${missing.join(', ')}`));
      return false;
    }
    
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      console.warn(chalk.yellow(`⚠️ Question has invalid options array`));
      return false;
    }
    
    if (typeof question.correctAnswer !== 'number' || 
        question.correctAnswer < 0 || 
        question.correctAnswer >= 4) {
      console.warn(chalk.yellow(`⚠️ Question has invalid correctAnswer`));
      return false;
    }
    
    return true;
  }

  /**
   * Enhance question with metadata and quality metrics
   */
  enhanceQuestion(question, sourceAnecdotes) {
    return {
      ...question,
      id: `question_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      questionLength: question.question.length,
      answerComplexity: this.calculateAnswerComplexity(question.options),
      sourceAnecdoteId: this.findSourceAnecdoteId(question, sourceAnecdotes),
      qualityScore: this.calculateQuestionQuality(question),
      generatedAt: new Date().toISOString(),
      phase: 'question_generation',
      pipeline: 'v2_openrouter'
    };
  }

  /**
   * Calculate complexity score for answer options
   */
  calculateAnswerComplexity(options) {
    const avgLength = options.reduce((sum, opt) => sum + opt.length, 0) / options.length;
    const lengthVariance = options.reduce((sum, opt) => 
      sum + Math.pow(opt.length - avgLength, 2), 0) / options.length;
    
    // Higher variance = better complexity (options are more varied)
    return Math.min(lengthVariance / 100, 10);
  }

  /**
   * Find which anecdote was likely the source for this question
   */
  findSourceAnecdoteId(question, anecdotes) {
    // Simple matching based on shared keywords
    const questionWords = question.question.toLowerCase().split(/\s+/);
    const significantWords = questionWords.filter(word => word.length > 4);
    
    let bestMatch = null;
    let bestScore = 0;
    
    anecdotes.forEach(anecdote => {
      const anecdoteText = `${anecdote.title} ${anecdote.story}`.toLowerCase();
      const matches = significantWords.filter(word => anecdoteText.includes(word));
      const score = matches.length;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = anecdote.id;
      }
    });
    
    return bestMatch;
  }

  /**
   * Calculate quality score for question
   */
  calculateQuestionQuality(question) {
    let score = 0;
    
    // Question length (optimal 50-150 characters)
    const qLength = question.question.length;
    if (qLength >= 50 && qLength <= 150) score += 20;
    else if (qLength >= 30) score += 10;
    
    // Answer option quality
    score += Math.min(this.calculateAnswerComplexity(question.options) * 2, 20);
    
    // Explanation quality
    if (question.explanation && question.explanation.length > 20) score += 15;
    
    // Drama/engagement indicators
    const qLower = question.question.toLowerCase();
    const engagementWords = ['dramatic', 'stunning', 'historic', 'controversial', 'legendary'];
    score += engagementWords.filter(word => qLower.includes(word)).length * 5;
    
    // Question structure (starts with question word)
    const questionStarters = ['what', 'which', 'who', 'when', 'where', 'how', 'why'];
    if (questionStarters.some(starter => qLower.startsWith(starter))) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Generate questions in batches to handle large anecdote sets
   */
  async generateQuestionsInBatches(options, batchSize = 5) {
    const { anecdotes, ...otherOptions } = options;
    const allQuestions = [];
    
    for (let i = 0; i < anecdotes.length; i += batchSize) {
      const batch = anecdotes.slice(i, i + batchSize);
      console.log(chalk.gray(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(anecdotes.length/batchSize)}`));
      
      const batchQuestions = await this.generateQuestions({
        ...otherOptions,
        anecdotes: batch
      });
      
      allQuestions.push(...batchQuestions);
    }
    
    return allQuestions;
  }

  /**
   * Test connection to OpenRouter service
   */
  async testConnection() {
    try {
      const result = await this.openRouter.testConnection();
      if (result) {
        console.log(chalk.green('✅ QuestionGenerator: OpenRouter connection successful'));
      } else {
        console.log(chalk.red('❌ QuestionGenerator: OpenRouter connection failed'));
      }
      return result;
    } catch (error) {
      console.error(chalk.red('❌ QuestionGenerator connection test failed:'), error.message);
      return false;
    }
  }
}

// Export singleton getter
let questionGeneratorInstance = null;

export const getQuestionGenerator = () => {
  if (!questionGeneratorInstance) {
    questionGeneratorInstance = new QuestionGenerator();
  }
  return questionGeneratorInstance;
};

export default QuestionGenerator;