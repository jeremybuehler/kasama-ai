import React from "react";
import Icon from "@/components/AppIcon";

const FeatureCard = ({ icon, title, description, gradient = false }) => {
  return (
    <div
      className={`p-6 rounded-2xl shadow-medium transition-gentle hover:shadow-large ${
        gradient
          ? "bg-gradient-accent text-white"
          : "bg-white/15 backdrop-blur-sm text-white"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          gradient ? "bg-white/20" : "bg-white/10"
        }`}
      >
        <Icon
          name={icon}
          size={24}
          className={gradient ? "text-white" : "text-white/90"}
        />
      </div>

      <h3
        className={`text-lg font-semibold mb-3 ${
          gradient ? "text-white" : "text-white"
        }`}
      >
        {title}
      </h3>

      <p
        className={`text-sm leading-relaxed ${
          gradient ? "text-white/90" : "text-white/80"
        }`}
      >
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
