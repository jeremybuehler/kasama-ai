import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import ProgressBar from "../../../components/ui/ProgressBar";

const CategoryCard = ({ category, onSelectActivity }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Category Header */}
      <button
        onClick={handleToggle}
        className="w-full p-6 text-left hover:bg-muted transition-gentle"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${category?.bgColor}`}
            >
              <Icon
                name={category?.icon}
                size={24}
                className={category?.iconColor}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {category?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {category?.subtitle}
              </p>
            </div>
          </div>
          <Icon
            name={isExpanded ? "ChevronUp" : "ChevronDown"}
            size={20}
            className="text-muted-foreground"
          />
        </div>

        <div className="mb-2">
          <ProgressBar
            value={category?.progress}
            showPercentage={true}
            size="sm"
            variant="primary"
            label={`${category?.completedActivities}/${category?.totalActivities} activities completed`}
          />
        </div>
      </button>
      {/* Expanded Activities */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className="p-4 space-y-3">
            {category?.activities?.map((activity) => (
              <button
                key={activity?.id}
                onClick={() => onSelectActivity(activity)}
                className="w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-gentle text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-foreground">
                        {activity?.title}
                      </h4>
                      {activity?.isCompleted && (
                        <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
                          <Icon name="Check" size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {activity?.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Icon name="Clock" size={14} />
                        <span>{activity?.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="BarChart3" size={14} />
                        <span>{activity?.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <Icon
                    name="ChevronRight"
                    size={16}
                    className="text-muted-foreground mt-1"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCard;
