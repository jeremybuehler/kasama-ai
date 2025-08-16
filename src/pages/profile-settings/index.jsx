import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import BottomTabNavigation from "../../components/ui/BottomTabNavigation";
import AccountSection from "./components/AccountSection";
import PrivacySection from "./components/PrivacySection";
import NotificationSection from "./components/NotificationSection";
import AppSettingsSection from "./components/AppSettingsSection";
import AssessmentHistorySection from "./components/AssessmentHistorySection";
import SupportSection from "./components/SupportSection";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile-settings");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mock user data
  const [user, setUser] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    joinDate: "2024-12-15",
    relationshipScore: 78,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  });

  // Mock settings data
  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: true,
    assessmentVisibility: true,
    progressSharing: false,
    marketingEmails: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminders: true,
    progressUpdates: true,
    achievementAlerts: true,
    insightNotifications: false,
    reminderTime: "09:00",
    frequency: "daily",
  });

  const [appSettings, setAppSettings] = useState({
    theme: "light",
    language: "en",
    timezone: "America/New_York",
    autoSave: true,
    offlineMode: false,
    analytics: true,
  });

  const [assessmentHistory] = useState([]);

  useEffect(() => {
    // Set page title
    document.title = "Profile & Settings - Kasama";
  }, []);

  const handleTabChange = (tabId, path) => {
    setActiveTab(tabId);
    navigate(path);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const handleUpdatePrivacy = (updatedSettings) => {
    setPrivacySettings(updatedSettings);
  };

  const handleUpdateNotifications = (updatedSettings) => {
    setNotificationSettings(updatedSettings);
  };

  const handleUpdateAppSettings = (updatedSettings) => {
    setAppSettings(updatedSettings);
  };

  const handleRetakeAssessment = () => {
    navigate("/relationship-assessment");
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Handle logout logic
    navigate("/welcome-onboarding");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar Spacing */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard-home")}
                iconName="ArrowLeft"
                iconSize={20}
                className="lg:hidden"
              />
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Profile & Settings
                </h1>
                <p className="text-muted-foreground">
                  Manage your account and preferences
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* User Profile Header */}
        <div className="bg-gradient-primary px-4 py-8 lg:px-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-white/20">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/assets/images/no_image.png";
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl lg:text-2xl font-semibold text-white">
                {user?.name}
              </h2>
              <p className="text-white/80 mb-2">{user?.email}</p>
              <div className="flex items-center space-x-4 text-sm text-white/80">
                <span>
                  Joined{" "}
                  {new Date(user.joinDate)?.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
                <span>•</span>
                <div className="flex items-center space-x-2">
                  <Icon name="TrendingUp" size={16} className="text-white/80" />
                  <span>Relationship Score: {user?.relationshipScore}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 py-6 lg:px-8 space-y-6 pb-24 lg:pb-6">
          {/* Account Information */}
          <AccountSection user={user} onUpdateUser={handleUpdateUser} />

          {/* Privacy Settings */}
          <PrivacySection
            privacySettings={privacySettings}
            onUpdatePrivacy={handleUpdatePrivacy}
          />

          {/* Notification Preferences */}
          <NotificationSection
            notificationSettings={notificationSettings}
            onUpdateNotifications={handleUpdateNotifications}
          />

          {/* App Settings */}
          <AppSettingsSection
            appSettings={appSettings}
            onUpdateAppSettings={handleUpdateAppSettings}
          />

          {/* Assessment History */}
          <AssessmentHistorySection
            assessmentHistory={assessmentHistory}
            onRetakeAssessment={handleRetakeAssessment}
          />

          {/* Support & Help */}
          <SupportSection />

          {/* Logout Section */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  Account Actions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your account status
                </p>
              </div>
              <Button
                variant="outline"
                iconName="LogOut"
                iconPosition="left"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </main>
      </div>
      {/* Bottom Navigation */}
      <BottomTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="LogOut" size={24} className="text-error" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sign Out
              </h3>
              <p className="text-muted-foreground">
                Are you sure you want to sign out of your account?
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelLogout}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmLogout}
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
