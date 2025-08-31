#!/usr/bin/env node

/**
 * Production Health Check Script
 * 
 * Comprehensive health check for production deployment validation.
 * Validates application availability, performance, and critical functionality.
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // Production URL to test
  url: process.env.HEALTH_CHECK_URL || 'https://kasama-ai.vercel.app',
  
  // Performance thresholds (milliseconds)
  thresholds: {
    responseTime: 3000,    // 3 seconds
    goodResponseTime: 1000, // 1 second for "good" rating
    ttfb: 800             // Time to First Byte
  },
  
  // Retry configuration
  retries: 3,
  retryDelay: 5000, // 5 seconds
  
  // Timeout configuration
  timeout: 10000 // 10 seconds
};

console.log('🏥 Production Health Check');
console.log('==========================');
console.log(`Target URL: ${config.url}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

/**
 * Perform HTTP request with timing
 */
function performHealthCheck(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let ttfbTime = null;
    
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, {
      timeout: config.timeout
    }, (response) => {
      ttfbTime = Date.now() - startTime;
      
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
          ttfb: ttfbTime,
          contentLength: data.length,
          headers: response.headers,
          body: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });
  });
}

/**
 * Validate response content
 */
function validateContent(response) {
  const issues = [];
  
  // Check if HTML contains expected elements
  if (response.headers['content-type']?.includes('text/html')) {
    if (!response.body.includes('<title>')) {
      issues.push('Missing HTML title tag');
    }
    
    if (!response.body.includes('Kasama')) {
      issues.push('Missing application name in content');
    }
    
    if (response.body.includes('Error') || response.body.includes('error')) {
      issues.push('Error text found in response');
    }
    
    if (response.body.includes('placeholder')) {
      issues.push('Placeholder content detected');
    }
  }
  
  return issues;
}

/**
 * Generate health score
 */
function calculateHealthScore(results) {
  let score = 100;
  const issues = [];
  
  // Response time scoring
  if (results.responseTime > config.thresholds.responseTime) {
    score -= 30;
    issues.push(`Slow response time: ${results.responseTime}ms (threshold: ${config.thresholds.responseTime}ms)`);
  } else if (results.responseTime > config.thresholds.goodResponseTime) {
    score -= 10;
    issues.push(`Acceptable response time: ${results.responseTime}ms`);
  }
  
  // TTFB scoring
  if (results.ttfb > config.thresholds.ttfb) {
    score -= 15;
    issues.push(`High TTFB: ${results.ttfb}ms (threshold: ${config.thresholds.ttfb}ms)`);
  }
  
  // Status code scoring
  if (results.statusCode !== 200) {
    score -= 40;
    issues.push(`Non-200 status code: ${results.statusCode}`);
  }
  
  // Content validation
  const contentIssues = validateContent(results);
  if (contentIssues.length > 0) {
    score -= 20;
    issues.push(...contentIssues);
  }
  
  // Ensure score is not negative
  score = Math.max(0, score);
  
  return { score, issues };
}

/**
 * Get health grade from score
 */
function getHealthGrade(score) {
  if (score >= 95) return 'A';
  if (score >= 85) return 'B';
  if (score >= 75) return 'C';
  if (score >= 65) return 'D';
  return 'F';
}

/**
 * Main health check execution
 */
async function runHealthCheck() {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < config.retries) {
    attempt++;
    
    try {
      console.log(`📋 Attempt ${attempt}/${config.retries}`);
      
      // Perform health check
      const results = await performHealthCheck(config.url);
      
      // Calculate health metrics
      const health = calculateHealthScore(results);
      const grade = getHealthGrade(health.score);
      
      // Display results
      console.log('\n📊 Health Check Results');
      console.log('========================');
      console.log(`Status Code: ${results.statusCode}`);
      console.log(`Response Time: ${results.responseTime}ms`);
      console.log(`Time to First Byte: ${results.ttfb}ms`);
      console.log(`Content Length: ${results.contentLength} bytes`);
      console.log(`Health Score: ${health.score}/100 (${grade})`);
      
      // Display performance rating
      if (results.responseTime <= config.thresholds.goodResponseTime) {
        console.log('⚡ Performance: Excellent');
      } else if (results.responseTime <= config.thresholds.responseTime) {
        console.log('✅ Performance: Good');
      } else {
        console.log('⚠️ Performance: Needs Improvement');
      }
      
      // Display issues
      if (health.issues.length > 0) {
        console.log('\n⚠️ Issues Detected:');
        health.issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log('\n✅ No issues detected');
      }
      
      // Display headers
      console.log('\n🔧 Response Headers:');
      Object.entries(results.headers).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      // Determine overall status
      console.log('\n' + '='.repeat(24));
      
      if (health.score >= 80 && results.statusCode === 200) {
        console.log('✅ Health Check: PASSED');
        console.log('🚀 Application is ready for production traffic');
        process.exit(0);
      } else if (health.score >= 60) {
        console.log('⚠️ Health Check: WARNING');
        console.log('🔍 Application functional but has performance issues');
        process.exit(1);
      } else {
        console.log('❌ Health Check: FAILED');
        console.log('🚨 Application not ready for production traffic');
        process.exit(2);
      }
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < config.retries) {
        console.log(`⏳ Waiting ${config.retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }
  
  // All attempts failed
  console.log('\n' + '='.repeat(24));
  console.log('❌ Health Check: FAILED');
  console.log(`🚨 All ${config.retries} attempts failed`);
  console.log(`Last error: ${lastError?.message || 'Unknown error'}`);
  console.log('🚫 Application is not accessible');
  process.exit(3);
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n⏹️ Health check interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Health check terminated');
  process.exit(143);
});

// Run the health check
runHealthCheck().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(4);
});