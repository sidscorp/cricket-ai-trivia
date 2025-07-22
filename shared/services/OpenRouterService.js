/**
 * Unified OpenRouter Service for Multi-Model AI Integration
 * 
 * Single implementation for both CLI and UI environments
 * Provides access to various AI models through OpenRouter API including:
 * - Perplexity Sonar for web-aware search and anecdote generation
 * - Claude/GPT-4 for creative writing and question generation
 */

import { isCliEnvironment } from '../config/constants.js';

// Dynamic import for CLI-specific dependencies
let chalk;
let enhancedFilterSystem;

if (isCliEnvironment()) {
  // Lazy load CLI-specific dependencies
  const loadCliDependencies = async () => {
    chalk = (await import('chalk')).default;
    const { getEnhancedFilterSystem } = await import('../../cli/utils/enhanced-filters.js');
    enhancedFilterSystem = getEnhancedFilterSystem();
  };
  loadCliDependencies();
}

class OpenRouterService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.filterSystem = enhancedFilterSystem;
    
    // Model configurations
    this.models = {
      // Search-capable models for Phase 1
      search: {
        perplexitySonar: 'perplexity/sonar',
        perplexitySonarPro: 'perplexity/sonar-pro',
        perplexityReasoning: 'perplexity/sonar-reasoning',
        perplexityReasoningPro: 'perplexity/sonar-reasoning-pro',
        gpt4Online: 'openai/gpt-4o:online',
        gpt4MiniOnline: 'openai/gpt-4o-mini:online',
        claudeOnline: 'anthropic/claude-3-sonnet:online'
      },
      // Creative models for Phase 2
      creative: {
        claude3Opus: 'anthropic/claude-3-opus',
        claude3Sonnet: 'anthropic/claude-3-sonnet',
        gpt4Turbo: 'openai/gpt-4-turbo',
        gpt4: 'openai/gpt-4'
      },
      // Fast models for Learn Cricket
      fast: {
        gpt35Turbo: 'openai/gpt-3.5-turbo',
        gpt4Mini: 'openai/gpt-4o-mini',
        claudeHaiku: 'anthropic/claude-3-haiku'
      }
    };
    
    // Default model selections
    this.defaultSearchModel = this.models.search.perplexitySonar;
    this.defaultCreativeModel = this.models.creative.claude3Sonnet;
    this.defaultFastModel = this.models.fast.gpt35Turbo;
  }

  /**
   * Generic method to call OpenRouter API (for UI compatibility)
   */
  async callOpenRouterAPI(params) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': isCliEnvironment() ? 'https://github.com/cricket-trivia' : 'https://cricket-trivia-app.com',
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
   * Generate cricket trivia questions directly (similar to Gemini service)
   */
  async generateQuestions(request) {
    try {
      const { category, difficulty, count = 5, filters, model } = request;
      
      // Build prompt for direct question generation
      const prompt = this.buildDirectQuestionPrompt(request);
      const selectedModel = model || this.defaultCreativeModel;
      
      this.log('blue', `🎯 Using ${selectedModel} for direct question generation...`);
      
      const response = await this.callOpenRouterAPI({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      });
      
      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        this.log('red', 'Invalid response structure:', JSON.stringify(response));
        throw new Error('Invalid response structure from OpenRouter');
      }
      
      const content = response.choices[0].message.content;
      this.log('blue', 'Response content:', content.substring(0, 200) + '...');
      const questions = this.parseQuestionResponse(content);
      
      // Filter to requested count
      return questions.slice(0, count);
      
    } catch (error) {
      this.log('red', 'Error generating questions:', error.message);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Build prompt for direct question generation
   */
  buildDirectQuestionPrompt(request) {
    const { category, difficulty, count = 5, filters } = request;
    
    let prompt = `Generate ${count} high-quality cricket trivia questions.\n\n`;
    
    if (category && category !== 'tutorial') {
      prompt += `Category: ${category.replace(/_/g, ' ')}\n`;
    }
    
    if (difficulty) {
      prompt += `Difficulty: ${difficulty}\n`;
    }
    
    if (filters) {
      if (filters.era && filters.era !== 'all_eras') {
        prompt += `Era: ${filters.era.replace(/_/g, ' ')}\n`;
      }
      if (filters.countries && filters.countries.length > 0 && !filters.countries.includes('all_countries')) {
        prompt += `Countries: ${filters.countries.join(', ')}\n`;
      }
    }
    
    prompt += `
Instructions:
1. Generate engaging cricket trivia questions that are factually accurate
2. Each question should have 4 options with only 1 correct answer
3. Include interesting explanations that provide context
4. ${category === 'tutorial' ? 'Focus on basic cricket concepts suitable for beginners' : 'Include fascinating cricket stories and facts'}

Return a JSON array with this structure:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation with interesting context",
    "category": "${category || 'general'}",
    "difficulty": "${difficulty || 'medium'}"
  }
]`;
    
    return prompt;
  }

  /**
   * Generate cricket anecdotes using search-capable model
   */
  async generateAnecdotes(request) {
    try {
      const { count = 10 } = request;
      const model = request.model || this.defaultSearchModel;
      
      this.log('blue', `🔍 Using ${model} for parallel anecdote generation...`);
      
      // Generate anecdotes in parallel batches
      const batchSize = Math.min(4, Math.max(2, Math.ceil(count / 3)));
      const batches = Math.ceil(count / batchSize);
      
      this.log('gray', `   Generating ${count} anecdotes in ${batches} parallel batches of ${batchSize}`);
      
      const batchPromises = [];
      for (let i = 0; i < batches; i++) {
        const batchCount = Math.min(batchSize, count - (i * batchSize));
        const batchRequest = { ...request, count: batchCount };
        batchPromises.push(this.generateAnecdoteBatch(batchRequest, model));
      }
      
      const batchResults = await Promise.all(batchPromises);
      const allAnecdotes = batchResults.flat();
      
      this.log('green', `✅ Generated ${allAnecdotes.length} anecdotes via parallel processing`);
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
      max_tokens: 2000
    });
    
    return this.parseAnecdoteResponse(response);
  }

  /**
   * Generate trivia questions from anecdotes
   */
  async generateQuestionsFromAnecdotes(request) {
    try {
      const prompt = this.buildQuestionPrompt(request);
      const model = request.model || this.defaultCreativeModel;
      
      this.log('blue', `✍️ Using ${model} for question generation...`);
      
      const response = await this.callOpenRouterAPI({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }
      return this.parseQuestionResponse(content);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions via OpenRouter');
    }
  }

  /**
   * Build optimized prompt for anecdote generation
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
   * Build prompt for question generation
   */
  buildQuestionPrompt(request) {
    const { anecdotes, category, filters } = request;
    
    // Streamlined anecdote presentation
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
   * Generate enhanced search context
   */
  generateEnhancedSearchContext(filters, category) {
    this.log('gray', '🎯 Generating advanced search context...');
    
    // Use enhanced filter system if available (CLI)
    if (this.filterSystem) {
      if (filters.searchSeed) {
        return this.filterSystem.filtersToSearchContext(filters);
      }
      const enhancedFilters = this.filterSystem.generateEnhancedFilters(filters, category);
      return this.filterSystem.filtersToSearchContext(enhancedFilters);
    }
    
    // Fallback for UI or when filter system not available
    return this.generateBasicSearchContext(filters, category);
  }

  /**
   * Generate basic search context (fallback)
   */
  generateBasicSearchContext(filters, category) {
    const parts = [];
    
    if (category) {
      parts.push(`Category: ${category}`);
    }
    
    if (filters.era && filters.era !== 'all_eras') {
      parts.push(`Era: ${filters.era}`);
    }
    
    if (filters.countries && filters.countries.length > 0 && !filters.countries.includes('all_countries')) {
      parts.push(`Countries: ${filters.countries.join(', ')}`);
    }
    
    return parts.join(', ') || 'General cricket trivia';
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
      
      this.log('gray', '🔍 Debug - Raw anecdote response:');
      this.log('gray', content.substring(0, 300) + '...');
      
      // Try multiple JSON extraction strategies
      let anecdotes = this.extractJSONFromContent(content);
      
      if (!Array.isArray(anecdotes)) {
        throw new Error('Parsed anecdote content is not an array');
      }
      
      this.log('green', `✅ Successfully parsed ${anecdotes.length} anecdotes from response`);
      
      // Validate anecdote structure
      const validAnecdotes = anecdotes.filter(a => {
        const isValid = a.title && a.story && a.key_facts;
        if (!isValid) {
          this.log('yellow', `⚠️ Filtering out invalid anecdote: ${JSON.stringify(a).substring(0, 100)}...`);
        }
        return isValid;
      });
      
      this.log('green', `✅ Returning ${validAnecdotes.length} valid anecdotes`);
      return validAnecdotes;
      
    } catch (error) {
      this.log('red', 'Error parsing anecdote response:', error.message);
      throw new Error(`Failed to parse anecdote response: ${error.message}`);
    }
  }

  /**
   * Parse question response from API
   */
  parseQuestionResponse(content) {
    try {
      // Content is already extracted and passed directly
      if (!content) {
        throw new Error('No content in API response');
      }
      
      this.log('gray', '🔍 Debug - Raw response content:');
      this.log('gray', content.substring(0, 500) + '...');
      
      // Extract JSON from content
      let questions = this.extractJSONFromContent(content);
      
      if (!Array.isArray(questions)) {
        throw new Error('Parsed content is not an array');
      }
      
      this.log('green', `✅ Successfully parsed ${questions.length} questions from response`);
      
      // Validate question structure and add metadata
      const validQuestions = questions
        .filter(q => {
          const isValid = q.question && 
            Array.isArray(q.options) && 
            q.options.length === 4 &&
            typeof q.correctAnswer === 'number';
          
          if (!isValid) {
            this.log('yellow', `⚠️ Filtering out invalid question: ${JSON.stringify(q).substring(0, 100)}...`);
          }
          
          return isValid;
        })
        .map(q => ({
          ...q,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          generatedAt: new Date(),
          model: 'openrouter'
        }));
      
      this.log('green', `✅ Returning ${validQuestions.length} valid questions`);
      return validQuestions;
      
    } catch (error) {
      this.log('red', 'Error parsing question response:', error.message);
      throw new Error(`Failed to parse question response: ${error.message}`);
    }
  }

  /**
   * Extract JSON from content with multiple strategies
   */
  extractJSONFromContent(content) {
    let result = null;
    
    // Strategy 1: Look for JSON array with brackets (handle content before JSON)
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        // Clean the JSON string before parsing
        let jsonStr = jsonMatch[0];
        // Remove any trailing content after the last ]
        const lastBracketIndex = jsonStr.lastIndexOf(']');
        if (lastBracketIndex !== -1) {
          jsonStr = jsonStr.substring(0, lastBracketIndex + 1);
        }
        result = JSON.parse(jsonStr);
        if (result) return result;
      } catch (e) {
        this.log('yellow', '⚠️ Strategy 1 failed, trying strategy 2...');
      }
    }
    
    // Strategy 2: Look for JSON code block
    const codeBlockMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
    if (codeBlockMatch) {
      try {
        result = JSON.parse(codeBlockMatch[1]);
        if (result) return result;
      } catch (e) {
        this.log('yellow', '⚠️ Strategy 2 failed, trying strategy 3...');
      }
    }
    
    // Strategy 3: Clean and extract JSON more aggressively
    const startIndex = content.indexOf('[');
    const endIndex = content.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonStr = content.substring(startIndex, endIndex + 1);
      try {
        result = JSON.parse(jsonStr);
        if (result) return result;
      } catch (e) {
        this.log('yellow', '⚠️ Strategy 3 failed, trying strategy 4...');
      }
    }
    
    // Strategy 4: Try to parse numbered list format
    const numberedListMatch = content.match(/\d+\.\s+[^?]+\?[\s\S]+?(?=\d+\.|$)/g);
    if (numberedListMatch && numberedListMatch.length > 0) {
      try {
        const questions = [];
        for (const match of numberedListMatch) {
          // Extract question parts from numbered format
          const questionMatch = match.match(/\d+\.\s+([^?]+\?)/);
          const optionsMatch = match.match(/[A-D]\.\s+([^\n]+)/g);
          const answerMatch = match.match(/Correct Answer:\s*([A-D])/i);
          const explanationMatch = match.match(/Explanation:\s*([^]+?)(?=Source:|$)/i);
          
          if (questionMatch && optionsMatch && optionsMatch.length === 4) {
            questions.push({
              question: questionMatch[1].trim(),
              options: optionsMatch.map(opt => opt.replace(/^[A-D]\.\s*/, '').trim()),
              correctAnswer: answerMatch ? answerMatch[1].charCodeAt(0) - 65 : 0,
              explanation: explanationMatch ? explanationMatch[1].trim() : '',
              category: 'general',
              difficulty: 'medium'
            });
          }
        }
        if (questions.length > 0) {
          this.log('yellow', `📝 Parsed ${questions.length} questions from numbered format`);
          return questions;
        }
      } catch (e) {
        this.log('yellow', '⚠️ Strategy 4 failed');
      }
    }
    
    this.log('red', '❌ All JSON parsing strategies failed');
    throw new Error(`No valid JSON found. Content preview: ${content.substring(0, 200)}...`);
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return {
      search: Object.keys(this.models.search),
      creative: Object.keys(this.models.creative),
      fast: Object.keys(this.models.fast)
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

  /**
   * Utility logging function that works in both environments
   */
  log(color, ...args) {
    if (chalk && chalk[color]) {
      console.log(chalk[color](...args));
    } else {
      console.log(...args);
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
    // Support both CLI and UI environments
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY or EXPO_PUBLIC_OPENROUTER_API_KEY environment variable is required');
    }
    openRouterServiceInstance = new OpenRouterService(apiKey);
  }
  return openRouterServiceInstance;
};

export default OpenRouterService;