import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const CompletionModal = ({ isOpen, onClose, assessmentResults }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleViewDashboard = () => {
    navigate("/dashboard-home");
  };

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-xl shadow-large max-w-md w-full animate-fade-in">
        {/* Celebration Header */}
        <div className="text-center p-6 border-b border-border">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Check" size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Assessment Complete!
          </h2>
          <p className="text-muted-foreground text-sm">
            Thank you for taking the time to complete your relationship
            assessment. Your journey to deeper connections begins now.
          </p>
        </div>

        {/* Results Summary */}
        <div className="p-6 space-y-4">
          {/* Score Display */}
          {assessmentResults?.score && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">
                  {assessmentResults.score}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {assessmentResults.shareableResults?.readinessLevel ||
                  "Relationship Readiness Score"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {assessmentResults.shareableResults?.message ||
                  "Your personalized insights are ready!"}
              </p>
            </div>
          )}

          {/* Top Strengths */}
          {assessmentResults?.shareableResults?.topStrengths && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <h4 className="font-medium text-success mb-2 flex items-center">
                <Icon name="Star" size={16} className="mr-2" />
                Your Strengths
              </h4>
              <div className="space-y-1 text-sm">
                {assessmentResults.shareableResults.topStrengths.map(
                  (strength, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-foreground">
                        {strength.category}
                      </span>
                      <span className="text-success font-medium">
                        {strength.score}%
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* New Achievements */}
          {assessmentResults?.newAchievements &&
            assessmentResults.newAchievements.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <h4 className="font-medium text-warning mb-2 flex items-center">
                  <Icon name="Award" size={16} className="mr-2" />
                  New Achievements Unlocked!
                </h4>
                <div className="space-y-1 text-sm">
                  {assessmentResults.newAchievements.map(
                    (achievement, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-lg">{achievement.icon}</span>
                        <span className="text-foreground">
                          {achievement.title}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-2">
              Assessment Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Questions Answered:
                </span>
                <span className="font-medium text-foreground">
                  {assessmentResults?.totalAnswered || 15}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Rate:</span>
                <span className="font-medium text-success">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assessment Type:</span>
                <span className="font-medium text-foreground">
                  Relationship Readiness
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon
                name="Lightbulb"
                size={20}
                className="text-primary mt-0.5"
              />
              <div>
                <h4 className="font-medium text-primary mb-1">What's Next?</h4>
                <p className="text-sm text-foreground">
                  Your personalized insights and daily practices are now
                  available on your dashboard. Start your growth journey today!
                </p>
                {assessmentResults?.insights &&
                  assessmentResults.insights.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      🎯 {assessmentResults.insights.length} personalized
                      insights waiting for you
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-border space-y-3">
          <Button
            fullWidth
            onClick={handleViewDashboard}
            iconName="ArrowRight"
            iconPosition="right"
          >
            View My Dashboard
          </Button>
          <Button variant="outline" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
