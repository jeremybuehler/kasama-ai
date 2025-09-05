/**
 * Adaptive Dashboard Component Test Suite
 * Tests for AI-powered adaptive dashboard with dynamic widgets and personalization
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { AdaptiveDashboard } from '../../components/AdaptiveDashboard';
import { 
  renderWithProviders, 
  createUserInteraction,
  waitForAIResponse,
  expectLoadingState,
  mockUserProfiles,
  mockAIResponses,
  createMockApiManager,
  createMockOrchestrator
} from '../utils/test-utils';

describe('AdaptiveDashboard', () => {
  let mockApiManager: any;
  let mockOrchestrator: any;
  let user: any;

  beforeEach(() => {
    mockApiManager = createMockApiManager();
    mockOrchestrator = createMockOrchestrator();
    user = createUserInteraction();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Initialization', () => {
    test('renders loading state initially', () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      expectLoadingState('Personalizing your dashboard...');
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    });

    test('loads dashboard with default widgets', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      expect(screen.getByTestId('adaptive-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('progress-summary-widget')).toBeInTheDocument();
      expect(screen.getByTestId('daily-insights-widget')).toBeInTheDocument();
      expect(screen.getByTestId('current-practices-widget')).toBeInTheDocument();
    });

    test('adapts layout for different subscription tiers', async () => {
      const { rerender } = renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();
      expect(screen.getAllByTestId(/widget-/)).toHaveLength(3); // Free tier widgets

      rerender(
        renderWithProviders(<AdaptiveDashboard />, {
          initialUser: mockUserProfiles.professional,
          mockApiManager,
          mockOrchestrator
        }).container
      );

      await waitForAIResponse();
      expect(screen.getAllByTestId(/widget-/)).toHaveLength(6); // Professional tier gets more widgets
      expect(screen.getByTestId('advanced-analytics-widget')).toBeInTheDocument();
      expect(screen.getByTestId('ai-coach-widget')).toBeInTheDocument();
    });
  });

  describe('Widget Rendering and Interaction', () => {
    test('renders progress summary widget with accurate data', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.premium,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      const progressWidget = screen.getByTestId('progress-summary-widget');
      expect(progressWidget).toBeInTheDocument();

      expect(screen.getByText('72%')).toBeInTheDocument(); // Overall progress
      expect(screen.getByText('5')).toBeInTheDocument(); // Current streak
      expect(screen.getByText(/15%/)).toBeInTheDocument(); // Weekly progress
    });

    test('renders daily insights widget with personalized content', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      const insightsWidget = screen.getByTestId('daily-insights-widget');
      expect(insightsWidget).toBeInTheDocument();

      expect(screen.getByText('Communication Growth')).toBeInTheDocument();
      expect(screen.getByText(/improved.*active listening/i)).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument(); // Icon
    });

    test('renders current practices widget with actionable items', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.premium,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      const practicesWidget = screen.getByTestId('current-practices-widget');
      expect(practicesWidget).toBeInTheDocument();

      expect(screen.getByText('Mirror Exercise')).toBeInTheDocument();
      expect(screen.getByText(/10.*minutes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
    });

    test('handles widget interactions correctly', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.premium,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      // Click on an insight card
      const insightCard = screen.getByTestId('insight-card-0');
      await user.click(insightCard);

      expect(screen.getByTestId('insight-details-modal')).toBeInTheDocument();
      expect(screen.getByText(/detailed explanation/i)).toBeInTheDocument();
    });

    test('allows widget customization', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.professional,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      // Open customization menu
      const customizeButton = screen.getByRole('button', { name: /customize dashboard/i });
      await user.click(customizeButton);

      expect(screen.getByTestId('dashboard-customization-panel')).toBeInTheDocument();

      // Toggle a widget
      const analyticsToggle = screen.getByRole('switch', { name: /advanced analytics/i });
      await user.click(analyticsToggle);

      expect(mockApiManager.request).toHaveBeenCalledWith('user.preferences.update', {
        dashboardWidgets: expect.objectContaining({
          advancedAnalytics: false
        })
      });
    });
  });

  describe('AI Personalization', () => {
    test('adapts widgets based on user behavior patterns', async () => {
      mockApiManager.request.mockImplementation((routeId: string) => {
        if (routeId === 'ai.insights') {
          return Promise.resolve({
            insights: [
              {
                title: 'Practice Consistency',
                message: 'You practice most effectively in the morning.',
                icon: '🌅',
                priority: 'high' as const,
                type: 'suggestion' as const
              }
            ],
            motivationalMessage: 'Your morning routine is working well!',
            nextSteps: ['Continue morning practices']
          });
        }
        return mockApiManager.request.mockImplementation.fallback(routeId);
      });

      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      expect(screen.getByText('Practice Consistency')).toBeInTheDocument();
      expect(screen.getByText(/morning routine/i)).toBeInTheDocument();
      expect(screen.getByText('🌅')).toBeInTheDocument();
    });

    test('adjusts widget priority based on user engagement', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.premium,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      // Simulate user engaging more with insights widget
      const insightsWidget = screen.getByTestId('daily-insights-widget');
      await user.click(insightsWidget);
      await user.click(insightsWidget); // Multiple interactions

      // Widget should move up in priority (implementation would track this)
      await waitFor(() => {
        const widgets = screen.getAllByTestId(/widget-container-/);
        const insightsIndex = widgets.findIndex(w => 
          w.getAttribute('data-widget-type') === 'insights'
        );
        expect(insightsIndex).toBeLessThan(2); // Should be in top positions
      });
    });

    test('provides contextual recommendations based on progress', async () => {
      mockApiManager.request.mockImplementation((routeId: string) => {
        if (routeId === 'progress.tracking') {
          return Promise.resolve({
            overall: 45, // Lower progress
            weekly: 8,
            streak: 2,
            completedPractices: 3,
            totalPractices: 12
          });
        }
        return mockApiManager.request.mockImplementation.fallback(routeId);
      });

      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      // Should show encouragement for lower progress
      expect(screen.getByText(/keep going/i)).toBeInTheDocument();
      expect(screen.getByTestId('motivation-boost')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('updates dashboard when new data arrives', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();
      
      expect(screen.getByText('5')).toBeInTheDocument(); // Initial streak

      // Simulate data update
      mockApiManager.request.mockImplementation((routeId: string) => {
        if (routeId === 'progress.tracking') {
          return Promise.resolve({
            overall: 75,
            weekly: 18,
            streak: 6, // Updated streak
            completedPractices: 9,
            totalPractices: 12
          });
        }
        return mockApiManager.request.mockImplementation.fallback(routeId);
      });

      // Trigger refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument(); // Updated streak
      });
    });

    test('handles real-time notifications', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.premium,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      // Simulate incoming notification
      const notification = {
        type: 'achievement',
        title: 'New Milestone!',
        message: 'You completed your first week streak!',
        priority: 'high'
      };

      // This would typically come from a WebSocket or similar
      fireEvent(window, new CustomEvent('dashboard-notification', {
        detail: notification
      }));

      await waitFor(() => {
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
        expect(screen.getByText('New Milestone!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    test('handles API failures gracefully', async () => {
      mockApiManager.request.mockRejectedValue(new Error('API unavailable'));

      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-error-state')).toBeInTheDocument();
        expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    test('shows fallback content when AI services are down', async () => {
      mockOrchestrator.generateDailyInsights.mockRejectedValue(new Error('AI service down'));

      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitFor(() => {
        expect(screen.getByTestId('fallback-insights')).toBeInTheDocument();
        expect(screen.getByText(/continue your journey/i)).toBeInTheDocument();
      });
    });

    test('recovers from network interruptions', async () => {
      let failCount = 0;
      mockApiManager.request.mockImplementation(() => {
        failCount++;
        if (failCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(mockAIResponses.dailyInsights);
      });

      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      // Should eventually load after retries
      await waitFor(() => {
        expect(screen.getByTestId('adaptive-dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(failCount).toBe(3); // Retried twice before success
    });

    test('maintains state during component updates', async () => {
      const { rerender } = renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      // Open customization panel
      const customizeButton = screen.getByRole('button', { name: /customize dashboard/i });
      await user.click(customizeButton);

      expect(screen.getByTestId('dashboard-customization-panel')).toBeInTheDocument();

      // Rerender component
      rerender(
        renderWithProviders(<AdaptiveDashboard />, {
          initialUser: mockUserProfiles.free,
          mockApiManager,
          mockOrchestrator
        }).container
      );

      // Panel should still be open
      expect(screen.getByTestId('dashboard-customization-panel')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    test('loads within performance target', async () => {
      const startTime = performance.now();

      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.premium,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      // Tab through widgets
      const firstWidget = screen.getByTestId('progress-summary-widget');
      firstWidget.focus();
      
      fireEvent.keyDown(firstWidget, { key: 'Tab' });
      
      expect(screen.getByTestId('daily-insights-widget')).toHaveFocus();

      // Enter should activate widget
      fireEvent.keyDown(screen.getByTestId('daily-insights-widget'), { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('insight-details-modal')).toBeInTheDocument();
      });
    });

    test('provides proper ARIA labels and roles', async () => {
      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/dashboard overview/i)).toBeInTheDocument();
      
      const widgets = screen.getAllByRole('region');
      expect(widgets.length).toBeGreaterThan(0);
      
      widgets.forEach(widget => {
        expect(widget).toHaveAttribute('aria-label');
      });
    });

    test('supports high contrast mode', async () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }))
      });

      renderWithProviders(<AdaptiveDashboard />, {
        initialUser: mockUserProfiles.free,
        mockApiManager,
        mockOrchestrator
      });

      await waitForAIResponse();

      const dashboard = screen.getByTestId('adaptive-dashboard');
      expect(dashboard).toHaveClass('high-contrast');
    });
  });
});
