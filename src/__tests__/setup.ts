/**
 * Jest Setup Configuration
 * Global test environment setup for Kasama AI testing suite
 */

import '@testing-library/jest-dom';
import 'jest-extended';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  computedStyleSupportsPseudoElements: true
});

// Polyfills for JSDOM environment
Object.assign(global, { TextDecoder, TextEncoder });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock performance.now for timing tests
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntries: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  clearResourceTimings: jest.fn(),
  setResourceTimingBufferSize: jest.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods in tests
const originalConsole = { ...console };
beforeEach(() => {
  // Suppress console.error in tests unless specifically testing error handling
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Mock Supabase client globally
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      resetPasswordForEmail: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  }))
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/dashboard',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}));

// AI Service Mocks - Global fallbacks
jest.mock('../../services/ai/orchestrator', () => ({
  AIOrchestrator: jest.fn().mockImplementation(() => ({
    analyzeAssessment: jest.fn(),
    generateLearningPath: jest.fn(),
    generateDailyInsights: jest.fn(),
    trackProgress: jest.fn(),
    provideCommunicationGuidance: jest.fn(),
    getHealthStatus: jest.fn(),
    getSystemMetrics: jest.fn(),
  })),
}));

jest.mock('../../lib/api-route-manager', () => ({
  apiRouteManager: {
    request: jest.fn(),
    batchRequest: jest.fn(),
    registerRoute: jest.fn(),
    getRouteAnalytics: jest.fn(),
    clearCache: jest.fn(),
    resetRateLimits: jest.fn(),
    getRegisteredRoutes: jest.fn(() => ({})),
    getGlobalAnalytics: jest.fn(),
  },
}));

jest.mock('../../lib/ai-component-factory', () => ({
  aiComponentFactory: {
    register: jest.fn(),
    createComponent: jest.fn(),
    getRegisteredComponents: jest.fn(() => ({})),
  },
}));

// Test timeout configuration
jest.setTimeout(15000);

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup after all tests
afterAll(() => {
  // Restore original console
  Object.assign(console, originalConsole);
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});
