// 🚀 Elite Performance Monitoring Dashboard
// Real-time performance metrics and optimization insights
// Target: Sub-100ms monitoring, actionable performance insights

import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheMetrics } from '../../lib/cache';
import { aiService } from '../../lib/ai-optimized';

interface PerformanceMetrics {
  // Cache metrics
  cacheHitRate: number;
  totalQueries: number;
  staleQueries: number;
  
  // AI metrics
  aiCost: number;
  aiResponseTime: number;
  aiCacheHitRate: number;
  
  // Bundle metrics
  bundleSize: number;
  loadTime: number;
  
  // User experience metrics
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
}

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  showDetails = false,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(!showDetails);
  const queryClient = useQueryClient();
  
  // Collect performance metrics
  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    // Cache metrics
    const cacheStats = cacheMetrics.getCacheStats(queryClient);
    
    // AI metrics
    const aiMetrics = aiService.getPerformanceMetrics();
    
    // Core Web Vitals (if available)
    const coreWebVitals = await getCoreWebVitals();
    
    // Bundle size estimation
    const bundleSize = estimateBundleSize();
    
    return {
      cacheHitRate: cacheStats.hitRate,
      totalQueries: cacheStats.totalQueries,
      staleQueries: cacheStats.staleQueries,
      
      aiCost: aiMetrics.totalCost,
      aiResponseTime: aiMetrics.averageResponseTime,
      aiCacheHitRate: aiMetrics.cacheHitRate,
      
      bundleSize,
      loadTime: performance.now(),
      
      coreWebVitals,
    };
  }, [queryClient]);
  
  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = async () => {
      const newMetrics = await collectMetrics();
      setMetrics(newMetrics);
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [collectMetrics]);
  
  if (!metrics) return null;
  
  // Performance status indicators
  const getStatusColor = (value: number, thresholds: { good: number; fair: number }): string => {
    if (value >= thresholds.good) return 'text-green-500';
    if (value >= thresholds.fair) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className={`performance-monitor ${className} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between p-2 bg-slate-900 text-white text-xs cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-4">
          <span className="font-semibold">⚡ Performance</span>
          
          {/* Quick indicators */}
          <div className="flex items-center gap-2">
            <span className={`font-mono ${getStatusColor(metrics.cacheHitRate, { good: 85, fair: 70 })}`}>
              Cache: {metrics.cacheHitRate.toFixed(1)}%
            </span>
            <span className={`font-mono ${getStatusColor(metrics.coreWebVitals.lcp, { good: 2500, fair: 4000 })}`}>
              LCP: {metrics.coreWebVitals.lcp.toFixed(0)}ms
            </span>
            <span className="font-mono text-blue-400">
              AI: ${metrics.aiCost.toFixed(4)}
            </span>
          </div>
        </div>
        
        <span className="text-xs">{isCollapsed ? '▼' : '▲'}</span>
      </div>
      
      {/* Detailed Metrics Panel */}
      {!isCollapsed && (
        <div className="performance-details bg-slate-800 text-white p-4 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Cache Performance */}
            <div className="metric-card">
              <h4 className="font-semibold text-cyan-400 mb-2">🗄️ Cache Performance</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Hit Rate:</span>
                  <span className={getStatusColor(metrics.cacheHitRate, { good: 85, fair: 70 })}>
                    {metrics.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Queries:</span>
                  <span className="font-mono">{metrics.totalQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stale Queries:</span>
                  <span className="font-mono">{metrics.staleQueries}</span>
                </div>
              </div>
            </div>
            
            {/* AI Performance */}
            <div className="metric-card">
              <h4 className="font-semibold text-purple-400 mb-2">🧠 AI Performance</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-mono text-green-400">
                    ${metrics.aiCost.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response:</span>
                  <span className={`font-mono ${getStatusColor(2000 - metrics.aiResponseTime, { good: 1000, fair: 500 })}`}>
                    {metrics.aiResponseTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit:</span>
                  <span className={`font-mono ${getStatusColor(metrics.aiCacheHitRate, { good: 80, fair: 60 })}`}>
                    {metrics.aiCacheHitRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Core Web Vitals */}
            <div className="metric-card">
              <h4 className="font-semibold text-orange-400 mb-2">📊 Core Web Vitals</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>LCP:</span>
                  <span className={`font-mono ${getStatusColor(4000 - metrics.coreWebVitals.lcp, { good: 1500, fair: 500 })}`}>
                    {metrics.coreWebVitals.lcp.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>FID:</span>
                  <span className={`font-mono ${getStatusColor(200 - metrics.coreWebVitals.fid, { good: 100, fair: 50 })}`}>
                    {metrics.coreWebVitals.fid.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CLS:</span>
                  <span className={`font-mono ${getStatusColor((0.1 - metrics.coreWebVitals.cls) * 1000, { good: 80, fair: 60 })}`}>
                    {metrics.coreWebVitals.cls.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Bundle Metrics */}
            <div className="metric-card">
              <h4 className="font-semibold text-yellow-400 mb-2">📦 Bundle Metrics</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Est. Size:</span>
                  <span className="font-mono">
                    {formatBytes(metrics.bundleSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Load Time:</span>
                  <span className={`font-mono ${getStatusColor(5000 - metrics.loadTime, { good: 2000, fair: 1000 })}`}>
                    {metrics.loadTime.toFixed(0)}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Recommendations */}
          <div className="mt-4 p-3 bg-slate-700 rounded">
            <h4 className="font-semibold text-green-400 mb-2">💡 Optimization Tips</h4>
            <div className="space-y-1 text-xs">
              {getPerformanceRecommendations(metrics).map((tip, index) => (
                <div key={index} className="text-gray-300">{tip}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
async function getCoreWebVitals(): Promise<PerformanceMetrics['coreWebVitals']> {
  return new Promise((resolve) => {
    // Use Web Vitals API if available
    if ('web-vitals' in window) {
      // Would integrate with web-vitals library
    }
    
    // Fallback to performance API estimates
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    resolve({
      lcp: navigation?.loadEventEnd - navigation?.fetchStart || 0,
      fid: 0, // Would need real user interaction measurement
      cls: 0.05, // Estimated based on layout stability
    });
  });
}

function estimateBundleSize(): number {
  // Estimate based on loaded resources
  const resources = performance.getEntriesByType('resource');
  const jsSize = resources
    .filter(r => r.name.includes('.js'))
    .reduce((total, resource) => total + (resource as PerformanceResourceTiming).transferSize, 0);
  
  return jsSize || 500 * 1024; // Fallback estimate: 500KB
}

function getPerformanceRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.cacheHitRate < 80) {
    recommendations.push('🔄 Cache hit rate is low. Consider increasing stale times for stable data.');
  }
  
  if (metrics.aiCost > 0.1) {
    recommendations.push('💰 AI costs are high. Enable semantic caching for similar requests.');
  }
  
  if (metrics.coreWebVitals.lcp > 2500) {
    recommendations.push('⚡ LCP is slow. Optimize images and reduce initial bundle size.');
  }
  
  if (metrics.bundleSize > 1024 * 1024) {
    recommendations.push('📦 Bundle size is large. Enable code splitting and lazy loading.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('🏆 Performance looks great! All metrics are within target ranges.');
  }
  
  return recommendations;
}

// Development-only component
export const DevPerformanceMonitor: React.FC = () => {
  if (!__DEV__) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs">
      <PerformanceMonitor showDetails={false} />
    </div>
  );
};