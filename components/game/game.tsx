'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { GameProvider, useGame } from '@/context/game-context';
import { PlayerProvider, usePlayer } from '@/context/player-context';
import { GameCanvas } from './game-canvas';
import { GameOverModal } from './game-over-modal';
import { SettingsModal } from './settings-modal';
import { ParticleEffect } from './particle-effect';
import { MainMenu } from './main-menu';
import { ShopModal } from './shop-modal';
import { AchievementsModal } from './achievements-modal';
import { DailyChallengesModal } from './daily-challenges-modal';
import { LevelCompleteModal } from './level-complete-modal';
import { getLevelConfig, POWERUPS } from '@/utils/game-data';
import { showRewardedAd } from '@/utils/ads';
import {
  Home, Settings, Hammer, Undo2, Gem, Zap, Target, Infinity, AlertTriangle, ChevronsRight, ArrowRightLeft, PlayCircle
} from 'lucide-react';

type Screen = 'menu' | 'game';
const LEVEL_COMPLETE_BASE_GEMS = 20;

function GameContent() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isDailyChallengesOpen, setIsDailyChallengesOpen] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [playingLevel, setPlayingLevel] = useState(1);
  const [isClaimingAd, setIsClaimingAd] = useState(false);
  const [isClaimingLevelRewardAd, setIsClaimingLevelRewardAd] = useState(false);
  const [levelRewardMultiplier, setLevelRewardMultiplier] = useState<1 | 2>(1);
  const hasRecordedGameOverRef = useRef(false);

  const {
    gameState, restartGame,
    activePowerup, cancelPowerup, usePowerup: activatePowerup, scoreMultiplier, undoLastMove, getUndoAvailable
  } = useGame();
  const { progress, completeLevel, recordGameStats, checkAchievement, updateDailyProgress, getCurrentTheme, getCurrentBgImage, isDev, adsEnabled, spendGems, claimAdGems } = usePlayer();
  const { usePowerup: consumePowerup } = usePlayer();
  const theme = getCurrentTheme();
  const bgImage = getCurrentBgImage();
  const levelConfig = getLevelConfig(playingLevel);

  const POWERUP_MAP: Record<string, ReactNode> = {
    hammer: <Hammer className="w-4 h-4" />,
    swap: <ArrowRightLeft className="w-4 h-4" />,
    undo: <Undo2 className="w-4 h-4" />,
  };
  const POWERUP_COSTS = POWERUPS.reduce<Record<string, number>>((acc, powerup) => {
    acc[powerup.id] = powerup.price;
    return acc;
  }, {});

  // Level completion check
  useEffect(() => {
    if (gameState.mode === 'level' && gameState.status === 'PLAYING' && !showLevelComplete) {
      if (gameState.score >= levelConfig.targetScore) {
        setLevelRewardMultiplier(1);
        setShowLevelComplete(true);
      }
    }
  }, [gameState.score, gameState.mode, gameState.status, showLevelComplete, levelConfig.targetScore]);

  // Stats on game over
  useEffect(() => {
    if (gameState.status !== 'GAME_OVER') {
      hasRecordedGameOverRef.current = false;
      return;
    }

    if (hasRecordedGameOverRef.current) return;
    hasRecordedGameOverRef.current = true;

    recordGameStats(gameState.score, gameState.highestBlock, gameState.totalMerges, gameState.comboMultiplier);
    checkAchievement('score', gameState.score);
    checkAchievement('block_value', gameState.highestBlock);
    checkAchievement('merges', gameState.totalMerges);
    checkAchievement('combo', Math.floor(gameState.comboMultiplier));
    checkAchievement('games', progress.gamesPlayed + 1);
    updateDailyProgress('score', gameState.score);
    updateDailyProgress('merges', gameState.totalMerges);
  }, [
    gameState.status,
    gameState.score,
    gameState.highestBlock,
    gameState.totalMerges,
    gameState.comboMultiplier,
    progress.gamesPlayed,
    recordGameStats,
    checkAchievement,
    updateDailyProgress,
  ]);

  const handleStartLevel = () => { setPlayingLevel(progress.currentLevel); restartGame('level', progress.currentLevel); setScreen('game'); };
  const handleStartEndless = () => { restartGame('endless', 1); setScreen('game'); };
  const handleNextLevel = () => {
    completeLevel(LEVEL_COMPLETE_BASE_GEMS * levelRewardMultiplier);
    updateDailyProgress('level', 1);
    checkAchievement('level', playingLevel + 1);
    const next = playingLevel + 1;
    setPlayingLevel(next);
    setShowLevelComplete(false);
    setLevelRewardMultiplier(1);
    restartGame('level', next);
  };
  const handleMainMenu = () => {
    setShowLevelComplete(false);
    setLevelRewardMultiplier(1);
    setScreen('menu');
  };
  const handleDevSkipLevel = () => {
    if (!isDev || gameState.mode !== 'level') return;
    const next = Math.min(1000, playingLevel + 1);
    setPlayingLevel(next);
    setShowLevelComplete(false);
    restartGame('level', next);
  };

  const handlePowerup = (id: string) => {
    const cost = POWERUP_COSTS[id] ?? 0;
    const ownedCount = progress.powerups[id] || 0;
    const hasOwnedStock = isDev || ownedCount > 0;

    if (id === 'undo') {
      if (!getUndoAvailable()) return;
      if (hasOwnedStock) {
        if (isDev || consumePowerup(id)) undoLastMove();
        return;
      }
      if (spendGems(cost)) undoLastMove();
      return;
    }

    if (activePowerup === id) {
      cancelPowerup();
      return;
    }

    if (hasOwnedStock) {
      if (isDev || consumePowerup(id)) activatePowerup(id);
      return;
    }

    if (spendGems(cost)) activatePowerup(id);
  };
  const handleClaimAdGems = async () => {
    if (isClaimingAd) return;
    setIsClaimingAd(true);
    try {
      await claimAdGems();
    } finally {
      setIsClaimingAd(false);
    }
  };
  const handleClaimLevelRewardBoost = async () => {
    if (levelRewardMultiplier === 2 || isClaimingLevelRewardAd || !adsEnabled) return;
    setIsClaimingLevelRewardAd(true);
    try {
      if (isDev) {
        setLevelRewardMultiplier(2);
        return;
      }

      const rewarded = await showRewardedAd();
      if (rewarded) setLevelRewardMultiplier(2);
    } finally {
      setIsClaimingLevelRewardAd(false);
    }
  };
  const progressPct = gameState.mode === 'level' ? Math.min((gameState.score / levelConfig.targetScore) * 100, 100) : 0;
  const showDangerIcon = gameState.dangerCells > 0 || gameState.dangerHealth <= 2;
  const isDangerOccupied = gameState.dangerCells > 0;
  const isDangerCritical = gameState.dangerHealth <= 1;
  const dangerNumber = Math.max(0, gameState.dangerHealth);
  const screenBackgroundStyle = bgImage
    ? {
        backgroundColor: theme.colors.bg,
        backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.45), rgba(6,8,16,0.78)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundColor: theme.colors.bg,
      };

  if (screen === 'menu') {
    return (
      <>
        <MainMenu
          onStartLevel={handleStartLevel}
          onStartEndless={handleStartEndless}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          onOpenDailyChallenges={() => setIsDailyChallengesOpen(true)}
        />
        <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />
        <DailyChallengesModal isOpen={isDailyChallengesOpen} onClose={() => setIsDailyChallengesOpen(false)} />
      </>
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border shadow-2xl select-none"
      style={{ ...screenBackgroundStyle, color: theme.colors.uiText, borderColor: `${theme.colors.text}2f` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/35 to-transparent" />

      <div className="relative z-10 flex h-full flex-col">
        {/* ---- Unified HUD ---- */}
        <div className="shrink-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1.5">
        {/* Row 1 */}
        <div className="flex items-center justify-between mb-1">
          <button onClick={handleMainMenu} className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition" aria-label="Main menu">
            <Home className="w-4 h-4" style={{ color: theme.colors.text }} />
          </button>
          <div className="flex items-center gap-1.5">
            {gameState.mode === 'level' ? (
              <div className="flex items-center gap-1">
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.colors.accent}22`, color: theme.colors.accent }}>
                  <Target className="w-3 h-3" /> Lv.{playingLevel}
                </span>
                {isDev && (
                  <button
                    onClick={handleDevSkipLevel}
                    disabled={playingLevel >= 1000}
                    className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 disabled:opacity-40"
                    aria-label="Skip to next level (dev)"
                    title="Dev: Skip to next level"
                  >
                    <ChevronsRight className="w-3 h-3" /> +1
                  </button>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme.colors.accent}22`, color: theme.colors.accent }}>
                <Infinity className="w-3 h-3" /> Endless
              </span>
            )}
            {scoreMultiplier > 1 && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                <Zap className="w-2.5 h-2.5" />{scoreMultiplier}x
              </span>
            )}
            {gameState.comboMultiplier > 1 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/80 text-white">
                {gameState.comboMultiplier.toFixed(1)}x
              </span>
            )}
            {showDangerIcon && (
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
                  isDangerOccupied || isDangerCritical ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: isDangerOccupied
                    ? 'rgba(220,38,38,0.6)'
                    : isDangerCritical
                      ? 'rgba(239,68,68,0.45)'
                      : 'rgba(245,158,11,0.4)',
                  borderColor: isDangerOccupied ? 'rgba(254,202,202,0.8)' : 'rgba(255,255,255,0.45)',
                  boxShadow: isDangerOccupied ? '0 0 16px rgba(239,68,68,0.45)' : '0 0 10px rgba(245,158,11,0.3)',
                }}
                aria-label={`Danger countdown ${dangerNumber}`}
                title={`Danger countdown: ${dangerNumber}`}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: '#fff' }} />
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-black/85 text-[9px] font-black leading-4 text-white text-center">
                  {dangerNumber}
                </span>
              </span>
            )}
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition" aria-label="Settings">
            <Settings className="w-4 h-4" style={{ color: theme.colors.text }} />
          </button>
        </div>

        {/* Row 2: Score + Target */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-40">Score</p>
            <p className="text-2xl font-black leading-none tabular-nums">{gameState.score.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider opacity-40">{gameState.mode === 'level' ? 'Target' : 'Best'}</p>
            <p className="text-lg font-bold leading-none tabular-nums opacity-80">
              {gameState.mode === 'level' ? levelConfig.targetScore.toLocaleString() : gameState.bestScore.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {gameState.mode === 'level' && (
          <div className="w-full h-1 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: `${theme.colors.text}15` }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: theme.colors.accent }} />
          </div>
        )}
        {isDev && gameState.lastAutoUpgrade && (
          <div className="mt-1.5 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 rounded-md px-2 py-1 w-fit">
            Auto: {gameState.lastAutoUpgrade.removedValue} {'->'} {gameState.lastAutoUpgrade.addedValue}
          </div>
        )}
        </div>

        {/* ---- Canvas ---- */}
        <div className="relative flex-1 min-h-0 px-2 pb-1">
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="relative h-full max-h-[480px] aspect-[340/480] w-auto max-w-full">
              <GameCanvas />
              <ParticleEffect />
            </div>
          </div>
        </div>

        {/* ---- Bottom bar: powerups + controls unified ---- */}
        <div className="shrink-0 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <Gem className="w-3 h-3" style={{ color: theme.colors.accent }} />
                <span className="text-xs font-bold tabular-nums">{progress.gems}</span>
              </div>
              <button
                onClick={handleClaimAdGems}
                disabled={isClaimingAd || !adsEnabled}
                className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: `${theme.colors.accent}66`, color: theme.colors.accent, backgroundColor: `${theme.colors.accent}16` }}
                title="Watch ad for gems"
              >
                <PlayCircle className="h-3 w-3" />
                {isClaimingAd ? '...' : '+20'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {(['hammer', 'swap', 'undo'] as const).map((id) => {
                const count = progress.powerups[id] || 0;
                const cost = POWERUP_COSTS[id] ?? 0;
                const active = activePowerup === id;
                const hasStock = isDev || count > 0;
                const canAffordGem = isDev || progress.gems >= cost;
                const hasUndoSnapshot = id !== 'undo' || getUndoAvailable();
                const available = hasUndoSnapshot && (active || hasStock || canAffordGem);
                return (
                  <button
                    key={id}
                    onClick={() => handlePowerup(id)}
                    disabled={!available}
                    className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition active:scale-90 ${
                      active ? 'ring-2' : ''
                    } ${!available ? 'opacity-25' : ''}`}
                    style={{
                      backgroundColor: active ? theme.colors.accent : `${theme.colors.text}12`,
                      color: active ? theme.colors.bg : theme.colors.text,
                      ...(active ? { ringColor: theme.colors.accent } : {}),
                    }}
                    title={hasStock ? `${id} x${count}` : `${cost} gems`}
                  >
                    {POWERUP_MAP[id]}
                    {count > 0 ? (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">{count}</span>
                    ) : (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-black/80 px-1 py-[1px] text-[7px] font-black text-amber-300">
                        <Gem className="h-2 w-2" />
                        {cost}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GameOverModal onMainMenu={handleMainMenu} currentLevel={playingLevel} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LevelCompleteModal
        isOpen={showLevelComplete}
        level={playingLevel}
        score={gameState.score}
        baseGemsReward={LEVEL_COMPLETE_BASE_GEMS}
        rewardMultiplier={levelRewardMultiplier}
        adsEnabled={adsEnabled}
        isClaimingRewardAd={isClaimingLevelRewardAd}
        onClaimRewardBoost={handleClaimLevelRewardBoost}
        onNextLevel={handleNextLevel}
      />
    </div>
  );
}

export function Game() {
  return (
    <PlayerProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </PlayerProvider>
  );
}
