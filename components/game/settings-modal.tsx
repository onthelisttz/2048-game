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
      <DialogContent className="sm:max-w-xs bg-[#141418] border-[#27272a] text-[#e4e4e7]">
        <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          {[
            { icon: <Volume2 className="w-4 h-4 opacity-50" />, label: 'Sound', key: 'soundEnabled' as const },
            { icon: <Music className="w-4 h-4 opacity-50" />, label: 'Music', key: 'musicEnabled' as const },
            { icon: <Smartphone className="w-4 h-4 opacity-50" />, label: 'Vibration', key: 'vibrationEnabled' as const },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">{s.icon}<span className="text-sm">{s.label}</span></div>
              <Switch checked={settings[s.key]} onCheckedChange={() => toggleSettings(s.key)} />
            </div>
          ))}
        </div>
        <div className="border-t border-[#27272a] pt-3 mt-1">
          <p className="text-[11px] font-semibold opacity-50 mb-1">How to Play</p>
          <ul className="text-[11px] opacity-35 space-y-0.5">
            <li>Tap to drop blocks into columns</li>
            <li>Matching numbers merge into higher values</li>
            <li>Stay below the danger line</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
