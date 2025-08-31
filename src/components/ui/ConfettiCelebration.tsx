/**
 * Confetti Celebration Component
 * Delightful animations for achievements and milestones
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  life: number;
  maxLife: number;
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
  className?: string;
}

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export default function ConfettiCelebration({
  isActive,
  duration = 3000,
  particleCount = 150,
  colors = DEFAULT_COLORS,
  onComplete,
  className
}: ConfettiCelebrationProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [animationId, setAnimationId] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        setAnimationId(null);
      }
      setParticles([]);
      return;
    }

    // Create initial particles
    const newParticles: ConfettiParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle(i, colors));
    }
    setParticles(newParticles);

    const startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        setParticles([]);
        setAnimationId(null);
        if (onComplete) onComplete();
        return;
      }

      setParticles(prevParticles => 
        prevParticles
          .map(updateParticle)
          .filter(particle => particle.life > 0)
      );

      const id = requestAnimationFrame(animate);
      setAnimationId(id);
    };

    const id = requestAnimationFrame(animate);
    setAnimationId(id);

    return () => {
      if (id) cancelAnimationFrame(id);
    };
  }, [isActive, duration, particleCount, colors, onComplete]);

  return (
    <div 
      className={cn(
        "fixed inset-0 pointer-events-none z-50",
        className
      )}
      style={{ overflow: 'hidden' }}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.life / particle.maxLife,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

function createParticle(id: number, colors: string[]): ConfettiParticle {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  return {
    id,
    x: centerX + (Math.random() - 0.5) * 100,
    y: centerY + (Math.random() - 0.5) * 50,
    vx: (Math.random() - 0.5) * 15,
    vy: (Math.random() - 0.5) * 15 - 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    gravity: 0.3 + Math.random() * 0.2,
    life: 100,
    maxLife: 100,
  };
}

function updateParticle(particle: ConfettiParticle): ConfettiParticle {
  return {
    ...particle,
    x: particle.x + particle.vx,
    y: particle.y + particle.vy,
    vx: particle.vx * 0.99,
    vy: particle.vy + particle.gravity,
    rotation: particle.rotation + particle.rotationSpeed,
    life: particle.life - 1,
  };
}

// Celebration trigger hook
export function useCelebration() {
  const [isActive, setIsActive] = useState(false);

  const celebrate = (options?: { duration?: number; particleCount?: number }) => {
    setIsActive(true);
    
    setTimeout(() => {
      setIsActive(false);
    }, options?.duration || 3000);
  };

  return { isActive, celebrate };
}

// Pre-built celebration types
export const CelebrationType = {
  Achievement: {
    duration: 2500,
    particleCount: 100,
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
  },
  Milestone: {
    duration: 3500,
    particleCount: 200,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  },
  Success: {
    duration: 2000,
    particleCount: 80,
    colors: ['#96CEB4', '#FFEAA7', '#DDA0DD'],
  },
  Celebration: {
    duration: 4000,
    particleCount: 250,
    colors: DEFAULT_COLORS,
  },
} as const;