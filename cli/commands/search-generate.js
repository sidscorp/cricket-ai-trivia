/**
 * Search-Generate V2 Command
 *
 * Advanced two-phase pipeline: Perplexity web search → anecdote generation → question creation
 * Features enhanced filtering, quality scoring, and intelligent batch processing.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../utils/config.js';
import { getAnecdoteGenerator } from '../services/AnecdoteGenerator.js';
import { getQuestionGenerator } from '../services/QuestionGenerator.js';
import { getEnhancedFilterSystem } from '../utils/enhanced-filters.js';

/**
 * V2 Pipeline Orchestrator
 */
class V2PipelineOrchestrator {
  constructor() {
    this.anecdoteGen = getAnecdoteGenerator();
    this.questionGen = getQuestionGenerator();
    this.filterSystem = getEnhancedFilterSystem();
    this.config = config.openRouter;
  }

  /**
   * Execute the full V2 pipeline
   */
  async executePipeline(options) {
    const startTime = Date.now();
    
    try {
      console.log(chalk.blue('🚀 Starting V2 Two-Phase Pipeline...\n'));
      
      // Validate prerequisites
      await this.validatePrerequisites();
      
      // Phase 1: Generate anecdotes
      console.log(chalk.yellow('=== Phase 1: Anecdote Generation ==='));
      const anecdotes = await this.executePhase1(options);
      
      if (!anecdotes.length) {
        throw new Error('No anecdotes generated in Phase 1');
      }
      
      // Phase 2: Generate questions
      console.log(chalk.yellow('\n=== Phase 2: Question Generation ==='));
      const questions = await this.executePhase2(anecdotes, options);
      
      if (!questions.length) {
        throw new Error('No questions generated in Phase 2');
      }
      
      // Results summary
      const totalTime = Date.now() - startTime;
      this.displayResults(anecdotes, questions, totalTime, options);
      
      return { anecdotes, questions, metrics: this.calculateMetrics(anecdotes, questions, totalTime) };
      
    } catch (error) {
      console.error(chalk.red('\n❌ V2 Pipeline failed:'), error.message);
      throw error;
    }
  }

  /**
   * Validate prerequisites for V2 pipeline
   */
  async validatePrerequisites() {
    if (!config.hasOpenRouter) {
      throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env');
    }
    
    console.log(chalk.gray('✓ OpenRouter configuration validated'));
    
    // Test connections
    const anecdoteConnection = await this.anecdoteGen.testConnection();
    const questionConnection = await this.questionGen.testConnection();
    
    if (!anecdoteConnection || !questionConnection) {
      throw new Error('Failed to connect to OpenRouter services');
    }
    
    console.log(chalk.gray('✓ OpenRouter connections verified\n'));
  }

  /**
   * Execute Phase 1: Anecdote Generation
   */
  async executePhase1(options) {
    const {
      era = 'all_eras',
      countries = ['all_countries'],
      category = 'legendary_moments',
      anecdoteCount = 10,
      searchModel = null
    } = options;
    
    const filters = {
      era: era === 'all_eras' ? 'all_eras' : era,
      countries: countries.includes('all_countries') ? ['all_countries'] : countries
    };
    
    console.log(chalk.blue(`🎪 Generating ${anecdoteCount} anecdotes...`));
    console.log(chalk.gray(`   Era: ${era}`));
    console.log(chalk.gray(`   Countries: ${countries.join(', ')}`));
    console.log(chalk.gray(`   Category: ${category}`));
    
    const anecdotes = await this.anecdoteGen.generateAnecdotes({
      filters,
      category,
      count: anecdoteCount,
      model: searchModel
    });
    
    // Display anecdote summary
    const avgQuality = anecdotes.reduce((sum, a) => sum + (a.qualityScore || 0), 0) / anecdotes.length;
    console.log(chalk.green(`✅ Generated ${anecdotes.length} anecdotes (avg quality: ${avgQuality.toFixed(1)})`));
    
    if (options.showAnecdotes) {
      this.displayAnecdotes(anecdotes);
    }
    
    return anecdotes;
  }

  /**
   * Execute Phase 2: Question Generation
   */
  async executePhase2(anecdotes, options) {
    const {
      category = 'legendary_moments',
      targetQuestions = null,
      creativeModel = null,
      batchSize = null
    } = options;
    
    const calculatedTarget = targetQuestions || Math.ceil(anecdotes.length * this.config.v2Pipeline.questionsPerAnecdote.target);
    
    console.log(chalk.blue(`✍️ Generating ${calculatedTarget} questions from ${anecdotes.length} anecdotes...`));
    console.log(chalk.gray(`   Target questions: ${calculatedTarget}`));
    console.log(chalk.gray(`   Creative model: ${creativeModel || 'default (Claude Sonnet)'}`));
    
    let questions;
    
    if (batchSize && anecdotes.length > batchSize) {
      // Use batch processing for large anecdote sets
      console.log(chalk.gray(`   Using batch processing (batch size: ${batchSize})`));
      questions = await this.questionGen.generateQuestionsInBatches({
        anecdotes,
        category,
        targetQuestions: calculatedTarget,
        model: creativeModel
      }, batchSize);
    } else {
      // Standard processing
      questions = await this.questionGen.generateQuestions({
        anecdotes,
        category,
        targetQuestions: calculatedTarget,
        model: creativeModel
      });
    }
    
    // Sort by quality score
    questions.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    
    const avgQuality = questions.reduce((sum, q) => sum + (q.qualityScore || 0), 0) / questions.length;
    console.log(chalk.green(`✅ Generated ${questions.length} questions (avg quality: ${avgQuality.toFixed(1)})`));
    
    return questions;
  }

  /**
   * Display anecdotes summary
   */
  displayAnecdotes(anecdotes) {
    console.log(chalk.cyan('\n📚 Generated Anecdotes:'));
    anecdotes.forEach((anecdote, i) => {
      console.log(chalk.white(`\n${i + 1}. ${anecdote.title}`));
      console.log(chalk.gray(`   Quality: ${anecdote.qualityScore || 0} | Words: ${anecdote.wordCount || 0} | Sources: ${anecdote.sourceCount || 0}`));
      if (anecdote.dramaTags?.length) {
        console.log(chalk.gray(`   Drama Tags: ${anecdote.dramaTags.join(', ')}`));
      }
      console.log(chalk.gray(`   Story: ${anecdote.story.substring(0, 150)}...`));
    });
  }

  /**
   * Display final results
   */
  displayResults(anecdotes, questions, totalTime, options) {
    console.log(chalk.green('\n🎉 V2 Pipeline Complete!'));
    console.log(chalk.blue('\n📊 Pipeline Summary:'));
    console.log(chalk.white(`   Total time: ${(totalTime / 1000).toFixed(2)}s`));
    console.log(chalk.white(`   Anecdotes generated: ${anecdotes.length}`));
    console.log(chalk.white(`   Questions generated: ${questions.length}`));
    console.log(chalk.white(`   Questions per anecdote: ${(questions.length / anecdotes.length).toFixed(2)}`));
    
    const avgAnecdoteQuality = anecdotes.reduce((sum, a) => sum + (a.qualityScore || 0), 0) / anecdotes.length;
    const avgQuestionQuality = questions.reduce((sum, q) => sum + (q.qualityScore || 0), 0) / questions.length;
    
    console.log(chalk.white(`   Avg anecdote quality: ${avgAnecdoteQuality.toFixed(1)}`));
    console.log(chalk.white(`   Avg question quality: ${avgQuestionQuality.toFixed(1)}`));
    
    if (options.json) {
      console.log(chalk.blue('\n📋 JSON Output:'));
      console.log(JSON.stringify(questions, null, 2));
    } else {
      this.displayQuestions(questions);
    }
  }

  /**
   * Display questions in formatted output
   */
  displayQuestions(questions) {
    console.log(chalk.cyan('\n❓ Generated Questions:'));
    
    questions.forEach((q, idx) => {
      console.log(chalk.bold(`\n${idx + 1}. ${q.question}`));
      q.options.forEach((opt, j) => {
        const prefix = String.fromCharCode(65 + j);
        const style = j === q.correctAnswer ? chalk.green : chalk.gray;
        console.log(style(`  ${prefix}. ${opt}`));
      });
      console.log(chalk.yellow(`  ✓ Answer: ${String.fromCharCode(65 + q.correctAnswer)}`));
      if (q.explanation) {
        console.log(chalk.cyan(`  💡 ${q.explanation}`));
      }
      if (q.source) {
        console.log(chalk.gray(`  🔗 Source: ${q.source}`));
      }
      if (q.qualityScore !== undefined) {
        console.log(chalk.gray(`  📈 Quality: ${q.qualityScore.toFixed(1)}`));
      }
    });
  }

  /**
   * Calculate pipeline metrics
   */
  calculateMetrics(anecdotes, questions, totalTime) {
    return {
      totalTime,
      anecdoteCount: anecdotes.length,
      questionCount: questions.length,
      questionsPerAnecdote: questions.length / anecdotes.length,
      avgAnecdoteQuality: anecdotes.reduce((sum, a) => sum + (a.qualityScore || 0), 0) / anecdotes.length,
      avgQuestionQuality: questions.reduce((sum, q) => sum + (q.qualityScore || 0), 0) / questions.length,
      timePerAnecdote: totalTime / anecdotes.length,
      timePerQuestion: totalTime / questions.length,
      pipeline: 'v2_openrouter'
    };
  }
}

// Create and export the command
export const searchGenerateV2Command = new Command('search-generate')
  .description('V2 two-phase pipeline: web search → anecdotes → questions (OpenRouter)')
  .option('-e, --era <era>', 'Cricket era filter', 'all_eras')
  .option('-c, --countries <csv>', 'Comma-separated country filters', 'all_countries')  
  .option('-g, --category <category>', 'Question category', 'legendary_moments')
  .option('-a, --anecdotes <num>', 'Number of anecdotes to generate', '10')
  .option('-q, --questions <num>', 'Target number of questions (optional)')
  .option('--search-model <model>', 'Search model override (perplexitySonar, perplexitySonarPro, etc.)')
  .option('--creative-model <model>', 'Creative model override (claude3Sonnet, claude3Opus, gpt4, etc.)')
  .option('--batch-size <num>', 'Batch size for question generation (default: auto)')
  .option('--show-anecdotes', 'Display generated anecdotes in output')
  .option('--json', 'Output questions in JSON format')
  .option('--debug', 'Enable debug output')
  .action(async (options) => {
    try {
      // Parse options
      const era = options.era;
      const countries = options.countries.split(',').map(s => s.trim());
      const category = options.category;
      const anecdoteCount = Math.max(parseInt(options.anecdotes, 10) || 10, 1);
      const targetQuestions = options.questions ? Math.max(parseInt(options.questions, 10), 1) : null;
      const batchSize = options.batchSize ? Math.max(parseInt(options.batchSize, 10), 1) : null;
      
      // Validate era
      const validEras = ['all_eras', 'golden_age', 'post_war_boom', 'world_cup_era', 'modern_era', 'contemporary', 'post_covid'];
      if (!validEras.includes(era)) {
        console.error(chalk.red(`❌ Invalid era: ${era}`));
        console.error(chalk.yellow(`💡 Valid eras: ${validEras.join(', ')}`));
        process.exit(1);
      }
      
      // Validate category
      const validCategories = ['legendary_moments', 'player_stories', 'records_stats', 'rules_formats', 'cultural_impact'];
      if (!validCategories.includes(category)) {
        console.error(chalk.red(`❌ Invalid category: ${category}`));
        console.error(chalk.yellow(`💡 Valid categories: ${validCategories.join(', ')}`));
        process.exit(1);
      }
      
      if (options.debug) {
        console.log(chalk.gray('🐛 Debug mode enabled'));
        console.log(chalk.gray(`Parameters: era=${era}, countries=${countries.join(',')}, category=${category}, anecdotes=${anecdoteCount}`));
      }
      
      // Execute pipeline
      const orchestrator = new V2PipelineOrchestrator();
      await orchestrator.executePipeline({
        era,
        countries, 
        category,
        anecdoteCount,
        targetQuestions,
        searchModel: options.searchModel,
        creativeModel: options.creativeModel,
        batchSize,
        showAnecdotes: options.showAnecdotes,
        json: options.json,
        debug: options.debug
      });
      
    } catch (err) {
      console.error(chalk.red('\n❌ V2 Pipeline failed:'), err.message);
      if (options.debug) {
        console.error(chalk.gray('Stack trace:'), err.stack);
      }
      process.exit(1);
    }
  });

// Export for testing
export { V2PipelineOrchestrator };