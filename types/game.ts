export type GameStatus = 'READY' | 'PLAYING' | 'DROPPING' | 'MERGING' | 'GAME_OVER' | 'PAUSED' | 'LEVEL_COMPLETE';
export type GameMode = 'endless' | 'level';

export interface Block {
  id: string;
  value: number;
  col: number;
  row: number;
  isObstacle?: boolean;
  targetRow?: number;
  animating?: boolean;
}

export interface GameState {
  score: number;
  bestScore: number;
  nextValue: number;
  grid: (Block | null)[][];
  status: GameStatus;
  comboMultiplier: number;
  selectedCol: number;
  mode: GameMode;
  currentLevel: number;
  movesLeft: number;
  highestBlock: number;
  totalMerges: number;
  dangerHealth: number;
  maxDangerHealth: number;
  dangerCells: number;
  movesSinceAutoUpgrade: number;
  lastAutoUpgrade: {
    removedValue: number;
    addedValue: number;
  } | null;
}

export interface PlayerProgress {
  currentLevel: number;
  totalXp: number;
  gems: number;
  coins: number;
  gamesPlayed: number;
  totalScore: number;
  highestCombo: number;
  highestBlock: number;
  totalMerges: number;
  unlockedThemes: string[];
  equippedTheme: string;
  unlockedBgImages: string[];
  equippedBgImage: string;
  customBgImage: string | null; // base64 or objectURL
  powerups: Record<string, number>;
  achievements: string[];
  dailyChallengeDate: string;
  dailyChallengeProgress: Record<string, number>;
  completedDailyChallenges: string[];
}

export interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  color: string;
  value: number;
  angleIndex?: number;
}

export interface MergeAnimation {
  id: string;
  value: number;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  startAt: number;
  duration: number;
}

export interface AnimatingBlock extends Block {
  startY: number;
  endY: number;
  progress: number;
}

export const DEFAULT_PLAYER_PROGRESS: PlayerProgress = {
  currentLevel: 1,
  totalXp: 0,
  gems: 150,
  coins: 0,
  gamesPlayed: 0,
  totalScore: 0,
  highestCombo: 0,
  highestBlock: 2,
  totalMerges: 0,
  unlockedThemes: ['obsidian'],
  equippedTheme: 'obsidian',
  unlockedBgImages: ['none'],
  equippedBgImage: 'none',
  customBgImage: null,
  powerups: { hammer: 2, swap: 1, undo: 3 },
  achievements: [],
  dailyChallengeDate: '',
  dailyChallengeProgress: {},
  completedDailyChallenges: [],
};
