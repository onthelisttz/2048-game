'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useGame } from '@/context/game-context';
import { usePlayer } from '@/context/player-context';
import {
  GAME_WIDTH, GAME_HEIGHT, GRID_COLS, GRID_ROWS,
  CELL_SIZE, CELL_GAP, GRID_PADDING,
  GRID_WIDTH, GRID_HEIGHT, GRID_START_Y,
  DANGER_LINE_ROW, DROP_Y, gridToPixel, pixelToCol
} from '@/utils/constants';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const lastInputAtRef = useRef<number>(performance.now());
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
    const r = 10;

    // Shadow
    ctx.beginPath();
    ctx.roundRect(x - size / 2 + 1, y - size / 2 + 2, size, size, r);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    // Bottom edge (3D raised effect)
    ctx.beginPath();
    ctx.roundRect(x - size / 2, y - size / 2 + 1.5, size, size, r);
    ctx.fillStyle = adjustColor(colors.bg, -30);
    ctx.fill();

    // Block body with strong gradient
    ctx.beginPath();
    ctx.roundRect(x - size / 2, y - size / 2, size, size, r);
    const grad = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
    grad.addColorStop(0, adjustColor(colors.bg, 22));
    grad.addColorStop(0.5, colors.bg);
    grad.addColorStop(1, adjustColor(colors.bg, -18));
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle border
    ctx.beginPath();
    ctx.roundRect(x - size / 2, y - size / 2, size, size, r);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top shine overlay
    ctx.beginPath();
    ctx.roundRect(x - size / 2 + 2, y - size / 2 + 2, size - 4, size * 0.35, [r - 1, r - 1, 0, 0]);
    const shine = ctx.createLinearGradient(x, y - size / 2, x, y - size / 2 + size * 0.35);
    shine.addColorStop(0, 'rgba(255,255,255,0.2)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fill();

    // Number
    if (!isObstacle) {
      const fontSize = value >= 1000 ? 12 : value >= 100 ? 15 : 19;
      ctx.font = `900 ${fontSize}px 'Geist', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = value >= 1000 ? 1.6 : 2.2;
      ctx.strokeText(value.toString(), x, y);
      ctx.fillStyle = colors.text;
      ctx.fillText(value.toString(), x, y);
    } else {
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '900 16px "Geist", system-ui, sans-serif';
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

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const targetWidth = Math.round(GAME_WIDTH * dpr);
    const targetHeight = Math.round(GAME_HEIGHT * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${GAME_WIDTH}px`;
      canvas.style.height = `${GAME_HEIGHT}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid background with outer glow
    const gx = (GAME_WIDTH - GRID_WIDTH) / 2;
    const gy = GRID_START_Y - GRID_PADDING;
    const now = performance.now();
    const dangerPulse = 0.5 + Math.sin(now / 190) * 0.12;
    const dangerActive = gameState.dangerCells > 0 || gameState.dangerHealth <= 2;
    const idleGuidanceActive = !activePowerup && gameState.status === 'PLAYING' && (now - lastInputAtRef.current > 2400);
    let filledCells = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (gameState.grid[r][c]) filledCells++;
      }
    }
    const sparseBoard = filledCells <= 10;

    ctx.save();
    ctx.shadowColor = `${theme.colors.accent}30`;
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.roundRect(gx, gy, GRID_WIDTH, GRID_HEIGHT, 14);
    ctx.fillStyle = theme.colors.gridBg;
    ctx.fill();
    ctx.restore();

    // Grid border
    ctx.beginPath();
    ctx.roundRect(gx, gy, GRID_WIDTH, GRID_HEIGHT, 14);
    ctx.strokeStyle = `${theme.colors.accent}46`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer board edge so board limits are always obvious.
    ctx.beginPath();
    ctx.roundRect(gx - 1.5, gy - 1.5, GRID_WIDTH + 3, GRID_HEIGHT + 3, 15);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inner edge adds depth and separation from page background.
    ctx.beginPath();
    ctx.roundRect(gx + 1.5, gy + 1.5, GRID_WIDTH - 3, GRID_HEIGHT - 3, 13);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner grid subtle gradient overlay
    const gridGrad = ctx.createLinearGradient(gx, gy, gx, gy + GRID_HEIGHT);
    gridGrad.addColorStop(0, 'rgba(255,255,255,0.02)');
    gridGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
    gridGrad.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.beginPath();
    ctx.roundRect(gx, gy, GRID_WIDTH, GRID_HEIGHT, 14);
    ctx.fillStyle = gridGrad;
    ctx.fill();

    // Danger band at top row for stronger readability.
    const dangerBandTop = gridToPixel(0, DANGER_LINE_ROW).y - CELL_SIZE / 2;
    const dangerBandX = gx + GRID_PADDING - 2;
    const dangerBandW = GRID_WIDTH - (GRID_PADDING - 2) * 2;
    if (dangerActive) {
      ctx.beginPath();
      ctx.roundRect(dangerBandX, dangerBandTop, dangerBandW, CELL_SIZE, 10);
      ctx.fillStyle = `rgba(239,68,68,${0.04 + dangerPulse * 0.08})`;
      ctx.fill();
    }

    // Empty cells with extra inset so slots are visually separated.
    const emptyCellInset = 2;
    const emptyCellSize = CELL_SIZE - emptyCellInset * 2;
    const emptyCellRadius = 7;

    // Empty cells with gradient fill and borders
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const pos = gridToPixel(col, row);
        const cx = pos.x - emptyCellSize / 2;
        const cy = pos.y - emptyCellSize / 2;
        const isDangerRow = row <= DANGER_LINE_ROW;

        // Cell gradient fill
        const cellGrad = ctx.createLinearGradient(cx, cy, cx, cy + emptyCellSize);
        if (isDangerRow && dangerActive) {
          const topAlpha = dangerActive ? (0.08 + dangerPulse * 0.1) : 0.08;
          cellGrad.addColorStop(0, `rgba(239,68,68,${topAlpha})`);
          cellGrad.addColorStop(1, dangerActive ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)');
        } else {
          if (sparseBoard) {
            cellGrad.addColorStop(0, 'rgba(255,255,255,0.055)');
            cellGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
          } else {
            cellGrad.addColorStop(0, 'rgba(255,255,255,0.04)');
            cellGrad.addColorStop(1, 'rgba(255,255,255,0.012)');
          }
        }
        ctx.beginPath();
        ctx.roundRect(cx, cy, emptyCellSize, emptyCellSize, emptyCellRadius);
        ctx.fillStyle = cellGrad;
        ctx.fill();

        // Cell border for depth
        ctx.beginPath();
        ctx.roundRect(cx, cy, emptyCellSize, emptyCellSize, emptyCellRadius);
        ctx.strokeStyle = isDangerRow && dangerActive
          ? `rgba(254,202,202,${0.14 + dangerPulse * 0.1})`
          : (sparseBoard ? `${theme.colors.accent}2e` : 'rgba(255,255,255,0.05)');
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Column highlight + drop preview
    if (!activePowerup) {
      const selPos = gridToPixel(gameState.selectedCol, 0);
      const colX = selPos.x - CELL_SIZE / 2 - CELL_GAP / 2;
      const colW = CELL_SIZE + CELL_GAP;
      const colHighlight = ctx.createLinearGradient(0, gy, 0, gy + GRID_HEIGHT);
      colHighlight.addColorStop(0, `${theme.colors.accent}26`);
      colHighlight.addColorStop(0.3, `${theme.colors.accent}0f`);
      colHighlight.addColorStop(1, 'rgba(255,255,255,0.015)');
      ctx.fillStyle = colHighlight;
      ctx.fillRect(colX, gy, colW, GRID_HEIGHT);
      if (idleGuidanceActive) {
        const idlePulse = 0.14 + ((Math.sin(now / 220) + 1) * 0.5) * 0.14;
        ctx.fillStyle = `rgba(255,255,255,${idlePulse})`;
        ctx.fillRect(colX, gy, colW, GRID_HEIGHT);
      }

      // Strong drop line
      ctx.strokeStyle = `${theme.colors.accent}b5`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -(now / 30);
      ctx.beginPath();
      ctx.moveTo(selPos.x, DROP_Y + 28);
      ctx.lineTo(selPos.x, gy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Landing ghost for selected column.
      let landingRow = -1;
      for (let row = GRID_ROWS - 1; row >= 0; row--) {
        if (!gameState.grid[row][gameState.selectedCol]) {
          landingRow = row;
          break;
        }
      }
      if (landingRow >= 0) {
        const landing = gridToPixel(gameState.selectedCol, landingRow);
        ctx.beginPath();
        ctx.roundRect(landing.x - (CELL_SIZE - 6) / 2, landing.y - (CELL_SIZE - 6) / 2, CELL_SIZE - 6, CELL_SIZE - 6, 10);
        ctx.strokeStyle = `${theme.colors.accent}8f`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(landing.x - (CELL_SIZE - 6) / 2, landing.y - (CELL_SIZE - 6) / 2, CELL_SIZE - 6, CELL_SIZE - 6, 10);
        ctx.fillStyle = `${theme.colors.accent}16`;
        ctx.fill();
      }

      // Preview block
      drawBlock(ctx, selPos.x, DROP_Y, gameState.nextValue, CELL_SIZE * 0.78);
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
          const isDangerBlock = dangerActive && row <= DANGER_LINE_ROW;
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
    if (dangerActive) {
      const dy = gridToPixel(0, DANGER_LINE_ROW).y + CELL_SIZE / 2 + CELL_GAP / 2;
      ctx.strokeStyle = `rgba(239,68,68,${0.34 + dangerPulse * 0.16})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.lineDashOffset = -(now / 35);
      ctx.beginPath();
      ctx.moveTo(gx + 6, dy);
      ctx.lineTo(gx + GRID_WIDTH - 6, dy);
      ctx.stroke();
      ctx.setLineDash([]);
      const dangerCount = Math.max(0, gameState.dangerHealth).toString();
      const badgeW = Math.max(18, 10 + dangerCount.length * 7);
      const badgeH = 16;
      const badgeX = gx + GRID_WIDTH - badgeW - 10;
      const badgeY = dy - badgeH - 4;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fillStyle = 'rgba(17,24,39,0.68)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(252,165,165,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(254,226,226,0.92)';
      ctx.font = '800 10px "Geist", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dangerCount, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
    }

    animRef.current = requestAnimationFrame(render);
  }, [gameState.grid, gameState.selectedCol, gameState.nextValue, gameState.dangerCells, gameState.dangerHealth, gameState.status, activePowerup, swapSelection, theme, drawBlock, mergeAnimations, getSmoothMergePosition]);

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
    lastInputAtRef.current = performance.now();
    if (isClick && (activePowerup === 'hammer' || activePowerup === 'swap')) {
      const gridY = GRID_START_Y - GRID_PADDING;
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
    lastInputAtRef.current = performance.now();
    handleInteraction(e.clientX, e.clientY, true);
    if (gameState.status === 'PLAYING' && !activePowerup) {
      const col = getColFromClientX(e.clientX);
      if (col !== null) dropBlock(col);
    }
  }, [handleInteraction, dropBlock, gameState.status, activePowerup, getColFromClientX]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePowerup) return;
    if (e.pointerType === 'mouse') {
      lastInputAtRef.current = performance.now();
      handleInteraction(e.clientX, e.clientY);
    }
  }, [handleInteraction, activePowerup]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState.status !== 'PLAYING' || activePowerup) return;
      lastInputAtRef.current = performance.now();
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
