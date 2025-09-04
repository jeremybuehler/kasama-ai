import { useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCloudflareAuth as useCFAuth } from "../lib/cloudflare-access";
import {
  useAppStore,
  useUser,
  useAuthLoading,
  useAppActions,
} from "../lib/store";
import { User } from "../lib/types";

/**
 * Enhanced auth hook that integrates Cloudflare Access with existing app state
 * This replaces the old useAuth hook with Cloudflare Access authentication
 */
export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const storeUser = useUser();
  const authLoading = useAuthLoading();
  const { setUser, setAuthLoading, addNotification } = useAppActions();
  
  // Get Cloudflare Access auth state
  const {
    user: cfUser,
    isAuthenticated: cfIsAuthenticated,
    isLoading: cfIsLoading,
    error: cfError,
    login: cfLogin,
    logout: cfLogout,
  } = useCFAuth();

  // Sync Cloudflare user with app store
  useEffect(() => {
    if (cfUser && !storeUser) {
      // Convert Cloudflare user to app user format
      const appUser: User = {
        id: cfUser.id,
        email: cfUser.email,
        user_metadata: {
          name: cfUser.name,
          avatar_url: undefined,
          display_name: cfUser.name || cfUser.email.split('@')[0],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUser(appUser);
      addNotification({
        title: "Welcome back!",
        message: `Signed in as ${cfUser.email}`,
        type: "success",
        read: false,
        userId: cfUser.id,
      });
    } else if (!cfUser && storeUser) {
      // User logged out
      setUser(null);
      // Clear sensitive data
      useAppStore.getState().setAssessments([]);
      useAppStore.getState().setGoals([]);
      useAppStore.getState().setProgress([]);
    }
  }, [cfUser, storeUser, setUser, addNotification]);

  // Sync loading states
  useEffect(() => {
    setAuthLoading(cfIsLoading);
  }, [cfIsLoading, setAuthLoading]);

  // Handle auth errors
  useEffect(() => {
    if (cfError) {
      addNotification({
        title: "Authentication Error",
        message: cfError,
        type: "error",
        read: false,
        userId: "anonymous",
      });
    }
  }, [cfError, addNotification]);

  // Login method
  const login = useCallback(
    async (email?: string, password?: string) => {
      // Cloudflare Access doesn't use email/password directly
      // It redirects to the identity provider
      const returnUrl = location.state?.from || '/dashboard';
      await cfLogin(returnUrl);
      return { data: null, error: null };
    },
    [cfLogin, location]
  );

  // Signup method (redirects to login with Cloudflare Access)
  const signup = useCallback(
    async (email?: string, password?: string, metadata?: any) => {
      // With Cloudflare Access, signup is handled by the identity provider
      const returnUrl = '/onboarding';
      await cfLogin(returnUrl);
      return { data: null, error: null };
    },
    [cfLogin]
  );

  // Logout method
  const logout = useCallback(async () => {
    try {
      await cfLogout();
      addNotification({
        title: "Signed Out",
        message: "You have been successfully signed out.",
        type: "info",
        read: false,
        userId: "anonymous",
      });
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [cfLogout, addNotification]);

  // Reset password (not applicable with Cloudflare Access)
  const resetPassword = useCallback(
    async (email: string, redirectTo?: string) => {
      addNotification({
        title: "Password Reset",
        message: "Password reset is managed through your identity provider.",
        type: "info",
        read: false,
        userId: "anonymous",
      });
      return { error: null };
    },
    [addNotification]
  );

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<User["user_metadata"]>) => {
      if (!storeUser) return { data: null, error: new Error("Not authenticated") };
      
      // Update local store
      const updatedUser = {
        ...storeUser,
        user_metadata: {
          ...storeUser.user_metadata,
          ...updates,
        },
        updated_at: new Date().toISOString(),
      };
      
      setUser(updatedUser);
      
      addNotification({
        title: "Profile Updated",
        message: "Your profile has been successfully updated.",
        type: "success",
        read: false,
        userId: storeUser.id,
      });
      
      // TODO: Sync with backend if needed
      return { data: updatedUser, error: null };
    },
    [storeUser, setUser, addNotification]
  );

  // Refresh session (handled automatically by Cloudflare Access)
  const refresh = useCallback(async () => {
    // Cloudflare Access handles session refresh automatically
    return { data: storeUser, error: null };
  }, [storeUser]);

  // Auth state helpers
  const isAuthenticated = useMemo(() => cfIsAuthenticated && !!storeUser, [cfIsAuthenticated, storeUser]);
  const isLoading = useMemo(() => cfIsLoading || authLoading, [cfIsLoading, authLoading]);

  // Navigation helpers
  const requireAuth = useCallback(
    (redirectTo: string = "/login") => {
      if (!isLoading && !isAuthenticated) {
        navigate(redirectTo, { 
          replace: true,
          state: { from: location.pathname }
        });
        return false;
      }
      return true;
    },
    [isAuthenticated, isLoading, navigate, location]
  );

  const redirectIfAuthenticated = useCallback(
    (redirectTo: string = "/dashboard") => {
      if (!isLoading && isAuthenticated) {
        const from = location.state?.from || redirectTo;
        navigate(from, { replace: true });
        return true;
      }
      return false;
    },
    [isAuthenticated, isLoading, navigate, location]
  );

  // Check for return URL after authentication
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const returnUrl = sessionStorage.getItem('cf_access_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('cf_access_return_url');
        navigate(returnUrl, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return {
    // State
    user: storeUser,
    isAuthenticated,
    loading: isLoading,

    // Methods
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
    refresh,

    // Backwards compatibility aliases
    signIn: login,
    signUp: signup,
    signOut: logout,

    // Navigation helpers
    requireAuth,
    redirectIfAuthenticated,

    // Loading states
    loginLoading: cfIsLoading,
    signupLoading: false,
    logoutLoading: false,
    resetPasswordLoading: false,
    updateProfileLoading: false,

    // Cloudflare-specific data
    cloudflareUser: cfUser,
    identityProvider: cfUser?.idp,
  };
}

// Hook for requiring authentication
export function useRequireAuth(redirectTo: string = "/login") {
  const { user, loading, requireAuth } = useAuth();

  useEffect(() => {
    if (!loading) {
      requireAuth(redirectTo);
    }
  }, [user, loading, requireAuth, redirectTo]);

  return { user, loading, isAuthenticated: !!user };
}

// Hook for redirecting authenticated users
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const { user, loading, redirectIfAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      redirectIfAuthenticated(redirectTo);
    }
  }, [user, loading, redirectIfAuthenticated, redirectTo]);

  return { user, loading, isAuthenticated: !!user };
}
