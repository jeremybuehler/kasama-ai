/**
 * Goal Selection Step - Choose Relationship Focus Areas
 * AI-powered goal recommendations based on user context and common relationship patterns
 */

import React, { useState, useEffect } from 'react';
import { OnboardingData } from '../OnboardingWizard';

interface GoalSelectionStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading: boolean;
  stepInfo: any;
}

interface RelationshipGoal {
  id: string;
  title: string;
  description: string;
  category: 'communication' | 'intimacy' | 'conflict' | 'growth' | 'dating' | 'trust' | 'family';
  icon: string;
  commonFor: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

const RELATIONSHIP_GOALS: RelationshipGoal[] = [
  {
    id: 'improve-communication',
    title: 'Improve Communication',
    description: 'Learn to express feelings clearly and listen actively',
    category: 'communication',
    icon: '💬',
    commonFor: ['all'],
    difficulty: 'beginner',
    estimatedTime: '2-4 weeks'
  },
  {
    id: 'resolve-conflicts',
    title: 'Handle Conflicts Better',
    description: 'Develop healthy conflict resolution and de-escalation skills',
    category: 'conflict',
    icon: '🤝',
    commonFor: ['committed', 'married'],
    difficulty: 'intermediate',
    estimatedTime: '3-6 weeks'
  },
  {
    id: 'build-intimacy',
    title: 'Deepen Emotional Intimacy',
    description: 'Strengthen emotional connection and vulnerability',
    category: 'intimacy',
    icon: '💕',
    commonFor: ['dating', 'committed', 'married'],
    difficulty: 'intermediate',
    estimatedTime: '4-8 weeks'
  },
  {
    id: 'dating-confidence',
    title: 'Build Dating Confidence',
    description: 'Develop self-confidence and authentic dating skills',
    category: 'dating',
    icon: '✨',
    commonFor: ['single', 'dating'],
    difficulty: 'beginner',
    estimatedTime: '3-5 weeks'
  },
  {
    id: 'trust-building',
    title: 'Rebuild Trust',
    description: 'Heal from betrayal and rebuild trust foundations',
    category: 'trust',
    icon: '🔒',
    commonFor: ['committed', 'married', 'complicated'],
    difficulty: 'advanced',
    estimatedTime: '6-12 weeks'
  },
  {
    id: 'personal-growth',
    title: 'Personal Growth',
    description: 'Develop self-awareness and emotional intelligence',
    category: 'growth',
    icon: '🌱',
    commonFor: ['all'],
    difficulty: 'beginner',
    estimatedTime: 'ongoing'
  },
  {
    id: 'family-dynamics',
    title: 'Navigate Family Dynamics',
    description: 'Manage relationships with in-laws, parents, and children',
    category: 'family',
    icon: '👨‍👩‍👧‍👦',
    commonFor: ['married', 'committed'],
    difficulty: 'intermediate',
    estimatedTime: '4-6 weeks'
  },
  {
    id: 'boundary-setting',
    title: 'Set Healthy Boundaries',
    description: 'Learn to establish and maintain personal boundaries',
    category: 'growth',
    icon: '🛡️',
    commonFor: ['all'],
    difficulty: 'intermediate',
    estimatedTime: '3-5 weeks'
  },
  {
    id: 'stress-management',
    title: 'Manage Relationship Stress',
    description: 'Cope with external pressures affecting your relationship',
    category: 'growth',
    icon: '🧘',
    commonFor: ['committed', 'married'],
    difficulty: 'beginner',
    estimatedTime: '2-4 weeks'
  },
  {
    id: 'long-distance',
    title: 'Long-Distance Relationship',
    description: 'Maintain connection and intimacy across distance',
    category: 'communication',
    icon: '🌍',
    commonFor: ['dating', 'committed'],
    difficulty: 'intermediate',
    estimatedTime: 'ongoing'
  }
];

const GoalSelectionStep: React.FC<GoalSelectionStepProps> = ({
  data,
  onNext,
  onBack,
  isLoading,
  stepInfo
}) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals || []);
  const [focusedGoal, setFocusedGoal] = useState<string | null>(null);
  const [showRecommended, setShowRecommended] = useState(true);

  const relationshipStatus = data.personalInfo?.relationshipStatus || 'prefer_not_to_say';

  // Get recommended goals based on relationship status
  const getRecommendedGoals = () => {
    return RELATIONSHIP_GOALS.filter(goal => 
      goal.commonFor.includes('all') || 
      goal.commonFor.includes(relationshipStatus)
    ).slice(0, 4);
  };

  const recommendedGoals = getRecommendedGoals();
  const otherGoals = RELATIONSHIP_GOALS.filter(goal => !recommendedGoals.includes(goal));

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else {
        // Limit to 3 goals maximum
        if (prev.length >= 3) {
          return [...prev.slice(1), goalId];
        }
        return [...prev, goalId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedGoals.length === 0) {
      return;
    }

    onNext({
      goals: selectedGoals
    });
  };

  const getGoalsByCategory = (goals: RelationshipGoal[]) => {
    const categories = goals.reduce((acc, goal) => {
      if (!acc[goal.category]) {
        acc[goal.category] = [];
      }
      acc[goal.category].push(goal);
      return acc;
    }, {} as Record<string, RelationshipGoal[]>);

    return categories;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      communication: '💬',
      intimacy: '💕',
      conflict: '🤝',
      growth: '🌱',
      dating: '✨',
      trust: '🔒',
      family: '👨‍👩‍👧‍👦'
    };
    return icons[category as keyof typeof icons] || '🎯';
  };

  const getCategoryTitle = (category: string) => {
    const titles = {
      communication: 'Communication',
      intimacy: 'Intimacy & Connection',
      conflict: 'Conflict Resolution',
      growth: 'Personal Growth',
      dating: 'Dating & Confidence',
      trust: 'Trust & Healing',
      family: 'Family & Relationships'
    };
    return titles[category as keyof typeof titles] || category;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          What would you like to work on?
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose up to 3 areas you'd like to focus on. Don't worry - you can always adjust these later.
        </p>
      </div>

      {/* Selected Goals Counter */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
          <span className="text-blue-600 font-medium">
            {selectedGoals.length}/3 goals selected
          </span>
          {selectedGoals.length >= 3 && (
            <span className="text-blue-500 text-sm">(limit reached)</span>
          )}
        </div>
      </div>

      {/* Recommended Goals */}
      {showRecommended && recommendedGoals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">⭐</span>
              Recommended for You
            </h2>
            <button
              onClick={() => setShowRecommended(!showRecommended)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Show all options
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {recommendedGoals.map((goal) => (
              <div
                key={goal.id}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedGoals.includes(goal.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                } ${selectedGoals.length >= 3 && !selectedGoals.includes(goal.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (selectedGoals.length < 3 || selectedGoals.includes(goal.id)) {
                    handleGoalToggle(goal.id);
                  }
                }}
                onMouseEnter={() => setFocusedGoal(goal.id)}
                onMouseLeave={() => setFocusedGoal(null)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{goal.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {goal.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                        {goal.difficulty}
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                        {goal.estimatedTime}
                      </span>
                    </div>
                  </div>
                  {selectedGoals.includes(goal.id) && (
                    <div className="text-blue-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Goals by Category */}
      {!showRecommended && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Goals</h2>
            <button
              onClick={() => setShowRecommended(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Show recommendations
            </button>
          </div>
          
          {Object.entries(getGoalsByCategory(RELATIONSHIP_GOALS)).map(([category, goals]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <span className="mr-2">{getCategoryIcon(category)}</span>
                {getCategoryTitle(category)}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedGoals.includes(goal.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    } ${selectedGoals.length >= 3 && !selectedGoals.includes(goal.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (selectedGoals.length < 3 || selectedGoals.includes(goal.id)) {
                        handleGoalToggle(goal.id);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-xl">{goal.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {goal.title}
                        </h4>
                        <p className="text-gray-600 text-sm mb-2">
                          {goal.description}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{goal.difficulty}</span>
                          <span>•</span>
                          <span>{goal.estimatedTime}</span>
                        </div>
                      </div>
                      {selectedGoals.includes(goal.id) && (
                        <div className="text-blue-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">💡 AI Insight</h3>
            <p className="text-gray-700 text-sm">
              {selectedGoals.length === 0 && "Select your first goal to get personalized AI recommendations and a custom learning path."}
              {selectedGoals.length === 1 && "Great start! Consider adding 1-2 more goals for a comprehensive relationship development program."}
              {selectedGoals.length === 2 && "Perfect balance! Your AI coach will create an integrated approach across these two areas."}
              {selectedGoals.length === 3 && "Excellent selection! Your AI coach will design a holistic program that connects all three areas for maximum impact."}
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
          <button
            onClick={handleContinue}
            disabled={selectedGoals.length === 0 || isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              `Continue with ${selectedGoals.length} goal${selectedGoals.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalSelectionStep;
