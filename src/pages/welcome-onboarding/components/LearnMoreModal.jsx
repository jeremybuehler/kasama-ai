import React, { useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const LearnMoreModal = ({ isOpen = false, onClose, onStartJourney }) => {
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

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const benefits = [
    {
      icon: "Brain",
      title: "AI-Powered Intelligence",
      description:
        "Our advanced AI analyzes your responses to provide personalized relationship insights and recommendations tailored to your unique situation.",
    },
    {
      icon: "Target",
      title: "Goal-Oriented Growth",
      description:
        "Set meaningful relationship goals and track your progress with our comprehensive development journey visualization system.",
    },
    {
      icon: "Calendar",
      title: "Daily Practice",
      description:
        "Receive daily practice recommendations and mindful check-in exercises designed to improve your communication and emotional intelligence.",
    },
    {
      icon: "BarChart3",
      title: "Progress Analytics",
      description:
        "Monitor your growth across key areas including communication skills, emotional intelligence, and relationship patterns with detailed analytics.",
    },
    {
      icon: "Users",
      title: "Relationship Readiness",
      description:
        "Understand your readiness for meaningful connections through our comprehensive assessment covering attachment styles, communication patterns, and emotional awareness.",
    },
    {
      icon: "Shield",
      title: "Privacy First",
      description:
        "Your personal information and assessment results are kept completely private and secure. We never share your data with third parties.",
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
      onClick={handleBackdropClick}
    >
      {/* Mobile: Full screen modal */}
      <div className="lg:hidden w-full bg-card rounded-t-2xl animate-slide-in max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            About Kasama
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <p className="text-muted-foreground leading-relaxed">
              Kasama is a comprehensive relationship intelligence platform
              designed to help you build deeper, more meaningful connections
              through personalized insights and guided development.
            </p>
          </div>

          <div className="space-y-6">
            {benefits?.map((benefit, index) => (
              <div key={index} className="flex space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon
                    name={benefit?.icon}
                    size={20}
                    className="text-primary"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {benefit?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit?.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            variant="default"
            fullWidth
            onClick={() => {
              onClose();
              onStartJourney();
            }}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
      {/* Desktop: Centered modal */}
      <div className="hidden lg:block w-full max-w-4xl bg-card rounded-2xl shadow-large animate-fade-in max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-border">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              About Kasama
            </h2>
            <p className="text-muted-foreground mt-2">
              Your relationship intelligence platform
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Kasama is a comprehensive relationship intelligence platform
              designed to help you build deeper, more meaningful connections
              through personalized insights and guided development.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {benefits?.map((benefit, index) => (
              <div
                key={index}
                className="flex space-x-4 p-4 rounded-lg hover:bg-muted transition-gentle"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon
                    name={benefit?.icon}
                    size={24}
                    className="text-primary"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {benefit?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit?.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border">
          <div className="flex items-center justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                onClose();
                onStartJourney();
              }}
              iconName="ArrowRight"
              iconPosition="right"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnMoreModal;
