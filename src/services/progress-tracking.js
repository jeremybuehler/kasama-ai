/**
 * Progress Tracking Service - MVP Implementation
 * Tracks user progress, streaks, achievements, and learning metrics
 */

class ProgressTrackingService {
  constructor() {
    this.storageKey = "kasama_progress_data";
    this.achievementsKey = "kasama_achievements";
    this.streakKey = "kasama_streak_data";
  }

  /**
   * Initialize user progress data
   */
  initializeProgress() {
    const existingData = this.getProgressData();
    if (!existingData) {
      const initialData = {
        userId: "user_" + Date.now(),
        createdAt: new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
        totalActivitiesCompleted: 0,
        totalTimeSpent: 0, // in minutes
        currentStreak: 0,
        longestStreak: 0,
        categoryProgress: {
          communication: { completed: 0, total: 12, timeSpent: 0 },
          emotional_intelligence: { completed: 0, total: 11, timeSpent: 0 },
          relationship_patterns: { completed: 0, total: 10, timeSpent: 0 },
          conflict_resolution: { completed: 0, total: 8, timeSpent: 0 },
          self_awareness: { completed: 0, total: 15, timeSpent: 0 },
        },
        weeklyGoals: {
          activitiesPerWeek: 5,
          minutesPerWeek: 60,
          currentWeekProgress: { activities: 0, minutes: 0 },
        },
        achievements: [],
        activityHistory: [],
        assessmentHistory: [],
      };

      this.saveProgressData(initialData);
      return initialData;
    }
    return existingData;
  }

  /**
   * Record activity completion
   */
  recordActivityCompletion(activityData) {
    const progressData = this.getProgressData() || this.initializeProgress();
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Create activity record
    const activityRecord = {
      id: activityData.id,
      title: activityData.title,
      category: activityData.category,
      duration: activityData.duration || 0,
      difficulty: activityData.difficulty,
      completedAt: now.toISOString(),
      rating: activityData.rating || null,
      notes: activityData.notes || "",
      completionTime: activityData.completionTime || activityData.duration,
    };

    // Update totals
    progressData.totalActivitiesCompleted += 1;
    progressData.totalTimeSpent += activityRecord.completionTime;
    progressData.lastActiveDate = now.toISOString();

    // Update category progress
    if (progressData.categoryProgress[activityData.category]) {
      progressData.categoryProgress[activityData.category].completed += 1;
      progressData.categoryProgress[activityData.category].timeSpent +=
        activityRecord.completionTime;
    }

    // Update weekly goals
    this.updateWeeklyProgress(progressData, activityRecord.completionTime);

    // Update streak
    this.updateStreak(progressData, today);

    // Add to activity history
    progressData.activityHistory.unshift(activityRecord);

    // Keep only last 100 activities
    if (progressData.activityHistory.length > 100) {
      progressData.activityHistory = progressData.activityHistory.slice(0, 100);
    }

    // Check for new achievements
    const newAchievements = this.checkAchievements(progressData);
    progressData.achievements.push(...newAchievements);

    this.saveProgressData(progressData);

    return {
      progressData,
      newAchievements,
      activityRecord,
    };
  }

  /**
   * Record assessment completion
   */
  recordAssessmentCompletion(assessmentResults) {
    const progressData = this.getProgressData() || this.initializeProgress();

    const assessmentRecord = {
      id: "assessment_" + Date.now(),
      type: assessmentResults.assessmentType || "Relationship Readiness",
      score: assessmentResults.score,
      breakdown: assessmentResults.breakdown,
      completedAt: new Date().toISOString(),
      totalQuestions: assessmentResults.totalQuestions,
      timeToComplete: assessmentResults.timeToComplete || null,
    };

    progressData.assessmentHistory.unshift(assessmentRecord);

    // Keep only last 10 assessments
    if (progressData.assessmentHistory.length > 10) {
      progressData.assessmentHistory = progressData.assessmentHistory.slice(
        0,
        10,
      );
    }

    // Check for assessment-related achievements
    const newAchievements = this.checkAssessmentAchievements(progressData);
    progressData.achievements.push(...newAchievements);

    this.saveProgressData(progressData);

    return {
      progressData,
      newAchievements,
      assessmentRecord,
    };
  }

  /**
   * Update weekly progress tracking
   */
  updateWeeklyProgress(progressData, activityDuration) {
    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    const lastUpdateWeek = progressData.weeklyGoals.lastUpdateWeek;

    // Reset weekly progress if it's a new week
    if (lastUpdateWeek && lastUpdateWeek !== currentWeek) {
      progressData.weeklyGoals.currentWeekProgress = {
        activities: 0,
        minutes: 0,
      };
    }

    progressData.weeklyGoals.currentWeekProgress.activities += 1;
    progressData.weeklyGoals.currentWeekProgress.minutes += activityDuration;
    progressData.weeklyGoals.lastUpdateWeek = currentWeek;
  }

  /**
   * Update streak tracking
   */
  updateStreak(progressData, today) {
    const lastActiveDate = progressData.lastActiveDate
      ? progressData.lastActiveDate.split("T")[0]
      : null;

    if (!lastActiveDate || lastActiveDate === today) {
      // Same day or first activity
      progressData.currentStreak = Math.max(1, progressData.currentStreak);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActiveDate === yesterdayStr) {
        // Consecutive day - extend streak
        progressData.currentStreak += 1;
      } else {
        // Streak broken - reset
        progressData.currentStreak = 1;
      }
    }

    // Update longest streak
    progressData.longestStreak = Math.max(
      progressData.longestStreak,
      progressData.currentStreak,
    );
  }

  /**
   * Check for new achievements
   */
  checkAchievements(progressData) {
    const newAchievements = [];
    const existingAchievementIds = new Set(
      progressData.achievements.map((a) => a.id),
    );

    const achievements = [
      {
        id: "first_activity",
        title: "First Steps",
        description: "Completed your first learning activity",
        icon: "🌱",
        condition: () => progressData.totalActivitiesCompleted >= 1,
      },
      {
        id: "week_streak",
        title: "Week Warrior",
        description: "Maintained a 7-day practice streak",
        icon: "🔥",
        condition: () => progressData.currentStreak >= 7,
      },
      {
        id: "month_streak",
        title: "Monthly Master",
        description: "Maintained a 30-day practice streak",
        icon: "👑",
        condition: () => progressData.currentStreak >= 30,
      },
      {
        id: "communication_expert",
        title: "Communication Expert",
        description: "Completed all communication activities",
        icon: "💬",
        condition: () =>
          progressData.categoryProgress.communication?.completed >= 12,
      },
      {
        id: "emotional_intelligence_master",
        title: "EQ Master",
        description: "Completed all emotional intelligence activities",
        icon: "❤️",
        condition: () =>
          progressData.categoryProgress.emotional_intelligence?.completed >= 11,
      },
      {
        id: "relationship_ready",
        title: "Relationship Ready",
        description: "Achieved high readiness score (80+)",
        icon: "💕",
        condition: () => {
          const latestAssessment = progressData.assessmentHistory[0];
          return latestAssessment && latestAssessment.score >= 80;
        },
      },
      {
        id: "dedicated_learner",
        title: "Dedicated Learner",
        description: "Completed 25 learning activities",
        icon: "📚",
        condition: () => progressData.totalActivitiesCompleted >= 25,
      },
      {
        id: "time_invested",
        title: "Time Investor",
        description: "Spent 5 hours learning relationship skills",
        icon: "⏰",
        condition: () => progressData.totalTimeSpent >= 300, // 5 hours in minutes
      },
      {
        id: "goal_achiever",
        title: "Goal Achiever",
        description: "Met weekly goal 4 weeks in a row",
        icon: "🎯",
        condition: () => this.checkWeeklyGoalStreak(progressData),
      },
    ];

    achievements.forEach((achievement) => {
      if (
        !existingAchievementIds.has(achievement.id) &&
        achievement.condition()
      ) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
        });
      }
    });

    return newAchievements;
  }

  /**
   * Check for assessment-specific achievements
   */
  checkAssessmentAchievements(progressData) {
    const newAchievements = [];
    const existingAchievementIds = new Set(
      progressData.achievements.map((a) => a.id),
    );

    const assessmentAchievements = [
      {
        id: "first_assessment",
        title: "Self Discovery",
        description: "Completed your first relationship assessment",
        icon: "🔍",
        condition: () => progressData.assessmentHistory.length >= 1,
      },
      {
        id: "progress_tracker",
        title: "Progress Tracker",
        description: "Completed 3 assessments to track growth",
        icon: "📈",
        condition: () => progressData.assessmentHistory.length >= 3,
      },
      {
        id: "improvement_focused",
        title: "Improvement Focused",
        description: "Showed improvement between assessments",
        icon: "⬆️",
        condition: () => this.checkAssessmentImprovement(progressData),
      },
    ];

    assessmentAchievements.forEach((achievement) => {
      if (
        !existingAchievementIds.has(achievement.id) &&
        achievement.condition()
      ) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
        });
      }
    });

    return newAchievements;
  }

  /**
   * Check if user has improved between assessments
   */
  checkAssessmentImprovement(progressData) {
    if (progressData.assessmentHistory.length < 2) return false;

    const latest = progressData.assessmentHistory[0];
    const previous = progressData.assessmentHistory[1];

    return latest.score > previous.score;
  }

  /**
   * Check weekly goal achievement streak
   */
  checkWeeklyGoalStreak(progressData) {
    // Simplified check - would need more sophisticated tracking in production
    const weeklyGoal = progressData.weeklyGoals.activitiesPerWeek;
    const recentActivities = progressData.activityHistory.slice(
      0,
      weeklyGoal * 4,
    );

    return recentActivities.length >= weeklyGoal * 4;
  }

  /**
   * Get progress statistics
   */
  getProgressStats() {
    const progressData = this.getProgressData() || this.initializeProgress();

    const categoryCompletion = Object.entries(
      progressData.categoryProgress,
    ).map(([category, data]) => ({
      category,
      completion: Math.round((data.completed / data.total) * 100),
      completed: data.completed,
      total: data.total,
      timeSpent: data.timeSpent,
    }));

    const weeklyProgress = progressData.weeklyGoals.currentWeekProgress;
    const weeklyGoal = progressData.weeklyGoals.activitiesPerWeek;

    return {
      totalActivities: progressData.totalActivitiesCompleted,
      totalTimeSpent: progressData.totalTimeSpent,
      currentStreak: progressData.currentStreak,
      longestStreak: progressData.longestStreak,
      achievementsUnlocked: progressData.achievements.length,
      categoryCompletion,
      weeklyProgress: {
        activities: weeklyProgress.activities,
        goal: weeklyGoal,
        completion: Math.round((weeklyProgress.activities / weeklyGoal) * 100),
      },
      recentActivity: progressData.activityHistory.slice(0, 10),
      assessmentProgress: this.getAssessmentProgress(progressData),
    };
  }

  /**
   * Get assessment progress overview
   */
  getAssessmentProgress(progressData) {
    if (progressData.assessmentHistory.length === 0) {
      return { hasAssessments: false };
    }

    const latest = progressData.assessmentHistory[0];
    const improvement =
      progressData.assessmentHistory.length > 1
        ? latest.score - progressData.assessmentHistory[1].score
        : 0;

    return {
      hasAssessments: true,
      latestScore: latest.score,
      latestDate: latest.completedAt,
      improvement,
      totalAssessments: progressData.assessmentHistory.length,
      averageScore: Math.round(
        progressData.assessmentHistory.reduce((sum, a) => sum + a.score, 0) /
          progressData.assessmentHistory.length,
      ),
    };
  }

  /**
   * Set weekly goals
   */
  setWeeklyGoals(activitiesPerWeek, minutesPerWeek) {
    const progressData = this.getProgressData() || this.initializeProgress();

    progressData.weeklyGoals.activitiesPerWeek = activitiesPerWeek;
    progressData.weeklyGoals.minutesPerWeek = minutesPerWeek;

    this.saveProgressData(progressData);
    return progressData.weeklyGoals;
  }

  /**
   * Get activity history with filtering
   */
  getActivityHistory(category = null, limit = 50) {
    const progressData = this.getProgressData() || this.initializeProgress();
    let activities = progressData.activityHistory;

    if (category) {
      activities = activities.filter((a) => a.category === category);
    }

    return activities.slice(0, limit);
  }

  /**
   * Get achievements
   */
  getAchievements() {
    const progressData = this.getProgressData() || this.initializeProgress();
    return progressData.achievements.sort(
      (a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt),
    );
  }

  /**
   * Utility functions
   */
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
    );
  }

  getProgressData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error reading progress data:", error);
      return null;
    }
  }

  saveProgressData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving progress data:", error);
    }
  }

  /**
   * Export progress data for sharing/backup
   */
  exportProgressData() {
    const progressData = this.getProgressData();
    if (!progressData) return null;

    return {
      ...progressData,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
  }

  /**
   * Reset all progress data (use with caution)
   */
  resetProgress() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.achievementsKey);
    localStorage.removeItem(this.streakKey);
    return this.initializeProgress();
  }
}

export default new ProgressTrackingService();
