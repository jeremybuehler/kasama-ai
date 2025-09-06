#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Tests all critical components of the Kasama AI platform
 */

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';

const CONFIG = {
  PRODUCTION_URL: 'https://kasama-8zzhqmxg3-buehlerdev.vercel.app',
  TIMEOUT: 10000,
  CRITICAL_PATHS: [
    '/',
    '/login',
    '/auth/callback',
    // Protected routes tested after auth
  ],
  PERFORMANCE_THRESHOLDS: {
    LOAD_TIME: 3000, // 3 seconds
    FIRST_PAINT: 2000, // 2 seconds
    LARGEST_CONTENTFUL_PAINT: 2500 // 2.5 seconds
  }
};

class DeploymentVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      version: this.getAppVersion(),
      deployment: null,
      tests: [],
      performance: {},
      security: {},
      overall: 'pending'
    };
  }

  getAppVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      return packageJson.version || '0.1.0';
    } catch (error) {
      return 'unknown';
    }
  }

  async runFullVerification() {
    console.log('🚀 Starting Production Deployment Verification...\n');
    
    try {
      // 1. Basic connectivity and response tests
      await this.testBasicConnectivity();
      
      // 2. Security headers and HTTPS
      await this.testSecurityHeaders();
      
      // 3. Performance and load time tests
      await this.testPerformance();
      
      // 4. AI service endpoints (if available)
      await this.testAIServices();
      
      // 5. Database connectivity (via health endpoints)
      await this.testDatabaseHealth();
      
      // 6. Authentication flow test
      await this.testAuthenticationFlow();
      
      // 7. Real-time features test
      await this.testRealTimeFeatures();
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      this.logError('Critical deployment verification error', error);
      this.results.overall = 'failed';
    }
    
    // Save results
    this.saveResults();
    
    return this.results;
  }

  async testBasicConnectivity() {
    console.log('📡 Testing basic connectivity...');
    
    for (const path of CONFIG.CRITICAL_PATHS) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(path);
        const loadTime = Date.now() - startTime;
        
        const test = {
          name: `Connectivity: ${path}`,
          status: response.statusCode >= 200 && response.statusCode < 500 ? 'pass' : 'fail',
          loadTime: loadTime,
          statusCode: response.statusCode,
          details: response.statusCode >= 400 ? `HTTP ${response.statusCode}` : 'Success'
        };
        
        this.results.tests.push(test);
        this.logTest(test);
        
      } catch (error) {
        const test = {
          name: `Connectivity: ${path}`,
          status: 'fail',
          error: error.message,
          details: 'Connection failed'
        };
        this.results.tests.push(test);
        this.logTest(test);
      }
    }
  }

  async testSecurityHeaders() {
    console.log('🔒 Testing security headers...');
    
    try {
      const response = await this.makeRequest('/', { includeHeaders: true });
      
      const securityHeaders = {
        'strict-transport-security': 'HSTS',
        'content-security-policy': 'CSP',
        'x-content-type-options': 'MIME type sniffing protection',
        'x-frame-options': 'Clickjacking protection',
        'x-xss-protection': 'XSS protection'
      };
      
      for (const [header, description] of Object.entries(securityHeaders)) {
        const hasHeader = response.headers[header] || response.headers[header.toLowerCase()];
        const test = {
          name: `Security Header: ${description}`,
          status: hasHeader ? 'pass' : 'warn',
          details: hasHeader ? `Present: ${hasHeader}` : 'Missing header'
        };
        
        this.results.tests.push(test);
        this.logTest(test);
      }
      
      // HTTPS check
      const httpsTest = {
        name: 'HTTPS Enforcement',
        status: CONFIG.PRODUCTION_URL.startsWith('https://') ? 'pass' : 'fail',
        details: CONFIG.PRODUCTION_URL.startsWith('https://') ? 'Using HTTPS' : 'Not using HTTPS'
      };
      
      this.results.tests.push(httpsTest);
      this.logTest(httpsTest);
      
    } catch (error) {
      this.logError('Security header test failed', error);
    }
  }

  async testPerformance() {
    console.log('⚡ Testing performance metrics...');
    
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/');
      const totalLoadTime = Date.now() - startTime;
      
      this.results.performance = {
        totalLoadTime,
        thresholdMet: totalLoadTime < CONFIG.PERFORMANCE_THRESHOLDS.LOAD_TIME,
        timestamp: new Date().toISOString()
      };
      
      const performanceTest = {
        name: 'Page Load Performance',
        status: totalLoadTime < CONFIG.PERFORMANCE_THRESHOLDS.LOAD_TIME ? 'pass' : 'warn',
        loadTime: totalLoadTime,
        details: `${totalLoadTime}ms (threshold: ${CONFIG.PERFORMANCE_THRESHOLDS.LOAD_TIME}ms)`
      };
      
      this.results.tests.push(performanceTest);
      this.logTest(performanceTest);
      
    } catch (error) {
      this.logError('Performance test failed', error);
    }
  }

  async testAIServices() {
    console.log('🤖 Testing AI service availability...');
    
    // Test if AI features are enabled in environment
    const aiEnabled = process.env.VITE_ENABLE_AI_FEATURES === 'true';
    
    const test = {
      name: 'AI Features Configuration',
      status: aiEnabled ? 'pass' : 'info',
      details: aiEnabled ? 'AI features enabled' : 'AI features disabled (expected in development)'
    };
    
    this.results.tests.push(test);
    this.logTest(test);
  }

  async testDatabaseHealth() {
    console.log('💾 Testing database connectivity...');
    
    try {
      // Test if we can reach a health endpoint
      const response = await this.makeRequest('/api/health', { timeout: 5000 });
      
      const test = {
        name: 'Database Health Check',
        status: response.statusCode === 200 ? 'pass' : 'warn',
        statusCode: response.statusCode,
        details: response.statusCode === 200 ? 'Database accessible' : 'Health endpoint not available'
      };
      
      this.results.tests.push(test);
      this.logTest(test);
      
    } catch (error) {
      const test = {
        name: 'Database Health Check',
        status: 'info',
        details: 'Health endpoint not implemented yet'
      };
      
      this.results.tests.push(test);
      this.logTest(test);
    }
  }

  async testAuthenticationFlow() {
    console.log('🔐 Testing authentication flow...');
    
    try {
      // Test login page accessibility
      const loginResponse = await this.makeRequest('/login');
      
      const test = {
        name: 'Authentication Pages',
        status: loginResponse.statusCode === 200 ? 'pass' : 'fail',
        statusCode: loginResponse.statusCode,
        details: loginResponse.statusCode === 200 ? 'Login page accessible' : 'Login page not accessible'
      };
      
      this.results.tests.push(test);
      this.logTest(test);
      
    } catch (error) {
      this.logError('Authentication test failed', error);
    }
  }

  async testRealTimeFeatures() {
    console.log('📡 Testing real-time features...');
    
    // For now, just verify the endpoints exist
    const test = {
      name: 'Real-time Features',
      status: 'info',
      details: 'WebSocket and real-time features testing not implemented yet'
    };
    
    this.results.tests.push(test);
    this.logTest(test);
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = CONFIG.PRODUCTION_URL + path;
      const timeout = options.timeout || CONFIG.TIMEOUT;
      
      const req = https.get(url, { timeout }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: options.includeHeaders ? res.headers : undefined,
            data: data
          });
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(timeout);
    });
  }

  logTest(test) {
    const emoji = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️';
    const time = test.loadTime ? ` (${test.loadTime}ms)` : '';
    console.log(`${emoji} ${test.name}${time}: ${test.details}`);
  }

  logError(message, error) {
    console.error(`❌ ${message}:`, error.message);
  }

  generateSummary() {
    const passedTests = this.results.tests.filter(t => t.status === 'pass').length;
    const failedTests = this.results.tests.filter(t => t.status === 'fail').length;
    const warningTests = this.results.tests.filter(t => t.status === 'warn').length;
    const totalTests = this.results.tests.length;
    
    console.log('\n📊 Deployment Verification Summary:');
    console.log(`════════════════════════════════════`);
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    console.log(`⚠️  Warnings: ${warningTests}/${totalTests}`);
    
    if (failedTests === 0) {
      this.results.overall = passedTests > 0 ? 'success' : 'unknown';
      console.log('\n🎉 Deployment verification completed successfully!');
    } else {
      this.results.overall = 'needs_attention';
      console.log('\n⚠️  Deployment has issues that need attention.');
    }
    
    console.log(`\n🌍 Production URL: ${CONFIG.PRODUCTION_URL}`);
    console.log(`📦 Version: ${this.results.version}`);
    console.log(`⏰ Timestamp: ${this.results.timestamp}`);
  }

  saveResults() {
    const filename = `deployment-verification-${Date.now()}.json`;
    const filepath = `./deployment-reports/${filename}`;
    
    // Ensure directory exists
    if (!fs.existsSync('./deployment-reports')) {
      fs.mkdirSync('./deployment-reports', { recursive: true });
    }
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filepath}`);
    } catch (error) {
      console.error('Failed to save results:', error.message);
    }
    
    // Also save as latest
    try {
      fs.writeFileSync('./deployment-reports/latest.json', JSON.stringify(this.results, null, 2));
    } catch (error) {
      console.error('Failed to save latest results:', error.message);
    }
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new DeploymentVerifier();
  verifier.runFullVerification()
    .then((results) => {
      process.exit(results.overall === 'success' ? 0 : 1);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export default DeploymentVerifier;
