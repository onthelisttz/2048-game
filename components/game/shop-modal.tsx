'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlayer } from '@/context/player-context';
import { THEMES, POWERUPS, BG_IMAGES } from '@/utils/game-data';
import { Gem, Check, Lock, Paintbrush, Zap, Image as ImageIcon, ShoppingBag, PlayCircle } from 'lucide-react';

interface ShopModalProps { isOpen: boolean; onClose: () => void; }

export function ShopModal({ isOpen, onClose }: ShopModalProps) {
  const { progress, unlockTheme, equipTheme, unlockBgImage, equipBgImage, spendGems, addPowerup, isDev, adsEnabled, claimAdGems } = usePlayer();
  const [tab, setTab] = useState('themes');
  const [isClaimingAd, setIsClaimingAd] = useState(false);

  const handleBuyTheme = (id: string) => { if (unlockTheme(id)) equipTheme(id); };
  const handleBuyPowerup = (id: string, price: number) => { if (spendGems(price)) addPowerup(id, 1); };
  const handleBuyBg = (id: string) => { if (unlockBgImage(id)) equipBgImage(id); };
  const handleClaimAdGems = async () => {
    if (isClaimingAd) return;
    setIsClaimingAd(true);
    try {
      await claimAdGems();
    } finally {
      setIsClaimingAd(false);
    }
  };

  const themeStatus = (t: typeof THEMES[0]) => {
    if (progress.unlockedThemes.includes(t.id)) return progress.equippedTheme === t.id ? 'equipped' : 'owned';
    if (!isDev && t.unlockLevel && progress.currentLevel < t.unlockLevel) return 'locked';
    if (!isDev && progress.gems < t.price) return 'expensive';
    return 'available';
  };

  const bgStatus = (b: typeof BG_IMAGES[0]) => {
    if (progress.unlockedBgImages.includes(b.id)) return progress.equippedBgImage === b.id ? 'equipped' : 'owned';
    if (!isDev && b.unlockLevel && progress.currentLevel < b.unlockLevel) return 'locked';
    if (!isDev && progress.gems < b.price) return 'expensive';
    return 'available';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-hidden flex flex-col bg-[#141418] border-[#27272a] text-[#e4e4e7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Shop</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 p-2.5 rounded-lg bg-[#1a1a22]">
          <div className="flex items-center gap-1.5"><Gem className="w-3.5 h-3.5 text-cyan-400" /><span className="font-bold text-sm">{progress.gems}</span></div>
          <button
            onClick={handleClaimAdGems}
            disabled={isClaimingAd || !adsEnabled}
            className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold text-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: 'rgba(34,211,238,0.4)', backgroundColor: 'rgba(34,211,238,0.12)' }}
            title="Watch ad for gems"
          >
            <PlayCircle className="w-3 h-3" />
            {isClaimingAd ? '...' : '+20'}
          </button>
          {isDev && <span className="ml-auto text-[9px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">DEV</span>}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-[#141924] border border-[#2a3247]">
            <TabsTrigger value="themes" className="text-xs text-[#aab3c5] hover:text-[#d8e0ef] data-[state=active]:bg-[#2a3247] data-[state=active]:text-[#f8fbff] data-[state=active]:shadow-none"><Paintbrush className="w-3 h-3 mr-1" />Themes</TabsTrigger>
            <TabsTrigger value="backgrounds" className="text-xs text-[#aab3c5] hover:text-[#d8e0ef] data-[state=active]:bg-[#2a3247] data-[state=active]:text-[#f8fbff] data-[state=active]:shadow-none"><ImageIcon className="w-3 h-3 mr-1" />Wallpaper</TabsTrigger>
            <TabsTrigger value="powerups" className="text-xs text-[#aab3c5] hover:text-[#d8e0ef] data-[state=active]:bg-[#2a3247] data-[state=active]:text-[#f8fbff] data-[state=active]:shadow-none"><Zap className="w-3 h-3 mr-1" />Powerups</TabsTrigger>
          </TabsList>

          {/* Themes */}
          <TabsContent value="themes" className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {THEMES.map((t) => {
              const s = themeStatus(t);
              return (
                <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${s === 'equipped' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-[#27272a] bg-[#1a1a22]'} ${s === 'locked' || s === 'expensive' ? 'opacity-50' : ''}`}>
                  <div className="w-11 h-11 rounded-lg grid grid-cols-2 gap-0.5 p-1 shrink-0" style={{ backgroundColor: t.colors.gridBg }}>
                    {[2, 4, 8, 16].map(v => (
                      <div key={v} className="rounded-sm flex items-center justify-center text-[5px] font-bold" style={{ backgroundColor: t.blockColors[v]?.bg, color: t.blockColors[v]?.text }}>{v}</div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t.name}</p>
                    {s === 'locked' && t.unlockLevel && <p className="text-[10px] opacity-40">Lv.{t.unlockLevel}</p>}
                  </div>
                  {s === 'equipped' ? <Check className="w-4 h-4 text-emerald-400" /> :
                   s === 'owned' ? <button onClick={() => equipTheme(t.id)} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20">Equip</button> :
                   s === 'locked' ? <Lock className="w-4 h-4 opacity-40" /> :
                   <button onClick={() => handleBuyTheme(t.id)} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#f59e0b] text-[#101014] hover:bg-[#fbbf24]"><Gem className="w-3 h-3" />{t.price}</button>}
                </div>
              );
            })}
          </TabsContent>

          {/* Background Images */}
          <TabsContent value="backgrounds" className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {BG_IMAGES.filter(b => b.id !== 'custom').map((b) => {
              const s = bgStatus(b);
              return (
                <div key={b.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${s === 'equipped' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-[#27272a] bg-[#1a1a22]'} ${s === 'locked' || s === 'expensive' ? 'opacity-50' : ''}`}>
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-[#27272a]">
                    {b.url ? (
                      <Image src={b.url} alt={b.name} width={44} height={44} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 opacity-30" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{b.name}</p>
                    {s === 'locked' && b.unlockLevel && <p className="text-[10px] opacity-40">Lv.{b.unlockLevel}</p>}
                  </div>
                  {s === 'equipped' ? <Check className="w-4 h-4 text-emerald-400" /> :
                   s === 'owned' ? <button onClick={() => equipBgImage(b.id)} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20">Use</button> :
                   s === 'locked' ? <Lock className="w-4 h-4 opacity-40" /> :
                  <button onClick={() => handleBuyBg(b.id)} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#f59e0b] text-[#101014] hover:bg-[#fbbf24]"><Gem className="w-3 h-3" />{b.price}</button>}
                </div>
              );
            })}
          </TabsContent>

          {/* Powerups */}
          <TabsContent value="powerups" className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {POWERUPS.map((p) => {
              const owned = progress.powerups[p.id] || 0;
              const canAfford = isDev || progress.gems >= p.price;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#27272a] bg-[#1a1a22]">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${THEMES[0].colors.accent}20` }}>
                    <Zap className="w-5 h-5" style={{ color: THEMES[0].colors.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm">{p.name}</p>
                      {owned > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10">x{owned}</span>}
                    </div>
                    <p className="text-[10px] opacity-40">{p.description}</p>
                  </div>
                  <button onClick={() => handleBuyPowerup(p.id, p.price)} disabled={!canAfford} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#f59e0b] text-[#101014] hover:bg-[#fbbf24] disabled:opacity-30"><Gem className="w-3 h-3" />{p.price}</button>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
