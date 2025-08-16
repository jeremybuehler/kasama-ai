import React from "react";
import Icon from "../../../components/AppIcon";

const TrustSignals = () => {
  const trustFeatures = [
    {
      icon: "Shield",
      text: "Privacy-focused guidance",
    },
    {
      icon: "Heart",
      text: "Authentic connections",
    },
    {
      icon: "Lock",
      text: "Secure data handling",
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
      <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
        {trustFeatures?.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Icon name={feature?.icon} size={16} className="text-white/70" />
            <span className="text-sm font-medium">{feature?.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustSignals;
