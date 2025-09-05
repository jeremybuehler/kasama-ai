/**
 * Enhanced Test Utilities for AI-Powered Components
 * Comprehensive testing utilities with AI service mocking and user simulation
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { AIOrchestrator } from '../../services/ai/orchestrator';
import { apiRouteManager } from '../../lib/api-route-manager';
import { aiComponentFactory } from '../../lib/ai-component-factory';

// Mock user profiles for testing
export const mockUserProfiles = {
  free: {
    id: 'user-free-123',
    email: 'free@example.com',
    subscriptionTier: 'free' as const,
    preferences: {
      communicationStyle: 'supportive' as const,
      aiPersonality: 'encouraging' as const,
      learningPace: 'moderate' as const
    },
    onboardingCompleted: true
  },
  premium: {
    id: 'user-premium-456',
    email: 'premium@example.com',
    subscriptionTier: 'premium' as const,
    preferences: {
      communicationStyle: 'analytical' as const,
      aiPersonality: 'direct' as const,
      learningPace: 'fast' as const
    },
    onboardingCompleted: true
  },
  professional: {
    id: 'user-pro-789',
    email: 'pro@example.com',
    subscriptionTier: 'professional' as const,
    preferences: {
      communicationStyle: 'formal' as const,
      aiPersonality: 'analytical' as const,
      learningPace: 'fast' as const
    },
    onboardingCompleted: true
  }
};

// Mock AI responses for testing
export const mockAIResponses = {
  assessmentAnalysis: {
    score: 85,
    insights: [
      {
        type: 'strength' as const,
        title: 'Excellent Communication',
        description: 'You demonstrate strong active listening skills.',
        priority: 'high' as const,
        category: 'communication',
        evidence: ['Active listening score: 90%', 'Empathy rating: 8.5/10']
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Practice Conflict Resolution',
        description: 'Work on de-escalation techniques for challenging conversations.',
        category: 'communication',
        priority: 'medium' as const,
        estimatedTime: 15,
        difficulty: 'intermediate' as const,
        actionItems: ['Complete conflict resolution exercise', 'Practice active listening']
      }
    ],
    strengths: ['Active listening', 'Empathy', 'Emotional awareness'],
    growthAreas: ['Conflict resolution', 'Boundary setting'],
    confidenceLevel: 0.92
  },
  
  dailyInsights: {
    insights: [
      {
        title: 'Communication Growth',
        message: "You've improved your active listening by 15% this week!",
        icon: '💬',
        priority: 'high' as const,
        type: 'progress' as const
      },
      {
        title: 'Practice Reminder',
        message: 'Try the mindful breathing exercise today for deeper connection.',
        icon: '🧘',
        priority: 'medium' as const,
        type: 'suggestion' as const
      }
    ],
    motivationalMessage: "You're making excellent progress on your relationship journey!",
    nextSteps: ['Complete today\'s check-in', 'Practice gratitude exercise']
  },
  
  learningPath: {
    pathId: 'path-123',
    name: 'Communication Mastery',
    description: 'Develop advanced communication skills for deeper connections.',
    difficulty: 'intermediate' as const,
    estimatedDurationWeeks: 8,
    modules: [
      {
        id: 'module-1',
        title: 'Active Listening Fundamentals',
        description: 'Learn the core principles of active listening.',
        order: 1,
        estimatedTimeMinutes: 30,
        practices: [
          {
            id: 'practice-1',
            title: 'Mirror Exercise',
            description: 'Practice reflecting what you hear.',
            category: 'listening',
            difficulty: 'beginner' as const,
            estimatedTimeMinutes: 10,
            instructions: [
              { step: 1, instruction: 'Find a practice partner or use audio recording' },
              { step: 2, instruction: 'Listen to a 2-minute story without interrupting' },
              { step: 3, instruction: 'Reflect back what you heard in your own words' }
            ],
            tags: ['active-listening', 'communication'],
            learningObjectives: ['Improve listening accuracy', 'Develop empathy']
          }
        ],
        assessments: ['listening-quiz-1'],
        milestones: [
          { id: 'milestone-1', title: 'Complete all practices', completed: false, progress: 0 }
        ]
      }
    ],
    prerequisites: [],
    learningObjectives: [
      'Master active listening techniques',
      'Develop empathetic communication',
      'Learn conflict resolution strategies'
    ],
    personalizationScore: 0.94
  }
};

// Mock API route manager
export const createMockApiManager = () => {
  const mockManager = {
    request: jest.fn(),
    batchRequest: jest.fn(),
    getRouteAnalytics: jest.fn(),
    registerRoute: jest.fn()
  };

  // Setup default mock responses
  mockManager.request.mockImplementation((routeId: string, data?: any) => {
    switch (routeId) {
      case 'ai.assessment':
        return Promise.resolve(mockAIResponses.assessmentAnalysis);
      case 'ai.insights':
        return Promise.resolve(mockAIResponses.dailyInsights);
      case 'ai.learningPath':
        return Promise.resolve(mockAIResponses.learningPath);
      case 'user.profile':
        return Promise.resolve(mockUserProfiles.free);
      case 'progress.tracking':
        return Promise.resolve({
          overall: 72,
          weekly: 15,
          streak: 5,
          completedPractices: 8,
          totalPractices: 12
        });
      default:
        return Promise.resolve({});
    }
  });

  return mockManager;
};

// Mock AI orchestrator
export const createMockOrchestrator = () => {
  const mockOrchestrator = {
    analyzeAssessment: jest.fn(),
    generateLearningPath: jest.fn(),
    generateDailyInsights: jest.fn(),
    trackProgress: jest.fn(),
    provideCommunicationGuidance: jest.fn(),
    getSystemMetrics: jest.fn(),
    getHealthStatus: jest.fn()
  };

  // Setup default responses
  mockOrchestrator.analyzeAssessment.mockResolvedValue(mockAIResponses.assessmentAnalysis);
  mockOrchestrator.generateLearningPath.mockResolvedValue(mockAIResponses.learningPath);
  mockOrchestrator.generateDailyInsights.mockResolvedValue(mockAIResponses.dailyInsights);
  mockOrchestrator.trackProgress.mockResolvedValue({
    currentLevel: 'intermediate',
    progressPercentage: 72,
    milestones: [],
    trends: []
  });
  mockOrchestrator.provideCommunicationGuidance.mockResolvedValue({
    advice: 'Practice active listening techniques',
    strategies: ['Mirror back what you hear', 'Ask clarifying questions'],
    priority: 'high'
  });
  mockOrchestrator.getHealthStatus.mockResolvedValue({
    status: 'healthy',
    agents: { all: 'operational' }
  });

  return mockOrchestrator;
};

// Mock Supabase client
export const createMockSupabase = () => ({
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    }),
    resetPasswordForEmail: jest.fn()
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null })
});

// Test providers wrapper
interface ProvidersProps {
  children: React.ReactNode;
  initialUser?: typeof mockUserProfiles.free;
  queryClient?: QueryClient;
  mockApiManager?: any;
  mockOrchestrator?: any;
}

const TestProviders: React.FC<ProvidersProps> = ({ 
  children, 
  initialUser,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  }),
  mockApiManager,
  mockOrchestrator
}) => {
  // Mock global services if provided
  React.useEffect(() => {
    if (mockApiManager) {
      (global as any).mockApiManager = mockApiManager;
    }
    if (mockOrchestrator) {
      (global as any).mockOrchestrator = mockOrchestrator;
    }
    if (initialUser) {
      localStorage.setItem('user_id', initialUser.id);
      localStorage.setItem('ai_context', JSON.stringify({
        userId: initialUser.id,
        subscriptionTier: initialUser.subscriptionTier,
        preferences: initialUser.preferences
      }));
    }
  }, [mockApiManager, mockOrchestrator, initialUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Enhanced render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: typeof mockUserProfiles.free;
  mockApiManager?: any;
  mockOrchestrator?: any;
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const {
    initialUser,
    mockApiManager,
    mockOrchestrator,
    queryClient,
    ...renderOptions
  } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders 
      initialUser={initialUser}
      mockApiManager={mockApiManager}
      mockOrchestrator={mockOrchestrator}
      queryClient={queryClient}
    >
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// User simulation utilities
export const createUserInteraction = () => {
  return userEvent.setup();
};

// AI component test helpers
export const waitForAIResponse = async (timeout = 3000) => {
  await waitFor(() => {
    // Wait for loading states to complete
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  }, { timeout });
};

export const expectAIInsight = (insightText: string) => {
  return expect(screen.getByText(insightText)).toBeInTheDocument();
};

export const expectLoadingState = (loadingText?: string) => {
  const loadingElement = loadingText 
    ? screen.getByText(loadingText)
    : screen.getByRole('status') || screen.getByTestId('loading');
  
  return expect(loadingElement).toBeInTheDocument();
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  await waitFor(() => {
    // Wait for initial render to complete
  });
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const expectAccessibleButton = (buttonText: string) => {
  const button = screen.getByRole('button', { name: buttonText });
  expect(button).toBeInTheDocument();
  expect(button).not.toHaveAttribute('aria-disabled', 'true');
  return button;
};

export const expectAccessibleHeading = (headingText: string, level?: number) => {
  const heading = level 
    ? screen.getByRole('heading', { name: headingText, level })
    : screen.getByRole('heading', { name: headingText });
  
  expect(heading).toBeInTheDocument();
  return heading;
};

// Mock data generators
export const generateMockAssessmentData = (overrides?: Partial<typeof mockAIResponses.assessmentAnalysis>) => {
  return {
    ...mockAIResponses.assessmentAnalysis,
    ...overrides
  };
};

export const generateMockUserProfile = (
  tier: 'free' | 'premium' | 'professional' = 'free',
  overrides?: Partial<typeof mockUserProfiles.free>
) => {
  return {
    ...mockUserProfiles[tier],
    ...overrides
  };
};

// Jest custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAIResponse(): R;
      toBeLoadingAIContent(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toHaveAIResponse(received) {
    const hasInsight = received.querySelector('[data-testid="ai-insight"]');
    const hasRecommendation = received.querySelector('[data-testid="ai-recommendation"]');
    
    const pass = !!(hasInsight || hasRecommendation);
    
    return {
      message: () => 
        pass
          ? `Expected element not to have AI response content`
          : `Expected element to have AI response content (insight or recommendation)`,
      pass
    };
  },
  
  toBeLoadingAIContent(received) {
    const hasSpinner = received.querySelector('[data-testid="ai-loading"]');
    const hasLoadingText = received.textContent?.includes('AI is') || 
                          received.textContent?.includes('Processing') ||
                          received.textContent?.includes('Analyzing');
    
    const pass = !!(hasSpinner || hasLoadingText);
    
    return {
      message: () => 
        pass
          ? `Expected element not to be loading AI content`
          : `Expected element to be loading AI content`,
      pass
    };
  }
});

export * from '@testing-library/react';
export { userEvent };

// Default export for convenience
export default {
  renderWithProviders,
  createUserInteraction,
  waitForAIResponse,
  expectAIInsight,
  expectLoadingState,
  measureRenderTime,
  expectAccessibleButton,
  expectAccessibleHeading,
  mockUserProfiles,
  mockAIResponses,
  createMockApiManager,
  createMockOrchestrator,
  generateMockAssessmentData,
  generateMockUserProfile
};
