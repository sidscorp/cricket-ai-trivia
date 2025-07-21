/**
 * Cricket Scorecard Component
 * 
 * Displays the current game state in cricket format with
 * runs, wickets, overs, and additional statistics.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CricketGameState } from '../../types/Cricket';
import { Ionicons } from '@expo/vector-icons';
import { BallTracker } from './BallTracker';

interface CricketScorecardProps {
  gameState: CricketGameState;
  totalWickets: number;
  totalOvers?: number;
}

export const CricketScorecard: React.FC<CricketScorecardProps> = ({
  gameState,
  totalWickets,
  totalOvers = 2,
}) => {
  /**
   * Render wickets as cricket stumps
   */
  const renderWickets = () => {
    const wickets = [];
    for (let i = 0; i < totalWickets; i++) {
      const isLost = i < gameState.wickets;
      wickets.push(
        <View key={i} style={styles.wicketContainer}>
          <Ionicons 
            name={isLost ? "close-circle" : "radio-button-on"} 
            size={24} 
            color={isLost ? "#f44336" : "#4caf50"} 
          />
        </View>
      );
    }
    return wickets;
  };

  /**
   * Format strike rate with appropriate color
   */
  const getStrikeRateColor = () => {
    if (gameState.strikeRate >= 150) return '#4caf50';
    if (gameState.strikeRate >= 100) return '#ff9800';
    return '#f44336';
  };

  return (
    <View style={styles.container}>
      {/* Main Score Display */}
      <View style={styles.mainScore}>
        <Text style={styles.runs}>{gameState.runs}</Text>
        <Text style={styles.separator}>/</Text>
        <Text style={styles.wickets}>{gameState.wickets}</Text>
        <Text style={styles.overs}>({gameState.overs} overs)</Text>
      </View>

      {/* Wickets Visual */}
      <View style={styles.wicketsRow}>
        {renderWickets()}
      </View>

      {/* Statistics Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Run Rate</Text>
          <Text style={styles.statValue}>{gameState.runRate.toFixed(1)}</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Strike Rate</Text>
          <Text style={[styles.statValue, { color: getStrikeRateColor() }]}>
            {gameState.strikeRate.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Boundaries Counter */}
      <View style={styles.boundariesRow}>
        <View style={styles.boundaryItem}>
          <Text style={styles.boundaryLabel}>4s</Text>
          <Text style={styles.boundaryValue}>{gameState.boundaries.fours}</Text>
        </View>
        
        <View style={styles.boundaryItem}>
          <Text style={styles.boundaryLabel}>6s</Text>
          <Text style={styles.boundaryValue}>{gameState.boundaries.sixes}</Text>
        </View>
        
        <View style={styles.boundaryItem}>
          <Text style={styles.boundaryLabel}>Dots</Text>
          <Text style={styles.boundaryValue}>{gameState.dotBalls}</Text>
        </View>
      </View>
      
      {/* Ball Tracker */}
      <BallTracker 
        ballResults={gameState.ballResults}
        currentBall={gameState.balls}
        totalOvers={totalOvers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  mainScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 15,
  },
  runs: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  separator: {
    fontSize: 28,
    color: '#90ee90',
    marginHorizontal: 5,
  },
  wickets: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f44336',
  },
  overs: {
    fontSize: 18,
    color: '#90ee90',
    marginLeft: 10,
  },
  wicketsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  wicketContainer: {
    marginHorizontal: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#90ee90',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(144, 238, 144, 0.3)',
  },
  boundariesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(144, 238, 144, 0.2)',
  },
  boundaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boundaryLabel: {
    fontSize: 14,
    color: '#90ee90',
    marginRight: 8,
  },
  boundaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});