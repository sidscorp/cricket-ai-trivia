/**
 * Reusable Game Timer Hook
 * 
 * A flexible timer system that can be configured for different game modes.
 * Supports countdown/countup, pause/resume, and callbacks.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerConfig {
  mode?: 'countdown' | 'countup';
  initialTime?: number; // in seconds
  onTick?: (timeElapsed: number, timeRemaining: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export interface TimerState {
  elapsed: number;
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
}

export const useGameTimer = (config: TimerConfig = {}) => {
  const {
    mode = 'countup',
    initialTime = 0,
    onTick,
    onComplete,
    autoStart = false
  } = config;

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Calculate remaining time for countdown mode
  const remaining = mode === 'countdown' ? Math.max(0, initialTime - elapsed) : 0;

  // Start the timer
  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [isRunning]);

  // Pause the timer
  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      pausedTimeRef.current = elapsed * 1000; // Convert to milliseconds
      setIsPaused(true);
    }
  }, [isRunning, isPaused, elapsed]);

  // Resume the timer
  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      setIsPaused(false);
    }
  }, [isRunning, isPaused]);

  // Stop and reset the timer
  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsed(0);
    pausedTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset without stopping
  const reset = useCallback(() => {
    setElapsed(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = Date.now();
  }, []);

  // Get current time in seconds
  const getCurrentTime = useCallback(() => {
    if (!isRunning) return elapsed;
    if (isPaused) return elapsed;
    
    const currentElapsed = (Date.now() - startTimeRef.current) / 1000;
    return Math.floor(currentElapsed);
  }, [isRunning, isPaused, elapsed]);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const newElapsed = getCurrentTime();
        setElapsed(newElapsed);

        // Check for countdown completion
        if (mode === 'countdown' && newElapsed >= initialTime) {
          stop();
          onComplete?.();
          return;
        }

        // Call onTick callback
        const newRemaining = mode === 'countdown' ? Math.max(0, initialTime - newElapsed) : 0;
        onTick?.(newElapsed, newRemaining);
      }, 100); // Update every 100ms for smooth display

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isRunning, isPaused, mode, initialTime, getCurrentTime, stop, onTick, onComplete]);

  return {
    // State
    elapsed,
    remaining,
    isRunning,
    isPaused,
    
    // Controls
    start,
    pause,
    resume,
    stop,
    reset,
    
    // Utility
    getCurrentTime,
  };
};

// Preset configurations for common use cases
export const TimerPresets = {
  // For Learn Cricket mode - count up to track response time
  learnCricket: {
    mode: 'countup' as const,
    autoStart: false,
  },
  
  // For future rapid fire mode - 30 second countdown
  rapidFire: {
    mode: 'countdown' as const,
    initialTime: 30,
    autoStart: true,
  },
  
  // For future timed challenge - 5 minute countdown
  timedChallenge: {
    mode: 'countdown' as const,
    initialTime: 300,
    autoStart: false,
  },
};