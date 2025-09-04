import React from "react";
import Icon from "../../../components/AppIcon";

const WelcomeHeader = ({ userName = "User", onProfileClick }) => {
  const getTimeBasedGreeting = () => {
    const hour = new Date()?.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to strengthen your connections today?",
      "Let\'s continue building meaningful relationships",
      "Your journey to deeper connections continues",
      "Time to nurture your relationship skills",
    ];
    return messages?.[Math.floor(Math.random() * messages?.length)];
  };

  return (
    <div className="bg-kasama-gradient p-6 rounded-xl text-white mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-light mb-1">
            {getTimeBasedGreeting()}, {userName}!
          </h1>
          <p className="text-white/90 text-sm font-light">{getMotivationalMessage()}</p>
        </div>
        <button
          onClick={onProfileClick}
          className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transform hover:scale-105 transition-all duration-200"
        >
          <Icon name="User" size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeHeader;
