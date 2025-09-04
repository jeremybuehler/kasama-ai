/**
 * Cloudflare Access Authentication
 * Unified authentication through Cloudflare Zero Trust
 * 
 * This handles all OAuth providers through a single platform
 */

import React from 'react';

export interface CloudflareUser {
  email: string;
  name?: string;
  id: string;
  groups?: string[];
  idp?: {
    id: string;
    type: string;
  };
}

export interface CloudflareSession {
  user: CloudflareUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

class CloudflareAccessAuth {
  private static instance: CloudflareAccessAuth;
  private session: CloudflareSession = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  };
  private listeners: Set<(session: CloudflareSession) => void> = new Set();
  
  // Your Cloudflare Access configuration
  private config = {
    // Your team domain from Cloudflare Zero Trust dashboard
    teamDomain: import.meta.env.VITE_CF_ACCESS_DOMAIN || 'kasama',
    // The application audience (AUD) tag from your Access application
    audienceTag: import.meta.env.VITE_CF_ACCESS_AUD || '',
  };

  private constructor() {
    this.initializeSession();
  }

  static getInstance(): CloudflareAccessAuth {
    if (!CloudflareAccessAuth.instance) {
      CloudflareAccessAuth.instance = new CloudflareAccessAuth();
    }
    return CloudflareAccessAuth.instance;
  }

  /**
   * Initialize session by checking Cloudflare Access JWT
   */
  private async initializeSession() {
    this.updateSession({ isLoading: true });

    try {
      // Check if we have a CF Access JWT
      const jwt = this.getCFAccessJWT();
      
      if (jwt) {
        // Validate the JWT with Cloudflare
        const user = await this.validateSession(jwt);
        if (user) {
          this.updateSession({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }

      // No valid session
      this.updateSession({ isLoading: false });
    } catch (error) {
      console.error('Failed to initialize Cloudflare Access session:', error);
      this.updateSession({ isLoading: false, error: 'Failed to restore session' });
    }
  }

  /**
   * Get Cloudflare Access JWT from cookie
   */
  private getCFAccessJWT(): string | null {
    const name = `CF_Authorization`;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }

  /**
   * Validate session with Cloudflare Access
   */
  private async validateSession(jwt: string): Promise<CloudflareUser | null> {
    try {
      // Call the identity endpoint to get user info
      const response = await fetch(`/cdn-cgi/access/get-identity`, {
        headers: {
          'Cookie': document.cookie,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      return {
        email: data.email,
        name: data.name,
        id: data.user_uuid || data.email,
        groups: data.groups,
        idp: data.idp,
      };
    } catch (error) {
      console.error('Failed to validate session:', error);
      return null;
    }
  }

  /**
   * Login - Redirect to Cloudflare Access login page
   */
  async login(returnUrl?: string): Promise<void> {
    const appDomain = window.location.origin;
    const loginUrl = `https://${this.config.teamDomain}.cloudflareaccess.com/cdn-cgi/access/login/${appDomain}`;
    
    if (returnUrl) {
      sessionStorage.setItem('cf_access_return_url', returnUrl);
    }
    
    window.location.href = loginUrl;
  }

  /**
   * Logout from Cloudflare Access
   */
  async logout(): Promise<void> {
    try {
      // Call Cloudflare Access logout endpoint
      const response = await fetch('/cdn-cgi/access/logout', {
        method: 'GET',
      });

      if (response.ok) {
        // Clear local session
        this.updateSession({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout anyway
      this.updateSession({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      window.location.href = '/login';
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.session.isAuthenticated;
  }

  /**
   * Get current user
   */
  getUser(): CloudflareUser | null {
    return this.session.user;
  }

  /**
   * Get current session
   */
  getSession(): CloudflareSession {
    return this.session;
  }

  /**
   * Update session and notify listeners
   */
  private updateSession(updates: Partial<CloudflareSession>): void {
    this.session = { ...this.session, ...updates };
    this.notifyListeners();
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: CloudflareSession) => void): () => void {
    this.listeners.add(listener);
    listener(this.session); // Call immediately with current session
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.session));
  }
}

// Export singleton instance
export const cfAuth = CloudflareAccessAuth.getInstance();

// React hook for Cloudflare Access
export function useCloudflareAuth() {
  const [session, setSession] = React.useState<CloudflareSession>(
    cfAuth.getSession()
  );

  React.useEffect(() => {
    const unsubscribe = cfAuth.subscribe(setSession);
    return unsubscribe;
  }, []);

  return {
    user: session.user,
    isAuthenticated: session.isAuthenticated,
    isLoading: session.isLoading,
    error: session.error,
    login: cfAuth.login.bind(cfAuth),
    logout: cfAuth.logout.bind(cfAuth),
  };
}
