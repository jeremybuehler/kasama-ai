import React, { useEffect, useState } from "react";

const ProgressBar = ({
  value = 0,
  max = 100,
  animated = true,
  showPercentage = true,
  size = "default",
  variant = "primary",
  className = "",
  label = "",
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const percentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-2",
    default: "h-3",
    lg: "h-4",
  };

  const variantClasses = {
    primary: "bg-gradient-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-mono text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses?.[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-800 ease-out ${variantClasses?.[variant]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={displayValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${Math.round(percentage)}%`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
