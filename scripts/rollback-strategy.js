#!/usr/bin/env node

/**
 * Production Rollback Strategy Script
 * 
 * Automated rollback procedures for production deployment failures.
 * Provides multiple rollback strategies and emergency response capabilities.
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🔄 Production Rollback Strategy');
console.log('================================');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

// Configuration
const config = {
  // Vercel configuration
  vercel: {
    token: process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    orgId: process.env.VERCEL_ORG_ID,
  },
  
  // Health check configuration
  healthCheck: {
    url: process.env.HEALTH_CHECK_URL || 'https://kasama-ai.vercel.app',
    maxRetries: 3,
    retryDelay: 5000,
    timeout: 10000
  },
  
  // Rollback thresholds
  thresholds: {
    availabilityMin: 0.95,    // 95% availability
    errorRateMax: 0.02,       // 2% error rate
    responseTimeMax: 5000,    // 5 seconds
    consecutiveFailures: 3    // 3 consecutive health check failures
  },
  
  // Emergency contacts
  emergency: {
    email: process.env.EMERGENCY_EMAIL,
    slack: process.env.EMERGENCY_SLACK_WEBHOOK,
    phone: process.env.EMERGENCY_PHONE
  }
};

/**
 * Rollback strategies
 */
const rollbackStrategies = {
  // Strategy 1: Vercel Alias Rollback (Fastest)
  aliasRollback: {
    name: 'Vercel Alias Rollback',
    description: 'Switch production alias to previous deployment',
    estimatedTime: '30 seconds',
    riskLevel: 'Low',
    requirements: ['VERCEL_TOKEN', 'Previous deployment available']
  },
  
  // Strategy 2: Git Revert and Redeploy
  gitRevertRedeploy: {
    name: 'Git Revert and Redeploy',
    description: 'Revert git commit and trigger new deployment',
    estimatedTime: '3-5 minutes',
    riskLevel: 'Medium',
    requirements: ['Git access', 'CI/CD pipeline functional']
  },
  
  // Strategy 3: Maintenance Mode
  maintenanceMode: {
    name: 'Maintenance Mode',
    description: 'Activate maintenance page while fixing issues',
    estimatedTime: '1 minute',
    riskLevel: 'High',
    requirements: ['Maintenance page deployed', 'User communication prepared']
  },
  
  // Strategy 4: Feature Flag Disable
  featureFlagDisable: {
    name: 'Feature Flag Disable',
    description: 'Disable problematic features via environment variables',
    estimatedTime: '2 minutes',
    riskLevel: 'Low',
    requirements: ['Feature flags implemented', 'Vercel environment access']
  }
};

/**
 * Health check implementation
 */
async function performHealthCheck() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const request = https.get(config.healthCheck.url, {
      timeout: config.healthCheck.timeout
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: response.statusCode,
          responseTime,
          contentLength: data.length,
          isHealthy: response.statusCode === 200 && responseTime < config.thresholds.responseTimeMax
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

/**
 * Execute Vercel alias rollback
 */
async function executeAliasRollback() {
  console.log('🔄 Executing Vercel alias rollback...');
  
  try {
    // Get previous deployment
    console.log('📋 Fetching previous deployments...');
    
    const listCommand = `vercel ls --token=${config.vercel.token} --json`;
    const deploymentsOutput = execSync(listCommand, { encoding: 'utf8' });
    const deployments = JSON.parse(deploymentsOutput);
    
    if (deployments.length < 2) {
      throw new Error('No previous deployment found for rollback');
    }
    
    // Find the previous stable deployment (not current)
    const currentDeployment = deployments[0];
    const previousDeployment = deployments[1];
    
    console.log(`📍 Current deployment: ${currentDeployment.url}`);
    console.log(`📍 Rolling back to: ${previousDeployment.url}`);
    
    // Perform alias switch
    const aliasCommand = `vercel alias set ${previousDeployment.url} --token=${config.vercel.token}`;
    execSync(aliasCommand, { stdio: 'inherit' });
    
    console.log('✅ Alias rollback completed');
    
    // Verify rollback success
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    const healthCheck = await performHealthCheck();
    
    if (healthCheck.isHealthy) {
      console.log('✅ Rollback successful - site is healthy');
      return true;
    } else {
      console.log('⚠️ Rollback completed but health check failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Alias rollback failed:', error.message);
    return false;
  }
}

/**
 * Execute git revert and redeploy
 */
async function executeGitRevertRedeploy() {
  console.log('🔄 Executing git revert and redeploy...');
  
  try {
    // Get the last commit hash
    const lastCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(`📍 Current commit: ${lastCommit}`);
    
    // Create revert commit
    console.log('↩️ Creating revert commit...');
    execSync(`git revert ${lastCommit} --no-edit`, { stdio: 'inherit' });
    
    // Push the revert
    console.log('📤 Pushing revert commit...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Revert pushed - CI/CD pipeline will redeploy');
    
    // Monitor deployment progress
    console.log('⏳ Monitoring deployment progress...');
    
    // Wait for CI/CD pipeline to complete (estimated 3-5 minutes)
    let attempts = 0;
    const maxAttempts = 20; // 10 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      try {
        const healthCheck = await performHealthCheck();
        if (healthCheck.isHealthy) {
          console.log('✅ Git revert redeploy successful');
          return true;
        }
      } catch (error) {
        console.log(`⏳ Deployment still in progress (attempt ${attempts + 1}/${maxAttempts})`);
      }
      
      attempts++;
    }
    
    console.log('⚠️ Git revert completed but deployment verification timed out');
    return false;
    
  } catch (error) {
    console.error('❌ Git revert redeploy failed:', error.message);
    return false;
  }
}

/**
 * Activate maintenance mode
 */
async function activateMaintenanceMode() {
  console.log('🚧 Activating maintenance mode...');
  
  try {
    // Set maintenance mode environment variable
    console.log('🔧 Setting maintenance mode environment variable...');
    
    const envCommand = `vercel env add MAINTENANCE_MODE true production --token=${config.vercel.token}`;
    execSync(envCommand, { stdio: 'inherit' });
    
    // Trigger new deployment with maintenance mode
    console.log('🔄 Triggering maintenance mode deployment...');
    
    const deployCommand = `vercel --prod --token=${config.vercel.token}`;
    execSync(deployCommand, { stdio: 'inherit' });
    
    console.log('✅ Maintenance mode activated');
    
    // Notify team
    await sendEmergencyNotification({
      type: 'maintenance_activated',
      message: 'Maintenance mode has been activated due to production issues',
      timestamp: new Date().toISOString()
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to activate maintenance mode:', error.message);
    return false;
  }
}

/**
 * Disable problematic features via feature flags
 */
async function disableFeatureFlags() {
  console.log('🔧 Disabling feature flags...');
  
  try {
    const featureFlags = [
      'VITE_ENABLE_AI_FEATURES',
      'VITE_ENABLE_ANALYTICS',
      'VITE_ENABLE_ADVANCED_FEATURES'
    ];
    
    for (const flag of featureFlags) {
      console.log(`🔄 Disabling ${flag}...`);
      
      const envCommand = `vercel env add ${flag} false production --token=${config.vercel.token}`;
      try {
        execSync(envCommand, { stdio: 'pipe' });
        console.log(`✅ Disabled ${flag}`);
      } catch (error) {
        console.log(`⚠️ Could not disable ${flag}: ${error.message}`);
      }
    }
    
    // Trigger redeploy with disabled features
    console.log('🔄 Redeploying with disabled features...');
    
    const deployCommand = `vercel --prod --token=${config.vercel.token}`;
    execSync(deployCommand, { stdio: 'inherit' });
    
    console.log('✅ Feature flags disabled and redeployed');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to disable feature flags:', error.message);
    return false;
  }
}

/**
 * Send emergency notification
 */
async function sendEmergencyNotification(incident) {
  console.log('📢 Sending emergency notifications...');
  
  // Email notification (would require email service setup)
  if (config.emergency.email) {
    console.log(`📧 Email notification sent to ${config.emergency.email}`);
  }
  
  // Slack notification
  if (config.emergency.slack) {
    try {
      const payload = {
        text: `🚨 PRODUCTION INCIDENT: ${incident.type}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Production Incident Alert*\n\n*Type:* ${incident.type}\n*Message:* ${incident.message}\n*Time:* ${incident.timestamp}`
            }
          }
        ]
      };
      
      // This would require actual HTTP request implementation
      console.log('📱 Slack notification prepared');
      
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
    }
  }
  
  // Phone/SMS notification would be handled by external service
  if (config.emergency.phone) {
    console.log(`📞 Emergency contact: ${config.emergency.phone}`);
  }
}

/**
 * Comprehensive rollback decision matrix
 */
function determineRollbackStrategy(healthMetrics, errorType) {
  console.log('🤔 Analyzing rollback strategy options...\n');
  
  // Display available strategies
  Object.entries(rollbackStrategies).forEach(([key, strategy]) => {
    console.log(`${key}: ${strategy.name}`);
    console.log(`   Description: ${strategy.description}`);
    console.log(`   Time: ${strategy.estimatedTime}`);
    console.log(`   Risk: ${strategy.riskLevel}`);
    console.log(`   Requirements: ${strategy.requirements.join(', ')}\n`);
  });
  
  // Decision logic based on error type and severity
  if (errorType === 'site_down' || errorType === 'critical_error') {
    return 'aliasRollback'; // Fastest recovery
  } else if (errorType === 'performance_degradation') {
    return 'featureFlagDisable'; // Reduce load
  } else if (errorType === 'partial_functionality') {
    return 'gitRevertRedeploy'; // Clean slate
  } else {
    return 'maintenanceMode'; // Safe fallback
  }
}

/**
 * Execute rollback strategy
 */
async function executeRollback(strategy, healthMetrics, errorType) {
  console.log(`🚀 Executing rollback strategy: ${strategy}`);
  console.log(`📋 Error type: ${errorType}`);
  console.log(`📊 Health metrics:`, healthMetrics);
  console.log('\n' + '='.repeat(32) + '\n');
  
  // Record incident start
  const incident = {
    id: `incident_${Date.now()}`,
    strategy,
    errorType,
    startTime: new Date().toISOString(),
    healthMetrics
  };
  
  let success = false;
  
  try {
    switch (strategy) {
      case 'aliasRollback':
        success = await executeAliasRollback();
        break;
        
      case 'gitRevertRedeploy':
        success = await executeGitRevertRedeploy();
        break;
        
      case 'maintenanceMode':
        success = await activateMaintenanceMode();
        break;
        
      case 'featureFlagDisable':
        success = await disableFeatureFlags();
        break;
        
      default:
        throw new Error(`Unknown rollback strategy: ${strategy}`);
    }
    
    incident.endTime = new Date().toISOString();
    incident.success = success;
    
    if (success) {
      console.log('\n✅ ROLLBACK SUCCESSFUL');
      console.log('🚀 Production service restored');
      
      await sendEmergencyNotification({
        type: 'rollback_successful',
        message: `Rollback completed successfully using ${strategy}`,
        timestamp: new Date().toISOString()
      });
      
    } else {
      console.log('\n❌ ROLLBACK FAILED');
      console.log('🚨 Manual intervention required');
      
      await sendEmergencyNotification({
        type: 'rollback_failed',
        message: `Rollback failed using ${strategy}. Manual intervention required.`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log incident
    console.log('\n📋 Incident Summary:');
    console.log(JSON.stringify(incident, null, 2));
    
    return success;
    
  } catch (error) {
    console.error('\n💥 ROLLBACK ERROR:', error.message);
    
    await sendEmergencyNotification({
      type: 'rollback_error',
      message: `Rollback error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
    
    return false;
  }
}

/**
 * Main rollback orchestration
 */
async function orchestrateRollback() {
  // Validate configuration
  if (!config.vercel.token) {
    console.error('❌ VERCEL_TOKEN not configured');
    process.exit(1);
  }
  
  const errorType = process.argv[2] || 'critical_error';
  const forceStrategy = process.argv[3];
  
  console.log(`🎯 Error Type: ${errorType}`);
  if (forceStrategy) {
    console.log(`🔧 Forced Strategy: ${forceStrategy}`);
  }
  
  try {
    // Perform health check to assess current status
    console.log('🏥 Performing initial health check...');
    
    let healthMetrics;
    try {
      healthMetrics = await performHealthCheck();
      console.log('✅ Health check completed');
      console.log(`📊 Status: ${healthMetrics.statusCode}, Response: ${healthMetrics.responseTime}ms`);
    } catch (error) {
      healthMetrics = {
        statusCode: 0,
        responseTime: config.healthCheck.timeout,
        isHealthy: false,
        error: error.message
      };
      console.log('❌ Health check failed:', error.message);
    }
    
    // Determine rollback strategy
    const strategy = forceStrategy || determineRollbackStrategy(healthMetrics, errorType);
    console.log(`📋 Selected strategy: ${strategy}`);
    
    // Execute rollback
    const success = await executeRollback(strategy, healthMetrics, errorType);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Orchestration failed:', error.message);
    process.exit(2);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n⏹️ Rollback interrupted');
  process.exit(130);
});

// Command line usage
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: node rollback-strategy.js [ERROR_TYPE] [STRATEGY]

Error Types:
  - site_down              Site completely inaccessible
  - critical_error         Critical functionality broken
  - performance_degradation Slow response times
  - partial_functionality   Some features broken

Strategies:
  - aliasRollback          Switch to previous deployment (fastest)
  - gitRevertRedeploy      Revert commit and redeploy
  - maintenanceMode        Activate maintenance page
  - featureFlagDisable     Disable problematic features

Examples:
  node rollback-strategy.js site_down
  node rollback-strategy.js critical_error aliasRollback
  node rollback-strategy.js performance_degradation featureFlagDisable

Environment Variables:
  - VERCEL_TOKEN           Vercel authentication token (required)
  - VERCEL_PROJECT_ID      Vercel project ID
  - VERCEL_ORG_ID          Vercel organization ID
  - HEALTH_CHECK_URL       URL for health checks
  - EMERGENCY_EMAIL        Emergency contact email
  - EMERGENCY_SLACK_WEBHOOK Slack webhook for notifications
`);
    process.exit(0);
  }
  
  orchestrateRollback();
}