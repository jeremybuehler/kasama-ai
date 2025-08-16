import { useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";
import {
  useAppStore,
  useUser,
  useAuthLoading,
  useAppActions,
} from "../lib/store";
import { User } from "../lib/types";
import { useMutation } from "./useApi";

// Enhanced auth hook with Zustand integration
export function useAuth() {
  const navigate = useNavigate();
  const user = useUser();
  const authLoading = useAuthLoading();
  const { setUser, setAuthLoading, addNotification } = useAppActions();

  // Login mutation
  const {
    mutate: loginMutate,
    mutateAsync: loginAsync,
    loading: loginLoading,
  } = useMutation(
    ({ email, password }: { email: string; password: string }) =>
      authApi.signIn(email, password),
    {
      onSuccess: (data) => {
        if (data) {
          setUser(data);
          addNotification({
            title: "Welcome back!",
            message: "You have successfully signed in.",
            type: "success",
            read: false,
            userId: data.id,
          });
        }
      },
      onError: (error) => {
        addNotification({
          title: "Sign In Failed",
          message:
            error.message || "Please check your credentials and try again.",
          type: "error",
          read: false,
          userId: "anonymous",
        });
      },
    },
  );

  // Signup mutation
  const {
    mutate: signupMutate,
    mutateAsync: signupAsync,
    loading: signupLoading,
  } = useMutation(
    ({
      email,
      password,
      metadata,
    }: {
      email: string;
      password: string;
      metadata?: any;
    }) => authApi.signUp(email, password, metadata),
    {
      onSuccess: (data) => {
        addNotification({
          title: "Account Created",
          message: "Please check your email to verify your account.",
          type: "success",
          read: false,
          userId: data?.id || "anonymous",
        });
      },
      onError: (error) => {
        addNotification({
          title: "Sign Up Failed",
          message:
            error.message || "Unable to create account. Please try again.",
          type: "error",
          read: false,
          userId: "anonymous",
        });
      },
    },
  );

  // Logout mutation
  const { mutate: logoutMutate, loading: logoutLoading } = useMutation(
    () => authApi.signOut(),
    {
      onSuccess: () => {
        setUser(null);
        // Clear sensitive data from store
        useAppStore.getState().setAssessments([]);
        useAppStore.getState().setGoals([]);
        useAppStore.getState().setProgress([]);

        addNotification({
          title: "Signed Out",
          message: "You have been successfully signed out.",
          type: "info",
          read: false,
          userId: "anonymous",
        });
      },
      onError: (error) => {
        console.error("Logout error:", error);
        // Force logout even if API call fails
        setUser(null);
      },
    },
  );

  // Reset password mutation
  const {
    mutate: resetPasswordMutate,
    mutateAsync: resetPasswordAsync,
    loading: resetPasswordLoading,
  } = useMutation(
    ({ email, redirectTo }: { email: string; redirectTo?: string }) =>
      authApi.resetPassword(email, redirectTo),
    {
      onSuccess: () => {
        addNotification({
          title: "Reset Email Sent",
          message: "Please check your email for password reset instructions.",
          type: "info",
          read: false,
          userId: "anonymous",
        });
      },
      onError: (error) => {
        addNotification({
          title: "Reset Failed",
          message:
            error.message || "Unable to send reset email. Please try again.",
          type: "error",
          read: false,
          userId: "anonymous",
        });
      },
    },
  );

  // Update profile mutation
  const {
    mutate: updateProfileMutate,
    mutateAsync: updateProfileAsync,
    loading: updateProfileLoading,
  } = useMutation(
    (updates: Partial<User["user_metadata"]>) => authApi.updateProfile(updates),
    {
      onSuccess: (data) => {
        if (data) {
          setUser(data);
          addNotification({
            title: "Profile Updated",
            message: "Your profile has been successfully updated.",
            type: "success",
            read: false,
            userId: data.id,
          });
        }
      },
      onError: (error) => {
        addNotification({
          title: "Update Failed",
          message:
            error.message || "Unable to update profile. Please try again.",
          type: "error",
          read: false,
          userId: user?.id || "anonymous",
        });
      },
    },
  );

  // Initialize auth state on app start
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setAuthLoading(true);

      try {
        const { data, error } = await authApi.getCurrentUser();

        if (mounted) {
          if (data && !error) {
            setUser(data);
          } else {
            setUser(null);
          }
          setAuthLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setUser(null);
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [setUser, setAuthLoading]);

  // Convenience methods
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await loginAsync({ email, password });
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    [loginAsync],
  );

  const signup = useCallback(
    async (email: string, password: string, metadata?: any) => {
      try {
        const data = await signupAsync({ email, password, metadata });
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    [signupAsync],
  );

  const logout = useCallback(async () => {
    try {
      logoutMutate(undefined as any);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [logoutMutate]);

  const resetPassword = useCallback(
    async (email: string, redirectTo?: string) => {
      try {
        await resetPasswordAsync({ email, redirectTo });
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    [resetPasswordAsync],
  );

  const updateProfile = useCallback(
    async (updates: Partial<User["user_metadata"]>) => {
      try {
        const data = await updateProfileAsync(updates);
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    [updateProfileAsync],
  );

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await authApi.refreshSession();
      if (data && !error) {
        setUser(data);
      }
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }, [setUser]);

  // Auth state helpers
  const isAuthenticated = useMemo(() => !!user, [user]);
  const isLoading = useMemo(
    () =>
      authLoading ||
      loginLoading ||
      signupLoading ||
      logoutLoading ||
      resetPasswordLoading ||
      updateProfileLoading,
    [
      authLoading,
      loginLoading,
      signupLoading,
      logoutLoading,
      resetPasswordLoading,
      updateProfileLoading,
    ],
  );

  // Navigation helpers
  const requireAuth = useCallback(
    (redirectTo: string = "/login") => {
      if (!authLoading && !user) {
        navigate(redirectTo, { replace: true });
        return false;
      }
      return true;
    },
    [user, authLoading, navigate],
  );

  const redirectIfAuthenticated = useCallback(
    (redirectTo: string = "/dashboard") => {
      if (!authLoading && user) {
        navigate(redirectTo, { replace: true });
        return true;
      }
      return false;
    },
    [user, authLoading, navigate],
  );

  return {
    // State
    user,
    isAuthenticated,
    loading: isLoading,

    // Methods (new API)
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

    // Loading states for individual operations
    loginLoading,
    signupLoading,
    logoutLoading,
    resetPasswordLoading,
    updateProfileLoading,
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
