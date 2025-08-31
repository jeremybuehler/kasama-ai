import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { SparkleEffect } from "../../../components/ui/ConfettiCelebration";

const HeroSection = ({ onStartJourney, onLearnMore }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    // Add some magical sparkles on load
    const timer = setTimeout(() => {
      setShowSparkles(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center mb-12">
      {/* Logo */}
      <div className="mb-8">
        <SparkleEffect trigger={showSparkles}>
          <div 
            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-large animate-float hover:animate-celebration-bounce transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={`w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'animate-glow-pulse scale-110' : ''
            }`}>
              <span className="text-white font-bold text-xl">{isHovered ? '💖' : 'K'}</span>
            </div>
          </div>
        </SparkleEffect>
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 animate-slide-up">
          Welcome to Kasama ✨
        </h1>
        <p className="text-xl text-white/90 font-medium animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Your Journey to Deeper Connections 💕
        </p>
      </div>

      {/* Value Proposition */}
      <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-medium hover:shadow-large hover:bg-white/15 transition-all duration-300 group animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-2xl font-semibold text-white mb-4 group-hover:animate-gentle-bounce">
          Transform Your Relationships with AI-Powered Insights 🤖💝
        </h2>
        <p className="text-white/80 text-lg leading-relaxed group-hover:text-white/90 transition-colors duration-300">
          Discover personalized guidance to improve communication, build
          emotional intelligence, and create meaningful connections that last. 🌟
        </p>
        
        {/* Floating elements */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white/60 text-2xl animate-float">💫</span>
        </div>
      </div>

      {/* Call to Action Buttons */}
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={onStartJourney}
          iconName="ArrowRight"
          iconPosition="right"
          className="bg-white text-primary hover:bg-white/90 shadow-large hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-glow-pulse"
        >
          🚀 Start Your Journey
        </Button>

        <button
          onClick={onLearnMore}
          className="text-white/90 hover:text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2 w-full py-3 hover:scale-105 group"
        >
          <Icon name="Info" size={18} className="group-hover:animate-wiggle" />
          <span>Learn More About Kasama</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">💡</span>
        </button>
      </div>
    </div>
  );
};

export default HeroSection;