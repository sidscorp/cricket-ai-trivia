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
import { TriviaQuestion, QuestionCategory, DifficultyLevel, GameFilters, GameMode } from './src/types/Question';
import { getGeminiService } from './src/services/GeminiService';
import { QuestionValidator } from './src/utils/QuestionValidator';

interface TriviaGameProps {
  mode: 'tutorial' | 'game';
  onExit: () => void;
  filters?: GameFilters;
  onUpdateStats?: (correct: boolean, points: number) => void;
  onUpdateGameStats?: (correct: boolean, points: number, totalQuestions: number) => void;
  onGameStart?: (totalQuestions: number, gameMode: GameMode) => void;
}

export const TriviaGame: React.FC<TriviaGameProps> = ({ mode, onExit, filters, onUpdateStats, onUpdateGameStats, onGameStart }) => {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [wicketsLost, setWicketsLost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const gameMode = filters?.gameMode || 'fixed';
  const isLastQuestion = gameMode === 'fixed' ? currentQuestionIndex === questions.length - 1 : wicketsLost >= 5;
  const isGameOver = isLastQuestion || (gameMode === 'unlimited' && wicketsLost >= 5);

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
      
      // Initialize game stats when questions are loaded
      if (onGameStart) {
        const gameMode = filters?.gameMode || 'fixed';
        onGameStart(fixedQuestions.length, gameMode);
      }
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
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const points = isCorrect ? 10 : 0; // 10 points for correct answers
    
    if (isCorrect) {
      setScore(score + 1);
    } else {
      setWicketsLost(wicketsLost + 1);
    }
    
    // Update user stats
    if (onUpdateStats) {
      onUpdateStats(isCorrect, points);
    }
    
    // Update game stats
    if (onUpdateGameStats) {
      onUpdateGameStats(isCorrect, points, questions.length);
    }
    
    setShowExplanation(true);
  };

  /**
   * Move to next question or end game
   */
  const handleNextQuestion = async () => {
    // Check if game should end due to wickets or questions
    if (isGameOver || (gameMode === 'unlimited' && wicketsLost >= 5)) {
      handleGameEnd();
      return;
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);

    // In tutorial mode, don't generate additional questions (fixed 10 questions)
    // In unlimited game mode, generate more questions as needed
    if (mode === 'game' && gameMode === 'unlimited' && currentQuestionIndex >= questions.length - 2 && wicketsLost < 5) {
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
    const totalQuestions = gameMode === 'fixed' ? questions.length : currentQuestionIndex + 1;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    let message: string;
    if (gameMode === 'unlimited' && wicketsLost >= 5) {
      message = `All Out!\n\nFinal Score: ${score * 10} runs from ${totalQuestions} balls\nWickets Lost: ${wicketsLost}/5\nAccuracy: ${percentage}%`;
    } else {
      message = `Innings Complete!\n\nScore: ${score}/${totalQuestions} (${percentage}%)\nTotal Runs: ${score * 10}`;
    }
    
    if (percentage >= 80) {
      message += '\n\n🏆 Excellent batting! You know your cricket well!';
    } else if (percentage >= 60) {
      message += '\n\n👏 Good innings! Keep learning about cricket.';
    } else {
      message += '\n\n📚 Keep practicing to improve your cricket knowledge.';
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
    setWicketsLost(0);
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
   * Get emoji for question category
   */
  const getCategoryEmoji = (category: QuestionCategory): string => {
    const emojis = {
      legendary_moments: '⚡',
      player_stories: '👤',
      records_stats: '📊',
      rules_formats: '📋',
      cultural_impact: '🌍',
      tutorial: '🎓'
    };
    return emojis[category];
  };

  /**
   * Get category display name
   */
  const getCategoryName = (category: QuestionCategory): string => {
    const names = {
      legendary_moments: 'Legendary Moments',
      player_stories: 'Player Stories',
      records_stats: 'Records & Stats',
      rules_formats: 'Rules & Formats',
      cultural_impact: 'Cultural Impact',
      tutorial: 'Cricket Basics'
    };
    return names[category];
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

      {/* Question */}
      <View style={styles.questionContainer}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryEmoji}>{getCategoryEmoji(currentQuestion.category)}</Text>
          <Text style={styles.categoryText}>{getCategoryName(currentQuestion.category)}</Text>
        </View>
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
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionLabel,
                selectedAnswer === index && styles.selectedOptionLabel,
                showExplanation && index === currentQuestion.correctAnswer && styles.correctOptionLabel,
              ]}>
                {String.fromCharCode(65 + index)}
              </Text>
              <Text style={[
                styles.optionText,
                selectedAnswer === index && styles.selectedOptionText,
                showExplanation && index === currentQuestion.correctAnswer && styles.correctOptionText,
              ]}>
                {option}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Explanation */}
      {showExplanation && (
        <View style={styles.explanationContainer}>
          <View style={styles.explanationHeader}>
            <Text style={styles.explanationEmoji}>
              {selectedAnswer === currentQuestion.correctAnswer ? '🎉' : '💡'}
            </Text>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Not quite right'}
            </Text>
          </View>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {showExplanation && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>
              {isGameOver ? 'Finish Innings' : 'Next Ball'}
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
    padding: 24,
    borderRadius: 20,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#90ee90',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    color: '#90ee90',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2.5,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedOption: {
    borderColor: '#90ee90',
    backgroundColor: 'rgba(144, 238, 144, 0.25)',
    transform: [{ scale: 1.02 }],
  },
  correctOption: {
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  incorrectOption: {
    borderColor: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.25)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    color: '#90ee90',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  selectedOptionLabel: {
    color: '#fff',
  },
  correctOptionLabel: {
    color: '#4caf50',
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    fontWeight: '400',
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  correctOptionText: {
    fontWeight: '600',
    color: '#4caf50',
  },
  explanationContainer: {
    backgroundColor: 'rgba(144, 238, 144, 0.15)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(144, 238, 144, 0.3)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  explanationEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  explanationTitle: {
    color: '#90ee90',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  explanationText: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.2,
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