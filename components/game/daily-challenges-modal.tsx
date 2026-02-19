'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlayer } from '@/context/player-context';
import { Calendar, Gem, Check, Target } from 'lucide-react';

interface DailyChallengesModalProps { isOpen: boolean; onClose: () => void; }

export function DailyChallengesModal({ isOpen, onClose }: DailyChallengesModalProps) {
  const { progress, getDailyChallenges } = usePlayer();
  const challenges = getDailyChallenges();
  const today = new Date().toDateString();
  const isNewDay = progress.dailyChallengeDate !== today;

  const getProg = (type: string) => isNewDay ? 0 : (progress.dailyChallengeProgress[type] || 0);
  const isDone = (id: string, type: string, target: number) => progress.completedDailyChallenges.includes(id) || getProg(type) >= target;
  const doneCount = challenges.filter(c => isDone(c.id, c.type, c.target)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-hidden flex flex-col bg-[#141418] border-[#27272a] text-[#e4e4e7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" /> Daily Challenges
            <span className="ml-auto text-xs opacity-40">{doneCount}/3</span>
          </DialogTitle>
        </DialogHeader>

        <p className="text-[11px] opacity-35">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2">
          {challenges.map((c, i) => {
            const cur = getProg(c.type);
            const done = isDone(c.id, c.type, c.target);
            const pct = Math.min((cur / c.target) * 100, 100);
            return (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#27272a] bg-[#1a1a22]'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#27272a] opacity-60'}`}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 opacity-40" />
                    <p className="font-semibold text-sm">{c.description}</p>
                  </div>
                  {!done && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-[#27272a] overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] opacity-30 tabular-nums">{cur}/{c.target}</span>
                    </div>
                  )}
                  <div className="flex gap-3 mt-1 text-[9px]">
                    <span className="flex items-center gap-0.5 text-cyan-400"><Gem className="w-2.5 h-2.5" />+{c.reward.gems}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {doneCount === 3 && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-[11px] text-amber-400 font-medium">All done! Come back tomorrow.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
