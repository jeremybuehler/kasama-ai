/**
 * Completion Step - Welcome to Your Journey
 * Celebrates successful onboarding and prepares users for their dashboard experience
 */

import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../OnboardingWizard';

interface CompletionStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading: boolean;
  stepInfo: any;
}

const CompletionStep: React.FC<CompletionStepProps> = ({
  data,
  onNext,
  isLoading,
  stepInfo
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    // Trigger confetti animation after component mounts
    const timer = setTimeout(() => setShowConfetti(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cycle through feature highlights
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const userName = data.personalInfo?.fullName?.split(' ')[0] || 'there';
  const selectedGoals = data.goals || [];
  const aiPersonality = data.preferences?.aiPersonality || 'encouraging';
  const firstTask = (data as any).firstTask;

  const personalizedFeatures = [
    {
      icon: '🎯',
      title: 'Your Personal Goals',
      description: `${selectedGoals.length} focus areas selected`,
      detail: selectedGoals.length > 0 
        ? `Working on: ${selectedGoals.slice(0, 2).join(', ')}${selectedGoals.length > 2 ? ` and ${selectedGoals.length - 2} more` : ''}`
        : 'Ready to explore relationship growth'
    },
    {
      icon: '🤖',
      title: 'AI Coach Personality',
      description: `${aiPersonality.charAt(0).toUpperCase() + aiPersonality.slice(1)} coaching style`,
      detail: 'Your AI coach will adapt to your preferred communication and learning style'
    },
    {
      icon: '📈',
      title: 'Progress Tracking',
      description: 'Smart analytics ready',
      detail: 'Your journey will be tracked with intelligent insights and milestone celebrations'
    },
    {
      icon: '💡',
      title: 'Daily Insights',
      description: `${data.preferences?.reminderFrequency === 'daily' ? 'Daily' : data.preferences?.reminderFrequency === 'weekly' ? 'Weekly' : 'On-demand'} guidance`,
      detail: 'Personalized relationship insights delivered when you need them most'
    }
  ];

  const nextSteps = [
    {
      icon: '🏠',
      title: 'Explore Your Dashboard',
      description: 'See your personalized relationship intelligence center'
    },
    {
      icon: '💬',
      title: 'Chat with Your AI Coach',
      description: 'Ask questions and get immediate guidance'
    },
    {
      icon: '📚',
      title: 'Start Your Learning Path',
      description: 'Begin with activities tailored to your goals'
    },
    {
      icon: '📊',
      title: 'Track Your Progress',
      description: 'Watch your relationship skills grow over time'
    }
  ];

  const handleGetStarted = () => {
    onNext({
      completedAt: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 animate-bounce text-2xl">🎉</div>
          <div className="absolute top-10 right-1/4 animate-bounce text-2xl" style={{ animationDelay: '0.5s' }}>✨</div>
          <div className="absolute top-5 left-3/4 animate-bounce text-2xl" style={{ animationDelay: '1s' }}>🌟</div>
          <div className="absolute top-12 left-1/2 animate-bounce text-2xl" style={{ animationDelay: '1.5s' }}>🎊</div>
        </div>
      )}

      {/* Main Content */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Kasama AI, {userName}! 🎉
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Congratulations! You've successfully set up your personalized relationship intelligence system. 
          Your AI coach is ready to help you build stronger, healthier connections.
        </p>

        <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full text-green-700 font-medium">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Setup Complete</span>
        </div>
      </div>

      {/* Personalized Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
          Your Personalized Experience
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {personalizedFeatures.map((feature, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 border-2 transition-all duration-300 ${
                currentFeature === index 
                  ? 'border-blue-500 shadow-lg transform scale-105' 
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-blue-600 font-medium text-sm mb-2">
                    {feature.description}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {feature.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* First Task Completion */}
      {firstTask && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-12">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Great Job Completing Your First Task!
              </h3>
              <p className="text-gray-700 text-sm mb-2">
                You completed "{firstTask.taskTitle}" - your AI coach has already begun learning about your relationship patterns and preferences.
              </p>
              <p className="text-gray-600 text-xs italic">
                This early insight will help provide more personalized guidance from day one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* What's Next */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
          What's Next?
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {nextSteps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Coach Introduction */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Your AI Coach is Ready
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-gray-700 text-sm italic">
              {aiPersonality === 'encouraging' && 
                `"Hi ${userName}! I'm so excited to be your relationship coach. Together, we'll celebrate every step of your growth journey and build the meaningful connections you deserve. I'm here to support and encourage you every day!" 🌟`}
              {aiPersonality === 'analytical' && 
                `"Hello ${userName}. I'm your AI relationship analyst. Based on your goals and preferences, I've prepared a systematic approach to help you develop stronger relationship skills through evidence-based strategies. Let's begin with data-driven insights." 📊`}
              {aiPersonality === 'direct' && 
                `"${userName}, I'm your direct relationship guide. I'll give you honest feedback and actionable steps to improve your relationships. No beating around the bush - just practical advice that gets results. Ready to get started?" 🎯`}
              {aiPersonality === 'gentle' && 
                `"Welcome, ${userName}. I'm here to gently guide you on your relationship journey. We'll take things at your pace, with kindness and understanding. Remember, every small step forward is progress worth celebrating." 🌱`}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Support */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Your Privacy is Protected</h4>
              <p className="text-blue-800 text-sm">
                All your conversations and data are encrypted and private. 
                You control your information and can delete your account anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Always Learning</h4>
              <p className="text-green-800 text-sm">
                Your AI coach continuously learns from your interactions to provide 
                increasingly personalized and effective guidance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Get Started Button */}
      <div className="text-center">
        <button
          onClick={handleGetStarted}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Setting up your dashboard...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Enter Your Dashboard</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </button>
        
        <p className="text-gray-500 text-sm mt-4">
          Your relationship intelligence journey begins now! 🚀
        </p>
      </div>
    </div>
  );
};

export default CompletionStep;
