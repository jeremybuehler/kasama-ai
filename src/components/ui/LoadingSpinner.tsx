import React from "react";
import { cn } from "../../utils/cn";
import { cva } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current border-t-transparent",
  {
    variants: {
      size: {
        xs: "w-3 h-3 border",
        sm: "w-4 h-4 border",
        default: "w-6 h-6 border-2",
        lg: "w-8 h-8 border-2",
        xl: "w-12 h-12 border-2",
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  variant?: "default" | "secondary" | "muted" | "destructive" | "white";
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "default",
  variant = "default",
  className,
  label = "Loading...",
  showLabel = false,
}) => {
  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={cn(
          spinnerVariants({
            size: size as "default" | "sm" | "lg" | "xs" | "xl",
            variant: variant as
              | "default"
              | "destructive"
              | "secondary"
              | "muted"
              | "white",
          }),
          className,
        )}
        role="status"
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;

// Fullscreen loading component with personality
export const FullScreenLoader: React.FC<{
  message?: string;
  variant?: LoadingSpinnerProps["variant"];
  showHearts?: boolean;
}> = ({ message = "Loading...", variant = "default", showHearts = false }) => {
  const encouragingMessages = [
    "✨ Preparing something amazing for you...",
    "🌟 Your relationship insights are loading...",
    "💝 Crafting personalized guidance...",
    "🎯 Almost ready to help you shine...",
    "🌱 Growing your connection wisdom..."
  ];

  const [currentMessage, setCurrentMessage] = React.useState(message);
  
  React.useEffect(() => {
    if (message === "Loading..." || !message) {
      const interval = setInterval(() => {
        setCurrentMessage(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setCurrentMessage(message);
    }
  }, [message]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4 max-w-xs text-center">
        <div className="relative">
          <LoadingSpinner size="xl" variant={variant} />
          {showHearts && (
            <div className="absolute -inset-4 animate-pulse">
              <div className="absolute top-0 left-0 text-red-400 text-sm animate-float">💖</div>
              <div className="absolute top-0 right-0 text-pink-400 text-sm animate-float" style={{ animationDelay: '0.5s' }}>💕</div>
              <div className="absolute bottom-0 left-0 text-purple-400 text-sm animate-float" style={{ animationDelay: '1s' }}>💜</div>
              <div className="absolute bottom-0 right-0 text-blue-400 text-sm animate-float" style={{ animationDelay: '1.5s' }}>💙</div>
            </div>
          )}
        </div>
        <p className="text-muted-foreground animate-pulse transition-all duration-500">{currentMessage}</p>
      </div>
    </div>
  );
};

// Inline loading component for buttons
export const ButtonSpinner: React.FC<{
  size?: LoadingSpinnerProps["size"];
  className?: string;
}> = ({ size = "sm", className }) => {
  return (
    <LoadingSpinner
      size={size}
      variant="white"
      className={cn("-ml-1 mr-2", className)}
    />
  );
};

// Card loading skeleton with shimmer effect
export const CardSkeleton: React.FC<{
  lines?: number;
  showAvatar?: boolean;
  className?: string;
  variant?: "default" | "relationship" | "achievement";
}> = ({ lines = 3, showAvatar = false, className, variant = "default" }) => {
  const getSkeletonContent = () => {
    switch (variant) {
      case "relationship":
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
          </div>
        );
      case "achievement":
        return (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-full mx-auto animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-24 mx-auto animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-32 mx-auto animate-pulse"></div>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                {i === lines - 1 && (
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
          </div>
        )}
        <div className="flex-1">
          {getSkeletonContent()}
        </div>
      </div>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
    </div>
  );
};

// Relationship-specific loading states
export const RelationshipLoadingCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-xl p-4 border border-border">
          <CardSkeleton variant="relationship" showAvatar={true} />
        </div>
      ))}
    </div>
  );
};

export const AchievementLoadingGrid = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-card rounded-lg p-4 border border-border">
          <CardSkeleton variant="achievement" />
        </div>
      ))}
    </div>
  );
};
