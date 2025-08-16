import React from "react";
import Icon from "../../../components/AppIcon";

const TimelineView = ({ achievements = [] }) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Recent Achievements
        </h3>
        <Icon name="Award" size={20} className="text-primary" />
      </div>
      <div className="space-y-4">
        {achievements?.map((achievement, index) => (
          <div key={achievement?.id} className="flex items-start space-x-4">
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  achievement?.type === "milestone"
                    ? "bg-primary text-primary-foreground"
                    : achievement?.type === "practice"
                      ? "bg-success text-success-foreground"
                      : "bg-accent text-accent-foreground"
                }`}
              >
                <Icon
                  name={
                    achievement?.type === "milestone"
                      ? "Trophy"
                      : achievement?.type === "practice"
                        ? "CheckCircle"
                        : "Star"
                  }
                  size={16}
                />
              </div>
              {index < achievements?.length - 1 && (
                <div className="absolute top-8 left-4 w-px h-8 bg-border"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  {achievement?.title}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {achievement?.date}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {achievement?.description}
              </p>
              {achievement?.badge && (
                <div className="inline-flex items-center space-x-1 mt-2 px-2 py-1 bg-primary/10 rounded-full">
                  <Icon name="Award" size={12} className="text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {achievement?.badge}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;
