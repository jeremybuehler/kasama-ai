/**
 * Assessment Scoring Service - MVP Implementation
 * Calculates relationship readiness scores and generates insights
 */

class AssessmentScoringService {
  constructor() {
    this.scoringWeights = {
      communication_style: 0.2,
      emotional_availability: 0.15,
      attachment_patterns: 0.2,
      intimacy_comfort: 0.15,
      conflict_resolution: 0.15,
      emotional_regulation: 0.15,
    };

    this.categoryMappings = {
      communication: ["communication_style", "conflict_resolution"],
      emotional_intelligence: [
        "emotional_availability",
        "emotional_regulation",
        "personal_growth",
      ],
      attachment: ["attachment_patterns", "intimacy_comfort", "trust_building"],
      relationship_readiness: [
        "relationship_expectations",
        "relationship_readiness",
        "future_planning",
      ],
      self_awareness: [
        "personal_boundaries",
        "love_languages",
        "social_integration",
      ],
    };
  }

  /**
   * Calculate overall relationship readiness score
   */
  calculateOverallScore(answers) {
    if (!answers || Object.keys(answers).length === 0) {
      return { score: 0, breakdown: {}, insights: [] };
    }

    const scores = this.calculateCategoryScores(answers);
    const overallScore = this.calculateWeightedAverage(scores);
    const insights = this.generateScoreInsights(scores, overallScore);

    return {
      score: Math.round(overallScore),
      breakdown: scores,
      insights,
      completedAt: new Date().toISOString(),
      totalQuestions: Object.keys(answers).length,
    };
  }

  /**
   * Calculate scores for each category
   */
  calculateCategoryScores(answers) {
    const categoryScores = {};

    Object.entries(this.categoryMappings).forEach(([category, questions]) => {
      const relevantAnswers = questions
        .filter((q) => answers[q])
        .map((q) => answers[q]);

      if (relevantAnswers.length > 0) {
        const categoryScore =
          relevantAnswers.reduce((sum, answer) => {
            return sum + this.getAnswerScore(answer);
          }, 0) / relevantAnswers.length;

        categoryScores[category] = Math.round(categoryScore);
      } else {
        categoryScores[category] = 50; // Default neutral score
      }
    });

    return categoryScores;
  }

  /**
   * Get numeric score for individual answer
   */
  getAnswerScore(answerValue) {
    const scoreMap = {
      // Communication Style
      direct_communication: 85,
      reflective_communication: 75,
      avoidant_communication: 45,
      reactive_communication: 55,

      // Emotional Availability
      emotionally_supportive: 90,
      solution_focused: 70,
      overwhelmed_response: 40,
      distraction_focused: 50,

      // Attachment Patterns
      secure_independence: 90,
      anxious_attachment: 55,
      avoidant_attachment: 60,
      disorganized_attachment: 45,

      // Intimacy Comfort
      high_vulnerability: 85,
      moderate_vulnerability: 75,
      situational_vulnerability: 65,
      low_vulnerability: 45,

      // Conflict Resolution
      proactive_resolution: 85,
      passive_resolution: 60,
      delayed_resolution: 65,
      avoidant_resolution: 40,

      // Personal Growth
      growth_oriented: 90,
      defensive_but_receptive: 70,
      defensive_resistant: 45,
      agreeable_but_stuck: 55,

      // Emotional Regulation
      healthy_communication: 90,
      stress_reactive: 50,
      stress_isolating: 55,
      stress_seeking: 60,

      // Trust Building
      gradual_trust_building: 85,
      reciprocal_trust_building: 80,
      high_initial_trust: 65,
      cautious_trust_building: 70,

      // Relationship Expectations
      independence_concern: 65,
      adequacy_concern: 60,
      vulnerability_concern: 55,
      compatibility_concern: 70,

      // Relationship Priorities
      emotional_connection: 85,
      shared_vision: 80,
      companionship_joy: 75,
      security_stability: 75,

      // Love Languages
      physical_touch: 75,
      quality_time: 80,
      gifts_gestures: 70,
      acts_of_service: 75,

      // Future Planning
      collaborative_planning: 85,
      gradual_planning: 75,
      planning_anxiety: 55,
      individual_planning: 60,

      // Social Integration
      high_integration: 80,
      moderate_integration: 75,
      low_integration: 65,
      compartmentalized: 60,

      // Personal Boundaries
      assertive_boundaries: 90,
      passive_boundaries: 50,
      reactive_boundaries: 55,
      flexible_boundaries: 60,

      // Relationship Readiness
      fully_ready: 90,
      mostly_ready: 80,
      developing_readiness: 65,
      uncertain_readiness: 50,
    };

    return scoreMap[answerValue] || 60; // Default score if not found
  }

  /**
   * Calculate weighted average of category scores
   */
  calculateWeightedAverage(categoryScores) {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(categoryScores).forEach(([category, score]) => {
      const weight = this.getCategoryWeight(category);
      weightedSum += score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Get weight for category in overall score calculation
   */
  getCategoryWeight(category) {
    const weights = {
      communication: 0.25,
      emotional_intelligence: 0.25,
      attachment: 0.2,
      relationship_readiness: 0.15,
      self_awareness: 0.15,
    };

    return weights[category] || 0.15;
  }

  /**
   * Generate insights based on scores
   */
  generateScoreInsights(categoryScores, overallScore) {
    const insights = [];

    // Overall score insight
    if (overallScore >= 80) {
      insights.push({
        type: "strength",
        category: "overall",
        title: "Strong Relationship Readiness",
        message:
          "You demonstrate strong relationship skills and emotional awareness. You're well-prepared for a committed partnership.",
        priority: "positive",
      });
    } else if (overallScore >= 65) {
      insights.push({
        type: "growth",
        category: "overall",
        title: "Good Foundation with Growth Opportunities",
        message:
          "You have a solid foundation for relationships with some areas for continued development. Focus on your growth areas for even stronger connections.",
        priority: "medium",
      });
    } else {
      insights.push({
        type: "development",
        category: "overall",
        title: "Developing Relationship Skills",
        message:
          "You're on a journey of relationship development. Focusing on key skill areas will significantly improve your relationship experiences.",
        priority: "high",
      });
    }

    // Category-specific insights
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score >= 80) {
        insights.push({
          type: "strength",
          category,
          title: `${this.getCategoryDisplayName(category)} Strength`,
          message: `Your ${category.replace("_", " ")} skills are a real asset in relationships.`,
          priority: "positive",
        });
      } else if (score < 60) {
        insights.push({
          type: "opportunity",
          category,
          title: `${this.getCategoryDisplayName(category)} Development`,
          message: `There's significant opportunity to grow your ${category.replace("_", " ")} skills.`,
          priority: "high",
          recommendations: this.getCategoryRecommendations(category),
        });
      }
    });

    return insights;
  }

  /**
   * Get display name for category
   */
  getCategoryDisplayName(category) {
    const displayNames = {
      communication: "Communication",
      emotional_intelligence: "Emotional Intelligence",
      attachment: "Attachment Security",
      relationship_readiness: "Relationship Readiness",
      self_awareness: "Self-Awareness",
    };

    return displayNames[category] || category;
  }

  /**
   * Get recommendations for improving category scores
   */
  getCategoryRecommendations(category) {
    const recommendations = {
      communication: [
        "Practice active listening in daily conversations",
        'Learn to express emotions using "I" statements',
        "Take a communication skills workshop or course",
      ],
      emotional_intelligence: [
        "Start a daily emotion-checking practice",
        "Practice empathy by trying to understand others' perspectives",
        "Learn emotional regulation techniques like deep breathing",
      ],
      attachment: [
        "Explore your attachment style and its origins",
        "Practice being vulnerable in safe relationships",
        "Work on building secure attachment patterns",
      ],
      relationship_readiness: [
        "Clarify your relationship goals and values",
        "Work on personal growth and self-improvement",
        "Practice dating skills and social interactions",
      ],
      self_awareness: [
        "Start a daily journaling practice",
        "Ask for feedback from trusted friends",
        "Take personality assessments to understand yourself better",
      ],
    };

    return recommendations[category] || [];
  }

  /**
   * Compare scores over time
   */
  compareScores(currentResults, previousResults) {
    if (!previousResults) {
      return { isFirstAssessment: true };
    }

    const improvements = {};
    const declines = {};

    Object.entries(currentResults.breakdown).forEach(
      ([category, currentScore]) => {
        const previousScore = previousResults.breakdown[category];
        if (previousScore) {
          const change = currentScore - previousScore;
          if (change > 5) {
            improvements[category] = change;
          } else if (change < -5) {
            declines[category] = Math.abs(change);
          }
        }
      },
    );

    const overallChange = currentResults.score - previousResults.score;

    return {
      overallChange,
      improvements,
      declines,
      timespan: this.calculateTimespan(
        previousResults.completedAt,
        currentResults.completedAt,
      ),
    };
  }

  /**
   * Calculate time between assessments
   */
  calculateTimespan(previousDate, currentDate) {
    const diff = new Date(currentDate) - new Date(previousDate);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 7) {
      return `${days} days`;
    } else if (days < 30) {
      return `${Math.floor(days / 7)} weeks`;
    } else {
      return `${Math.floor(days / 30)} months`;
    }
  }

  /**
   * Generate shareable results summary
   */
  generateShareableResults(results) {
    const { score, breakdown } = results;

    const topStrengths = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([category, score]) => ({
        category: this.getCategoryDisplayName(category),
        score,
      }));

    const growthAreas = Object.entries(breakdown)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .map(([category, score]) => ({
        category: this.getCategoryDisplayName(category),
        score,
      }));

    return {
      overallScore: score,
      readinessLevel: this.getReadinessLevel(score),
      topStrengths,
      growthAreas,
      message: this.getShareableMessage(score),
      completedAt: results.completedAt,
    };
  }

  /**
   * Get readiness level description
   */
  getReadinessLevel(score) {
    if (score >= 80) return "High Readiness";
    if (score >= 65) return "Moderate Readiness";
    if (score >= 50) return "Developing Readiness";
    return "Building Foundation";
  }

  /**
   * Get shareable message based on score
   */
  getShareableMessage(score) {
    if (score >= 80) {
      return "Ready for deep, meaningful connections! 💕";
    } else if (score >= 65) {
      return "Building strong relationship skills! 🌱";
    } else {
      return "On a journey of relationship growth! ✨";
    }
  }
}

export default new AssessmentScoringService();
