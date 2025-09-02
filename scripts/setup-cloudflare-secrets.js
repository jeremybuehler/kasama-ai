#!/usr/bin/env node

/**
 * Cloudflare Pages GitHub Secrets Setup Script
 * 
 * This script helps set up the required GitHub secrets for Cloudflare Pages deployment.
 * It can be run locally with the GitHub CLI or used as a reference for manual setup.
 * 
 * Required secrets:
 * - CLOUDFLARE_API_TOKEN
 * - CLOUDFLARE_ACCOUNT_ID
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

import { execSync } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper function to execute shell commands
const exec = (command, silent = false) => {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    if (!silent) console.log(output);
    return output.trim();
  } catch (error) {
    if (!silent) {
      console.error(`${colors.red}Error executing command: ${command}${colors.reset}`);
      console.error(error.message);
    }
    return null;
  }
};

// Check if GitHub CLI is installed
const checkGitHubCLI = () => {
  const ghVersion = exec('gh --version', true);
  if (!ghVersion) {
    console.log(`${colors.yellow}GitHub CLI is not installed or not in PATH.${colors.reset}`);
    console.log('Please install it from: https://cli.github.com/');
    return false;
  }
  console.log(`${colors.green}✓${colors.reset} GitHub CLI found: ${ghVersion.split('\n')[0]}`);
  return true;
};

// Check if user is authenticated with GitHub
const checkGitHubAuth = () => {
  const authStatus = exec('gh auth status', true);
  if (!authStatus) {
    console.log(`${colors.yellow}Not authenticated with GitHub CLI.${colors.reset}`);
    console.log('Run: gh auth login');
    return false;
  }
  console.log(`${colors.green}✓${colors.reset} Authenticated with GitHub`);
  return true;
};

// Get repository info
const getRepoInfo = () => {
  const remoteUrl = exec('git config --get remote.origin.url', true);
  if (!remoteUrl) return null;
  
  // Parse GitHub repo from URL
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2]
    };
  }
  return null;
};

// Main setup function
async function setupSecrets() {
  console.log(`${colors.cyan}${colors.bright}Cloudflare Pages GitHub Secrets Setup${colors.reset}`);
  console.log('=' .repeat(50));
  
  // Check prerequisites
  const hasGH = checkGitHubCLI();
  const isAuthenticated = hasGH && checkGitHubAuth();
  const repoInfo = getRepoInfo();
  
  if (!repoInfo) {
    console.error(`${colors.red}Could not detect GitHub repository.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}Repository:${colors.reset} ${repoInfo.owner}/${repoInfo.repo}`);
  console.log();
  
  // Collect secret values
  console.log(`${colors.yellow}Please provide the following values:${colors.reset}`);
  console.log('(Press Enter to skip if you want to set it manually later)\n');
  
  const secrets = {};
  
  // Cloudflare API Token
  console.log(`${colors.bright}1. Cloudflare API Token${colors.reset}`);
  console.log('   Create at: https://dash.cloudflare.com/profile/api-tokens');
  console.log('   Required permissions: Cloudflare Pages:Edit');
  secrets.CLOUDFLARE_API_TOKEN = await question('   Enter token: ');
  console.log();
  
  // Cloudflare Account ID
  console.log(`${colors.bright}2. Cloudflare Account ID${colors.reset}`);
  console.log('   Find in: Cloudflare Dashboard → Right sidebar');
  secrets.CLOUDFLARE_ACCOUNT_ID = await question('   Enter Account ID: ');
  console.log();
  
  // Supabase URL
  console.log(`${colors.bright}3. Supabase Project URL${colors.reset}`);
  console.log('   Format: https://[PROJECT_ID].supabase.co');
  secrets.VITE_SUPABASE_URL = await question('   Enter URL: ');
  console.log();
  
  // Supabase Anon Key
  console.log(`${colors.bright}4. Supabase Anonymous Key${colors.reset}`);
  console.log('   Find in: Supabase Dashboard → Settings → API');
  secrets.VITE_SUPABASE_ANON_KEY = await question('   Enter key: ');
  console.log();
  
  // Confirm before setting secrets
  console.log(`${colors.yellow}Ready to set the following secrets:${colors.reset}`);
  Object.entries(secrets).forEach(([key, value]) => {
    const displayValue = value ? 
      (key.includes('KEY') || key.includes('TOKEN') ? '***' + value.slice(-4) : value) : 
      '(skipped)';
    console.log(`  ${key}: ${displayValue}`);
  });
  console.log();
  
  const confirm = await question(`${colors.bright}Proceed? (y/n): ${colors.reset}`);
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }
  
  // Set secrets using GitHub CLI or provide manual instructions
  console.log();
  if (isAuthenticated) {
    console.log(`${colors.cyan}Setting secrets via GitHub CLI...${colors.reset}`);
    
    for (const [key, value] of Object.entries(secrets)) {
      if (value) {
        const command = `echo "${value}" | gh secret set ${key} --repo ${repoInfo.owner}/${repoInfo.repo}`;
        const result = exec(command, true);
        if (result !== null) {
          console.log(`${colors.green}✓${colors.reset} Set ${key}`);
        } else {
          console.log(`${colors.red}✗${colors.reset} Failed to set ${key}`);
        }
      } else {
        console.log(`${colors.yellow}⊘${colors.reset} Skipped ${key}`);
      }
    }
  } else {
    console.log(`${colors.yellow}Manual Setup Instructions:${colors.reset}`);
    console.log('1. Go to: https://github.com/' + repoInfo.owner + '/' + repoInfo.repo + '/settings/secrets/actions');
    console.log('2. Click "New repository secret" for each secret');
    console.log('3. Add the following secrets:\n');
    
    Object.entries(secrets).forEach(([key, value]) => {
      if (value) {
        console.log(`   ${colors.bright}${key}${colors.reset}`);
        console.log(`   Value: ${value}`);
        console.log();
      }
    });
  }
  
  // Generate environment variables file for reference
  console.log(`\n${colors.cyan}Generating reference files...${colors.reset}`);
  
  // Create .env.cloudflare.example
  const envExample = Object.keys(secrets)
    .filter(key => key.startsWith('VITE_'))
    .map(key => `${key}=your-${key.toLowerCase().replace(/_/g, '-')}`)
    .join('\n');
  
  fs.writeFileSync('.env.cloudflare.example', envExample + '\n');
  console.log(`${colors.green}✓${colors.reset} Created .env.cloudflare.example`);
  
  // Create deployment checklist
  const checklist = `# Cloudflare Pages Deployment Checklist

## Prerequisites
- [x] GitHub repository configured
- [ ] Cloudflare account created
- [ ] API token generated
- [ ] GitHub secrets configured

## GitHub Secrets Status
${Object.keys(secrets).map(key => `- [ ] ${key}`).join('\n')}

## Cloudflare Pages Setup
- [ ] Create new Pages project
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - Build command: \`npm run build\`
  - Build output directory: \`dist\`
  - Root directory: \`/\`
- [ ] Set environment variables in Cloudflare Pages dashboard
- [ ] Configure custom domain (optional)

## Testing
- [ ] Test preview deployment
- [ ] Verify build logs
- [ ] Check site functionality
- [ ] Test environment variables
- [ ] Verify custom headers and redirects

## Production
- [ ] Deploy to production branch
- [ ] Update DNS records
- [ ] Monitor deployment
- [ ] Update documentation

Generated: ${new Date().toISOString()}
`;
  
  fs.writeFileSync('CLOUDFLARE_DEPLOYMENT_CHECKLIST.md', checklist);
  console.log(`${colors.green}✓${colors.reset} Created CLOUDFLARE_DEPLOYMENT_CHECKLIST.md`);
  
  console.log(`\n${colors.green}${colors.bright}Setup complete!${colors.reset}`);
  console.log('\nNext steps:');
  console.log('1. Create a Cloudflare Pages project at: https://dash.cloudflare.com/pages');
  console.log('2. Connect your GitHub repository');
  console.log('3. Configure build settings as shown in the checklist');
  console.log('4. Push to main branch or create a PR to trigger deployment');
  
  rl.close();
}

// Run the setup
setupSecrets().catch(error => {
  console.error(`${colors.red}Setup failed:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});
