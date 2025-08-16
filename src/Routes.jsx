import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import { ErrorBoundary } from "components/ui/ErrorBoundary";
import NotFound from "pages/NotFound";
import WelcomeOnboarding from "./pages/welcome-onboarding";
import ProgressTracking from "./pages/progress-tracking";
import LearnPractices from "./pages/learn-practices";
import ProfileSettings from "./pages/profile-settings";
import DashboardHome from "./pages/dashboard-home";
import RelationshipAssessment from "./pages/relationship-assessment";
import LoginAuthentication from "./pages/login-authentication";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your route here */}
          <Route path="/" element={<DashboardHome />} />
          <Route path="/welcome-onboarding" element={<WelcomeOnboarding />} />
          <Route path="/progress-tracking" element={<ProgressTracking />} />
          <Route path="/learn-practices" element={<LearnPractices />} />
          <Route path="/profile-settings" element={<ProfileSettings />} />
          <Route path="/dashboard-home" element={<DashboardHome />} />
          <Route
            path="/relationship-assessment"
            element={<RelationshipAssessment />}
          />
          <Route
            path="/login-authentication"
            element={<LoginAuthentication />}
          />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
