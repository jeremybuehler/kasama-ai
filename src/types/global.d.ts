// Global type declarations for browser APIs and custom properties

declare global {
  interface Window {
    __COMPONENT_ERROR__?: (error: Error, errorInfo: any) => void;
    deferredPrompt?: any;
  }

  interface PerformanceEntry {
    processingStart?: number;
    hadRecentInput?: boolean;
    value?: number;
  }

  interface PerformanceNavigationTiming {
    navigationStart?: number;
  }

  interface Event {
    detail?: {
      isOnline: boolean;
    };
  }
}

export {};
