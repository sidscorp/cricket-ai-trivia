/**
 * Learn Cricket Screen
 * 
 * Main game screen for the Learn Cricket mode with adaptive AI,
 * time-based scoring, and cricket-style gameplay.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { LearnCricketIntro } from '../components/LearnCricketIntro';
import { CricketScorecard } from '../components/cricket/CricketScorecard';
import { TimerBar } from '../components/cricket/TimerBar';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGameStats } from '../hooks/useGameStats';
import { createScoringService } from '../services/ScoringService';
import { createAIQuestionService } from '../services/AIQuestionService';
import { getLearningContextService } from '../services/LearningContextService';
import { TriviaQuestion } from '../types/Question';
import { CricketGameState, CRICKET_CONSTANTS, BallResult } from '../types/Cricket';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_SHOWN_KEY = 'learn_cricket_intro_shown';

interface LearnCricketScreenProps {
  onExit: () => void;
}

export const LearnCricketScreen: React.FC<LearnCricketScreenProps> = ({ onExit }) => {
  
  // Game state
  const [showIntro, setShowIntro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showOverSummary, setShowOverSummary] = useState(false);
  const [overStats, setOverStats] = useState<{runs: number; wickets: number; dots: number;}[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [needsOverStart, setNeedsOverStart] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Cricket-specific state
  const [cricketState, setCricketState] = useState<CricketGameState>({
    runs: 0,
    wickets: 0,
    balls: 0,
    overs: '0.0',
    currentOver: 0,
    currentBall: 0,
    boundaries: { fours: 0, sixes: 0 },
    dotBalls: 0,
    singles: 0,
    strikeRate: 0,
    runRate: 0,
    ballResults: Array(CRICKET_CONSTANTS.DEFAULT_OVERS * CRICKET_CONSTANTS.BALLS_PER_OVER).fill('-'),
  });

  // Services
  const timer = useGameTimer({ mode: 'countup' });
  const stats = useGameStats();
  const scoringService = useRef(createScoringService('cricket'));
  const aiService = useRef(createAIQuestionService());
  const learningContext = useRef(getLearningContextService());
  
  // Animation values
  const scoreAnimation = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  /**
   * Initialize game on mount
   */
  useEffect(() => {
    initializeGame();
  }, []);

  /**
   * Initialize game and show intro
   */
  const initializeGame = async () => {
    try {
      // Load learning context
      await learningContext.current.loadProgress();
      
      // Always show intro
      setShowIntro(true);
      setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  /**
   * Start the game after intro
   */
  const startGame = async () => {
    setLoading(true);
    setShowIntro(false);
    
    try {
      // Generate initial questions
      await generateInitialQuestions();
    } catch (error) {
      console.error('Failed to start game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate initial set of questions
   */
  const generateInitialQuestions = async () => {
    try {
      setIsTransitioning(true);
      const progress = learningContext.current.getProgress();
      const recommendations = learningContext.current.getAdaptiveRecommendations();
      
      // Generate 3 questions to start
      const initialQuestions = await aiService.current.generateAdaptiveQuestions(
        {
          category: 'tutorial',
          difficulty: recommendations.suggestedDifficulty,
          count: 3,
        },
        progress
      );
      
      setQuestions(initialQuestions);
      setIsTransitioning(false);
      
      // Pre-generate more questions for smooth gameplay
      const contexts = [
        { category: 'player_stories' as const, difficulty: recommendations.suggestedDifficulty, count: 2 },
        { category: 'rules_formats' as const, difficulty: recommendations.suggestedDifficulty, count: 2 },
        { category: 'legendary_moments' as const, difficulty: recommendations.suggestedDifficulty, count: 2 },
      ];
      aiService.current.preGenerateQuestions(contexts);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      setIsTransitioning(false);
      // Fallback questions could be added here
    }
  };

  /**
   * Start the first ball
   */
  const handleStartFirstBall = () => {
    setGameStarted(true);
    timer.start();
  };

  /**
   * Start a new over
   */
  const handleStartNewOver = () => {
    setNeedsOverStart(false);
    setGameStarted(true);
    timer.start();
  };

  /**
   * Handle answer selection
   */
  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null || !gameStarted) return;
    
    // Stop timer and get response time
    timer.stop();
    const responseTime = timer.elapsed;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestionIndex].correctAnswer;
    
    // Calculate score
    const scoreResult = scoringService.current.calculateScore({
      responseTime,
      isCorrect,
    });
    
    // Update cricket state
    updateCricketState(scoreResult.points, isCorrect);
    
    // Show feedback animation
    animateScoreFeedback(scoreResult.label || '');
    
    // Record in stats and learning context
    const currentQuestion = questions[currentQuestionIndex];
    stats.recordAnswer({
      questionId: currentQuestion.id,
      isCorrect,
      responseTime,
      category: currentQuestion.category,
      difficulty: currentQuestion.difficulty,
    });
    
    await learningContext.current.recordQuestionAttempt(
      currentQuestion.id,
      currentQuestion.category,
      isCorrect,
      responseTime,
      currentQuestion.difficulty
    );
    
    setShowExplanation(true);
    
    // Check game end conditions
    checkGameEnd();
  };

  /**
   * Update cricket-specific game state
   */
  const updateCricketState = (runs: number, isCorrect: boolean) => {
    setCricketState(prev => {
      const newState = { ...prev };
      
      // Update balls and overs
      newState.balls++;
      newState.currentBall = newState.balls % CRICKET_CONSTANTS.BALLS_PER_OVER;
      newState.currentOver = Math.floor(newState.balls / CRICKET_CONSTANTS.BALLS_PER_OVER);
      newState.overs = `${newState.currentOver}.${newState.currentBall}`;
      
      // Track over stats
      const currentOverIndex = Math.floor((newState.balls - 1) / CRICKET_CONSTANTS.BALLS_PER_OVER);
      if (!overStats[currentOverIndex]) {
        overStats[currentOverIndex] = { runs: 0, wickets: 0, dots: 0 };
      }
      
      // Update runs and wickets
      let ballResult: BallResult = '-';
      if (isCorrect) {
        newState.runs += runs;
        overStats[currentOverIndex].runs += runs;
        
        // Track boundaries and dots
        if (runs === 6) {
          newState.boundaries.sixes++;
          ballResult = '6';
        } else if (runs === 4) {
          newState.boundaries.fours++;
          ballResult = '4';
        } else if (runs === 1) {
          newState.singles++;
          ballResult = '1';
        } else if (runs === 0) {
          newState.dotBalls++;
          overStats[currentOverIndex].dots++;
          ballResult = '0';
        }
      } else {
        newState.wickets++;
        overStats[currentOverIndex].wickets++;
        newState.dotBalls++;
        overStats[currentOverIndex].dots++;
        ballResult = 'W';
      }
      
      // Update ball results
      newState.ballResults[newState.balls - 1] = ballResult;
      
      // Calculate rates
      if (newState.balls > 0) {
        newState.strikeRate = (newState.runs / newState.balls) * 100;
        const oversPlayed = newState.currentOver + (newState.currentBall / 6);
        newState.runRate = oversPlayed > 0 ? newState.runs / oversPlayed : 0;
      }
      
      // Check if over is complete
      if (newState.currentBall === 0 && newState.balls > 0) {
        setShowOverSummary(true);
      }
      
      return newState;
    });
  };

  /**
   * Animate score feedback
   */
  const animateScoreFeedback = (label: string) => {
    // Reset and animate
    scoreAnimation.setValue(1);
    feedbackOpacity.setValue(1);
    
    Animated.parallel([
      Animated.spring(scoreAnimation, {
        toValue: 1.2,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 2000,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Check if game should end
   */
  const checkGameEnd = () => {
    const totalBalls = CRICKET_CONSTANTS.DEFAULT_OVERS * CRICKET_CONSTANTS.BALLS_PER_OVER;
    
    if (cricketState.wickets >= CRICKET_CONSTANTS.DEFAULT_WICKETS - 1 || 
        cricketState.balls >= totalBalls - 1) {
      setGameComplete(true);
    }
  };

  /**
   * Move to next question
   */
  const handleNextQuestion = async () => {
    if (gameComplete) {
      showGameSummary();
      return;
    }
    
    // Show over summary if needed
    if (showOverSummary) {
      const lastOverIndex = Math.floor((cricketState.balls - 1) / CRICKET_CONSTANTS.BALLS_PER_OVER);
      const overStat = overStats[lastOverIndex];
      Alert.alert(
        `Over ${lastOverIndex + 1} Complete!`,
        `Runs: ${overStat.runs}\nWickets: ${overStat.wickets}\nDot Balls: ${overStat.dots}\n\nTotal: ${cricketState.runs}/${cricketState.wickets} (${cricketState.overs} overs)`,
        [{ 
          text: 'Continue', 
          onPress: () => {
            setShowOverSummary(false);
            setNeedsOverStart(true);
            setGameStarted(false);
          }
        }]
      );
      return;
    }
    
    // Start transition
    setIsTransitioning(true);
    
    // Generate more questions if needed
    if (currentQuestionIndex >= questions.length - 2) {
      await generateMoreQuestions();
    }
    
    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGameStarted(false);
    
    // Reset timer for new question
    timer.reset();
    
    // Check if this is the start of a new over
    const nextBall = cricketState.balls + 1;
    const isNewOver = nextBall % CRICKET_CONSTANTS.BALLS_PER_OVER === 1 && nextBall > 1;
    
    if (isNewOver) {
      setNeedsOverStart(true);
      setIsTransitioning(false);
    } else {
      // Auto-start timer after a brief delay for non-first balls
      setTimeout(() => {
        setIsTransitioning(false);
        setGameStarted(true);
        timer.start();
      }, 100);
    }
  };

  /**
   * Generate additional questions based on performance
   */
  const generateMoreQuestions = async () => {
    try {
      const progress = learningContext.current.getProgress();
      const recommendations = learningContext.current.getAdaptiveRecommendations();
      
      const newQuestions = await aiService.current.generateAdaptiveQuestions(
        {
          category: recommendations.focusTopics[0] as any || 'player_stories',
          difficulty: recommendations.suggestedDifficulty,
          count: 3,
        },
        progress
      );
      
      setQuestions(prev => [...prev, ...newQuestions]);
    } catch (error) {
      console.error('Failed to generate more questions:', error);
    }
  };

  /**
   * Show game summary
   */
  const showGameSummary = () => {
    const summary = learningContext.current.getLearningSummary();
    const message = `
Match Complete!

Score: ${cricketState.runs}/${cricketState.wickets} (${cricketState.overs} overs)
Strike Rate: ${cricketState.strikeRate.toFixed(1)}
Boundaries: ${cricketState.boundaries.fours} fours, ${cricketState.boundaries.sixes} sixes

Knowledge Level: ${summary.knowledgeLevel}
Accuracy: ${summary.accuracy}
Topics Mastered: ${summary.strongTopics.join(', ') || 'Keep practicing!'}
    `.trim();
    
    Alert.alert('Game Over', message, [
      { text: 'Play Again', onPress: resetGame },
      { text: 'Exit', onPress: onExit },
    ]);
  };

  /**
   * Reset game for replay
   */
  const resetGame = () => {
    setCricketState({
      runs: 0,
      wickets: 0,
      balls: 0,
      overs: '0.0',
      currentOver: 0,
      currentBall: 0,
      boundaries: { fours: 0, sixes: 0 },
      dotBalls: 0,
      singles: 0,
      strikeRate: 0,
      runRate: 0,
      ballResults: Array(CRICKET_CONSTANTS.DEFAULT_OVERS * CRICKET_CONSTANTS.BALLS_PER_OVER).fill('-'),
    });
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGameComplete(false);
    setGameStarted(false);
    setNeedsOverStart(false);
    setQuestions([]);
    setOverStats([]);
    stats.reset();
    scoringService.current.reset();
    timer.stop();
    
    generateInitialQuestions();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Preparing adaptive questions...</Text>
      </View>
    );
  }

  if (showIntro) {
    return (
      <LearnCricketIntro
        visible={showIntro}
        onDismiss={onExit}
        onStartGame={startGame}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Generating question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Cricket Scorecard */}
        <CricketScorecard 
          gameState={cricketState} 
          totalWickets={CRICKET_CONSTANTS.DEFAULT_WICKETS}
        />

      {/* Timer Bar or Start Prompt */}
      {gameStarted ? (
        <TimerBar 
          elapsed={timer.elapsed} 
          isRunning={timer.isRunning}
          maxTime={15}
        />
      ) : !showExplanation && (
        <View style={styles.startPrompt}>
          <Text style={styles.startPromptText}>
            {currentQuestionIndex === 0 
              ? 'Press "Start First Ball" to begin!'
              : needsOverStart 
                ? `Press "Start Over ${cricketState.currentOver + 1}" to continue!`
                : 'Get ready for the next ball...'}
          </Text>
        </View>
      )}

      {/* Score Feedback Animation */}
      <Animated.View 
        style={[
          styles.feedbackContainer,
          {
            opacity: feedbackOpacity,
            transform: [{ scale: scoreAnimation }],
          }
        ]}
      >
        <Text style={styles.feedbackText}>
          {scoringService.current.getHistory().slice(-1)[0]?.label}
        </Text>
      </Animated.View>

      {/* Question - Only show when game started */}
      {isTransitioning ? (
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="large" color="#90ee90" />
          <Text style={styles.waitingText}>Preparing next delivery...</Text>
        </View>
      ) : gameStarted ? (
        <>
          <View style={styles.questionContainer}>
            <Text style={styles.categoryText}>
              {currentQuestion.category.replace(/_/g, ' ').toUpperCase()}
            </Text>
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
                ]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Get ready for your next delivery!</Text>
        </View>
      )}

      {/* Explanation */}
      {showExplanation && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>
            {selectedAnswer === currentQuestion.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
          </Text>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}
      </ScrollView>

      {/* Fixed Navigation Footer */}
      <View style={styles.navigationContainer}>
        {!gameStarted && currentQuestionIndex === 0 && !showExplanation && (
          <TouchableOpacity style={styles.startButton} onPress={handleStartFirstBall}>
            <Text style={styles.startButtonText}>Start First Ball</Text>
          </TouchableOpacity>
        )}
        
        {!gameStarted && needsOverStart && !showExplanation && (
          <TouchableOpacity style={styles.startButton} onPress={handleStartNewOver}>
            <Text style={styles.startButtonText}>Start Over {cricketState.currentOver + 1}</Text>
          </TouchableOpacity>
        )}
        
        {showExplanation && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>
              {gameComplete ? 'View Summary' : 'Next Ball'}
            </Text>
          </TouchableOpacity>
        )}
        
        {(gameStarted || showExplanation || needsOverStart) && (
          <TouchableOpacity style={styles.exitButton} onPress={onExit}>
            <Text style={styles.exitButtonText}>Exit Game</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 150, // Space for fixed footer
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a472a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timerLabel: {
    color: '#90ee90',
    fontSize: 14,
  },
  timerValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  startPrompt: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  startPromptText: {
    color: '#90ee90',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 200,
    alignSelf: 'center',
    zIndex: 100,
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffeb3b',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  categoryText: {
    color: '#90ee90',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
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
  explanationContainer: {
    backgroundColor: 'rgba(144, 238, 144, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a472a',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(144, 238, 144, 0.2)',
  },
  nextButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#1a472a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  waitingText: {
    color: '#90ee90',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
});