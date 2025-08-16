import React from "react";
import Icon from "../../../components/AppIcon";

const ProgressHeader = ({ overallScore = 72, weeklyChange = 8 }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="bg-gradient-primary rounded-xl p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">
            Relationship Intelligence
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold">{overallScore}%</div>
            <div className="flex items-center space-x-1">
              <Icon
                name={weeklyChange >= 0 ? "TrendingUp" : "TrendingDown"}
                size={16}
                className="text-white/80"
              />
              <span className="text-sm text-white/80">
                {weeklyChange >= 0 ? "+" : ""}
                {weeklyChange}% this week
              </span>
            </div>
          </div>
          <p className="text-white/80 text-sm mt-2">
            Your relationship skills are developing well
          </p>
        </div>

        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {overallScore}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressHeader;
