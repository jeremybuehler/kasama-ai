/**
 * Welcome Step - Onboarding Introduction
 * Introduces users to Kasama AI and sets expectations
 */

import React from 'react';
import { OnboardingData } from '../OnboardingWizard';

interface WelcomeStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading: boolean;
  stepInfo: any;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onNext,
  isLoading
}) => {
  const handleContinue = () => {
    onNext({});
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        {/* Logo/Brand */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Kasama AI
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your intelligent companion for building stronger, healthier relationships through personalized insights and AI-powered guidance.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI-Powered Insights
          </h3>
          <p className="text-gray-600 text-sm">
            Get personalized recommendations based on your unique relationship patterns and goals.
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Daily Practices
          </h3>
          <p className="text-gray-600 text-sm">
            Build healthier habits with bite-sized daily exercises designed to strengthen your relationships.
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Progress Tracking
          </h3>
          <p className="text-gray-600 text-sm">
            Monitor your growth with detailed analytics and celebrate your relationship milestones.
          </p>
        </div>
      </div>

      {/* What to Expect */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          What to Expect in the Next Few Minutes
        </h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Tell us about yourself</h4>
              <p className="text-gray-600 text-sm">Share some basic information to help us personalize your experience.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Set your relationship goals</h4>
              <p className="text-gray-600 text-sm">Choose what areas you'd like to focus on and improve.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Meet your AI coach</h4>
              <p className="text-gray-600 text-sm">Get introduced to your personalized AI assistant and customize your preferences.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-semibold">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Complete your first task</h4>
              <p className="text-gray-600 text-sm">Start your journey with a simple, meaningful relationship-building activity.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Your Privacy Matters</h4>
            <p className="text-gray-600 text-sm">
              Your personal information and relationship data are completely private and secure. 
              We use advanced encryption and never share your data with third parties. 
              You have full control over your information and can delete your account at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Getting Started...</span>
            </div>
          ) : (
            "Let's Begin Your Journey"
          )}
        </button>
        <p className="text-gray-500 text-sm mt-4">
          Takes about 3-5 minutes • You can skip optional steps
        </p>
      </div>
    </div>
  );
};

export default WelcomeStep;
