/**
 * OpenRouter Service for Multi-Model AI Integration
 * 
 * Provides access to various AI models through OpenRouter API including:
 * - Perplexity Sonar for web-aware search and anecdote generation
 * - Claude/GPT-4 for creative writing and question generation
 */

import chalk from 'chalk';

class OpenRouterService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
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
   * Generate cricket anecdotes using search-capable model
   * @param {Object} request - Request parameters
   * @param {Object} request.filters - Search filters (era, countries, etc.)
   * @param {string} request.category - Question category
   * @param {number} request.count - Number of anecdotes to generate
   * @returns {Promise<Array>} Array of anecdotes with sources
   */
  async generateAnecdotes(request) {
    try {
      const prompt = this.buildAnecdotePrompt(request);
      const model = request.model || this.defaultSearchModel;
      
      console.log(chalk.blue(`🔍 Using ${model} for anecdote generation...`));
      
      const response = await this.callOpenRouterAPI({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      });
      
      return this.parseAnecdoteResponse(response);
    } catch (error) {
      console.error('Error generating anecdotes:', error);
      throw new Error('Failed to generate anecdotes via OpenRouter');
    }
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
   * Build prompt for anecdote generation
   */
  buildAnecdotePrompt(request) {
    const { filters, category, count = 10 } = request;
    
    // Enhanced search terms with randomization
    const searchContext = this.generateEnhancedSearchContext(filters, category);
    
    return `You are a cricket historian with access to web search. Generate ${count} compelling cricket anecdotes based on the following criteria:

SEARCH CONTEXT:
${searchContext}

REQUIREMENTS:
1. Each anecdote should be a dramatic, engaging story (200-300 words)
2. Focus on specific incidents, matches, or moments
3. Include verifiable facts and specific details
4. Cite sources with actual URLs when possible
5. Ensure variety - no duplicate stories or similar themes

FORMAT:
Return a JSON array of anecdotes:
[
  {
    "title": "Brief, engaging title",
    "story": "Full dramatic narrative with specific details",
    "key_facts": ["Fact 1", "Fact 2", "Fact 3"],
    "sources": ["URL1", "URL2"],
    "tags": ["tag1", "tag2"]
  }
]

Generate ${count} unique cricket anecdotes now:`;
  }

  /**
   * Build prompt for question generation from anecdotes
   */
  buildQuestionPrompt(request) {
    const { anecdotes, category, filters } = request;
    
    const anecdoteText = anecdotes.map((a, i) => 
      `${i + 1}. ${a.title}\n${a.story}\nKey Facts: ${a.key_facts.join(', ')}\nSources: ${a.sources.join(', ')}`
    ).join('\n\n');
    
    return `You are a master trivia question creator. Transform these cricket anecdotes into engaging trivia questions.

ANECDOTES:
${anecdoteText}

REQUIREMENTS:
1. Generate 1-2 questions per anecdote (focus on the most dramatic/interesting aspects)
2. Questions should test knowledge of the specific incident
3. Include 4 plausible options
4. Maintain source attribution from the anecdote
5. Focus on factual elements that can be verified

STYLE GUIDELINES:
- Start with dramatic context
- Build tension in the question
- Test specific knowledge, not general understanding
- Make wrong answers plausible but clearly distinct

FORMAT:
Return a JSON array:
[
  {
    "question": "Dramatic question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation with story context",
    "source": "Original source URL",
    "anecdoteRef": "Title of source anecdote"
  }
]

Generate trivia questions now:`;
  }

  /**
   * Generate enhanced search context with randomization
   */
  generateEnhancedSearchContext(filters, category) {
    const timestamp = Date.now();
    const randomSeed = Math.random();
    
    // Base context from filters
    let context = `Category: ${category}\n`;
    
    if (filters.era && filters.era !== 'all_eras') {
      context += `Era: ${filters.era}\n`;
    }
    
    if (filters.countries && filters.countries.length > 0 && filters.countries[0] !== 'all_countries') {
      context += `Countries: ${filters.countries.join(', ')}\n`;
    }
    
    // Add randomization elements
    const randomElements = [
      'Focus on day/night matches',
      'Include rain-affected games',
      'Highlight debut performances',
      'Feature comeback victories',
      'Include controversial decisions',
      'Focus on record-breaking moments',
      'Highlight underdog victories',
      'Include emotional farewells',
      'Feature tactical masterclasses',
      'Include technology controversies'
    ];
    
    // Select 2-3 random elements
    const selectedElements = [];
    for (let i = 0; i < 3; i++) {
      const index = Math.floor((randomSeed * (i + 1) * timestamp) % randomElements.length);
      if (!selectedElements.includes(randomElements[index])) {
        selectedElements.push(randomElements[index]);
      }
    }
    
    context += `Special Focus: ${selectedElements.join(', ')}\n`;
    context += `Search Seed: ${timestamp}-${randomSeed.toString(36).substring(2, 7)}`;
    
    return context;
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
   * Parse anecdote response from API
   */
  parseAnecdoteResponse(response) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const anecdotes = JSON.parse(jsonMatch[0]);
      
      // Validate anecdote structure
      return anecdotes.filter(a => 
        a.title && a.story && a.key_facts && Array.isArray(a.sources)
      );
    } catch (error) {
      console.error('Error parsing anecdote response:', error);
      throw new Error('Failed to parse anecdote response');
    }
  }

  /**
   * Parse question response from API
   */
  parseQuestionResponse(response) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate question structure and add metadata
      return questions
        .filter(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 &&
          typeof q.correctAnswer === 'number'
        )
        .map(q => ({
          ...q,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          generatedAt: new Date(),
          model: 'openrouter'
        }));
    } catch (error) {
      console.error('Error parsing question response:', error);
      throw new Error('Failed to parse question response');
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