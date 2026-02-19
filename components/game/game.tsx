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
import { formatCompactNumber, formatNumber } from '@/utils/number-format';
import {
  Home, Settings, Hammer, Undo2, Gem, Zap, Target, Infinity, ChevronsRight, ArrowRightLeft, PlayCircle
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
  const [powerupHint, setPowerupHint] = useState<string | null>(null);
  const hasRecordedGameOverRef = useRef(false);
  const powerupHintTimerRef = useRef<number | null>(null);

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
    hammer: <Hammer className="w-5 h-5" />,
    swap: <ArrowRightLeft className="w-5 h-5" />,
    undo: <Undo2 className="w-5 h-5" />,
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
    const showPowerupHint = (message: string) => {
      setPowerupHint(message);
      if (powerupHintTimerRef.current) window.clearTimeout(powerupHintTimerRef.current);
      powerupHintTimerRef.current = window.setTimeout(() => setPowerupHint(null), 1600);
    };

    const cost = POWERUP_COSTS[id] ?? 0;
    const ownedCount = progress.powerups[id] || 0;
    const hasOwnedStock = isDev || ownedCount > 0;

    if (id === 'undo') {
      if (!getUndoAvailable()) {
        showPowerupHint('Nothing to undo');
        return;
      }
      if (hasOwnedStock) {
        if (isDev || consumePowerup(id)) undoLastMove();
        setPowerupHint(null);
        return;
      }
      if (spendGems(cost)) {
        undoLastMove();
        setPowerupHint(null);
      } else {
        showPowerupHint(progress.gems <= 0 ? 'No gems. Watch ads for gems.' : 'Not enough gems. Watch ads.');
      }
      return;
    }

    if (activePowerup === id) {
      cancelPowerup();
      setPowerupHint(null);
      return;
    }

    if (hasOwnedStock) {
      if (isDev || consumePowerup(id)) {
        activatePowerup(id);
        setPowerupHint(null);
      }
      return;
    }

    if (spendGems(cost)) {
      activatePowerup(id);
      setPowerupHint(null);
    } else {
      showPowerupHint(progress.gems <= 0 ? 'No gems. Watch ads for gems.' : 'Not enough gems. Watch ads.');
    }
  };

  useEffect(() => {
    return () => {
      if (powerupHintTimerRef.current) window.clearTimeout(powerupHintTimerRef.current);
    };
  }, []);
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
        <div className="shrink-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
          {/* Row 1 */}
          <div className="flex items-center justify-between mb-1.5">
            <button
              onClick={handleMainMenu}
              className="flex h-11 w-11 items-center justify-center rounded-xl border transition hover:bg-white/10 active:scale-95"
              style={{ borderColor: `${theme.colors.accent}70`, backgroundColor: `${theme.colors.accent}20` }}
              aria-label="Main menu"
            >
              <Home className="w-5 h-5" style={{ color: theme.colors.accent }} />
            </button>
            <div className="flex items-center gap-2">
              {gameState.mode === 'level' ? (
                <div className="flex items-center gap-1">
                  <span className="flex h-8 items-center gap-1 text-xs font-bold px-2.5 rounded-full" style={{ backgroundColor: `${theme.colors.accent}26`, color: theme.colors.accent }}>
                    <Target className="w-3.5 h-3.5" /> Lv.{playingLevel}
                  </span>
                  {isDev && (
                    <button
                      onClick={handleDevSkipLevel}
                      disabled={playingLevel >= 1000}
                      className="flex h-8 items-center gap-0.5 text-[10px] font-bold px-1.5 rounded-full bg-emerald-500/20 text-emerald-300 disabled:opacity-40"
                      aria-label="Skip to next level (dev)"
                      title="Dev: Skip to next level"
                    >
                      <ChevronsRight className="w-3 h-3" /> +1
                    </button>
                  )}
                </div>
              ) : (
                <span className="flex h-8 items-center gap-1 text-xs font-bold px-2.5 rounded-full" style={{ backgroundColor: `${theme.colors.accent}22`, color: theme.colors.accent }}>
                  <Infinity className="w-3.5 h-3.5" /> Endless
                </span>
              )}
              {scoreMultiplier > 1 && (
                <span className="flex h-7 items-center gap-0.5 text-[10px] font-bold px-1.5 rounded-full bg-amber-500 text-white animate-pulse">
                  <Zap className="w-2.5 h-2.5" />{scoreMultiplier}x
                </span>
              )}
              {gameState.comboMultiplier > 1 && (
                <span className="flex h-7 items-center text-[10px] font-bold px-1.5 rounded-full bg-red-500/85 text-white">
                  {gameState.comboMultiplier.toFixed(1)}x
                </span>
              )}
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border transition hover:bg-white/10 active:scale-95"
              style={{ borderColor: `${theme.colors.accent}70`, backgroundColor: `${theme.colors.accent}20` }}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" style={{ color: theme.colors.accent }} />
            </button>
          </div>

          {/* Row 2: Score + Target */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] opacity-60 font-semibold">Score</p>
              <p className="text-[2.05rem] font-black leading-none tabular-nums drop-shadow-sm">{formatCompactNumber(gameState.score)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] opacity-60 font-semibold">{gameState.mode === 'level' ? 'Target' : 'Best'}</p>
              <p className="text-[1.7rem] font-extrabold leading-none tabular-nums opacity-95">
                {gameState.mode === 'level' ? formatCompactNumber(levelConfig.targetScore) : formatCompactNumber(gameState.bestScore)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {gameState.mode === 'level' && (
            <div className="w-full h-1.5 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: `${theme.colors.text}20` }}>
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
          <div className="relative flex h-full w-full items-start justify-center pt-1">
            <div className="relative h-full max-h-[480px] aspect-[340/480] w-auto max-w-full">
              <GameCanvas />
              <ParticleEffect />
            </div>
          </div>
        </div>

        {/* ---- Bottom bar: powerups + controls unified ---- */}
        <div className="shrink-0 px-3 pt-1.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {powerupHint && (
            <div className="mb-2 flex justify-center">
              <div
                className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{ borderColor: `${theme.colors.accent}66`, backgroundColor: `${theme.colors.uiBg}`, color: theme.colors.uiText }}
              >
                {powerupHint}
              </div>
            </div>
          )}
          <div
            className="flex items-center justify-between mb-2.5 rounded-2xl border px-2 py-2 backdrop-blur-sm"
            style={{ borderColor: `${theme.colors.accent}4d`, backgroundColor: theme.colors.uiBg }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-11 items-center gap-1.5 rounded-full border px-3"
                style={{ borderColor: `${theme.colors.accent}88`, backgroundColor: `${theme.colors.accent}28` }}
              >
                <Gem className="w-3.5 h-3.5" style={{ color: theme.colors.accent }} />
                <span className="text-sm font-extrabold tabular-nums">{formatCompactNumber(progress.gems)}</span>
              </div>
              <button
                onClick={handleClaimAdGems}
                disabled={isClaimingAd || !adsEnabled}
                className="flex h-11 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                style={{ borderColor: `${theme.colors.accent}8c`, color: theme.colors.accent, backgroundColor: `${theme.colors.accent}2b` }}
                title="Watch ad for gems"
              >
                <PlayCircle className="h-4 w-4" />
                {isClaimingAd ? '...' : '+20'}
              </button>
            </div>
            <div
              className="flex items-center gap-2 rounded-2xl border px-2 py-1.5"
              style={{ borderColor: `${theme.colors.accent}42`, backgroundColor: `${theme.colors.bg}99` }}
            >
              {(['hammer', 'swap', 'undo'] as const).map((id) => {
                const count = progress.powerups[id] || 0;
                const cost = POWERUP_COSTS[id] ?? 0;
                const active = activePowerup === id;
                const hasStock = isDev || count > 0;
                const canAffordGem = isDev || progress.gems >= cost;
                const hasUndoSnapshot = id !== 'undo' || getUndoAvailable();
                const canActNow = hasUndoSnapshot && (active || hasStock || canAffordGem);
                const disabled = id === 'undo' && !canActNow;
                return (
                  <button
                    key={id}
                    onClick={() => handlePowerup(id)}
                    disabled={disabled}
                    className={`relative h-11 w-11 flex items-center justify-center rounded-xl border transition active:scale-90 ${active ? 'ring-2' : ''
                      } ${!canActNow ? 'opacity-[0.72]' : ''}`}
                    style={{
                      backgroundColor: active ? theme.colors.accent : `${theme.colors.text}18`,
                      color: active ? theme.colors.bg : theme.colors.text,
                      borderColor: active ? `${theme.colors.accent}cc` : `${theme.colors.text}3f`,
                      ...(active ? { ringColor: theme.colors.accent } : {}),
                    }}
                    title={hasStock ? `${id} x${formatNumber(count)}` : `${formatNumber(cost)} gems`}
                  >
                    {POWERUP_MAP[id]}
                    {count > 0 ? (
                      <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-red-500 rounded-full text-[10px] font-black flex items-center justify-center text-white">{count}</span>
                    ) : (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-black/85 px-1 py-[1px] text-[8px] font-black text-amber-300">
                        <Gem className="h-2.5 w-2.5" />
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
