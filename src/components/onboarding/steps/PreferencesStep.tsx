/**
 * Preferences Step - Customize Your Experience
 * Allows users to set communication style, learning pace, and notification preferences
 */

import React, { useState } from 'react';
import { OnboardingData } from '../OnboardingWizard';

interface PreferencesStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading: boolean;
  stepInfo: any;
}

interface PreferenceOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  example?: string;
}

const COMMUNICATION_STYLES: PreferenceOption[] = [
  {
    id: 'supportive',
    title: 'Supportive & Encouraging',
    description: 'Gentle, empathetic guidance with positive reinforcement',
    icon: '🤗',
    example: 'You\'re making great progress! Let\'s build on that success...'
  },
  {
    id: 'analytical',
    title: 'Analytical & Structured',
    description: 'Data-driven insights with clear, logical explanations',
    icon: '📊',
    example: 'Based on research, here are 3 evidence-based strategies...'
  },
  {
    id: 'direct',
    title: 'Direct & Practical',
    description: 'Straightforward advice focused on actionable steps',
    icon: '🎯',
    example: 'Here\'s exactly what you need to do next to improve...'
  },
  {
    id: 'formal',
    title: 'Professional & Formal',
    description: 'Structured, professional tone with clinical insights',
    icon: '👔',
    example: 'I recommend implementing the following therapeutic approach...'
  }
];

const LEARNING_PACES: PreferenceOption[] = [
  {
    id: 'slow',
    title: 'Take It Slow',
    description: '1-2 small exercises per week, more reflection time',
    icon: '🐌',
    example: 'Weekly goals with plenty of time to practice'
  },
  {
    id: 'moderate',
    title: 'Steady Progress',
    description: '3-4 activities per week, balanced approach',
    icon: '🚶',
    example: 'Regular practice with manageable challenges'
  },
  {
    id: 'fast',
    title: 'Accelerated Growth',
    description: 'Daily activities, rapid skill development',
    icon: '🏃',
    example: 'Daily exercises and frequent check-ins'
  }
];

const REMINDER_FREQUENCIES: PreferenceOption[] = [
  {
    id: 'daily',
    title: 'Daily Check-ins',
    description: 'Daily insights, reminders, and progress updates',
    icon: '📅',
    example: 'Morning insights and evening reflections'
  },
  {
    id: 'weekly',
    title: 'Weekly Summaries',
    description: 'Weekly progress reports and new activities',
    icon: '📊',
    example: 'Sunday planning and Friday progress reviews'
  },
  {
    id: 'as_needed',
    title: 'On-Demand Only',
    description: 'No scheduled reminders, access when needed',
    icon: '🔕',
    example: 'Manual access to coaching when desired'
  }
];

const PreferencesStep: React.FC<PreferencesStepProps> = ({
  data,
  onNext,
  onBack,
  onSkip,
  isLoading,
  stepInfo
}) => {
  const [preferences, setPreferences] = useState({
    communicationStyle: data.preferences?.communicationStyle || 'supportive',
    learningPace: data.preferences?.learningPace || 'moderate',
    reminderFrequency: data.preferences?.reminderFrequency || 'daily'
  });

  const [focusedSection, setFocusedSection] = useState<string | null>(null);

  const handlePreferenceChange = (category: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleContinue = () => {
    onNext({
      preferences: {
        ...data.preferences,
        ...preferences
      }
    });
  };

  const renderPreferenceSection = (
    title: string,
    subtitle: string,
    options: PreferenceOption[],
    selectedValue: string,
    category: string,
    sectionKey: string
  ) => (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{subtitle}</p>
      </div>
      
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedValue === option.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
            }`}
            onMouseEnter={() => setFocusedSection(`${sectionKey}-${option.id}`)}
            onMouseLeave={() => setFocusedSection(null)}
          >
            <input
              type="radio"
              name={category}
              value={option.id}
              checked={selectedValue === option.id}
              onChange={(e) => handlePreferenceChange(category, e.target.value)}
              className="sr-only"
            />
            <div className="flex items-start space-x-4 flex-1">
              <div className="text-2xl">{option.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 mb-1">{option.title}</div>
                <div className="text-sm text-gray-600 mb-2">{option.description}</div>
                {option.example && (
                  <div className="text-xs text-gray-500 italic">
                    Example: "{option.example}"
                  </div>
                )}
              </div>
              {selectedValue === option.id && (
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
  );

  const userName = data.personalInfo?.fullName?.split(' ')[0] || 'there';
  const selectedCommunicationStyle = COMMUNICATION_STYLES.find(s => s.id === preferences.communicationStyle);
  const selectedLearningPace = LEARNING_PACES.find(p => p.id === preferences.learningPace);
  const selectedReminderFreq = REMINDER_FREQUENCIES.find(r => r.id === preferences.reminderFrequency);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Customize Your Experience
        </h1>
        <p className="text-lg text-gray-600">
          Let's fine-tune how your AI coach communicates with you and supports your growth.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Communication Style */}
        {renderPreferenceSection(
          'Communication Style',
          'How would you prefer your AI coach to communicate with you?',
          COMMUNICATION_STYLES,
          preferences.communicationStyle,
          'communicationStyle',
          'comm'
        )}

        {/* Learning Pace */}
        {renderPreferenceSection(
          'Learning Pace',
          'How quickly would you like to progress through relationship-building activities?',
          LEARNING_PACES,
          preferences.learningPace,
          'learningPace',
          'pace'
        )}

        {/* Reminder Frequency */}
        {renderPreferenceSection(
          'Reminder Frequency',
          'How often would you like to receive insights and progress updates?',
          REMINDER_FREQUENCIES,
          preferences.reminderFrequency,
          'reminderFrequency',
          'remind'
        )}
      </div>

      {/* Preview Your Experience */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mt-8 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Preview Your Personalized Experience</h3>
            <div className="text-gray-700 text-sm space-y-2">
              <p>
                <strong>Communication:</strong> Your AI coach will use a {selectedCommunicationStyle?.title.toLowerCase()} approach
                {selectedCommunicationStyle?.example && (
                  <span className="italic text-gray-600 ml-1">
                    - "{selectedCommunicationStyle.example}"
                  </span>
                )}
              </p>
              <p>
                <strong>Learning Pace:</strong> You'll progress at a {selectedLearningPace?.title.toLowerCase()} with {selectedLearningPace?.description.toLowerCase()}
              </p>
              <p>
                <strong>Check-ins:</strong> You'll receive {selectedReminderFreq?.title.toLowerCase()} to stay on track with your goals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <h4 className="font-medium text-gray-900 mb-3">Additional Options</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={true}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="ml-2 text-sm text-gray-700">
              Enable smart notifications (AI chooses optimal timing)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={false}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="ml-2 text-sm text-gray-700">
              Include research insights and psychology tips
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={true}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="ml-2 text-sm text-gray-700">
              Celebrate milestones and progress achievements
            </span>
          </label>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Customization Note</h4>
            <p className="text-blue-800 text-sm">
              You can change these preferences anytime from your dashboard settings. 
              Your AI coach will adapt immediately to your new preferences.
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
              Use defaults
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
                <span>Saving preferences...</span>
              </div>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesStep;
