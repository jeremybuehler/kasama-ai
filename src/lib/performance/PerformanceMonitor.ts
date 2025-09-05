/**
 * Advanced Performance Monitor
 * Intelligent performance tracking, optimization, and real-time monitoring
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  FCP?: number // First Contentful Paint
  TTFB?: number // Time to First Byte
  
  // Custom Metrics
  componentRenderTime: number
  apiResponseTime: number
  memoryUsage: number
  bundleSize?: number
  
  // AI-specific metrics
  aiProcessingTime?: number
  aiTokensUsed?: number
  aiCacheHitRate?: number
  
  // User Experience
  userInteractionLatency: number
  errorRate: number
  
  timestamp: number
  url: string
  userAgent: string
  userId?: string
}

export interface PerformanceThreshold {
  metric: keyof PerformanceMetrics
  warning: number
  critical: number
  unit: string
}

export interface OptimizationSuggestion {
  id: string
  type: 'loading' | 'rendering' | 'memory' | 'network' | 'ai'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium' | 'hard'
  implementation: string[]
  estimatedImprovement: string
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private observer?: PerformanceObserver
  private isMonitoring = false
  
  private thresholds: PerformanceThreshold[] = [
    { metric: 'LCP', warning: 2500, critical: 4000, unit: 'ms' },
    { metric: 'FID', warning: 100, critical: 300, unit: 'ms' },
    { metric: 'CLS', warning: 0.1, critical: 0.25, unit: '' },
    { metric: 'FCP', warning: 1800, critical: 3000, unit: 'ms' },
    { metric: 'TTFB', warning: 600, critical: 1000, unit: 'ms' },
    { metric: 'componentRenderTime', warning: 16, critical: 50, unit: 'ms' },
    { metric: 'apiResponseTime', warning: 1000, critical: 3000, unit: 'ms' },
    { metric: 'memoryUsage', warning: 50, critical: 100, unit: 'MB' },
    { metric: 'userInteractionLatency', warning: 100, critical: 300, unit: 'ms' },
    { metric: 'errorRate', warning: 1, critical: 5, unit: '%' }
  ]

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    this.setupWebVitalsObserver()
    this.setupResourceObserver()
    this.setupNavigationObserver()
    this.setupMemoryMonitoring()
    this.startPeriodicCollection()
    
    this.isMonitoring = true
  }

  /**
   * Setup Web Vitals observer (LCP, FID, CLS)
   */
  private setupWebVitalsObserver(): void {
    if (!window.PerformanceObserver) return

    try {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lcpEntry = entries[entries.length - 1] as any
        if (lcpEntry) {
          this.recordMetric('LCP', lcpEntry.startTime)
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime
            this.recordMetric('FID', fid)
          }
        })
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.recordMetric('CLS', clsValue)
      }).observe({ entryTypes: ['layout-shift'] })

    } catch (error) {
      console.warn('Web Vitals observation setup failed:', error)
    }
  }

  /**
   * Setup resource timing observer
   */
  private setupResourceObserver(): void {
    if (!window.PerformanceObserver) return

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name.includes('api') || entry.name.includes('/rest/')) {
            const responseTime = entry.responseEnd - entry.requestStart
            this.recordMetric('apiResponseTime', responseTime)
          }
        })
      }).observe({ entryTypes: ['resource'] })
    } catch (error) {
      console.warn('Resource observer setup failed:', error)
    }
  }

  /**
   * Setup navigation timing observer
   */
  private setupNavigationObserver(): void {
    if (!window.PerformanceObserver) return

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          // Time to First Byte
          if (entry.responseStart && entry.requestStart) {
            const ttfb = entry.responseStart - entry.requestStart
            this.recordMetric('TTFB', ttfb)
          }

          // First Contentful Paint (from navigation timing)
          if (entry.name === location.href) {
            const fcp = entry.responseEnd - entry.requestStart
            this.recordMetric('FCP', fcp)
          }
        })
      }).observe({ entryTypes: ['navigation'] })
    } catch (error) {
      console.warn('Navigation observer setup failed:', error)
    }
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if (!(performance as any).memory) return

    setInterval(() => {
      const memory = (performance as any).memory
      if (memory) {
        const memoryUsage = memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
        this.recordMetric('memoryUsage', memoryUsage)
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Start periodic performance collection
   */
  private startPeriodicCollection(): void {
    setInterval(() => {
      this.collectCurrentMetrics()
    }, 30000) // Collect every 30 seconds
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: keyof PerformanceMetrics, value: number): void {
    const currentMetric = this.getCurrentMetric()
    currentMetric[metric] = value
    currentMetric.timestamp = Date.now()
    
    this.checkThresholds(metric, value)
  }

  /**
   * Get or create current metrics object
   */
  private getCurrentMetric(): PerformanceMetrics {
    const now = Date.now()
    const recentMetric = this.metrics[this.metrics.length - 1]
    
    if (recentMetric && (now - recentMetric.timestamp) < 10000) {
      return recentMetric
    }

    const newMetric: PerformanceMetrics = {
      componentRenderTime: 0,
      apiResponseTime: 0,
      memoryUsage: 0,
      userInteractionLatency: 0,
      errorRate: 0,
      timestamp: now,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId()
    }

    this.metrics.push(newMetric)
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    return newMetric
  }

  /**
   * Get current user ID (from localStorage or auth context)
   */
  private getCurrentUserId(): string | undefined {
    try {
      return localStorage.getItem('user_id') || undefined
    } catch {
      return undefined
    }
  }

  /**
   * Check if metrics exceed thresholds
   */
  private checkThresholds(metric: keyof PerformanceMetrics, value: number): void {
    const threshold = this.thresholds.find(t => t.metric === metric)
    if (!threshold) return

    if (value >= threshold.critical) {
      console.warn(`🚨 Critical performance issue: ${metric} = ${value}${threshold.unit} (threshold: ${threshold.critical}${threshold.unit})`)
      this.reportPerformanceIssue(metric, value, 'critical')
    } else if (value >= threshold.warning) {
      console.warn(`⚠️ Performance warning: ${metric} = ${value}${threshold.unit} (threshold: ${threshold.warning}${threshold.unit})`)
      this.reportPerformanceIssue(metric, value, 'warning')
    }
  }

  /**
   * Report performance issue
   */
  private reportPerformanceIssue(
    metric: keyof PerformanceMetrics, 
    value: number, 
    severity: 'warning' | 'critical'
  ): void {
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService({
        metric,
        value,
        severity,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getCurrentUserId()
      })
    }
  }

  /**
   * Send data to monitoring service
   */
  private async sendToMonitoringService(data: any): Promise<void> {
    try {
      // This would integrate with services like DataDog, New Relic, etc.
      const response = await fetch('/api/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.warn('Failed to send performance metrics:', error)
    }
  }

  /**
   * Collect current performance metrics
   */
  private collectCurrentMetrics(): void {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as any
    const paint = performance.getEntriesByType('paint')

    const metrics = this.getCurrentMetric()

    // Navigation timing
    if (navigation) {
      metrics.TTFB = navigation.responseStart - navigation.requestStart
      
      if (navigation.loadEventEnd) {
        metrics.componentRenderTime = navigation.loadEventEnd - navigation.responseEnd
      }
    }

    // Paint timing
    paint.forEach((entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        metrics.FCP = entry.startTime
      }
    })

    // Memory usage
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024)
    }

    // Bundle size (approximate from resource timing)
    const resources = performance.getEntriesByType('resource')
    const jsResources = resources.filter((r: any) => 
      r.name.endsWith('.js') && !r.name.includes('node_modules')
    )
    
    if (jsResources.length > 0) {
      metrics.bundleSize = jsResources.reduce((sum: number, resource: any) => 
        sum + (resource.transferSize || 0), 0
      ) / 1024 // Convert to KB
    }
  }

  /**
   * Public API methods
   */

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric('componentRenderTime', renderTime)
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Component ${componentName} rendered in ${renderTime}ms`)
    }
  }

  /**
   * Track API response time
   */
  trackAPIResponse(endpoint: string, responseTime: number): void {
    this.recordMetric('apiResponseTime', responseTime)
  }

  /**
   * Track AI processing time
   */
  trackAIProcessing(operation: string, processingTime: number, tokensUsed?: number): void {
    const metrics = this.getCurrentMetric()
    metrics.aiProcessingTime = processingTime
    
    if (tokensUsed) {
      metrics.aiTokensUsed = tokensUsed
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`AI ${operation} processed in ${processingTime}ms${tokensUsed ? ` using ${tokensUsed} tokens` : ''}`)
    }
  }

  /**
   * Track user interaction latency
   */
  trackUserInteraction(interactionType: string, latency: number): void {
    this.recordMetric('userInteractionLatency', latency)
  }

  /**
   * Track error rate
   */
  trackError(errorType: string): void {
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000))
    const hourlyErrors = this.metrics.filter(m => 
      Math.floor(m.timestamp / (60 * 60 * 1000)) === currentHour
    ).length

    const totalRequestsThisHour = Math.max(hourlyErrors, 1)
    const errorRate = (hourlyErrors / totalRequestsThisHour) * 100
    
    this.recordMetric('errorRate', errorRate)
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averages: Partial<PerformanceMetrics>
    latest: PerformanceMetrics | null
    issues: { metric: string; value: number; threshold: number; severity: string }[]
  } {
    if (this.metrics.length === 0) {
      return { averages: {}, latest: null, issues: [] }
    }

    const latest = this.metrics[this.metrics.length - 1]
    const averages: Partial<PerformanceMetrics> = {}
    const issues: { metric: string; value: number; threshold: number; severity: string }[] = []

    // Calculate averages
    const numericMetrics: (keyof PerformanceMetrics)[] = [
      'LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'componentRenderTime', 
      'apiResponseTime', 'memoryUsage', 'userInteractionLatency', 'errorRate'
    ]

    numericMetrics.forEach(metric => {
      const values = this.metrics
        .map(m => m[metric] as number)
        .filter(v => v !== undefined && v !== 0)
      
      if (values.length > 0) {
        averages[metric] = values.reduce((sum, val) => sum + val, 0) / values.length
        
        // Check for issues
        const threshold = this.thresholds.find(t => t.metric === metric)
        const avgValue = averages[metric]!
        
        if (threshold && avgValue >= threshold.critical) {
          issues.push({
            metric: metric as string,
            value: avgValue,
            threshold: threshold.critical,
            severity: 'critical'
          })
        } else if (threshold && avgValue >= threshold.warning) {
          issues.push({
            metric: metric as string,
            value: avgValue,
            threshold: threshold.warning,
            severity: 'warning'
          })
        }
      }
    })

    return { averages, latest, issues }
  }

  /**
   * Get optimization suggestions based on performance data
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const summary = this.getPerformanceSummary()
    const suggestions: OptimizationSuggestion[] = []

    // Check for loading performance issues
    if (summary.averages.LCP && summary.averages.LCP > 2500) {
      suggestions.push({
        id: 'optimize-lcp',
        type: 'loading',
        title: 'Optimize Largest Contentful Paint',
        description: 'Your page takes too long to display the main content',
        impact: 'high',
        difficulty: 'medium',
        implementation: [
          'Optimize images with WebP format and proper sizing',
          'Preload critical resources',
          'Use a CDN for static assets',
          'Minimize render-blocking resources'
        ],
        estimatedImprovement: '30-50% faster loading'
      })
    }

    // Check for rendering performance
    if (summary.averages.componentRenderTime && summary.averages.componentRenderTime > 16) {
      suggestions.push({
        id: 'optimize-rendering',
        type: 'rendering',
        title: 'Optimize Component Rendering',
        description: 'Components are taking too long to render',
        impact: 'medium',
        difficulty: 'medium',
        implementation: [
          'Use React.memo for expensive components',
          'Implement virtualization for long lists',
          'Optimize re-renders with useCallback and useMemo',
          'Consider code-splitting large components'
        ],
        estimatedImprovement: '40-60% faster rendering'
      })
    }

    // Check for memory usage
    if (summary.averages.memoryUsage && summary.averages.memoryUsage > 50) {
      suggestions.push({
        id: 'optimize-memory',
        type: 'memory',
        title: 'Reduce Memory Usage',
        description: 'High memory usage may cause performance issues',
        impact: 'medium',
        difficulty: 'hard',
        implementation: [
          'Implement proper cleanup in useEffect hooks',
          'Use object pooling for frequently created objects',
          'Optimize large data structures',
          'Remove unused imports and dependencies'
        ],
        estimatedImprovement: '30-40% less memory usage'
      })
    }

    // Check for API performance
    if (summary.averages.apiResponseTime && summary.averages.apiResponseTime > 1000) {
      suggestions.push({
        id: 'optimize-api',
        type: 'network',
        title: 'Optimize API Performance',
        description: 'API requests are slower than optimal',
        impact: 'high',
        difficulty: 'easy',
        implementation: [
          'Implement request caching',
          'Use GraphQL to reduce over-fetching',
          'Add request debouncing',
          'Optimize database queries'
        ],
        estimatedImprovement: '50-70% faster API responses'
      })
    }

    // Check for AI processing time
    if (summary.averages.aiProcessingTime && summary.averages.aiProcessingTime > 3000) {
      suggestions.push({
        id: 'optimize-ai',
        type: 'ai',
        title: 'Optimize AI Processing',
        description: 'AI operations are taking too long',
        impact: 'high',
        difficulty: 'medium',
        implementation: [
          'Implement AI response caching',
          'Use faster AI models for simple tasks',
          'Batch AI requests when possible',
          'Optimize prompt lengths'
        ],
        estimatedImprovement: '40-60% faster AI responses'
      })
    }

    return suggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    })
  }

  /**
   * Start monitoring (if not already started)
   */
  startMonitoring(): void {
    if (!this.isMonitoring && typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }
}

// HOC for tracking component render performance
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const monitor = PerformanceMonitor.getInstance()
  
  return function PerformanceTrackedComponent(props: P) {
    const React = require('react')
    const { useEffect, useRef } = React
    
    const renderStartRef = useRef<number>()
    
    // Track render start
    renderStartRef.current = performance.now()
    
    useEffect(() => {
      // Track render complete
      if (renderStartRef.current) {
        const renderTime = performance.now() - renderStartRef.current
        monitor.trackComponentRender(componentName, renderTime)
      }
    })
    
    return React.createElement(WrappedComponent, props)
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
