'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gem, Star, ArrowRight, PlayCircle } from 'lucide-react';
import { getLevelConfig } from '@/utils/game-data';
import { formatCompactNumber } from '@/utils/number-format';

interface LevelCompleteModalProps {
  isOpen: boolean;
  level: number;
  score: number;
  baseGemsReward: number;
  rewardMultiplier: 1 | 2;
  adsEnabled: boolean;
  isClaimingRewardAd: boolean;
  onClaimRewardBoost: () => void;
  onNextLevel: () => void;
}

export function LevelCompleteModal({
  isOpen,
  level,
  score,
  baseGemsReward,
  rewardMultiplier,
  adsEnabled,
  isClaimingRewardAd,
  onClaimRewardBoost,
  onNextLevel,
}: LevelCompleteModalProps) {
  const cfg = getLevelConfig(level);
  const stars = score >= cfg.targetScore * 1.5 ? 3 : score >= cfg.targetScore * 1.2 ? 2 : 1;
  const totalReward = baseGemsReward * rewardMultiplier;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm border-[#2a3550] bg-[radial-gradient(120%_100%_at_0%_0%,#1a2440_0%,#0b1328_55%,#091025_100%)] text-[#eef4ff] text-center shadow-[0_24px_80px_rgba(0,8,28,0.65)]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="py-2">
          <p className="text-sm text-white/50 mb-1">Level {level}</p>
          <h2 className="text-3xl font-black text-[#f59e0b]">COMPLETE!</h2>
        </div>

        <div className="flex justify-center gap-2 my-2">
          {[1, 2, 3].map((s) => (
            <Star key={s} className={`w-8 h-8 transition-all duration-500 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-[#27272a]'}`} style={{ transitionDelay: `${s * 150}ms` }} />
          ))}
        </div>

        <div className="bg-white/8 border border-white/12 rounded-2xl p-3 text-center">
          <span className="text-[10px] uppercase tracking-wider text-white/45">Score</span>
          <p className="text-2xl font-black tabular-nums">{formatCompactNumber(score)}</p>
          <p className="text-[10px] text-white/35 mt-0.5">Target: {formatCompactNumber(cfg.targetScore)}</p>
        </div>

        <div className="bg-white/8 border border-white/12 rounded-xl p-2.5 flex justify-center mt-2">
          <div className="flex items-center gap-1.5">
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-sm">+{formatCompactNumber(totalReward)}</span>
            {rewardMultiplier === 2 && (
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">x2</span>
            )}
          </div>
        </div>

        {rewardMultiplier === 1 ? (
          <Button
            onClick={onClaimRewardBoost}
            disabled={!adsEnabled || isClaimingRewardAd}
            variant="outline"
            className="mt-2 border-cyan-500/45 text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-40 bg-transparent"
          >
            <PlayCircle className="w-4 h-4 mr-1.5" />
            {isClaimingRewardAd ? 'Loading ad...' : `Watch Ad to x2 (+${formatCompactNumber(baseGemsReward)})`}
          </Button>
        ) : (
          <p className="mt-2 text-[11px] font-semibold text-emerald-300">Reward boosted.</p>
        )}

        <div className="mt-3">
          <Button onClick={onNextLevel} className="w-full bg-[#f59e0b] hover:bg-[#fbbf24] text-[#101014] font-bold">
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
