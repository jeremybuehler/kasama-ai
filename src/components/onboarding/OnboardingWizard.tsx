/**
 * Comprehensive Onboarding Wizard for Kasama AI
 * Multi-step flow with AI coach introduction, goal setting, and personalization
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

// Onboarding Step Components
import WelcomeStep from './steps/WelcomeStep';
import PersonalInfoStep from './steps/PersonalInfoStep';
import GoalSelectionStep from './steps/GoalSelectionStep';
import AICoachIntroStep from './steps/AICoachIntroStep';
import PreferencesStep from './steps/PreferencesStep';
import FirstTaskStep from './steps/FirstTaskStep';
import CompletionStep from './steps/CompletionStep';

export interface OnboardingData {
  personalInfo: {
    fullName: string;
    age?: number;
    location?: string;
    relationshipStatus: 'single' | 'dating' | 'committed' | 'married' | 'complicated' | 'prefer_not_to_say';
  };
  goals: string[];
  preferences: {
    communicationStyle: 'supportive' | 'analytical' | 'direct' | 'formal';
    aiPersonality: 'encouraging' | 'analytical' | 'direct' | 'gentle';
    learningPace: 'slow' | 'moderate' | 'fast';
    reminderFrequency: 'daily' | 'weekly' | 'as_needed';
  };
  completedSteps: number[];
  currentStep: number;
  startedAt: string;
  completedAt?: string;
}

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingData) => void;
  className?: string;
}

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Welcome',
    description: 'Welcome to your relationship intelligence journey',
    component: WelcomeStep,
    required: true
  },
  {
    id: 2,
    title: 'About You',
    description: 'Tell us a bit about yourself',
    component: PersonalInfoStep,
    required: true
  },
  {
    id: 3,
    title: 'Your Goals',
    description: 'What would you like to work on?',
    component: GoalSelectionStep,
    required: true
  },
  {
    id: 4,
    title: 'Meet Your AI Coach',
    description: 'Get introduced to your personalized AI assistant',
    component: AICoachIntroStep,
    required: false
  },
  {
    id: 5,
    title: 'Preferences',
    description: 'Customize your experience',
    component: PreferencesStep,
    required: false
  },
  {
    id: 6,
    title: 'First Task',
    description: 'Complete your first relationship building activity',
    component: FirstTaskStep,
    required: false
  },
  {
    id: 7,
    title: 'All Set!',
    description: 'You\'re ready to begin your journey',
    component: CompletionStep,
    required: true
  }
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    personalInfo: {
      fullName: user?.user_metadata?.full_name || '',
      relationshipStatus: 'prefer_not_to_say'
    },
    goals: [],
    preferences: {
      communicationStyle: 'supportive',
      aiPersonality: 'encouraging',
      learningPace: 'moderate',
      reminderFrequency: 'daily'
    },
    completedSteps: [],
    currentStep: 1,
    startedAt: new Date().toISOString()
  });

  // Load existing onboarding data on mount
  useEffect(() => {
    loadOnboardingData();
  }, [user]);

  const loadOnboardingData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        console.error('Error loading onboarding data:', error);
        return;
      }

      if (data) {
        setOnboardingData({
          personalInfo: data.onboarding_data?.personalInfo || onboardingData.personalInfo,
          goals: data.primary_goals || [],
          preferences: data.onboarding_data?.preferences || onboardingData.preferences,
          completedSteps: data.completed_steps || [],
          currentStep: data.current_step || 1,
          startedAt: data.created_at,
          completedAt: data.completed_at
        });
        setCurrentStep(data.current_step || 1);
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const saveOnboardingData = async (data: Partial<OnboardingData>) => {
    if (!user) return;

    try {
      const updatedData = { ...onboardingData, ...data };
      
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          current_step: updatedData.currentStep,
          completed_steps: updatedData.completedSteps,
          primary_goals: updatedData.goals,
          onboarding_data: {
            personalInfo: updatedData.personalInfo,
            preferences: updatedData.preferences
          },
          completed_at: updatedData.completedAt
        });

      if (error) {
        console.error('Error saving onboarding data:', error);
        toast.error('Failed to save progress');
        return false;
      }

      setOnboardingData(updatedData);
      return true;
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      return false;
    }
  };

  const handleStepComplete = async (stepData: any) => {
    setIsLoading(true);

    try {
      const updatedData = {
        ...onboardingData,
        ...stepData,
        completedSteps: [...onboardingData.completedSteps, currentStep],
        currentStep: currentStep + 1
      };

      const saved = await saveOnboardingData(updatedData);
      
      if (saved) {
        if (currentStep < ONBOARDING_STEPS.length) {
          setCurrentStep(currentStep + 1);
        } else {
          // Onboarding complete
          await completeOnboarding(updatedData);
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = async () => {
    const currentStepInfo = ONBOARDING_STEPS[currentStep - 1];
    
    if (currentStepInfo.required) {
      toast.error('This step is required and cannot be skipped');
      return;
    }

    setIsLoading(true);

    try {
      const updatedData = {
        ...onboardingData,
        completedSteps: [...onboardingData.completedSteps, currentStep],
        currentStep: currentStep + 1
      };

      const saved = await saveOnboardingData(updatedData);
      
      if (saved) {
        if (currentStep < ONBOARDING_STEPS.length) {
          setCurrentStep(currentStep + 1);
        } else {
          await completeOnboarding(updatedData);
        }
      }
    } catch (error) {
      console.error('Error skipping step:', error);
      toast.error('Failed to skip step');
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (finalData: OnboardingData) => {
    if (!user) return;

    try {
      // Mark onboarding as complete
      finalData.completedAt = new Date().toISOString();
      await saveOnboardingData(finalData);

      // Update user profile with onboarding completion
      await updateProfile({
        onboardingCompleted: true,
        preferences: finalData.preferences
      });

      // Create initial user preferences record
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        ai_preferences: finalData.preferences,
        updated_at: new Date().toISOString()
      });

      toast.success('Welcome to Kasama AI! Your journey begins now.');
      
      onComplete?.(finalData);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    }
  };

  const currentStepInfo = ONBOARDING_STEPS[currentStep - 1];
  const StepComponent = currentStepInfo?.component;

  if (!StepComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Onboarding Complete
          </h2>
          <p className="text-gray-600">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-900">
              Step {currentStep} of {ONBOARDING_STEPS.length}
            </div>
            <div className="text-sm text-gray-600">
              {currentStepInfo.title}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="pt-20 pb-8">
        <StepComponent
          data={onboardingData}
          onNext={handleStepComplete}
          onBack={currentStep > 1 ? handleStepBack : undefined}
          onSkip={!currentStepInfo.required ? handleSkipStep : undefined}
          isLoading={isLoading}
          stepInfo={currentStepInfo}
        />
      </div>

      {/* Step Indicators (bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center space-x-2">
          {ONBOARDING_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                index + 1 < currentStep
                  ? 'bg-green-500'
                  : index + 1 === currentStep
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
