import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { TriviaGame } from './TriviaGame';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  const handlePracticeMode = () => {
    setCurrentScreen('practice');
  };

  const handleExitGame = () => {
    setCurrentScreen('home');
  };

  if (currentScreen === 'game' || currentScreen === 'practice') {
    return (
      <TriviaGame 
        mode={currentScreen as 'game' | 'practice'} 
        onExit={handleExitGame}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏏 Cricket Trivia</Text>
      <Text style={styles.subtitle}>AI-Powered Cricket Questions</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleStartGame}>
        <Text style={styles.buttonText}>Start Game</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={handlePracticeMode}>
        <Text style={styles.secondaryButtonText}>Practice Mode</Text>
      </TouchableOpacity>
      
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
