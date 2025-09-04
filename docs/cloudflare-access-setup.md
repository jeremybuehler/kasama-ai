# Cloudflare Access Setup Guide for Kasama AI

This guide will walk you through setting up Cloudflare Access to handle all authentication for your Kasama app.

## Benefits of Cloudflare Access

- **Single Platform**: All OAuth providers (Google, Microsoft, GitHub, Apple, etc.) managed in one place
- **No Backend Required**: Authentication handled entirely by Cloudflare's edge network
- **Zero Trust Security**: Built-in security features like device posture checks, location-based access
- **Free Tier**: Up to 50 users free
- **Seamless Integration**: Works perfectly with Cloudflare Pages deployment

## Step 1: Enable Cloudflare Zero Trust

1. Log in to your Cloudflare Dashboard
2. Select your domain (kasama.ai or your domain)
3. In the left sidebar, click on "Zero Trust"
4. If not already enabled, click "Enable Zero Trust" (free for up to 50 users)

## Step 2: Configure Your Team Domain

1. In Zero Trust dashboard, go to **Settings → General**
2. Set your team name (e.g., "kasama")
   - This creates your team domain: `kasama.cloudflareaccess.com`
3. Note this domain - you'll need it for the app configuration

## Step 3: Add Identity Providers

Navigate to **Settings → Authentication → Login methods**

### Add Google OAuth:
1. Click "Add new" → Select "Google"
2. Follow Google's OAuth setup:
   - Create OAuth credentials in Google Cloud Console
   - Add redirect URL: `https://[your-team].cloudflareaccess.com/cdn-cgi/access/callback`
3. Enter Client ID and Client Secret in Cloudflare

### Add Microsoft (Azure AD):
1. Click "Add new" → Select "Azure AD"
2. Register app in Azure Portal
3. Enter Application ID, Directory ID, and Client Secret

### Add GitHub:
1. Click "Add new" → Select "GitHub"
2. Create OAuth App in GitHub Settings
3. Enter Client ID and Client Secret

### Add Apple Sign In:
1. Click "Add new" → Select "OpenID Connect" (for Apple)
2. Configure with Apple's Sign In settings
3. Enter required credentials

## Step 4: Create Access Application

1. Go to **Access → Applications**
2. Click "Add an application"
3. Choose "Self-hosted" application type
4. Configure the application:

```
Application name: Kasama AI
Session duration: 24 hours (or your preference)
Application domain: kasama.pages.dev (or your custom domain)
```

5. Configure Access Policies:

```
Policy name: Allow All Users
Action: Allow
Include:
  - Emails ending in: @yourdomain.com (optional)
  - Everyone (if you want open registration)
```

6. After creation, copy the **Audience (AUD) tag** - you'll need this

## Step 5: Configure CORS and Headers

In your Cloudflare Pages settings:

1. Go to your Pages project settings
2. Add these environment variables:

```
VITE_CF_ACCESS_DOMAIN=kasama  # Your team name
VITE_CF_ACCESS_AUD=<your-aud-tag>  # From step 4
```

3. Create a `_headers` file in your public directory:

```
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Credentials: true
```

## Step 6: Update Your React App

The Cloudflare Access integration is already created in `src/lib/cloudflare-access.ts`.

### Update your main App component:

```tsx
// src/App.tsx
import { useCloudflareAuth } from './lib/cloudflare-access';

function App() {
  const { user, isAuthenticated, isLoading, login, logout } = useCloudflareAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Welcome to Kasama AI</h1>
        <button onClick={() => login()}>Sign In with Cloudflare Access</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.name || user?.email}!</h1>
      <button onClick={logout}>Sign Out</button>
      {/* Your app content */}
    </div>
  );
}
```

## Step 7: Test Your Setup

1. Deploy your app to Cloudflare Pages:
```bash
npm run build
npx wrangler pages publish dist
```

2. Visit your app URL
3. You should be redirected to Cloudflare Access login
4. Choose your preferred identity provider
5. After authentication, you'll be redirected back to your app

## Step 8: Advanced Configuration (Optional)

### Add Multi-Factor Authentication:
1. Go to **Settings → Authentication → Multi-factor**
2. Enable TOTP, WebAuthn, or other methods

### Add Device Posture Checks:
1. Go to **Settings → WARP Client**
2. Configure device requirements (OS version, firewall, etc.)

### Add Location-Based Access:
1. In your Access Policy, add "Require" rules
2. Add country or IP range restrictions

### Session Management:
1. Configure session timeout
2. Enable "Revoke user sessions" for immediate logout

## Environment Variables Summary

Add these to your `.env.local` file for local development:

```env
VITE_CF_ACCESS_DOMAIN=kasama
VITE_CF_ACCESS_AUD=your-audience-tag-here
```

## Troubleshooting

### "Unauthorized" errors:
- Check that your domain is correctly configured in Access Application
- Verify the AUD tag matches

### Login redirect loops:
- Ensure cookies are enabled
- Check that your domain allows third-party cookies from cloudflareaccess.com

### User info not showing:
- The `/cdn-cgi/access/get-identity` endpoint requires valid CF_Authorization cookie
- Check browser developer tools for cookie presence

## Next Steps

1. Customize the login page appearance in Cloudflare Zero Trust
2. Add custom claims and user groups
3. Integrate with your existing user database if needed
4. Set up webhook notifications for login events

## Support Resources

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [Cloudflare Community](https://community.cloudflare.com/)

## Costs

- **Free**: Up to 50 users
- **$3/user/month**: For more than 50 users
- Includes all identity providers, no per-provider charges
