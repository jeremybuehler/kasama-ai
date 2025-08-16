import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomTabNavigation from "../../components/ui/BottomTabNavigation";
import ProgressHeader from "./components/ProgressHeader";
import SkillProgressCard from "./components/SkillProgressCard";
import TimelineView from "./components/TimelineView";
import ProgressChart from "./components/ProgressChart";
import GoalTracker from "./components/GoalTracker";
import AchievementGallery from "./components/AchievementGallery";
import ViewToggle from "./components/ViewToggle";
import Icon from "../../components/AppIcon";

const ProgressTracking = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("weekly");

  // Mock data for progress tracking
  const skillsData = [
    {
      id: 1,
      title: "Communication Skills",
      icon: "MessageCircle",
      progress: 78,
      improvement: 12,
      suggestion: "Practice active listening exercises to improve further",
      color: "primary",
    },
    {
      id: 2,
      title: "Emotional Intelligence",
      icon: "Heart",
      progress: 65,
      improvement: 8,
      suggestion: "Try mindfulness meditation to enhance emotional awareness",
      color: "secondary",
    },
    {
      id: 3,
      title: "Relationship Patterns",
      icon: "Users",
      progress: 82,
      improvement: 15,
      suggestion: "Continue exploring attachment styles for deeper insights",
      color: "accent",
    },
  ];

  const achievementsData = [
    {
      id: 1,
      title: "7-Day Practice Streak",
      description: "Completed daily mindfulness exercises for a week",
      date: "2 days ago",
      type: "practice",
      badge: "Consistency Master",
    },
    {
      id: 2,
      title: "Communication Milestone",
      description: "Reached 75% in communication skills assessment",
      date: "1 week ago",
      type: "milestone",
      badge: "Great Communicator",
    },
    {
      id: 3,
      title: "First Assessment Complete",
      description: "Successfully completed relationship readiness assessment",
      date: "2 weeks ago",
      type: "assessment",
      badge: "Self-Aware",
    },
    {
      id: 4,
      title: "Profile Setup",
      description: "Created your personalized relationship profile",
      date: "3 weeks ago",
      type: "setup",
      badge: "Getting Started",
    },
  ];

  const chartData = [
    { date: "Week 1", score: 45 },
    { date: "Week 2", score: 52 },
    { date: "Week 3", score: 58 },
    { date: "Week 4", score: 65 },
    { date: "Week 5", score: 72 },
    { date: "Week 6", score: 78 },
    { date: "Week 7", score: 82 },
  ];

  const monthlyChartData = [
    { date: "Jan", score: 45 },
    { date: "Feb", score: 58 },
    { date: "Mar", score: 72 },
    { date: "Apr", score: 82 },
  ];

  const goalsData = [
    {
      id: 1,
      title: "Improve Active Listening",
      description: "Practice active listening techniques daily",
      progress: 85,
      targetDate: "Dec 31, 2025",
      daysLeft: 15,
    },
    {
      id: 2,
      title: "Complete Emotional Intelligence Module",
      description: "Finish all EQ learning exercises",
      progress: 60,
      targetDate: "Jan 15, 2026",
      daysLeft: 30,
    },
    {
      id: 3,
      title: "30-Day Mindfulness Challenge",
      description: "Daily mindfulness practice for 30 days",
      progress: 100,
      targetDate: "Dec 1, 2025",
      daysLeft: 0,
    },
  ];

  const badgesData = [
    {
      id: 1,
      title: "First Steps",
      description: "Completed onboarding",
      icon: "Star",
      unlocked: true,
      unlockedDate: "3 weeks ago",
    },
    {
      id: 2,
      title: "Self-Aware",
      description: "Completed first assessment",
      icon: "Eye",
      unlocked: true,
      unlockedDate: "2 weeks ago",
    },
    {
      id: 3,
      title: "Consistent Learner",
      description: "7-day practice streak",
      icon: "Calendar",
      unlocked: true,
      unlockedDate: "2 days ago",
    },
    {
      id: 4,
      title: "Great Communicator",
      description: "75% communication score",
      icon: "MessageCircle",
      unlocked: true,
      unlockedDate: "1 week ago",
    },
    {
      id: 5,
      title: "Mindful Master",
      description: "30-day mindfulness streak",
      icon: "Brain",
      unlocked: false,
    },
    {
      id: 6,
      title: "Relationship Expert",
      description: "90% overall score",
      icon: "Award",
      unlocked: false,
    },
    {
      id: 7,
      title: "Goal Crusher",
      description: "Complete 5 goals",
      icon: "Target",
      unlocked: false,
    },
    {
      id: 8,
      title: "Wisdom Seeker",
      description: "Complete all modules",
      icon: "BookOpen",
      unlocked: false,
    },
  ];

  const handleTabChange = (tabId, path) => {
    navigate(path);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar Spacing */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <main className="px-4 py-6 pb-20 lg:pb-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Progress Tracking
              </h1>
              <p className="text-muted-foreground">
                Monitor your relationship development journey
              </p>
            </div>

            <ViewToggle
              activeView={activeView}
              onViewChange={handleViewChange}
            />
          </div>

          {/* Progress Header */}
          <ProgressHeader overallScore={72} weeklyChange={8} />

          {/* Skills Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {skillsData?.map((skill) => (
              <SkillProgressCard
                key={skill?.id}
                title={skill?.title}
                icon={skill?.icon}
                progress={skill?.progress}
                improvement={skill?.improvement}
                suggestion={skill?.suggestion}
                color={skill?.color}
              />
            ))}
          </div>

          {/* Charts and Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ProgressChart
              data={activeView === "weekly" ? chartData : monthlyChartData}
              title={`${activeView === "weekly" ? "Weekly" : "Monthly"} Progress Trend`}
            />
            <TimelineView achievements={achievementsData} />
          </div>

          {/* Goals and Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <GoalTracker goals={goalsData} />
            <AchievementGallery badges={badgesData} />
          </div>

          {/* Motivational Section */}
          <div className="bg-gradient-accent rounded-xl p-6 text-white text-center">
            <Icon
              name="TrendingUp"
              size={48}
              className="mx-auto mb-4 text-white/80"
            />
            <h3 className="text-xl font-semibold mb-2">Keep Growing!</h3>
            <p className="text-white/80 mb-4">
              You've made incredible progress in your relationship journey. Your
              dedication to personal growth is inspiring!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/learn-practices")}
                className="px-6 py-3 bg-white text-accent font-medium rounded-lg hover:bg-white/90 transition-gentle"
              >
                Continue Learning
              </button>
              <button
                onClick={() => navigate("/relationship-assessment")}
                className="px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-gentle"
              >
                Retake Assessment
              </button>
            </div>
          </div>
        </main>
      </div>
      {/* Bottom Navigation */}
      <BottomTabNavigation activeTab="progress" onTabChange={handleTabChange} />
    </div>
  );
};

export default ProgressTracking;
