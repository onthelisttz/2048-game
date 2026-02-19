'use client';

import React from "react"

import { useGame } from '@/context/game-context';
import { GAME_WIDTH, GAME_HEIGHT } from '@/utils/constants';

export function ParticleEffect() {
  const { particles } = useGame();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[18px]">
      {particles.map((particle, idx) => {
        const angleIndex = particle.angleIndex ?? (idx % 8);
        const angle = (angleIndex / 8) * Math.PI * 2;
        const distance = 50;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;

        return (
          <div
            key={particle.id}
            className="absolute rounded-full animate-particle"
            style={{
              left: `${(particle.x / GAME_WIDTH) * 100}%`,
              top: `${(particle.y / GAME_HEIGHT) * 100}%`,
              width: 8,
              height: 8,
              backgroundColor: particle.color,
              transform: 'translate(-50%, -50%)',
              '--end-x': `${endX}px`,
              '--end-y': `${endY}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
