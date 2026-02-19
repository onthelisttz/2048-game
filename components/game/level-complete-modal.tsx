'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gem, Star, ArrowRight, PlayCircle } from 'lucide-react';
import { getLevelConfig } from '@/utils/game-data';

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
        className="max-w-xs bg-[#141418] border-[#27272a] text-[#e4e4e7] text-center"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="py-3">
          <p className="text-sm opacity-40 mb-1">Level {level}</p>
          <h2 className="text-3xl font-black text-[#f59e0b]">COMPLETE!</h2>
        </div>

        <div className="flex justify-center gap-2 my-2">
          {[1, 2, 3].map((s) => (
            <Star key={s} className={`w-8 h-8 transition-all duration-500 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-[#27272a]'}`} style={{ transitionDelay: `${s * 150}ms` }} />
          ))}
        </div>

        <div className="bg-[#1a1a22] rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase tracking-wider opacity-40">Score</span>
          <p className="text-2xl font-black tabular-nums">{score.toLocaleString()}</p>
          <p className="text-[10px] opacity-30 mt-0.5">Target: {cfg.targetScore.toLocaleString()}</p>
        </div>

        <div className="bg-[#1a1a22] rounded-lg p-2.5 flex justify-center mt-2">
          <div className="flex items-center gap-1.5">
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-sm">+{totalReward}</span>
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
            className="mt-2 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-40 bg-transparent"
          >
            <PlayCircle className="w-4 h-4 mr-1.5" />
            {isClaimingRewardAd ? 'Loading ad...' : `Watch Ad to x2 (+${baseGemsReward})`}
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
