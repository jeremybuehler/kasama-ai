# GitHub Secrets Setup Instructions

## Required Secrets Configuration

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### Core Vercel Secrets

```
Name: VERCEL_TOKEN
Description: Vercel API token with deployment permissions
Instructions: Get from: https://vercel.com/account/tokens
Required: Yes
```

```
Name: VERCEL_ORG_ID
Description: Vercel organization/team ID
Instructions: Run: vercel whoami
Required: Yes
```

```
Name: VERCEL_PROJECT_ID
Description: Kasama AI project ID on Vercel
Instructions: Get from Vercel Dashboard → Project Settings → General
Required: Yes
```


### Application Secrets

```
Name: VITE_SUPABASE_URL
Description: Production Supabase project URL
Instructions: Get from Supabase Dashboard → Settings → API
Required: Yes
```

```
Name: VITE_SUPABASE_ANON_KEY
Description: Production Supabase anonymous key
Instructions: Get from Supabase Dashboard → Settings → API
Required: Yes
```

```
Name: VITE_CLAUDE_API_KEY
Description: Claude AI API key
Instructions: Get from: https://console.anthropic.com/
Required: Yes
```

```
Name: VITE_OPENAI_API_KEY
Description: OpenAI API key (fallback)
Instructions: Get from: https://platform.openai.com/api-keys
Required: No
```


## Quick Setup Commands

### If you have GitHub CLI installed:
```bash
# Add secrets one by one (you'll be prompted for values)
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set VITE_SUPABASE_URL
gh secret set VITE_SUPABASE_ANON_KEY
gh secret set VITE_CLAUDE_API_KEY
```

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
```bash
# Test staging deployment
gh workflow run deploy.yml --ref main -f environment=staging

# Test production deployment (requires approval)
gh workflow run deploy.yml --ref main -f environment=production
```

Generated: 2025-08-31T14:59:25.101Z
