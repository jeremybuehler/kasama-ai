# 🚀 Cloudflare Pages Quick Start Guide

## ✅ Current Status
Your project is **READY** for Cloudflare Pages deployment! All required configurations have been created.

## 📋 Pre-flight Checklist
- [x] **Headers configuration** (`public/_headers`) - Security & caching headers configured
- [x] **Redirects configuration** (`public/_redirects`) - SPA routing configured
- [x] **GitHub Actions workflow** (`.github/workflows/deploy-cloudflare.yml`) - CI/CD pipeline ready
- [x] **Cloudflare config** (`.cloudflare/pages.json`) - Build settings defined
- [x] **Verification script** - Run `node scripts/verify-cloudflare-deployment.js` to check readiness
- [x] **Secrets setup script** - Run `node scripts/setup-cloudflare-secrets.js` to configure GitHub secrets

## 🔧 Step-by-Step Migration

### Step 1: Set up GitHub Secrets (5 minutes)
```bash
# Run the interactive setup script
node scripts/setup-cloudflare-secrets.js
```

Or manually add these secrets at: https://github.com/[your-username]/kasama-ai/settings/secrets/actions
- `CLOUDFLARE_API_TOKEN` - Create at https://dash.cloudflare.com/profile/api-tokens
- `CLOUDFLARE_ACCOUNT_ID` - Find in Cloudflare Dashboard sidebar
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Step 2: Create Cloudflare Pages Project (10 minutes)
1. Go to https://dash.cloudflare.com/pages
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub account and authorize Cloudflare
4. Choose the `kasama-ai` repository
5. Configure build settings:
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```
6. Add environment variables (same as GitHub secrets above)
7. Click **Save and Deploy**

### Step 3: Test Deployment (5 minutes)
1. Wait for initial build to complete (~2-3 minutes)
2. Visit the preview URL: `https://kasama-ai.pages.dev`
3. Test key features:
   - [ ] Home page loads
   - [ ] Navigation works
   - [ ] Supabase connection works
   - [ ] Assets load correctly

### Step 4: Configure Custom Domain (Optional)
1. In Cloudflare Pages → **Custom domains** → **Set up a custom domain**
2. Enter your domain (e.g., `kasama.ai`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (~10 minutes)

### Step 5: Clean Up Vercel (After successful migration)
```bash
# Remove Vercel configuration files
rm vercel.json .vercelignore

# Update GitHub to trigger new deployment
git add -A
git commit -m "chore: migrate from Vercel to Cloudflare Pages"
git push origin main
```

## 🎯 Quick Commands

```bash
# Verify deployment readiness
node scripts/verify-cloudflare-deployment.js

# Set up GitHub secrets
node scripts/setup-cloudflare-secrets.js

# Test build locally
npm run build

# Check build output
ls -la dist/
```

## 📊 Migration Benefits

| Feature | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| **Free Bandwidth** | 100 GB/month | Unlimited |
| **Edge Locations** | ~20 | 275+ |
| **Build Minutes** | 6,000/month | 500 builds/month |
| **DDoS Protection** | Basic | Enterprise-grade |
| **Cost** | $0-20/month | $0 |

## 🆘 Troubleshooting

### Build Fails
- Check Node version (should be 18)
- Verify all environment variables are set
- Check build logs for specific errors

### Site Not Loading
- Verify `_redirects` file exists in `public/`
- Check that build output is in `dist/`
- Ensure `index.html` exists in build output

### Environment Variables Not Working
- Variables must be prefixed with `VITE_` to be accessible in the app
- Set variables in both GitHub Secrets AND Cloudflare Pages dashboard
- Rebuild after adding new variables

### Domain Not Working
- DNS propagation can take up to 48 hours
- Verify CNAME record points to `kasama-ai.pages.dev`
- Check SSL certificate status in Cloudflare dashboard

## 📚 Resources
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite + Cloudflare Guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite-site/)
- [GitHub Actions + Cloudflare](https://github.com/cloudflare/pages-action)

## ✨ Next Steps After Migration
1. **Enable Cloudflare Analytics** (free web analytics)
2. **Set up Page Rules** for advanced caching
3. **Configure Web Workers** for API proxying (if needed)
4. **Enable Email Routing** for custom email addresses
5. **Set up Cloudflare Tunnels** for secure backend connections

---

**Ready to deploy?** Start with Step 1 above! The entire migration should take less than 30 minutes.

*Need help?* Check the [full deployment plan](./CLOUDFLARE_DEPLOYMENT_PLAN.md) for detailed instructions.
