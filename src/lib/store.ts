import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import {
  AppStore,
  User,
  Notification,
  Assessment,
  Practice,
  Goal,
  Progress,
} from "./types";

// Create the main application store with Zustand
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Auth state
        user: null,
        authLoading: false,

        // UI state
        sidebarOpen: false,
        theme: "system" as const,
        notifications: [],

        // Data state
        assessments: [],
        practices: [],
        goals: [],
        progress: [],

        // Auth actions
        setUser: (user: User | null) => set({ user }),
        setAuthLoading: (authLoading: boolean) => set({ authLoading }),

        // UI actions
        setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),
        setTheme: (theme: "light" | "dark" | "system") => {
          set({ theme });
          // Apply theme to document
          if (theme === "system") {
            const systemTheme = window.matchMedia(
              "(prefers-color-scheme: dark)",
            ).matches
              ? "dark"
              : "light";
            document.documentElement.classList.toggle(
              "dark",
              systemTheme === "dark",
            );
          } else {
            document.documentElement.classList.toggle("dark", theme === "dark");
          }
        },

        // Notification actions
        addNotification: (
          notification: Omit<Notification, "id" | "createdAt">,
        ) => {
          const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(
              0,
              50,
            ), // Keep max 50 notifications
          }));
        },

        removeNotification: (id: string) => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        },

        markNotificationRead: (id: string) => {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
          }));
        },

        // Data actions
        setAssessments: (assessments: Assessment[]) => set({ assessments }),
        setPractices: (practices: Practice[]) => set({ practices }),
        setGoals: (goals: Goal[]) => set({ goals }),
        setProgress: (progress: Progress[]) => set({ progress }),
      }),
      {
        name: "kasama-app-store",
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          // Don't persist sensitive data like user info or auth state
        }),
      },
    ),
  ),
);

// Selector hooks for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useAuthLoading = () => useAppStore((state) => state.authLoading);
export const useTheme = () => useAppStore((state) => state.theme);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useNotifications = () =>
  useAppStore((state) => state.notifications);
export const useUnreadNotifications = () =>
  useAppStore((state) => state.notifications.filter((n) => !n.read));
export const useAssessments = () => useAppStore((state) => state.assessments);
export const usePractices = () => useAppStore((state) => state.practices);
export const useGoals = () => useAppStore((state) => state.goals);
export const useProgress = () => useAppStore((state) => state.progress);

// Action hooks
export const useAppActions = () =>
  useAppStore((state) => ({
    setUser: state.setUser,
    setAuthLoading: state.setAuthLoading,
    setSidebarOpen: state.setSidebarOpen,
    setTheme: state.setTheme,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    markNotificationRead: state.markNotificationRead,
    setAssessments: state.setAssessments,
    setPractices: state.setPractices,
    setGoals: state.setGoals,
    setProgress: state.setProgress,
  }));

// Subscribe to theme changes
if (typeof window !== "undefined") {
  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleThemeChange = () => {
    const { theme } = useAppStore.getState();
    if (theme === "system") {
      document.documentElement.classList.toggle("dark", mediaQuery.matches);
    }
  };

  mediaQuery.addEventListener("change", handleThemeChange);

  // Apply initial theme
  const { theme } = useAppStore.getState();
  if (theme === "system") {
    document.documentElement.classList.toggle("dark", mediaQuery.matches);
  } else {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

// Store devtools (only in development)
if (process.env.NODE_ENV === "development") {
  // Enable Zustand devtools
  useAppStore.subscribe(
    (state) => state,
    (state) => {
      console.log("Zustand State Change:", state);
    },
  );
}
