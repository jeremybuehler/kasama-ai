import React, { useEffect, useState } from "react";

const ConfettiCelebration = ({ 
  trigger = false, 
  duration = 3000, 
  particleCount = 50,
  onComplete = null 
}) => {
  const [particles, setParticles] = useState([]);
  const [isActive, setIsActive] = useState(false);

  const colors = [
    'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-orange-500'
  ];

  const shapes = ['square', 'circle', 'triangle'];

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        left: Math.random() * 100,
        animationDelay: Math.random() * 1000,
        animationDuration: 2000 + Math.random() * 1000,
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8
      }));
      
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, isActive, particleCount, duration, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-4 h-4 ${particle.color} animate-confetti-fall`}
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.animationDelay}ms`,
            animationDuration: `${particle.animationDuration}ms`,
            transform: `rotate(${particle.rotation}deg)`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: particle.shape === 'circle' ? '50%' : 
                         particle.shape === 'triangle' ? '0' : '2px',
          }}
        />
      ))}
    </div>
  );
};

// Floating hearts animation for relationship milestones
export const FloatingHearts = ({ trigger = false, count = 8 }) => {
  const [hearts, setHearts] = useState([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      const newHearts = Array.from({ length: count }, (_, i) => ({
        id: i,
        left: 20 + Math.random() * 60,
        animationDelay: Math.random() * 2000,
        size: 16 + Math.random() * 16,
        opacity: 0.7 + Math.random() * 0.3
      }));
      
      setHearts(newHearts);

      setTimeout(() => {
        setIsActive(false);
        setHearts([]);
      }, 4000);
    }
  }, [trigger, isActive, count]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute text-red-400 animate-float"
          style={{
            left: `${heart.left}%`,
            bottom: '10%',
            animationDelay: `${heart.animationDelay}ms`,
            fontSize: `${heart.size}px`,
            opacity: heart.opacity,
            animationDuration: '4s',
          }}
        >
          💝
        </div>
      ))}
    </div>
  );
};

// Achievement sparkles
export const SparkleEffect = ({ children, trigger = false }) => {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newSparkles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        animationDelay: Math.random() * 1000,
        size: 4 + Math.random() * 8
      }));
      
      setSparkles(newSparkles);

      setTimeout(() => {
        setSparkles([]);
      }, 2000);
    }
  }, [trigger]);

  return (
    <div className="relative">
      {children}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute text-yellow-400 animate-scale-in pointer-events-none"
          style={{
            top: `${sparkle.top}%`,
            left: `${sparkle.left}%`,
            animationDelay: `${sparkle.animationDelay}ms`,
            fontSize: `${sparkle.size}px`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
};

export default ConfettiCelebration;