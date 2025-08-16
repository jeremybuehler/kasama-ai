import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages (simple wrappers around existing form components)
import LoginForm from "./components/auth/Login";
import SignupForm from "./components/auth/Signup";
import PasswordResetForm from "./components/auth/PasswordReset";

// Protected pages
import DashboardHome from "./pages/dashboard-home";
import ProfileSettings from "./pages/profile-settings";

import NotFound from "./pages/NotFound";

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        display: "flex",
        gap: 12,
      }}
    >
      {user ? (
        <>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <button onClick={handleLogout} style={{ marginLeft: "auto" }}>
            Logout
          </button>
        </>
      ) : (
        <>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/signup">Sign Up</NavLink>
          <NavLink to="/reset-password" style={{ marginLeft: "auto" }}>
            Reset Password
          </NavLink>
        </>
      )}
    </nav>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Login</h1>
      <LoginForm
        onLogin={async (email, password) => {
          const { error } = await login(email, password);
          if (error) throw error;
          navigate("/dashboard", { replace: true });
        }}
        onForgotPassword={() => navigate("/reset-password")}
      />
    </div>
  );
}

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Create account</h1>
      <SignupForm
        onSignup={async (email, password) => {
          const { error } = await signup(email, password);
          if (error) throw error;
          navigate("/login");
        }}
      />
    </div>
  );
}

function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Reset password</h1>
      <PasswordResetForm
        onRequestReset={async (email) => {
          const { error } = await resetPassword(email);
          if (error) throw error;
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navigation />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute redirectTo="/login" />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/profile" element={<ProfileSettings />} />
          </Route>

          {/* Redirects and 404 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
