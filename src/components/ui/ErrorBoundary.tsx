import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Simple functional error boundary
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <React.Suspense fallback={fallback || <div>Loading...</div>}>
      {children}
    </React.Suspense>
  );
}

// For now, we'll use a try-catch wrapper instead of class-based error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error("Captured error:", error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      // In a real app, this would trigger error reporting
      console.error("Error boundary triggered:", error);
    }
  }, [error]);

  return {
    captureError,
    resetError,
    error,
  };
}

export default ErrorBoundary;
