import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import ShareResults from "../../../components/ShareResults";

const DailyInsightCard = ({ insights = [], assessmentResults, onViewMore }) => {
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  const mockInsights = [
    {
      id: "daily-1",
      title: "Focus on Active Listening Today",
      content: `Based on your assessment, you show strong empathy but could benefit from deeper listening practices. Try the "Mirror and Validate" technique in your next conversation.\n\nRemember: True connection happens when we listen not just to respond, but to understand.`,
      category: "Communication",
      icon: "Ear",
      actionText: "Try Today's Practice",
      estimatedTime: "5 min",
      priority: "medium",
      actionItems: [
        "In your next conversation, repeat back what you heard before responding",
        'Ask "What I\'m hearing is... is that right?"',
        "Notice when you start planning your response while others are talking",
      ],
    },
    {
      id: "daily-2",
      title: "Emotional Check-In Practice",
      content:
        "Take a moment to identify what you're feeling right now. Emotional awareness is the foundation of emotional intelligence in relationships.",
      category: "Emotional Intelligence",
      icon: "Heart",
      actionText: "Check In Now",
      estimatedTime: "3 min",
      priority: "high",
      actionItems: [
        "Name 3 emotions you're currently experiencing",
        "Rate their intensity from 1-10",
        "Consider what triggered these feelings",
      ],
    },
    {
      id: "daily-3",
      title: "Gratitude for Growth",
      content:
        "Acknowledge one thing you appreciate about your relationship development journey today. Celebrating progress builds momentum.",
      category: "Self-Awareness",
      icon: "Star",
      actionText: "Practice Gratitude",
      estimatedTime: "2 min",
      priority: "low",
      actionItems: [
        "Write down one relationship skill you've improved recently",
        "Share appreciation with someone who supports your growth",
        "Notice how acknowledging progress feels",
      ],
    },
  ];

  const displayInsights = insights.length > 0 ? insights : mockInsights;
  const currentInsight =
    displayInsights[currentInsightIndex] || mockInsights[0];

  const hasMultipleInsights = displayInsights.length > 1;

  const handleNextInsight = () => {
    setCurrentInsightIndex((prev) =>
      prev === displayInsights.length - 1 ? 0 : prev + 1,
    );
  };

  const handlePreviousInsight = () => {
    setCurrentInsightIndex((prev) =>
      prev === 0 ? displayInsights.length - 1 : prev - 1,
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-primary bg-primary/10 border-primary/20";
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Today's Insight
        </h2>
        <div className="flex items-center space-x-2">
          {assessmentResults && (
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Share your progress"
            >
              <Icon name="Share" size={16} />
            </button>
          )}
          {hasMultipleInsights && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePreviousInsight}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                disabled={displayInsights.length <= 1}
              >
                <Icon name="ChevronLeft" size={16} />
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {currentInsightIndex + 1} of {displayInsights.length}
              </span>
              <button
                onClick={handleNextInsight}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                disabled={displayInsights.length <= 1}
              >
                <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Insight Content */}
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon
            name={currentInsight?.icon}
            size={24}
            className="text-primary"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(currentInsight?.priority)}`}
            >
              {currentInsight?.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentInsight?.estimatedTime}
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            {currentInsight?.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {currentInsight?.content?.split("\n")?.[0]}
          </p>

          {/* Action Items */}
          {currentInsight?.actionItems &&
            currentInsight.actionItems.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-foreground mb-2">
                  Quick Actions:
                </h4>
                <ul className="space-y-1">
                  {currentInsight.actionItems.slice(0, 2).map((item, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-start space-x-2"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <Button
            variant="outline"
            size="sm"
            onClick={onViewMore}
            iconName="ArrowRight"
            iconPosition="right"
            className="text-sm"
          >
            {currentInsight?.actionText}
          </Button>
        </div>
      </div>

      {/* Assessment Score Display */}
      {assessmentResults?.score && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Your Readiness Score
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-primary">
                  {assessmentResults.score}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
                <span className="text-xs text-success">
                  {assessmentResults.shareableResults?.readinessLevel}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center space-x-1"
            >
              <Icon name="Share" size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-large max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ShareResults
                results={assessmentResults}
                type="assessment"
                onClose={() => setShowShareModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyInsightCard;
