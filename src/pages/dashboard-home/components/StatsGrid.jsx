import React from "react";
import Icon from "../../../components/AppIcon";

const StatsGrid = ({ stats, onStatClick }) => {
  const mockStats = [
    {
      id: "growth",
      title: "Growth Score",
      value: "7.2",
      unit: "/10",
      change: "+0.3",
      changeType: "positive",
      icon: "TrendingUp",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      id: "weekly",
      title: "Weekly Progress",
      value: "85",
      unit: "%",
      change: "+12%",
      changeType: "positive",
      icon: "Calendar",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "streak",
      title: "Current Streak",
      value: "12",
      unit: "days",
      change: "Personal best!",
      changeType: "neutral",
      icon: "Flame",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      id: "milestone",
      title: "Next Milestone",
      value: "3",
      unit: "days",
      change: "Communication Expert",
      changeType: "neutral",
      icon: "Target",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  const currentStats = stats || mockStats;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {currentStats?.map((stat) => (
        <button
          key={stat?.id}
          onClick={() => onStatClick && onStatClick(stat)}
          className="bg-card rounded-xl p-4 border border-border shadow-soft hover:shadow-medium transition-gentle text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-8 h-8 ${stat?.bgColor} rounded-lg flex items-center justify-center`}
            >
              <Icon name={stat?.icon} size={16} className={stat?.color} />
            </div>
            {stat?.changeType === "positive" && (
              <Icon name="TrendingUp" size={14} className="text-success" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-foreground">
                {stat?.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat?.unit}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {stat?.title}
            </p>
            <p
              className={`text-xs ${
                stat?.changeType === "positive"
                  ? "text-success"
                  : stat?.changeType === "negative"
                    ? "text-error"
                    : "text-muted-foreground"
              }`}
            >
              {stat?.change}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default StatsGrid;
