import React from "react";
import Icon from "../../../components/AppIcon";

const QuickActions = ({ onActionClick }) => {
  const quickActions = [
    {
      id: "daily-practice",
      title: "Daily Practice",
      description: "Complete today's relationship exercise",
      icon: "BookOpen",
      color: "text-primary",
      bgColor: "bg-primary/10",
      route: "/learn-practices",
      badge: "New",
    },
    {
      id: "mindful-checkin",
      title: "Mindful Check-in",
      description: "Reflect on your emotional state",
      icon: "Brain",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      route: "/mindful-checkin",
      estimatedTime: "3 min",
    },
    {
      id: "goal-setting",
      title: "Set Goals",
      description: "Define your relationship objectives",
      icon: "Target",
      color: "text-accent",
      bgColor: "bg-accent/10",
      route: "/goal-setting",
      badge: "2 pending",
    },
    {
      id: "progress-review",
      title: "Progress Review",
      description: "See your weekly development summary",
      icon: "BarChart3",
      color: "text-success",
      bgColor: "bg-success/10",
      route: "/progress-tracking",
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {quickActions?.map((action) => (
          <button
            key={action?.id}
            onClick={() => onActionClick && onActionClick(action)}
            className="bg-card rounded-xl p-4 border border-border shadow-soft hover:shadow-medium transition-gentle text-left relative"
          >
            {action?.badge && (
              <div className="absolute -top-1 -right-1 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                {action?.badge}
              </div>
            )}

            <div
              className={`w-10 h-10 ${action?.bgColor} rounded-lg flex items-center justify-center mb-3`}
            >
              <Icon name={action?.icon} size={20} className={action?.color} />
            </div>

            <h3 className="font-medium text-foreground mb-1 text-sm">
              {action?.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {action?.description}
            </p>

            {action?.estimatedTime && (
              <div className="flex items-center space-x-1">
                <Icon
                  name="Clock"
                  size={12}
                  className="text-muted-foreground"
                />
                <span className="text-xs text-muted-foreground">
                  {action?.estimatedTime}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
