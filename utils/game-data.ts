// Level System - 1000 levels with progressive difficulty
export interface LevelConfig {
  level: number;
  targetScore: number;
  moves: number;
  specialBlocks: boolean;
  obstacleChance: number;
  powerupReward: string | null;
  gemsReward: number;
  xpReward: number;
}

const TARGET_BASE = 1024;
const targetByLevel: number[] = [0, TARGET_BASE];

function getTargetGrowthConfig(level: number): { growth: number; flatBonus: number } {
  if (level <= 10) return { growth: 1.16, flatBonus: 120 };
  if (level <= 20) return { growth: 1.18, flatBonus: 180 };
  if (level <= 40) return { growth: 1.2, flatBonus: 240 };
  if (level <= 80) return { growth: 1.22, flatBonus: 320 };
  return { growth: 1.24, flatBonus: 420 };
}

function getLevelTarget(level: number): number {
  const clampedLevel = Math.max(1, Math.floor(level));

  for (let current = targetByLevel.length; current <= clampedLevel; current++) {
    const prevTarget = targetByLevel[current - 1];
    const { growth, flatBonus } = getTargetGrowthConfig(current);
    const milestoneBonus = current % 10 === 0 ? Math.floor(current / 10) * 150 : 0;
    targetByLevel[current] = Math.floor(prevTarget * growth + flatBonus + milestoneBonus);
  }

  return targetByLevel[clampedLevel];
}

export function getLevelConfig(level: number): LevelConfig {
  const targetScore = getLevelTarget(level);
  const baseMoves = level <= 10 ? -1 : Math.max(15, 40 - Math.floor(level / 10));
  const obstacleChance = level < 20 ? 0 : Math.min(0.15, (level - 20) * 0.002);
  const powerupReward = level % 25 === 0 ? getRandomPowerup() : null;
  const gemsReward = Math.floor(5 + level * 0.3 + (level % 10 === 0 ? 20 : 0));
  const xpReward = Math.floor(50 + level * 2);
  return { level, targetScore, moves: baseMoves, specialBlocks: level >= 15, obstacleChance, powerupReward, gemsReward, xpReward };
}

function getRandomPowerup(): string {
  const powerups = ['hammer', 'swap', 'undo'];
  return powerups[Math.floor(Math.random() * powerups.length)];
}

// Themes
export interface Theme {
  id: string;
  name: string;
  price: number;
  currency: 'gems' | 'coins';
  unlockLevel?: number;
  colors: {
    bg: string;         // flat solid color for the full-screen background
    gridBg: string;
    cellBg: string;
    cellEmpty: string;
    text: string;
    accent: string;
    danger: string;
    uiBg: string;       // slightly translucent overlay for HUD elements
    uiText: string;
  };
  blockColors: Record<number, { bg: string; text: string }>;
}

// Background images users can purchase / use
export interface BgImage {
  id: string;
  name: string;
  price: number;
  currency: 'gems' | 'coins';
  unlockLevel?: number;
  url: string | null; // null means user-uploaded
}

export const BG_IMAGES: BgImage[] = [
  { id: 'none', name: 'Solid Color', price: 0, currency: 'gems', url: null },
  { id: 'stars', name: 'Starfield', price: 120, currency: 'gems', unlockLevel: 2, url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=60' },
  { id: 'mountain', name: 'Mountain', price: 220, currency: 'gems', unlockLevel: 8, url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=60' },
  { id: 'aurora', name: 'Aurora', price: 420, currency: 'gems', unlockLevel: 20, url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&q=60' },
  { id: 'ocean', name: 'Deep Ocean', price: 650, currency: 'gems', unlockLevel: 35, url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=60' },
  { id: 'custom', name: 'Your Photo', price: 350, currency: 'gems', unlockLevel: 12, url: null },
];

export const THEMES: Theme[] = [
  {
    id: 'logo',
    name: 'Logo',
    price: 0,
    currency: 'gems',
    colors: {
      bg: '#0f172a',
      gridBg: '#0a101e',
      cellBg: 'rgba(148,163,184,0.1)',
      cellEmpty: 'rgba(148,163,184,0.06)',
      text: '#f1f5f9',
      accent: '#3b82f6',
      danger: 'rgba(239,68,68,0.28)',
      uiBg: 'rgba(15,23,42,0.9)',
      uiText: '#f1f5f9',
    },
    blockColors: {
      2: { bg: '#06b6d4', text: '#ffffff' },
      4: { bg: '#3b82f6', text: '#ffffff' },
      8: { bg: '#f59e0b', text: '#ffffff' },
      16: { bg: '#ef4444', text: '#ffffff' },
      32: { bg: '#dc2626', text: '#ffffff' },
      64: { bg: '#0891b2', text: '#ffffff' },
      128: { bg: '#2563eb', text: '#ffffff' },
      256: { bg: '#d97706', text: '#ffffff' },
      512: { bg: '#8b5cf6', text: '#ffffff' },
      1024: { bg: '#ec4899', text: '#ffffff' },
      2048: { bg: '#facc15', text: '#422006' },
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    price: 0,
    currency: 'gems',
    colors: {
      bg: '#101014',
      gridBg: '#1a1a22',
      cellBg: 'rgba(255,255,255,0.06)',
      cellEmpty: 'rgba(255,255,255,0.03)',
      text: '#e4e4e7',
      accent: '#f59e0b',
      danger: 'rgba(239,68,68,0.25)',
      uiBg: 'rgba(26,26,34,0.85)',
      uiText: '#e4e4e7',
    },
    blockColors: {
      2: { bg: '#27272a', text: '#a1a1aa' },
      4: { bg: '#3f3f46', text: '#e4e4e7' },
      8: { bg: '#f59e0b', text: '#451a03' },
      16: { bg: '#f97316', text: '#fff' },
      32: { bg: '#ef4444', text: '#fff' },
      64: { bg: '#dc2626', text: '#fff' },
      128: { bg: '#06b6d4', text: '#083344' },
      256: { bg: '#14b8a6', text: '#042f2e' },
      512: { bg: '#22c55e', text: '#052e16' },
      1024: { bg: '#eab308', text: '#422006' },
      2048: { bg: '#facc15', text: '#422006' },
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    price: 250,
    currency: 'gems',
    unlockLevel: 3,
    colors: {
      bg: '#1e293b',
      gridBg: '#0f172a',
      cellBg: 'rgba(148,163,184,0.1)',
      cellEmpty: 'rgba(148,163,184,0.05)',
      text: '#f1f5f9',
      accent: '#38bdf8',
      danger: 'rgba(251,113,133,0.25)',
      uiBg: 'rgba(15,23,42,0.9)',
      uiText: '#f1f5f9',
    },
    blockColors: {
      2: { bg: '#334155', text: '#cbd5e1' },
      4: { bg: '#475569', text: '#f1f5f9' },
      8: { bg: '#0ea5e9', text: '#fff' },
      16: { bg: '#38bdf8', text: '#0c4a6e' },
      32: { bg: '#06b6d4', text: '#fff' },
      64: { bg: '#14b8a6', text: '#fff' },
      128: { bg: '#10b981', text: '#022c22' },
      256: { bg: '#84cc16', text: '#1a2e05' },
      512: { bg: '#facc15', text: '#422006' },
      1024: { bg: '#fb923c', text: '#fff' },
      2048: { bg: '#f43f5e', text: '#fff' },
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    price: 500,
    currency: 'gems',
    unlockLevel: 10,
    colors: {
      bg: '#1c1210',
      gridBg: '#271a16',
      cellBg: 'rgba(251,146,60,0.08)',
      cellEmpty: 'rgba(251,146,60,0.04)',
      text: '#fef3c7',
      accent: '#f97316',
      danger: 'rgba(239,68,68,0.3)',
      uiBg: 'rgba(39,26,22,0.9)',
      uiText: '#fef3c7',
    },
    blockColors: {
      2: { bg: '#44312a', text: '#d6b99d' },
      4: { bg: '#5c3d2e', text: '#fde68a' },
      8: { bg: '#ea580c', text: '#fff' },
      16: { bg: '#f97316', text: '#fff' },
      32: { bg: '#ef4444', text: '#fff' },
      64: { bg: '#dc2626', text: '#fff' },
      128: { bg: '#fbbf24', text: '#451a03' },
      256: { bg: '#fde68a', text: '#78350f' },
      512: { bg: '#a855f7', text: '#fff' },
      1024: { bg: '#c084fc', text: '#3b0764' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'frost',
    name: 'Frost',
    price: 800,
    currency: 'gems',
    unlockLevel: 25,
    colors: {
      bg: '#0c1929',
      gridBg: '#0e2240',
      cellBg: 'rgba(186,230,253,0.08)',
      cellEmpty: 'rgba(186,230,253,0.04)',
      text: '#e0f2fe',
      accent: '#22d3ee',
      danger: 'rgba(251,113,133,0.25)',
      uiBg: 'rgba(14,34,64,0.9)',
      uiText: '#e0f2fe',
    },
    blockColors: {
      2: { bg: '#164e63', text: '#a5f3fc' },
      4: { bg: '#155e75', text: '#cffafe' },
      8: { bg: '#06b6d4', text: '#fff' },
      16: { bg: '#22d3ee', text: '#083344' },
      32: { bg: '#67e8f9', text: '#083344' },
      64: { bg: '#a5f3fc', text: '#083344' },
      128: { bg: '#818cf8', text: '#fff' },
      256: { bg: '#a78bfa', text: '#1e1b4b' },
      512: { bg: '#c4b5fd', text: '#1e1b4b' },
      1024: { bg: '#fbbf24', text: '#78350f' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'verdant',
    name: 'Verdant',
    price: 1200,
    currency: 'gems',
    unlockLevel: 50,
    colors: {
      bg: '#0a1a0f',
      gridBg: '#0f2918',
      cellBg: 'rgba(134,239,172,0.07)',
      cellEmpty: 'rgba(134,239,172,0.03)',
      text: '#dcfce7',
      accent: '#4ade80',
      danger: 'rgba(251,113,133,0.25)',
      uiBg: 'rgba(15,41,24,0.9)',
      uiText: '#dcfce7',
    },
    blockColors: {
      2: { bg: '#14532d', text: '#86efac' },
      4: { bg: '#166534', text: '#bbf7d0' },
      8: { bg: '#22c55e', text: '#052e16' },
      16: { bg: '#4ade80', text: '#052e16' },
      32: { bg: '#86efac', text: '#052e16' },
      64: { bg: '#bbf7d0', text: '#052e16' },
      128: { bg: '#eab308', text: '#422006' },
      256: { bg: '#facc15', text: '#422006' },
      512: { bg: '#f97316', text: '#fff' },
      1024: { bg: '#ef4444', text: '#fff' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    price: 2000,
    currency: 'gems',
    unlockLevel: 100,
    colors: {
      bg: '#1a0f18',
      gridBg: '#2a1526',
      cellBg: 'rgba(244,114,182,0.08)',
      cellEmpty: 'rgba(244,114,182,0.04)',
      text: '#fce7f3',
      accent: '#f472b6',
      danger: 'rgba(239,68,68,0.3)',
      uiBg: 'rgba(42,21,38,0.9)',
      uiText: '#fce7f3',
    },
    blockColors: {
      2: { bg: '#4a1942', text: '#f9a8d4' },
      4: { bg: '#6b2160', text: '#fbcfe8' },
      8: { bg: '#ec4899', text: '#fff' },
      16: { bg: '#f472b6', text: '#831843' },
      32: { bg: '#f9a8d4', text: '#831843' },
      64: { bg: '#fbcfe8', text: '#831843' },
      128: { bg: '#a855f7', text: '#fff' },
      256: { bg: '#c084fc', text: '#3b0764' },
      512: { bg: '#06b6d4', text: '#fff' },
      1024: { bg: '#fbbf24', text: '#78350f' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'duskwave',
    name: 'Duskwave',
    price: 2600,
    currency: 'gems',
    unlockLevel: 120,
    colors: {
      bg: '#160f22',
      gridBg: '#24173a',
      cellBg: 'rgba(196,181,253,0.1)',
      cellEmpty: 'rgba(196,181,253,0.05)',
      text: '#ede9fe',
      accent: '#a78bfa',
      danger: 'rgba(251,113,133,0.28)',
      uiBg: 'rgba(36,23,58,0.88)',
      uiText: '#ede9fe',
    },
    blockColors: {
      2: { bg: '#3b2a62', text: '#c4b5fd' },
      4: { bg: '#4c357f', text: '#ddd6fe' },
      8: { bg: '#7c3aed', text: '#ffffff' },
      16: { bg: '#8b5cf6', text: '#ede9fe' },
      32: { bg: '#a78bfa', text: '#312e81' },
      64: { bg: '#c4b5fd', text: '#312e81' },
      128: { bg: '#22d3ee', text: '#083344' },
      256: { bg: '#38bdf8', text: '#082f49' },
      512: { bg: '#f472b6', text: '#831843' },
      1024: { bg: '#f59e0b', text: '#451a03' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    price: 3200,
    currency: 'gems',
    unlockLevel: 160,
    colors: {
      bg: '#071a22',
      gridBg: '#0d2a36',
      cellBg: 'rgba(103,232,249,0.1)',
      cellEmpty: 'rgba(103,232,249,0.05)',
      text: '#e0f7ff',
      accent: '#22d3ee',
      danger: 'rgba(248,113,113,0.3)',
      uiBg: 'rgba(13,42,54,0.88)',
      uiText: '#e0f7ff',
    },
    blockColors: {
      2: { bg: '#164e63', text: '#a5f3fc' },
      4: { bg: '#0e7490', text: '#e0f2fe' },
      8: { bg: '#06b6d4', text: '#083344' },
      16: { bg: '#22d3ee', text: '#083344' },
      32: { bg: '#67e8f9', text: '#0c4a6e' },
      64: { bg: '#a5f3fc', text: '#0c4a6e' },
      128: { bg: '#2dd4bf', text: '#042f2e' },
      256: { bg: '#34d399', text: '#064e3b' },
      512: { bg: '#4ade80', text: '#052e16' },
      1024: { bg: '#f59e0b', text: '#451a03' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'solstice',
    name: 'Solstice',
    price: 4000,
    currency: 'gems',
    unlockLevel: 220,
    colors: {
      bg: '#24130b',
      gridBg: '#3b2115',
      cellBg: 'rgba(253,186,116,0.1)',
      cellEmpty: 'rgba(253,186,116,0.05)',
      text: '#fff7ed',
      accent: '#fb923c',
      danger: 'rgba(239,68,68,0.3)',
      uiBg: 'rgba(59,33,21,0.9)',
      uiText: '#fff7ed',
    },
    blockColors: {
      2: { bg: '#7c2d12', text: '#fdba74' },
      4: { bg: '#9a3412', text: '#fed7aa' },
      8: { bg: '#ea580c', text: '#fff7ed' },
      16: { bg: '#f97316', text: '#fff7ed' },
      32: { bg: '#fb923c', text: '#7c2d12' },
      64: { bg: '#fdba74', text: '#7c2d12' },
      128: { bg: '#facc15', text: '#422006' },
      256: { bg: '#fde047', text: '#422006' },
      512: { bg: '#fb7185', text: '#881337' },
      1024: { bg: '#a78bfa', text: '#312e81' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    price: 4800,
    currency: 'gems',
    unlockLevel: 280,
    colors: {
      bg: '#0b1020',
      gridBg: '#141d36',
      cellBg: 'rgba(165,180,252,0.11)',
      cellEmpty: 'rgba(165,180,252,0.05)',
      text: '#e5e7eb',
      accent: '#818cf8',
      danger: 'rgba(244,114,182,0.26)',
      uiBg: 'rgba(20,29,54,0.9)',
      uiText: '#e5e7eb',
    },
    blockColors: {
      2: { bg: '#1e3a8a', text: '#bfdbfe' },
      4: { bg: '#1d4ed8', text: '#dbeafe' },
      8: { bg: '#3b82f6', text: '#eff6ff' },
      16: { bg: '#60a5fa', text: '#1e3a8a' },
      32: { bg: '#818cf8', text: '#312e81' },
      64: { bg: '#a5b4fc', text: '#312e81' },
      128: { bg: '#c4b5fd', text: '#3b0764' },
      256: { bg: '#d8b4fe', text: '#581c87' },
      512: { bg: '#f472b6', text: '#831843' },
      1024: { bg: '#22d3ee', text: '#083344' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
  {
    id: 'synth',
    name: 'Synth Neon',
    price: 6000,
    currency: 'gems',
    unlockLevel: 350,
    colors: {
      bg: '#060b14',
      gridBg: '#0f1726',
      cellBg: 'rgba(45,212,191,0.12)',
      cellEmpty: 'rgba(45,212,191,0.05)',
      text: '#d1fae5',
      accent: '#2dd4bf',
      danger: 'rgba(251,113,133,0.3)',
      uiBg: 'rgba(15,23,38,0.9)',
      uiText: '#d1fae5',
    },
    blockColors: {
      2: { bg: '#064e3b', text: '#6ee7b7' },
      4: { bg: '#065f46', text: '#a7f3d0' },
      8: { bg: '#10b981', text: '#022c22' },
      16: { bg: '#34d399', text: '#022c22' },
      32: { bg: '#2dd4bf', text: '#042f2e' },
      64: { bg: '#67e8f9', text: '#083344' },
      128: { bg: '#22d3ee', text: '#083344' },
      256: { bg: '#38bdf8', text: '#082f49' },
      512: { bg: '#818cf8', text: '#312e81' },
      1024: { bg: '#f472b6', text: '#831843' },
      2048: { bg: '#fef08a', text: '#713f12' },
    },
  },
];

// Powerups
export interface Powerup {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  currency: 'gems';
  effect: string;
}

export const POWERUPS: Powerup[] = [
  { id: 'hammer', name: 'Hammer', description: 'Remove any single block', icon: 'hammer', price: 100, currency: 'gems', effect: 'remove_single' },
  { id: 'swap', name: 'Swap', description: 'Swap positions of two blocks', icon: 'swap', price: 150, currency: 'gems', effect: 'swap_two' },
  { id: 'undo', name: 'Undo', description: 'Revert last move', icon: 'undo', price: 75, currency: 'gems', effect: 'undo' },
];

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'score' | 'level' | 'merges' | 'combo' | 'games' | 'block_value';
  reward: { gems: number; xp: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_merge', name: 'First Steps', description: 'Perform your first merge', icon: 'star', requirement: 1, type: 'merges', reward: { gems: 10, xp: 50 } },
  { id: 'score_1000', name: 'Getting Started', description: 'Score 1,000 points', icon: 'trophy', requirement: 1000, type: 'score', reward: { gems: 25, xp: 100 } },
  { id: 'score_10000', name: 'High Roller', description: 'Score 10,000 points', icon: 'trophy', requirement: 10000, type: 'score', reward: { gems: 100, xp: 500 } },
  { id: 'score_100000', name: 'Point Master', description: 'Score 100,000 points', icon: 'crown', requirement: 100000, type: 'score', reward: { gems: 500, xp: 2000 } },
  { id: 'level_10', name: 'Rising Star', description: 'Reach level 10', icon: 'trending-up', requirement: 10, type: 'level', reward: { gems: 50, xp: 200 } },
  { id: 'level_50', name: 'Dedicated', description: 'Reach level 50', icon: 'award', requirement: 50, type: 'level', reward: { gems: 200, xp: 1000 } },
  { id: 'level_100', name: 'Centurion', description: 'Reach level 100', icon: 'medal', requirement: 100, type: 'level', reward: { gems: 500, xp: 5000 } },
  { id: 'level_500', name: 'Veteran', description: 'Reach level 500', icon: 'shield', requirement: 500, type: 'level', reward: { gems: 2000, xp: 20000 } },
  { id: 'level_1000', name: 'Legendary', description: 'Reach level 1000', icon: 'gem', requirement: 1000, type: 'level', reward: { gems: 10000, xp: 100000 } },
  { id: 'combo_3', name: 'Combo Starter', description: 'Get a 3x combo', icon: 'zap', requirement: 3, type: 'combo', reward: { gems: 30, xp: 150 } },
  { id: 'combo_5', name: 'Combo Master', description: 'Get a 5x combo', icon: 'zap', requirement: 5, type: 'combo', reward: { gems: 75, xp: 400 } },
  { id: 'combo_10', name: 'Combo Legend', description: 'Get a 10x combo', icon: 'flame', requirement: 10, type: 'combo', reward: { gems: 250, xp: 1500 } },
  { id: 'block_128', name: 'Power of Two', description: 'Create a 128 block', icon: 'box', requirement: 128, type: 'block_value', reward: { gems: 50, xp: 250 } },
  { id: 'block_512', name: 'Big Numbers', description: 'Create a 512 block', icon: 'box', requirement: 512, type: 'block_value', reward: { gems: 150, xp: 750 } },
  { id: 'block_2048', name: 'The Ultimate', description: 'Create a 2048 block', icon: 'sparkles', requirement: 2048, type: 'block_value', reward: { gems: 1000, xp: 5000 } },
  { id: 'games_10', name: 'Regular', description: 'Play 10 games', icon: 'gamepad', requirement: 10, type: 'games', reward: { gems: 25, xp: 100 } },
  { id: 'games_100', name: 'Addict', description: 'Play 100 games', icon: 'gamepad', requirement: 100, type: 'games', reward: { gems: 200, xp: 1000 } },
];

// Daily Challenges
export interface DailyChallenge {
  id: string;
  type: 'score' | 'merges' | 'level' | 'combo' | 'block_value';
  target: number;
  reward: { gems: number; xp: number };
  description: string;
}

export function generateDailyChallenge(seed: number): DailyChallenge[] {
  const challenges: DailyChallenge[] = [];
  const types: Array<'score' | 'merges' | 'level' | 'combo' | 'block_value'> = ['score', 'merges', 'level', 'combo', 'block_value'];
  for (let i = 0; i < 3; i++) {
    const type = types[(seed + i) % types.length];
    let target: number;
    let description: string;
    let reward: { gems: number; xp: number };
    switch (type) {
      case 'score': target = 5000 + (seed % 10) * 1000; description = `Score ${target.toLocaleString()} points`; reward = { gems: 50 + (seed % 5) * 10, xp: 200 }; break;
      case 'merges': target = 20 + (seed % 5) * 5; description = `Perform ${target} merges`; reward = { gems: 30 + (seed % 5) * 5, xp: 150 }; break;
      case 'level': target = 1 + (seed % 3); description = `Complete ${target} level${target > 1 ? 's' : ''}`; reward = { gems: 40 + (seed % 5) * 10, xp: 250 }; break;
      case 'combo': target = 3 + (seed % 3); description = `Achieve a ${target}x combo`; reward = { gems: 60 + (seed % 5) * 15, xp: 300 }; break;
      case 'block_value': { const values = [64, 128, 256, 512]; target = values[seed % values.length]; description = `Create a ${target} block`; reward = { gems: 45 + (seed % 5) * 10, xp: 200 }; break; }
    }
    challenges.push({ id: `daily_${i}_${seed}`, type, target, description, reward });
  }
  return challenges;
}

export function getPlayerLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  let totalXp = 0;
  let nextLevelXp = 100;
  while (totalXp + nextLevelXp <= xp) {
    totalXp += nextLevelXp;
    level++;
    nextLevelXp = Math.floor(100 * Math.pow(1.15, level - 1));
  }
  return { level, currentXp: xp - totalXp, nextLevelXp };
}
