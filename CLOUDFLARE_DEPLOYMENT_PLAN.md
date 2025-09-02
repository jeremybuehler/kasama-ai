# Cloudflare Pages Deployment Plan for Kasama AI

## Executive Summary
This document outlines the migration plan from Vercel to Cloudflare Pages for the Kasama AI React/Vite application. The migration will maintain all current functionality while leveraging Cloudflare's global edge network for improved performance and reduced costs.

## Current State Analysis

### Application Stack
- **Framework**: React 18.2 with Vite 5.4
- **Build Tool**: Vite with TypeScript
- **State Management**: Zustand + Redux Toolkit
- **Backend**: Supabase (external service)
- **Current Hosting**: Vercel
- **Output Directory**: `dist`

### Current Build Configuration
```json
// From vercel.json
{
  "buildCommand": "npm run build:skip-validation",
  "outputDirectory": "dist",
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
```

### Required Environment Variables
```bash
# Critical (Required for build)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Optional (With defaults)
VITE_APP_NAME="Kasama AI"
VITE_APP_ENV="production"
VITE_ENABLE_AI_FEATURES="true"
VITE_ENABLE_OFFLINE_MODE="true"
VITE_ENABLE_ANALYTICS="true"
VITE_ENABLE_ERROR_TRACKING="true"
VITE_API_TIMEOUT="30000"
VITE_API_RETRY_ATTEMPTS="3"
VITE_CACHE_TTL="3600000"
VITE_CACHE_ENABLED="true"
```

## Cloudflare Pages Configuration

### 1. Initial Setup

#### Create Cloudflare Pages Project
1. Log into Cloudflare Dashboard
2. Navigate to **Pages** → **Create a project**
3. Connect to GitHub repository: `kasama-ai`
4. Select production branch: `main`

#### Build Configuration
```yaml
Framework preset: None (Custom)
Build command: npm run build
Build output directory: dist
Root directory: /
Environment variables: (See section 2)
```

### 2. Environment Variables Setup

Add the following in Cloudflare Pages **Settings** → **Environment variables**:

```bash
# Production Environment
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_APP_ENV=production
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
VITE_CACHE_TTL=3600000
VITE_CACHE_ENABLED=true

# Preview Environment (different values for staging)
VITE_APP_ENV=preview
VITE_ENABLE_ANALYTICS=false
```

### 3. Headers Configuration

Create `/public/_headers` file:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: origin-when-cross-origin
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.woff
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable
```

### 4. Redirects Configuration

Create `/public/_redirects` file:
```
# SPA fallback
/*    /index.html   200
```

### 5. GitHub Actions Updates

Update `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: kasama-ai
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          deployment-branch: ${{ github.ref_name }}
```

### 6. Required Secrets for GitHub Actions

Add to GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN` - Create at https://dash.cloudflare.com/profile/api-tokens
- `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare dashboard
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## Migration Steps

### Phase 1: Preparation (Day 1)
- [ ] Create Cloudflare account if needed
- [ ] Verify GitHub repository access
- [ ] Document all current environment variables from Vercel
- [ ] Create `_headers` and `_redirects` files locally
- [ ] Test build locally with `npm run build`

### Phase 2: Cloudflare Setup (Day 2)
- [ ] Create Cloudflare Pages project
- [ ] Configure build settings
- [ ] Add all environment variables
- [ ] Configure preview deployments for PRs
- [ ] Test initial deployment on `.pages.dev` domain

### Phase 3: Testing (Day 3-4)
- [ ] Verify all pages load correctly
- [ ] Test authentication flows with Supabase
- [ ] Check all API integrations
- [ ] Verify asset loading and caching
- [ ] Test preview deployments from PRs
- [ ] Performance testing and comparison with Vercel

### Phase 4: Domain Migration (Day 5)
- [ ] Add custom domain in Cloudflare Pages
- [ ] Update DNS records
- [ ] Configure SSL/TLS settings
- [ ] Test domain configuration
- [ ] Monitor for DNS propagation

### Phase 5: Cleanup (Day 6)
- [ ] Update README.md documentation
- [ ] Update team documentation
- [ ] Remove `vercel.json` and `.vercelignore`
- [ ] Update GitHub Actions workflows
- [ ] Archive Vercel project
- [ ] Revoke Vercel API tokens

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: DNS can be pointed back to Vercel within minutes
2. **Keep Vercel Active**: Maintain Vercel deployment for 30 days post-migration
3. **Backup Environment Variables**: Export all env vars before migration
4. **Git Tags**: Tag the repository at migration point for easy rollback

## Performance Optimizations

### Cloudflare-Specific Optimizations
1. **Enable Auto Minify**: HTML, CSS, JavaScript
2. **Enable Brotli Compression**: Better than gzip
3. **Configure Page Rules**: For specific paths if needed
4. **Enable Cloudflare Analytics**: Free web analytics
5. **Consider Cloudflare Workers**: For API proxying if needed

### Build Optimizations
```javascript
// vite.config.mjs additions for Cloudflare
export default defineConfig({
  build: {
    // Optimize for Cloudflare's edge
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

## Cost Comparison

| Service | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| Free Tier Builds | 6,000 min/month | 500 builds/month |
| Free Bandwidth | 100 GB | Unlimited |
| Preview Deployments | Unlimited | Unlimited |
| Custom Domains | Unlimited | Unlimited |
| Edge Locations | 20+ | 275+ |
| Estimated Monthly Cost | $0-20 | $0 |

## Monitoring & Alerts

### Cloudflare Analytics
- Enable Web Analytics (free)
- Set up Real User Monitoring (RUM)
- Configure alert policies for errors

### GitHub Integration
- Automatic deployment status comments on PRs
- Build failure notifications
- Deployment preview links

## Security Considerations

1. **API Token Security**: Use fine-grained API tokens with minimal permissions
2. **Environment Variables**: Never commit sensitive data to repository
3. **Branch Protection**: Ensure main branch is protected
4. **Preview Deployments**: Use different env vars for preview vs production
5. **DDoS Protection**: Automatic with Cloudflare

## Success Criteria

- [ ] Zero downtime during migration
- [ ] All functionality works as before
- [ ] Page load time ≤ current performance
- [ ] Successful preview deployments for PRs
- [ ] Team can deploy without issues
- [ ] Documentation is updated

## Support Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite-site/)
- [Migration Guide](https://developers.cloudflare.com/pages/migrations/migrating-from-vercel/)
- [Cloudflare Discord](https://discord.cloudflare.com)

## Timeline

**Total Duration**: 6 days
- **Day 1**: Preparation and planning
- **Day 2**: Cloudflare setup
- **Day 3-4**: Testing and validation
- **Day 5**: Domain migration
- **Day 6**: Documentation and cleanup

## Approval & Sign-off

- [ ] Engineering Lead
- [ ] DevOps Team
- [ ] Product Manager
- [ ] Security Review

---

*Document created: January 2025*
*Last updated: January 2025*
*Version: 1.0*
