/**
 * Ball Tracker Component
 * 
 * Displays ball-by-ball results for each over in a cricket match.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BallResult } from '../../types/Cricket';

interface BallTrackerProps {
  ballResults: BallResult[];
  currentBall: number;
  totalOvers: number;
}

export const BallTracker: React.FC<BallTrackerProps> = ({
  ballResults,
  currentBall,
  totalOvers,
}) => {
  /**
   * Get style for ball based on result
   */
  const getBallStyle = (result: BallResult) => {
    switch (result) {
      case '6':
        return styles.six;
      case '4':
        return styles.four;
      case '1':
        return styles.single;
      case '0':
        return styles.dot;
      case 'W':
        return styles.wicket;
      default:
        return styles.notBowled;
    }
  };

  /**
   * Get text color for ball result
   */
  const getTextColor = (result: BallResult) => {
    switch (result) {
      case '6':
      case '4':
        return '#fff';
      case 'W':
        return '#fff';
      default:
        return '#333';
    }
  };

  /**
   * Render balls for each over
   */
  const renderOvers = () => {
    const overs = [];
    const ballsPerOver = 6;
    
    for (let over = 0; over < totalOvers; over++) {
      const overBalls = [];
      
      for (let ball = 0; ball < ballsPerOver; ball++) {
        const index = over * ballsPerOver + ball;
        const result = ballResults[index];
        const isCurrent = index === currentBall;
        
        overBalls.push(
          <View 
            key={`${over}-${ball}`} 
            style={[
              styles.ball,
              getBallStyle(result),
              isCurrent && styles.currentBall
            ]}
          >
            <Text style={[
              styles.ballText,
              { color: getTextColor(result) }
            ]}>
              {result === '-' ? '' : result}
            </Text>
          </View>
        );
      }
      
      overs.push(
        <View key={over} style={styles.over}>
          <Text style={styles.overLabel}>Over {over + 1}</Text>
          <View style={styles.ballsContainer}>
            {overBalls}
          </View>
        </View>
      );
    }
    
    return overs;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ball by Ball</Text>
      {renderOvers()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  title: {
    color: '#90ee90',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  over: {
    marginBottom: 10,
  },
  overLabel: {
    color: '#90ee90',
    fontSize: 10,
    marginBottom: 4,
  },
  ballsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ball: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 5,
  },
  ballText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  six: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  four: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  single: {
    backgroundColor: '#ffeb3b',
    borderColor: '#ffeb3b',
  },
  dot: {
    backgroundColor: '#e0e0e0',
    borderColor: '#e0e0e0',
  },
  wicket: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  notBowled: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currentBall: {
    borderWidth: 2,
    borderColor: '#fff',
  },
});