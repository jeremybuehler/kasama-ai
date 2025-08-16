import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../pages/login-authentication/components/supabaseClient";

// Auth context with session persistence and auto-refresh (handled by Supabase client)
const AuthContext = createContext({
  user: null,
  loading: true,
  // canonical API
  login: async (_email, _password) => {},
  signup: async (_email, _password, _opts) => {},
  logout: async () => {},
  resetPassword: async (_email, _redirectTo) => {},
  refresh: async () => {},
  // backwards-compat aliases
  signIn: async (_email, _password) => {},
  signOut: async () => {},
  signUp: async (_email, _password, _opts) => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Initial session fetch
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Supabase handles token persistence and auto-refresh internally when the client
    // is configured with autoRefreshToken (true by default). We subscribe to auth changes
    // to keep React state in sync.
    const { data: { subscription } = { subscription: undefined } } =
      supabase?.auth?.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        setLoading(false);
      }) ?? { data: { subscription: undefined } };

    subscriptionRef.current = subscription;

    return () => {
      isMounted = false;
      subscriptionRef.current?.unsubscribe?.();
    };
  }, []);

  // Methods
  const signIn = async (email, password) => {
    const { data, error } = await supabase?.auth?.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const login = signIn; // canonical alias

  const signUp = async (email, password, opts = {}) => {
    const { data, error } = await supabase?.auth?.signUp({
      email,
      password,
      options: opts,
    });
    return { data, error };
  };

  const signup = signUp; // canonical alias

  const signOut = async () => {
    const { error } = await supabase?.auth?.signOut();
    return { error };
  };

  const logout = signOut; // canonical alias

  const resetPassword = async (email, redirectTo) => {
    // Sends a password reset email; user will be redirected to redirectTo for updating password
    const { data, error } = await supabase?.auth?.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined,
    );
    return { data, error };
  };

  const refresh = async () => {
    // Force a session refresh (normally automatic). Useful if you want to proactively refresh.
    const { data, error } = await supabase?.auth?.refreshSession();
    if (!error) setUser(data?.user ?? data?.session?.user ?? null);
    return { data, error };
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      // canonical
      login,
      signup,
      logout,
      resetPassword,
      refresh,
      // aliases (for backwards compatibility)
      signIn,
      signUp,
      signOut,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
