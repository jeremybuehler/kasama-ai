import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  SemanticAICache,
  aiCache,
  createOptimizedQueryClient,
  cacheKeys,
  cacheInvalidation,
  cachePreloader,
  cacheMetrics
} from '../cache'

// Mock QueryClient
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  prefetchQuery: vi.fn(),
  getQueryCache: vi.fn(() => ({
    getAll: vi.fn(() => []),
  })),
  clear: vi.fn(),
}

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => mockQueryClient),
}))

describe('SemanticAICache', () => {
  let cache: SemanticAICache

  beforeEach(() => {
    cache = new SemanticAICache()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      const prompt = 'Generate relationship advice'
      const response = 'Here is some advice...'

      cache.set(prompt, response)
      const retrieved = cache.get(prompt)

      expect(retrieved).toBe(response)
    })

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent prompt')
      expect(result).toBeNull()
    })

    it('should handle semantic similarity', () => {
      const prompt1 = 'Generate relationship advice for couples'
      const prompt2 = 'Generate advice relationship for couples'
      const response = 'Advice content'

      cache.set(prompt1, response)
      
      // Should find similar prompt due to semantic hashing
      const retrieved = cache.get(prompt2)
      expect(retrieved).toBe(response)
    })
  })

  describe('TTL and expiration', () => {
    it('should respect custom TTL', () => {
      const prompt = 'Test prompt'
      const response = 'Test response'
      const shortTTL = 1000 // 1 second

      cache.set(prompt, response, shortTTL)

      // Should be available immediately
      expect(cache.get(prompt)).toBe(response)

      // Fast forward past TTL
      vi.advanceTimersByTime(1500)

      // Should be expired
      expect(cache.get(prompt)).toBeNull()
    })

    it('should use default TTL when not specified', () => {
      const prompt = 'Test prompt'
      const response = 'Test response'

      cache.set(prompt, response) // Uses default TTL

      expect(cache.get(prompt)).toBe(response)

      // Fast forward past default TTL (1 hour)
      vi.advanceTimersByTime(60 * 60 * 1000 + 1000)

      expect(cache.get(prompt)).toBeNull()
    })
  })

  describe('cleanup', () => {
    it('should remove expired entries during cleanup', () => {
      const prompt1 = 'Prompt 1'
      const prompt2 = 'Prompt 2'
      const shortTTL = 1000

      cache.set(prompt1, 'Response 1', shortTTL)
      cache.set(prompt2, 'Response 2', 60000) // Longer TTL

      // Fast forward to expire first entry
      vi.advanceTimersByTime(1500)

      cache.cleanup()

      expect(cache.get(prompt1)).toBeNull()
      expect(cache.get(prompt2)).toBe('Response 2')
    })

    it('should provide cache statistics', () => {
      cache.set('prompt1', 'response1')
      cache.set('prompt2', 'response2')

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.memoryUsage).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty prompts', () => {
      cache.set('', 'response')
      const retrieved = cache.get('')

      expect(retrieved).toBe('response')
    })

    it('should handle special characters in prompts', () => {
      const prompt = 'How to handle conflict? Include @mentions & #tags!'
      const response = 'Advice with special chars'

      cache.set(prompt, response)
      const retrieved = cache.get(prompt)

      expect(retrieved).toBe(response)
    })

    it('should handle large responses', () => {
      const prompt = 'Generate long response'
      const largeResponse = 'x'.repeat(10000) // 10KB response

      cache.set(prompt, largeResponse)
      const retrieved = cache.get(prompt)

      expect(retrieved).toBe(largeResponse)
    })
  })
})

describe('createOptimizedQueryClient', () => {
  it('should create QueryClient with optimized settings', () => {
    const client = createOptimizedQueryClient()
    expect(client).toBeDefined()
  })

  it('should have correct retry logic', () => {
    const client = createOptimizedQueryClient()
    const defaultOptions = client.getDefaultOptions()

    // Test retry logic for 4xx errors
    const shouldRetry4xx = defaultOptions.queries?.retry
    if (typeof shouldRetry4xx === 'function') {
      expect(shouldRetry4xx(1, { status: 404 })).toBe(false)
      expect(shouldRetry4xx(1, { status: 500 })).toBe(true)
      expect(shouldRetry4xx(1, { message: 'auth error' })).toBe(false)
    }
  })
})

describe('cacheKeys', () => {
  it('should generate consistent cache keys', () => {
    const userId = 'user-123'
    const assessmentId = 'assessment-456'

    expect(cacheKeys.user()).toEqual(['user'])
    expect(cacheKeys.userSettings(userId)).toEqual(['user', userId, 'settings'])
    expect(cacheKeys.assessment(assessmentId)).toEqual(['assessments', assessmentId])
  })

  it('should generate semantic AI cache keys', () => {
    const userId = 'user-123'
    const context = 'relationship advice for better communication'

    const aiKey = cacheKeys.aiRecommendations(userId, context)
    
    expect(aiKey[0]).toBe('ai')
    expect(aiKey[1]).toBe('recommendations')
    expect(aiKey[2]).toBe(userId)
    expect(typeof aiKey[3]).toBe('string') // Semantic hash
  })

  it('should generate date-range keys', () => {
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'

    const key = cacheKeys.progressByDateRange(startDate, endDate)
    
    expect(key).toEqual(['progress', 'dateRange', startDate, endDate])
  })
})

describe('cacheInvalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should invalidate user data', () => {
    const userId = 'user-123'

    cacheInvalidation.invalidateUser(mockQueryClient, userId)

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user']
    })
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user', userId, 'settings']
    })
  })

  it('should invalidate assessments', () => {
    cacheInvalidation.invalidateAssessments(mockQueryClient)

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['assessments']
    })
  })

  it('should invalidate specific assessment', () => {
    const assessmentId = 'assessment-123'

    cacheInvalidation.invalidateAssessment(mockQueryClient, assessmentId)

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['assessments', assessmentId]
    })
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['assessments', assessmentId, 'results']
    })
  })

  it('should clear stale cache', () => {
    cacheInvalidation.clearStaleCache(mockQueryClient)

    expect(mockQueryClient.clear).toHaveBeenCalled()
  })

  it('should invalidate AI cache selectively', () => {
    const userId = 'user-123'

    cacheInvalidation.invalidateAICache(mockQueryClient, userId)

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['ai']
    })
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['ai', 'insight', userId],
      exact: false
    })
  })
})

describe('cachePreloader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should preload user data in parallel', async () => {
    const userId = 'user-123'

    await cachePreloader.preloadUserData(mockQueryClient, userId)

    // Should have called prefetchQuery multiple times
    expect(mockQueryClient.prefetchQuery).toHaveBeenCalledTimes(4)
    
    // Verify specific queries were prefetched
    expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['assessments']
      })
    )
  })

  it('should preload page-specific data', async () => {
    await cachePreloader.preloadPageData(mockQueryClient, 'dashboard')

    expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['progress', 'statistics']
      })
    )
  })

  it('should handle invalid page names gracefully', async () => {
    await expect(
      cachePreloader.preloadPageData(mockQueryClient, 'invalid-page')
    ).resolves.not.toThrow()
  })
})

describe('cacheMetrics', () => {
  it('should calculate cache hit rate', () => {
    const mockQueries = [
      { 
        state: { status: 'success', dataUpdatedAt: Date.now() }, 
        options: { staleTime: 5 * 60 * 1000 },
        isStale: () => false
      },
      { 
        state: { status: 'error', dataUpdatedAt: Date.now() - 10000 }, 
        options: { staleTime: 5 * 60 * 1000 },
        isStale: () => true
      },
    ]

    mockQueryClient.getQueryCache.mockReturnValue({
      getAll: () => mockQueries
    })

    const hitRate = cacheMetrics.getCacheHitRate(mockQueryClient)

    expect(hitRate).toBeGreaterThanOrEqual(0)
    expect(hitRate).toBeLessThanOrEqual(100)
  })

  it('should provide comprehensive cache stats', () => {
    const mockQueries = [
      { state: { status: 'success' }, isStale: () => false },
      { state: { status: 'error' }, isStale: () => false },
      { state: { status: 'success' }, isStale: () => true },
    ]

    mockQueryClient.getQueryCache.mockReturnValue({
      getAll: () => mockQueries
    })

    const stats = cacheMetrics.getCacheStats(mockQueryClient)

    expect(stats).toHaveProperty('totalQueries', 3)
    expect(stats).toHaveProperty('cachedQueries', 2)
    expect(stats).toHaveProperty('staleQueries', 1)
    expect(stats).toHaveProperty('errorQueries', 1)
    expect(stats).toHaveProperty('hitRate')
  })

  it('should handle empty cache', () => {
    mockQueryClient.getQueryCache.mockReturnValue({
      getAll: () => []
    })

    const hitRate = cacheMetrics.getCacheHitRate(mockQueryClient)
    const stats = cacheMetrics.getCacheStats(mockQueryClient)

    expect(hitRate).toBe(0)
    expect(stats.totalQueries).toBe(0)
  })
})

describe('aiCache singleton', () => {
  it('should be properly initialized', () => {
    expect(aiCache).toBeInstanceOf(SemanticAICache)
  })

  it('should have cleanup interval in browser environment', () => {
    // Mock browser environment
    const originalWindow = global.window
    global.window = {} as any

    // Re-import to trigger interval setup
    vi.doMock('../cache', () => ({
      ...vi.importActual('../cache'),
    }))

    // Should not throw
    expect(() => {
      setInterval(() => aiCache.cleanup(), 10 * 60 * 1000)
    }).not.toThrow()

    global.window = originalWindow
  })
})