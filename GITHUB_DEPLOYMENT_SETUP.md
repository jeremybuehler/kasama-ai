# GitHub to Vercel Automated Deployment Setup

## Overview
This guide sets up automated deployment from GitHub to Vercel for the Kasama AI project using GitHub Actions.

## GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and Variables → Actions, and add these repository secrets:

### Required Secrets

1. **VERCEL_TOKEN**
   - Go to [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens)
   - Create a new token with scope: Full Account
   - Copy the token value

2. **VERCEL_ORG_ID** 
   ```
   buehlerdev
   ```

3. **VERCEL_PROJECT_ID**
   ```
   prj_zii8CkkLbsfY2vQIopYcukaQVTS7
   ```

## Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) includes:

### Jobs

1. **Deploy-Preview**: Runs on pull requests
   - Builds the application 
   - Deploys to Vercel preview environment
   - Uses preview environment variables

2. **Deploy-Production**: Runs on push to main branch
   - Runs security audit
   - Builds the application
   - Deploys to Vercel production
   - Runs health check post-deployment

3. **Security-Scan**: Runs on all pushes/PRs
   - npm audit for vulnerabilities
   - Checks for sensitive files
   - Security validation

### Environment Variables

The workflow includes these build-time environment variables:

**Production:**
- `VITE_APP_NAME`: "Kasama AI"
- `VITE_APP_ENV`: "production"
- `VITE_ENABLE_AI_FEATURES`: "true"
- `VITE_ENABLE_ANALYTICS`: "true"

**Preview:**
- Same as production but `VITE_ENABLE_ANALYTICS`: "false"

## Security Features

- **Audit Scanning**: npm audit on all deployments
- **Sensitive File Detection**: Automated scanning for keys/secrets
- **Health Checks**: Post-deployment validation
- **Branch Protection**: Production deploys only from main branch

## Usage

Once configured:

1. **For Production Deployment:**
   ```bash
   git add .
   git commit -m "Deploy: Add new feature"
   git push origin main
   ```
   → Automatically deploys to https://app.kasama.ai

2. **For Preview Deployment:**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR → Automatically creates preview deployment
   ```

## Vercel Project Configuration

Current Vercel project settings:
- **Project ID**: prj_zii8CkkLbsfY2vQIopYcukaQVTS7
- **Organization**: buehlerdev  
- **Framework**: Vite
- **Node Version**: 22.x
- **Build Command**: npm run build:skip-validation
- **Output Directory**: dist

## Domain Configuration

- **Production**: https://app.kasama.ai
- **Preview**: Dynamic URLs for each PR

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that `npm run build:skip-validation` works locally
2. **Vercel Token Issues**: Ensure token has Full Account scope
3. **Environment Variables**: Verify all secrets are set in GitHub

### Logs

- **GitHub Actions**: Repository → Actions tab
- **Vercel Deployments**: [Vercel Dashboard](https://vercel.com/buehlerdev/kasama-ai)

## Next Steps

1. Set up the GitHub secrets listed above
2. Commit and push this setup to main branch
3. Verify automated deployment works
4. Configure additional environment variables as needed (Supabase keys, etc.)

---

*This automated deployment replaces manual `vercel deploy` commands and ensures consistent, secure deployments.*