'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useGame } from '@/context/game-context';
import { usePlayer } from '@/context/player-context';
import {
  GAME_WIDTH, GAME_HEIGHT, GRID_COLS, GRID_ROWS,
  CELL_SIZE, CELL_GAP, GRID_PADDING,
  GRID_WIDTH, GRID_HEIGHT,
  DANGER_LINE_ROW, DROP_Y, gridToPixel, pixelToCol
} from '@/utils/constants';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const { gameState, mergeAnimations, dropBlock, setSelectedCol, activePowerup, swapSelection, handlePowerupAction } = useGame();
  const { getCurrentTheme } = usePlayer();
  const theme = getCurrentTheme();

  const getBlockColor = useCallback((value: number) => {
    return theme.blockColors[value] || { bg: '#3C3A32', text: '#f59e0b' };
  }, [theme]);

  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };

  const drawBlock = useCallback((
    ctx: CanvasRenderingContext2D, x: number, y: number, value: number,
    size: number = CELL_SIZE - 4, isObstacle?: boolean, isDanger?: boolean
  ) => {
    const colors = isObstacle
      ? { bg: '#52525b', text: '#a1a1aa' }
      : isDanger
        ? { bg: '#dc2626', text: '#fee2e2' }
        : getBlockColor(value);
    const r = 8;
    // Shadow
    ctx.beginPath();
    ctx.roundRect(x - size / 2 + 1, y - size / 2 + 2, size, size, r);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    // Block body
    ctx.beginPath();
    ctx.roundRect(x - size / 2, y - size / 2, size, size, r);
    const grad = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
    grad.addColorStop(0, adjustColor(colors.bg, 12));
    grad.addColorStop(1, adjustColor(colors.bg, -12));
    ctx.fillStyle = grad;
    ctx.fill();
    // Inner highlight
    ctx.beginPath();
    ctx.roundRect(x - size / 2 + 2, y - size / 2 + 2, size - 4, size * 0.3, [r - 1, r - 1, 0, 0]);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    // Number
    if (!isObstacle) {
      const fontSize = value >= 1000 ? 12 : value >= 100 ? 15 : 19;
      ctx.font = `700 ${fontSize}px 'Geist', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillText(value.toString(), x + 0.5, y + 1);
      ctx.fillStyle = colors.text;
      ctx.fillText(value.toString(), x, y);
    } else {
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '700 16px "Geist", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('X', x, y);
    }
  }, [getBlockColor]);

  const easeInOutCubic = (t: number): number => {
    if (t < 0.5) return 4 * t * t * t;
    return 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const getSmoothMergePosition = useCallback((
    from: { x: number; y: number },
    to: { x: number; y: number },
    t: number,
  ): { x: number; y: number } => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const crossesRows = dy !== 0;
    const crossesCols = dx !== 0;

    if (!crossesRows || !crossesCols) {
      return {
        x: from.x + dx * t,
        y: from.y + dy * t,
      };
    }

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const signX = Math.sign(dx);
    const signY = Math.sign(dy);
    const radius = Math.min(CELL_SIZE * 0.28, absDx / 2, absDy / 2);

    if (radius <= 0.001) {
      return {
        x: from.x + dx * t,
        y: from.y + dy * t,
      };
    }

    const horizontalLen = absDx - radius;
    const arcLen = Math.PI * radius * 0.5;
    const verticalLen = absDy - radius;
    const totalLen = horizontalLen + arcLen + verticalLen;
    let d = t * totalLen;

    if (d <= horizontalLen) {
      return {
        x: from.x + signX * d,
        y: from.y,
      };
    }
    d -= horizontalLen;

    if (d <= arcLen) {
      const angle = d / radius;
      return {
        x: from.x + signX * (horizontalLen + Math.sin(angle) * radius),
        y: from.y + signY * ((1 - Math.cos(angle)) * radius),
      };
    }
    d -= arcLen;

    return {
      x: to.x,
      y: from.y + signY * (radius + d),
    };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid background (rounded rect)
    const gx = (GAME_WIDTH - GRID_WIDTH) / 2;
    const gy = GAME_HEIGHT - GRID_HEIGHT;
    ctx.fillStyle = theme.colors.gridBg;
    ctx.beginPath();
    ctx.roundRect(gx, gy, GRID_WIDTH, GRID_HEIGHT, 10);
    ctx.fill();

    // Empty cells
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const pos = gridToPixel(col, row);
        ctx.fillStyle = row <= DANGER_LINE_ROW ? theme.colors.danger : theme.colors.cellEmpty;
        ctx.beginPath();
        ctx.roundRect(pos.x - CELL_SIZE / 2, pos.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE, 6);
        ctx.fill();
      }
    }

    // Column highlight + drop preview
    if (!activePowerup) {
      const selPos = gridToPixel(gameState.selectedCol, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(selPos.x - CELL_SIZE / 2 - CELL_GAP / 2, gy, CELL_SIZE + CELL_GAP, GRID_HEIGHT);

      // Dashed drop line
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(selPos.x, DROP_Y + 28);
      ctx.lineTo(selPos.x, gy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Preview block
      drawBlock(ctx, selPos.x, DROP_Y, gameState.nextValue, CELL_SIZE * 0.7);
    }

    // Powerup targeting hint
    if (activePowerup === 'hammer' || activePowerup === 'swap') {
      ctx.fillStyle = 'rgba(239,68,68,0.06)';
      ctx.fillRect(gx, gy, GRID_WIDTH, GRID_HEIGHT);
      ctx.fillStyle = theme.colors.text;
      ctx.font = '600 12px "Geist", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.7;
      const swapHint = swapSelection ? 'Select second block to swap' : 'Tap first block to start swap';
      ctx.fillText(activePowerup === 'hammer' ? 'Tap a block to remove' : swapHint, GAME_WIDTH / 2, DROP_Y);
      ctx.globalAlpha = 1;
    }

    // Blocks
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const block = gameState.grid[row]?.[col];
        if (block) {
          const pos = gridToPixel(col, row);
          const isDangerBlock = row <= DANGER_LINE_ROW;
          drawBlock(ctx, pos.x, pos.y, block.value, CELL_SIZE - 4, block.isObstacle, isDangerBlock);
        }
      }
    }

    // Mark first selected block while swap is armed.
    if (activePowerup === 'swap' && swapSelection) {
      const pos = gridToPixel(swapSelection.col, swapSelection.row);
      const ringSize = CELL_SIZE - 2;
      const pulse = 0.65 + Math.sin(performance.now() / 220) * 0.15;
      ctx.strokeStyle = `rgba(56,189,248,${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(pos.x - ringSize / 2, pos.y - ringSize / 2, ringSize, ringSize, 8);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56,189,248,0.9)';
      ctx.beginPath();
      ctx.roundRect(pos.x - 11, pos.y - ringSize / 2 - 11, 22, 18, 6);
      ctx.fill();
      ctx.fillStyle = '#03111a';
      ctx.font = '700 11px "Geist", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1', pos.x, pos.y - ringSize / 2 - 2);
    }

    // Merge slide animations
    if (mergeAnimations.length > 0) {
      const now = performance.now();
      for (const animation of mergeAnimations) {
        const elapsed = now - animation.startAt;
        if (elapsed < 0) continue;
        const progress = Math.max(0, Math.min(1, elapsed / animation.duration));
        const eased = easeInOutCubic(progress);
        const from = gridToPixel(animation.fromCol, animation.fromRow);
        const to = gridToPixel(animation.toCol, animation.toRow);
        const { x, y } = getSmoothMergePosition(from, to, eased);

        // Motion glow makes merge travel easier to follow at game speed.
        const glowRadius = CELL_SIZE * (0.18 + (1 - eased) * 0.08);
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250,204,21,${0.16 + (1 - eased) * 0.12})`;
        ctx.fill();

        const size = (CELL_SIZE - 4) * (1 - 0.08 * eased);
        drawBlock(ctx, x, y, animation.value, size);
      }
    }

    // Danger line
    const dy = gridToPixel(0, DANGER_LINE_ROW).y + CELL_SIZE / 2 + CELL_GAP / 2;
    ctx.strokeStyle = 'rgba(239,68,68,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(gx + 6, dy);
    ctx.lineTo(gx + GRID_WIDTH - 6, dy);
    ctx.stroke();
    ctx.setLineDash([]);

    animRef.current = requestAnimationFrame(render);
  }, [gameState.grid, gameState.selectedCol, gameState.nextValue, activePowerup, swapSelection, theme, drawBlock, mergeAnimations, getSmoothMergePosition]);

  useEffect(() => {
    if (gameState.status !== 'GAME_OVER' && gameState.status !== 'LEVEL_COMPLETE') {
      animRef.current = requestAnimationFrame(render);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gameState.status, render]);

  const handleInteraction = useCallback((clientX: number, clientY: number, isClick = false) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.status !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (GAME_WIDTH / rect.width);
    const y = (clientY - rect.top) * (GAME_HEIGHT / rect.height);
    const col = pixelToCol(x);
    if (isClick && (activePowerup === 'hammer' || activePowerup === 'swap')) {
      const gridY = GAME_HEIGHT - GRID_HEIGHT;
      if (y >= gridY) {
        const row = Math.floor((y - gridY - GRID_PADDING) / (CELL_SIZE + CELL_GAP));
        if (row >= 0 && row < GRID_ROWS) { handlePowerupAction(col, row); return; }
      }
    }
    setSelectedCol(col);
  }, [gameState.status, activePowerup, setSelectedCol, handlePowerupAction]);

  const getColFromClientX = useCallback((clientX: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (GAME_WIDTH / rect.width);
    return pixelToCol(x);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleInteraction(e.clientX, e.clientY, true);
    if (gameState.status === 'PLAYING' && !activePowerup) {
      const col = getColFromClientX(e.clientX);
      if (col !== null) dropBlock(col);
    }
  }, [handleInteraction, dropBlock, gameState.status, activePowerup, getColFromClientX]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePowerup) return;
    if (e.pointerType === 'mouse') {
      handleInteraction(e.clientX, e.clientY);
    }
  }, [handleInteraction, activePowerup]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState.status !== 'PLAYING' || activePowerup) return;
      if (e.key === 'ArrowLeft') setSelectedCol(gameState.selectedCol - 1);
      else if (e.key === 'ArrowRight') setSelectedCol(gameState.selectedCol + 1);
      else if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); dropBlock(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState.status, gameState.selectedCol, activePowerup, setSelectedCol, dropBlock]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="absolute inset-0 h-full w-full cursor-pointer touch-none rounded-[18px]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    />
  );
}
