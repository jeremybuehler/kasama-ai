#!/usr/bin/env node

/**
 * Production Monitoring Setup Script
 * 
 * Configures comprehensive monitoring, alerting, and observability
 * for the Kasama AI production environment.
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Production Monitoring Setup');
console.log('===============================');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

/**
 * Generate monitoring configuration
 */
function generateMonitoringConfig() {
  return {
    application: {
      name: 'Kasama AI',
      environment: 'production',
      version: process.env.npm_package_version || '1.0.0',
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
    },
    
    metrics: {
      // Performance metrics
      performance: {
        responseTime: {
          threshold: 3000, // 3 seconds
          criticalThreshold: 5000, // 5 seconds
          sampleRate: 1.0 // 100% sampling
        },
        coreWebVitals: {
          lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint
          fid: { good: 100, poor: 300 },   // First Input Delay
          cls: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
          ttfb: { good: 800, poor: 1800 }  // Time to First Byte
        },
        memoryUsage: {
          warningThreshold: 80, // 80% of available memory
          criticalThreshold: 95  // 95% of available memory
        }
      },
      
      // AI system metrics
      ai: {
        responseTime: {
          threshold: 2000, // 2 seconds
          criticalThreshold: 5000 // 5 seconds
        },
        errorRate: {
          threshold: 0.02, // 2% error rate
          criticalThreshold: 0.05 // 5% error rate
        },
        cacheHitRate: {
          target: 0.7, // 70% cache hit rate
          minimum: 0.5  // 50% minimum
        }
      },
      
      // Business metrics
      business: {
        userRegistration: {
          trackingEnabled: true,
          alertOnAnomaly: true
        },
        assessmentCompletion: {
          trackingEnabled: true,
          minimumRate: 0.75 // 75% completion rate
        },
        userEngagement: {
          trackingEnabled: true,
          minimumRate: 0.6 // 60% engagement rate
        }
      },
      
      // System health metrics
      system: {
        availability: {
          target: 0.999, // 99.9% uptime
          minimum: 0.995 // 99.5% minimum
        },
        errorRate: {
          threshold: 0.001, // 0.1% error rate
          criticalThreshold: 0.01 // 1% error rate
        }
      }
    },
    
    alerting: {
      channels: {
        email: process.env.ALERT_EMAIL || 'alerts@kasama.ai',
        slack: process.env.SLACK_WEBHOOK_URL || null,
        webhook: process.env.ALERT_WEBHOOK_URL || null
      },
      
      rules: [
        {
          name: 'Site Down',
          condition: 'availability < 0.95',
          severity: 'critical',
          cooldown: 300 // 5 minutes
        },
        {
          name: 'High Error Rate',
          condition: 'errorRate > 0.01',
          severity: 'critical',
          cooldown: 600 // 10 minutes
        },
        {
          name: 'Slow Response Time',
          condition: 'responseTime > 5000',
          severity: 'warning',
          cooldown: 900 // 15 minutes
        },
        {
          name: 'AI System Degraded',
          condition: 'ai.responseTime > 5000 OR ai.errorRate > 0.05',
          severity: 'critical',
          cooldown: 300
        },
        {
          name: 'Low Cache Performance',
          condition: 'ai.cacheHitRate < 0.5',
          severity: 'warning',
          cooldown: 1800 // 30 minutes
        },
        {
          name: 'Memory Usage High',
          condition: 'memoryUsage > 95',
          severity: 'critical',
          cooldown: 300
        }
      ]
    },
    
    dashboards: {
      overview: {
        name: 'Kasama AI Production Overview',
        panels: [
          'availability',
          'responseTime',
          'errorRate',
          'activeUsers',
          'coreWebVitals'
        ]
      },
      
      performance: {
        name: 'Performance Dashboard',
        panels: [
          'responseTimeTrend',
          'coreWebVitalsDetail',
          'bundlePerformance',
          'memoryUsage',
          'networkLatency'
        ]
      },
      
      ai: {
        name: 'AI System Dashboard',
        panels: [
          'aiResponseTime',
          'aiErrorRate',
          'cacheHitRate',
          'agentPerformance',
          'costTracking'
        ]
      },
      
      business: {
        name: 'Business Metrics Dashboard',
        panels: [
          'userRegistrations',
          'assessmentCompletions',
          'userEngagement',
          'retentionRate',
          'conversionFunnel'
        ]
      }
    },
    
    retention: {
      metrics: '30d',      // Keep metrics for 30 days
      logs: '7d',         // Keep logs for 7 days
      traces: '3d',       // Keep traces for 3 days
      alerts: '90d'       // Keep alert history for 90 days
    }
  };
}

/**
 * Generate Vercel Analytics configuration
 */
function generateVercelAnalyticsConfig() {
  return {
    enabled: true,
    
    // Web Vitals tracking
    webVitals: {
      enabled: true,
      sampleRate: 1.0, // Track 100% of page views
      reportThreshold: {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 600
      }
    },
    
    // Custom events
    customEvents: [
      'user_registration',
      'assessment_started',
      'assessment_completed',
      'ai_interaction',
      'learning_path_started',
      'insight_generated'
    ],
    
    // Error tracking
    errorTracking: {
      enabled: true,
      sampleRate: 1.0,
      ignoreErrors: [
        'Network request failed',
        'Loading chunk',
        'Script error'
      ]
    }
  };
}

/**
 * Generate real-time monitoring component
 */
function generateRealtimeMonitor() {
  return `/**
 * Real-time Production Monitor
 * Enhanced monitoring component for production environment
 */

import React, { useEffect, useState } from 'react';

interface ProductionMetrics {
  timestamp: number;
  availability: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  memoryUsage: number;
  aiMetrics: {
    responseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

interface ProductionMonitorProps {
  apiEndpoint?: string;
  updateInterval?: number;
}

export const ProductionMonitor: React.FC<ProductionMonitorProps> = ({
  apiEndpoint = '/api/metrics',
  updateInterval = 30000 // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only show in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.VITE_ENABLE_PROD_MONITOR) {
      return;
    }

    let interval: NodeJS.Timeout;
    
    const fetchMetrics = async () => {
      try {
        const response = await fetch(apiEndpoint);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          setIsConnected(true);
          
          // Check for alert conditions
          checkAlerts(data);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Failed to fetch production metrics:', error);
        setIsConnected(false);
      }
    };

    const checkAlerts = (data: ProductionMetrics) => {
      const newAlerts: string[] = [];
      
      if (data.availability < 0.95) {
        newAlerts.push('🚨 Site availability below 95%');
      }
      
      if (data.errorRate > 0.01) {
        newAlerts.push('⚠️ High error rate detected');
      }
      
      if (data.responseTime > 5000) {
        newAlerts.push('🐌 Slow response times detected');
      }
      
      if (data.memoryUsage > 90) {
        newAlerts.push('💾 High memory usage');
      }
      
      if (data.aiMetrics.errorRate > 0.05) {
        newAlerts.push('🤖 AI system degraded');
      }
      
      setAlerts(newAlerts);
    };

    // Initial fetch
    fetchMetrics();
    
    // Set up periodic updates
    interval = setInterval(fetchMetrics, updateInterval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [apiEndpoint, updateInterval]);

  // Don't render in non-production environments
  if (process.env.NODE_ENV !== 'production' && !process.env.VITE_ENABLE_PROD_MONITOR) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Status Indicator */}
      <div className={\`flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg \${
        !isConnected ? 'border-red-300' : 
        alerts.length > 0 ? 'border-yellow-300' : 'border-green-300'
      }\`}>
        <div className={\`w-2 h-2 rounded-full \${
          !isConnected ? 'bg-red-500' : 
          alerts.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
        }\`} />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {!isConnected ? 'Disconnected' : 
           alerts.length > 0 ? \`\${alerts.length} Alert\${alerts.length > 1 ? 's' : ''}\` : 'Healthy'}
        </span>
        
        {metrics && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{Math.round(metrics.availability * 100)}%</span>
            <span>{metrics.responseTime}ms</span>
            <span>{metrics.activeUsers} users</span>
          </div>
        )}
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="absolute bottom-12 right-0 w-80 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg shadow-xl p-4 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Active Alerts
            </h3>
            <button
              onClick={() => setAlerts([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
          
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionMonitor;`;
}

/**
 * Create monitoring files
 */
function createMonitoringFiles() {
  const monitoringDir = 'monitoring';
  const configDir = path.join(monitoringDir, 'config');
  
  // Create directories
  if (!fs.existsSync(monitoringDir)) {
    fs.mkdirSync(monitoringDir);
    console.log(`✅ Created ${monitoringDir}/ directory`);
  }
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
    console.log(`✅ Created ${configDir}/ directory`);
  }
  
  // Write monitoring configuration
  const monitoringConfig = generateMonitoringConfig();
  fs.writeFileSync(
    path.join(configDir, 'monitoring.json'),
    JSON.stringify(monitoringConfig, null, 2)
  );
  console.log('✅ Created monitoring/config/monitoring.json');
  
  // Write Vercel analytics configuration
  const analyticsConfig = generateVercelAnalyticsConfig();
  fs.writeFileSync(
    path.join(configDir, 'vercel-analytics.json'),
    JSON.stringify(analyticsConfig, null, 2)
  );
  console.log('✅ Created monitoring/config/vercel-analytics.json');
  
  // Write production monitor component
  const monitorComponent = generateRealtimeMonitor();
  fs.writeFileSync(
    path.join('src/components', 'ProductionMonitor.tsx'),
    monitorComponent
  );
  console.log('✅ Created src/components/ProductionMonitor.tsx');
  
  // Create monitoring README
  const readme = \`# Production Monitoring

This directory contains configuration and components for production monitoring of Kasama AI.

## Files

- \`config/monitoring.json\` - Main monitoring configuration with metrics, alerting rules, and dashboard definitions
- \`config/vercel-analytics.json\` - Vercel Analytics configuration for Web Vitals and custom events
- \`../src/components/ProductionMonitor.tsx\` - Real-time monitoring component for production environment

## Setup

1. Configure environment variables for alerting:
   - \`ALERT_EMAIL\` - Email address for critical alerts
   - \`SLACK_WEBHOOK_URL\` - Slack webhook for team notifications
   - \`ALERT_WEBHOOK_URL\` - Custom webhook for alert routing

2. Enable production monitoring component by adding to your main App component:
   \\\`\\\`\\\`tsx
   import { ProductionMonitor } from './components/ProductionMonitor';
   
   function App() {
     return (
       <div>
         {/* Your app content */}
         <ProductionMonitor />
       </div>
     );
   }
   \\\`\\\`\\\`

3. Set up Vercel Analytics in your project dashboard to enable automatic Web Vitals tracking.

## Monitoring Dashboards

Access your monitoring dashboards at:
- Vercel Analytics: https://vercel.com/[your-team]/kasama-ai/analytics
- Custom metrics: Configure external monitoring service (DataDog, New Relic, etc.)

## Alerting

Critical alerts are configured for:
- Site availability < 95%
- Error rate > 1%
- Response time > 5 seconds
- AI system degradation
- Memory usage > 95%

## Metrics Retention

- Metrics: 30 days
- Logs: 7 days  
- Traces: 3 days
- Alert history: 90 days
\`;
  
  fs.writeFileSync(path.join(monitoringDir, 'README.md'), readme);
  console.log('✅ Created monitoring/README.md');
}

/**
 * Update package.json with monitoring scripts
 */
function updatePackageScripts() {
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('⚠️ package.json not found, skipping script updates');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add monitoring scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'monitor:health': 'node scripts/production-health-check.js',
      'monitor:validate': 'node scripts/deployment-validator.js',
      'monitor:setup': 'node scripts/monitoring-setup.js'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with monitoring scripts');
    
  } catch (error) {
    console.log('⚠️ Failed to update package.json:', error.message);
  }
}

/**
 * Main setup execution
 */
function setupMonitoring() {
  console.log('🚀 Setting up production monitoring...\n');
  
  try {
    createMonitoringFiles();
    updatePackageScripts();
    
    console.log('\n' + '='.repeat(32));
    console.log('✅ Monitoring Setup Complete');
    console.log('='.repeat(32));
    
    console.log('\n📋 Next Steps:');
    console.log('1. Configure alert email/webhook environment variables');
    console.log('2. Add ProductionMonitor component to your main App component');
    console.log('3. Enable Vercel Analytics in your project dashboard');
    console.log('4. Test monitoring setup: npm run monitor:validate');
    console.log('5. Run health check: npm run monitor:health');
    
    console.log('\n🔧 Available Commands:');
    console.log('- npm run monitor:setup    - Run this setup script');
    console.log('- npm run monitor:validate - Validate deployment configuration'); 
    console.log('- npm run monitor:health   - Check application health');
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupMonitoring();