/**
 * Personal Info Step - Collect Basic User Information
 * Gathers essential user details for personalization while respecting privacy
 */

import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../OnboardingWizard';

interface PersonalInfoStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading: boolean;
  stepInfo: any;
}

interface ValidationErrors {
  fullName?: string;
  age?: string;
  relationshipStatus?: string;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
  stepInfo
}) => {
  const [formData, setFormData] = useState({
    fullName: data.personalInfo?.fullName || '',
    age: data.personalInfo?.age?.toString() || '',
    location: data.personalInfo?.location || '',
    relationshipStatus: data.personalInfo?.relationshipStatus || 'prefer_not_to_say'
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const relationshipOptions = [
    { value: 'single', label: 'Single', description: 'Currently not in a romantic relationship', icon: '👤' },
    { value: 'dating', label: 'Dating', description: 'Casually dating or exploring relationships', icon: '💕' },
    { value: 'committed', label: 'In a Relationship', description: 'Committed relationship but not married', icon: '💑' },
    { value: 'married', label: 'Married', description: 'Married or in a life partnership', icon: '💒' },
    { value: 'complicated', label: 'It\'s Complicated', description: 'Complex relationship situation', icon: '🤷' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say', description: 'Keep relationship status private', icon: '🔒' }
  ];

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Please enter your name';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name should be at least 2 characters';
    }

    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 120)) {
      newErrors.age = 'Please enter a valid age between 18-120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    const personalInfo = {
      fullName: formData.fullName.trim(),
      age: formData.age ? parseInt(formData.age) : undefined,
      location: formData.location.trim() || undefined,
      relationshipStatus: formData.relationshipStatus as any
    };

    onNext({
      personalInfo
    });
  };

  const selectedRelationshipOption = relationshipOptions.find(
    option => option.value === formData.relationshipStatus
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tell us about yourself
        </h1>
        <p className="text-lg text-gray-600">
          Help us personalize your Kasama AI experience. All information is kept completely private and secure.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
              maxLength={100}
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Age (Optional) */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="number"
              id="age"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Your age"
              min="18"
              max="120"
            />
            {errors.age && (
              <p className="text-red-600 text-sm mt-1">{errors.age}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              This helps us provide age-appropriate relationship advice
            </p>
          </div>

          {/* Location (Optional) */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="City, State or Country"
              maxLength={100}
            />
            <p className="text-gray-500 text-xs mt-1">
              Helps us understand cultural context (never shared publicly)
            </p>
          </div>

          {/* Relationship Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Relationship Status
            </label>
            <div className="grid gap-3">
              {relationshipOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.relationshipStatus === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                  }`}
                >
                  <input
                    type="radio"
                    name="relationshipStatus"
                    value={option.value}
                    checked={formData.relationshipStatus === option.value}
                    onChange={(e) => handleInputChange('relationshipStatus', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{option.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                    </div>
                    {formData.relationshipStatus === option.value && (
                      <div className="text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
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
            <h4 className="font-medium text-gray-900 mb-1">Privacy First</h4>
            <p className="text-gray-600 text-sm">
              Your information is encrypted and private. We use this data solely to personalize 
              your AI coaching experience and never share it with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* AI Insight Preview */}
      {selectedRelationshipOption && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mt-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">💡 AI Preview</h3>
              <p className="text-gray-700 text-sm">
                {formData.relationshipStatus === 'single' && 
                  "Your AI coach will focus on building self-confidence, dating readiness, and healthy relationship patterns for future connections."}
                {formData.relationshipStatus === 'dating' && 
                  "Your AI coach will help you navigate early relationship dynamics, communication skills, and determine compatibility with potential partners."}
                {formData.relationshipStatus === 'committed' && 
                  "Your AI coach will provide guidance on deepening intimacy, improving communication, and strengthening your committed relationship."}
                {formData.relationshipStatus === 'married' && 
                  "Your AI coach will offer strategies for long-term relationship maintenance, conflict resolution, and rekindling connection."}
                {formData.relationshipStatus === 'complicated' && 
                  "Your AI coach will help you navigate complex relationship challenges with empathy and practical guidance tailored to your unique situation."}
                {formData.relationshipStatus === 'prefer_not_to_say' && 
                  "Your AI coach will provide general relationship wisdom and let you share more details when you're comfortable."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-700 font-medium transition-colors"
        >
          ← Back
        </button>
        
        <button
          onClick={handleContinue}
          disabled={!formData.fullName.trim() || isLoading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
