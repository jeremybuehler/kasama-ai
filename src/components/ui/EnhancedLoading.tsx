/**
 * Enhanced Loading Components with AI-Powered Animations
 * Beautiful, accessible loading states with personality
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, Zap, Target, TrendingUp, Sparkles } from 'lucide-react';

interface LoadingProps {
  type?: 'spinner' | 'pulse' | 'wave' | 'ai' | 'growth' | 'connection';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number;
  aiPersonality?: 'encouraging' | 'analytical' | 'supportive';
}

const LoadingIcon: React.FC<{ type: LoadingProps['type']; size: string }> = ({ type, size }) => {
  const iconClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  
  switch (type) {
    case 'ai':
      return <Brain className={`${iconClass} text-purple-500`} />;
    case 'connection':
      return <Heart className={`${iconClass} text-pink-500`} />;
    case 'growth':
      return <TrendingUp className={`${iconClass} text-green-500`} />;
    case 'wave':
      return <Zap className={`${iconClass} text-blue-500`} />;
    default:
      return <Target className={`${iconClass} text-indigo-500`} />;
  }
};

const AIPersonalityMessages = {
  encouraging: [
    "Great things take time! ✨",
    "You're making progress! 🌟",
    "Almost there! 💪",
    "Building something amazing! 🚀"
  ],
  analytical: [
    "Processing data...",
    "Analyzing patterns...",
    "Computing insights...",
    "Optimizing results..."
  ],
  supportive: [
    "We're here with you 💝",
    "Taking care of everything 🤗",
    "Just a moment, friend 🌸",
    "Making it perfect for you ✨"
  ]
};

export const SpinnerLoading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  message,
  aiPersonality = 'encouraging'
}) => {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const messages = AIPersonalityMessages[aiPersonality];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const spinnerSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <motion.div
          className={`${spinnerSize} border-3 border-gray-200 border-t-purple-500 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
        </motion.div>
      </div>
      
      {(message || messages) && (
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-gray-600 font-medium"
          >
            {message || messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      )}
    </div>
  );
};

export const PulseLoading: React.FC<LoadingProps> = ({ 
  type = 'ai', 
  size = 'md',
  message 
}) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      <motion.div
        className="relative"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <LoadingIcon type={type} size={size} />
        
        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-300"
          animate={{ 
            scale: [1, 2, 3],
            opacity: [0.6, 0.2, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-400"
          animate={{ 
            scale: [1, 2.5, 4],
            opacity: [0.4, 0.1, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.3
          }}
        />
      </motion.div>
      
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

export const WaveLoading: React.FC<LoadingProps> = ({ 
  size = 'md',
  message 
}) => {
  const dotCount = 5;
  const dots = Array.from({ length: dotCount }, (_, i) => i);
  
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-1">
        {dots.map((dot) => (
          <motion.div
            key={dot}
            className={`${dotSize} bg-gradient-to-r from-purple-500 to-pink-500 rounded-full`}
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: dot * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {message && (
        <motion.p
          className="text-sm text-gray-600 text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export const ProgressLoading: React.FC<LoadingProps> = ({ 
  progress = 0,
  message,
  type = 'growth'
}) => {
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);
  
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center justify-between">
        <LoadingIcon type={type} size="sm" />
        <span className="text-sm font-medium text-gray-700">{Math.round(animatedProgress)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${animatedProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

export const AIThinkingLoading: React.FC<LoadingProps> = ({ 
  size = 'md',
  aiPersonality = 'encouraging'
}) => {
  const [thinkingDots, setThinkingDots] = React.useState('');
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setThinkingDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  const messages = {
    encouraging: "AI is crafting something amazing for you",
    analytical: "Processing your request with advanced algorithms", 
    supportive: "Thoughtfully preparing your personalized insights"
  };
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <motion.div
          className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className="w-6 h-6 text-purple-600" />
        </motion.div>
        
        {/* Thinking bubbles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-300 rounded-full"
            style={{
              top: `${20 + i * 5}%`,
              right: `${-10 - i * 8}%`
            }}
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <div className="text-center">
        <motion.p
          className="text-sm text-gray-700 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {messages[aiPersonality]}
          <span className="inline-block w-8 text-left">{thinkingDots}</span>
        </motion.p>
      </div>
    </div>
  );
};

export const SkeletonLoading: React.FC<{ 
  lines?: number; 
  className?: string;
  avatar?: boolean;
}> = ({ 
  lines = 3, 
  className = '',
  avatar = false 
}) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {avatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            <div className="h-2 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      )}
      
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className={`h-3 bg-gray-200 rounded ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}></div>
        </div>
      ))}
    </div>
  );
};

export const LoadingOverlay: React.FC<LoadingProps & { 
  isVisible: boolean;
  backdrop?: boolean;
}> = ({ 
  isVisible,
  backdrop = true,
  type = 'ai',
  size = 'lg',
  message,
  aiPersonality = 'encouraging'
}) => {
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          backdrop ? 'bg-black bg-opacity-50' : ''
        }`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-lg p-8 shadow-xl max-w-sm w-full mx-4"
        >
          {type === 'ai' ? (
            <AIThinkingLoading size={size} aiPersonality={aiPersonality} />
          ) : type === 'wave' ? (
            <WaveLoading size={size} message={message} />
          ) : type === 'pulse' ? (
            <PulseLoading size={size} message={message} />
          ) : (
            <SpinnerLoading size={size} message={message} aiPersonality={aiPersonality} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Enhanced Loading Component
export const EnhancedLoading: React.FC<LoadingProps> = (props) => {
  switch (props.type) {
    case 'pulse':
      return <PulseLoading {...props} />;
    case 'wave':
      return <WaveLoading {...props} />;
    case 'ai':
      return <AIThinkingLoading {...props} />;
    case 'growth':
      return <ProgressLoading {...props} />;
    default:
      return <SpinnerLoading {...props} />;
  }
};

export default EnhancedLoading;
