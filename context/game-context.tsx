'use client';

import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from 'react';
import type { Block, GameState, Settings, ParticleData, GameMode, MergeAnimation } from '@/types/game';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSound } from '@/hooks/use-sound';
import { 
  GRID_COLS, 
  GRID_ROWS, 
  generateRandomValue, 
  generateId,
  DANGER_LINE_ROW,
  gridToPixel
} from '@/utils/constants';
import { getLevelConfig } from '@/utils/game-data';

interface GameContextType {
  gameState: GameState;
  settings: Settings;
  particles: ParticleData[];
  mergeAnimations: MergeAnimation[];
  activePowerup: string | null;
  swapSelection: { col: number; row: number } | null;
  scoreMultiplier: number;
  dropBlock: (preferredCol?: number) => void;
  setSelectedCol: (col: number) => void;
  restartGame: (mode?: GameMode, level?: number) => void;
  toggleSettings: (key: keyof Settings) => void;
  usePowerup: (powerupId: string) => void;
  handlePowerupAction: (col: number, row: number) => void;
  cancelPowerup: () => void;
  undoLastMove: () => void;
  getUndoAvailable: () => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

function createEmptyGrid(): (Block | null)[][] {
  return Array.from({ length: GRID_ROWS }, () => 
    Array.from({ length: GRID_COLS }, () => null)
  );
}

interface GameSnapshot {
  grid: (Block | null)[][];
  score: number;
  nextValue: number;
  currentLevel: number;
  movesLeft: number;
  status: GameState['status'];
  dangerHealth: number;
  dangerCells: number;
  movesSinceAutoUpgrade: number;
  lastAutoUpgrade: GameState['lastAutoUpgrade'];
}

interface AutoUpgradeConfig {
  fillThreshold: number;
  interval: number;
  removableCap: number;
  addedValue: number;
}

const MERGE_SCAN_DELAY_MS = 220;
const MERGE_SLIDE_DURATION_MS = 340;
const MERGE_SOURCE_STAGGER_MS = 80;
const MERGE_EVENT_STAGGER_MS = 80;
const MERGE_DISTANCE_BONUS_MS = 55;
const MERGE_SETTLE_DELAY_MS = 120;
const DANGER_HEALTH_MAX = 3;

function getAutoUpgradeConfig(mode: GameMode, level: number): AutoUpgradeConfig | null {
  if (mode !== 'level' || level < 6) return null;
  if (level <= 10) return { fillThreshold: 0.8, interval: 10, removableCap: 4, addedValue: 8 };
  if (level <= 15) return { fillThreshold: 0.75, interval: 8, removableCap: 8, addedValue: 16 };
  if (level <= 25) return { fillThreshold: 0.7, interval: 6, removableCap: 16, addedValue: 32 };
  return { fillThreshold: 0.65, interval: 5, removableCap: 32, addedValue: 64 };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [bestScore, setBestScore] = useLocalStorage('blocks2048-best', 0);
  const [settings, setSettings] = useLocalStorage<Settings>('blocks2048-settings', {
    soundEnabled: true,
    musicEnabled: false,
    vibrationEnabled: true,
  });
  const initialNextValueRef = useRef<number>(generateRandomValue());
  const spawnHistoryRef = useRef<{ last: number; streak: number }>({
    last: initialNextValueRef.current,
    streak: 1,
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    const levelConfig = getLevelConfig(1);
    return {
      score: 0,
      bestScore,
      nextValue: initialNextValueRef.current,
      grid: createEmptyGrid(),
      status: 'PLAYING',
      comboMultiplier: 1,
      selectedCol: Math.floor(GRID_COLS / 2),
      mode: 'level',
      currentLevel: 1,
      movesLeft: levelConfig.moves,
      highestBlock: 2,
      totalMerges: 0,
      dangerHealth: DANGER_HEALTH_MAX,
      maxDangerHealth: DANGER_HEALTH_MAX,
      dangerCells: 0,
      movesSinceAutoUpgrade: 0,
      lastAutoUpgrade: null,
    };
  });

  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [mergeAnimations, setMergeAnimations] = useState<MergeAnimation[]>([]);
  const [activePowerup, setActivePowerup] = useState<string | null>(null);
  const [swapSelection, setSwapSelection] = useState<{ col: number; row: number } | null>(null);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const comboTimeoutRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const lastSnapshotRef = useRef<GameSnapshot | null>(null);
  const lastDropSignatureRef = useRef<{ col: number; value: number; at: number } | null>(null);

  const { playSound, vibrate, forceVibrate } = useSound(settings.soundEnabled, settings.vibrationEnabled);

  const syncSpawnHistory = useCallback((value: number) => {
    spawnHistoryRef.current = { last: value, streak: 1 };
  }, []);

  const getNextSpawnValue = useCallback((): number => {
    const history = spawnHistoryRef.current;
    let nextValue = generateRandomValue();

    // Prevent long unlucky streaks; never allow 3 identical spawn values in a row.
    if (history.streak >= 2 && nextValue === history.last) {
      let tries = 0;
      while (nextValue === history.last && tries < 12) {
        nextValue = generateRandomValue();
        tries++;
      }
      if (nextValue === history.last) {
        nextValue = history.last === 2 ? 4 : 2;
      }
    }

    if (nextValue === history.last) {
      history.streak += 1;
    } else {
      history.last = nextValue;
      history.streak = 1;
    }
    spawnHistoryRef.current = history;
    return nextValue;
  }, []);

  const createParticles = useCallback((col: number, row: number, value: number, color?: string) => {
    const pos = gridToPixel(col, row);
    const newParticles: ParticleData[] = Array.from({ length: 8 }, (_, i) => ({
      id: `${generateId()}-${i}`,
      x: pos.x,
      y: pos.y,
      color: color || '#FFD700',
      value,
      angleIndex: i,
    }));

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  }, []);

  const findLowestEmptyRow = useCallback((grid: (Block | null)[][], col: number): number => {
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (!grid[row][col]) {
        return row;
      }
    }
    return -1;
  }, []);

  const findNearestAvailableCol = useCallback((grid: (Block | null)[][], startCol: number): number => {
    if (findLowestEmptyRow(grid, startCol) >= 0) return startCol;

    for (let distance = 1; distance < GRID_COLS; distance++) {
      const left = startCol - distance;
      const right = startCol + distance;

      if (left >= 0 && findLowestEmptyRow(grid, left) >= 0) return left;
      if (right < GRID_COLS && findLowestEmptyRow(grid, right) >= 0) return right;
    }

    return -1;
  }, [findLowestEmptyRow]);

  const processMerges = useCallback((
    grid: (Block | null)[][],
    preferredCol?: number,
  ): {
    newGrid: (Block | null)[][];
    merged: boolean;
    mergeEvents: Array<{
      mergedValue: number;
      col: number;
      row: number;
      mergedCount: number;
      sources: Array<{ col: number; row: number; value: number }>;
    }>;
  } => {
    const newGrid = grid.map(row => [...row]);
    const visited = Array.from({ length: GRID_ROWS }, () => Array<boolean>(GRID_COLS).fill(false));
    const mergeEvents: Array<{
      mergedValue: number;
      col: number;
      row: number;
      mergedCount: number;
      sources: Array<{ col: number; row: number; value: number }>;
    }> = [];
    const directions: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    // Merge connected groups together to avoid left/right bias.
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const block = newGrid[row][col];
        if (!block || block.isObstacle || visited[row][col]) continue;

        const cluster: Array<{ row: number; col: number }> = [];
        const queue: Array<{ row: number; col: number }> = [{ row, col }];
        visited[row][col] = true;

        while (queue.length > 0) {
          const cell = queue.shift()!;
          cluster.push(cell);

          for (const [dr, dc] of directions) {
            const nextRow = cell.row + dr;
            const nextCol = cell.col + dc;
            if (nextRow < 0 || nextRow >= GRID_ROWS || nextCol < 0 || nextCol >= GRID_COLS) continue;
            if (visited[nextRow][nextCol]) continue;

            const nextBlock = newGrid[nextRow][nextCol];
            if (!nextBlock || nextBlock.isObstacle || nextBlock.value !== block.value) continue;

            visited[nextRow][nextCol] = true;
            queue.push({ row: nextRow, col: nextCol });
          }
        }

        if (cluster.length < 2) continue;

        const lowestRow = Math.max(...cluster.map(cell => cell.row));
        const lowestCells = cluster.filter(cell => cell.row === lowestRow);
        const averageCol = cluster.reduce((sum, cell) => sum + cell.col, 0) / cluster.length;
        let targetCell = lowestCells[0];

        // If player dropped in this column and that column participates at the
        // merge floor, keep the merged result in that same column.
        let usedPreferredCol = false;
        if (typeof preferredCol === 'number') {
          const preferredCell = lowestCells.find(cell => cell.col === preferredCol);
          if (preferredCell) {
            targetCell = preferredCell;
            usedPreferredCol = true;
          }
        }

        if (!usedPreferredCol) {
          for (const cell of lowestCells) {
            if (Math.abs(cell.col - averageCol) < Math.abs(targetCell.col - averageCol)) {
              targetCell = cell;
            }
          }
        }

        for (const cell of cluster) {
          newGrid[cell.row][cell.col] = null;
        }

        const sources = cluster
          .filter(cell => !(cell.row === targetCell.row && cell.col === targetCell.col))
          .map(cell => ({ col: cell.col, row: cell.row, value: block.value }));

        const mergedValue = block.value * Math.pow(2, cluster.length - 1);
        newGrid[targetCell.row][targetCell.col] = {
          id: generateId(),
          value: mergedValue,
          col: targetCell.col,
          row: targetCell.row,
        };

        mergeEvents.push({
          mergedValue,
          col: targetCell.col,
          row: targetCell.row,
          mergedCount: cluster.length,
          sources,
        });
      }
    }

    return { newGrid, merged: mergeEvents.length > 0, mergeEvents };
  }, []);

  const applyGravity = useCallback((grid: (Block | null)[][]): (Block | null)[][] => {
    const newGrid = grid.map(row => [...row]);

    for (let col = 0; col < GRID_COLS; col++) {
      const blocks: Block[] = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        if (newGrid[row][col]) {
          blocks.push(newGrid[row][col]!);
          newGrid[row][col] = null;
        }
      }

      let targetRow = GRID_ROWS - 1;
      for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        newGrid[targetRow][col] = {
          ...block,
          row: targetRow,
        };
        targetRow--;
      }
    }

    return newGrid;
  }, []);

  const getDangerCells = useCallback((grid: (Block | null)[][]): number => {
    let count = 0;
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[DANGER_LINE_ROW][col]) count++;
    }
    return count;
  }, []);

  const hasAnyDropSpace = useCallback((grid: (Block | null)[][]): boolean => {
    for (let col = 0; col < GRID_COLS; col++) {
      if (!grid[0][col]) return true;
    }
    return false;
  }, []);

  const tryApplyAutoUpgrade = useCallback((
    grid: (Block | null)[][],
    startCol: number,
    mode: GameMode,
    currentLevel: number,
    movesSinceAutoUpgrade: number,
  ): {
    grid: (Block | null)[][];
    didTrigger: boolean;
    nextMovesSinceAutoUpgrade: number;
    removedValue: number | null;
    addedValue: number | null;
  } => {
    const config = getAutoUpgradeConfig(mode, currentLevel);
    const moveCounter = movesSinceAutoUpgrade + 1;

    if (!config || moveCounter < config.interval) {
      return {
        grid,
        didTrigger: false,
        nextMovesSinceAutoUpgrade: moveCounter,
        removedValue: null,
        addedValue: null,
      };
    }

    const filledBlocks: Array<{ row: number; col: number; value: number }> = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const block = grid[row][col];
        if (block && !block.isObstacle) {
          filledBlocks.push({ row, col, value: block.value });
        }
      }
    }

    const fillRatio = filledBlocks.length / (GRID_ROWS * GRID_COLS);
    if (fillRatio < config.fillThreshold) {
      return {
        grid,
        didTrigger: false,
        nextMovesSinceAutoUpgrade: moveCounter,
        removedValue: null,
        addedValue: null,
      };
    }

    const lowCandidates = filledBlocks
      .filter(block => block.value <= config.removableCap)
      .sort((a, b) => {
        if (a.value !== b.value) return a.value - b.value;
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });

    const removed = lowCandidates[0];
    if (!removed) {
      return {
        grid,
        didTrigger: false,
        nextMovesSinceAutoUpgrade: moveCounter,
        removedValue: null,
        addedValue: null,
      };
    }

    const nextGrid = grid.map(row => [...row]);
    nextGrid[removed.row][removed.col] = null;
    const compactedGrid = applyGravity(nextGrid);

    let spawnCol = Math.max(0, Math.min(GRID_COLS - 1, startCol));
    let spawnRow = findLowestEmptyRow(compactedGrid, spawnCol);
    if (spawnRow < 0) {
      const fallbackCol = findNearestAvailableCol(compactedGrid, spawnCol);
      if (fallbackCol >= 0) {
        spawnCol = fallbackCol;
        spawnRow = findLowestEmptyRow(compactedGrid, spawnCol);
      }
    }

    if (spawnRow < 0) {
      return {
        grid: compactedGrid,
        didTrigger: false,
        nextMovesSinceAutoUpgrade: moveCounter,
        removedValue: null,
        addedValue: null,
      };
    }

    compactedGrid[spawnRow][spawnCol] = {
      id: generateId(),
      value: config.addedValue,
      col: spawnCol,
      row: spawnRow,
    };

    return {
      grid: compactedGrid,
      didTrigger: true,
      nextMovesSinceAutoUpgrade: 0,
      removedValue: removed.value,
      addedValue: config.addedValue,
    };
  }, [applyGravity, findLowestEmptyRow, findNearestAvailableCol]);

  const dropBlock = useCallback((preferredCol?: number) => {
    if (gameState.status !== 'PLAYING' || isProcessingRef.current || activePowerup) return;

    let col = typeof preferredCol === 'number'
      ? Math.max(0, Math.min(GRID_COLS - 1, preferredCol))
      : gameState.selectedCol;
    const now = performance.now();
    const signature = { col, value: gameState.nextValue, at: now };
    const lastSignature = lastDropSignatureRef.current;
    if (
      lastSignature &&
      lastSignature.col === signature.col &&
      lastSignature.value === signature.value &&
      now - lastSignature.at < 220
    ) {
      return;
    }
    lastDropSignatureRef.current = signature;
    isProcessingRef.current = true;

    let targetRow = findLowestEmptyRow(gameState.grid, col);

    if (targetRow < 0) {
      const fallbackCol = findNearestAvailableCol(gameState.grid, col);
      if (fallbackCol >= 0) {
        col = fallbackCol;
        targetRow = findLowestEmptyRow(gameState.grid, col);
        if (col !== gameState.selectedCol) {
          setGameState(prev => ({ ...prev, selectedCol: col }));
        }
      }
    }

    if (targetRow < 0) {
      if (!hasAnyDropSpace(gameState.grid)) {
        setGameState(prev => ({
          ...prev,
          status: 'GAME_OVER',
          dangerCells: getDangerCells(prev.grid),
        }));
        playSound('gameOver');
        vibrate([100, 50, 100]);
      }
      isProcessingRef.current = false;
      return;
    }

    const consumedValue = gameState.nextValue;
    const upcomingNextValue = getNextSpawnValue();

    // Save snapshot for undo
    lastSnapshotRef.current = {
      grid: gameState.grid.map(row => [...row]),
      score: gameState.score,
      nextValue: gameState.nextValue,
      currentLevel: gameState.currentLevel,
      movesLeft: gameState.movesLeft,
      status: gameState.status,
      dangerHealth: gameState.dangerHealth,
      dangerCells: gameState.dangerCells,
      movesSinceAutoUpgrade: gameState.movesSinceAutoUpgrade,
      lastAutoUpgrade: gameState.lastAutoUpgrade,
    };

    playSound('drop');

    const newBlock: Block = {
      id: generateId(),
      value: consumedValue,
      col,
      row: targetRow,
    };

    const newGrid = gameState.grid.map(row => [...row]);
    newGrid[targetRow][col] = newBlock;

    let totalScore = 0;
    let comboCount = 0;
    let highestMerged = gameState.highestBlock;
    let mergesToAdd = 0;

    // First place the block with animation
    setGameState((prev) => ({
      ...prev,
      grid: newGrid,
      nextValue: upcomingNextValue,
    }));

    // Process merges with delay for satisfying animation
    const processMergesWithDelay = async () => {
      let currentGrid = newGrid;
      let keepProcessing = true;

      while (keepProcessing) {
        await new Promise(resolve => setTimeout(resolve, MERGE_SCAN_DELAY_MS));
        
        const { newGrid: mergedGrid, merged, mergeEvents } = processMerges(currentGrid, col);

        if (merged) {
          const animationGrid = currentGrid.map(row => [...row]);
          const animationStart = performance.now();
          const nextAnimations: MergeAnimation[] = [];
          let longestAnimationMs = 0;
          let strongestMerge = 0;

          mergeEvents.forEach((event, eventIndex) => {
            comboCount++;
            mergesToAdd += event.mergedCount - 1;
            highestMerged = Math.max(highestMerged, event.mergedValue);
            strongestMerge = Math.max(strongestMerge, event.mergedValue);
            const multiplier = (1 + (comboCount - 1) * 0.5) * scoreMultiplier;
            totalScore += Math.floor(event.mergedValue * multiplier);

            const orderedSources = [...event.sources].sort((a, b) => {
              const distanceA = Math.abs(a.col - event.col) + Math.abs(a.row - event.row);
              const distanceB = Math.abs(b.col - event.col) + Math.abs(b.row - event.row);
              return distanceB - distanceA;
            });

            orderedSources.forEach((src, sourceIndex) => {
              animationGrid[src.row][src.col] = null;

              const distance = Math.abs(src.col - event.col) + Math.abs(src.row - event.row);
              const delay = eventIndex * MERGE_EVENT_STAGGER_MS + sourceIndex * MERGE_SOURCE_STAGGER_MS;
              const duration = Math.min(
                420,
                MERGE_SLIDE_DURATION_MS + Math.max(0, distance - 1) * MERGE_DISTANCE_BONUS_MS,
              );

              longestAnimationMs = Math.max(longestAnimationMs, delay + duration);
              nextAnimations.push({
                id: generateId(),
                value: src.value,
                fromCol: src.col,
                fromRow: src.row,
                toCol: event.col,
                toRow: event.row,
                startAt: animationStart + delay,
                duration,
              });

              // Emit spark at the source just before movement begins so merge flow reads clearly.
              window.setTimeout(() => {
                createParticles(src.col, src.row, src.value, '#f59e0b');
              }, Math.max(0, delay - 16));
            });
          });

          setMergeAnimations(nextAnimations);
          setGameState(prev => ({
            ...prev,
            grid: animationGrid,
            comboMultiplier: 1 + comboCount * 0.5,
          }));

          const animationWindowMs = longestAnimationMs > 0 ? longestAnimationMs : MERGE_SLIDE_DURATION_MS;
          await new Promise(resolve => setTimeout(resolve, animationWindowMs));
          setMergeAnimations([]);

          if (strongestMerge > 0) {
            playSound('merge', strongestMerge);
            vibrate(50);
            for (const event of mergeEvents) {
              createParticles(event.col, event.row, event.mergedValue);
            }
          }

          const gravityGrid = applyGravity(mergedGrid);
          currentGrid = gravityGrid;
          
          // Update grid to show animation
          setGameState(prev => ({
            ...prev,
            grid: gravityGrid,
            comboMultiplier: 1 + comboCount * 0.5,
          }));
          await new Promise(resolve => setTimeout(resolve, MERGE_SETTLE_DELAY_MS));
        } else {
          keepProcessing = false;
        }
      }

      setMergeAnimations([]);

      let didGameOver = false;

      setGameState((prev) => {
        const autoUpgrade = tryApplyAutoUpgrade(
          currentGrid,
          prev.selectedCol,
          prev.mode,
          prev.currentLevel,
          prev.movesSinceAutoUpgrade,
        );
        const gridForState = autoUpgrade.grid;
        const dangerCells = getDangerCells(gridForState);
        let nextDangerHealth = prev.dangerHealth;
        if (dangerCells === 0) {
          nextDangerHealth = prev.maxDangerHealth;
        } else if (dangerCells > prev.dangerCells) {
          nextDangerHealth = Math.max(0, prev.dangerHealth - 1);
        } else if (dangerCells < prev.dangerCells) {
          nextDangerHealth = Math.min(prev.maxDangerHealth, prev.dangerHealth + 1);
        }
        const newMovesLeft = prev.mode === 'level' && prev.movesLeft > 0
          ? prev.movesLeft - 1
          : prev.movesLeft;
        const moveLimitReached = prev.mode === 'level' && prev.movesLeft > 0 && newMovesLeft === 0;
        const isGameOver = nextDangerHealth <= 0 || moveLimitReached;
        const newScore = prev.score + totalScore;
        const newBestScore = Math.max(newScore, prev.bestScore);
        
        if (newBestScore > bestScore) {
          setBestScore(newBestScore);
        }

        didGameOver = isGameOver;

        return {
          ...prev,
          grid: gridForState,
          score: newScore,
          bestScore: newBestScore,
          status: isGameOver ? 'GAME_OVER' : 'PLAYING',
          comboMultiplier: comboCount > 0 ? 1 + comboCount * 0.5 : 1,
          movesLeft: newMovesLeft,
          highestBlock: highestMerged,
          totalMerges: prev.totalMerges + mergesToAdd,
          dangerHealth: nextDangerHealth,
          maxDangerHealth: prev.maxDangerHealth,
          dangerCells,
          movesSinceAutoUpgrade: autoUpgrade.nextMovesSinceAutoUpgrade,
          lastAutoUpgrade: autoUpgrade.didTrigger && autoUpgrade.removedValue !== null && autoUpgrade.addedValue !== null
            ? { removedValue: autoUpgrade.removedValue, addedValue: autoUpgrade.addedValue }
            : null,
        };
      });

      if (didGameOver) {
        playSound('gameOver');
        vibrate([100, 50, 100]);
      }

      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
      comboTimeoutRef.current = window.setTimeout(() => {
        setGameState((prev) => ({ ...prev, comboMultiplier: 1 }));
      }, 2000);

      isProcessingRef.current = false;
    };

    processMergesWithDelay();
  }, [
    gameState.status, 
    gameState.selectedCol, 
    gameState.grid, 
    gameState.nextValue,
    gameState.currentLevel,
    gameState.movesLeft,
    gameState.score,
    gameState.highestBlock,
    gameState.dangerHealth,
    gameState.dangerCells,
    gameState.movesSinceAutoUpgrade,
    gameState.lastAutoUpgrade,
    activePowerup,
    scoreMultiplier,
    findLowestEmptyRow, 
    findNearestAvailableCol,
    processMerges, 
    applyGravity, 
    tryApplyAutoUpgrade,
    getDangerCells,
    hasAnyDropSpace,
    createParticles, 
    playSound, 
    vibrate, 
    bestScore, 
    setBestScore,
    getNextSpawnValue
  ]);

  const setSelectedCol = useCallback((col: number) => {
    setGameState((prev) => ({
      ...prev,
      selectedCol: Math.max(0, Math.min(GRID_COLS - 1, col)),
    }));
  }, []);

  const restartGame = useCallback((mode: GameMode = 'level', level: number = 1) => {
    const levelConfig = getLevelConfig(level);
    const restartNextValue = generateRandomValue();
    syncSpawnHistory(restartNextValue);
    lastSnapshotRef.current = null;
    lastDropSignatureRef.current = null;
    setGameState({
      score: 0,
      bestScore,
      nextValue: restartNextValue,
      grid: createEmptyGrid(),
      status: 'PLAYING',
      comboMultiplier: 1,
      selectedCol: Math.floor(GRID_COLS / 2),
      mode,
      currentLevel: mode === 'level' ? level : 1,
      movesLeft: mode === 'level' ? levelConfig.moves : -1,
      highestBlock: 2,
      totalMerges: 0,
      dangerHealth: DANGER_HEALTH_MAX,
      maxDangerHealth: DANGER_HEALTH_MAX,
      dangerCells: 0,
      movesSinceAutoUpgrade: 0,
      lastAutoUpgrade: null,
    });
    setSwapSelection(null);
    setActivePowerup(null);
    setScoreMultiplier(1);
    setMergeAnimations([]);
    playSound('click');
  }, [bestScore, playSound, syncSpawnHistory]);

  const toggleSettings = useCallback((key: keyof Settings) => {
    setSettings((prev) => {
      const nextValue = !prev[key];
      if (key === 'vibrationEnabled' && nextValue) {
        forceVibrate(60);
      }
      return {
        ...prev,
        [key]: nextValue,
      };
    });
  }, [setSettings, forceVibrate]);

  // Powerup handling
  const usePowerup = useCallback((powerupId: string) => {
    if (isProcessingRef.current || gameState.status !== 'PLAYING') return;

    setSwapSelection(null);
    setActivePowerup(powerupId);
  }, [gameState.status]);

  const handlePowerupAction = useCallback((col: number, row: number) => {
    if (!activePowerup || gameState.status !== 'PLAYING' || isProcessingRef.current) return;

    const block = gameState.grid[row]?.[col];

    if (activePowerup === 'hammer' && block && !block.isObstacle) {
      setGameState(prev => {
        const newGrid = prev.grid.map(r => [...r]);
        newGrid[row][col] = null;
        return { ...prev, grid: applyGravity(newGrid) };
      });
      createParticles(col, row, block.value, '#ff6b6b');
      playSound('merge', 64);
      setSwapSelection(null);
      setActivePowerup(null);
      return;
    }

    if (activePowerup === 'swap' && block && !block.isObstacle) {
      const firstSelection = swapSelection;
      if (!firstSelection) {
        setSwapSelection({ col, row });
        playSound('click');
        return;
      }

      if (firstSelection.col === col && firstSelection.row === row) {
        setSwapSelection(null);
        setActivePowerup(null);
        playSound('click');
        return;
      }

      setGameState(prev => {
        const newGrid = prev.grid.map(r => [...r]);
        const firstBlock = newGrid[firstSelection.row][firstSelection.col];
        const secondBlock = newGrid[row][col];
        if (!firstBlock || !secondBlock || firstBlock.isObstacle || secondBlock.isObstacle) return prev;

        newGrid[firstSelection.row][firstSelection.col] = {
          ...secondBlock,
          col: firstSelection.col,
          row: firstSelection.row,
        };
        newGrid[row][col] = {
          ...firstBlock,
          col,
          row,
        };
        return { ...prev, grid: newGrid };
      });
      createParticles(firstSelection.col, firstSelection.row, block.value, '#38bdf8');
      createParticles(col, row, block.value, '#38bdf8');
      playSound('merge', 128);
      setSwapSelection(null);
      setActivePowerup(null);
      return;
    }
  }, [activePowerup, gameState.grid, gameState.status, applyGravity, createParticles, playSound, swapSelection]);

  const cancelPowerup = useCallback(() => {
    setSwapSelection(null);
    setActivePowerup(null);
  }, []);

  const undoLastMove = useCallback(() => {
    const snapshot = lastSnapshotRef.current;
    if (!snapshot) return;
    
    setGameState(prev => ({
      ...prev,
      grid: snapshot.grid,
      score: snapshot.score,
      nextValue: snapshot.nextValue,
      currentLevel: snapshot.currentLevel,
      movesLeft: snapshot.movesLeft,
      status: snapshot.status,
      dangerHealth: snapshot.dangerHealth,
      dangerCells: snapshot.dangerCells,
      movesSinceAutoUpgrade: snapshot.movesSinceAutoUpgrade,
      lastAutoUpgrade: snapshot.lastAutoUpgrade,
    }));
    
    syncSpawnHistory(snapshot.nextValue);
    lastDropSignatureRef.current = null;
    lastSnapshotRef.current = null;
    setSwapSelection(null);
    setActivePowerup(null);
    playSound('click');
  }, [playSound, syncSpawnHistory]);

  const getUndoAvailable = useCallback(() => {
    return lastSnapshotRef.current !== null;
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        settings,
        particles,
        mergeAnimations,
        activePowerup,
        swapSelection,
        scoreMultiplier,
        dropBlock,
        setSelectedCol,
        restartGame,
        toggleSettings,
        usePowerup,
        handlePowerupAction,
        cancelPowerup,
        undoLastMove,
        getUndoAvailable,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
