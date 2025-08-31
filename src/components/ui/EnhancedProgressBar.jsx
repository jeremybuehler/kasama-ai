import React, { useEffect, useState } from "react";
import { SparkleEffect } from "./ConfettiCelebration";

const EnhancedProgressBar = ({
  value = 0,
  max = 100,
  animated = true,
  showPercentage = true,
  size = "default",
  variant = "primary",
  className = "",
  label = "",
  milestones = [],
  celebrateCompletion = true,
  encouragingMessages = true,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousValue, setPreviousValue] = useState(0);

  const percentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);
  
  const getEncouragingMessage = () => {
    if (!encouragingMessages) return null;
    if (percentage === 100) return "🎉 Incredible! You did it! 🎉";
    if (percentage >= 90) return "🌟 Almost there! You're amazing! 🌟";
    if (percentage >= 75) return "💪 Great momentum! Keep pushing! 💪";
    if (percentage >= 50) return "🎯 Halfway there! You've got this! 🎯";
    if (percentage >= 25) return "🚀 Nice start! Building momentum! 🚀";
    if (percentage > 0) return "🌱 Every step counts! Keep going! 🌱";
    return null;
  };

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      
      // Celebrate completion
      const currentPercentage = Math.min(Math.max((value / max) * 100, 0), 100);
      if (currentPercentage === 100 && previousValue < 100 && celebrateCompletion) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      }
      
      setPreviousValue(currentPercentage);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated, max, previousValue, celebrateCompletion]);

  const sizeClasses = {
    sm: "h-2",
    default: "h-3",
    lg: "h-4",
  };

  const variantClasses = {
    primary: "bg-gradient-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
    success: "bg-gradient-to-r from-green-400 to-emerald-500",
    warning: "bg-gradient-to-r from-yellow-400 to-orange-500",
    error: "bg-gradient-to-r from-red-400 to-pink-500",
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className={`text-sm font-mono transition-colors duration-300 ${
              percentage === 100 
                ? "text-success animate-pulse font-bold" 
                : "text-muted-foreground"
            }`}>
              {Math.round(percentage)}%
              {percentage === 100 && " ✨"}
            </span>
          )}
        </div>
      )}
      
      <SparkleEffect trigger={showCelebration}>
        <div
          className={`w-full bg-muted rounded-full overflow-hidden relative ${sizeClasses?.[size]}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-800 ease-out relative ${variantClasses?.[variant]} ${
              percentage === 100 ? 'animate-glow-pulse' : ''
            }`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={displayValue}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label || `Progress: ${Math.round(percentage)}%`}
          >
            {/* Shimmer effect */}
            {animated && percentage > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            )}
            
            {/* Completion celebration glow */}
            {percentage === 100 && (
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            )}
          </div>
          
          {/* Milestone markers */}
          {milestones.map((milestone, index) => {
            const milestonePos = (milestone.value / max) * 100;
            const isReached = percentage >= milestonePos;
            return (
              <div
                key={milestone.value || index}
                className={`absolute top-0 bottom-0 w-0.5 transition-colors duration-300 ${
                  isReached 
                    ? 'bg-white/80 animate-pulse' 
                    : 'bg-white/40'
                }`}
                style={{ left: `${milestonePos}%` }}
                title={milestone.label || `${milestone.value}%`}
              />
            );
          })}
        </div>
      </SparkleEffect>
      
      {/* Encouraging message */}
      {encouragingMessages && getEncouragingMessage() && (
        <div className="mt-2 text-center animate-slide-up">
          <span className="text-xs text-muted-foreground/80">
            {getEncouragingMessage()}
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedProgressBar;