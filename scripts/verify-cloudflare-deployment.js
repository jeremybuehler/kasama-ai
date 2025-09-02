#!/usr/bin/env node

/**
 * Cloudflare Pages Deployment Verification Script
 * 
 * This script verifies that the project is ready for Cloudflare Pages deployment
 * by checking all required files, configurations, and dependencies.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Verification results
const results = {
  passed: [],
  warnings: [],
  errors: []
};

// Helper function to check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

// Helper function to read JSON file
const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
};

// Helper function to execute shell commands
const exec = (command, silent = true) => {
  try {
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' }).trim();
  } catch (error) {
    return null;
  }
};

// 1. Check package.json and build scripts
function checkPackageJson() {
  console.log(`\n${colors.cyan}Checking package.json...${colors.reset}`);
  
  const packageJson = readJSON('package.json');
  if (!packageJson) {
    results.errors.push('package.json not found or invalid');
    return;
  }
  
  // Check build script
  if (packageJson.scripts && packageJson.scripts.build) {
    results.passed.push('Build script found: ' + packageJson.scripts.build);
  } else {
    results.errors.push('No build script in package.json');
  }
  
  // Check Node version
  if (packageJson.engines && packageJson.engines.node) {
    results.passed.push('Node version specified: ' + packageJson.engines.node);
  } else {
    results.warnings.push('No Node version specified in package.json');
  }
  
  // Check for Vite
  const hasVite = packageJson.devDependencies?.vite || packageJson.dependencies?.vite;
  if (hasVite) {
    results.passed.push('Vite dependency found');
  } else {
    results.errors.push('Vite not found in dependencies');
  }
}

// 2. Check Vite configuration
function checkViteConfig() {
  console.log(`\n${colors.cyan}Checking Vite configuration...${colors.reset}`);
  
  const viteConfigExists = fileExists('vite.config.mjs') || 
                           fileExists('vite.config.js') || 
                           fileExists('vite.config.ts');
  
  if (viteConfigExists) {
    results.passed.push('Vite config file found');
    
    // Check if build output is set to 'dist'
    const viteConfig = fs.readFileSync(
      fileExists('vite.config.mjs') ? 'vite.config.mjs' : 
      fileExists('vite.config.js') ? 'vite.config.js' : 
      'vite.config.ts', 
      'utf8'
    );
    
    if (viteConfig.includes('outDir')) {
      if (viteConfig.includes('"dist"') || viteConfig.includes("'dist'")) {
        results.passed.push('Build output directory set to "dist"');
      } else {
        results.warnings.push('Build output directory might not be "dist"');
      }
    }
  } else {
    results.errors.push('No Vite config file found');
  }
}

// 3. Check Cloudflare-specific files
function checkCloudflareFiles() {
  console.log(`\n${colors.cyan}Checking Cloudflare-specific files...${colors.reset}`);
  
  // Check _headers file
  if (fileExists('public/_headers')) {
    results.passed.push('_headers file found');
    
    const headers = fs.readFileSync('public/_headers', 'utf8');
    if (headers.includes('Cache-Control')) {
      results.passed.push('Cache-Control headers configured');
    }
    if (headers.includes('X-Frame-Options')) {
      results.passed.push('Security headers configured');
    }
  } else {
    results.warnings.push('No _headers file found in public/');
  }
  
  // Check _redirects file
  if (fileExists('public/_redirects')) {
    results.passed.push('_redirects file found');
    
    const redirects = fs.readFileSync('public/_redirects', 'utf8');
    if (redirects.includes('/*') && redirects.includes('/index.html')) {
      results.passed.push('SPA fallback redirect configured');
    }
  } else {
    results.warnings.push('No _redirects file found in public/');
  }
  
  // Check Cloudflare Pages config
  if (fileExists('.cloudflare/pages.json')) {
    results.passed.push('Cloudflare Pages config found');
  } else {
    results.warnings.push('No .cloudflare/pages.json config found (optional)');
  }
}

// 4. Check GitHub Actions workflow
function checkGitHubActions() {
  console.log(`\n${colors.cyan}Checking GitHub Actions...${colors.reset}`);
  
  if (fileExists('.github/workflows/deploy-cloudflare.yml')) {
    results.passed.push('Cloudflare deployment workflow found');
    
    const workflow = fs.readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');
    
    // Check for required secrets
    const requiredSecrets = [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    requiredSecrets.forEach(secret => {
      if (workflow.includes(secret)) {
        results.passed.push(`Workflow uses secret: ${secret}`);
      } else {
        results.warnings.push(`Secret ${secret} not referenced in workflow`);
      }
    });
  } else {
    results.warnings.push('No Cloudflare deployment workflow found');
  }
  
  // Check for old Vercel workflow
  if (fileExists('.github/workflows/deploy.yml')) {
    const workflow = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
    if (workflow.includes('vercel')) {
      results.warnings.push('Old Vercel deployment workflow still exists');
    }
  }
}

// 5. Check environment variables
function checkEnvironmentVariables() {
  console.log(`\n${colors.cyan}Checking environment variables...${colors.reset}`);
  
  // Check for .env files
  if (fileExists('.env')) {
    results.warnings.push('.env file found (should not be committed)');
  }
  
  if (fileExists('.env.example') || fileExists('.env.cloudflare.example')) {
    results.passed.push('Environment variable example file found');
  } else {
    results.warnings.push('No .env.example file found');
  }
  
  // Check validation script
  if (fileExists('scripts/validate-env.js')) {
    results.passed.push('Environment validation script found');
    
    const validationScript = fs.readFileSync('scripts/validate-env.js', 'utf8');
    if (validationScript.includes('VITE_SUPABASE_URL')) {
      results.passed.push('Supabase environment variables validated');
    }
  }
}

// 6. Check build output
function checkBuildOutput() {
  console.log(`\n${colors.cyan}Checking build output...${colors.reset}`);
  
  if (fileExists('dist')) {
    results.passed.push('Build output directory (dist) exists');
    
    // Check for index.html
    if (fileExists('dist/index.html')) {
      results.passed.push('index.html found in build output');
    } else {
      results.warnings.push('No index.html in dist/ - run build first');
    }
  } else {
    results.warnings.push('No dist/ directory - run build to verify');
  }
}

// 7. Check for potential issues
function checkPotentialIssues() {
  console.log(`\n${colors.cyan}Checking for potential issues...${colors.reset}`);
  
  // Check for Vercel-specific files
  if (fileExists('vercel.json')) {
    results.warnings.push('vercel.json still exists - consider removing');
  }
  
  if (fileExists('.vercelignore')) {
    results.warnings.push('.vercelignore still exists - consider removing');
  }
  
  // Check gitignore
  if (fileExists('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (!gitignore.includes('dist')) {
      results.warnings.push('dist/ not in .gitignore');
    }
    if (!gitignore.includes('.env')) {
      results.errors.push('.env not in .gitignore - security risk!');
    }
  }
  
  // Check for hardcoded URLs
  const srcFiles = exec('find src -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null');
  if (srcFiles) {
    const files = srcFiles.split('\n').filter(Boolean);
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('localhost:') || content.includes('127.0.0.1')) {
          results.warnings.push(`Hardcoded localhost URL in ${file}`);
        }
        if (content.includes('.vercel.app')) {
          results.warnings.push(`Vercel URL reference in ${file}`);
        }
      } catch {}
    });
  }
}

// 8. Test build command
function testBuild() {
  console.log(`\n${colors.cyan}Testing build command...${colors.reset}`);
  
  console.log('Running: npm run build (this may take a moment)...');
  const buildResult = exec('npm run build 2>&1');
  
  if (buildResult && !buildResult.includes('error')) {
    results.passed.push('Build command executed successfully');
    
    // Check if dist was created
    if (fileExists('dist/index.html')) {
      results.passed.push('Build output verified');
    }
  } else {
    results.errors.push('Build command failed - check for errors');
    if (buildResult) {
      console.log(`${colors.red}Build output:${colors.reset}`);
      console.log(buildResult);
    }
  }
}

// Main verification function
function runVerification() {
  console.log(`${colors.bright}${colors.cyan}Cloudflare Pages Deployment Verification${colors.reset}`);
  console.log('='.repeat(50));
  
  // Run all checks
  checkPackageJson();
  checkViteConfig();
  checkCloudflareFiles();
  checkGitHubActions();
  checkEnvironmentVariables();
  checkPotentialIssues();
  checkBuildOutput();
  
  // Optional: Test build
  const args = process.argv.slice(2);
  if (args.includes('--test-build')) {
    testBuild();
  }
  
  // Display results
  console.log(`\n${colors.bright}Verification Results${colors.reset}`);
  console.log('='.repeat(50));
  
  if (results.passed.length > 0) {
    console.log(`\n${colors.green}✅ Passed (${results.passed.length})${colors.reset}`);
    results.passed.forEach(item => console.log(`  ${colors.green}✓${colors.reset} ${item}`));
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings (${results.warnings.length})${colors.reset}`);
    results.warnings.forEach(item => console.log(`  ${colors.yellow}⚠${colors.reset} ${item}`));
  }
  
  if (results.errors.length > 0) {
    console.log(`\n${colors.red}❌ Errors (${results.errors.length})${colors.reset}`);
    results.errors.forEach(item => console.log(`  ${colors.red}✗${colors.reset} ${item}`));
  }
  
  // Final verdict
  console.log(`\n${colors.bright}Final Status:${colors.reset}`);
  if (results.errors.length === 0) {
    if (results.warnings.length === 0) {
      console.log(`${colors.green}✅ Ready for Cloudflare Pages deployment!${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Ready for deployment with ${results.warnings.length} warnings to review.${colors.reset}`);
    }
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/setup-cloudflare-secrets.js');
    console.log('2. Create project at: https://dash.cloudflare.com/pages');
    console.log('3. Push to main branch to trigger deployment');
  } else {
    console.log(`${colors.red}❌ Not ready - ${results.errors.length} error(s) must be fixed.${colors.reset}`);
    console.log('\nFix the errors above before proceeding with deployment.');
  }
  
  // Exit with appropriate code
  process.exit(results.errors.length > 0 ? 1 : 0);
}

// Run verification
runVerification();
