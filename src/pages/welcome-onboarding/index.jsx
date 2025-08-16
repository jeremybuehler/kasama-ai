import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "./components/HeroSection";
import FeatureHighlights from "./components/FeatureHighlights";
import TrustSignals from "./components/TrustSignals";
import LearnMoreModal from "./components/LearnMoreModal";

const WelcomeOnboarding = () => {
  const navigate = useNavigate();
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleStartJourney = () => {
    navigate("/relationship-assessment");
  };

  const handleLearnMore = () => {
    setShowLearnMore(true);
  };

  const handleCloseModal = () => {
    setShowLearnMore(false);
  };

  return (
    <div className="min-h-screen bg-gradient-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-white rounded-full blur-2xl"></div>
      </div>
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 px-4 py-8 lg:px-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <HeroSection
              onStartJourney={handleStartJourney}
              onLearnMore={handleLearnMore}
            />

            {/* Trust Signals */}
            <TrustSignals />

            {/* Feature Highlights */}
            <FeatureHighlights />

            {/* Bottom CTA for larger screens */}
            <div className="hidden lg:block text-center">
              <p className="text-white/80 text-lg mb-6">
                Ready to transform your relationships?
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleLearnMore}
                  className="text-white/90 hover:text-white font-medium transition-gentle px-6 py-3 rounded-lg border border-white/20 hover:border-white/40"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 px-4 py-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-white/60 text-sm">
              © {new Date()?.getFullYear()} Kasama. Privacy-focused
              relationship guidance.
            </p>
          </div>
        </footer>
      </div>
      {/* Learn More Modal */}
      <LearnMoreModal
        isOpen={showLearnMore}
        onClose={handleCloseModal}
        onStartJourney={handleStartJourney}
      />
    </div>
  );
};

export default WelcomeOnboarding;
