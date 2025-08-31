#!/usr/bin/env node

/**
 * Deployment Validator Script
 * 
 * Comprehensive validation of deployment configuration and readiness.
 * Checks environment variables, build configuration, security settings,
 * and deployment prerequisites.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Deployment Validation');
console.log('========================');
console.log(`Timestamp: ${new Date().toISOString()}\n`);

/**
 * Validation results tracker
 */
const validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

/**
 * Log validation result
 */
function logResult(category, test, status, message = '') {
  const timestamp = new Date().toLocaleTimeString();
  const statusIcon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  const resultText = `${statusIcon} [${category}] ${test}`;
  
  console.log(resultText + (message ? `: ${message}` : ''));
  
  validationResults[status === 'pass' ? 'passed' : status === 'warn' ? 'warnings' : 'failed']++;
  
  if (status !== 'pass') {
    validationResults.issues.push({
      category,
      test,
      status,
      message,
      timestamp
    });
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(path.resolve(filePath));
  } catch (error) {
    return false;
  }
}

/**
 * Read and parse JSON file
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Validate package.json configuration
 */
function validatePackageJson() {
  console.log('\n📦 Package Configuration');
  console.log('-------------------------');
  
  const packageJson = readJsonFile('package.json');
  
  if (!packageJson) {
    logResult('Package', 'package.json exists', 'fail', 'File not found or invalid');
    return;
  }
  
  logResult('Package', 'package.json exists', 'pass');
  
  // Check required fields
  const requiredFields = ['name', 'version', 'scripts'];
  requiredFields.forEach(field => {
    if (packageJson[field]) {
      logResult('Package', `${field} field`, 'pass');
    } else {
      logResult('Package', `${field} field`, 'fail', 'Missing required field');
    }
  });
  
  // Check required scripts
  const requiredScripts = ['build', 'dev'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts?.[script]) {
      logResult('Package', `${script} script`, 'pass');
    } else {
      logResult('Package', `${script} script`, 'fail', 'Missing required script');
    }
  });
  
  // Check for production dependencies
  const productionDeps = ['react', 'react-dom'];
  productionDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep]) {
      logResult('Package', `${dep} dependency`, 'pass');
    } else {
      logResult('Package', `${dep} dependency`, 'fail', 'Missing critical dependency');
    }
  });
}

/**
 * Validate Vercel configuration
 */
function validateVercelConfig() {
  console.log('\n🌐 Vercel Configuration');
  console.log('-------------------------');
  
  const vercelJson = readJsonFile('vercel.json');
  
  if (!vercelJson) {
    logResult('Vercel', 'vercel.json exists', 'fail', 'Configuration file missing');
    return;
  }
  
  logResult('Vercel', 'vercel.json exists', 'pass');
  
  // Check framework
  if (vercelJson.framework === 'vite') {
    logResult('Vercel', 'framework setting', 'pass', 'Vite framework configured');
  } else {
    logResult('Vercel', 'framework setting', 'warn', `Framework: ${vercelJson.framework || 'not specified'}`);
  }
  
  // Check build settings
  if (vercelJson.buildCommand) {
    logResult('Vercel', 'build command', 'pass', vercelJson.buildCommand);
  } else {
    logResult('Vercel', 'build command', 'warn', 'No custom build command');
  }
  
  if (vercelJson.outputDirectory) {
    logResult('Vercel', 'output directory', 'pass', vercelJson.outputDirectory);
  } else {
    logResult('Vercel', 'output directory', 'warn', 'Using default output directory');
  }
  
  // Check security headers
  if (vercelJson.headers && vercelJson.headers.length > 0) {
    logResult('Vercel', 'security headers', 'pass', `${vercelJson.headers.length} header groups configured`);
    
    // Check for specific security headers
    const headerStrings = JSON.stringify(vercelJson.headers);
    const securityHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'Strict-Transport-Security'];
    
    securityHeaders.forEach(header => {
      if (headerStrings.includes(header)) {
        logResult('Vercel', `${header} header`, 'pass');
      } else {
        logResult('Vercel', `${header} header`, 'warn', 'Security header not configured');
      }
    });
  } else {
    logResult('Vercel', 'security headers', 'warn', 'No security headers configured');
  }
  
  // Check SPA routing
  if (vercelJson.rewrites) {
    logResult('Vercel', 'SPA routing', 'pass', 'Rewrites configured');
  } else {
    logResult('Vercel', 'SPA routing', 'warn', 'No rewrites configured - may affect SPA routing');
  }
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  console.log('\n🔧 Environment Configuration');
  console.log('------------------------------');
  
  // Required environment variables for production
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Validate format/content
      if (varName === 'VITE_SUPABASE_URL') {
        if (value.startsWith('https://') && !value.includes('placeholder')) {
          logResult('Environment', varName, 'pass', `${value.length} characters`);
        } else {
          logResult('Environment', varName, 'fail', 'Invalid URL format or placeholder');
        }
      } else if (varName === 'VITE_SUPABASE_ANON_KEY') {
        if (value.length > 20 && !value.includes('placeholder')) {
          logResult('Environment', varName, 'pass', `${value.length} characters`);
        } else {
          logResult('Environment', varName, 'fail', 'Invalid key format or placeholder');
        }
      } else {
        logResult('Environment', varName, 'pass', `${value.length} characters`);
      }
    } else {
      logResult('Environment', varName, 'fail', 'Not set');
    }
  });
  
  // Optional variables
  const optionalVars = [
    'VITE_ENABLE_AI_FEATURES',
    'VITE_ENABLE_ANALYTICS',
    'VITE_ENABLE_OFFLINE_MODE'
  ];
  
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      logResult('Environment', varName, 'pass', value);
    } else {
      logResult('Environment', varName, 'warn', 'Using default value');
    }
  });
}

/**
 * Validate GitHub Actions configuration
 */
function validateGitHubActions() {
  console.log('\n🔄 CI/CD Configuration');
  console.log('-----------------------');
  
  const workflowsDir = '.github/workflows';
  
  if (!fileExists(workflowsDir)) {
    logResult('CI/CD', 'workflows directory', 'fail', 'Directory not found');
    return;
  }
  
  logResult('CI/CD', 'workflows directory', 'pass');
  
  // Check for required workflow files
  const requiredWorkflows = ['ci.yml', 'deploy.yml'];
  
  requiredWorkflows.forEach(workflow => {
    if (fileExists(path.join(workflowsDir, workflow))) {
      logResult('CI/CD', workflow, 'pass');
    } else {
      logResult('CI/CD', workflow, 'fail', 'Workflow file missing');
    }
  });
  
  // Check for security workflow
  if (fileExists(path.join(workflowsDir, 'security.yml'))) {
    logResult('CI/CD', 'security.yml', 'pass', 'Security scanning configured');
  } else {
    logResult('CI/CD', 'security.yml', 'warn', 'No security scanning workflow');
  }
}

/**
 * Validate project structure
 */
function validateProjectStructure() {
  console.log('\n📁 Project Structure');
  console.log('---------------------');
  
  const requiredDirs = ['src', 'public'];
  const requiredFiles = ['index.html', 'vite.config.mjs'];
  
  // Check directories
  requiredDirs.forEach(dir => {
    if (fileExists(dir)) {
      logResult('Structure', `${dir}/ directory`, 'pass');
    } else {
      logResult('Structure', `${dir}/ directory`, 'fail', 'Required directory missing');
    }
  });
  
  // Check files
  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      logResult('Structure', file, 'pass');
    } else {
      logResult('Structure', file, 'fail', 'Required file missing');
    }
  });
  
  // Check for TypeScript configuration
  if (fileExists('tsconfig.json')) {
    logResult('Structure', 'tsconfig.json', 'pass', 'TypeScript configured');
  } else {
    logResult('Structure', 'tsconfig.json', 'warn', 'No TypeScript configuration');
  }
}

/**
 * Validate build readiness
 */
function validateBuildReadiness() {
  console.log('\n🔨 Build Readiness');
  console.log('-------------------');
  
  // Check if node_modules exists
  if (fileExists('node_modules')) {
    logResult('Build', 'dependencies installed', 'pass', 'node_modules directory found');
  } else {
    logResult('Build', 'dependencies installed', 'fail', 'Run npm install');
  }
  
  // Check lock file
  if (fileExists('package-lock.json')) {
    logResult('Build', 'lock file', 'pass', 'package-lock.json found');
  } else if (fileExists('yarn.lock')) {
    logResult('Build', 'lock file', 'pass', 'yarn.lock found');
  } else {
    logResult('Build', 'lock file', 'warn', 'No lock file found');
  }
  
  // Check for dist directory (from previous builds)
  if (fileExists('dist')) {
    logResult('Build', 'previous builds', 'warn', 'dist/ directory exists - consider clean build');
  } else {
    logResult('Build', 'clean state', 'pass', 'No previous build artifacts');
  }
}

/**
 * Generate validation summary
 */
function generateSummary() {
  console.log('\n' + '='.repeat(32));
  console.log('📊 Validation Summary');
  console.log('='.repeat(32));
  
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`⚠️ Warnings: ${validationResults.warnings}`);
  console.log(`❌ Failed: ${validationResults.failed}`);
  
  const total = validationResults.passed + validationResults.warnings + validationResults.failed;
  const passRate = total > 0 ? Math.round((validationResults.passed / total) * 100) : 0;
  
  console.log(`\n📈 Pass Rate: ${passRate}%`);
  
  // Determine deployment readiness
  if (validationResults.failed === 0 && validationResults.warnings <= 3) {
    console.log('\n✅ DEPLOYMENT READY');
    console.log('🚀 All critical validations passed');
    return 0;
  } else if (validationResults.failed === 0) {
    console.log('\n⚠️ DEPLOYMENT POSSIBLE WITH WARNINGS');
    console.log('🔍 Consider addressing warnings before production');
    return 1;
  } else {
    console.log('\n❌ DEPLOYMENT NOT READY');
    console.log('🚫 Critical issues must be resolved');
    
    // Show critical issues
    const criticalIssues = validationResults.issues.filter(issue => issue.status === 'fail');
    if (criticalIssues.length > 0) {
      console.log('\n🔥 Critical Issues:');
      criticalIssues.forEach(issue => {
        console.log(`   - [${issue.category}] ${issue.test}: ${issue.message}`);
      });
    }
    
    return 2;
  }
}

/**
 * Main validation execution
 */
async function runValidation() {
  try {
    // Run all validation checks
    validatePackageJson();
    validateVercelConfig();
    validateEnvironment();
    validateGitHubActions();
    validateProjectStructure();
    validateBuildReadiness();
    
    // Generate summary and exit
    const exitCode = generateSummary();
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n💥 Validation failed with error:', error.message);
    process.exit(3);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n⏹️ Validation interrupted');
  process.exit(130);
});

// Run validation
runValidation();