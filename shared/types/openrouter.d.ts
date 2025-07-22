/**
 * TypeScript declarations for OpenRouterService
 */

export interface OpenRouterModels {
  search: {
    perplexitySonar: string;
    perplexitySonarPro: string;
    perplexityReasoning: string;
    perplexityReasoningPro: string;
    gpt4Online: string;
    gpt4MiniOnline: string;
    claudeOnline: string;
  };
  creative: {
    claude3Opus: string;
    claude3Sonnet: string;
    gpt4Turbo: string;
    gpt4: string;
  };
  fast: {
    gpt35Turbo: string;
    gpt4Mini: string;
    claudeHaiku: string;
  };
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface QuestionGenerationRequest {
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  filters?: {
    era?: string;
    countries?: string[];
    questionStyle?: string;
  };
  model?: string;
}

export interface AnecdoteGenerationRequest {
  count?: number;
  filters?: any;
  category?: string;
  model?: string;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: string;
  generatedAt: Date;
  model: string;
}

export interface CricketAnecdote {
  title: string;
  story: string;
  key_facts: string[];
  search_context?: string;
  quality_score?: number;
}

export declare class OpenRouterService {
  constructor(apiKey: string);
  
  models: OpenRouterModels;
  defaultSearchModel: string;
  defaultCreativeModel: string;
  defaultFastModel: string;
  
  // Main methods
  callOpenRouterAPI(params: OpenRouterRequest): Promise<OpenRouterResponse>;
  generateQuestions(request: QuestionGenerationRequest): Promise<TriviaQuestion[]>;
  generateAnecdotes(request: AnecdoteGenerationRequest): Promise<CricketAnecdote[]>;
  generateQuestionsFromAnecdotes(request: {
    anecdotes: CricketAnecdote[];
    count?: number;
    model?: string;
  }): Promise<TriviaQuestion[]>;
  
  // Helper methods
  getAvailableModels(): {
    search: string[];
    creative: string[];
    fast: string[];
  };
  testConnection(): Promise<{ success: boolean; model?: string; error?: string }>;
  
  // Internal methods (optional, for completeness)
  protected buildDirectQuestionPrompt(request: QuestionGenerationRequest): string;
  protected parseQuestionResponse(content: string): TriviaQuestion[];
  protected extractJSONFromContent(content: string): any;
  protected log(color: string, ...args: any[]): void;
}

export declare function getOpenRouterService(): OpenRouterService;