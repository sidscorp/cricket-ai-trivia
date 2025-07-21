/**
 * OpenRouter Service Wrapper for UI
 * 
 * Provides OpenRouter API access compatible with the shared service.
 */

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not found');
    }
  }
  
  /**
   * Call OpenRouter API (compatible with shared service)
   */
  async callOpenRouterAPI(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cricket-trivia-app.com',
        'X-Title': 'Cricket Trivia Learn Mode'
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 1500,
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }
    
    return response.json();
  }
}

// Singleton instance
let openRouterServiceInstance: OpenRouterService | null = null;

/**
 * Get or create OpenRouter service instance
 */
export function getOpenRouterService(): OpenRouterService {
  if (!openRouterServiceInstance) {
    openRouterServiceInstance = new OpenRouterService();
  }
  return openRouterServiceInstance;
}

export default OpenRouterService;