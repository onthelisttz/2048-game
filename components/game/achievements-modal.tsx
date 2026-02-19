'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlayer } from '@/context/player-context';
import { ACHIEVEMENTS } from '@/utils/game-data';
import { Trophy, Star, Check, Lock, Gem } from 'lucide-react';

interface AchievementsModalProps { isOpen: boolean; onClose: () => void; }

export function AchievementsModal({ isOpen, onClose }: AchievementsModalProps) {
  const { progress } = usePlayer();

  const getValue = (a: typeof ACHIEVEMENTS[0]) => {
    switch (a.type) {
      case 'score': return progress.totalScore;
      case 'level': return progress.currentLevel;
      case 'merges': return progress.totalMerges;
      case 'combo': return progress.highestCombo;
      case 'games': return progress.gamesPlayed;
      case 'block_value': return progress.highestBlock;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[88dvh] overflow-hidden flex flex-col border-[#2a3550] bg-[radial-gradient(120%_100%_at_0%_0%,#1a2440_0%,#0b1328_55%,#091025_100%)] text-[#eef4ff] shadow-[0_24px_80px_rgba(0,8,28,0.65)]">
        <DialogHeader className="pr-11">
          <DialogTitle className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-300/35">
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
            </span>
            <span className="truncate text-[1.1rem] font-bold">Achievements</span>
            <span className="ml-auto rounded-full bg-amber-500/16 border border-amber-300/35 px-2.5 py-1 text-[11px] font-bold text-amber-200 shrink-0">
              {progress.achievements.length}/{ACHIEVEMENTS.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {ACHIEVEMENTS.map((a) => {
            const done = progress.achievements.includes(a.id);
            const current = Math.min(getValue(a), a.requirement);
            const pct = (current / a.requirement) * 100;
            return (
              <div key={a.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition ${done ? 'border-amber-400/35 bg-amber-500/10' : 'border-white/12 bg-[#151d34]/95'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-amber-500/22 border border-amber-300/35' : 'bg-white/8 border border-white/10'}`}>
                  {done ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Lock className="w-3.5 h-3.5 opacity-30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate text-white">{a.name}</p>
                    {done && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-white/45">{a.description}</p>
                  {!done && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-white/40 tabular-nums">{current}/{a.requirement}</span>
                    </div>
                  )}
                  <div className="flex gap-3 mt-2 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/12 px-2 py-0.5 font-bold text-cyan-300">
                      <Gem className="w-3 h-3" />
                      +{a.reward.gems}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
