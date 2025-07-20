/**
 * OpenRouter Service for Multi-Model AI Integration
 * 
 * Provides access to various AI models through OpenRouter API including:
 * - Perplexity Sonar for web-aware search and anecdote generation
 * - Claude/GPT-4 for creative writing and question generation
 */

import chalk from 'chalk';
import { getEnhancedFilterSystem } from '../utils/enhanced-filters.js';

class OpenRouterService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.filterSystem = getEnhancedFilterSystem();
    
    // Model configurations
    this.models = {
      // Search-capable models for Phase 1 (anecdote generation)
      search: {
        // Perplexity models (native web search)
        perplexitySonar: 'perplexity/sonar',
        perplexitySonarPro: 'perplexity/sonar-pro',
        perplexityReasoning: 'perplexity/sonar-reasoning',
        perplexityReasoningPro: 'perplexity/sonar-reasoning-pro',
        // Other models with :online suffix
        gpt4Online: 'openai/gpt-4o:online',
        gpt4MiniOnline: 'openai/gpt-4o-mini:online',
        claudeOnline: 'anthropic/claude-3-sonnet:online'
      },
      // Creative models for Phase 2 (question generation)
      creative: {
        claude3Opus: 'anthropic/claude-3-opus',
        claude3Sonnet: 'anthropic/claude-3-sonnet',
        gpt4Turbo: 'openai/gpt-4-turbo',
        gpt4: 'openai/gpt-4'
      }
    };
    
    // Default model selections
    this.defaultSearchModel = this.models.search.perplexitySonar;
    this.defaultCreativeModel = this.models.creative.claude3Sonnet;
  }

  /**
   * Generate cricket anecdotes using search-capable model with parallel processing
   * @param {Object} request - Request parameters
   * @param {Object} request.filters - Search filters (era, countries, etc.)
   * @param {string} request.category - Question category
   * @param {number} request.count - Number of anecdotes to generate
   * @returns {Promise<Array>} Array of anecdotes with sources
   */
  async generateAnecdotes(request) {
    try {
      const { count = 10 } = request;
      const model = request.model || this.defaultSearchModel;
      
      console.log(chalk.blue(`🔍 Using ${model} for parallel anecdote generation...`));
      
      // For speed: generate anecdotes in parallel batches of 3-4
      const batchSize = Math.min(4, Math.max(2, Math.ceil(count / 3)));
      const batches = Math.ceil(count / batchSize);
      
      console.log(chalk.gray(`   Generating ${count} anecdotes in ${batches} parallel batches of ${batchSize}`));
      
      const batchPromises = [];
      for (let i = 0; i < batches; i++) {
        const batchCount = Math.min(batchSize, count - (i * batchSize));
        const batchRequest = { ...request, count: batchCount };
        batchPromises.push(this.generateAnecdoteBatch(batchRequest, model));
      }
      
      const batchResults = await Promise.all(batchPromises);
      const allAnecdotes = batchResults.flat();
      
      console.log(chalk.green(`✅ Generated ${allAnecdotes.length} anecdotes via parallel processing`));
      return allAnecdotes;
    } catch (error) {
      console.error('Error generating anecdotes:', error);
      throw new Error('Failed to generate anecdotes via OpenRouter');
    }
  }

  /**
   * Generate a single batch of anecdotes
   */
  async generateAnecdoteBatch(request, model) {
    const prompt = this.buildOptimizedAnecdotePrompt(request);
    
    const response = await this.callOpenRouterAPI({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000  // Reduced for faster response
    });
    
    return this.parseAnecdoteResponse(response);
  }

  /**
   * Generate trivia questions from anecdotes using creative model
   * @param {Object} request - Request parameters
   * @param {Array} request.anecdotes - Array of anecdotes
   * @param {string} request.category - Question category
   * @param {Object} request.filters - Original filters for context
   * @returns {Promise<Array>} Array of trivia questions
   */
  async generateQuestionsFromAnecdotes(request) {
    try {
      const prompt = this.buildQuestionPrompt(request);
      const model = request.model || this.defaultCreativeModel;
      
      console.log(chalk.blue(`✍️ Using ${model} for question generation...`));
      
      const response = await this.callOpenRouterAPI({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000
      });
      
      return this.parseQuestionResponse(response);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions via OpenRouter');
    }
  }

  /**
   * Build optimized prompt for faster anecdote generation
   */
  buildOptimizedAnecdotePrompt(request) {
    const { filters, category, count = 10 } = request;
    
    // Generate focused search context
    const searchContext = this.generateEnhancedSearchContext(filters, category);
    
    return `Generate ${count} cricket anecdotes with web search. Context: ${searchContext}

Each anecdote needs:
- Engaging title
- 150-250 word dramatic story with specific details
- 3-5 key facts for trivia questions
- Source citations
- Unique incident (no duplicates)

JSON format:
[{"title":"Title","story":"Story with drama and facts","key_facts":["Fact1","Fact2","Fact3"],"sources":["URL1"],"tags":["drama","historic"]}]

Generate ${count} diverse cricket anecdotes:`;
  }

  /**
   * Build prompt for anecdote generation (legacy method for compatibility)
   */
  buildAnecdotePrompt(request) {
    return this.buildOptimizedAnecdotePrompt(request);
  }

  /**
   * Build optimized prompt for faster question generation
   */
  buildQuestionPrompt(request) {
    const { anecdotes, category, filters } = request;
    
    // Streamlined anecdote presentation with essential info only
    const anecdoteText = anecdotes.map((a, i) => 
      `${i + 1}. ${a.title}\n${a.story}\nFacts: ${a.key_facts.slice(0, 3).join(', ')}`
    ).join('\n\n');
    
    return `Create cricket trivia from these anecdotes. Generate 1-2 questions per anecdote focusing on dramatic moments and verifiable facts.

ANECDOTES:
${anecdoteText}

JSON format:
[{"question":"Dramatic context + specific question?","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Brief context","source":"URL","anecdoteRef":"Title"}]

Requirements: 4 plausible options, test specific knowledge, maintain source attribution. Generate engaging trivia now:`;
  }

  /**
   * Generate enhanced search context using advanced filter system
   */
  generateEnhancedSearchContext(filters, category) {
    console.log(chalk.gray('🎯 Generating advanced search context...'));
    
    // Use the enhanced filter system if filters are already enhanced
    if (filters.searchSeed) {
      return this.filterSystem.filtersToSearchContext(filters);
    }
    
    // Otherwise enhance them first
    const enhancedFilters = this.filterSystem.generateEnhancedFilters(filters, category);
    return this.filterSystem.filtersToSearchContext(enhancedFilters);
  }

  /**
   * Make API call to OpenRouter
   */
  async callOpenRouterAPI(params) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/cricket-trivia',
        'X-Title': 'Cricket Trivia Generator'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }
    
    return response.json();
  }

  /**
   * Parse anecdote response from API with robust JSON extraction
   */
  parseAnecdoteResponse(response) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }
      
      console.log(chalk.gray('🔍 Debug - Raw anecdote response:'));
      console.log(chalk.gray(content.substring(0, 300) + '...'));
      
      // Try multiple JSON extraction strategies (same as questions)
      let anecdotes = null;
      
      // Strategy 1: Look for JSON array with brackets
      let jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          anecdotes = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log(chalk.yellow('⚠️ Anecdote Strategy 1 failed, trying strategy 2...'));
        }
      }
      
      // Strategy 2: Look for JSON code block
      if (!anecdotes) {
        const codeBlockMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          try {
            anecdotes = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.log(chalk.yellow('⚠️ Anecdote Strategy 2 failed, trying strategy 3...'));
          }
        }
      }
      
      // Strategy 3: Clean and extract JSON more aggressively
      if (!anecdotes) {
        const startIndex = content.indexOf('[');
        const endIndex = content.lastIndexOf(']');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const jsonStr = content.substring(startIndex, endIndex + 1);
          try {
            anecdotes = JSON.parse(jsonStr);
          } catch (e) {
            console.error(chalk.red('❌ All anecdote parsing strategies failed'));
            throw new Error(`No valid JSON found in anecdote response. Content preview: ${content.substring(0, 200)}...`);
          }
        }
      }
      
      if (!Array.isArray(anecdotes)) {
        throw new Error('Parsed anecdote content is not an array');
      }
      
      console.log(chalk.green(`✅ Successfully parsed ${anecdotes.length} anecdotes from response`));
      
      // Validate anecdote structure
      const validAnecdotes = anecdotes.filter(a => {
        const isValid = a.title && a.story && a.key_facts;
        if (!isValid) {
          console.log(chalk.yellow(`⚠️ Filtering out invalid anecdote: ${JSON.stringify(a).substring(0, 100)}...`));
        }
        return isValid;
      });
      
      console.log(chalk.green(`✅ Returning ${validAnecdotes.length} valid anecdotes`));
      return validAnecdotes;
      
    } catch (error) {
      console.error(chalk.red('Error parsing anecdote response:'), error.message);
      throw new Error(`Failed to parse anecdote response: ${error.message}`);
    }
  }

  /**
   * Parse question response from API with robust JSON extraction
   */
  parseQuestionResponse(response) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }
      
      console.log(chalk.gray('🔍 Debug - Raw response content:'));
      console.log(chalk.gray(content.substring(0, 500) + '...'));
      
      // Try multiple JSON extraction strategies
      let questions = null;
      
      // Strategy 1: Look for JSON array with brackets
      let jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          questions = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log(chalk.yellow('⚠️ Strategy 1 failed, trying strategy 2...'));
        }
      }
      
      // Strategy 2: Look for JSON code block
      if (!questions) {
        const codeBlockMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          try {
            questions = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.log(chalk.yellow('⚠️ Strategy 2 failed, trying strategy 3...'));
          }
        }
      }
      
      // Strategy 3: Clean and extract JSON more aggressively
      if (!questions) {
        // Remove everything before first [ and after last ]
        const startIndex = content.indexOf('[');
        const endIndex = content.lastIndexOf(']');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const jsonStr = content.substring(startIndex, endIndex + 1);
          try {
            questions = JSON.parse(jsonStr);
          } catch (e) {
            console.log(chalk.yellow('⚠️ Strategy 3 failed, trying strategy 4...'));
          }
        }
      }
      
      // Strategy 4: Line-by-line parsing for malformed JSON
      if (!questions) {
        const lines = content.split('\n');
        const jsonLines = [];
        let inJson = false;
        
        for (const line of lines) {
          if (line.trim().startsWith('[')) inJson = true;
          if (inJson) jsonLines.push(line);
          if (line.trim().endsWith(']')) break;
        }
        
        try {
          questions = JSON.parse(jsonLines.join('\n'));
        } catch (e) {
          console.error(chalk.red('❌ All JSON parsing strategies failed'));
          throw new Error(`No valid JSON found in response. Content preview: ${content.substring(0, 200)}...`);
        }
      }
      
      if (!Array.isArray(questions)) {
        throw new Error('Parsed content is not an array');
      }
      
      console.log(chalk.green(`✅ Successfully parsed ${questions.length} questions from response`));
      
      // Validate question structure and add metadata
      const validQuestions = questions
        .filter(q => {
          const isValid = q.question && 
            Array.isArray(q.options) && 
            q.options.length === 4 &&
            typeof q.correctAnswer === 'number';
          
          if (!isValid) {
            console.log(chalk.yellow(`⚠️ Filtering out invalid question: ${JSON.stringify(q).substring(0, 100)}...`));
          }
          
          return isValid;
        })
        .map(q => ({
          ...q,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          generatedAt: new Date(),
          model: 'openrouter'
        }));
      
      console.log(chalk.green(`✅ Returning ${validQuestions.length} valid questions`));
      return validQuestions;
      
    } catch (error) {
      console.error(chalk.red('Error parsing question response:'), error.message);
      throw new Error(`Failed to parse question response: ${error.message}`);
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return {
      search: Object.keys(this.models.search),
      creative: Object.keys(this.models.creative)
    };
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      const response = await this.callOpenRouterAPI({
        model: this.defaultSearchModel,
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10
      });
      return response.choices?.length > 0;
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance management
let openRouterServiceInstance = null;

/**
 * Get or create OpenRouterService instance
 */
export const getOpenRouterService = () => {
  if (!openRouterServiceInstance) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    openRouterServiceInstance = new OpenRouterService(apiKey);
  }
  return openRouterServiceInstance;
};

export default OpenRouterService;