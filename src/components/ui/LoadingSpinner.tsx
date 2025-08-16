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

// Fullscreen loading component
export const FullScreenLoader: React.FC<{
  message?: string;
  variant?: LoadingSpinnerProps["variant"];
}> = ({ message = "Loading...", variant = "default" }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" variant={variant} />
        <p className="text-muted-foreground animate-pulse">{message}</p>
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

// Card loading skeleton
export const CardSkeleton: React.FC<{
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ lines = 3, showAvatar = false, className }) => {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="flex items-start space-x-4">
        {showAvatar && <div className="w-10 h-10 bg-muted rounded-full"></div>}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              {i === lines - 1 && (
                <div className="h-4 bg-muted rounded w-2/3"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
