'use client';

import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'drop' | 'merge' | 'gameOver' | 'click';

const createOscillator = (
  audioContext: AudioContext,
  frequency: number,
  type: OscillatorType,
  duration: number,
  gain: number = 0.3
) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export function useSound(enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType, value?: number) => {
    if (!enabled) return;
    
    try {
      const ctx = getAudioContext();
      
      switch (type) {
        case 'drop':
          createOscillator(ctx, 200, 'sine', 0.15, 0.2);
          break;
        case 'merge':
          const baseFreq = 300 + (value ? Math.log2(value) * 50 : 0);
          createOscillator(ctx, baseFreq, 'sine', 0.2, 0.25);
          setTimeout(() => {
            createOscillator(ctx, baseFreq * 1.5, 'sine', 0.15, 0.2);
          }, 50);
          break;
        case 'gameOver':
          createOscillator(ctx, 400, 'sawtooth', 0.1, 0.15);
          setTimeout(() => createOscillator(ctx, 300, 'sawtooth', 0.1, 0.15), 100);
          setTimeout(() => createOscillator(ctx, 200, 'sawtooth', 0.3, 0.15), 200);
          break;
        case 'click':
          createOscillator(ctx, 600, 'sine', 0.05, 0.1);
          break;
      }
    } catch (error) {
      console.log('[v0] Sound error:', error);
    }
  }, [enabled, getAudioContext]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (enabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [enabled]);

  return { playSound, vibrate };
}
