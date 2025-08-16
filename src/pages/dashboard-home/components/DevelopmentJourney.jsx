import React from "react";
import Icon from "../../../components/AppIcon";
import ProgressBar from "../../../components/ui/ProgressBar";

const DevelopmentJourney = ({ journeyData, onSkillClick }) => {
  const mockJourneyData = [
    {
      id: "communication",
      title: "Communication Skills",
      description: "Active listening and clear expression",
      progress: 72,
      level: "Intermediate",
      icon: "MessageCircle",
      color: "primary",
      nextMilestone: "Advanced Communicator",
      practicesCompleted: 18,
      totalPractices: 25,
    },
    {
      id: "emotional",
      title: "Emotional Intelligence",
      description: "Understanding and managing emotions",
      progress: 58,
      level: "Developing",
      icon: "Heart",
      color: "secondary",
      nextMilestone: "Emotionally Aware",
      practicesCompleted: 12,
      totalPractices: 20,
    },
    {
      id: "patterns",
      title: "Relationship Patterns",
      description: "Recognizing and improving relationship dynamics",
      progress: 45,
      level: "Beginner",
      icon: "Users",
      color: "accent",
      nextMilestone: "Pattern Recognition",
      practicesCompleted: 9,
      totalPractices: 20,
    },
  ];

  const currentJourneyData = journeyData || mockJourneyData;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Development Journey
        </h2>
        <button className="text-sm text-primary hover:text-primary/80 transition-gentle">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {currentJourneyData?.map((skill) => (
          <button
            key={skill?.id}
            onClick={() => onSkillClick && onSkillClick(skill)}
            className="w-full bg-card rounded-xl p-4 border border-border shadow-soft hover:shadow-medium transition-gentle text-left"
          >
            <div className="flex items-start space-x-4">
              <div
                className={`w-10 h-10 bg-${skill?.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <Icon
                  name={skill?.icon}
                  size={20}
                  className={`text-${skill?.color}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-foreground">
                    {skill?.title}
                  </h3>
                  <span className="text-sm font-medium text-foreground">
                    {skill?.progress}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {skill?.description}
                </p>

                <ProgressBar
                  value={skill?.progress}
                  variant={skill?.color}
                  showPercentage={false}
                  size="sm"
                  className="mb-3"
                />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {skill?.practicesCompleted}/{skill?.totalPractices}{" "}
                    practices completed
                  </span>
                  <span
                    className={`px-2 py-1 bg-${skill?.color}/10 text-${skill?.color} rounded-full font-medium`}
                  >
                    {skill?.level}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DevelopmentJourney;
