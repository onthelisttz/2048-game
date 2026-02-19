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

  const getProg = (type: string) => (isNewDay ? 0 : (progress.dailyChallengeProgress[type] || 0));
  const isDone = (id: string, type: string, target: number) =>
    progress.completedDailyChallenges.includes(id) || getProg(type) >= target;
  const doneCount = challenges.filter(c => isDone(c.id, c.type, c.target)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[88dvh] overflow-hidden flex flex-col border-[#2a3550] bg-[radial-gradient(120%_100%_at_0%_0%,#1a2440_0%,#0b1328_55%,#091025_100%)] text-[#eef4ff] shadow-[0_24px_80px_rgba(0,8,28,0.65)]">
        <DialogHeader className="pr-11">
          <DialogTitle className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/18 border border-cyan-400/35">
              <Calendar className="w-4 h-4 text-cyan-300" />
            </span>
            <span className="truncate text-[1.1rem] font-bold">Daily Challenges</span>
            <span className="ml-auto rounded-full bg-cyan-500/16 border border-cyan-400/35 px-2.5 py-1 text-[11px] font-bold text-cyan-300 shrink-0">
              {doneCount}/3
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="-mt-1">
          <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/75">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mt-3">
          {challenges.map((c, i) => {
            const cur = getProg(c.type);
            const done = isDone(c.id, c.type, c.target);
            const pct = Math.min((cur / c.target) * 100, 100);
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition ${
                  done ? 'border-emerald-400/35 bg-emerald-500/10' : 'border-white/12 bg-[#151d34]/95'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${done ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/8 text-white/75'}`}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Target className="w-3.5 h-3.5 text-cyan-300/70 shrink-0" />
                    <p className="font-semibold text-[1.05rem] leading-5 truncate">{c.description}</p>
                    {done && (
                      <span className="ml-auto rounded-full bg-emerald-500/20 border border-emerald-400/35 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 shrink-0">
                        Done
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/50 tabular-nums">{cur}/{c.target}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/12 px-2 py-0.5 font-bold text-cyan-300">
                      <Gem className="w-3 h-3" />
                      +{c.reward.gems}
                    </span>
                  </div>
                  {!done && (
                    <div className="mt-1 text-[10px] text-white/35">
                      Keep going to claim reward.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {doneCount === 3 ? (
          <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-400/25 text-center">
            <p className="text-[11px] text-emerald-300 font-semibold">All done. Come back tomorrow.</p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white/6 border border-white/10 text-center">
            <p className="text-[11px] text-white/60 font-medium">
              Complete all 3 challenges for a perfect day.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
