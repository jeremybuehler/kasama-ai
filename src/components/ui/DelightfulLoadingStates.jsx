import React, { useState, useEffect } from "react";
import { cn } from "../../utils/cn";
import Icon from "../AppIcon";

// Animated loading messages that rotate
export const TypingLoader = ({ 
  messages = [
    "Analyzing your relationship patterns...",
    "Crafting personalized insights...",
    "Almost ready with your results...",
    "Putting the finishing touches..."
  ],
  className = ""
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentMessage = messages[currentMessageIndex];
    let charIndex = 0;
    setDisplayText("");
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (charIndex < currentMessage.length) {
        setDisplayText(currentMessage.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        
        // Wait before moving to next message
        setTimeout(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [currentMessageIndex, messages]);

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">
          {displayText}
          {isTyping && <span className="animate-typing">|</span>}
        </span>
      </div>
    </div>
  );
};

// Relationship assessment loading with progress hearts
export const AssessmentLoader = ({ progress = 0 }) => {
  const hearts = Array.from({ length: 5 }, (_, i) => i);
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-2">
        {hearts.map((heart, index) => {
          const isFilled = (index + 1) * 20 <= progress;
          const isPartial = (index * 20) < progress && progress < ((index + 1) * 20);
          
          return (
            <div
              key={heart}
              className={cn(
                "text-3xl transition-all duration-500",
                isFilled ? "text-red-500 animate-heart-beat" : 
                isPartial ? "text-red-300" : "text-gray-300"
              )}
              style={{ 
                animationDelay: `${index * 0.2}s`,
                filter: isFilled ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' : 'none'
              }}
            >
              💖
            </div>
          );
        })}
      </div>
      <div className="text-sm text-muted-foreground font-medium">
        {progress < 25 ? "Getting to know you..." :
         progress < 50 ? "Understanding your style..." :
         progress < 75 ? "Analyzing patterns..." :
         progress < 100 ? "Almost done..." : "Complete!"}
      </div>
    </div>
  );
};

// AI thinking animation
export const AIThinkingLoader = ({ message = "AI is thinking..." }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-purple-200 rounded-full"></div>
        <div className="absolute inset-0 w-8 h-8 border-2 border-purple-500 rounded-full animate-spin border-t-transparent"></div>
        <div className="absolute inset-2 w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{message}</span>
        <div className="flex space-x-1 mt-1">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

// Progress loading with encouraging messages
export const ProgressLoader = ({ 
  progress = 0, 
  encouragingMessages = {
    0: "Let's begin this journey together! 🌱",
    25: "You're doing great! Keep going! 💪",
    50: "Halfway there! You've got this! 🎯",
    75: "Almost finished! Stay strong! ⭐",
    90: "So close! Final stretch! 🏁",
    100: "Congratulations! You did it! 🎉"
  }
}) => {
  const getCurrentMessage = () => {
    const thresholds = Object.keys(encouragingMessages).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (progress >= threshold) {
        return encouragingMessages[threshold];
      }
    }
    return encouragingMessages[0];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">Progress</span>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-700 ease-out animate-shimmer relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-sm text-muted-foreground animate-slide-up">
          {getCurrentMessage()}
        </p>
      </div>
    </div>
  );
};

// Floating action loader
export const FloatingActionLoader = ({ icon = "Heart", message = "Processing..." }) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-float">
          <Icon name={icon} size={20} className="text-white" />
        </div>
        <div className="absolute -inset-2 bg-purple-400/20 rounded-full animate-ping"></div>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
};

// Skeleton loader with shimmer effect
export const DelightfulSkeleton = ({ 
  lines = 3, 
  avatar = false, 
  title = false,
  className = "" 
}) => {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="flex items-start space-x-4">
        {avatar && (
          <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
          </div>
        )}
        <div className="flex-1 space-y-3">
          {title && (
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-md w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
            </div>
          )}
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i} 
              className={`h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded relative overflow-hidden ${
                i === lines - 1 ? 'w-2/3' : 'w-full'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};