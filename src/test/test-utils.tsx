import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Test-specific QueryClient with optimized settings
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  })

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Mock data factories
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  subscription_tier: 'free' as const,
}

export const mockAssessment = {
  id: 'assessment-1',
  user_id: 'test-user-id',
  type: 'relationship-health',
  responses: {
    communication: 4,
    trust: 5,
    intimacy: 3,
    conflict_resolution: 4,
    shared_values: 5,
  },
  score: 84,
  insights: ['Strong communication foundation', 'Excellent trust levels'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockGoal = {
  id: 'goal-1',
  user_id: 'test-user-id',
  title: 'Improve Daily Communication',
  description: 'Have meaningful conversations every day',
  category: 'communication',
  target_value: 30,
  current_value: 15,
  unit: 'days',
  target_date: '2024-06-01',
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockProgress = {
  id: 'progress-1',
  user_id: 'test-user-id',
  goal_id: 'goal-1',
  value: 1,
  note: 'Had a great conversation about future plans',
  recorded_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockPractice = {
  id: 'practice-1',
  title: 'Active Listening Exercise',
  description: 'Practice reflective listening techniques',
  category: 'communication',
  difficulty: 'beginner' as const,
  duration_minutes: 15,
  instructions: ['Find a quiet space', 'Listen without interrupting', 'Reflect back what you heard'],
  benefits: ['Improved understanding', 'Better connection'],
  created_at: '2024-01-01T00:00:00Z',
}

// AI response mocks
export const mockAIResponses = {
  assessment_insight: 'Your relationship shows strong foundations in trust and communication. Focus on deepening emotional intimacy through regular check-ins.',
  daily_tip: 'Try expressing gratitude for one specific thing your partner did today.',
  goal_recommendations: [
    'Set up weekly relationship check-ins',
    'Practice active listening daily',
    'Schedule regular date nights',
  ],
}

// Performance metrics mock
export const mockPerformanceMetrics = {
  lcp: 1200, // Largest Contentful Paint
  fid: 45,   // First Input Delay
  cls: 0.08, // Cumulative Layout Shift
  fcp: 800,  // First Contentful Paint
  ttfb: 200, // Time to First Byte
}

// Error mock factory
export const createMockError = (message: string, status?: number) => {
  const error = new Error(message) as any
  if (status) error.status = status
  return error
}

// Async utility for testing
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock console methods
export const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}

// Test ID utility
export const getTestId = (component: string, element?: string) => 
  element ? `${component}-${element}` : component

// Accessibility testing utilities
export const axeRules = {
  common: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-visible': { enabled: true },
    'aria-labels': { enabled: true },
    'semantic-markup': { enabled: true },
  },
  strict: {
    ...axeRules.common,
    'wcag2a': { enabled: true },
    'wcag2aa': { enabled: true },
    'section508': { enabled: true },
  },
}

// Performance testing utilities
export const performanceThresholds = {
  pageLoad: 3000,      // 3 seconds
  componentMount: 100,  // 100ms
  aiResponse: 5000,     // 5 seconds
  cacheRetrieval: 50,   // 50ms
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }