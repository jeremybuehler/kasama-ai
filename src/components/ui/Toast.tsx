import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "../../utils/cn";
import { cva } from "class-variance-authority";
import Button from "./Button";
import { useNotifications, useAppActions } from "../../lib/store";
import { Notification } from "../../lib/types";

const toastVariants = cva(
  "relative flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-card border-border text-card-foreground",
        success: "bg-success/10 border-success/20 text-success-foreground",
        error:
          "bg-destructive/10 border-destructive/20 text-destructive-foreground",
        warning: "bg-warning/10 border-warning/20 text-warning-foreground",
        info: "bg-primary/10 border-primary/20 text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ToastProps {
  id: string;
  title: string;
  message?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  closable?: boolean;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  variant = "default",
  duration = 5000,
  closable = true,
  onClose,
  action,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 150); // Animation duration
  }, [onClose]);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);

    // Auto close
    let autoCloseTimer: NodeJS.Timeout;
    if (duration > 0) {
      autoCloseTimer = setTimeout(handleClose, duration);
    }

    return () => {
      clearTimeout(timer);
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [duration, handleClose]);

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "info":
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div
      className={cn(
        toastVariants({
          variant: variant as
            | "info"
            | "success"
            | "warning"
            | "error"
            | "default",
        }),
        "transform transition-all duration-300 ease-in-out",
        isVisible && !isExiting
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95",
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {message && <p className="text-sm opacity-90 mt-1">{message}</p>}

        {/* Action */}
        {action && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="xs"
              onClick={action.onClick}
              className="text-xs"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Close button */}
      {closable && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="flex-shrink-0 w-6 h-6 -mr-1 -mt-1 hover:bg-black/10"
          aria-label="Close notification"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

// Toast container component
const ToastContainer: React.FC = () => {
  const notifications = useNotifications();
  const { removeNotification } = useAppActions();

  const visibleNotifications = notifications.slice(0, 5); // Show max 5 toasts

  if (visibleNotifications.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {visibleNotifications.map((notification) => (
        <Toast
          key={notification.id}
          id={notification.id}
          title={notification.title}
          message={notification.message}
          variant={notification.type as any}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>,
    document.body,
  );
};

// Toast API for programmatic usage
class ToastAPI {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  private notify(notification: Omit<Notification, "id" | "createdAt">) {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date().toISOString(),
    };

    this.notifications = [newNotification, ...this.notifications].slice(0, 10);
    this.listeners.forEach((listener) => listener(this.notifications));

    return id;
  }

  success(
    title: string,
    message?: string,
    options?: { duration?: number; action?: ToastProps["action"] },
  ) {
    return this.notify({
      title,
      message,
      type: "success",
      read: false,
      userId: "current",
    });
  }

  error(
    title: string,
    message?: string,
    options?: { duration?: number; action?: ToastProps["action"] },
  ) {
    return this.notify({
      title,
      message,
      type: "error",
      read: false,
      userId: "current",
    });
  }

  warning(
    title: string,
    message?: string,
    options?: { duration?: number; action?: ToastProps["action"] },
  ) {
    return this.notify({
      title,
      message,
      type: "warning",
      read: false,
      userId: "current",
    });
  }

  info(
    title: string,
    message?: string,
    options?: { duration?: number; action?: ToastProps["action"] },
  ) {
    return this.notify({
      title,
      message,
      type: "info",
      read: false,
      userId: "current",
    });
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.listeners.forEach((listener) => listener(this.notifications));
  }

  dismissAll() {
    this.notifications = [];
    this.listeners.forEach((listener) => listener(this.notifications));
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const toast = new ToastAPI();

// Hook for using toast
export function useToast() {
  const { addNotification, removeNotification } = useAppActions();

  return {
    success: (title: string, message?: string) => {
      addNotification({
        title,
        message,
        type: "success",
        read: false,
        userId: "current",
      });
    },
    error: (title: string, message?: string) => {
      addNotification({
        title,
        message,
        type: "error",
        read: false,
        userId: "current",
      });
    },
    warning: (title: string, message?: string) => {
      addNotification({
        title,
        message,
        type: "warning",
        read: false,
        userId: "current",
      });
    },
    info: (title: string, message?: string) => {
      addNotification({
        title,
        message,
        type: "info",
        read: false,
        userId: "current",
      });
    },
    dismiss: removeNotification,
  };
}

export { Toast, ToastContainer };
export default Toast;
