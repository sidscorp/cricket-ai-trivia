/**
 * Gemini AI Service
 * 
 * Handles integration with Google's Gemini API for generating
 * contextual cricket trivia questions with explanations.
 */

import { TriviaQuestion, QuestionGenerationRequest, QuestionCategory, DifficultyLevel } from '../types/Question';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate cricket trivia questions using Gemini AI
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<TriviaQuestion[]> {
    try {
      const prompt = this.buildPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      return this.parseGeminiResponse(response, request);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  /**
   * Build contextual prompt for Gemini based on trivia research principles
   */
  private buildPrompt(request: QuestionGenerationRequest): string {
    const categoryContext = this.getCategoryContext(request.category);
    const difficultyGuidance = this.getDifficultyGuidance(request.difficulty);
    const count = request.count || 1;

    return `You are a cricket trivia expert. Generate ${count} engaging cricket trivia question(s) with the following requirements:

CATEGORY: ${categoryContext}
DIFFICULTY: ${difficultyGuidance}

QUESTION QUALITY REQUIREMENTS:
- Include contextual storytelling, not just facts
- Make questions interesting with historical anecdotes
- Avoid simple stat-based questions unless they have compelling context
- Each question should teach something memorable about cricket
- Questions should be engaging for cricket fans of various knowledge levels

FORMAT REQUIREMENTS:
Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Question text with context and story",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation with additional context and why this answer is correct"
  }
]

EXAMPLE GOOD QUESTION:
{
  "question": "During the 1983 World Cup final, Kapil Dev made a crucial catch that many consider the turning point. Who was the batsman he caught, and what made this catch so significant?",
  "options": ["Viv Richards - it broke West Indies' momentum", "Gordon Greenidge - it ended a dangerous partnership", "Clive Lloyd - it removed the captain", "Joel Garner - it ended the innings"],
  "correctAnswer": 0,
  "explanation": "Kapil Dev caught Viv Richards at backward square leg when Richards was batting aggressively and seemed to be taking the game away from India. This catch is often cited as the moment that changed the course of the match and ultimately led to India's historic World Cup victory."
}

Generate ${count} question(s) now:`;
  }

  /**
   * Get category-specific context for question generation
   */
  private getCategoryContext(category: QuestionCategory): string {
    const contexts = {
      legendary_moments: 'Historic cricket matches, iconic performances, memorable moments that defined cricket history',
      player_stories: 'Career highlights, personal anecdotes, unique stories about cricketers past and present',
      records_stats: 'Cricket records with compelling backstories, statistical achievements with context',
      rules_formats: 'Cricket rules, game formats, evolution of the sport, equipment and playing conditions',
      cultural_impact: 'Cricket in society, movies, politics, cultural significance in different countries'
    };
    return contexts[category];
  }

  /**
   * Get difficulty-specific guidance for question generation
   */
  private getDifficultyGuidance(difficulty: DifficultyLevel): string {
    const guidance = {
      easy: 'Basic cricket knowledge, well-known players and events, simple rules',
      medium: 'Moderate cricket knowledge, some historical context, intermediate concepts',
      hard: 'Deep cricket knowledge, obscure historical facts, complex situations'
    };
    return guidance[difficulty];
  }

  /**
   * Make HTTP request to Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<GeminiResponse> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse Gemini response and convert to TriviaQuestion objects
   */
  private parseGeminiResponse(response: GeminiResponse, request: QuestionGenerationRequest): TriviaQuestion[] {
    try {
      const content = response.candidates[0]?.content?.parts[0]?.text;
      if (!content) {
        throw new Error('No content received from Gemini');
      }

      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const rawQuestions = JSON.parse(jsonMatch[0]);
      
      return rawQuestions.map((q: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: request.category,
        difficulty: request.difficulty,
        generatedAt: new Date(),
      }));
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
let geminiService: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiService) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('API Key length:', apiKey ? apiKey.length : 'undefined');
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_GEMINI_API_KEY environment variable is required');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
};