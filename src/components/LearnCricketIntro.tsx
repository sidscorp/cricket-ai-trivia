/**
 * Learn Cricket Introduction Popup
 * 
 * Modal that explains the game rules when entering Learn Cricket mode.
 * Includes "Don't show again" option stored in AsyncStorage.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LearnCricketIntroProps {
  visible: boolean;
  onDismiss: () => void;
  onStartGame: () => void;
}

const DONT_SHOW_KEY = 'learn_cricket_intro_dont_show';

export const LearnCricketIntro: React.FC<LearnCricketIntroProps> = ({
  visible,
  onDismiss,
  onStartGame,
}) => {

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Learn Cricket Mode</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onDismiss}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Welcome to Learn Cricket - an adaptive learning experience!
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How to Play</Text>
              <Text style={styles.rule}>
                • You have 2 overs (12 questions) to score runs
              </Text>
              <Text style={styles.rule}>
                • Answer quickly to score more runs:
              </Text>
              <View style={styles.scoringTable}>
                <View style={styles.scoringRow}>
                  <Text style={styles.scoringTime}>Under 3 seconds</Text>
                  <Text style={styles.scoringRuns}>SIX! (6 runs)</Text>
                </View>
                <View style={styles.scoringRow}>
                  <Text style={styles.scoringTime}>Under 5 seconds</Text>
                  <Text style={styles.scoringRuns}>FOUR! (4 runs)</Text>
                </View>
                <View style={styles.scoringRow}>
                  <Text style={styles.scoringTime}>Under 10 seconds</Text>
                  <Text style={styles.scoringRuns}>Single (1 run)</Text>
                </View>
                <View style={styles.scoringRow}>
                  <Text style={styles.scoringTime}>Over 10 seconds</Text>
                  <Text style={styles.scoringRuns}>Dot Ball (0 runs)</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wickets System</Text>
              <Text style={styles.rule}>
                • You start with 5 wickets (lives)
              </Text>
              <Text style={styles.rule}>
                • Each wrong answer costs 1 wicket
              </Text>
              <Text style={styles.rule}>
                • Game ends when you lose all wickets or complete 2 overs
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Adaptive Learning</Text>
              <Text style={styles.rule}>
                • Questions adapt to your knowledge level
              </Text>
              <Text style={styles.rule}>
                • AI remembers your strengths and weaknesses
              </Text>
              <Text style={styles.rule}>
                • Focus on areas where you need improvement
              </Text>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={20} color="#f39c12" />
              <Text style={styles.tipText}>
                Tip: Answer quickly but accurately to maximize your score!
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={onDismiss}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={onStartGame}
              >
                <Text style={styles.startButtonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: width * 0.95,
    maxWidth: 600,
    height: '85%',
    maxHeight: 700,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a472a',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a472a',
    marginBottom: 10,
  },
  rule: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 10,
  },
  scoringTable: {
    marginTop: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
  },
  scoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoringTime: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  scoringRuns: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a472a',
    flex: 1,
    textAlign: 'right',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#1a472a',
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1a472a',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#1a472a',
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1a472a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#1a472a',
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});