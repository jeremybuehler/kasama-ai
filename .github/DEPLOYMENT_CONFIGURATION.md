# 🚀 Kasama AI - Deployment Configuration Guide

## Current Vercel Configuration

Based on the system analysis, here are your specific configuration values:

### ✅ Vercel Project Information
- **Project Name**: `kasama-ai`
- **Production URL**: `https://app.kasama.ai`
- **Project ID**: `prj_zii8CkkLbsfY2vQIopYcukaQVTS7`
- **Organization ID**: `team_CZ14eEQZUPtEY2s6xFySyxEn`
- **Authenticated User**: `jeremybuehler`

## 🔐 Required GitHub Secrets

Add these exact values to your GitHub repository secrets:

```bash
# Navigate to: https://github.com/YOUR_USERNAME/kasama-ai/settings/secrets/actions

# Core Vercel Configuration
VERCEL_TOKEN=your-vercel-api-token  # Get from: https://vercel.com/account/tokens
VERCEL_ORG_ID=team_CZ14eEQZUPtEY2s6xFySyxEn
VERCEL_PROJECT_ID=prj_zii8CkkLbsfY2vQIopYcukaQVTS7

# Application Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLAUDE_API_KEY=your-claude-api-key
VITE_OPENAI_API_KEY=your-openai-api-key  # Optional fallback
```

## 🛡️ GitHub Branch Protection Setup

### Step-by-Step Configuration

1. **Navigate to Branch Protection**:
   ```
   https://github.com/YOUR_USERNAME/kasama-ai/settings/branches
   ```

2. **Add Branch Protection Rule**:
   - Click "Add branch protection rule"
   - Branch name pattern: `main`

3. **Configure Protection Settings**:
   ```yaml
   ✅ Require a pull request before merging
     ✅ Require approvals: 1
     ✅ Dismiss stale pull request approvals when new commits are pushed
     ✅ Require review from CODEOWNERS
     ✅ Restrict pushes that create files
   
   ✅ Require status checks to pass before merging
     ✅ Require branches to be up to date before merging
     ✅ Status checks to require:
       - "TypeScript Type Check"
       - "ESLint Code Quality" 
       - "Prettier Format Check"
       - "Build Application"
       - "Security Summary"
   
   ✅ Require conversation resolution before merging
   ✅ Require signed commits
   ✅ Restrict pushes that create files
   ✅ Do not allow bypassing the above settings
   ```

## 🌍 GitHub Environment Setup

### 1. Staging Environment
```
Name: staging
Protection Rules: None (auto-deploy)
Environment Variables: 
  - VITE_APP_ENV=staging
  - VITE_ENABLE_AI_FEATURES=true
  - VITE_ENABLE_ANALYTICS=false
```

### 2. Production Environment
```
Name: production
Protection Rules:
  ✅ Required reviewers: 1 (add specific GitHub usernames)
  ✅ Wait timer: 5 minutes
  ✅ Deployment branches: main only
Environment Variables:
  - VITE_APP_ENV=production
  - VITE_ENABLE_AI_FEATURES=true
  - VITE_ENABLE_ANALYTICS=true
```

### 3. Production Approval Environment
```
Name: production-approval
Protection Rules:
  ✅ Required reviewers: 1-2 deployment approvers
  ✅ Wait timer: 10 minutes
  ✅ Deployment branches: main only
Environment Variables: None (approval gate only)
```

## 🔧 Quick Setup Commands

### Using GitHub CLI (Recommended)
```bash
# 1. Set repository secrets
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID --body "team_CZ14eEQZUPtEY2s6xFySyxEn"
gh secret set VERCEL_PROJECT_ID --body "prj_zii8CkkLbsfY2vQIopYcukaQVTS7"
gh secret set VITE_SUPABASE_URL
gh secret set VITE_SUPABASE_ANON_KEY
gh secret set VITE_CLAUDE_API_KEY
gh secret set VITE_OPENAI_API_KEY  # Optional

# 2. Create environments
gh api repos/:owner/:repo/environments -f name=staging
gh api repos/:owner/:repo/environments -f name=production
gh api repos/:owner/:repo/environments -f name=production-approval

# 3. Add production protection rules
gh api repos/:owner/:repo/environments/production -X PUT \
  --field protection_rules='[{
    "type": "required_reviewers",
    "reviewers": [{"type": "User", "id": YOUR_GITHUB_USER_ID}]
  }, {
    "type": "wait_timer", 
    "wait_timer": 5
  }, {
    "type": "branch_policy",
    "deployment_branch_policy": {"protected_branches": true, "custom_branch_policies": false}
  }]'
```

### Manual Setup Steps

#### Secrets Configuration:
1. Go to: `https://github.com/YOUR_USERNAME/kasama-ai/settings/secrets/actions`
2. Click "New repository secret"
3. Add each secret with its corresponding value

#### Environment Configuration:
1. Go to: `https://github.com/YOUR_USERNAME/kasama-ai/settings/environments`
2. Create each environment listed above
3. Configure protection rules as specified

#### Branch Protection:
1. Go to: `https://github.com/YOUR_USERNAME/kasama-ai/settings/branches`
2. Add branch protection rule for `main`
3. Configure all protection settings as listed

## 🧪 Pipeline Testing

### 1. Test Staging Deployment
```bash
gh workflow run deploy.yml --ref main -f environment=staging
```

### 2. Test Production Deployment
```bash
gh workflow run deploy.yml --ref main -f environment=production
```

### 3. Monitor Deployment
```bash
# Watch workflow runs
gh run list --workflow=deploy.yml

# View specific run details
gh run view RUN_ID
```

## 🚨 Security Validation Checklist

### Pre-Deployment Security Checks
- [x] Secret scanning enabled
- [x] Dependency vulnerability scanning
- [x] CodeQL security analysis
- [x] License compliance checking
- [x] Risk score assessment (< 50)

### Deployment Security Controls
- [x] Environment protection rules
- [x] Manual approval gates
- [x] Deployment branch restrictions
- [x] Security header validation
- [x] Health check verification

### Post-Deployment Monitoring
- [x] Comprehensive health scoring (≥ 80)
- [x] Response time validation (< 3s)
- [x] Security header presence check
- [x] Content integrity validation
- [x] Automatic rollback capability

## 📊 Security Metrics Dashboard

### Key Performance Indicators
| Metric | Target | Current Status |
|--------|--------|----------------|
| Deployment Success Rate | ≥ 95% | 🔄 Monitoring |
| Security Risk Score | < 20 | 🔄 Baseline |
| Health Check Score | ≥ 80 | 🔄 Baseline |
| Response Time | < 3s | 🔄 Monitoring |
| Rollback Rate | < 5% | 🔄 Baseline |

## 🎯 Next Steps

1. **Immediate Actions**:
   - [ ] Configure GitHub secrets using values above
   - [ ] Set up environment protection rules
   - [ ] Enable branch protection for main branch
   - [ ] Test staging deployment

2. **Security Hardening**:
   - [ ] Enable Dependabot security updates
   - [ ] Configure CODEOWNERS file
   - [ ] Set up external monitoring
   - [ ] Implement security incident response plan

3. **Operational Excellence**:
   - [ ] Set up deployment notifications
   - [ ] Create runbooks for common scenarios
   - [ ] Establish monitoring dashboards
   - [ ] Plan regular security reviews

---

**Configuration Generated**: August 31, 2025  
**Project**: Kasama AI (https://app.kasama.ai)  
**Vercel Organization**: buehlerdev  
**Security Level**: Enterprise-Grade