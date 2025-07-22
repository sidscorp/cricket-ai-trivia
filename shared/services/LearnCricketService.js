/**
 * Shared Learn Cricket Service
 * 
 * Platform-agnostic service for generating adaptive cricket basics questions.
 * Works with both CLI and UI through platform adapters.
 */

import { getLearnCricketModel, TOKEN_LIMITS } from '../config/ai-models.js';
import { CRICKET_TOPICS, getRandomTopics } from '../config/cricket-topics.js';
import { LEARN_CRICKET_CONSTANTS } from '../config/constants.js';

class LearnCricketService {
  constructor(options = {}) {
    // Platform adapter for logging (CLI uses chalk, UI uses console)
    this.logger = options.logger || {
      info: (msg) => console.log(msg),
      warn: (msg) => console.warn(msg),
      error: (msg) => console.error(msg),
      success: (msg) => console.log(msg),
    };
    
    // OpenRouter service injection
    this.openRouterService = options.openRouterService;
    
    // Model selection (can be overridden)
    this.model = options.model || getLearnCricketModel();
    
    // Support fast mode
    this.fastMode = options.fastMode || false;
    if (this.fastMode && !options.model) {
      // Use faster model for fast mode
      this.model = 'openai/gpt-3.5-turbo';
    }
    
    // Use shared topics
    this.topics = CRICKET_TOPICS;
  }

  /**
   * Generate questions for an over
   * @param {Object} context - Generation context
   * @param {number} context.overNumber - Current over (1 or 2)
   * @param {Array} context.previousQuestions - Questions from previous over
   * @param {Array} context.previousAnswers - User's answers from previous over
   * @param {Object} context.performance - Performance metrics from previous over
   * @returns {Promise<Array>} Array of 6 questions
   */
  async generateOverQuestions(context = {}) {
    const { 
      overNumber = 1, 
      previousQuestions = [], 
      previousAnswers = [],
      performance = null 
    } = context;

    try {
      this.logger.info(`Generating questions for Over ${overNumber}...`);
      
      if (!this.openRouterService) {
        throw new Error('OpenRouterService not initialized');
      }
      
      const prompt = this.buildLearnCricketPrompt({
        overNumber,
        previousQuestions,
        previousAnswers,
        performance
      });

      const response = await this.openRouterService.callOpenRouterAPI({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: TOKEN_LIMITS[this.model] || 1500
      });

      const questions = this.parseQuestionResponse(response);
      
      if (questions.length !== LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER) {
        this.logger.warn(`Expected ${LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER} questions but got ${questions.length}`);
      }

      return questions.slice(0, LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER);
    } catch (error) {
      this.logger.error('Error generating questions:', error.message);
      throw new Error('Failed to generate cricket questions');
    }
  }

  /**
   * Get system prompt for cricket education
   */
  getSystemPrompt() {
    return `You are a cricket education expert creating questions for beginners learning cricket basics. 
Your goal is to help new players understand the fundamentals of cricket through clear, educational questions.
Focus on accuracy, use simple language, and ensure questions teach important concepts about how cricket works.`;
  }

  /**
   * Build prompt for question generation
   */
  buildLearnCricketPrompt({ overNumber, previousQuestions, previousAnswers, performance }) {
    let prompt = `Generate ${LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER} cricket educational questions for beginners.\n\n`;

    if (overNumber === 1) {
      // First over - diverse topics
      const selectedTopics = getRandomTopics(LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER);
      
      prompt += `This is the FIRST OVER. Create ${LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER} diverse questions covering different aspects of cricket basics.
      
Topics to cover:
${selectedTopics.map(t => `- ${t}`).join('\n')}

Requirements:
1. Each question should teach a fundamental cricket concept
2. Use clear, simple language suitable for beginners
3. Questions should be factual and educational
4. Include brief context in each question
5. Make options plausible but clearly distinguishable
6. Explanations should reinforce learning`;

    } else {
      // Second over - adaptive based on performance
      prompt += `This is the SECOND OVER. Generate ${LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER} new questions based on the user's performance in Over 1.\n\n`;
      
      if (performance) {
        prompt += `Performance Summary:
- Correct answers: ${performance.correct}/${performance.total} (${Math.round(performance.accuracy * 100)}%)
- Topics answered correctly: ${performance.correctTopics.join(', ') || 'None'}
- Topics answered incorrectly: ${performance.incorrectTopics.join(', ') || 'None'}\n\n`;

        const { PERFORMANCE_THRESHOLDS } = LEARN_CRICKET_CONSTANTS;
        
        if (performance.accuracy < PERFORMANCE_THRESHOLDS.NEEDS_PRACTICE) {
          prompt += `The user struggled in Over 1. Make questions slightly easier and focus on the topics they got wrong.\n`;
        } else if (performance.accuracy > PERFORMANCE_THRESHOLDS.EXCELLENT) {
          prompt += `The user did well in Over 1. Include some intermediate-level questions while maintaining educational value.\n`;
        } else {
          prompt += `The user showed moderate understanding. Mix reinforcement of missed topics with new concepts.\n`;
        }
      }

      prompt += `\nPrevious questions to avoid repetition:\n`;
      previousQuestions.forEach((q, i) => {
        prompt += `${i + 1}. ${q.question}\n`;
      });
    }

    prompt += `\n\nReturn EXACTLY ${LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER} questions in this JSON format:
[
  {
    "question": "Educational question with context",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Clear explanation of why this answer is correct and what it teaches",
    "topic": "topic category",
    "difficulty": "beginner"
  }
]

Ensure the JSON is valid and contains exactly ${LEARN_CRICKET_CONSTANTS.QUESTIONS_PER_OVER} question objects.`;

    return prompt;
  }

  /**
   * Parse response from AI model
   */
  parseQuestionResponse(response) {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      // Extract JSON from response using multiple strategies
      let questions = null;
      
      // Strategy 1: Direct parse if response is already JSON
      try {
        questions = JSON.parse(content);
      } catch (e) {
        // Continue to other strategies
      }

      // Strategy 2: Find JSON array with regex
      if (!questions) {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            questions = JSON.parse(jsonMatch[0]);
          } catch (e) {
            // Continue to next strategy
          }
        }
      }

      // Strategy 3: Extract from code block
      if (!questions) {
        const codeBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          try {
            questions = JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            // Continue to next strategy
          }
        }
      }

      // Strategy 4: Manual extraction between brackets
      if (!questions) {
        const startIndex = content.indexOf('[');
        const endIndex = content.lastIndexOf(']');
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const jsonStr = content.substring(startIndex, endIndex + 1);
          try {
            const cleanedJson = jsonStr
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
              .replace(/,\s*([}\]])/g, '$1')
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
              .replace(/:\s*'([^']*)'/g, ': "$1"');
            
            questions = JSON.parse(cleanedJson);
          } catch (e) {
            throw new Error('Failed to parse JSON after all strategies');
          }
        }
      }

      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array of questions');
      }

      // Validate and enhance questions
      const validQuestions = questions
        .filter(q => q && q.question && q.options && Array.isArray(q.options))
        .map((q, index) => ({
          id: `learn-${Date.now()}-${index}`,
          question: q.question,
          options: q.options,
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanation: q.explanation || 'No explanation provided',
          topic: q.topic || this.topics[index % this.topics.length],
          difficulty: q.difficulty || 'beginner',
          category: 'tutorial'
        }));

      if (validQuestions.length === 0) {
        throw new Error('No valid questions found in response');
      }

      this.logger.success(`Successfully parsed ${validQuestions.length} questions`);
      return validQuestions;

    } catch (error) {
      this.logger.error('Error parsing questions:', error.message);
      throw new Error('Failed to parse question response: ' + error.message);
    }
  }

  /**
   * Calculate performance metrics from answers
   */
  calculatePerformance(questions, userAnswers) {
    const correct = questions.reduce((count, q, i) => {
      return count + (q.correctAnswer === userAnswers[i] ? 1 : 0);
    }, 0);

    const correctTopics = [];
    const incorrectTopics = [];

    questions.forEach((q, i) => {
      if (q.correctAnswer === userAnswers[i]) {
        if (!correctTopics.includes(q.topic)) {
          correctTopics.push(q.topic);
        }
      } else {
        if (!incorrectTopics.includes(q.topic)) {
          incorrectTopics.push(q.topic);
        }
      }
    });

    return {
      correct,
      total: questions.length,
      accuracy: correct / questions.length,
      correctTopics,
      incorrectTopics
    };
  }

  /**
   * Format questions for display
   */
  formatQuestionsForDisplay(questions) {
    return questions.map((q, i) => {
      const optionLabels = ['A', 'B', 'C', 'D'];
      return {
        number: i + 1,
        question: q.question,
        options: q.options.map((opt, j) => `${optionLabels[j]}. ${opt}`),
        topic: q.topic
      };
    });
  }

  /**
   * Parse user answer input (comma-separated letters to indices)
   */
  parseUserAnswers(input) {
    const answers = input.toUpperCase().split(',').map(a => a.trim());
    return answers.map(answer => {
      const index = answer.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
      return (index >= 0 && index <= 3) ? index : -1;
    });
  }
}

export default LearnCricketService;