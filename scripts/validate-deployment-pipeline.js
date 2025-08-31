#!/usr/bin/env node

/**
 * Kasama AI - Deployment Pipeline Validator
 * Comprehensive validation of GitHub-Vercel integration and security controls
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentPipelineValidator {
  constructor() {
    this.validationResults = {
      infrastructure: [],
      security: [],
      deployment: [],
      monitoring: []
    };
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🛡️ Kasama AI - Deployment Pipeline Validation\n');
    console.log('🔍 Running comprehensive security and deployment validation...\n');

    try {
      await this.validateInfrastructure();
      await this.validateSecurity();
      await this.validateDeploymentWorkflow();
      await this.validateMonitoring();
      await this.generateReport();

      if (this.errors.length === 0) {
        console.log('\n✅ All validation checks passed!');
        console.log('🚀 Deployment pipeline is ready for production use.');
        process.exit(0);
      } else {
        console.log(`\n❌ ${this.errors.length} critical issues found.`);
        console.log(`⚠️  ${this.warnings.length} warnings identified.`);
        console.log('\n📋 Please address critical issues before proceeding with production deployment.');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n💥 Validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateInfrastructure() {
    console.log('📊 Validating Infrastructure Configuration...');

    // 1. Git repository validation
    try {
      const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
      const packageJsonPath = path.join(gitRoot, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        this.validationResults.infrastructure.push({
          check: 'Package.json exists',
          status: 'pass',
          message: `Project: ${packageJson.name} v${packageJson.version}`
        });
      }
    } catch (error) {
      this.errors.push('Git repository not found or package.json missing');
    }

    // 2. Vercel CLI validation
    try {
      const vercelUser = execSync('vercel whoami', { encoding: 'utf8' }).trim();
      this.validationResults.infrastructure.push({
        check: 'Vercel CLI authenticated',
        status: 'pass',
        message: `User: ${vercelUser}`
      });

      // Check if project exists
      const projectList = execSync('vercel project ls', { encoding: 'utf8' });
      if (projectList.includes('kasama-ai')) {
        this.validationResults.infrastructure.push({
          check: 'Kasama AI project exists on Vercel',
          status: 'pass',
          message: 'Project found and accessible'
        });
      } else {
        this.errors.push('Kasama AI project not found on Vercel');
      }
    } catch (error) {
      this.errors.push('Vercel CLI not authenticated or not available');
    }

    // 3. GitHub CLI validation
    try {
      execSync('gh --version', { stdio: 'ignore' });
      const authStatus = execSync('gh auth status', { encoding: 'utf8', stdio: 'pipe' });
      
      this.validationResults.infrastructure.push({
        check: 'GitHub CLI authenticated',
        status: 'pass',
        message: 'Ready for repository operations'
      });
    } catch (error) {
      this.warnings.push('GitHub CLI not available - manual configuration will be required');
    }

    console.log('  ✅ Infrastructure validation completed\n');
  }

  async validateSecurity() {
    console.log('🔒 Validating Security Configuration...');

    // 1. Workflow files validation
    const workflowFiles = [
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml',
      '.github/workflows/security.yml'
    ];

    for (const workflowFile of workflowFiles) {
      if (fs.existsSync(workflowFile)) {
        const content = fs.readFileSync(workflowFile, 'utf8');
        
        // Check for security best practices
        const securityChecks = [
          { pattern: /permissions:/, name: 'Workflow permissions defined' },
          { pattern: /secrets\./, name: 'Secrets properly referenced' },
          { pattern: /npm audit/, name: 'Dependency vulnerability scanning' },
          { pattern: /timeout-minutes:/, name: 'Execution timeouts configured' }
        ];

        securityChecks.forEach(check => {
          if (check.pattern.test(content)) {
            this.validationResults.security.push({
              check: `${workflowFile}: ${check.name}`,
              status: 'pass',
              message: 'Security best practice implemented'
            });
          }
        });
      } else {
        this.errors.push(`Missing workflow file: ${workflowFile}`);
      }
    }

    // 2. Security documentation validation
    const securityDocs = [
      '.github/SECURITY_DEPLOYMENT_GUIDE.md',
      '.github/SECURITY_RUNBOOK.md',
      '.github/DEPLOYMENT_CONFIGURATION.md'
    ];

    securityDocs.forEach(doc => {
      if (fs.existsSync(doc)) {
        this.validationResults.security.push({
          check: `Documentation: ${path.basename(doc)}`,
          status: 'pass',
          message: 'Security documentation available'
        });
      } else {
        this.warnings.push(`Missing security documentation: ${doc}`);
      }
    });

    // 3. Environment configuration validation
    if (fs.existsSync('.env.example')) {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      
      // Check for required environment variables
      const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_CLAUDE_API_KEY'
      ];

      const missingVars = requiredVars.filter(varName => !envExample.includes(varName));
      
      if (missingVars.length === 0) {
        this.validationResults.security.push({
          check: 'Environment variables documented',
          status: 'pass',
          message: 'All required variables documented in .env.example'
        });
      } else {
        this.warnings.push(`Missing environment variables in .env.example: ${missingVars.join(', ')}`);
      }
    } else {
      this.warnings.push('No .env.example file found');
    }

    // 4. Vercel configuration security
    if (fs.existsSync('vercel.json')) {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      
      // Check for security headers
      if (vercelConfig.headers && vercelConfig.headers.length > 0) {
        const securityHeaders = vercelConfig.headers.find(h => 
          h.headers && h.headers.some(header => 
            ['X-Frame-Options', 'X-Content-Type-Options', 'Strict-Transport-Security'].includes(header.key)
          )
        );
        
        if (securityHeaders) {
          this.validationResults.security.push({
            check: 'Vercel security headers configured',
            status: 'pass',
            message: 'Security headers properly configured in vercel.json'
          });
        } else {
          this.warnings.push('No security headers configured in vercel.json');
        }
      }
    }

    console.log('  ✅ Security validation completed\n');
  }

  async validateDeploymentWorkflow() {
    console.log('🚀 Validating Deployment Workflow...');

    // 1. Deployment workflow structure validation
    if (fs.existsSync('.github/workflows/deploy.yml')) {
      const deployWorkflow = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
      
      const workflowChecks = [
        { pattern: /security-preflight/, name: 'Security pre-flight checks' },
        { pattern: /pre-deployment/, name: 'Pre-deployment validation' },
        { pattern: /production-approval/, name: 'Production approval gate' },
        { pattern: /health-check/, name: 'Post-deployment health checks' },
        { pattern: /rollback/, name: 'Automatic rollback capability' },
        { pattern: /environment:/, name: 'Environment protection' }
      ];

      workflowChecks.forEach(check => {
        if (check.pattern.test(deployWorkflow)) {
          this.validationResults.deployment.push({
            check: check.name,
            status: 'pass',
            message: 'Deployment pipeline stage implemented'
          });
        } else {
          this.warnings.push(`Deployment workflow missing: ${check.name}`);
        }
      });
    } else {
      this.errors.push('Deployment workflow file missing');
    }

    // 2. Build configuration validation
    try {
      execSync('npm run typecheck', { stdio: 'ignore' });
      this.validationResults.deployment.push({
        check: 'TypeScript compilation',
        status: 'pass',
        message: 'TypeScript compiles without errors'
      });
    } catch (error) {
      this.errors.push('TypeScript compilation failed');
    }

    try {
      execSync('npm run lint', { stdio: 'ignore' });
      this.validationResults.deployment.push({
        check: 'ESLint validation',
        status: 'pass',
        message: 'Code passes linting rules'
      });
    } catch (error) {
      this.warnings.push('ESLint warnings or errors found');
    }

    // 3. Production build test
    try {
      process.env.VITE_SUPABASE_URL = 'https://placeholder.supabase.co';
      process.env.VITE_SUPABASE_ANON_KEY = 'placeholder-key';
      process.env.VITE_ENABLE_AI_FEATURES = 'false';
      
      execSync('npm run build', { stdio: 'ignore' });
      this.validationResults.deployment.push({
        check: 'Production build',
        status: 'pass',
        message: 'Application builds successfully for production'
      });
      
      // Check build output
      if (fs.existsSync('dist') || fs.existsSync('build')) {
        this.validationResults.deployment.push({
          check: 'Build artifacts',
          status: 'pass',
          message: 'Build artifacts generated successfully'
        });
      }
    } catch (error) {
      this.errors.push('Production build failed');
    }

    console.log('  ✅ Deployment workflow validation completed\n');
  }

  async validateMonitoring() {
    console.log('📈 Validating Monitoring & Observability...');

    // 1. Health check endpoint validation
    try {
      const response = await this.performHealthCheck('https://app.kasama.ai');
      if (response.success) {
        this.validationResults.monitoring.push({
          check: 'Production application health',
          status: 'pass',
          message: `Response time: ${response.responseTime}ms, Status: ${response.status}`
        });
      } else {
        this.warnings.push('Production application not accessible or unhealthy');
      }
    } catch (error) {
      this.warnings.push('Unable to perform production health check');
    }

    // 2. Monitoring configuration
    const monitoringFiles = [
      'scripts/production-health-check.js',
      'scripts/monitoring-setup.js',
      'scripts/deployment-validator.js'
    ];

    monitoringFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.validationResults.monitoring.push({
          check: `Monitoring script: ${path.basename(file)}`,
          status: 'pass',
          message: 'Monitoring automation available'
        });
      } else {
        this.warnings.push(`Missing monitoring script: ${file}`);
      }
    });

    // 3. Error tracking configuration
    if (fs.existsSync('.env.example')) {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      if (envExample.includes('VITE_SENTRY_DSN')) {
        this.validationResults.monitoring.push({
          check: 'Error tracking configured',
          status: 'pass',
          message: 'Sentry error tracking available'
        });
      }
    }

    console.log('  ✅ Monitoring validation completed\n');
  }

  async performHealthCheck(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      try {
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { encoding: 'utf8' });
        const responseTime = Date.now() - startTime;
        resolve({
          success: response === '200',
          status: response,
          responseTime: responseTime
        });
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  async generateReport() {
    console.log('📋 Generating Validation Report...\n');

    // Summary statistics
    const totalChecks = Object.values(this.validationResults).reduce((sum, category) => sum + category.length, 0);
    const passedChecks = Object.values(this.validationResults).reduce((sum, category) => 
      sum + category.filter(check => check.status === 'pass').length, 0);

    console.log('📊 Validation Summary');
    console.log('═'.repeat(50));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks} (${((passedChecks/totalChecks) * 100).toFixed(1)}%)`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}\n`);

    // Detailed results by category
    for (const [category, results] of Object.entries(this.validationResults)) {
      if (results.length > 0) {
        console.log(`🔍 ${category.charAt(0).toUpperCase() + category.slice(1)} Results:`);
        results.forEach(result => {
          const icon = result.status === 'pass' ? '✅' : '❌';
          console.log(`  ${icon} ${result.check}: ${result.message}`);
        });
        console.log('');
      }
    }

    // Errors and warnings
    if (this.errors.length > 0) {
      console.log('❌ Critical Issues:');
      this.errors.forEach(error => console.log(`  • ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
      console.log('');
    }

    // Generate detailed report file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks,
        passedChecks,
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        successRate: ((passedChecks/totalChecks) * 100).toFixed(1) + '%'
      },
      results: this.validationResults,
      errors: this.errors,
      warnings: this.warnings
    };

    fs.writeFileSync('deployment-validation-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved: deployment-validation-report.json');
  }
}

// Run validation
if (require.main === module) {
  const validator = new DeploymentPipelineValidator();
  validator.validate().catch(console.error);
}

module.exports = DeploymentPipelineValidator;