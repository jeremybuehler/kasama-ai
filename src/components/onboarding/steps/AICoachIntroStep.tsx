/**
 * AI Coach Introduction Step - Meet Your AI Assistant
 * Introduces users to their personalized AI coach and demonstrates key features
 */

import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../OnboardingWizard';

interface AICoachIntroStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading: boolean;
  stepInfo: any;
}

interface CoachPersonality {
  id: string;
  name: string;
  description: string;
  traits: string[];
  icon: string;
  sampleResponse: string;
  color: string;
}

const COACH_PERSONALITIES: CoachPersonality[] = [
  {
    id: 'encouraging',
    name: 'Elena - The Encourager',
    description: 'Warm, supportive, and motivational approach',
    traits: ['Empathetic', 'Optimistic', 'Nurturing', 'Patient'],
    icon: '🌟',
    sampleResponse: "You're taking such a brave step by working on your relationships! I believe in your ability to grow and create meaningful connections. Let's celebrate every small win together.",
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'analytical',
    name: 'Marcus - The Analyst',
    description: 'Data-driven, logical, and systematic guidance',
    traits: ['Logical', 'Structured', 'Evidence-based', 'Clear'],
    icon: '📊',
    sampleResponse: "Based on relationship research, here are three specific strategies that have proven effective for your situation. Let's break down each approach and measure your progress systematically.",
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'direct',
    name: 'Jordan - The Direct Guide',
    description: 'Honest, straightforward, and action-oriented',
    traits: ['Honest', 'Efficient', 'Practical', 'Results-focused'],
    icon: '🎯',
    sampleResponse: "Let's be real about what's not working and fix it. Here's exactly what you need to do next. No fluff, just actionable steps that will move you forward.",
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'gentle',
    name: 'Aria - The Gentle Guide',
    description: 'Soft, understanding, and mindful approach',
    traits: ['Compassionate', 'Mindful', 'Non-judgmental', 'Healing'],
    icon: '🌱',
    sampleResponse: "Take a deep breath. Relationships are complex, and it's okay to feel overwhelmed. Let's explore your feelings with kindness and find gentle ways to move forward at your own pace.",
    color: 'from-purple-500 to-violet-500'
  }
];

const AICoachIntroStep: React.FC<AICoachIntroStepProps> = ({
  data,
  onNext,
  onBack,
  onSkip,
  isLoading,
  stepInfo
}) => {
  const [selectedPersonality, setSelectedPersonality] = useState<string>(
    data.preferences?.aiPersonality || 'encouraging'
  );
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);
  const [showFeatureDemo, setShowFeatureDemo] = useState(false);

  const selectedCoach = COACH_PERSONALITIES.find(p => p.id === selectedPersonality);
  const userName = data.personalInfo?.fullName?.split(' ')[0] || 'there';

  const handlePersonalitySelect = (personalityId: string) => {
    setSelectedPersonality(personalityId);
    setCurrentDemo(personalityId);
  };

  const handleContinue = () => {
    onNext({
      preferences: {
        ...data.preferences,
        aiPersonality: selectedPersonality as any
      }
    });
  };

  const demoFeatures = [
    {
      title: 'Daily Insights',
      description: 'Personalized relationship advice every day',
      icon: '💡',
      example: `Good morning, ${userName}! Based on your recent interactions, I notice you've been working on active listening. Here's a gentle reminder to practice the 5-second pause before responding in conversations today.`
    },
    {
      title: 'Real-time Guidance',
      description: 'Get help when you need it most',
      icon: '🆘',
      example: `I can see you're feeling frustrated about that conversation with your partner. Let's take a step back and explore what might help you both feel heard and understood.`
    },
    {
      title: 'Progress Tracking',
      description: 'Celebrate your growth journey',
      icon: '📈',
      example: `Amazing progress! You've completed 7 communication exercises this week and your confidence score has increased by 23%. You're really developing your emotional intelligence!`
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Meet Your AI Coach
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose your preferred coaching style. Your AI coach will adapt to your personality and provide guidance that resonates with you.
        </p>
      </div>

      {/* Coach Personalities */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Choose Your Coaching Style
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {COACH_PERSONALITIES.map((coach) => (
            <div key={coach.id} className="relative">
              <div
                className={`p-6 bg-white rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPersonality === coach.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
                onClick={() => handlePersonalitySelect(coach.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${coach.color} rounded-full flex items-center justify-center text-2xl flex-shrink-0`}>
                    {coach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {coach.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {coach.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {coach.traits.map((trait) => (
                        <span
                          key={trait}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedPersonality === coach.id && (
                    <div className="text-blue-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Sample Response */}
                {currentDemo === coach.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start space-x-2">
                      <div className="text-sm text-gray-500">Sample response:</div>
                    </div>
                    <p className="text-gray-700 text-sm mt-1 italic">
                      "{coach.sampleResponse}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Preview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            What Your AI Coach Can Do
          </h2>
          <button
            onClick={() => setShowFeatureDemo(!showFeatureDemo)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showFeatureDemo ? 'Hide Examples' : 'See Examples'}
          </button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {demoFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
              
              {showFeatureDemo && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-900 text-xs italic">
                    {feature.example}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personalization Preview */}
      {selectedCoach && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${selectedCoach.color} rounded-full flex items-center justify-center text-white text-lg flex-shrink-0`}>
              {selectedCoach.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedCoach.name} is ready to help you, {userName}!
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                Based on your goals and {selectedCoach.name}'s {selectedCoach.description.toLowerCase()}, 
                here's how your coaching experience will be personalized:
              </p>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Daily insights tailored to your {data.personalInfo?.relationshipStatus || 'relationship'} status</li>
                <li>• Progress tracking focused on your selected goals</li>
                <li>• Communication style that matches your preferences</li>
                <li>• 24/7 support whenever you need guidance</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & AI Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">About Your AI Coach</h4>
            <p className="text-gray-600 text-sm">
              Your AI coach is powered by advanced language models trained on relationship psychology research. 
              While highly capable, it's designed to supplement, not replace, professional therapy or counseling. 
              All conversations are private and secure.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-700 font-medium transition-colors"
        >
          ← Back
        </button>
        
        <div className="flex items-center space-x-4">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-6 py-3 text-gray-500 hover:text-gray-600 font-medium transition-colors"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Setting up...</span>
              </div>
            ) : (
              `Continue with ${selectedCoach?.name.split(' - ')[0] || 'Coach'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoachIntroStep;
