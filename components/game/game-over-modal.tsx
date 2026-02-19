'use client';

import { useGame } from '@/context/game-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trophy, RotateCcw, Home, Gem } from 'lucide-react';

interface GameOverModalProps { onMainMenu: () => void; currentLevel: number; }

export function GameOverModal({ onMainMenu, currentLevel }: GameOverModalProps) {
  const { gameState, restartGame } = useGame();
  const isOpen = gameState.status === 'GAME_OVER';
  const isNewBest = gameState.score === gameState.bestScore && gameState.score > 0;
  const isDangerLoss = gameState.dangerHealth <= 0;
  const gemsEarned = Math.floor(gameState.score / 100);

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xs bg-[#141418] border-[#27272a] text-[#e4e4e7]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-black">
            {isNewBest ? 'New Record!' : 'Game Over'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm opacity-50">
            {isNewBest ? 'You beat your high score!' : isDangerLoss ? 'Danger row stayed filled too long.' : 'Keep pushing!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          {isNewBest && (
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
          )}

          <div className="w-full bg-[#1a1a22] rounded-xl p-3 text-center">
            <span className="text-[10px] uppercase tracking-wider opacity-40">Final Score</span>
            <p className="text-3xl font-black tabular-nums">{gameState.score.toLocaleString()}</p>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Best Block', value: gameState.highestBlock },
              { label: 'Merges', value: gameState.totalMerges },
              { label: 'Combo', value: `${gameState.comboMultiplier.toFixed(1)}x` },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a22] rounded-lg p-2">
                <p className="text-base font-bold tabular-nums">{s.value}</p>
                <p className="text-[9px] opacity-40">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="w-full bg-[#1a1a22] rounded-lg p-2.5 flex justify-center">
            <div className="flex items-center gap-1.5"><Gem className="w-3.5 h-3.5 text-cyan-400" /><span className="font-bold text-sm">+{gemsEarned}</span></div>
          </div>

          <div className="w-full flex gap-2 mt-1">
            <Button onClick={onMainMenu} variant="outline" className="flex-1 border-[#27272a] text-[#e4e4e7] hover:bg-[#27272a] bg-transparent">
              <Home className="w-4 h-4 mr-1" />Menu
            </Button>
            <Button onClick={() => restartGame(gameState.mode, gameState.mode === 'level' ? currentLevel : 1)} className="flex-1 bg-[#f59e0b] hover:bg-[#fbbf24] text-[#101014]">
              <RotateCcw className="w-4 h-4 mr-1" />Retry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
