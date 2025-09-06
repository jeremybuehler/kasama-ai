/**
 * First Task Step - Complete Your First Activity
 * Provides an engaging first experience with relationship-building tasks
 */

import React, { useState } from 'react';
import { OnboardingData } from '../OnboardingWizard';

interface FirstTaskStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
  onSkip?: () => void;
  isLoading: boolean;
  stepInfo: any;
}

interface Task {
  id: string;
  title: string;
  description: string;
  timeEstimate: string;
  category: string;
  icon: string;
  instructions: string[];
  reflection: string;
  goalTags: string[];
}

const FIRST_TASKS: Task[] = [
  {
    id: 'gratitude-reflection',
    title: 'Gratitude for Relationships',
    description: 'Reflect on the positive relationships in your life',
    timeEstimate: '3-5 minutes',
    category: 'Reflection',
    icon: '💕',
    instructions: [
      'Think about the people who matter most to you',
      'Write down 3 specific things you appreciate about these relationships',
      'Consider how these relationships have helped you grow'
    ],
    reflection: 'What did you discover about the value of your relationships?',
    goalTags: ['personal-growth', 'improve-communication']
  },
  {
    id: 'communication-check',
    title: 'Communication Style Assessment',
    description: 'Understand your natural communication patterns',
    timeEstimate: '5-7 minutes',
    category: 'Assessment',
    icon: '💬',
    instructions: [
      'Think about a recent conversation that didn\'t go as planned',
      'Identify what communication pattern you used (direct, passive, emotional, logical)',
      'Consider what you might do differently next time',
      'Write down one communication strength you have'
    ],
    reflection: 'How might changing your communication approach improve your relationships?',
    goalTags: ['improve-communication', 'resolve-conflicts']
  },
  {
    id: 'values-alignment',
    title: 'Relationship Values Clarification',
    description: 'Identify what matters most to you in relationships',
    timeEstimate: '4-6 minutes',
    category: 'Values',
    icon: '🧭',
    instructions: [
      'From the list below, choose your top 5 relationship values',
      'Rank them in order of importance to you',
      'Write a sentence about why your #1 value matters most',
      'Consider how well your current relationships align with these values'
    ],
    reflection: 'How do your values influence your relationship choices and behaviors?',
    goalTags: ['personal-growth', 'dating-confidence', 'build-intimacy']
  },
  {
    id: 'daily-intention',
    title: 'Set a Relationship Intention',
    description: 'Create a positive intention for your relationship growth',
    timeEstimate: '2-4 minutes',
    category: 'Intention Setting',
    icon: '🎯',
    instructions: [
      'Choose one area where you want to be more intentional in relationships',
      'Write a specific, positive intention (e.g., "I will listen with curiosity")',
      'Visualize how practicing this intention will improve your relationships',
      'Choose a simple daily reminder to practice this intention'
    ],
    reflection: 'What small action can you take today to practice this intention?',
    goalTags: ['improve-communication', 'personal-growth']
  }
];

const RELATIONSHIP_VALUES = [
  'Trust & Honesty', 'Open Communication', 'Mutual Respect', 'Emotional Support',
  'Shared Adventures', 'Personal Growth', 'Physical Intimacy', 'Financial Compatibility',
  'Family Harmony', 'Spiritual Connection', 'Independence', 'Loyalty',
  'Humor & Fun', 'Intellectual Stimulation', 'Stability & Security', 'Creativity'
];

const FirstTaskStep: React.FC<FirstTaskStepProps> = ({
  data,
  onNext,
  onBack,
  onSkip,
  isLoading,
  stepInfo
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskStarted, setTaskStarted] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [taskCompleted, setTaskCompleted] = useState(false);

  // Filter tasks based on user's goals
  const userGoals = data.goals || [];
  const recommendedTasks = FIRST_TASKS.filter(task => 
    task.goalTags.some(tag => userGoals.includes(tag))
  );
  const availableTasks = recommendedTasks.length > 0 ? recommendedTasks : FIRST_TASKS.slice(0, 2);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setTaskStarted(true);
    setResponses({});
    setSelectedValues([]);
    setTaskCompleted(false);
  };

  const handleResponseChange = (key: string, value: string) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleValueToggle = (value: string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else if (prev.length < 5) {
        return [...prev, value];
      }
      return prev;
    });
  };

  const handleTaskComplete = () => {
    setTaskCompleted(true);
  };

  const handleContinue = () => {
    const taskData = {
      firstTask: {
        taskId: selectedTask?.id,
        taskTitle: selectedTask?.title,
        responses: responses,
        selectedValues: selectedValues,
        completedAt: new Date().toISOString()
      }
    };

    onNext(taskData);
  };

  const canCompleteTask = () => {
    if (!selectedTask) return false;
    
    if (selectedTask.id === 'values-alignment') {
      return selectedValues.length === 5 && responses.topValueReason && responses.reflection;
    }
    
    return responses.reflection && Object.keys(responses).length >= 2;
  };

  if (!taskStarted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Your First Task
          </h1>
          <p className="text-lg text-gray-600">
            Start your relationship journey with a meaningful activity. Choose one that resonates with your goals.
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {availableTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTaskSelect(task)}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{task.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {task.timeEstimate}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                      {task.category}
                    </span>
                    {userGoals.some(goal => task.goalTags.includes(goal)) && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        Matches your goals
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 hover:text-gray-700 font-medium transition-colors"
          >
            ← Back
          </button>
          
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-6 py-3 text-gray-500 hover:text-gray-600 font-medium transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!selectedTask) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">{selectedTask.icon}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {selectedTask.title}
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          {selectedTask.description}
        </p>
        <div className="inline-flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{selectedTask.timeEstimate}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Instructions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
          <ol className="space-y-3">
            {selectedTask.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-700">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Task-specific Content */}
        {selectedTask.id === 'values-alignment' && (
          <div className="mb-8">
            <h4 className="font-medium text-gray-900 mb-3">Select Your Top 5 Relationship Values</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {RELATIONSHIP_VALUES.map((value) => (
                <label
                  key={value}
                  className={`p-3 border rounded-lg cursor-pointer text-sm transition-all ${
                    selectedValues.includes(value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  } ${selectedValues.length >= 5 && !selectedValues.includes(value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(value)}
                    onChange={() => handleValueToggle(value)}
                    className="sr-only"
                    disabled={selectedValues.length >= 5 && !selectedValues.includes(value)}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Selected: {selectedValues.length}/5
            </p>

            {selectedValues.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why is "{selectedValues[0]}" your most important relationship value?
                </label>
                <textarea
                  value={responses.topValueReason || ''}
                  onChange={(e) => handleResponseChange('topValueReason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Write about why this value matters to you..."
                />
              </div>
            )}
          </div>
        )}

        {/* General Response Fields */}
        {selectedTask.id !== 'values-alignment' && (
          <div className="mb-8">
            <h4 className="font-medium text-gray-900 mb-3">Your Response</h4>
            <textarea
              value={responses.mainResponse || ''}
              onChange={(e) => handleResponseChange('mainResponse', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Write your thoughts here..."
            />
          </div>
        )}

        {/* Reflection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reflection: {selectedTask.reflection}
          </label>
          <textarea
            value={responses.reflection || ''}
            onChange={(e) => handleResponseChange('reflection', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Take a moment to reflect on your insights..."
          />
        </div>

        {/* Complete Task Button */}
        {!taskCompleted && (
          <div className="text-center">
            <button
              onClick={handleTaskComplete}
              disabled={!canCompleteTask()}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Complete Task ✓
            </button>
          </div>
        )}

        {/* Task Completed */}
        {taskCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Great job completing your first task!
            </h3>
            <p className="text-green-700 text-sm">
              You've taken the first step in your relationship growth journey. 
              Your AI coach will use these insights to provide personalized guidance.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setTaskStarted(false)}
          className="px-6 py-3 text-gray-600 hover:text-gray-700 font-medium transition-colors"
        >
          ← Choose Different Task
        </button>
        
        <div className="flex items-center space-x-4">
          {onSkip && !taskCompleted && (
            <button
              onClick={onSkip}
              className="px-6 py-3 text-gray-500 hover:text-gray-600 font-medium transition-colors"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!taskCompleted || isLoading}
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
    </div>
  );
};

export default FirstTaskStep;
