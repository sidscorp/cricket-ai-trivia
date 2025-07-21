import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TriviaGame } from './src/components/TriviaGame';
import { GameFilters, CricketEra, CricketCountry, QuestionStyle, GameMode } from './src/types/Question';
import { LearnCricketScreen } from './src/screens/LearnCricketScreen';

interface GameFiltersScreenProps {
  onStartGame: (filters: GameFilters) => void;
  onBack: () => void;
}

const GameFiltersScreen: React.FC<GameFiltersScreenProps> = ({ onStartGame, onBack }) => {
  const [selectedEra, setSelectedEra] = useState<CricketEra>('all_eras');
  const [selectedCountries, setSelectedCountries] = useState<CricketCountry[]>(['all_countries']);
  const [selectedQuestionStyle, setSelectedQuestionStyle] = useState<QuestionStyle>('facts_opinions');
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('fixed');

  const eras = [
    { id: 'all_eras', label: 'All Eras', description: 'Questions from cricket history' },
    { id: 'golden_age', label: 'Golden Age', description: 'Pre-1950s - Early cricket legends' },
    { id: 'post_war_boom', label: 'Post-War Boom', description: '1950s-1970s - Modern cricket development' },
    { id: 'world_cup_era', label: 'World Cup Era', description: '1970s-1990s - One-day revolution' },
    { id: 'modern_era', label: 'Modern Era', description: '2000s-2010s - T20 revolution' },
    { id: 'contemporary', label: 'Contemporary', description: '2010s-2019 - Recent cricket' },
    { id: 'post_covid', label: 'Post-COVID', description: '2020-Present - Latest cricket' },
  ] as const;

  const countries = [
    { id: 'all_countries', label: 'All Countries', description: 'Global cricket questions' },
    { id: 'england', label: 'England', description: 'Home of cricket' },
    { id: 'australia', label: 'Australia', description: 'The Baggy Green' },
    { id: 'india', label: 'India', description: 'Cricket crazy nation' },
    { id: 'west_indies', label: 'West Indies', description: 'Caribbean cricket' },
    { id: 'pakistan', label: 'Pakistan', description: 'Green shirts' },
    { id: 'south_africa', label: 'South Africa', description: 'Proteas cricket' },
    { id: 'new_zealand', label: 'New Zealand', description: 'Black Caps' },
    { id: 'sri_lanka', label: 'Sri Lanka', description: 'Island cricket' },
  ] as const;

  const questionStyles = [
    { id: 'facts_opinions', label: 'Facts + Opinions', description: 'Include subjective questions about "turning points" and "greatest moments"' },
    { id: 'facts_only', label: 'Facts Only', description: 'Objective, verifiable answers only' },
  ] as const;

  const gameModes = [
    { id: 'fixed', label: 'Fixed Questions', description: '10 questions - answer them all' },
    { id: 'unlimited', label: 'Unlimited Overs', description: 'Play until 5 wrong answers (5 wickets)' },
  ] as const;

  const handleCountryToggle = (countryId: CricketCountry) => {
    if (countryId === 'all_countries') {
      setSelectedCountries(['all_countries']);
    } else {
      const newSelection = selectedCountries.includes('all_countries') 
        ? [countryId]
        : selectedCountries.includes(countryId)
          ? selectedCountries.filter(c => c !== countryId)
          : [...selectedCountries, countryId];
      
      setSelectedCountries(newSelection.length === 0 ? ['all_countries'] : newSelection);
    }
  };

  const handleStartGame = () => {
    onStartGame({
      era: selectedEra,
      countries: selectedCountries,
      questionStyle: selectedQuestionStyle,
      gameMode: selectedGameMode
    });
  };

  return (
    <ScrollView style={styles.filterScrollContainer} contentContainerStyle={styles.filtersContent}>
      <Text style={styles.filtersTitle}>🏏 Customize Your Game</Text>
      
      {/* Era Selection */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Cricket Era</Text>
        {eras.map((era) => (
          <TouchableOpacity
            key={era.id}
            style={[
              styles.filterOption,
              selectedEra === era.id && styles.selectedFilterOption
            ]}
            onPress={() => setSelectedEra(era.id)}
          >
            <Text style={[
              styles.filterOptionTitle,
              selectedEra === era.id && styles.selectedFilterOptionText
            ]}>
              {era.label}
            </Text>
            <Text style={[
              styles.filterOptionDescription,
              selectedEra === era.id && styles.selectedFilterOptionText
            ]}>
              {era.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Country Selection */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Countries/Regions</Text>
        {countries.map((country) => (
          <TouchableOpacity
            key={country.id}
            style={[
              styles.filterOption,
              selectedCountries.includes(country.id) && styles.selectedFilterOption
            ]}
            onPress={() => handleCountryToggle(country.id)}
          >
            <Text style={[
              styles.filterOptionTitle,
              selectedCountries.includes(country.id) && styles.selectedFilterOptionText
            ]}>
              {country.label}
            </Text>
            <Text style={[
              styles.filterOptionDescription,
              selectedCountries.includes(country.id) && styles.selectedFilterOptionText
            ]}>
              {country.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game Mode Selection */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Game Mode</Text>
        {gameModes.map((gameMode) => (
          <TouchableOpacity
            key={gameMode.id}
            style={[
              styles.filterOption,
              selectedGameMode === gameMode.id && styles.selectedFilterOption
            ]}
            onPress={() => setSelectedGameMode(gameMode.id)}
          >
            <Text style={[
              styles.filterOptionTitle,
              selectedGameMode === gameMode.id && styles.selectedFilterOptionText
            ]}>
              {gameMode.label}
            </Text>
            <Text style={[
              styles.filterOptionDescription,
              selectedGameMode === gameMode.id && styles.selectedFilterOptionText
            ]}>
              {gameMode.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Question Style Selection */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Question Style</Text>
        {questionStyles.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.filterOption,
              selectedQuestionStyle === style.id && styles.selectedFilterOption
            ]}
            onPress={() => setSelectedQuestionStyle(style.id)}
          >
            <Text style={[
              styles.filterOptionTitle,
              selectedQuestionStyle === style.id && styles.selectedFilterOptionText
            ]}>
              {style.label}
            </Text>
            <Text style={[
              styles.filterOptionDescription,
              selectedQuestionStyle === style.id && styles.selectedFilterOptionText
            ]}>
              {style.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.filterActions}>
        <TouchableOpacity style={styles.button} onPress={handleStartGame}>
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

interface UserProfile {
  totalScore: number;
  gamesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  achievements: string[];
  level: number;
}

interface GameStats {
  currentScore: number;
  questionsAnswered: number;
  correctAnswers: number;
  totalQuestions: number;
  wicketsLost: number; // Wrong answers in unlimited mode
  gameMode: GameMode;
}

const ProfileStatusBar: React.FC<{ 
  profile: UserProfile; 
  gameStats?: GameStats;
  mode: 'lifetime' | 'game';
  onProfilePress: () => void;
}> = ({ profile, gameStats, mode, onProfilePress }) => {
  
  if (mode === 'game' && gameStats) {
    // Game mode: show current game stats with cricket terminology
    const wicketsRemaining = gameStats.gameMode === 'unlimited' ? 5 - gameStats.wicketsLost : null;
    const progressText = gameStats.gameMode === 'fixed' 
      ? `Question ${gameStats.questionsAnswered + 1}/${gameStats.totalQuestions}`
      : `${wicketsRemaining} wickets left`;
    
    return (
      <View style={styles.statusBarContainer}>
        <View style={styles.statusBarExtension} />
        <TouchableOpacity style={styles.profileStatusBar} onPress={onProfilePress}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>🏏</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Batting</Text>
              <Text style={styles.profileLevel}>{progressText}</Text>
            </View>
          </View>
          
          <View style={styles.profileCenter}>
            <Text style={styles.profileStat}>{gameStats.currentScore}</Text>
            <Text style={styles.profileStatLabel}>Runs</Text>
          </View>
          
          <View style={styles.profileRight}>
            <View style={styles.statContainer}>
              <Text style={styles.profileStat}>{gameStats.questionsAnswered}</Text>
              <Text style={styles.profileStatLabel}>Balls Faced</Text>
            </View>
            <View style={styles.settingsIcon}>
              <Text style={styles.settingsText}>📊</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Lifetime mode: show cricket stats
  // Average = Total Runs ÷ Times Out (minimum 1)
  // Strike Rate = (Total Runs ÷ Balls Faced) × 100
  const timesOut = Math.max(profile.questionsAnswered - profile.correctAnswers, 1); // Wrong answers = times out
  const average = profile.totalScore / timesOut;
  const strikeRate = profile.questionsAnswered > 0 ? (profile.totalScore / profile.questionsAnswered) * 100 : 0;
  
  return (
    <View style={styles.statusBarContainer}>
      <View style={styles.statusBarExtension} />
      <TouchableOpacity style={styles.profileStatusBar} onPress={onProfilePress}>
        <View style={styles.profileLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🏏</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Cricket Fan</Text>
            <Text style={styles.profileLevel}>Level {profile.level}</Text>
          </View>
        </View>
        
        <View style={styles.profileCenter}>
          <Text style={styles.profileStat}>{average.toFixed(1)}</Text>
          <Text style={styles.profileStatLabel}>Average</Text>
        </View>
        
        <View style={styles.profileRight}>
          <View style={styles.statContainer}>
            <Text style={styles.profileStat}>{strikeRate.toFixed(0)}</Text>
            <Text style={styles.profileStatLabel}>Strike Rate</Text>
          </View>
          <View style={styles.settingsIcon}>
            <Text style={styles.settingsText}>⚙️</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  GAME_FILTERS: 'gameFilters'
};

// Default profile for new users
const DEFAULT_PROFILE: UserProfile = {
  totalScore: 0,
  gamesPlayed: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  achievements: [],
  level: 1
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [gameFilters, setGameFilters] = useState<GameFilters>({
    era: 'all_eras',
    countries: ['all_countries'],
    questionStyle: 'facts_opinions',
    gameMode: 'fixed'
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const [currentGameStats, setCurrentGameStats] = useState<GameStats>({
    currentScore: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    wicketsLost: 0,
    gameMode: 'fixed'
  });

  // Load data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const savedFilters = await AsyncStorage.getItem(STORAGE_KEYS.GAME_FILTERS);
      
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
      
      if (savedFilters) {
        setGameFilters(JSON.parse(savedFilters));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const handleStartGame = () => {
    setCurrentScreen('game_filters');
  };

  const handleLearnCricketMode = () => {
    setCurrentScreen('learn_cricket');
  };

  const handleStartGameWithFilters = (filters: GameFilters) => {
    setGameFilters(filters);
    setCurrentScreen('game');
  };

  const handleExitGame = () => {
    setCurrentScreen('home');
  };

  const handleProfilePress = () => {
    Alert.alert(
      '🏏 Cricket Profile',
      `Level ${userProfile.level} Cricket Fan\n\n📊 Stats:\n• Games Played: ${userProfile.gamesPlayed}\n• Questions Answered: ${userProfile.questionsAnswered}\n• Accuracy: ${Math.round((userProfile.correctAnswers / userProfile.questionsAnswered) * 100)}%\n• Total Score: ${userProfile.totalScore}\n\n🏆 Achievements: ${userProfile.achievements.join(', ')}\n\n(Profile system coming soon!)`,
      [{ text: 'Close', style: 'default' }]
    );
  };

  const updateUserStats = (correct: boolean, points: number) => {
    const newProfile = {
      ...userProfile,
      questionsAnswered: userProfile.questionsAnswered + 1,
      correctAnswers: userProfile.correctAnswers + (correct ? 1 : 0),
      totalScore: userProfile.totalScore + points,
      level: calculateLevel(userProfile.totalScore + points)
    };
    
    setUserProfile(newProfile);
    saveUserProfile(newProfile); // Persist immediately
  };

  const calculateLevel = (totalScore: number): number => {
    // Level system: Level 1 = 0-99 points, Level 2 = 100-299, etc.
    return Math.floor(totalScore / 100) + 1;
  };

  const updateGameStats = (correct: boolean, points: number, totalQuestions: number) => {
    setCurrentGameStats(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      currentScore: prev.currentScore + points,
      totalQuestions: totalQuestions,
      wicketsLost: prev.wicketsLost + (correct ? 0 : 1) // Increment wickets for wrong answers
    }));
  };

  const resetGameStats = (totalQuestions: number, gameMode: GameMode) => {
    setCurrentGameStats({
      currentScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      totalQuestions: totalQuestions,
      wicketsLost: 0,
      gameMode: gameMode
    });
  };

  if (currentScreen === 'game') {
    return (
      <View style={styles.appContainer}>
        <ProfileStatusBar 
          profile={userProfile} 
          gameStats={currentGameStats}
          mode="game"
          onProfilePress={handleProfilePress} 
        />
        <SafeAreaView style={styles.gameContent}>
          <TriviaGame 
            mode="game" 
            onExit={handleExitGame}
            filters={gameFilters}
            onUpdateStats={updateUserStats}
            onUpdateGameStats={updateGameStats}
            onGameStart={(totalQuestions, gameMode) => resetGameStats(totalQuestions, gameMode)}
          />
        </SafeAreaView>
      </View>
    );
  }


  if (currentScreen === 'game_filters') {
    return (
      <View style={styles.appContainer}>
        <ProfileStatusBar 
          profile={userProfile} 
          mode="lifetime"
          onProfilePress={handleProfilePress} 
        />
        <SafeAreaView style={styles.gameContent}>
          <GameFiltersScreen 
            onStartGame={handleStartGameWithFilters}
            onBack={() => setCurrentScreen('home')}
          />
        </SafeAreaView>
      </View>
    );
  }

  if (currentScreen === 'learn_cricket') {
    return (
      <View style={styles.appContainer}>
        <ProfileStatusBar 
          profile={userProfile} 
          mode="lifetime"
          onProfilePress={handleProfilePress} 
        />
        <SafeAreaView style={styles.gameContent}>
          <LearnCricketScreen onExit={handleExitGame} />
        </SafeAreaView>
      </View>
    );
  }

  // Show loading screen while loading data
  if (isLoading) {
    return (
      <SafeAreaView style={styles.appContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🏏 Loading Cricket Trivia...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.appContainer}>
      <ProfileStatusBar 
        profile={userProfile} 
        mode="lifetime"
        onProfilePress={handleProfilePress} 
      />
      <SafeAreaView style={styles.gameContent}>
        <View style={styles.container}>
          <Text style={styles.title}>🏏 Cricket Trivia</Text>
          <Text style={styles.subtitle}>AI-Powered Cricket Questions</Text>
          
          <TouchableOpacity style={[styles.button, styles.disabledButton]} disabled={true}>
            <Text style={[styles.buttonText, styles.disabledButtonText]}>Start Game</Text>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLearnCricketMode}>
            <Text style={styles.secondaryButtonText}>Learn Cricket</Text>
          </TouchableOpacity>
          
          <StatusBar style="light" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  statusBarContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  statusBarExtension: {
    height: Constants.statusBarHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  gameContent: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  profileStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(144, 238, 144, 0.3)',
    minHeight: 80,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2.5,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(144, 238, 144, 0.4)',
  },
  avatarText: {
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileLevel: {
    color: '#90ee90',
    fontSize: 11,
    fontWeight: '500',
  },
  profileCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.5,
    paddingHorizontal: 8,
  },
  profileRight: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.5,
    flexDirection: 'row',
  },
  profileStat: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileStatLabel: {
    color: '#90ee90',
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
  },
  settingsIcon: {
    marginLeft: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(144, 238, 144, 0.1)',
    borderRadius: 14,
  },
  settingsText: {
    fontSize: 14,
  },
  statContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a472a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#90ee90',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#1a472a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  comingSoonText: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Filter screen styles
  filterScrollContainer: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  filtersContent: {
    padding: 20,
    paddingBottom: 40,
  },
  filtersTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  filterSection: {
    marginBottom: 30,
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#90ee90',
    marginBottom: 15,
  },
  filterOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilterOption: {
    borderColor: '#90ee90',
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
  },
  filterOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  filterOptionDescription: {
    color: '#ccc',
    fontSize: 14,
  },
  selectedFilterOptionText: {
    color: '#90ee90',
  },
  filterActions: {
    marginTop: 20,
    alignItems: 'center',
  },
});
