/**
 * Learn Cricket Service - Fast Version
 * 
 * Optimized for speed while maintaining quality.
 */

import chalk from 'chalk';
import { getOpenRouterService } from './OpenRouterService.js';

class LearnCricketServiceFast {
  constructor() {
    this.openRouterService = getOpenRouterService();
    
    // Faster model options
    this.models = {
      fastest: 'openai/gpt-3.5-turbo',           // ~1-2s response time
      free: 'meta-llama/llama-3.1-8b-instruct:free', // Free and fast
      balanced: 'anthropic/claude-3-haiku',      // Good quality, still fast
      quality: 'perplexity/sonar'                // Current (slower but web-aware)
    };
    
    // Default to fastest for Learn Cricket (basic facts don't need web search)
    this.model = this.models.fastest;
    
    // Topic pool remains the same
    this.topics = [
      'basic rules',
      'field positions', 
      'batting techniques',
      'bowling types',
      'match formats',
      'scoring system',
      'equipment',
      'cricket terminology',
      'famous players',
      'cricket history'
    ];
  }

  /**
   * Generate questions with speed optimizations
   */
  async generateOverQuestions(context = {}) {
    const { 
      overNumber = 1, 
      previousQuestions = [], 
      previousAnswers = [],
      performance = null,
      modelPreference = 'fastest' 
    } = context;

    try {
      console.log(chalk.blue(`🏏 Generating questions for Over ${overNumber} (Fast Mode)...`));
      
      // Select model based on preference
      const selectedModel = this.models[modelPreference] || this.models.fastest;
      console.log(chalk.gray(`   Using model: ${selectedModel}`));
      
      const prompt = this.buildOptimizedPrompt({
        overNumber,
        previousQuestions,
        previousAnswers,
        performance
      });

      const startTime = Date.now();
      
      const response = await this.openRouterService.callOpenRouterAPI({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: this.getOptimizedSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500  // Reduced from 3000 - enough for 6 questions
      });

      const elapsedTime = Date.now() - startTime;
      console.log(chalk.green(`✅ Generated in ${elapsedTime}ms`));

      const questions = this.parseQuestionResponse(response);
      return questions.slice(0, 6);
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating questions:'), error);
      throw new Error('Failed to generate cricket questions');
    }
  }

  /**
   * Optimized system prompt - shorter and more direct
   */
  getOptimizedSystemPrompt() {
    return `Cricket education expert. Create beginner-friendly questions teaching cricket fundamentals. Be accurate, clear, and educational.`;
  }

  /**
   * Optimized prompt - more concise while maintaining quality
   */
  buildOptimizedPrompt({ overNumber, previousQuestions, previousAnswers, performance }) {
    let prompt = '';

    if (overNumber === 1) {
      // Simplified first over prompt
      prompt = `Generate 6 cricket basics questions for beginners.

Topics: ${this.topics.slice(0, 6).join(', ')}

Requirements:
- Educational and factual
- Simple language
- Clear explanations

Return JSON array with 6 questions:
[{"question":"...", "options":["A","B","C","D"], "correctAnswer":0, "explanation":"...", "topic":"..."}]`;

    } else {
      // Simplified adaptive prompt
      const accuracy = performance ? Math.round(performance.accuracy * 100) : 50;
      const difficulty = accuracy > 80 ? 'slightly harder' : accuracy < 50 ? 'easier' : 'similar';
      
      prompt = `Generate 6 MORE cricket questions (${difficulty} difficulty).

Previous accuracy: ${accuracy}%
Avoid these topics: ${previousQuestions.slice(0, 3).map(q => q.topic).join(', ')}

Return JSON array with 6 questions:
[{"question":"...", "options":["A","B","C","D"], "correctAnswer":0, "explanation":"...", "topic":"..."}]`;
    }

    return prompt;
  }

  /**
   * Parallel generation approach - generate 2 batches of 3 questions
   */
  async generateOverQuestionsParallel(context = {}) {
    console.log(chalk.blue('🏏 Generating questions in parallel...'));
    
    const batch1Promise = this.generateQuestionBatch({ ...context, count: 3, batchId: 1 });
    const batch2Promise = this.generateQuestionBatch({ ...context, count: 3, batchId: 2 });
    
    const [batch1, batch2] = await Promise.all([batch1Promise, batch2Promise]);
    
    return [...batch1, ...batch2];
  }

  /**
   * Generate a smaller batch of questions
   */
  async generateQuestionBatch({ count = 3, batchId = 1, ...context }) {
    const topics = this.topics.slice((batchId - 1) * 3, batchId * 3);
    
    const prompt = `Generate ${count} cricket questions about: ${topics.join(', ')}.
Return JSON: [{"question":"...", "options":["A","B","C","D"], "correctAnswer":0, "explanation":"...", "topic":"..."}]`;

    const response = await this.openRouterService.callOpenRouterAPI({
      model: this.models.fastest,
      messages: [
        { role: 'system', content: 'Cricket expert. Create educational questions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800  // Less tokens for smaller batch
    });

    return this.parseQuestionResponse(response);
  }

  // Reuse the same parsing logic
  parseQuestionResponse(response) {
    // ... (same implementation as original)
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content in response');

      let questions = null;
      
      // Try direct parse
      try {
        questions = JSON.parse(content);
      } catch (e) {
        // Try regex extraction
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        }
      }

      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      return questions.map((q, index) => ({
        id: `learn-${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || 'No explanation provided',
        topic: q.topic || this.topics[index % this.topics.length],
        difficulty: q.difficulty || 'beginner',
        category: 'tutorial'
      }));

    } catch (error) {
      console.error(chalk.red('Parse error:'), error);
      throw new Error('Failed to parse questions');
    }
  }
}

// Export singleton
let fastServiceInstance = null;

export const getLearnCricketServiceFast = () => {
  if (!fastServiceInstance) {
    fastServiceInstance = new LearnCricketServiceFast();
  }
  return fastServiceInstance;
};

export default LearnCricketServiceFast;