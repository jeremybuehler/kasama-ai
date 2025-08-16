import React from "react";
import FeatureCard from "./FeatureCard";

const FeatureHighlights = () => {
  const features = [
    {
      icon: "FileText",
      title: "Personalized Assessment",
      description:
        "Take our comprehensive relationship readiness assessment to understand your unique patterns and growth areas.",
      gradient: false,
    },
    {
      icon: "Lightbulb",
      title: "Daily AI Insights",
      description:
        "Receive personalized insights and recommendations based on your assessment results and progress.",
      gradient: true,
    },
    {
      icon: "TrendingUp",
      title: "Progress Tracking",
      description:
        "Monitor your growth in communication skills, emotional intelligence, and relationship patterns over time.",
      gradient: false,
    },
  ];

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold text-white text-center mb-8">
        Why Choose Kasama?
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {features?.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature?.icon}
            title={feature?.title}
            description={feature?.description}
            gradient={feature?.gradient}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureHighlights;
