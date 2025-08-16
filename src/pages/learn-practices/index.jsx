import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import BottomTabNavigation from "../../components/ui/BottomTabNavigation";
import TodaysPracticeCard from "./components/TodaysPracticeCard";
import CategoryCard from "./components/CategoryCard";
import MindfulCheckIn from "./components/MindfulCheckIn";
import ActivityModal from "./components/ActivityModal";
import progressTrackingService from "../../services/progress-tracking";
import aiInsightsService from "../../services/ai-insights";

const LearnPractices = () => {
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [completedActivities, setCompletedActivities] = useState(new Set());
  const [progressStats, setProgressStats] = useState(null);
  const [dailyRecommendations, setDailyRecommendations] = useState([]);

  // Mock data for today's practice
  const todaysPractice = {
    id: "daily-1",
    title: "Active Listening Practice",
    description: `Practice giving your full attention to someone today. Focus on understanding their perspective without planning your response.`,
    icon: "Ear",
    duration: 15,
    category: "Communication",
    difficulty: "Beginner",
  };

  // Mock data for learning categories
  const learningCategories = [
    {
      id: "communication",
      title: "Communication Skills",
      subtitle: "Express yourself clearly and listen actively",
      icon: "MessageCircle",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      progress: 65,
      completedActivities: 8,
      totalActivities: 12,
      activities: [
        {
          id: "comm-1",
          title: "Active Listening Fundamentals",
          description:
            "Learn the core principles of truly hearing and understanding others",
          duration: 10,
          difficulty: "Beginner",
          isCompleted: true,
          hasTimer: true,
          steps: [
            {
              id: "step-1",
              title: "Understanding Active Listening",
              content: `Active listening is more than just hearing words. It involves giving your full attention, showing empathy, and responding thoughtfully.\n\nKey principles:\n• Focus completely on the speaker\n• Avoid interrupting or planning your response\n• Show engagement through body language\n• Ask clarifying questions\n• Reflect back what you've heard`,
              type: "content",
            },
            {
              id: "step-2",
              title: "Practice Checklist",
              content: "Use this checklist during your next conversation:",
              type: "checklist",
              items: [
                "Put away distractions (phone, laptop)",
                "Make appropriate eye contact",
                "Use open body language",
                "Nod and use verbal acknowledgments",
                "Ask follow-up questions",
                "Summarize what you heard",
              ],
            },
            {
              id: "step-3",
              title: "Reflection",
              content:
                "After practicing active listening, reflect on your experience:",
              type: "reflection",
            },
          ],
        },
        {
          id: "comm-2",
          title: "Expressing Emotions Clearly",
          description:
            "Learn to communicate your feelings in a healthy, constructive way",
          duration: 15,
          difficulty: "Intermediate",
          isCompleted: false,
          hasTimer: false,
          steps: [
            {
              id: "step-1",
              title: "Identifying Your Emotions",
              content: `Before you can express emotions clearly, you need to identify what you're feeling.\n\nCommon emotion categories:\n• Joy, excitement, contentment\n• Sadness, disappointment, grief\n• Anger, frustration, irritation\n• Fear, anxiety, worry\n• Surprise, confusion, curiosity`,
              type: "content",
            },
            {
              id: "step-2",
              title: 'Using "I" Statements',
              content:
                "Practice expressing emotions without blame or accusation.",
              type: "checklist",
              items: [
                'Start with "I feel..." instead of "You make me..."',
                "Be specific about the emotion",
                "Explain the situation that triggered the feeling",
                "Express what you need or want",
                'Avoid generalizations like "always" or "never"',
              ],
            },
          ],
        },
        {
          id: "comm-3",
          title: "Conflict Resolution Basics",
          description: "Navigate disagreements with respect and understanding",
          duration: 20,
          difficulty: "Advanced",
          isCompleted: false,
          hasTimer: true,
          steps: [
            {
              id: "step-1",
              title: "Understanding Conflict",
              content: `Conflict is natural in relationships. The goal isn't to avoid it, but to handle it constructively.\n\nHealthy conflict involves:\n• Focusing on the issue, not the person\n• Listening to understand, not to win\n• Finding common ground\n• Working toward solutions together`,
              type: "content",
            },
          ],
        },
      ],
    },
    {
      id: "emotional-intelligence",
      title: "Emotional Intelligence",
      subtitle: "Understand and manage emotions effectively",
      icon: "Heart",
      bgColor: "bg-rose-100",
      iconColor: "text-rose-600",
      progress: 45,
      completedActivities: 5,
      totalActivities: 11,
      activities: [
        {
          id: "ei-1",
          title: "Emotional Self-Awareness",
          description:
            "Develop the ability to recognize and understand your emotions",
          duration: 12,
          difficulty: "Beginner",
          isCompleted: true,
          hasTimer: false,
          steps: [
            {
              id: "step-1",
              title: "Emotion Check-In",
              content: `Take a moment to pause and check in with yourself. What are you feeling right now?\n\nNotice:\n• Physical sensations in your body\n• Your current mood\n• Any tension or relaxation\n• Your energy level`,
              type: "content",
            },
            {
              id: "step-2",
              title: "Emotion Journaling",
              content: "Write about your current emotional state:",
              type: "reflection",
            },
          ],
        },
        {
          id: "ei-2",
          title: "Empathy Building",
          description:
            "Strengthen your ability to understand others' perspectives",
          duration: 18,
          difficulty: "Intermediate",
          isCompleted: false,
          hasTimer: true,
          steps: [
            {
              id: "step-1",
              title: "Perspective Taking",
              content: `Empathy is the ability to understand and share the feelings of others.\n\nTo build empathy:\n• Listen without judgment\n• Try to see situations from their viewpoint\n• Notice their body language and tone\n• Ask questions to understand better\n• Validate their feelings`,
              type: "content",
            },
          ],
        },
      ],
    },
    {
      id: "relationship-patterns",
      title: "Relationship Patterns",
      subtitle: "Recognize and improve relationship dynamics",
      icon: "Users",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      progress: 30,
      completedActivities: 3,
      totalActivities: 10,
      activities: [
        {
          id: "rp-1",
          title: "Attachment Style Awareness",
          description:
            "Understand how your attachment style affects relationships",
          duration: 25,
          difficulty: "Intermediate",
          isCompleted: false,
          hasTimer: false,
          steps: [
            {
              id: "step-1",
              title: "Understanding Attachment Styles",
              content: `Attachment styles are patterns of how we connect with others, formed in early childhood.\n\nFour main styles:\n• Secure: Comfortable with intimacy and independence\n• Anxious: Seeks closeness but fears abandonment\n• Avoidant: Values independence, uncomfortable with closeness\n• Disorganized: Inconsistent patterns of attachment`,
              type: "content",
            },
            {
              id: "step-2",
              title: "Self-Reflection",
              content: "Reflect on your own attachment patterns:",
              type: "reflection",
            },
          ],
        },
        {
          id: "rp-2",
          title: "Boundary Setting",
          description: "Learn to establish healthy boundaries in relationships",
          duration: 20,
          difficulty: "Advanced",
          isCompleted: false,
          hasTimer: true,
          steps: [
            {
              id: "step-1",
              title: "Understanding Boundaries",
              content: `Boundaries are guidelines that define what you're comfortable with and how you want to be treated.\n\nHealthy boundaries:\n• Protect your physical and emotional well-being\n• Communicate your limits clearly\n• Are consistent and fair\n• Allow for flexibility when appropriate`,
              type: "content",
            },
          ],
        },
      ],
    },
  ];

  const handleTabChange = (tabId, path) => {
    navigate(path);
  };

  const handleStartPractice = (practice) => {
    // Convert today's practice to activity format
    const practiceActivity = {
      ...practice,
      steps: [
        {
          id: "step-1",
          title: practice?.title,
          content: practice?.description,
          type: "content",
        },
        {
          id: "step-2",
          title: "Practice Reflection",
          content: "How did this practice go for you?",
          type: "reflection",
        },
      ],
      hasTimer: true,
    };

    setSelectedActivity(practiceActivity);
    setShowActivityModal(true);
  };

  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const handleActivityComplete = (completionData) => {
    // Record completion in progress tracking
    const progressUpdate = progressTrackingService.recordActivityCompletion({
      id: completionData.activityId,
      title: completionData.activityTitle || selectedActivity?.title,
      category:
        completionData.category || selectedActivity?.category || "general",
      duration: completionData.duration || selectedActivity?.duration || 10,
      difficulty:
        completionData.difficulty || selectedActivity?.difficulty || "beginner",
      rating: completionData.rating,
      notes: completionData.notes,
      completionTime: completionData.completionTime || completionData.duration,
    });

    // Update local state
    setCompletedActivities(
      (prev) => new Set([...prev, completionData.activityId]),
    );
    setProgressStats(progressUpdate.progressData);

    // Show achievements if any
    if (
      progressUpdate.newAchievements &&
      progressUpdate.newAchievements.length > 0
    ) {
      // Could show achievement notification here
      console.log("New achievements unlocked:", progressUpdate.newAchievements);
    }

    setShowActivityModal(false);
    setSelectedActivity(null);
  };

  const handleCheckInComplete = (checkInData) => {
    console.log("Check-in completed:", checkInData);
    setShowCheckIn(false);
  };

  // Load progress data on component mount
  useEffect(() => {
    const stats = progressTrackingService.getProgressStats();
    setProgressStats(stats);

    // Load completed activities from progress tracking
    const completedIds = new Set(
      stats.recentActivity.map((activity) => activity.id),
    );
    setCompletedActivities(completedIds);

    // Load daily recommendations
    loadDailyRecommendations(stats);
  }, []);

  const loadDailyRecommendations = async (stats) => {
    try {
      const userProfile = { progressStats: stats };
      const recommendations = await aiInsightsService.getDailyRecommendations(
        userProfile,
        stats.recentActivity,
      );
      setDailyRecommendations(recommendations);
    } catch (error) {
      console.error("Error loading daily recommendations:", error);
    }
  };

  // Update categories with completion status and progress
  const updatedCategories = learningCategories?.map((category) => {
    const categoryStats = progressStats?.categoryCompletion?.find(
      (c) => c.category === category.id,
    );
    return {
      ...category,
      progress: categoryStats?.completion || category.progress,
      completedActivities:
        categoryStats?.completed || category.completedActivities,
      activities: category?.activities?.map((activity) => ({
        ...activity,
        isCompleted:
          activity?.isCompleted || completedActivities?.has(activity?.id),
      })),
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="lg:ml-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Learn & Practice
              </h1>
              <p className="text-muted-foreground mt-1">
                Develop your relationship skills through guided activities
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowCheckIn(true)}
              iconName="Heart"
              iconPosition="left"
              className="hidden sm:flex"
            >
              Check-In
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Today's Practice */}
            <section>
              <TodaysPracticeCard
                practice={todaysPractice}
                onStartPractice={handleStartPractice}
              />
            </section>

            {/* Quick Check-In Button (Mobile) */}
            <section className="sm:hidden">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowCheckIn(true)}
                iconName="Heart"
                iconPosition="left"
              >
                Mindful Check-In
              </Button>
            </section>

            {/* Learning Categories */}
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Learning Categories
                </h2>
                <p className="text-muted-foreground">
                  Choose a category to explore activities and exercises
                </p>
              </div>

              <div className="space-y-4 lg:space-y-6">
                {updatedCategories?.map((category) => (
                  <CategoryCard
                    key={category?.id}
                    category={category}
                    onSelectActivity={handleSelectActivity}
                  />
                ))}
              </div>
            </section>

            {/* Mindful Check-In Section */}
            {showCheckIn && (
              <section>
                <MindfulCheckIn onComplete={handleCheckInComplete} />
              </section>
            )}

            {/* Stats Section */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {progressStats?.totalActivities || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Activities Completed
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-success mb-1">
                  {progressStats?.currentStreak || 0}
                </div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-accent mb-1">
                  {progressStats?.achievementsUnlocked || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Achievements
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-warning mb-1">
                  {Math.round((progressStats?.totalTimeSpent || 0) / 60)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hours Practiced
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      {/* Activity Modal */}
      <ActivityModal
        activity={selectedActivity}
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setSelectedActivity(null);
        }}
        onComplete={handleActivityComplete}
      />
      {/* Bottom Navigation */}
      <BottomTabNavigation activeTab="learn" onTabChange={handleTabChange} />
    </div>
  );
};

export default LearnPractices;
