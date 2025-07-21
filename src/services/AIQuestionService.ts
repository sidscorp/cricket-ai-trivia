/**
 * AI Question Service
 * 
 * Abstracted AI service that can use different providers.
 * Currently implements OpenRouter for fast, adaptive question generation.
 */

import { TriviaQuestion, QuestionCategory, DifficultyLevel } from '../types/Question';
import { PlayerProgress } from '../types/Game';

export interface QuestionContext {
  category?: QuestionCategory;
  difficulty?: DifficultyLevel;
  count?: number;
  playerProgress?: PlayerProgress;
  previousQuestions?: string[]; // To avoid repetition
  focusAreas?: string[]; // Areas to emphasize based on weak performance
}

export interface AIProvider {
  name: string;
  generateQuestions(context: QuestionContext): Promise<TriviaQuestion[]>;
  isAvailable(): Promise<boolean>;
}

/**
 * OpenRouter Provider Implementation
 */
export class OpenRouterProvider implements AIProvider {
  name = 'OpenRouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  // Fast, affordable models for real-time generation
  private models = {
    fast: 'openai/gpt-3.5-turbo', // Fast and reliable
    free: 'meta-llama/llama-3.1-8b-instruct:free', // Free alternative
    balanced: 'anthropic/claude-3-haiku', // Good balance of speed/quality
  };
  
  private selectedModel: string;

  constructor(apiKey: string, modelPreference: 'fast' | 'free' | 'balanced' = 'fast') {
    this.apiKey = apiKey;
    this.selectedModel = this.models[modelPreference];
  }

  async generateQuestions(context: QuestionContext): Promise<TriviaQuestion[]> {
    try {
      const prompt = this.buildAdaptivePrompt(context);
      const response = await this.callOpenRouter(prompt);
      return this.parseResponse(response, context);
    } catch (error) {
      console.error('OpenRouter generation error:', error);
      throw new Error('Failed to generate questions');
    }
  }

  private buildAdaptivePrompt(context: QuestionContext): string {
    const { 
      category = 'player_stories', 
      difficulty = 'medium', 
      count = 1,
      playerProgress,
      previousQuestions = [],
      focusAreas = []
    } = context;

    let prompt = `Generate ${count} cricket trivia question(s) with these requirements:\n\n`;

    // Add adaptive elements based on player progress
    if (playerProgress) {
      if (playerProgress.knowledgeLevel === 'beginner') {
        prompt += 'PLAYER LEVEL: Beginner - Use simple language, provide more context, focus on fundamentals\n';
      } else if (playerProgress.knowledgeLevel === 'advanced') {
        prompt += 'PLAYER LEVEL: Advanced - Include nuanced details, lesser-known facts\n';
      }

      if (playerProgress.weakAreas.length > 0) {
        prompt += `FOCUS AREAS: Emphasize these topics where player needs improvement: ${playerProgress.weakAreas.join(', ')}\n`;
      }
    }

    // Add focus areas if specified
    if (focusAreas.length > 0) {
      prompt += `TOPICS TO EMPHASIZE: ${focusAreas.join(', ')}\n`;
    }

    // Core requirements
    prompt += `
CATEGORY: ${this.getCategoryDescription(category)}
DIFFICULTY: ${difficulty}

AVOID REPETITION: Do not create questions similar to these recent ones:
${previousQuestions.slice(-5).map((q, i) => `${i + 1}. ${q}`).join('\n')}

FORMAT: Return ONLY a JSON array:
[{
  "question": "Engaging question with context",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "Educational explanation"
}]

Make questions educational and engaging for learning cricket.`;

    return prompt;
  }

  private getCategoryDescription(category: QuestionCategory): string {
    const descriptions = {
      legendary_moments: 'Historic matches, iconic performances, memorable moments',
      player_stories: 'Player careers, personal stories, achievements',
      records_stats: 'Cricket records with interesting backstories',
      rules_formats: 'Game rules, formats, equipment, playing conditions',
      cultural_impact: 'Cricket\'s influence on society, culture, and media',
      tutorial: 'Basic cricket concepts for beginners'
    };
    return descriptions[category] || 'General cricket knowledge';
  }

  private async callOpenRouter(prompt: string): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cricket-trivia-app.com',
        'X-Title': 'Cricket Trivia Learn Mode'
      },
      body: JSON.stringify({
        model: this.selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are a cricket education expert creating adaptive learning questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private parseResponse(response: any, context: QuestionContext): TriviaQuestion[] {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content in response');

      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const questions = JSON.parse(jsonMatch[0]);
      
      return questions.map((q: any, index: number) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: context.category || 'general',
        difficulty: context.difficulty || 'medium',
        generatedAt: new Date(),
        model: 'openrouter'
      }));
    } catch (error) {
      console.error('Parse error:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.selectedModel,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Main AI Question Service
 */
export class AIQuestionService {
  private provider: AIProvider;
  private cache: Map<string, TriviaQuestion[]> = new Map();

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Generate questions with caching
   */
  async generateQuestions(context: QuestionContext): Promise<TriviaQuestion[]> {
    // Create cache key from context
    const cacheKey = this.createCacheKey(context);
    
    // Check cache first (with 5 minute expiry)
    const cached = this.cache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Generate new questions
    const questions = await this.provider.generateQuestions(context);
    
    // Cache the results
    this.cache.set(cacheKey, questions);
    setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000); // 5 minute cache
    
    return questions;
  }

  /**
   * Generate adaptive questions based on player progress
   */
  async generateAdaptiveQuestions(
    baseContext: QuestionContext,
    playerProgress: PlayerProgress
  ): Promise<TriviaQuestion[]> {
    // Enhance context with adaptive elements
    const adaptiveContext: QuestionContext = {
      ...baseContext,
      playerProgress,
      focusAreas: playerProgress.weakAreas,
      previousQuestions: playerProgress.questionsHistory
        .slice(-10)
        .map(q => q.topic)
    };

    // Adjust difficulty based on performance
    if (playerProgress.knowledgeLevel === 'beginner') {
      adaptiveContext.difficulty = 'easy';
    } else if (playerProgress.knowledgeLevel === 'advanced') {
      adaptiveContext.difficulty = 'hard';
    }

    return this.generateQuestions(adaptiveContext);
  }

  /**
   * Pre-generate questions for smooth gameplay
   */
  async preGenerateQuestions(contexts: QuestionContext[]): Promise<void> {
    const promises = contexts.map(context => 
      this.generateQuestions(context).catch(err => {
        console.error('Pre-generation failed:', err);
        return [];
      })
    );
    await Promise.all(promises);
  }

  private createCacheKey(context: QuestionContext): string {
    return `${context.category}-${context.difficulty}-${context.count}`;
  }

  /**
   * Check if the AI service is available
   */
  async checkAvailability(): Promise<boolean> {
    return this.provider.isAvailable();
  }
}

/**
 * Factory function to create AI Question Service
 */
export const createAIQuestionService = (
  apiKey?: string,
  modelPreference: 'fast' | 'free' | 'balanced' = 'fast'
): AIQuestionService => {
  const key = apiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  if (!key) {
    throw new Error('OpenRouter API key is required');
  }
  
  const provider = new OpenRouterProvider(key, modelPreference);
  return new AIQuestionService(provider);
};