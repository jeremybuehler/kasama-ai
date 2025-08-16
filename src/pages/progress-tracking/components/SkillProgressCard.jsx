import React from "react";
import Icon from "../../../components/AppIcon";
import ProgressBar from "../../../components/ui/ProgressBar";

const SkillProgressCard = ({
  title,
  icon,
  progress,
  improvement,
  suggestion,
  color = "primary",
}) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 bg-${color}/10 rounded-lg flex items-center justify-center`}
          >
            <Icon name={icon} size={20} className={`text-${color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {improvement >= 0 ? "+" : ""}
              {improvement}% improvement
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{progress}%</div>
        </div>
      </div>

      <ProgressBar
        value={progress}
        variant={color}
        showPercentage={false}
        animated={true}
        className="mb-4"
      />

      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm text-muted-foreground">
          <Icon name="Lightbulb" size={14} className="inline mr-1" />
          {suggestion}
        </p>
      </div>
    </div>
  );
};

export default SkillProgressCard;
