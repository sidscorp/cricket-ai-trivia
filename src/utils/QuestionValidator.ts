/**
 * Question Validation Utility
 * 
 * Validates AI-generated cricket trivia questions for quality,
 * accuracy, and proper formatting before presenting to users.
 */

import { TriviaQuestion, QuestionValidationResult } from '../types/Question';

export class QuestionValidator {
  
  /**
   * Validate a single trivia question
   */
  static validateQuestion(question: TriviaQuestion): QuestionValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Basic structure validation
    this.validateBasicStructure(question, errors);
    
    // Content quality validation
    this.validateContentQuality(question, errors, suggestions);
    
    // Cricket context validation
    this.validateCricketContext(question, errors, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * Validate multiple questions for consistency and variety
   */
  static validateQuestionSet(questions: TriviaQuestion[]): QuestionValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (questions.length === 0) {
      errors.push('Question set cannot be empty');
      return { isValid: false, errors };
    }

    // Check for duplicate questions
    const questionTexts = questions.map(q => q.question.toLowerCase().trim());
    const duplicates = questionTexts.filter((text, index) => questionTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      errors.push('Duplicate questions detected');
    }

    // Check for variety in categories and difficulty
    this.validateQuestionVariety(questions, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * Validate basic question structure
   */
  private static validateBasicStructure(question: TriviaQuestion, errors: string[]): void {
    if (!question.question || question.question.trim().length < 10) {
      errors.push('Question text must be at least 10 characters long');
    }

    if (!question.options || question.options.length !== 4) {
      errors.push('Question must have exactly 4 options');
    }

    if (question.correctAnswer < 0 || question.correctAnswer > 3) {
      errors.push('Correct answer index must be between 0 and 3');
    }

    if (!question.explanation || question.explanation.trim().length < 20) {
      errors.push('Explanation must be at least 20 characters long');
    }

    // Check for empty options
    if (question.options) {
      question.options.forEach((option, index) => {
        if (!option || option.trim().length < 2) {
          errors.push(`Option ${index + 1} is too short or empty`);
        }
      });
    }
  }

  /**
   * Validate content quality and engagement
   */
  private static validateContentQuality(
    question: TriviaQuestion, 
    errors: string[], 
    suggestions: string[]
  ): void {
    const questionText = question.question.toLowerCase();
    
    // Check for boring statistical questions without context
    const boringPatterns = [
      /how many.*runs.*scored/,
      /what.*average.*career/,
      /when.*born/,
      /in which year.*debut/
    ];
    
    if (boringPatterns.some(pattern => pattern.test(questionText))) {
      suggestions.push('Consider adding more context or storytelling to make the question more engaging');
    }

    // Check for good contextual elements
    const contextualWords = ['during', 'when', 'after', 'famous', 'memorable', 'historic', 'legendary'];
    const hasContext = contextualWords.some(word => questionText.includes(word));
    
    if (!hasContext) {
      suggestions.push('Consider adding historical context or storytelling elements');
    }

    // Validate explanation quality
    const explanation = question.explanation.toLowerCase();
    if (explanation.length < 50) {
      suggestions.push('Explanation could be more detailed to provide better learning value');
    }

    // Check if explanation adds value beyond just stating the answer
    if (explanation.includes('the answer is') && !explanation.includes('because')) {
      suggestions.push('Explanation should explain why the answer is correct, not just state it');
    }
  }

  /**
   * Validate cricket-specific context and accuracy
   */
  private static validateCricketContext(
    question: TriviaQuestion, 
    errors: string[], 
    suggestions: string[]
  ): void {
    const questionText = question.question.toLowerCase();
    const cricketTerms = [
      'cricket', 'bat', 'ball', 'wicket', 'run', 'over', 'innings', 'test', 'odi', 't20',
      'bowler', 'batsman', 'fielder', 'captain', 'world cup', 'match', 'series'
    ];
    
    const hasCricketContext = cricketTerms.some(term => questionText.includes(term));
    if (!hasCricketContext) {
      errors.push('Question must contain clear cricket context');
    }

    // Check for proper cricket terminology
    const improperTerms = ['batter']; // Using 'batter' instead of 'batsman' in trivia context
    improperTerms.forEach(term => {
      if (questionText.includes(term)) {
        suggestions.push(`Consider using traditional cricket terminology instead of '${term}'`);
      }
    });
  }

  /**
   * Validate variety in question set
   */
  private static validateQuestionVariety(questions: TriviaQuestion[], suggestions: string[]): void {
    const categories = questions.map(q => q.category);
    const difficulties = questions.map(q => q.difficulty);
    
    const uniqueCategories = new Set(categories).size;
    const uniqueDifficulties = new Set(difficulties).size;
    
    if (questions.length > 3 && uniqueCategories === 1) {
      suggestions.push('Consider mixing question categories for better variety');
    }
    
    if (questions.length > 5 && uniqueDifficulties === 1) {
      suggestions.push('Consider varying difficulty levels for better engagement');
    }
  }

  /**
   * Auto-fix common issues in questions
   */
  static autoFixQuestion(question: TriviaQuestion): TriviaQuestion {
    const fixed = { ...question };
    
    // Trim whitespace
    fixed.question = fixed.question.trim();
    fixed.explanation = fixed.explanation.trim();
    fixed.options = fixed.options.map(opt => opt.trim());
    
    // Ensure question ends with question mark
    if (!fixed.question.endsWith('?')) {
      fixed.question += '?';
    }
    
    // Capitalize first letter of explanation
    if (fixed.explanation.length > 0) {
      fixed.explanation = fixed.explanation.charAt(0).toUpperCase() + fixed.explanation.slice(1);
    }
    
    return fixed;
  }
}