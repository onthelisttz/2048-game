'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { PlayerProgress } from '@/types/game';
import { DEFAULT_PLAYER_PROGRESS } from '@/types/game';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { THEMES, ACHIEVEMENTS, BG_IMAGES, generateDailyChallenge } from '@/utils/game-data';
import { IS_DEVELOPMENT } from '@/utils/config';
import { isAdsConfigured, showRewardedAd } from '@/utils/ads';

interface AchievementResult {
  id: string;
  name: string;
  reward: { gems: number; xp: number };
}

interface PlayerContextType {
  progress: PlayerProgress;
  addGems: (amount: number) => void;
  claimAdGems: () => Promise<boolean>;
  spendGems: (amount: number) => boolean;
  unlockTheme: (themeId: string) => boolean;
  equipTheme: (themeId: string) => void;
  unlockBgImage: (bgId: string) => boolean;
  equipBgImage: (bgId: string) => void;
  setCustomBgImage: (dataUrl: string) => boolean;
  addPowerup: (powerupId: string, amount?: number) => void;
  usePowerup: (powerupId: string) => boolean;
  completeLevel: (gemsReward: number) => void;
  checkAchievement: (type: string, value: number) => AchievementResult[];
  getDailyChallenges: () => ReturnType<typeof generateDailyChallenge>;
  updateDailyProgress: (type: string, value: number) => void;
  recordGameStats: (score: number, highestBlock: number, merges: number, combo: number) => void;
  getCurrentTheme: () => typeof THEMES[0];
  getCurrentBgImage: () => string | null;
  isDev: boolean;
  adsEnabled: boolean;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useLocalStorage<PlayerProgress>('blocks2048-progress', DEFAULT_PLAYER_PROGRESS);
  const adsEnabled = IS_DEVELOPMENT || isAdsConfigured();

  const addGems = useCallback((amount: number) => {
    setProgress(prev => ({ ...prev, gems: prev.gems + amount }));
  }, [setProgress]);

  const claimAdGems = useCallback(async (): Promise<boolean> => {
    if (IS_DEVELOPMENT) {
      setProgress(prev => ({ ...prev, gems: prev.gems + 20 }));
      return true;
    }

    if (!isAdsConfigured()) return false;

    const rewarded = await showRewardedAd();
    if (!rewarded) return false;

    setProgress(prev => ({ ...prev, gems: prev.gems + 20 }));
    return true;
  }, [setProgress]);

  const spendGems = useCallback((amount: number): boolean => {
    if (IS_DEVELOPMENT) return true; // free in dev
    if (progress.gems < amount) return false;
    setProgress(prev => ({ ...prev, gems: prev.gems - amount }));
    return true;
  }, [progress.gems, setProgress]);

  const unlockTheme = useCallback((themeId: string): boolean => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme || progress.unlockedThemes.includes(themeId)) return false;

    if (IS_DEVELOPMENT) {
      setProgress(prev => ({ ...prev, unlockedThemes: [...prev.unlockedThemes, themeId] }));
      return true;
    }

    const canAfford = progress.gems >= theme.price;
    if (!canAfford) return false;
    if (theme.unlockLevel && progress.currentLevel < theme.unlockLevel) return false;

    setProgress(prev => ({
      ...prev,
      gems: prev.gems - theme.price,
      unlockedThemes: [...prev.unlockedThemes, themeId],
    }));
    return true;
  }, [progress, setProgress]);

  const equipTheme = useCallback((themeId: string) => {
    if (IS_DEVELOPMENT || progress.unlockedThemes.includes(themeId)) {
      setProgress(prev => ({ ...prev, equippedTheme: themeId }));
    }
  }, [progress.unlockedThemes, setProgress]);

  const unlockBgImage = useCallback((bgId: string): boolean => {
    if (progress.unlockedBgImages.includes(bgId)) return false;
    const bg = BG_IMAGES.find(b => b.id === bgId);
    if (!bg) return false;

    if (IS_DEVELOPMENT) {
      setProgress(prev => ({ ...prev, unlockedBgImages: [...prev.unlockedBgImages, bgId] }));
      return true;
    }

    const canAfford = progress.gems >= bg.price;
    if (!canAfford) return false;
    if (bg.unlockLevel && progress.currentLevel < bg.unlockLevel) return false;

    setProgress(prev => ({
      ...prev,
      gems: prev.gems - bg.price,
      unlockedBgImages: [...prev.unlockedBgImages, bgId],
    }));
    return true;
  }, [progress, setProgress]);

  const equipBgImage = useCallback((bgId: string) => {
    if (bgId === 'custom' && !progress.customBgImage && !IS_DEVELOPMENT) return;
    if (IS_DEVELOPMENT || progress.unlockedBgImages.includes(bgId)) {
      setProgress(prev => ({ ...prev, equippedBgImage: bgId }));
    }
  }, [progress.unlockedBgImages, progress.customBgImage, setProgress]);

  const setCustomBgImage = useCallback((dataUrl: string): boolean => {
    const customUnlocked = IS_DEVELOPMENT || progress.unlockedBgImages.includes('custom');
    if (!customUnlocked) return false;

    setProgress(prev => ({
      ...prev,
      customBgImage: dataUrl,
      equippedBgImage: 'custom',
      unlockedBgImages: prev.unlockedBgImages.includes('custom') ? prev.unlockedBgImages : [...prev.unlockedBgImages, 'custom'],
    }));
    return true;
  }, [progress.unlockedBgImages, setProgress]);

  const addPowerup = useCallback((powerupId: string, amount: number = 1) => {
    setProgress(prev => ({
      ...prev,
      powerups: { ...prev.powerups, [powerupId]: (prev.powerups[powerupId] || 0) + amount },
    }));
  }, [setProgress]);

  const usePowerup = useCallback((powerupId: string): boolean => {
    if (IS_DEVELOPMENT) return true;
    const count = progress.powerups[powerupId] || 0;
    if (count <= 0) return false;
    setProgress(prev => ({
      ...prev,
      powerups: { ...prev.powerups, [powerupId]: prev.powerups[powerupId] - 1 },
    }));
    return true;
  }, [progress.powerups, setProgress]);

  const completeLevel = useCallback((gemsReward: number) => {
    setProgress(prev => ({
      ...prev,
      currentLevel: Math.min(prev.currentLevel + 1, 1000),
      gems: prev.gems + gemsReward,
    }));
  }, [setProgress]);

  const checkAchievement = useCallback((type: string, value: number): AchievementResult[] => {
    const newAchievements: AchievementResult[] = [];
    ACHIEVEMENTS.forEach(a => {
      if (progress.achievements.includes(a.id) || a.type !== type || value < a.requirement) return;
      newAchievements.push({ id: a.id, name: a.name, reward: a.reward });
    });
    if (newAchievements.length > 0) {
      setProgress(prev => {
        let totalGems = 0;
        newAchievements.forEach(a => { totalGems += a.reward.gems; });
        return { ...prev, achievements: [...prev.achievements, ...newAchievements.map(a => a.id)], gems: prev.gems + totalGems };
      });
    }
    return newAchievements;
  }, [progress.achievements, setProgress]);

  const getDailyChallenges = useCallback(() => {
    const seed = new Date().getDate() + new Date().getMonth() * 31;
    return generateDailyChallenge(seed);
  }, []);

  const updateDailyProgress = useCallback((type: string, value: number) => {
    const today = new Date().toDateString();
    setProgress(prev => {
      if (prev.dailyChallengeDate !== today) {
        return { ...prev, dailyChallengeDate: today, dailyChallengeProgress: { [type]: value }, completedDailyChallenges: [] };
      }
      const current = prev.dailyChallengeProgress[type] || 0;
      const updated = type === 'score' || type === 'merges' ? current + value : Math.max(current, value);
      return { ...prev, dailyChallengeProgress: { ...prev.dailyChallengeProgress, [type]: updated } };
    });
  }, [setProgress]);

  const recordGameStats = useCallback((score: number, highestBlock: number, merges: number, combo: number) => {
    setProgress(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      totalScore: prev.totalScore + score,
      highestBlock: Math.max(prev.highestBlock, highestBlock),
      highestCombo: Math.max(prev.highestCombo, combo),
      totalMerges: prev.totalMerges + merges,
    }));
  }, [setProgress]);

  const getCurrentTheme = useCallback(() => {
    return THEMES.find(t => t.id === progress.equippedTheme) || THEMES[0];
  }, [progress.equippedTheme]);

  const getCurrentBgImage = useCallback((): string | null => {
    if (progress.equippedBgImage === 'none') return null;
    if (progress.equippedBgImage === 'custom') return progress.customBgImage;
    const bg = BG_IMAGES.find(b => b.id === progress.equippedBgImage);
    return bg?.url || null;
  }, [progress.equippedBgImage, progress.customBgImage]);

  return (
    <PlayerContext.Provider value={{
      progress, addGems, claimAdGems, spendGems,
      unlockTheme, equipTheme, unlockBgImage, equipBgImage, setCustomBgImage,
      addPowerup, usePowerup, completeLevel, checkAchievement,
      getDailyChallenges, updateDailyProgress, recordGameStats,
      getCurrentTheme, getCurrentBgImage,
      isDev: IS_DEVELOPMENT,
      adsEnabled,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
