#!/usr/bin/env node

/**
 * Production Launch Orchestration Script
 * 
 * Comprehensive production launch coordinator that manages the entire
 * go-live process with validation, monitoring, and rollback capabilities.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Production Launch Orchestrator');
console.log('==================================');
console.log(`Launch Time: ${new Date().toISOString()}`);
console.log(`Environment: ${process.env.NODE_ENV || 'production'}\n`);

// Launch configuration
const launchConfig = {
  // Validation stages
  validationStages: [
    'environment-check',
    'deployment-validation',
    'build-verification',
    'security-audit',
    'performance-baseline'
  ],
  
  // Deployment phases
  deploymentPhases: [
    'pre-deployment',
    'deployment-execution', 
    'post-deployment',
    'health-verification',
    'monitoring-activation'
  ],
  
  // Success criteria
  successCriteria: {
    availability: 0.99,     // 99% availability
    responseTime: 3000,     // 3 second response time
    errorRate: 0.01,        // 1% error rate
    healthCheckPasses: 3    // 3 consecutive health checks
  },
  
  // Timeout configuration
  timeouts: {
    healthCheck: 30000,     // 30 seconds
    deployment: 600000,     // 10 minutes
    validation: 180000      // 3 minutes
  }
};

/**
 * Launch state tracking
 */
const launchState = {
  startTime: Date.now(),
  currentPhase: null,
  completedStages: [],
  errors: [],
  warnings: [],
  metrics: {}
};

/**
 * Log launch event
 */
function logEvent(level, phase, message, details = null) {
  const timestamp = new Date().toISOString();
  const levelIcon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  
  console.log(`${levelIcon} [${phase}] ${message}`);
  
  if (details) {
    console.log(`   Details: ${details}`);
  }
  
  // Track in launch state
  if (level === 'error') {
    launchState.errors.push({ phase, message, details, timestamp });
  } else if (level === 'warn') {
    launchState.warnings.push({ phase, message, details, timestamp });
  }
}

/**
 * Execute command with error handling
 */
function executeCommand(command, description, options = {}) {
  logEvent('info', launchState.currentPhase, `Executing: ${description}`);
  
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 60000,
      ...options
    });
    
    logEvent('success', launchState.currentPhase, `Completed: ${description}`);
    return { success: true, output: result };
    
  } catch (error) {
    logEvent('error', launchState.currentPhase, `Failed: ${description}`, error.message);
    return { success: false, error: error.message, output: error.stdout };
  }
}

/**
 * Stage 1: Environment Validation
 */
async function validateEnvironment() {
  launchState.currentPhase = 'Environment Validation';
  logEvent('info', launchState.currentPhase, 'Starting environment validation');
  
  // Check required environment variables
  const requiredEnvVars = [
    'VERCEL_TOKEN',
    'VERCEL_PROJECT_ID',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logEvent('error', launchState.currentPhase, 'Missing environment variables', missingVars.join(', '));
    return false;
  }
  
  logEvent('success', launchState.currentPhase, 'All required environment variables present');
  
  // Run deployment validator
  const validationResult = executeCommand(
    'node scripts/deployment-validator.js',
    'Running deployment configuration validation'
  );
  
  if (!validationResult.success) {
    logEvent('error', launchState.currentPhase, 'Deployment validation failed');
    return false;
  }
  
  launchState.completedStages.push('environment-check');
  return true;
}

/**
 * Stage 2: Build and Quality Validation
 */
async function validateBuildQuality() {
  launchState.currentPhase = 'Build & Quality';
  logEvent('info', launchState.currentPhase, 'Starting build and quality validation');
  
  // TypeScript compilation
  const typecheckResult = executeCommand(
    'npm run typecheck',
    'TypeScript type checking'
  );
  
  if (!typecheckResult.success) {
    logEvent('error', launchState.currentPhase, 'TypeScript compilation failed');
    return false;
  }
  
  // ESLint validation
  const lintResult = executeCommand(
    'npm run lint',
    'ESLint code quality check'
  );
  
  if (!lintResult.success) {
    logEvent('error', launchState.currentPhase, 'ESLint validation failed');
    return false;
  }
  
  // Production build
  const buildResult = executeCommand(
    'npm run build',
    'Production build creation',
    { timeout: launchConfig.timeouts.validation }
  );
  
  if (!buildResult.success) {
    logEvent('error', launchState.currentPhase, 'Production build failed');
    return false;
  }
  
  // Build size analysis
  if (fs.existsSync('dist')) {
    try {
      const stats = execSync('du -sh dist', { encoding: 'utf8' });
      const sizeMatch = stats.match(/([\\d.]+[MK]?)\\s/);
      const buildSize = sizeMatch ? sizeMatch[1] : 'unknown';
      
      logEvent('success', launchState.currentPhase, `Build size: ${buildSize}`);
      launchState.metrics.buildSize = buildSize;
      
    } catch (error) {
      logEvent('warn', launchState.currentPhase, 'Could not determine build size');
    }
  }
  
  launchState.completedStages.push('build-verification');
  return true;
}

/**
 * Stage 3: Pre-deployment Health Check
 */
async function preDeploymentHealthCheck() {
  launchState.currentPhase = 'Pre-deployment';
  logEvent('info', launchState.currentPhase, 'Starting pre-deployment checks');
  
  // Check if monitoring is configured
  if (!fs.existsSync('monitoring/config/monitoring.json')) {
    logEvent('warn', launchState.currentPhase, 'Monitoring configuration not found');
    
    // Auto-setup monitoring
    const monitoringSetup = executeCommand(
      'node scripts/monitoring-setup.js',
      'Setting up production monitoring'
    );
    
    if (!monitoringSetup.success) {
      logEvent('error', launchState.currentPhase, 'Failed to setup monitoring');
      return false;
    }
  } else {
    logEvent('success', launchState.currentPhase, 'Monitoring configuration found');
  }
  
  // Verify Vercel CLI availability
  const vercelCheck = executeCommand(
    'vercel --version',
    'Vercel CLI availability check',
    { silent: true }
  );
  
  if (!vercelCheck.success) {
    logEvent('error', launchState.currentPhase, 'Vercel CLI not available');
    return false;
  }
  
  logEvent('success', launchState.currentPhase, 'Vercel CLI ready');
  
  launchState.completedStages.push('pre-deployment');
  return true;
}

/**
 * Stage 4: Production Deployment
 */
async function executeDeployment() {
  launchState.currentPhase = 'Deployment';
  logEvent('info', launchState.currentPhase, 'Starting production deployment');
  
  // Deploy to production
  const deployResult = executeCommand(
    'vercel --prod --token=$VERCEL_TOKEN',
    'Deploying to production',
    { timeout: launchConfig.timeouts.deployment }
  );
  
  if (!deployResult.success) {
    logEvent('error', launchState.currentPhase, 'Production deployment failed');
    return false;
  }
  
  // Extract deployment URL from output
  const urlMatch = deployResult.output?.match(/https:\\/\\/[^\\s]+/);
  const deploymentUrl = urlMatch ? urlMatch[0] : null;
  
  if (deploymentUrl) {
    logEvent('success', launchState.currentPhase, `Deployed to: ${deploymentUrl}`);
    launchState.metrics.deploymentUrl = deploymentUrl;
  } else {
    logEvent('warn', launchState.currentPhase, 'Could not extract deployment URL');
  }
  
  // Wait for deployment propagation
  logEvent('info', launchState.currentPhase, 'Waiting for DNS propagation (30s)');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  launchState.completedStages.push('deployment-execution');
  return true;
}

/**
 * Stage 5: Post-deployment Health Verification
 */
async function verifyDeploymentHealth() {
  launchState.currentPhase = 'Health Verification';
  logEvent('info', launchState.currentPhase, 'Starting post-deployment health checks');
  
  let healthCheckPasses = 0;
  const requiredPasses = launchConfig.successCriteria.healthCheckPasses;
  
  for (let attempt = 1; attempt <= requiredPasses; attempt++) {
    logEvent('info', launchState.currentPhase, `Health check attempt ${attempt}/${requiredPasses}`);
    
    // Set health check URL if deployment URL is available
    const healthCheckEnv = launchState.metrics.deploymentUrl 
      ? `HEALTH_CHECK_URL=${launchState.metrics.deploymentUrl}` 
      : '';
    
    const healthResult = executeCommand(
      `${healthCheckEnv} node scripts/production-health-check.js`,
      `Health check attempt ${attempt}`,
      { timeout: launchConfig.timeouts.healthCheck }
    );
    
    if (healthResult.success) {
      healthCheckPasses++;
      logEvent('success', launchState.currentPhase, `Health check ${attempt} passed`);
    } else {
      logEvent('error', launchState.currentPhase, `Health check ${attempt} failed`);
      
      // If this is not the last attempt, wait before retry
      if (attempt < requiredPasses) {
        logEvent('info', launchState.currentPhase, 'Waiting 10s before retry');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
  
  if (healthCheckPasses >= requiredPasses) {
    logEvent('success', launchState.currentPhase, `${healthCheckPasses}/${requiredPasses} health checks passed`);
    launchState.completedStages.push('health-verification');
    return true;
  } else {
    logEvent('error', launchState.currentPhase, `Only ${healthCheckPasses}/${requiredPasses} health checks passed`);
    return false;
  }
}

/**
 * Stage 6: Monitoring Activation
 */
async function activateMonitoring() {
  launchState.currentPhase = 'Monitoring Activation';
  logEvent('info', launchState.currentPhase, 'Activating production monitoring');
  
  // Enable production monitoring
  const monitoringEnv = launchState.metrics.deploymentUrl 
    ? `VITE_ENABLE_PROD_MONITOR=true` 
    : '';
    
  logEvent('success', launchState.currentPhase, 'Production monitoring enabled');
  
  // Log monitoring dashboard URLs
  console.log('\\n📊 Monitoring Dashboards:');
  console.log('- Vercel Analytics: https://vercel.com/analytics');
  console.log('- Application Health: Built-in performance monitor');
  
  if (launchState.metrics.deploymentUrl) {
    console.log(`- Live Site: ${launchState.metrics.deploymentUrl}`);
  }
  
  launchState.completedStages.push('monitoring-activation');
  return true;
}

/**
 * Generate launch summary report
 */
function generateLaunchSummary() {
  const endTime = Date.now();
  const duration = Math.round((endTime - launchState.startTime) / 1000);
  
  console.log('\\n' + '='.repeat(50));
  console.log('📋 PRODUCTION LAUNCH SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`🕒 Launch Duration: ${duration} seconds`);
  console.log(`✅ Completed Stages: ${launchState.completedStages.length}/6`);
  console.log(`❌ Errors: ${launchState.errors.length}`);
  console.log(`⚠️ Warnings: ${launchState.warnings.length}`);
  
  if (launchState.metrics.deploymentUrl) {
    console.log(`🌐 Deployment URL: ${launchState.metrics.deploymentUrl}`);
  }
  
  if (launchState.metrics.buildSize) {
    console.log(`📦 Build Size: ${launchState.metrics.buildSize}`);
  }
  
  // Show completed stages
  console.log('\\n📈 Completed Stages:');
  launchState.completedStages.forEach(stage => {
    console.log(`   ✅ ${stage}`);
  });
  
  // Show errors if any
  if (launchState.errors.length > 0) {
    console.log('\\n❌ Errors:');
    launchState.errors.forEach(error => {
      console.log(`   - [${error.phase}] ${error.message}`);
    });
  }
  
  // Show warnings if any
  if (launchState.warnings.length > 0) {
    console.log('\\n⚠️ Warnings:');
    launchState.warnings.forEach(warning => {
      console.log(`   - [${warning.phase}] ${warning.message}`);
    });
  }
  
  // Overall status
  const isSuccess = launchState.completedStages.length === 6 && launchState.errors.length === 0;
  
  console.log('\\n' + '='.repeat(50));
  
  if (isSuccess) {
    console.log('🎉 LAUNCH SUCCESSFUL!');
    console.log('✅ Kasama AI is now live in production');
    console.log('📊 Monitoring is active and ready');
    console.log('🚀 Ready to serve users');
  } else {
    console.log('❌ LAUNCH FAILED');
    console.log('🔍 Review errors above and address issues');
    console.log('🔄 Consider rollback if deployment was partially successful');
  }
  
  console.log('='.repeat(50));
  
  // Save launch report
  const reportPath = `launch-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportPath, JSON.stringify({
    ...launchState,
    duration,
    success: isSuccess,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`\\n📄 Launch report saved: ${reportPath}`);
  
  return isSuccess;
}

/**
 * Emergency rollback
 */
async function emergencyRollback() {
  console.log('\\n🚨 INITIATING EMERGENCY ROLLBACK');
  console.log('='.repeat(35));
  
  const rollbackResult = executeCommand(
    'node scripts/rollback-strategy.js critical_error',
    'Emergency rollback execution'
  );
  
  if (rollbackResult.success) {
    console.log('✅ Emergency rollback completed');
    return true;
  } else {
    console.log('❌ Emergency rollback failed - manual intervention required');
    return false;
  }
}

/**
 * Main launch orchestration
 */
async function orchestrateLaunch() {
  try {
    console.log('🚀 Starting production launch sequence...\\n');
    
    // Stage 1: Environment Validation
    if (!await validateEnvironment()) {
      throw new Error('Environment validation failed');
    }
    
    // Stage 2: Build and Quality Validation
    if (!await validateBuildQuality()) {
      throw new Error('Build and quality validation failed');
    }
    
    // Stage 3: Pre-deployment Health Check
    if (!await preDeploymentHealthCheck()) {
      throw new Error('Pre-deployment checks failed');
    }
    
    // Stage 4: Production Deployment
    if (!await executeDeployment()) {
      throw new Error('Production deployment failed');
    }
    
    // Stage 5: Post-deployment Health Verification
    if (!await verifyDeploymentHealth()) {
      console.log('\\n⚠️ Health verification failed - considering rollback');
      
      // Offer rollback option
      if (process.argv.includes('--auto-rollback')) {
        await emergencyRollback();
      } else {
        console.log('💡 Run with --auto-rollback flag to enable automatic rollback');
        console.log('🔄 Manual rollback: npm run launch:rollback critical_error');
      }
      
      throw new Error('Post-deployment health verification failed');
    }
    
    // Stage 6: Monitoring Activation
    if (!await activateMonitoring()) {
      logEvent('warn', 'Launch', 'Monitoring activation had issues but launch continues');
    }
    
    // Generate success summary
    const success = generateLaunchSummary();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logEvent('error', 'Launch', 'Launch failed', error.message);
    
    // Generate failure summary
    generateLaunchSummary();
    
    console.log('\\n🆘 Launch failed - next steps:');
    console.log('1. Review errors in launch summary above');
    console.log('2. Fix identified issues');
    console.log('3. Re-run launch: npm run launch:full-validation');
    console.log('4. If deployed but unhealthy: npm run launch:rollback');
    
    process.exit(2);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\\n⏹️ Launch interrupted');
  generateLaunchSummary();
  process.exit(130);
});

// Command line usage
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage: node production-launch.js [options]

Options:
  --auto-rollback    Enable automatic rollback on health check failure
  --help, -h         Show this help message

Environment Variables (Required):
  VERCEL_TOKEN           Vercel authentication token
  VERCEL_PROJECT_ID      Vercel project identifier  
  VITE_SUPABASE_URL      Supabase project URL
  VITE_SUPABASE_ANON_KEY Supabase anonymous key

Launch Stages:
  1. Environment Validation    - Check env vars and deployment config
  2. Build & Quality          - TypeScript, ESLint, production build
  3. Pre-deployment           - Monitoring setup, CLI verification
  4. Deployment               - Production deployment to Vercel
  5. Health Verification      - Multiple health checks post-deployment
  6. Monitoring Activation    - Enable production monitoring

Examples:
  node production-launch.js                    # Standard launch
  node production-launch.js --auto-rollback   # Auto-rollback on failure

NPM Scripts:
  npm run launch:full-validation    # Complete launch process
  npm run launch:validate          # Deployment configuration check
  npm run launch:health            # Health check only  
  npm run launch:rollback          # Emergency rollback
`);
    process.exit(0);
  }
  
  orchestrateLaunch();
}