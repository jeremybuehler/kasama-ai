import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock React Query Client
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    prefetchQuery: vi.fn(),
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
    })),
    clear: vi.fn(),
  })),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    prefetchQuery: vi.fn(),
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
    })),
  })),
}))

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))

// Mock AI Cache
vi.mock('@/lib/cache', () => ({
  aiCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    cleanup: vi.fn(),
    getStats: vi.fn(() => ({ size: 0, memoryUsage: 0 })),
  },
  createOptimizedQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    prefetchQuery: vi.fn(),
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
    })),
  })),
  cacheKeys: {
    user: vi.fn(() => ['user']),
    assessments: vi.fn(() => ['assessments']),
    practices: vi.fn(() => ['practices']),
    goals: vi.fn(() => ['goals']),
    progress: vi.fn(() => ['progress']),
    aiResponse: vi.fn((hash) => ['ai', 'response', hash]),
  },
}))

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    navigation: { type: 0 },
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now(),
    },
  },
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  }) as Promise<Response>
)

// Console override for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})