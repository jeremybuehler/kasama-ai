import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const HeroSection = ({ onStartJourney, onLearnMore }) => {
  return (
    <div className="text-center mb-12">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-large">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">K</span>
          </div>
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
          Welcome to Kasama
        </h1>
        <p className="text-xl text-white/90 font-medium">
          Your Journey to Deeper Connections
        </p>
      </div>

      {/* Value Proposition */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-medium">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Transform Your Relationships with AI-Powered Insights
        </h2>
        <p className="text-white/80 text-lg leading-relaxed">
          Discover personalized guidance to improve communication, build
          emotional intelligence, and create meaningful connections that last.
        </p>
      </div>

      {/* Call to Action Buttons */}
      <div className="space-y-4">
        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={onStartJourney}
          iconName="ArrowRight"
          iconPosition="right"
          className="bg-white text-primary hover:bg-white/90 shadow-large"
        >
          Start Your Journey
        </Button>

        <button
          onClick={onLearnMore}
          className="text-white/90 hover:text-white font-medium transition-gentle flex items-center justify-center space-x-2 w-full py-3"
        >
          <Icon name="Info" size={18} />
          <span>Learn More About Kasama</span>
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
