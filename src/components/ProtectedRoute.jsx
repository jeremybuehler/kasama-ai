import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// A route guard component for protecting routes that require authentication.
// Usage examples:
// 1) As a wrapper element:
//    <Route element={<ProtectedRoute />}> ...protected routes... </Route>
// 2) Around a single element:
//    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
export default function ProtectedRoute({
  children,
  redirectTo = "/login-authentication",
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
          <p className="text-sm">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to login, preserving the location they came from
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Authenticated: render protected content
  if (children) return <>{children}</>;
  return <Outlet />;
}
