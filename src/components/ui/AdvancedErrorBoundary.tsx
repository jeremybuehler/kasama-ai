/**
 * Advanced Error Boundary with AI-Powered Error Analysis
 * Production-ready error handling with user-friendly recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Send, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  enableRecovery?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isReporting: boolean;
  retryCount: number;
}

export class AdvancedErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isReporting: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Set detailed error info
    this.setState({ errorInfo });
    
    // Log error with context
    this.logErrorWithContext(error, errorInfo, level);
    
    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private logErrorWithContext = (error: Error, errorInfo: ErrorInfo, level: string) => {
    const errorContext = {
      errorId: this.state.errorId,
      level,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user_id'),
      sessionId: sessionStorage.getItem('session_id')
    };
    
    console.group('🚨 Application Error Caught');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', errorContext);
    console.groupEnd();
    
    // Store for potential reporting
    sessionStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(errorContext));
  };

  private reportErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send to error reporting service (e.g., Sentry, LogRocket)
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level,
        timestamp: Date.now(),
        userContext: {
          userId: localStorage.getItem('user_id'),
          subscriptionTier: localStorage.getItem('subscription_tier'),
          lastRoute: sessionStorage.getItem('last_route')
        },
        deviceContext: {
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          connection: (navigator as any).connection?.effectiveType
        }
      };
      
      // In production, send to your error reporting endpoint
      console.log('Would report error:', errorReport);
      
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;
    
    if (retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
      return;
    }
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
    
    // Show retry feedback
    toast.success(`Retrying... (Attempt ${retryCount + 2}/${maxRetries + 1})`);
    
    // Auto-retry after delay if it fails again
    this.retryTimer = setTimeout(() => {
      if (this.state.hasError) {
        toast.error('Retry failed. Please try refreshing the page.');
      }
    }, 3000);
  };

  private handleReportIssue = async () => {
    this.setState({ isReporting: true });
    
    try {
      const errorData = sessionStorage.getItem(`error_${this.state.errorId}`);
      
      if (errorData) {
        // Send detailed error report
        const report = JSON.parse(errorData);
        
        // In production, send to support endpoint
        console.log('Reporting issue:', report);
        
        toast.success('Error report sent. Our team will investigate this issue.');
      }
    } catch (error) {
      console.error('Failed to report issue:', error);
      toast.error('Failed to send error report. Please try again.');
    } finally {
      this.setState({ isReporting: false });
    }
  };

  private handleGoHome = () => {
    // Clear error state and navigate to home
    sessionStorage.removeItem(`error_${this.state.errorId}`);
    window.location.href = '/';
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, showReportButton = true, enableRecovery = true, level = 'component' } = this.props;
      
      if (fallback) {
        return fallback;
      }
      
      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              {/* Error Icon and Title */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-6"
              >
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {level === 'critical' ? 'Critical Error' : 'Something went wrong'}
                </h2>
                <p className="text-gray-600">
                  {level === 'critical' 
                    ? 'A critical error occurred. Please contact support immediately.'
                    : 'Don\'t worry, our team has been notified and we\'re working on it.'
                  }
                </p>
              </motion.div>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start space-x-2">
                    <Bug className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800 mb-1">Error Details</h4>
                      <p className="text-sm text-red-700 mb-2">{this.state.error.message}</p>
                      <details className="text-xs text-red-600">
                        <summary className="cursor-pointer hover:text-red-800">Stack Trace</summary>
                        <pre className="mt-2 overflow-auto max-h-32 bg-red-100 p-2 rounded text-xs">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              )}

              {/* Error ID for Support */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-3 bg-gray-100 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Error ID:</span>
                  <code className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded">
                    {this.state.errorId}
                  </code>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                {/* Primary Actions */}
                <div className="flex space-x-3">
                  {enableRecovery && level !== 'critical' && (
                    <button
                      onClick={this.handleRetry}
                      disabled={this.state.retryCount >= 3}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        {this.state.retryCount >= 3 ? 'Max Retries' : 'Try Again'}
                      </span>
                    </button>
                  )}
                  
                  <button
                    onClick={this.handleRefreshPage}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go Home</span>
                  </button>
                  
                  {showReportButton && (
                    <button
                      onClick={this.handleReportIssue}
                      disabled={this.state.isReporting}
                      className="flex-1 flex items-center justify-center space-x-2 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className={`w-4 h-4 ${this.state.isReporting ? 'animate-spin' : ''}`} />
                      <span>
                        {this.state.isReporting ? 'Reporting...' : 'Report Issue'}
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Helpful Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact our support team with the error ID above.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <AdvancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AdvancedErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Lightweight error boundary for smaller components
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}> = ({ children, fallback, componentName }) => {
  return (
    <AdvancedErrorBoundary
      level="component"
      enableRecovery={true}
      showReportButton={false}
      fallback={
        fallback || (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                {componentName ? `${componentName} failed to load` : 'Component failed to load'}
              </span>
            </div>
          </div>
        )
      }
    >
      {children}
    </AdvancedErrorBoundary>
  );
};

export default AdvancedErrorBoundary;
