import React, { useState, useEffect } from "react";
import { cn } from "../../utils/cn";
import Icon from "../AppIcon";
import Button from "./Button";

const DelightfulEmptyState = ({ 
  icon = "Heart",
  title = "Nothing here yet!",
  description = "But that's about to change...",
  actionText = "Get Started",
  onAction = null,
  variant = "encouraging",
  animated = true,
  className = ""
}) => {
  const [currentEmoji, setCurrentEmoji] = useState("🌱");
  const [showEncouragement, setShowEncouragement] = useState(false);

  const emojis = ["🌱", "🌸", "🦋", "⭐", "🌈", "💫", "✨"];
  const encouragingPhrases = [
    "Every journey starts with a single step! 🚀",
    "Your future self will thank you! 💪",
    "Great things are about to happen! ⚡",
    "Ready to make some magic? ✨",
    "Your story begins here! 📖",
  ];

  useEffect(() => {
    if (animated) {
      const emojiInterval = setInterval(() => {
        setCurrentEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
      }, 2000);

      const encouragementTimer = setTimeout(() => {
        setShowEncouragement(true);
      }, 1500);

      return () => {
        clearInterval(emojiInterval);
        clearTimeout(encouragementTimer);
      };
    }
  }, [animated]);

  const getVariantStyles = () => {
    switch (variant) {
      case "encouraging":
        return {
          container: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
          icon: "text-purple-500 bg-purple-100",
          title: "text-purple-900",
          description: "text-purple-700"
        };
      case "achievement":
        return {
          container: "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200",
          icon: "text-yellow-600 bg-yellow-100",
          title: "text-yellow-900",
          description: "text-yellow-700"
        };
      case "relationship":
        return {
          container: "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200",
          icon: "text-rose-500 bg-rose-100",
          title: "text-rose-900",
          description: "text-rose-700"
        };
      case "progress":
        return {
          container: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
          icon: "text-blue-500 bg-blue-100",
          title: "text-blue-900",
          description: "text-blue-700"
        };
      default:
        return {
          container: "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200",
          icon: "text-gray-500 bg-gray-100",
          title: "text-gray-900",
          description: "text-gray-700"
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-8 text-center transition-all duration-300 hover:shadow-lg",
      variantStyles.container,
      animated && "animate-slide-up",
      className
    )}>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">💫</div>
        <div className="absolute top-6 right-6 text-xl opacity-30 animate-float" style={{ animationDelay: '1s' }}>✨</div>
        <div className="absolute bottom-6 left-8 text-lg opacity-25 animate-float" style={{ animationDelay: '2s' }}>🌟</div>
        <div className="absolute bottom-4 right-4 text-2xl opacity-20 animate-float" style={{ animationDelay: '3s' }}>💝</div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300",
          variantStyles.icon,
          animated && "hover:animate-celebration-bounce hover:scale-110"
        )}>
          <Icon name={icon} size={32} />
        </div>

        <h3 className={cn(
          "text-xl font-semibold mb-2 transition-colors duration-300",
          variantStyles.title
        )}>
          {title}
        </h3>

        <p className={cn(
          "text-sm mb-6 max-w-sm mx-auto",
          variantStyles.description
        )}>
          {description}
        </p>

        {/* Animated emoji */}
        {animated && (
          <div className="mb-4">
            <span className="text-3xl animate-bounce" key={currentEmoji}>
              {currentEmoji}
            </span>
          </div>
        )}

        {/* Encouraging message */}
        {showEncouragement && (
          <div className="mb-6 animate-slide-up">
            <p className="text-xs text-muted-foreground italic">
              {encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)]}
            </p>
          </div>
        )}

        {/* Action button */}
        {onAction && (
          <Button
            onClick={onAction}
            variant="default"
            size="lg"
            iconName="ArrowRight"
            iconPosition="right"
            className="hover:scale-105 hover:-translate-y-0.5 transition-all duration-200"
          >
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
};

// Specific empty states for different sections
export const NoAssessmentsYet = ({ onStartAssessment }) => (
  <DelightfulEmptyState
    icon="FileText"
    title="Ready for your first assessment?"
    description="Discover insights about your relationship style and communication patterns. It only takes 5 minutes!"
    actionText="Take Assessment"
    onAction={onStartAssessment}
    variant="encouraging"
  />
);

export const NoAchievementsYet = ({ onStartJourney }) => (
  <DelightfulEmptyState
    icon="Award"
    title="Your achievement gallery awaits!"
    description="Complete assessments, practice new skills, and unlock beautiful badges that celebrate your growth."
    actionText="Start Your Journey"
    onAction={onStartJourney}
    variant="achievement"
  />
);

export const NoProgressYet = ({ onGetStarted }) => (
  <DelightfulEmptyState
    icon="TrendingUp"
    title="Your growth story starts here!"
    description="Track your relationship skills, celebrate milestones, and see your progress unfold over time."
    actionText="Begin Tracking"
    onAction={onGetStarted}
    variant="progress"
  />
);

export const NoInsightsYet = ({ onExplore }) => (
  <DelightfulEmptyState
    icon="Lightbulb"
    title="Personalized insights coming soon!"
    description="Complete your first assessment to unlock daily tips, relationship advice, and growth opportunities."
    actionText="Explore Now"
    onAction={onExplore}
    variant="relationship"
  />
);

// Loading state for empty components
export const LoadingEmptyState = ({ message = "Loading your journey..." }) => (
  <div className="text-center p-8">
    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
      <Icon name="Heart" size={32} className="text-purple-400 animate-heart-beat" />
    </div>
    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
      {message}
    </h3>
    <div className="flex justify-center space-x-1">
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

export default DelightfulEmptyState;