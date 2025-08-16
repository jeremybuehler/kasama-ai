import React from "react";
import Icon from "../../../components/AppIcon";
import ProgressBar from "../../../components/ui/ProgressBar";

const GoalTracker = ({ goals = [] }) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Current Goals</h3>
        <Icon name="Target" size={20} className="text-primary" />
      </div>
      <div className="space-y-4">
        {goals?.map((goal) => (
          <div key={goal?.id} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">{goal?.title}</h4>
              <span className="text-sm text-muted-foreground">
                {goal?.targetDate}
              </span>
            </div>

            <ProgressBar
              value={goal?.progress}
              label={goal?.description}
              showPercentage={true}
              variant={goal?.progress >= 100 ? "success" : "primary"}
              animated={true}
            />

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <Icon
                  name={goal?.progress >= 100 ? "CheckCircle" : "Clock"}
                  size={16}
                  className={
                    goal?.progress >= 100
                      ? "text-success"
                      : "text-muted-foreground"
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {goal?.progress >= 100
                    ? "Completed"
                    : `${goal?.daysLeft} days left`}
                </span>
              </div>

              {goal?.progress >= 100 && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-success/10 rounded-full">
                  <Icon name="Trophy" size={12} className="text-success" />
                  <span className="text-xs font-medium text-success">
                    Goal Achieved!
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

export default GoalTracker;
