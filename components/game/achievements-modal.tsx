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
      <DialogContent className="max-w-md max-h-[85dvh] overflow-hidden flex flex-col bg-[#141418] border-[#27272a] text-[#e4e4e7]">
        <DialogHeader className="pr-10">
          <DialogTitle className="flex items-center gap-2 min-w-0">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Achievements</span>
            <span className="ml-auto text-xs opacity-40 shrink-0">{progress.achievements.length}/{ACHIEVEMENTS.length}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {ACHIEVEMENTS.map((a) => {
            const done = progress.achievements.includes(a.id);
            const current = Math.min(getValue(a), a.requirement);
            const pct = (current / a.requirement) * 100;
            return (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${done ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#27272a] bg-[#1a1a22]'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-amber-500/20' : 'bg-[#27272a]'}`}>
                  {done ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Lock className="w-3.5 h-3.5 opacity-30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{a.name}</p>
                    {done && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] opacity-35">{a.description}</p>
                  {!done && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-[#27272a] overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] opacity-30 tabular-nums">{current}/{a.requirement}</span>
                    </div>
                  )}
                  <div className="flex gap-3 mt-1 text-[9px]">
                    <span className="flex items-center gap-0.5 text-cyan-400"><Gem className="w-2.5 h-2.5" />+{a.reward.gems}</span>
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
