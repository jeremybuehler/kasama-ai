import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BottomTabNavigation from "../../components/ui/BottomTabNavigation";
import ProfileModal from "../../components/ui/ProfileModal";
import WelcomeHeader from "./components/WelcomeHeader";
import DailyInsightCard from "./components/DailyInsightCard";
import StatsGrid from "./components/StatsGrid";
import DevelopmentJourney from "./components/DevelopmentJourney";
import QuickActions from "./components/QuickActions";
import RecentActivity from "./components/RecentActivity";
import progressTrackingService from "../../services/progress-tracking";
import aiInsightsService from "../../services/ai-insights";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [progressStats, setProgressStats] = useState(null);
  const [dailyInsights, setDailyInsights] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState(null);

  // Dynamic user data based on authenticated user and progress
  const userData = {
    name: user?.user_metadata?.name || user?.email?.split("@")?.[0] || "User",
    email: user?.email || "user@example.com",
    joinDate: user?.created_at
      ? new Date(user?.created_at)?.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "January 2025",
    currentStreak: progressStats?.currentStreak || 0,
    totalPractices: progressStats?.totalActivities || 0,
  };

  useEffect(() => {
    // Set active tab for bottom navigation
    document.title = "Dashboard - Kasama";

    // Load user progress and insights
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Initialize progress tracking if needed
      const stats = progressTrackingService.getProgressStats();
      setProgressStats(stats);

      // Load assessment results
      const storedAssessment = localStorage.getItem("assessmentResults");
      if (storedAssessment) {
        const assessment = JSON.parse(storedAssessment);
        setAssessmentResults(assessment);
      }

      // Get daily recommendations
      const userProfile = {
        progressStats: stats,
        assessmentResults: assessmentResults,
      };

      const recommendations = await aiInsightsService.getDailyRecommendations(
        userProfile,
        stats.recentActivity,
      );

      setDailyInsights(recommendations);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login-authentication");
    }
  }, [user, loading, navigate]);

  const handleTabChange = (tabId, path) => {
    navigate(path);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleInsightViewMore = () => {
    navigate("/learn-practices");
  };

  const handleStatClick = (stat) => {
    switch (stat?.id) {
      case "growth":
      case "weekly":
      case "streak":
      case "milestone":
        navigate("/progress-tracking");
        break;
      default:
        break;
    }
  };

  const handleSkillClick = (skill) => {
    navigate("/learn-practices", { state: { selectedSkill: skill?.id } });
  };

  const handleActionClick = (action) => {
    switch (action?.id) {
      case "daily-practice":
        navigate("/learn-practices");
        break;
      case "mindful-checkin":
        // Navigate to mindful check-in (would be implemented)
        console.log("Navigate to mindful check-in");
        break;
      case "goal-setting":
        // Navigate to goal setting (would be implemented)
        console.log("Navigate to goal setting");
        break;
      case "progress-review":
        navigate("/progress-tracking");
        break;
      default:
        break;
    }
  };

  const handleActivityClick = (activity) => {
    switch (activity?.type) {
      case "practice":
        navigate("/learn-practices");
        break;
      case "milestone":
      case "insight":
        navigate("/progress-tracking");
        break;
      default:
        break;
    }
  };

  const handlePullToRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex items-center space-x-2 text-primary">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
          {/* Pull to refresh indicator */}
          {refreshing && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 text-primary">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Refreshing...</span>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <WelcomeHeader
            userName={userData?.name}
            onProfileClick={handleProfileClick}
          />

          {/* Daily Insight */}
          <DailyInsightCard
            insights={dailyInsights}
            assessmentResults={assessmentResults}
            onViewMore={handleInsightViewMore}
          />

          {/* Stats Grid */}
          <StatsGrid
            progressStats={progressStats}
            onStatClick={handleStatClick}
          />

          {/* Development Journey */}
          <DevelopmentJourney
            progressStats={progressStats}
            onSkillClick={handleSkillClick}
          />

          {/* Quick Actions */}
          <QuickActions onActionClick={handleActionClick} />

          {/* Recent Activity */}
          <RecentActivity
            recentActivity={progressStats?.recentActivity || []}
            onActivityClick={handleActivityClick}
          />

          {/* Motivational Footer */}
          <div className="bg-gradient-accent rounded-xl p-6 text-white text-center">
            <h3 className="font-semibold mb-2">Keep Growing!</h3>
            <p className="text-white/80 text-sm">
              Every small step you take today builds stronger relationships
              tomorrow.
            </p>
          </div>
        </div>
      </main>
      {/* Bottom Navigation */}
      <BottomTabNavigation activeTab="home" onTabChange={handleTabChange} />
      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={userData}
      />
    </div>
  );
};

export default DashboardHome;
