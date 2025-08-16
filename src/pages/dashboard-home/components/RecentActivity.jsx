import React from "react";
import Icon from "../../../components/AppIcon";

const RecentActivity = ({ activities, onActivityClick }) => {
  const mockActivities = [
    {
      id: 1,
      type: "practice",
      title: 'Completed "Active Listening" exercise',
      description: "Practiced mirror technique with partner feedback",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: "CheckCircle",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      id: 2,
      type: "milestone",
      title: "Reached 10-day streak!",
      description: "Consistency is key to building better relationships",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      icon: "Award",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      id: 3,
      type: "insight",
      title: "New insight unlocked",
      description: "Communication patterns analysis completed",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      icon: "Lightbulb",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const currentActivities = activities || mockActivities;

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Activity
        </h2>
        <button className="text-sm text-primary hover:text-primary/80 transition-gentle">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {currentActivities?.map((activity) => (
          <button
            key={activity?.id}
            onClick={() => onActivityClick && onActivityClick(activity)}
            className="w-full bg-card rounded-lg p-4 border border-border shadow-soft hover:shadow-medium transition-gentle text-left"
          >
            <div className="flex items-start space-x-3">
              <div
                className={`w-8 h-8 ${activity?.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <Icon
                  name={activity?.icon}
                  size={16}
                  className={activity?.color}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-foreground text-sm">
                    {activity?.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity?.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activity?.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
