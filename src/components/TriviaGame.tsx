/**
 * Trivia Game Component
 * 
 * Main game interface for cricket trivia questions.
 * Handles question display, user interaction, scoring, and AI question generation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TriviaQuestion, QuestionCategory, DifficultyLevel, GameFilters } from '../types/Question';
import { getGeminiService } from '../../shared/services/GeminiService';
import { QuestionValidator } from '../utils/QuestionValidator';

interface TriviaGameProps {
  mode: 'tutorial' | 'game';
  onExit: () => void;
  filters?: GameFilters;
}

export const TriviaGame: React.FC<TriviaGameProps> = ({ mode, onExit, filters }) => {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  /**
   * Initialize game with AI-generated questions
   */
  useEffect(() => {
    generateInitialQuestions();
  }, []);

  /**
   * Generate initial set of questions using Gemini AI
   */
  const generateInitialQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const geminiService = getGeminiService();
      let allQuestions: TriviaQuestion[] = [];
      
      if (mode === 'tutorial') {
        // Generate tutorial questions
        const tutorialQuestions = await geminiService.generateQuestions({
          category: 'tutorial',
          difficulty: 'easy',
          count: 10,
        });
        allQuestions = tutorialQuestions;
      } else {
        // Generate a mix of questions for game mode
        const questionPromises = [
          geminiService.generateQuestions({
            category: 'legendary_moments',
            difficulty: 'medium',
            count: 2,
            filters: filters,
          }),
          geminiService.generateQuestions({
            category: 'player_stories',
            difficulty: 'medium',
            count: 2,
            filters: filters,
          }),
          geminiService.generateQuestions({
            category: 'records_stats',
            difficulty: 'easy',
            count: 1,
            filters: filters,
          }),
        ];

        const questionSets = await Promise.all(questionPromises);
        allQuestions = questionSets.flat();
      }
      
      // Validate questions
      const validQuestions = allQuestions.filter(question => {
        const validation = QuestionValidator.validateQuestion(question);
        if (!validation.isValid) {
          console.warn('Invalid question filtered out:', validation.errors);
          return false;
        }
        return true;
      });

      if (validQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }

      // Auto-fix common issues
      const fixedQuestions = validQuestions.map(QuestionValidator.autoFixQuestion);
      
      setQuestions(fixedQuestions);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      
      // Fallback to sample question for development
      setQuestions([createSampleQuestion()]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle answer selection
   */
  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    setSelectedAnswer(answerIndex);
    
    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
    
    setShowExplanation(true);
  };

  /**
   * Move to next question or end game
   */
  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      handleGameEnd();
      return;
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);

    // In tutorial mode, don't generate additional questions (fixed 10 questions)
    // In game mode, generate more questions as needed
    if (mode === 'game' && currentQuestionIndex >= questions.length - 2) {
      try {
        const geminiService = getGeminiService();
        const newQuestions = await geminiService.generateQuestions({
          category: getRandomCategory(),
          difficulty: getRandomDifficulty(),
          count: 2,
          filters: filters,
        });
        
        const validNewQuestions = newQuestions
          .filter(q => QuestionValidator.validateQuestion(q).isValid)
          .map(QuestionValidator.autoFixQuestion);
          
        setQuestions([...questions, ...validNewQuestions]);
      } catch (err) {
        console.warn('Failed to generate additional questions:', err);
      }
    }
  };

  /**
   * Handle game completion
   */
  const handleGameEnd = () => {
    const percentage = Math.round((score / questions.length) * 100);
    let message = `Game Complete!\n\nScore: ${score}/${questions.length} (${percentage}%)`;
    
    if (percentage >= 80) {
      message += '\n\nExcellent! You know your cricket well!';
    } else if (percentage >= 60) {
      message += '\n\nGood job! Keep learning about cricket.';
    } else {
      message += '\n\nKeep practicing to improve your cricket knowledge.';
    }

    Alert.alert('Game Over', message, [
      { text: 'Play Again', onPress: () => resetGame() },
      { text: 'Exit', onPress: onExit },
    ]);
  };

  /**
   * Reset game for replay
   */
  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuestions([]);
    generateInitialQuestions();
  };

  /**
   * Get random category for question generation
   */
  const getRandomCategory = (): QuestionCategory => {
    const categories: QuestionCategory[] = [
      'legendary_moments', 'player_stories', 'records_stats', 'rules_formats', 'cultural_impact'
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  /**
   * Get random difficulty for question generation
   */
  const getRandomDifficulty = (): DifficultyLevel => {
    const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  };

  /**
   * Create sample question for fallback
   */
  const createSampleQuestion = (): TriviaQuestion => ({
    id: 'sample-1',
    question: 'During the 1983 World Cup final, which West Indies batsman was caught by Kapil Dev in a crucial moment that turned the match?',
    options: ['Viv Richards', 'Gordon Greenidge', 'Clive Lloyd', 'Joel Garner'],
    correctAnswer: 0,
    explanation: 'Kapil Dev caught Viv Richards at backward square leg when Richards was batting aggressively. This catch is often cited as the turning point that led to India\'s historic World Cup victory.',
    category: 'legendary_moments',
    difficulty: 'medium',
    generatedAt: new Date(),
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Generating cricket trivia questions...</Text>
        <Text style={styles.loadingSubtext}>AI is crafting engaging questions for you</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={generateInitialQuestions}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No questions available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={generateInitialQuestions}>
          <Text style={styles.retryButtonText}>Generate Questions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.modeText}>{mode === 'tutorial' ? 'Cricket Tutorial' : 'Game Mode'}</Text>
        <Text style={styles.scoreText}>Score: {score}/{currentQuestionIndex + 1}</Text>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.categoryText}>{currentQuestion.category.replace(/_/g, ' ').toUpperCase()}</Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === index && styles.selectedOption,
              showExplanation && index === currentQuestion.correctAnswer && styles.correctOption,
              showExplanation && selectedAnswer === index && index !== currentQuestion.correctAnswer && styles.incorrectOption,
            ]}
            onPress={() => handleAnswerSelect(index)}
            disabled={selectedAnswer !== null}
          >
            <Text style={[
              styles.optionText,
              selectedAnswer === index && styles.selectedOptionText,
              showExplanation && index === currentQuestion.correctAnswer && styles.correctOptionText,
            ]}>
              {String.fromCharCode(65 + index)}. {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Explanation */}
      {showExplanation && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>
            {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
          </Text>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {showExplanation && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Finish Game' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Exit Game</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a472a',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#90ee90',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a472a',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#90ee90',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#1a472a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modeText: {
    color: '#90ee90',
    fontSize: 16,
    marginBottom: 5,
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressText: {
    color: '#90ee90',
    fontSize: 14,
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  categoryText: {
    color: '#90ee90',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#90ee90',
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
  },
  correctOption: {
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  incorrectOption: {
    borderColor: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedOptionText: {
    fontWeight: 'bold',
  },
  correctOptionText: {
    fontWeight: 'bold',
    color: '#4caf50',
  },
  explanationContainer: {
    backgroundColor: 'rgba(144, 238, 144, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  explanationTitle: {
    color: '#90ee90',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  explanationText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  navigationContainer: {
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#1a472a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});