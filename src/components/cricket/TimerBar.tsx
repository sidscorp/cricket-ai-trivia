/**
 * Visual Timer Bar Component
 * 
 * Displays a countdown timer as a visual bar that changes color
 * based on the scoring thresholds.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CRICKET_CONSTANTS } from '../../types/Cricket';

interface TimerBarProps {
  elapsed: number;
  isRunning: boolean;
  maxTime?: number; // Maximum time before dot ball
}

export const TimerBar: React.FC<TimerBarProps> = ({ 
  elapsed, 
  isRunning,
  maxTime = 15 
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  
  // Calculate progress percentage
  const progress = Math.min((elapsed / maxTime) * 100, 100);
  
  // Determine color based on time elapsed
  const getBarColor = () => {
    if (elapsed < CRICKET_CONSTANTS.TIMING_THRESHOLDS.SIX) {
      return '#4caf50'; // Green for 6
    } else if (elapsed < CRICKET_CONSTANTS.TIMING_THRESHOLDS.FOUR) {
      return '#ff9800'; // Orange for 4
    } else if (elapsed < CRICKET_CONSTANTS.TIMING_THRESHOLDS.SINGLE) {
      return '#ffeb3b'; // Yellow for 1
    } else {
      return '#f44336'; // Red for dot ball
    }
  };
  
  // Get scoring label
  const getScoringLabel = () => {
    if (elapsed < CRICKET_CONSTANTS.TIMING_THRESHOLDS.SIX) {
      return 'SIX!';
    } else if (elapsed < CRICKET_CONSTANTS.TIMING_THRESHOLDS.FOUR) {
      return 'FOUR!';
    } else if (elapsed < CRICKET_CONSTANTS.TIMING_THRESHOLDS.SINGLE) {
      return 'Single';
    } else {
      return 'Dot Ball';
    }
  };

  // Animate the bar width
  useEffect(() => {
    if (isRunning) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    } else {
      // Reset when not running
      animatedWidth.setValue(0);
    }
  }, [progress, isRunning]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Response Time</Text>
        {isRunning && (
          <Text style={[styles.scoring, { color: getBarColor() }]}>
            {getScoringLabel()}
          </Text>
        )}
        <Text style={styles.timer}>{elapsed.toFixed(1)}s</Text>
      </View>
      
      <View style={styles.barContainer}>
        <Animated.View 
          style={[
            styles.bar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: getBarColor(),
            }
          ]}
        />
        
        {/* Threshold markers */}
        <View style={[styles.marker, { left: `${(CRICKET_CONSTANTS.TIMING_THRESHOLDS.SIX / maxTime) * 100}%` }]}>
          <Text style={styles.markerText}>6</Text>
        </View>
        <View style={[styles.marker, { left: `${(CRICKET_CONSTANTS.TIMING_THRESHOLDS.FOUR / maxTime) * 100}%` }]}>
          <Text style={styles.markerText}>4</Text>
        </View>
        <View style={[styles.marker, { left: `${(CRICKET_CONSTANTS.TIMING_THRESHOLDS.SINGLE / maxTime) * 100}%` }]}>
          <Text style={styles.markerText}>1</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#90ee90',
    fontSize: 12,
  },
  scoring: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timer: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  bar: {
    height: '100%',
    borderRadius: 15,
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
  },
  markerText: {
    position: 'absolute',
    top: -20,
    left: -5,
    color: '#90ee90',
    fontSize: 10,
    fontWeight: 'bold',
  },
});