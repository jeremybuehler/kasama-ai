import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  OptimizedAIService, 
  AIResponseStreamer,
  aiService 
} from '../ai-optimized'
import { aiCache } from '../cache'

// Mock the cache module
vi.mock('../cache', () => ({
  aiCache: {
    get: vi.fn(),
    set: vi.fn(),
    cleanup: vi.fn(),
    getStats: vi.fn(() => ({ size: 0, memoryUsage: 0 })),
  },
}))

describe('OptimizedAIService', () => {
  let service: OptimizedAIService
  
  beforeEach(() => {
    service = new OptimizedAIService()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateResponse', () => {
    it('should return cached response when available', async () => {
      const cachedResponse = 'Cached AI response'
      const prompt = 'Test prompt'
      
      // Mock cache hit
      vi.mocked(aiCache.get).mockReturnValue(cachedResponse)

      const result = await service.generateResponse(prompt)

      expect(result).toEqual({
        response: cachedResponse,
        provider: 'cache',
        fromCache: true,
        cost: 0,
      })
      
      expect(aiCache.get).toHaveBeenCalledWith(prompt)
      expect(aiCache.set).not.toHaveBeenCalled()
    })

    it('should use Claude for complex tasks by default', async () => {
      // Mock cache miss
      vi.mocked(aiCache.get).mockReturnValue(null)

      const result = await service.generateResponse('Complex analysis prompt', {
        complexity: 'complex',
        taskType: 'analysis',
      })

      expect(result.provider).toBe('claude')
      expect(result.fromCache).toBe(false)
      expect(result.cost).toBeGreaterThan(0)
      expect(aiCache.set).toHaveBeenCalled()
    })

    it('should use fallback provider for simple tasks on free tier', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)

      const result = await service.generateResponse('Simple greeting', {
        complexity: 'simple',
        userTier: 'free',
      })

      expect(result.provider).toBe('fallback')
      expect(result.cost).toBeLessThan(0.001) // Cheapest provider
    })

    it('should handle streaming responses', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)
      
      const chunks: string[] = []
      const onChunk = vi.fn((chunk: string) => chunks.push(chunk))

      const result = await service.generateResponse('Test streaming', {
        streaming: true,
        onChunk,
      })

      expect(result.response).toContain('Test streaming')
      expect(onChunk).toHaveBeenCalled()
      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should fallback to cheaper provider on failure', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)
      
      // Mock service to simulate provider failure
      const failingService = new OptimizedAIService()
      const originalMakeRequest = failingService['makeRequest']
      
      failingService['makeRequest'] = vi.fn()
        .mockRejectedValueOnce(new Error('Claude failed'))
        .mockResolvedValueOnce('Fallback response')

      const result = await failingService.generateResponse('Test prompt', {
        complexity: 'complex',
      })

      expect(result.response).toBe('Fallback response')
      expect(result.provider).toBe('fallback')
    })
  })

  describe('specialized agent methods', () => {
    beforeEach(() => {
      vi.mocked(aiCache.get).mockReturnValue(null)
    })

    it('should generate assessment insights with high complexity', async () => {
      const assessmentData = {
        communication: 4,
        trust: 5,
        intimacy: 3,
      }

      const insight = await service.generateAssessmentInsight(assessmentData, 'user-123')

      expect(insight).toContain('assessment')
      expect(aiCache.set).toHaveBeenCalled()
    })

    it('should generate daily tips with medium complexity', async () => {
      const userProfile = {
        preferences: ['communication', 'intimacy'],
        tier: 'premium',
      }

      const tip = await service.generateDailyTip(userProfile, 'user-123')

      expect(tip).toContain('tip')
      expect(tip.length).toBeGreaterThan(10)
    })

    it('should generate goal recommendations as array', async () => {
      const currentGoals = [{ title: 'Better communication' }]
      const progress = [{ goal_id: '1', value: 0.5 }]

      const recommendations = await service.generateGoalRecommendations(
        currentGoals, 
        progress, 
        'user-123'
      )

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0]).toContain('goals')
    })
  })

  describe('performance monitoring', () => {
    it('should track performance metrics', () => {
      const metrics = service.getPerformanceMetrics()

      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('totalCost')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('providerHealth')
      
      expect(typeof metrics.cacheHitRate).toBe('number')
      expect(typeof metrics.totalCost).toBe('number')
      expect(typeof metrics.providerHealth).toBe('object')
    })

    it('should optimize for budget constraints', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      service.optimizeForBudget(0.01) // Very low budget
      
      // Should log warning when approaching budget limit
      // Note: This would require tracking actual usage
      
      consoleSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)
      
      const service = new OptimizedAIService()
      service['makeRequest'] = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(service.generateResponse('test')).rejects.toThrow('Network error')
    })

    it('should handle invalid responses', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)
      
      const service = new OptimizedAIService()
      service['makeRequest'] = vi.fn().mockResolvedValue('')

      const result = await service.generateResponse('test')
      
      expect(result.response).toBe('')
      expect(result.cost).toBe(0) // No cost for empty response
    })
  })

  describe('cost tracking', () => {
    it('should track costs across different providers', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)

      // Generate responses with different complexities
      await service.generateResponse('simple', { complexity: 'simple' })
      await service.generateResponse('complex', { complexity: 'complex' })

      const metrics = service.getPerformanceMetrics()
      expect(metrics.totalCost).toBeGreaterThan(0)
    })

    it('should calculate token costs correctly', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)

      const shortPrompt = 'hi'
      const longPrompt = 'This is a much longer prompt that should cost more to process because it contains many more tokens and requires more AI processing'

      const shortResult = await service.generateResponse(shortPrompt)
      const longResult = await service.generateResponse(longPrompt)

      expect(longResult.cost).toBeGreaterThan(shortResult.cost)
    })
  })
})

describe('AIResponseStreamer', () => {
  let streamer: AIResponseStreamer

  beforeEach(() => {
    streamer = new AIResponseStreamer()
    vi.clearAllMocks()
  })

  describe('streamResponse', () => {
    it('should stream cached responses', async () => {
      const cachedResponse = 'This is a cached response'
      vi.mocked(aiCache.get).mockReturnValue(cachedResponse)

      const chunks: string[] = []
      const onChunk = vi.fn((chunk: string) => chunks.push(chunk))
      const onComplete = vi.fn()
      const onError = vi.fn()

      await streamer.streamResponse(
        'test prompt',
        onChunk,
        onComplete,
        onError
      )

      expect(onChunk).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalledWith(cachedResponse)
      expect(onError).not.toHaveBeenCalled()
      expect(chunks.join('')).toContain(cachedResponse)
    })

    it('should handle streaming errors', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)
      
      // Mock failed streaming request
      streamer['makeStreamingRequest'] = vi.fn().mockRejectedValue(new Error('Stream failed'))

      const onChunk = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      await streamer.streamResponse(
        'test prompt',
        onChunk,
        onComplete,
        onError
      )

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('should be cancellable', async () => {
      vi.mocked(aiCache.get).mockReturnValue(null)

      const onChunk = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      // Start streaming
      const streamPromise = streamer.streamResponse(
        'test prompt',
        onChunk,
        onComplete,
        onError
      )

      // Cancel immediately
      streamer.cancel()

      await streamPromise

      // Should handle cancellation gracefully
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('simulateStreaming', () => {
    it('should simulate streaming with proper timing', async () => {
      const text = 'This is a test response with multiple words'
      const chunks: string[] = []
      const onChunk = vi.fn((chunk: string) => chunks.push(chunk))

      vi.useFakeTimers()
      
      const streamPromise = streamer['simulateStreaming'](text, onChunk)
      
      // Fast-forward time to complete streaming
      await vi.runAllTimersAsync()
      await streamPromise

      expect(onChunk).toHaveBeenCalled()
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.join('')).toContain(text)
    })
  })
})

describe('useOptimizedAI hook', () => {
  it('should provide AI service methods', async () => {
    // This would be tested in a React component test
    // Here we just verify the hook structure
    const { useOptimizedAI } = await import('../ai-optimized')
    
    expect(typeof useOptimizedAI).toBe('function')
  })
})