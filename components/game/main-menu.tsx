'use client';

import { useState, type CSSProperties } from 'react';
import { usePlayer } from '@/context/player-context';
import { formatCompactNumber } from '@/utils/number-format';
import { Gem, Trophy, Calendar, ShoppingBag, Infinity, Target, PlayCircle } from 'lucide-react';

interface MainMenuProps {
  onStartLevel: () => void;
  onStartEndless: () => void;
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onOpenDailyChallenges: () => void;
}

export function MainMenu({ onStartLevel, onStartEndless, onOpenShop, onOpenAchievements, onOpenDailyChallenges }: MainMenuProps) {
  const { progress, getCurrentTheme, getCurrentBgImage, isDev, adsEnabled, claimAdGems } = usePlayer();
  const [isClaimingAd, setIsClaimingAd] = useState(false);
  const [activeQuickLink, setActiveQuickLink] = useState<'daily' | 'badges' | 'shop' | null>(null);
  const theme = getCurrentTheme();
  const bgImage = getCurrentBgImage();
  const handleClaimAdGems = async () => {
    if (isClaimingAd) return;
    setIsClaimingAd(true);
    try {
      await claimAdGems();
    } finally {
      setIsClaimingAd(false);
    }
  };

  const backgroundStyle: CSSProperties = bgImage
    ? {
        backgroundColor: theme.colors.bg,
        backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.45), rgba(6,8,16,0.75)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundColor: theme.colors.bg,
      };

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border shadow-2xl"
      style={{ ...backgroundStyle, color: theme.colors.uiText, borderColor: `${theme.colors.text}2f` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />

      <div className="relative z-10 flex h-full flex-col items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Top: Currency */}
        <div className="w-full flex justify-center gap-3 shrink-0 mt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm" style={{ backgroundColor: `${theme.colors.text}16`, borderColor: `${theme.colors.accent}30` }}>
            <Gem className="w-3.5 h-3.5" style={{ color: theme.colors.accent }} />
            <span className="font-bold text-sm tabular-nums">{formatCompactNumber(progress.gems)}</span>
          </div>
          <button
            onClick={handleClaimAdGems}
            disabled={isClaimingAd || !adsEnabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: `${theme.colors.accent}1f`, borderColor: `${theme.colors.accent}72`, color: theme.colors.accent }}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="font-bold text-sm tabular-nums">{isClaimingAd ? '...' : '+20 (Ad)'}</span>
          </button>
          {isDev && (
            <span className="text-[9px] font-mono px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">DEV</span>
          )}
        </div>

        {/* Center: Title + Player */}
        <div className="relative flex flex-col items-center gap-5 flex-1 justify-center w-full">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="absolute h-52 w-52 rounded-full blur-2xl"
              style={{ background: `radial-gradient(circle, ${theme.colors.accent}33 0%, ${theme.colors.accent}10 45%, transparent 72%)` }}
            />
          </div>

          <div className="text-center relative z-10">
            <h1 className="text-6xl font-black tracking-tighter" style={{ color: theme.colors.accent, textShadow: `0 6px 18px ${theme.colors.accent}35` }}>2048</h1>
            <p className="text-sm font-semibold opacity-60 mt-0.5">Drop & Merge</p>
            <p className="text-[11px] mt-1 opacity-50">Merge numbers. Stay below danger.</p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 text-center relative z-10">
            {[
              { label: 'Stage', value: progress.currentLevel },
              { label: 'Games', value: progress.gamesPlayed },
              { label: 'Best', value: progress.highestBlock },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-extrabold tabular-nums">{formatCompactNumber(s.value)}</p>
                <p className="text-[11px] uppercase tracking-[0.14em] opacity-55 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Actions */}
        <div className="w-full space-y-3 shrink-0">
          {/* Play buttons */}
          <button
            onClick={onStartLevel}
            className="w-full h-15 flex items-center rounded-xl font-bold text-base active:scale-[0.97] transition-transform"
            style={{ backgroundColor: theme.colors.accent, color: theme.colors.bg, boxShadow: `0 0 0 1px ${theme.colors.accent}66, 0 0 24px ${theme.colors.accent}52` }}
          >
            <div className="flex w-full items-center px-4">
              <Target className="w-5 h-5 mr-2" />
              <div className="flex flex-col items-start">
                <span className="text-base leading-4">Play Level {progress.currentLevel}</span>
                <span className="text-[10px] opacity-65 mt-0.5">Progress: {progress.currentLevel} / 1000</span>
              </div>
            </div>
          </button>

          <button
            onClick={onStartEndless}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm active:scale-[0.97] transition-transform backdrop-blur-sm"
            style={{ backgroundColor: `${theme.colors.text}0a`, color: theme.colors.text, border: `1px solid ${theme.colors.text}15` }}
          >
            <Infinity className="w-4 h-4" />
            Endless Mode
          </button>

          {/* Quick links */}
          <div className="flex gap-2 pt-1">
            {[
              { id: 'daily' as const, icon: <Calendar className="w-4 h-4" />, label: 'Daily', onClick: onOpenDailyChallenges },
              { id: 'badges' as const, icon: <Trophy className="w-4 h-4" />, label: 'Badges', onClick: onOpenAchievements },
              { id: 'shop' as const, icon: <ShoppingBag className="w-4 h-4" />, label: 'Shop', onClick: onOpenShop },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveQuickLink(item.id); item.onClick(); }}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl active:scale-95 transition backdrop-blur-sm"
                style={{
                  backgroundColor: activeQuickLink === item.id ? `${theme.colors.accent}1e` : `${theme.colors.text}10`,
                  color: activeQuickLink === item.id ? theme.colors.accent : theme.colors.text,
                  border: `1px solid ${activeQuickLink === item.id ? `${theme.colors.accent}66` : `${theme.colors.text}1f`}`,
                }}
              >
                <span style={{ color: activeQuickLink === item.id ? theme.colors.accent : `${theme.colors.text}bb` }}>{item.icon}</span>
                <span className={`text-[10px] font-semibold ${activeQuickLink === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
