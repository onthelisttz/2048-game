'use client';

import { Volume2, Music, Smartphone } from 'lucide-react';
import { useGame } from '@/context/game-context';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SettingsModalProps { isOpen: boolean; onClose: () => void; }

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, toggleSettings } = useGame();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm border-[#2a3550] bg-[radial-gradient(120%_100%_at_0%_0%,#1a2440_0%,#0b1328_55%,#091025_100%)] text-[#eef4ff] shadow-[0_24px_80px_rgba(0,8,28,0.65)]">
        <DialogHeader className="pr-11">
          <DialogTitle className="text-[1.1rem] font-bold">Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          {[
            { icon: Volume2, label: 'Sound', key: 'soundEnabled' as const },
            { icon: Music, label: 'Music', key: 'musicEnabled' as const },
            { icon: Smartphone, label: 'Vibration', key: 'vibrationEnabled' as const },
          ].map(s => {
            const enabled = settings[s.key];
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                  enabled
                    ? 'border-emerald-300/35 bg-emerald-500/12'
                    : 'border-white/12 bg-white/6'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${enabled ? 'text-emerald-300' : 'text-cyan-300/90'}`} />
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold tracking-wide ${
                      enabled ? 'text-emerald-300' : 'text-white/50'
                    }`}
                  >
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => toggleSettings(s.key)}
                    className="h-5 w-10 border border-white/20 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-500/60"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-white/10 pt-3 mt-1">
          <p className="text-[11px] font-semibold text-white/65 mb-2">How to Play</p>
          <ul className="text-[11px] text-white/45 space-y-1">
            <li>- Tap to drop blocks into columns.</li>
            <li>- Matching numbers merge into higher values.</li>
            <li>- Stay below the danger line.</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
