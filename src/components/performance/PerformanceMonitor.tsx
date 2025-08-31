/**
 * Performance Monitor Component
 * Real-time performance monitoring dashboard for development and production
 */

import React, { useState, useEffect } from 'react';
import { performanceBenchmark, BenchmarkResult } from '../../utils/performance-benchmark';
import { performanceMonitor } from '../../utils/performance';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showInProduction = false,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Hide in production unless explicitly shown
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        runBenchmark();
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const runBenchmark = async () => {
    setIsLoading(true);
    try {
      const result = await performanceBenchmark.runBenchmark();
      setBenchmark(result);
    } catch (error) {
      console.error('Performance benchmark failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'text-gray-500';
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4',
  };

  if (!shouldShow) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
      >
        <span className="text-sm">⚡</span>
        {benchmark && (
          <span className={`text-sm font-bold ${getGradeColor(benchmark.grade)}`}>
            {benchmark.grade}
          </span>
        )}
      </button>

      {/* Performance Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Performance Monitor
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2 py-1 text-xs rounded ${
                  autoRefresh 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {autoRefresh ? 'Auto' : 'Manual'}
              </button>
              <button
                onClick={runBenchmark}
                disabled={isLoading}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
              >
                {isLoading ? '...' : 'Refresh'}
              </button>
            </div>
          </div>

          {benchmark ? (
            <div className="space-y-4">
              {/* Overall Grade */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${getGradeColor(benchmark.grade)}`}>
                  {benchmark.grade}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(benchmark.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Web Vitals */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Vitals
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>LCP:</span>
                    <span className={getStatusColor(benchmark.metrics.webVitals.lcp, { good: 2500, poor: 4000 })}>
                      {benchmark.metrics.webVitals.lcp ? `${Math.round(benchmark.metrics.webVitals.lcp)}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>FID:</span>
                    <span className={getStatusColor(benchmark.metrics.webVitals.fid, { good: 100, poor: 300 })}>
                      {benchmark.metrics.webVitals.fid ? `${Math.round(benchmark.metrics.webVitals.fid)}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLS:</span>
                    <span className={getStatusColor(benchmark.metrics.webVitals.cls, { good: 0.1, poor: 0.25 })}>
                      {benchmark.metrics.webVitals.cls ? benchmark.metrics.webVitals.cls.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TTFB:</span>
                    <span className={getStatusColor(benchmark.metrics.webVitals.ttfb, { good: 800, poor: 1800 })}>
                      {benchmark.metrics.webVitals.ttfb ? `${Math.round(benchmark.metrics.webVitals.ttfb)}ms` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Performance */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Performance
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <span className={getStatusColor(benchmark.metrics.ai.averageResponseTime, { good: 1000, poor: 2000 })}>
                      {Math.round(benchmark.metrics.ai.averageResponseTime)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>P95 Response:</span>
                    <span className={getStatusColor(benchmark.metrics.ai.p95ResponseTime, { good: 1500, poor: 3000 })}>
                      {Math.round(benchmark.metrics.ai.p95ResponseTime)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit:</span>
                    <span className={benchmark.metrics.ai.cacheHitRate > 0.7 ? 'text-green-600' : 'text-red-600'}>
                      {Math.round(benchmark.metrics.ai.cacheHitRate * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span className={benchmark.metrics.ai.errorRate < 0.02 ? 'text-green-600' : 'text-red-600'}>
                      {(benchmark.metrics.ai.errorRate * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bundle Performance */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bundle Performance
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span className={benchmark.metrics.bundle.totalSize > 1024 * 1024 ? 'text-red-600' : 'text-green-600'}>
                      {(benchmark.metrics.bundle.totalSize / 1024 / 1024).toFixed(2)}MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chunks:</span>
                    <span>{benchmark.metrics.bundle.chunkCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compression:</span>
                    <span>{Math.round(benchmark.metrics.bundle.compressionRatio * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              {benchmark.metrics.memory && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Memory Usage
                  </h4>
                  <div className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span>Used:</span>
                      <span className={benchmark.metrics.memory.percentage > 80 ? 'text-red-600' : 'text-green-600'}>
                        {(benchmark.metrics.memory.used / 1024 / 1024).toFixed(1)}MB ({benchmark.metrics.memory.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          benchmark.metrics.memory.percentage > 80 ? 'bg-red-500' : 
                          benchmark.metrics.memory.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(benchmark.metrics.memory.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Recommendations */}
              {benchmark.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Top Issues ({benchmark.recommendations.length})
                  </h4>
                  <div className="text-xs space-y-1">
                    {benchmark.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="text-amber-600 dark:text-amber-400 truncate" title={rec}>
                        • {rec.split(':')[0]}...
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">⚡</div>
              <div className="text-sm">Click Refresh to run benchmark</div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={() => {
                if (benchmark) {
                  const report = performanceBenchmark.generateReport(benchmark);
                  console.log(report);
                  navigator.clipboard?.writeText(report);
                }
              }}
              className="flex-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              disabled={!benchmark}
            >
              Copy Report
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;