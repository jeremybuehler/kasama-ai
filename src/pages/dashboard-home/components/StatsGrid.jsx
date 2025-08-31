import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import { SparkleEffect } from "../../../components/ui/ConfettiCelebration";

const StatsGrid = ({ stats, onStatClick }) => {
  const [clickedStat, setClickedStat] = useState(null);
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
          onClick={() => {
            setClickedStat(stat?.id);
            setTimeout(() => setClickedStat(null), 1000);
            if (onStatClick) onStatClick(stat);
          }}
          className="bg-card rounded-xl p-4 border border-border shadow-soft hover:shadow-medium hover:scale-105 hover:-translate-y-1 transition-all duration-300 text-left group relative overflow-hidden"
        >
          <SparkleEffect trigger={clickedStat === stat?.id}>
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-8 h-8 ${stat?.bgColor} rounded-lg flex items-center justify-center group-hover:animate-celebration-bounce transition-all duration-300`}
              >
                <Icon name={stat?.icon} size={16} className={`${stat?.color} group-hover:scale-110 transition-transform duration-200`} />
              </div>
              {stat?.changeType === "positive" && (
                <Icon name="TrendingUp" size={14} className="text-success animate-float" />
              )}
            </div>
          </SparkleEffect>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                {stat?.value}
              </span>
              <span className="text-sm text-muted-foreground group-hover:text-primary/70 transition-colors duration-200">
                {stat?.unit}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              {stat?.title}
            </p>
            <p
              className={`text-xs transition-all duration-200 ${
                stat?.changeType === "positive"
                  ? "text-success group-hover:text-success/80"
                  : stat?.changeType === "negative"
                    ? "text-error group-hover:text-error/80"
                    : "text-muted-foreground group-hover:text-foreground/80"
              }`}
            >
              {stat?.changeType === "positive" && "✨ "}
              {stat?.change}
              {stat?.changeType === "positive" && stat?.id === "streak" && " 🔥"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default StatsGrid;
