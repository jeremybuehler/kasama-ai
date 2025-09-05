/**
 * AI Component Factory Test Suite
 * Tests for dynamic AI-powered component generation and optimization
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { aiComponentFactory } from '../../lib/ai-component-factory';
import { 
  renderWithProviders, 
  createMockApiManager, 
  createMockOrchestrator,
  mockUserProfiles,
  mockAIResponses,
  expectLoadingState,
  waitForAIResponse,
  createUserInteraction
} from '../utils/test-utils';

// Mock the dependencies
jest.mock('../../lib/api-route-manager');
jest.mock('../../services/ai/orchestrator');

describe('AI Component Factory', () => {
  let mockApiManager: any;
  let mockOrchestrator: any;
  let user: any;

  beforeEach(() => {
    mockApiManager = createMockApiManager();
    mockOrchestrator = createMockOrchestrator();
    user = createUserInteraction();
    
    // Reset localStorage
    localStorage.clear();
    
    // Mock performance metrics
    Object.defineProperty(global.performance, 'now', {
      value: jest.fn(() => Date.now())
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Registration and Creation', () => {
    test('registers a new AI component with proper configuration', async () => {
      const componentConfig = {
        id: 'test-insight-card',
        name: 'Insight Card',
        category: 'content' as const,
        aiPersonalization: {
          userPreferences: true,
          contextualAdaptation: true,
          learningOptimization: true,
          communicationStyle: true
        },
        dependencies: ['api-route-manager'],
        performanceTargets: {
          renderTime: 50,
          interactionDelay: 100,
          memoryUsage: 10
        }
      };

      aiComponentFactory.register(componentConfig);
      const registeredComponents = aiComponentFactory.getRegisteredComponents();
      
      expect(registeredComponents).toHaveProperty('test-insight-card');
      expect(registeredComponents['test-insight-card']).toMatchObject(componentConfig);
    });

    test('creates AI-powered component with proper props injection', async () => {
      const TestComponent = aiComponentFactory.createComponent('insight-card', {
        userId: 'test-user',
        category: 'communication'
      });

      renderWithProviders(
        <TestComponent title="Test Insight" message="AI-generated content" />,
        { 
          initialUser: mockUserProfiles.free,
          mockApiManager,
          mockOrchestrator 
        }
      );

      expect(screen.getByText('Test Insight')).toBeInTheDocument();
      expect(screen.getByText('AI-generated content')).toBeInTheDocument();
    });

    test('handles component creation with invalid configuration', () => {
      expect(() => {
        aiComponentFactory.createComponent('non-existent-component', {});
      }).toThrow('Component not found: non-existent-component');
    });
  });

  describe('AI Personalization', () => {
    test('applies user preference personalization to components', async () => {
      const PersonalizedComponent = aiComponentFactory.createComponent('personalized-dashboard', {
        userId: mockUserProfiles.premium.id,
        subscriptionTier: 'premium'
      });

      renderWithProviders(
        <PersonalizedComponent />,
        { 
          initialUser: mockUserProfiles.premium,
          mockApiManager,
          mockOrchestrator 
        }
      );

      await waitForAIResponse();

      // Should have premium-specific content
      expect(screen.getByTestId('premium-features')).toBeInTheDocument();
      expect(screen.getByText(/advanced analytics/i)).toBeInTheDocument();
    });

    test('adapts communication style based on user preferences', async () => {
      const CommunicationComponent = aiComponentFactory.createComponent('ai-guidance', {
        userId: mockUserProfiles.professional.id,
        communicationStyle: 'formal'
      });

      renderWithProviders(
        <CommunicationComponent />,
        { 
          initialUser: mockUserProfiles.professional,
          mockApiManager,
          mockOrchestrator 
        }
      );

      await waitForAIResponse();

      // Should use formal language
      const content = screen.getByTestId('ai-guidance-content');
      expect(content.textContent).toMatch(/please consider|we recommend|you may find/i);
      expect(content.textContent).not.toMatch(/hey|awesome|super/i);
    });

    test('optimizes content for different learning paces', async () => {
      const LearningComponent = aiComponentFactory.createComponent('learning-module', {
        userId: 'test-user',
        learningPace: 'fast'
      });

      renderWithProviders(
        <LearningComponent moduleId="communication-basics" />,
        { 
          initialUser: { ...mockUserProfiles.free, preferences: { 
            ...mockUserProfiles.free.preferences, 
            learningPace: 'fast' as const
          }},
          mockApiManager,
          mockOrchestrator 
        }
      );

      await waitForAIResponse();

      // Should show advanced options for fast learners
      expect(screen.getByTestId('advanced-options')).toBeInTheDocument();
      expect(screen.queryByTestId('beginner-tips')).not.toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    test('measures and reports component render performance', async () => {
      const PerformanceComponent = aiComponentFactory.createComponent('performance-test', {
        userId: 'test-user'
      });

      const startTime = performance.now();
      
      renderWithProviders(
        <PerformanceComponent complexData={Array(1000).fill({ id: 1, value: 'test' })} />,
        { 
          initialUser: mockUserProfiles.free,
          mockApiManager,
          mockOrchestrator 
        }
      );

      await waitForAIResponse();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should complete within performance target
      expect(renderTime).toBeLessThan(100);
    });

    test('implements lazy loading for expensive AI components', async () => {
      const LazyComponent = aiComponentFactory.createComponent('heavy-ai-analysis', {
        userId: 'test-user',
        lazy: true
      });

      renderWithProviders(
        <div>
          <h1>App Content</h1>
          <LazyComponent analysisType="deep" />
        </div>,
        { 
          initialUser: mockUserProfiles.free,
          mockApiManager,
          mockOrchestrator 
        }
      );

      // Should show app content immediately
      expect(screen.getByText('App Content')).toBeInTheDocument();
      
      // AI component should be loading
      expectLoadingState('Loading AI analysis...');
      
      await waitForAIResponse();
      
      // Should eventually load the AI content
      expect(screen.getByTestId('ai-analysis-results')).toBeInTheDocument();
    });

    test('caches AI responses for improved performance', async () => {
      const CachedComponent = aiComponentFactory.createComponent('cached-insights', {
        userId: 'test-user',
        cacheKey: 'daily-insights-2024-01-01'
      });

      // First render
      renderWithProviders(<CachedComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitForAIResponse();
      
      expect(mockOrchestrator.generateDailyInsights).toHaveBeenCalledTimes(1);

      // Second render with same cache key
      renderWithProviders(<CachedComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      // Should use cached data, not call AI again
      expect(mockOrchestrator.generateDailyInsights).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('handles AI service failures gracefully', async () => {
      mockOrchestrator.generateDailyInsights.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const ResilientComponent = aiComponentFactory.createComponent('resilient-insights', {
        userId: 'test-user'
      });

      renderWithProviders(<ResilientComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      });

      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
      
      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    test('provides fallback content when AI fails', async () => {
      mockApiManager.request.mockRejectedValue(new Error('Network error'));

      const FallbackComponent = aiComponentFactory.createComponent('fallback-test', {
        userId: 'test-user',
        fallbackContent: 'Static fallback content'
      });

      renderWithProviders(<FallbackComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitFor(() => {
        expect(screen.getByText('Static fallback content')).toBeInTheDocument();
      });
    });

    test('retries failed AI requests with exponential backoff', async () => {
      let attemptCount = 0;
      mockOrchestrator.generateDailyInsights.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve(mockAIResponses.dailyInsights);
      });

      const RetryComponent = aiComponentFactory.createComponent('retry-test', {
        userId: 'test-user',
        retryAttempts: 3,
        retryDelay: 100
      });

      renderWithProviders(<RetryComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-content')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(attemptCount).toBe(3);
    });
  });

  describe('Real-time Updates and Reactivity', () => {
    test('updates components when user preferences change', async () => {
      const ReactiveComponent = aiComponentFactory.createComponent('reactive-dashboard', {
        userId: 'test-user',
        reactive: true
      });

      const { rerender } = renderWithProviders(<ReactiveComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitForAIResponse();
      expect(screen.getByTestId('free-tier-content')).toBeInTheDocument();

      // Simulate user upgrade
      rerender(
        renderWithProviders(<ReactiveComponent />, { 
          initialUser: mockUserProfiles.premium,
          mockApiManager,
          mockOrchestrator 
        }).container
      );

      await waitForAIResponse();
      expect(screen.getByTestId('premium-tier-content')).toBeInTheDocument();
    });

    test('responds to real-time user interactions', async () => {
      const InteractiveComponent = aiComponentFactory.createComponent('interactive-guidance', {
        userId: 'test-user'
      });

      renderWithProviders(<InteractiveComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitForAIResponse();

      // Click on an insight for more details
      const insightCard = screen.getByTestId('insight-card-0');
      await user.click(insightCard);

      await waitFor(() => {
        expect(screen.getByTestId('detailed-explanation')).toBeInTheDocument();
      });

      expect(mockOrchestrator.provideCommunicationGuidance).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'detailed_explanation',
          userId: 'test-user'
        })
      );
    });
  });

  describe('Analytics and Learning', () => {
    test('tracks component usage analytics', async () => {
      const AnalyticsComponent = aiComponentFactory.createComponent('analytics-test', {
        userId: 'test-user',
        trackAnalytics: true
      });

      renderWithProviders(<AnalyticsComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitForAIResponse();

      // Simulate user interaction
      const actionButton = screen.getByRole('button', { name: /take action/i });
      await user.click(actionButton);

      // Should track analytics
      expect(mockApiManager.request).toHaveBeenCalledWith('analytics.track', {
        event: 'component_interaction',
        componentId: 'analytics-test',
        userId: 'test-user',
        action: 'button_click'
      });
    });

    test('learns from user feedback to improve recommendations', async () => {
      const LearningComponent = aiComponentFactory.createComponent('learning-recommendations', {
        userId: 'test-user'
      });

      renderWithProviders(<LearningComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitForAIResponse();

      // User provides feedback
      const feedbackButton = screen.getByRole('button', { name: /helpful/i });
      await user.click(feedbackButton);

      expect(mockApiManager.request).toHaveBeenCalledWith('ai.feedback', {
        componentId: 'learning-recommendations',
        userId: 'test-user',
        feedback: 'positive',
        context: expect.any(Object)
      });
    });
  });

  describe('Accessibility and Inclusive Design', () => {
    test('ensures AI components meet accessibility standards', async () => {
      const AccessibleComponent = aiComponentFactory.createComponent('accessible-insights', {
        userId: 'test-user',
        accessibility: {
          highContrast: true,
          screenReader: true,
          keyboardNavigation: true
        }
      });

      renderWithProviders(<AccessibleComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitForAIResponse();

      // Check ARIA labels
      expect(screen.getByLabelText(/ai generated insights/i)).toBeInTheDocument();
      
      // Check keyboard navigation
      const insightCards = screen.getAllByTestId(/insight-card/);
      insightCards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
        expect(card).toHaveAttribute('role', 'button');
      });

      // Check high contrast mode
      const container = screen.getByTestId('insights-container');
      expect(container).toHaveClass('high-contrast');
    });

    test('adapts content for different cognitive abilities', async () => {
      const CognitiveComponent = aiComponentFactory.createComponent('cognitive-friendly', {
        userId: 'test-user',
        cognitiveSupport: {
          simplifiedLanguage: true,
          visualCues: true,
          progressIndicators: true
        }
      });

      renderWithProviders(<CognitiveComponent />, { 
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator 
      });

      await waitForAIResponse();

      // Should use simple language
      const content = screen.getByTestId('component-content');
      expect(content.textContent).toMatch(/simple|easy|clear/i);
      
      // Should show visual progress indicators
      expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
      
      // Should have visual cues
      expect(screen.getAllByTestId(/icon-/)).toHaveLength(3);
    });
  });
});
