/**
 * AI Insights Service - Core MVP Implementation
 * Provides personalized relationship insights and recommendations
 */

// Mock AI API for development - replace with actual Claude API in production
const MOCK_AI_RESPONSES = {
  personalizedInsights: [
    {
      id: "insight-1",
      type: "pattern_recognition",
      title: "Communication Pattern Detected",
      message:
        'Based on your assessment, you tend to withdraw during conflicts. This is common for people with your attachment style. Consider practicing "pause and return" - taking space when needed, but communicating when you\'ll reconnect.',
      priority: "high",
      category: "communication",
      actionItems: [
        'Practice saying "I need 20 minutes to process this, then let\'s talk"',
        "Set a specific time to return to difficult conversations",
        "Notice your body's stress signals before withdrawing",
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: "insight-2",
      type: "growth_opportunity",
      title: "Emotional Intelligence Growth",
      message:
        "Your self-awareness scores are strong, but there's room to grow in empathy. This is actually great news - empathy is a skill that improves with practice.",
      priority: "medium",
      category: "emotional_intelligence",
      actionItems: [
        'Try the "perspective-taking" exercise in your learning modules',
        "Practice reflecting back what others say before responding",
        'Ask "What might they be feeling?" in challenging interactions',
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "insight-3",
      type: "strength_recognition",
      title: "Relationship Readiness Strength",
      message:
        "Your commitment to personal growth is a huge relationship asset. Partners value someone who takes responsibility for their own development.",
      priority: "low",
      category: "self_awareness",
      actionItems: [
        "Share your growth journey with potential partners",
        "Continue your daily practices - consistency builds trust",
        "Celebrate your progress in small ways",
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ],

  dailyRecommendations: [
    {
      id: "rec-1",
      type: "practice",
      title: "Active Listening Challenge",
      description:
        "In your next conversation, practice reflecting back what you hear before sharing your own thoughts.",
      estimatedTime: 5,
      difficulty: "beginner",
      category: "communication",
    },
    {
      id: "rec-2",
      type: "reflection",
      title: "Emotional Check-In",
      description:
        "Take 3 minutes to identify and name what you're feeling right now, without judgment.",
      estimatedTime: 3,
      difficulty: "beginner",
      category: "emotional_intelligence",
    },
    {
      id: "rec-3",
      type: "exercise",
      title: "Gratitude for Growth",
      description:
        "Write down one thing you appreciate about your relationship development journey today.",
      estimatedTime: 2,
      difficulty: "beginner",
      category: "self_awareness",
    },
  ],
};

class AIInsightsService {
  constructor() {
    this.apiEndpoint = process.env.REACT_APP_AI_API_ENDPOINT || "mock";
    this.apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
  }

  /**
   * Generate personalized insights based on assessment results and activity history
   */
  async generatePersonalizedInsights(
    userProfile,
    assessmentResults,
    activityHistory = [],
  ) {
    try {
      if (this.apiEndpoint === "mock") {
        return this.getMockPersonalizedInsights(userProfile, assessmentResults);
      }

      // Actual Claude API implementation would go here
      const response = await this.callClaudeAPI({
        prompt: this.buildInsightsPrompt(
          userProfile,
          assessmentResults,
          activityHistory,
        ),
        maxTokens: 1000,
      });

      return this.parseInsightsResponse(response);
    } catch (error) {
      console.error("Error generating personalized insights:", error);
      return this.getMockPersonalizedInsights(userProfile, assessmentResults);
    }
  }

  /**
   * Get daily practice recommendations
   */
  async getDailyRecommendations(userProfile, recentActivities = []) {
    try {
      if (this.apiEndpoint === "mock") {
        return this.getMockDailyRecommendations(userProfile);
      }

      const response = await this.callClaudeAPI({
        prompt: this.buildRecommendationsPrompt(userProfile, recentActivities),
        maxTokens: 500,
      });

      return this.parseRecommendationsResponse(response);
    } catch (error) {
      console.error("Error getting daily recommendations:", error);
      return this.getMockDailyRecommendations(userProfile);
    }
  }

  /**
   * Analyze progress patterns and provide insights
   */
  async analyzeProgressPatterns(progressData, assessmentHistory = []) {
    try {
      const patterns = this.identifyProgressPatterns(progressData);
      const insights = await this.generatePatternInsights(
        patterns,
        assessmentHistory,
      );

      return {
        patterns,
        insights,
        recommendations: await this.generateProgressRecommendations(patterns),
      };
    } catch (error) {
      console.error("Error analyzing progress patterns:", error);
      return {
        patterns: [],
        insights: [],
        recommendations: [],
      };
    }
  }

  /**
   * Mock implementation for development
   */
  getMockPersonalizedInsights(userProfile, assessmentResults) {
    const insights = [...MOCK_AI_RESPONSES.personalizedInsights];

    // Customize insights based on assessment results
    if (assessmentResults?.answers) {
      const answers = assessmentResults.answers;

      // Communication style insight
      if (answers.communication_style === "avoidant_communication") {
        insights[0].message =
          "Your assessment shows you tend to avoid difficult conversations. This is protective but can prevent deeper connection. Consider starting with low-stakes practice conversations.";
      } else if (answers.communication_style === "reactive_communication") {
        insights[0].message =
          "You mentioned getting emotional in conflicts. This shows you care deeply! Learning to pause before responding can help you communicate your feelings more effectively.";
      }

      // Attachment pattern insight
      if (answers.attachment_patterns === "anxious_attachment") {
        insights.push({
          id: "insight-attachment",
          type: "pattern_recognition",
          title: "Attachment Awareness",
          message:
            "Your responses suggest an anxious attachment style. This means you value closeness but may worry about your partner pulling away. Understanding this pattern is the first step to developing security.",
          priority: "medium",
          category: "attachment",
          actionItems: [
            "Practice self-soothing when anxiety arises",
            "Communicate your needs clearly rather than seeking reassurance indirectly",
            "Work on building self-worth independent of your relationship",
          ],
          createdAt: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  getMockDailyRecommendations(userProfile) {
    return MOCK_AI_RESPONSES.dailyRecommendations;
  }

  /**
   * Build prompt for Claude API
   */
  buildInsightsPrompt(userProfile, assessmentResults, activityHistory) {
    return `
You are a relationship development AI assistant. Analyze the following user data and provide 2-3 personalized insights that will help them grow in their relationship capabilities.

User Assessment Results:
${JSON.stringify(assessmentResults, null, 2)}

Recent Activity History:
${JSON.stringify(activityHistory, null, 2)}

Provide insights in the following format:
- Type: pattern_recognition, growth_opportunity, or strength_recognition
- Title: Brief, encouraging title
- Message: Supportive insight (2-3 sentences)
- Priority: high, medium, or low
- Category: communication, emotional_intelligence, attachment, self_awareness, conflict_resolution
- Action Items: 2-3 specific, actionable steps

Focus on:
1. Patterns in their responses that indicate growth opportunities
2. Strengths to build upon
3. Practical next steps for development
4. Encouraging, non-judgmental tone
`;
  }

  buildRecommendationsPrompt(userProfile, recentActivities) {
    return `
Based on this user's profile and recent activities, suggest 3 daily micro-practices that would support their relationship development:

User Profile: ${JSON.stringify(userProfile, null, 2)}
Recent Activities: ${JSON.stringify(recentActivities, null, 2)}

Each recommendation should:
- Take 2-5 minutes to complete
- Be specific and actionable
- Build on their existing strengths
- Address their development areas
- Be appropriate for their current skill level

Format as simple practice suggestions with estimated time and difficulty level.
`;
  }

  /**
   * Identify patterns in user progress data
   */
  identifyProgressPatterns(progressData) {
    const patterns = [];

    // Analyze completion patterns
    if (progressData.completionRate) {
      if (progressData.completionRate > 0.8) {
        patterns.push({
          type: "high_engagement",
          strength: 0.9,
          description: "Consistently completes activities",
        });
      } else if (progressData.completionRate < 0.3) {
        patterns.push({
          type: "low_engagement",
          strength: 0.7,
          description: "Struggles with activity completion",
        });
      }
    }

    // Analyze streak patterns
    if (progressData.currentStreak) {
      if (progressData.currentStreak > 7) {
        patterns.push({
          type: "streak_building",
          strength: 0.8,
          description: "Building strong daily practice habits",
        });
      }
    }

    // Analyze category preferences
    if (progressData.categoryProgress) {
      const topCategory = Object.entries(progressData.categoryProgress).sort(
        ([, a], [, b]) => b - a,
      )[0];

      patterns.push({
        type: "category_preference",
        strength: 0.6,
        description: `Shows strong engagement with ${topCategory[0]} activities`,
        category: topCategory[0],
      });
    }

    return patterns;
  }

  /**
   * Generate insights based on identified patterns
   */
  async generatePatternInsights(patterns, assessmentHistory) {
    const insights = [];

    patterns.forEach((pattern) => {
      switch (pattern.type) {
        case "high_engagement":
          insights.push({
            type: "positive_feedback",
            message:
              "Your consistent engagement with activities shows real commitment to growth. This dedication will serve you well in relationships.",
            actionItems: [
              "Consider sharing your progress with friends or family",
              "Set slightly more challenging goals",
            ],
          });
          break;

        case "streak_building":
          insights.push({
            type: "habit_formation",
            message:
              "You're developing excellent daily practice habits. Consistency is key to lasting relationship skills.",
            actionItems: [
              "Plan for potential obstacles to your streak",
              "Celebrate your consistency",
            ],
          });
          break;

        case "category_preference":
          insights.push({
            type: "strength_building",
            message: `Your engagement with ${pattern.category} activities shows natural aptitude. Consider how you can apply these strengths to other areas.`,
            actionItems: [
              `Explore advanced ${pattern.category} topics`,
              "Practice these skills in daily interactions",
            ],
          });
          break;
      }
    });

    return insights;
  }

  /**
   * Generate recommendations based on progress patterns
   */
  async generateProgressRecommendations(patterns) {
    const recommendations = [];

    // Default recommendations based on common patterns
    recommendations.push({
      type: "skill_building",
      title: "Focus on Application",
      description:
        "Try using one skill you've learned in a real conversation today",
      priority: "medium",
    });

    // Pattern-specific recommendations
    patterns.forEach((pattern) => {
      if (pattern.type === "low_engagement") {
        recommendations.push({
          type: "engagement_boost",
          title: "Start Small",
          description:
            "Choose one 5-minute activity to complete today - small wins build momentum",
          priority: "high",
        });
      }
    });

    return recommendations;
  }

  /**
   * Call Claude API (placeholder for actual implementation)
   */
  async callClaudeAPI({ prompt, maxTokens = 1000 }) {
    // In a real implementation, this would call the Claude API
    // For now, return mock response
    return {
      content:
        "Mock AI response - implement actual Claude API integration here",
    };
  }

  /**
   * Parse API responses into structured data
   */
  parseInsightsResponse(response) {
    // Parse Claude API response into insights format
    // This is a placeholder - implement based on actual API response format
    return MOCK_AI_RESPONSES.personalizedInsights;
  }

  parseRecommendationsResponse(response) {
    // Parse Claude API response into recommendations format
    return MOCK_AI_RESPONSES.dailyRecommendations;
  }
}

export default new AIInsightsService();
