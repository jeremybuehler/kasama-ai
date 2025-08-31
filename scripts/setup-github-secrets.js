#!/usr/bin/env node

/**
 * GitHub Secrets Setup Helper for Kasama AI
 * Helps gather and validate required secrets for automated deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubSecretsSetup {
  constructor() {
    this.requiredSecrets = [
      {
        name: 'VERCEL_TOKEN',
        description: 'Vercel API token with deployment permissions',
        required: true,
        validation: (value) => value && value.length > 20,
        instructions: 'Get from: https://vercel.com/account/tokens'
      },
      {
        name: 'VERCEL_ORG_ID',
        description: 'Vercel organization/team ID',
        required: true,
        validation: (value) => value && value.startsWith('team_'),
        instructions: 'Run: vercel whoami'
      },
      {
        name: 'VERCEL_PROJECT_ID',
        description: 'Kasama AI project ID on Vercel',
        required: true,
        validation: (value) => value && value.length > 10,
        instructions: 'Get from Vercel Dashboard → Project Settings → General'
      },
      {
        name: 'VITE_SUPABASE_URL',
        description: 'Production Supabase project URL',
        required: true,
        validation: (value) => value && value.startsWith('https://') && value.includes('.supabase.co'),
        instructions: 'Get from Supabase Dashboard → Settings → API'
      },
      {
        name: 'VITE_SUPABASE_ANON_KEY',
        description: 'Production Supabase anonymous key',
        required: true,
        validation: (value) => value && value.startsWith('eyJ') && value.length > 100,
        instructions: 'Get from Supabase Dashboard → Settings → API'
      },
      {
        name: 'VITE_CLAUDE_API_KEY',
        description: 'Claude AI API key',
        required: true,
        validation: (value) => value && value.startsWith('sk-ant-'),
        instructions: 'Get from: https://console.anthropic.com/'
      },
      {
        name: 'VITE_OPENAI_API_KEY',
        description: 'OpenAI API key (fallback)',
        required: false,
        validation: (value) => !value || value.startsWith('sk-'),
        instructions: 'Get from: https://platform.openai.com/api-keys'
      }
    ];
  }

  async run() {
    console.log('🛡️ Kasama AI - GitHub Secrets Setup Helper\n');
    
    try {
      await this.checkPrerequisites();
      await this.gatherVercelInfo();
      await this.validateSecrets();
      await this.generateSetupInstructions();
      
      console.log('\n✅ Setup validation complete!');
      console.log('📋 Follow the instructions in SETUP_INSTRUCTIONS.md to configure GitHub secrets.');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      console.log('✅ Git repository detected');
    } catch (error) {
      throw new Error('This script must be run from within the Kasama AI git repository');
    }

    // Check if Vercel CLI is installed and authenticated
    try {
      const vercelUser = execSync('vercel whoami', { encoding: 'utf8' }).trim();
      console.log(`✅ Vercel CLI authenticated as: ${vercelUser}`);
    } catch (error) {
      throw new Error('Vercel CLI not installed or not authenticated. Run: npm i -g vercel@latest && vercel login');
    }

    // Check if GitHub CLI is available (optional but recommended)
    try {
      execSync('gh --version', { stdio: 'ignore' });
      console.log('✅ GitHub CLI available');
    } catch (error) {
      console.log('⚠️ GitHub CLI not available - manual secret setup will be required');
    }
  }

  async gatherVercelInfo() {
    console.log('\n📊 Gathering Vercel configuration...');
    
    try {
      // Get Vercel user info
      const vercelWhoami = execSync('vercel whoami', { encoding: 'utf8' }).trim();
      console.log(`User: ${vercelWhoami}`);

      // Get project list and find kasama-ai
      const projectList = execSync('vercel project ls', { encoding: 'utf8' });
      const kasamaProject = projectList.split('\n').find(line => line.includes('kasama-ai'));
      
      if (kasamaProject) {
        console.log('✅ Found kasama-ai project on Vercel');
        
        // Extract project URL
        const urlMatch = kasamaProject.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          console.log(`Production URL: ${urlMatch[0]}`);
        }
      } else {
        console.log('⚠️ kasama-ai project not found on Vercel');
        console.log('Please ensure the project exists or run: vercel link');
      }

      // Try to get project ID from .vercel/project.json if it exists
      const vercelProjectPath = path.join(process.cwd(), '.vercel', 'project.json');
      if (fs.existsSync(vercelProjectPath)) {
        const projectConfig = JSON.parse(fs.readFileSync(vercelProjectPath, 'utf8'));
        console.log(`Project ID: ${projectConfig.projectId}`);
        console.log(`Org ID: ${projectConfig.orgId}`);
      } else {
        console.log('⚠️ Local Vercel project configuration not found');
        console.log('Run: vercel link to connect to the project');
      }

    } catch (error) {
      console.log('⚠️ Could not gather all Vercel information:', error.message);
    }
  }

  async validateSecrets() {
    console.log('\n🔐 Validating required secrets...');
    
    const envExample = path.join(process.cwd(), '.env.example');
    const envLocal = path.join(process.cwd(), '.env.local');
    
    let localConfig = {};
    
    // Try to read local environment for validation
    if (fs.existsSync(envLocal)) {
      const envContent = fs.readFileSync(envLocal, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          localConfig[key.trim()] = value.trim();
        }
      });
    }

    for (const secret of this.requiredSecrets) {
      const value = process.env[secret.name] || localConfig[secret.name];
      const isValid = secret.validation(value);
      
      if (secret.required) {
        if (isValid) {
          console.log(`✅ ${secret.name}: Valid`);
        } else {
          console.log(`❌ ${secret.name}: Invalid or missing`);
          console.log(`   Instructions: ${secret.instructions}`);
        }
      } else {
        if (value) {
          console.log(`✅ ${secret.name}: ${isValid ? 'Valid' : 'Invalid format'}`);
        } else {
          console.log(`⚪ ${secret.name}: Optional - not configured`);
        }
      }
    }
  }

  async generateSetupInstructions() {
    console.log('\n📝 Generating setup instructions...');
    
    const instructions = `# GitHub Secrets Setup Instructions

## Required Secrets Configuration

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### Core Vercel Secrets
${this.requiredSecrets.filter(s => s.name.startsWith('VERCEL')).map(secret => `
\`\`\`
Name: ${secret.name}
Description: ${secret.description}
Instructions: ${secret.instructions}
Required: ${secret.required ? 'Yes' : 'No'}
\`\`\`
`).join('')}

### Application Secrets
${this.requiredSecrets.filter(s => s.name.startsWith('VITE')).map(secret => `
\`\`\`
Name: ${secret.name}
Description: ${secret.description}
Instructions: ${secret.instructions}
Required: ${secret.required ? 'Yes' : 'No'}
\`\`\`
`).join('')}

## Quick Setup Commands

### If you have GitHub CLI installed:
\`\`\`bash
# Add secrets one by one (you'll be prompted for values)
${this.requiredSecrets.filter(s => s.required).map(s => `gh secret set ${s.name}`).join('\n')}
\`\`\`

### Manual Setup:
1. Go to: https://github.com/YOUR_USERNAME/kasama-ai/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret listed above with its corresponding value

## Environment Protection Setup

### Create Environments:
1. Go to: https://github.com/YOUR_USERNAME/kasama-ai/settings/environments
2. Create "staging" environment (no protection rules)
3. Create "production" environment with:
   - Required reviewers: 1-2 people
   - Wait timer: 5 minutes
   - Deployment branches: main only
4. Create "production-approval" environment with:
   - Required reviewers: deployment approvers
   - Wait timer: 10 minutes

## Validation

After setup, test the pipeline:
\`\`\`bash
# Test staging deployment
gh workflow run deploy.yml --ref main -f environment=staging

# Test production deployment (requires approval)
gh workflow run deploy.yml --ref main -f environment=production
\`\`\`

Generated: ${new Date().toISOString()}
`;

    fs.writeFileSync('SETUP_INSTRUCTIONS.md', instructions);
    console.log('✅ Generated SETUP_INSTRUCTIONS.md');
  }
}

// Run the setup helper
if (require.main === module) {
  const setup = new GitHubSecretsSetup();
  setup.run().catch(console.error);
}

module.exports = GitHubSecretsSetup;