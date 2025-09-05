import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";

// Enhanced imports for elite performance
import { createOptimizedQueryClient } from "./lib/cache";
import { applyKasamaFavicon } from "./utils/favicon";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastContainer } from "./components/ui/Toast";
import { aiComponentFactory } from "./lib/ai-component-factory";
import { apiRouteManager } from "./lib/api-route-manager";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner, {
  FullScreenLoader,
} from "./components/ui/LoadingSpinner";
import ScrollToTop from "./components/ScrollToTop";

// Lazy-loaded pages for optimal code splitting
const LoginPage = lazy(() => import("./pages/Login"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const DashboardHome = lazy(() => import("./pages/dashboard-home"));
const ProfileSettings = lazy(() => import("./pages/profile-settings"));
const ProgressTracking = lazy(() => import("./pages/progress-tracking"));
const LearnPractices = lazy(() => import("./pages/learn-practices"));
const RelationshipAssessment = lazy(
  () => import("./pages/relationship-assessment"),
);
const WelcomeOnboarding = lazy(() => import("./pages/welcome-onboarding"));
const LogoTest = lazy(() => import("./pages/LogoTest"));
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create optimized React Query client with elite caching
const queryClient = createOptimizedQueryClient();

// Performance-optimized layout wrappers
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = React.memo(({
  children,
}) => {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
});

AuthenticatedLayout.displayName = 'AuthenticatedLayout';

const AuthLayout: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
});

AuthLayout.displayName = 'AuthLayout';

// Enhanced loading fallback with better UX
const PageLoader: React.FC = React.memo(() => (
  <FullScreenLoader message="Loading page..." />
));

PageLoader.displayName = 'PageLoader';

// Enhanced error fallback with retry capability
const RouteErrorFallback: React.FC = React.memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-6xl mb-4">😅</div>
      <h1 className="text-2xl font-semibold text-foreground">Oops! Page Error</h1>
      <p className="text-muted-foreground">
        Something went wrong loading this page. Don't worry, our team has been notified.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
));

RouteErrorFallback.displayName = 'RouteErrorFallback';

// Route component factory for consistent error handling
const createProtectedRoute = (
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
  layout: 'auth' | 'authenticated' | 'fullwidth' = 'authenticated'
) => {
  const Layout = layout === 'auth' ? AuthLayout : layout === 'fullwidth' ? React.Fragment : AuthenticatedLayout;
  
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <ErrorBoundary fallback={<RouteErrorFallback />}>
          <Component />
        </ErrorBoundary>
      </Suspense>
    </Layout>
  );
};

function App() {
  // AI-powered app initialization
  React.useEffect(() => {
    applyKasamaFavicon();
    
    // Initialize AI systems
    console.log('🤖 Initializing AI-powered systems...');
    
    // Preload user context for personalization
    const initializeAISystems = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (userId) {
          await aiComponentFactory.createAdaptiveDashboard(userId, {
            communicationStyle: 'supportive',
            aiPersonality: 'encouraging'
          });
          console.log('✅ AI systems initialized');
        }
      } catch (error) {
        console.warn('⚠️ AI initialization failed:', error);
      }
    };
    
    initializeAISystems();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ScrollToTop />

          <Routes>
            {/* Public Routes - Optimized for fast loading */}
            <Route element={<ProtectedRoute requireAuth={false} />}>
              <Route
                path="/"
                element={createProtectedRoute(Landing, 'fullwidth')}
              />
              <Route
                path="/login"
                element={createProtectedRoute(LoginPage, 'auth')}
              />
              <Route
                path="/auth/callback"
                element={createProtectedRoute(AuthCallback, 'auth')}
              />
            </Route>

            {/* Protected Routes - With intelligent preloading */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={createProtectedRoute(DashboardHome)}
              />
              <Route
                path="/profile"
                element={createProtectedRoute(ProfileSettings)}
              />
              <Route
                path="/progress"
                element={createProtectedRoute(ProgressTracking)}
              />
              <Route
                path="/practices"
                element={createProtectedRoute(LearnPractices)}
              />
              <Route
                path="/assessment"
                element={createProtectedRoute(RelationshipAssessment)}
              />
              <Route
                path="/onboarding"
                element={createProtectedRoute(WelcomeOnboarding)}
              />
              <Route
                path="/logo-test"
                element={createProtectedRoute(LogoTest)}
              />
            </Route>

            {/* Smart redirects for SEO and UX */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/dashboard-home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile-settings" element={<Navigate to="/profile" replace />} />
            <Route path="/progress-tracking" element={<Navigate to="/progress" replace />} />
            <Route path="/learn-practices" element={<Navigate to="/practices" replace />} />
            <Route path="/relationship-assessment" element={<Navigate to="/assessment" replace />} />
            <Route path="/welcome-onboarding" element={<Navigate to="/onboarding" replace />} />
            <Route path="/login-authentication" element={<Navigate to="/login" replace />} />

            {/* 404 Route with better UX */}
            <Route
              path="*"
              element={createProtectedRoute(NotFound)}
            />
          </Routes>

          {/* Global UI Components */}
          <ToastContainer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* React Query Devtools - Performance optimized */}
          {__DEV__ && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              position="bottom-right"
              toggleButtonProps={{
                style: {
                  marginLeft: '5px',
                  transform: 'scale(0.8)',
                  transformOrigin: 'bottom right',
                }
              }}
            />
          )}
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;