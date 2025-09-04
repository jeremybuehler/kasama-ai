/**
 * Authentication Configuration for Kasama
 * Supports multiple OAuth providers through Cloudflare Access or direct OAuth
 */

export interface AuthProvider {
  name: string;
  displayName: string;
  icon: string;
  authUrl?: string;
  clientId?: string;
}

export const AUTH_PROVIDERS: AuthProvider[] = [
  {
    name: 'google',
    displayName: 'Google',
    icon: 'google',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  },
  {
    name: 'apple',
    displayName: 'Apple',
    icon: 'apple',
    clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
  },
  {
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: 'microsoft',
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
  },
  {
    name: 'github',
    displayName: 'GitHub',
    icon: 'github',
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
  },
];

export const AUTH_CONFIG = {
  // Cloudflare Access configuration
  cloudflareAccessDomain: import.meta.env.VITE_CLOUDFLARE_ACCESS_DOMAIN,
  cloudflareTeamDomain: import.meta.env.VITE_CLOUDFLARE_TEAM_DOMAIN,
  
  // OAuth redirect URIs
  redirectUri: import.meta.env.VITE_AUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  postLoginRedirect: '/dashboard',
  postLogoutRedirect: '/login',
  
  // Session configuration
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  refreshThreshold: 5 * 60 * 1000, // Refresh token 5 minutes before expiry
  
  // Feature flags
  enableGoogleAuth: import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== 'false',
  enableAppleAuth: import.meta.env.VITE_ENABLE_APPLE_AUTH !== 'false',
  enableMicrosoftAuth: import.meta.env.VITE_ENABLE_MICROSOFT_AUTH !== 'false',
  enableGitHubAuth: import.meta.env.VITE_ENABLE_GITHUB_AUTH !== 'false',
};

// Helper to get enabled providers
export const getEnabledProviders = (): AuthProvider[] => {
  return AUTH_PROVIDERS.filter(provider => {
    switch (provider.name) {
      case 'google':
        return AUTH_CONFIG.enableGoogleAuth && provider.clientId;
      case 'apple':
        return AUTH_CONFIG.enableAppleAuth && provider.clientId;
      case 'microsoft':
        return AUTH_CONFIG.enableMicrosoftAuth && provider.clientId;
      case 'github':
        return AUTH_CONFIG.enableGitHubAuth && provider.clientId;
      default:
        return false;
    }
  });
};
