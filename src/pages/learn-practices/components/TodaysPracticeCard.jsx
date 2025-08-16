import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const TodaysPracticeCard = ({ practice, onStartPractice }) => {
  if (!practice) return null;

  return (
    <div className="bg-gradient-primary rounded-xl p-6 text-white mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Today's Practice</h2>
          <h3 className="text-xl font-bold mb-2">{practice?.title}</h3>
          <p className="text-white/90 text-sm leading-relaxed">
            {practice?.description}
          </p>
        </div>
        <div className="ml-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <Icon name={practice?.icon} size={24} className="text-white" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-white/80">
          <div className="flex items-center space-x-1">
            <Icon name="Clock" size={16} />
            <span>{practice?.duration} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Target" size={16} />
            <span>{practice?.category}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onStartPractice(practice)}
          iconName="Play"
          iconPosition="left"
          className="bg-white text-primary hover:bg-white/90"
        >
          Start Practice
        </Button>
      </div>
    </div>
  );
};

export default TodaysPracticeCard;
