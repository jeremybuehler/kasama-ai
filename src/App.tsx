import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Components
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastContainer } from "./components/ui/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner, {
  FullScreenLoader,
} from "./components/ui/LoadingSpinner";
import ScrollToTop from "./components/ScrollToTop";

// Lazy-loaded pages for code splitting
const LoginForm = lazy(() => import("./components/auth/Login"));
const SignupForm = lazy(() => import("./components/auth/Signup"));
const PasswordResetForm = lazy(() => import("./components/auth/PasswordReset"));
const DashboardHome = lazy(() => import("./pages/dashboard-home"));
const ProfileSettings = lazy(() => import("./pages/profile-settings"));
const ProgressTracking = lazy(() => import("./pages/progress-tracking"));
const LearnPractices = lazy(() => import("./pages/learn-practices"));
const RelationshipAssessment = lazy(
  () => import("./pages/relationship-assessment"),
);
const WelcomeOnboarding = lazy(() => import("./pages/welcome-onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// Layout wrapper for authenticated pages
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="min-h-screen bg-background">{children}</div>;
};

// Layout wrapper for auth pages
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
};

// Loading fallback component
const PageLoader: React.FC = () => (
  <FullScreenLoader message="Loading page..." />
);

// Error fallback for route-level errors
const RouteErrorFallback: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Page Error</h1>
      <p className="text-muted-foreground">
        Something went wrong loading this page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Reload Page
      </button>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />

          <Routes>
            {/* Public Auth Routes */}
            <Route element={<ProtectedRoute requireAuth={false} />}>
              <Route
                path="/login"
                element={
                  <AuthLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <LoginForm />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthLayout>
                }
              />

              <Route
                path="/signup"
                element={
                  <AuthLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <SignupForm />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthLayout>
                }
              />

              <Route
                path="/reset-password"
                element={
                  <AuthLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <PasswordResetForm />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthLayout>
                }
              />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={
                  <AuthenticatedLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <DashboardHome />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthenticatedLayout>
                }
              />

              <Route
                path="/profile"
                element={
                  <AuthenticatedLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <ProfileSettings />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthenticatedLayout>
                }
              />

              <Route
                path="/progress"
                element={
                  <AuthenticatedLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <ProgressTracking />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthenticatedLayout>
                }
              />

              <Route
                path="/practices"
                element={
                  <AuthenticatedLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <LearnPractices />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthenticatedLayout>
                }
              />

              <Route
                path="/assessment"
                element={
                  <AuthenticatedLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <RelationshipAssessment />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthenticatedLayout>
                }
              />

              <Route
                path="/onboarding"
                element={
                  <AuthenticatedLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ErrorBoundary fallback={<RouteErrorFallback />}>
                        <WelcomeOnboarding />
                      </ErrorBoundary>
                    </Suspense>
                  </AuthenticatedLayout>
                }
              />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/home"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard-home"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/profile-settings"
              element={<Navigate to="/profile" replace />}
            />
            <Route
              path="/progress-tracking"
              element={<Navigate to="/progress" replace />}
            />
            <Route
              path="/learn-practices"
              element={<Navigate to="/practices" replace />}
            />
            <Route
              path="/relationship-assessment"
              element={<Navigate to="/assessment" replace />}
            />
            <Route
              path="/welcome-onboarding"
              element={<Navigate to="/onboarding" replace />}
            />
            <Route
              path="/login-authentication"
              element={<Navigate to="/login" replace />}
            />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary fallback={<RouteErrorFallback />}>
                    <NotFound />
                  </ErrorBoundary>
                </Suspense>
              }
            />
          </Routes>

          {/* Global UI Components */}
          <ToastContainer />

          {/* React Query Devtools (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
