/**
 * OAuth Authentication Client for Kasama
 * Handles social login with Google, Apple, Microsoft, GitHub, etc.
 */

import { AUTH_CONFIG, AuthProvider } from './auth-config';

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

class AuthClient {
  private static instance: AuthClient;
  private session: AuthSession = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  };
  private listeners: Set<(session: AuthSession) => void> = new Set();

  private constructor() {
    this.initializeSession();
  }

  static getInstance(): AuthClient {
    if (!AuthClient.instance) {
      AuthClient.instance = new AuthClient();
    }
    return AuthClient.instance;
  }

  // Initialize session from localStorage
  private async initializeSession() {
    this.updateSession({ isLoading: true });

    try {
      const storedSession = localStorage.getItem('kasama_auth_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        
        // Check if session is still valid
        if (sessionData.expiresAt && sessionData.expiresAt > Date.now()) {
          this.updateSession({
            user: sessionData.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Session expired, try to refresh
          await this.refreshSession();
        }
      } else {
        this.updateSession({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      this.updateSession({ isLoading: false, error: 'Failed to restore session' });
    }
  }

  // OAuth login with provider
  async loginWithProvider(provider: AuthProvider): Promise<void> {
    this.updateSession({ isLoading: true });

    try {
      const authUrl = this.buildAuthUrl(provider);
      
      // Store provider in session storage for callback
      sessionStorage.setItem('kasama_auth_provider', provider.name);
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Failed to login with ${provider.name}:`, error);
      this.updateSession({ 
        isLoading: false, 
        error: `Failed to login with ${provider.displayName}` 
      });
    }
  }

  // Build OAuth URL based on provider
  private buildAuthUrl(provider: AuthProvider): string {
    const params = new URLSearchParams({
      client_id: provider.clientId || '',
      redirect_uri: AUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: this.getProviderScope(provider.name),
      state: this.generateState(),
    });

    switch (provider.name) {
      case 'google':
        return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      
      case 'apple':
        params.append('response_mode', 'form_post');
        return `https://appleid.apple.com/auth/authorize?${params}`;
      
      case 'microsoft':
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
      
      case 'github':
        return `https://github.com/login/oauth/authorize?${params}`;
      
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }

  // Get OAuth scope for provider
  private getProviderScope(provider: string): string {
    switch (provider) {
      case 'google':
        return 'openid email profile';
      case 'apple':
        return 'name email';
      case 'microsoft':
        return 'openid email profile User.Read';
      case 'github':
        return 'read:user user:email';
      default:
        return 'openid email profile';
    }
  }

  // Generate state for OAuth security
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const state = btoa(String.fromCharCode.apply(null, Array.from(array)));
    sessionStorage.setItem('kasama_auth_state', state);
    return state;
  }

  // Handle OAuth callback
  async handleCallback(code: string, state: string): Promise<void> {
    this.updateSession({ isLoading: true });

    try {
      // Verify state
      const storedState = sessionStorage.getItem('kasama_auth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      const provider = sessionStorage.getItem('kasama_auth_provider');
      if (!provider) {
        throw new Error('No provider found in session');
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, provider);
      
      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token, provider);
      
      // Create user session
      const user: User = {
        id: userInfo.id || userInfo.sub || userInfo.email,
        email: userInfo.email,
        name: userInfo.name || userInfo.given_name,
        picture: userInfo.picture || userInfo.avatar_url,
        provider,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
      };

      // Save session
      this.saveSession(user);
      
      // Clean up session storage
      sessionStorage.removeItem('kasama_auth_state');
      sessionStorage.removeItem('kasama_auth_provider');

      this.updateSession({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Redirect to dashboard
      window.location.href = AUTH_CONFIG.postLoginRedirect;
    } catch (error) {
      console.error('Failed to handle callback:', error);
      this.updateSession({ 
        isLoading: false, 
        error: 'Authentication failed' 
      });
    }
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string, provider: string): Promise<any> {
    // This would typically call your backend API to exchange the code
    // For now, we'll use a placeholder
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, provider }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  // Get user info from provider
  private async getUserInfo(accessToken: string, provider: string): Promise<any> {
    let url: string;
    
    switch (provider) {
      case 'google':
        url = 'https://www.googleapis.com/oauth2/v2/userinfo';
        break;
      case 'microsoft':
        url = 'https://graph.microsoft.com/v1.0/me';
        break;
      case 'github':
        url = 'https://api.github.com/user';
        break;
      default:
        // For providers like Apple, user info comes with the token
        return {};
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  // Save session to localStorage
  private saveSession(user: User): void {
    const sessionData = {
      user,
      expiresAt: user.expiresAt || Date.now() + AUTH_CONFIG.sessionDuration,
    };
    localStorage.setItem('kasama_auth_session', JSON.stringify(sessionData));
  }

  // Clear session
  private clearSession(): void {
    localStorage.removeItem('kasama_auth_session');
    sessionStorage.removeItem('kasama_auth_state');
    sessionStorage.removeItem('kasama_auth_provider');
  }

  // Refresh session
  async refreshSession(): Promise<void> {
    // This would typically call your backend to refresh the token
    // For now, we'll just clear the session
    this.logout();
  }

  // Logout
  async logout(): Promise<void> {
    this.clearSession();
    this.updateSession({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    window.location.href = AUTH_CONFIG.postLogoutRedirect;
  }

  // Update session and notify listeners
  private updateSession(updates: Partial<AuthSession>): void {
    this.session = { ...this.session, ...updates };
    this.notifyListeners();
  }

  // Subscribe to session changes
  subscribe(listener: (session: AuthSession) => void): () => void {
    this.listeners.add(listener);
    listener(this.session); // Call immediately with current session
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.session));
  }

  // Get current session
  getSession(): AuthSession {
    return this.session;
  }
}

export const authClient = AuthClient.getInstance();
