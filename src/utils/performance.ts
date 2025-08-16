// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      // Core Web Vitals observer
      const vitalsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: entry.entryType,
            value:
              entry.entryType === "layout-shift"
                ? (entry as any).value
                : entry.startTime,
            timestamp: Date.now(),
            url: window.location.href,
          });
        });
      });

      vitalsObserver.observe({
        entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"],
      });
      this.observers.push(vitalsObserver);

      // Navigation timing observer
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;

          // Record key navigation metrics
          this.recordMetric({
            name: "time-to-first-byte",
            value: navEntry.responseStart - navEntry.requestStart,
            timestamp: Date.now(),
            url: window.location.href,
          });

          this.recordMetric({
            name: "dom-content-loaded",
            value: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
            timestamp: Date.now(),
            url: window.location.href,
          });

          this.recordMetric({
            name: "load-complete",
            value: navEntry.loadEventEnd - navEntry.navigationStart,
            timestamp: Date.now(),
            url: window.location.href,
          });
        });
      });

      navigationObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navigationObserver);

      // Resource timing observer
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const resource = entry as PerformanceResourceTiming;

          // Only track significant resources
          if (resource.transferSize > 10000) {
            // > 10KB
            this.recordMetric({
              name: "resource-load-time",
              value: resource.responseEnd - resource.requestStart,
              timestamp: Date.now(),
              url: resource.name,
            });
          }
        });
      });

      resourceObserver.observe({ entryTypes: ["resource"] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn("Performance Observer initialization failed:", error);
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log important metrics
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Performance metric [${metric.name}]:`,
        metric.value.toFixed(2) + "ms",
      );
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Implement your analytics service integration here
    // Example: Google Analytics, Mixpanel, custom endpoint

    // For now, just queue for batch sending
    if (typeof window !== "undefined") {
      window.requestIdleCallback?.(() => {
        // Send metrics in batches during idle time
        console.log("Would send metric to analytics:", metric);
      });
    }
  }

  // Public API
  getMetrics(type?: string): PerformanceMetric[] {
    if (type) {
      return this.metrics.filter((m) => m.name === type);
    }
    return [...this.metrics];
  }

  getAverageMetric(type: string): number | null {
    const metrics = this.getMetrics(type);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  markCustomMetric(name: string, startTime?: number) {
    const endTime = performance.now();
    const value = startTime ? endTime - startTime : endTime;

    this.recordMetric({
      name: `custom-${name}`,
      value,
      timestamp: Date.now(),
      url: window.location.href,
    });

    return value;
  }

  startTimer(name: string): () => number {
    const startTime = performance.now();

    return () => {
      const duration = this.markCustomMetric(name, startTime);
      return duration;
    };
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export function measureRender<T>(component: string, fn: () => T): T {
  const timer = performanceMonitor.startTimer(`render-${component}`);
  const result = fn();
  timer();
  return result;
}

export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const timer = performanceMonitor.startTimer(name);
  try {
    const result = await fn();
    return result;
  } finally {
    timer();
  }
}

// React hook for measuring component performance
export function usePerformanceMeasure(componentName: string) {
  const [renderTime, setRenderTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    const timer = performanceMonitor.startTimer(`component-${componentName}`);
    return () => {
      const duration = timer();
      setRenderTime(duration);
    };
  }, [componentName]);

  return renderTime;
}

// Web Vitals helper
export interface WebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
}

export function getWebVitals(): WebVitals {
  return {
    lcp: performanceMonitor.getAverageMetric("largest-contentful-paint"),
    fid: performanceMonitor.getAverageMetric("first-input"),
    cls: performanceMonitor.getAverageMetric("layout-shift"),
    fcp: performanceMonitor.getAverageMetric("first-contentful-paint"),
    ttfb: performanceMonitor.getAverageMetric("time-to-first-byte"),
  };
}

// Memory usage monitoring
export function getMemoryUsage() {
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

// Bundle size analysis
export function analyzeBundleSize() {
  if (typeof window === "undefined") return null;

  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const stylesheets = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]'),
  );

  return {
    scriptCount: scripts.length,
    stylesheetCount: stylesheets.length,
    scripts: scripts.map((script) => (script as HTMLScriptElement).src),
    stylesheets: stylesheets.map((link) => (link as HTMLLinkElement).href),
  };
}

// Cleanup function
export function cleanupPerformanceMonitoring() {
  performanceMonitor.cleanup();
}

// React import for the hook
import React from "react";
