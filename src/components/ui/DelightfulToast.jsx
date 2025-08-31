import React, { useState, useEffect } from "react";
import { cn } from "../../utils/cn";
import Icon from "../AppIcon";

const DelightfulToast = ({ 
  message, 
  type = "success", 
  duration = 4000,
  icon = null,
  onClose = null,
  animate = true,
  showProgress = true,
  className = ""
}) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (showProgress && duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 50));
          if (newProgress <= 0) {
            clearInterval(interval);
            return 0;
          }
          return newProgress;
        });
      }, 50);

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose && onClose(), 300);
        clearInterval(interval);
      }, duration);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [duration, onClose, showProgress]);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
          text: "text-green-800",
          icon: "Check",
          iconBg: "bg-green-500",
          progressBg: "bg-green-500"
        };
      case "error":
        return {
          bg: "bg-gradient-to-r from-red-50 to-pink-50 border-red-200",
          text: "text-red-800",
          icon: "X",
          iconBg: "bg-red-500",
          progressBg: "bg-red-500"
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200",
          text: "text-yellow-800",
          icon: "AlertTriangle",
          iconBg: "bg-yellow-500",
          progressBg: "bg-yellow-500"
        };
      case "info":
        return {
          bg: "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200",
          text: "text-blue-800",
          icon: "Info",
          iconBg: "bg-blue-500",
          progressBg: "bg-blue-500"
        };
      case "celebration":
        return {
          bg: "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200",
          text: "text-purple-800",
          icon: "Star",
          iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
          progressBg: "bg-gradient-to-r from-purple-500 to-pink-500"
        };
      default:
        return {
          bg: "bg-card border-border",
          text: "text-foreground",
          icon: "Bell",
          iconBg: "bg-muted",
          progressBg: "bg-muted"
        };
    }
  };

  const typeStyles = getTypeStyles();
  const displayIcon = icon || typeStyles.icon;

  if (!visible) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-sm w-full",
      animate && (visible ? "animate-slide-in" : "animate-slide-out"),
      className
    )}>
      <div className={cn(
        "relative overflow-hidden rounded-lg border shadow-lg p-4",
        typeStyles.bg,
        type === "celebration" && "animate-glow-pulse"
      )}>
        <div className="flex items-start space-x-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            typeStyles.iconBg,
            type === "celebration" && "animate-celebration-bounce"
          )}>
            <Icon 
              name={displayIcon} 
              size={16} 
              className="text-white" 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", typeStyles.text)}>
              {type === "celebration" && "🎉 "}
              {message}
              {type === "success" && " ✨"}
            </p>
          </div>
          
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(() => onClose && onClose(), 300);
            }}
            className={cn(
              "flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors",
              typeStyles.text
            )}
          >
            <Icon name="X" size={14} />
          </button>
        </div>
        
        {/* Progress bar */}
        {showProgress && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
            <div 
              className={cn("h-full transition-all duration-100 ease-linear", typeStyles.progressBg)}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Toast context and provider for managing multiple toasts
export const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now();
    const newToast = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message, options = {}) => addToast({ message, type: "success", ...options }),
    error: (message, options = {}) => addToast({ message, type: "error", ...options }),
    warning: (message, options = {}) => addToast({ message, type: "warning", ...options }),
    info: (message, options = {}) => addToast({ message, type: "info", ...options }),
    celebration: (message, options = {}) => addToast({ message, type: "celebration", duration: 6000, ...options }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <DelightfulToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            icon={toast.icon}
            onClose={() => removeToast(toast.id)}
            className={`animate-slide-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Celebration toast messages for relationship milestones
export const celebrationMessages = {
  firstAssessment: "You've taken your first step toward better relationships! 🌟",
  weekStreak: "One week of consistent practice - you're building great habits! 🔥",
  monthStreak: "A full month of growth - you're becoming a relationship champion! 🏆",
  communicationMastery: "Communication skills unlocked! You're connecting like a pro! 💬",
  empathyLevel: "Your empathy is growing stronger every day! ❤️",
  conflictResolution: "Conflict resolution mastery achieved - peace maker status! ☮️",
  relationshipGoals: "Relationship goals achieved! You're inspiring others! ✨",
};

export default DelightfulToast;