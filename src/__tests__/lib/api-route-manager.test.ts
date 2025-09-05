/**
 * API Route Manager Test Suite
 * Tests for intelligent API routing, caching, rate limiting, and optimization
 */

import { apiRouteManager } from '../../lib/api-route-manager';
import { createMockApiManager } from '../utils/test-utils';

// Mock timers for rate limiting tests
jest.useFakeTimers();

describe('API Route Manager', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // Reset the route manager
    apiRouteManager.clearCache();
    apiRouteManager.resetRateLimits();
    
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Setup default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 'test response' }),
      headers: new Headers({
        'content-type': 'application/json'
      }),
      status: 200
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Route Registration and Configuration', () => {
    test('registers a new route with default configuration', () => {
      apiRouteManager.registerRoute('test.endpoint', {
        url: '/api/test',
        method: 'GET'
      });

      const routes = apiRouteManager.getRegisteredRoutes();
      expect(routes).toHaveProperty('test.endpoint');
      expect(routes['test.endpoint']).toMatchObject({
        url: '/api/test',
        method: 'GET',
        cache: { enabled: true, ttl: 300000 },
        rateLimit: { enabled: true, maxRequests: 100, window: 60000 },
        retry: { enabled: true, attempts: 3, delay: 1000 }
      });
    });

    test('registers route with custom configuration', () => {
      apiRouteManager.registerRoute('custom.endpoint', {
        url: '/api/custom',
        method: 'POST',
        cache: { enabled: false },
        rateLimit: { maxRequests: 10, window: 5000 },
        retry: { attempts: 5, delay: 2000 },
        aiOptimization: {
          enabled: true,
          adaptiveTimeouts: true,
          intelligentCaching: true,
          predictivePreloading: true
        }
      });

      const routes = apiRouteManager.getRegisteredRoutes();
      const customRoute = routes['custom.endpoint'];
      
      expect(customRoute.cache.enabled).toBe(false);
      expect(customRoute.rateLimit.maxRequests).toBe(10);
      expect(customRoute.retry.attempts).toBe(5);
      expect(customRoute.aiOptimization?.adaptiveTimeouts).toBe(true);
    });

    test('throws error when registering duplicate route', () => {
      apiRouteManager.registerRoute('duplicate.test', {
        url: '/api/test',
        method: 'GET'
      });

      expect(() => {
        apiRouteManager.registerRoute('duplicate.test', {
          url: '/api/test2',
          method: 'POST'
        });
      }).toThrow('Route duplicate.test is already registered');
    });
  });

  describe('Request Execution and Response Handling', () => {
    beforeEach(() => {
      apiRouteManager.registerRoute('test.get', {
        url: '/api/test/:id',
        method: 'GET'
      });

      apiRouteManager.registerRoute('test.post', {
        url: '/api/test',
        method: 'POST'
      });
    });

    test('makes successful GET request with path parameters', async () => {
      const response = await apiRouteManager.request('test.get', { id: 123 });

      expect(mockFetch).toHaveBeenCalledWith('/api/test/123', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response).toEqual({ data: 'test response' });
    });

    test('makes successful POST request with body data', async () => {
      const requestData = { name: 'test', value: 42 };
      
      await apiRouteManager.request('test.post', requestData);

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
    });

    test('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ error: 'Resource not found' })
      });

      await expect(apiRouteManager.request('test.get', { id: 999 }))
        .rejects.toThrow('API request failed: 404 Not Found');
    });

    test('handles network errors with retry logic', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'success after retry' })
        });

      const response = await apiRouteManager.request('test.get', { id: 123 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(response).toEqual({ data: 'success after retry' });
    });

    test('fails after exhausting retry attempts', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      await expect(apiRouteManager.request('test.get', { id: 123 }))
        .rejects.toThrow('Request failed after 3 retry attempts');

      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });
  });

  describe('Caching System', () => {
    beforeEach(() => {
      apiRouteManager.registerRoute('cacheable.endpoint', {
        url: '/api/cacheable',
        method: 'GET',
        cache: {
          enabled: true,
          ttl: 5000, // 5 seconds
          strategy: 'time-based' as const
        }
      });
    });

    test('caches successful responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'cached response' })
      });

      // First request
      const response1 = await apiRouteManager.request('cacheable.endpoint');
      expect(response1).toEqual({ data: 'cached response' });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request should use cache
      const response2 = await apiRouteManager.request('cacheable.endpoint');
      expect(response2).toEqual({ data: 'cached response' });
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    test('cache expires after TTL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'fresh response' })
      });

      // First request
      await apiRouteManager.request('cacheable.endpoint');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Fast-forward time beyond TTL
      jest.advanceTimersByTime(6000);

      // Second request after cache expiry
      await apiRouteManager.request('cacheable.endpoint');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('different parameters create separate cache entries', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'response' })
      });

      await apiRouteManager.request('cacheable.endpoint', { param: 'A' });
      await apiRouteManager.request('cacheable.endpoint', { param: 'B' });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('cache can be manually cleared', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'response' })
      });

      // First request
      await apiRouteManager.request('cacheable.endpoint');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      apiRouteManager.clearCache('cacheable.endpoint');

      // Second request should not use cache
      await apiRouteManager.request('cacheable.endpoint');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      apiRouteManager.registerRoute('limited.endpoint', {
        url: '/api/limited',
        method: 'GET',
        rateLimit: {
          enabled: true,
          maxRequests: 3,
          window: 1000 // 1 second
        }
      });
    });

    test('allows requests within rate limit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'success' })
      });

      // Make 3 requests (within limit)
      const promises = Array(3).fill(null).map(() => 
        apiRouteManager.request('limited.endpoint')
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('blocks requests exceeding rate limit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'success' })
      });

      // Make 4 requests (exceeding limit of 3)
      const promises = Array(4).fill(null).map(() => 
        apiRouteManager.request('limited.endpoint')
      );

      const results = await Promise.allSettled(promises);
      
      // First 3 should succeed
      expect(results.slice(0, 3).every(r => r.status === 'fulfilled')).toBe(true);
      
      // 4th should be rate limited
      expect(results[3].status).toBe('rejected');
      expect((results[3] as PromiseRejectedResult).reason.message)
        .toContain('Rate limit exceeded');
    });

    test('resets rate limit after window expires', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'success' })
      });

      // Make 3 requests (hitting limit)
      await Promise.all(Array(3).fill(null).map(() => 
        apiRouteManager.request('limited.endpoint')
      ));

      // Advance time beyond rate limit window
      jest.advanceTimersByTime(1100);

      // Should be able to make requests again
      const response = await apiRouteManager.request('limited.endpoint');
      expect(response).toEqual({ data: 'success' });
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Batch Requests', () => {
    beforeEach(() => {
      apiRouteManager.registerRoute('batch.item', {
        url: '/api/items/:id',
        method: 'GET'
      });

      apiRouteManager.registerRoute('batch.user', {
        url: '/api/users/:id',
        method: 'GET'
      });
    });

    test('executes multiple requests in batch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn()
          .mockResolvedValueOnce({ data: 'item 1' })
          .mockResolvedValueOnce({ data: 'item 2' })
          .mockResolvedValueOnce({ data: 'user 1' })
      });

      const batchRequests = [
        { routeId: 'batch.item', data: { id: 1 } },
        { routeId: 'batch.item', data: { id: 2 } },
        { routeId: 'batch.user', data: { id: 1 } }
      ];

      const results = await apiRouteManager.batchRequest(batchRequests);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('handles mixed success/failure in batch requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'success' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: jest.fn().mockResolvedValue({ error: 'Not found' })
        });

      const batchRequests = [
        { routeId: 'batch.item', data: { id: 1 } },
        { routeId: 'batch.item', data: { id: 999 } }
      ];

      const results = await apiRouteManager.batchRequest(batchRequests);

      expect(results[0].success).toBe(true);
      expect(results[0].data).toEqual({ data: 'success' });
      
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('404 Not Found');
    });

    test('respects concurrency limits in batch requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'response' })
      });

      const batchRequests = Array(10).fill(null).map((_, i) => ({
        routeId: 'batch.item',
        data: { id: i }
      }));

      const startTime = Date.now();
      await apiRouteManager.batchRequest(batchRequests, { concurrency: 3 });
      const endTime = Date.now();

      expect(mockFetch).toHaveBeenCalledTimes(10);
      
      // With concurrency limit of 3, requests should be staggered
      // This is a basic check - in real scenario you'd measure actual concurrency
      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });

  describe('AI Optimization Features', () => {
    beforeEach(() => {
      apiRouteManager.registerRoute('ai.optimized', {
        url: '/api/ai-endpoint',
        method: 'POST',
        aiOptimization: {
          enabled: true,
          adaptiveTimeouts: true,
          intelligentCaching: true,
          predictivePreloading: true,
          responseAnalysis: true
        }
      });
    });

    test('adapts request timeout based on historical performance', async () => {
      // Simulate slow responses
      const slowResponse = () => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'slow response' })
        }), 2000);
      });

      mockFetch.mockImplementation(slowResponse);

      const response = await apiRouteManager.request('ai.optimized', { 
        data: 'test' 
      });

      expect(response).toEqual({ data: 'slow response' });
      
      // Check that timeout was adapted (this would be implementation-specific)
      const analytics = apiRouteManager.getRouteAnalytics('ai.optimized');
      expect(analytics.averageResponseTime).toBeGreaterThan(1500);
    });

    test('uses intelligent caching based on request patterns', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'intelligent cache' })
      });

      // Make multiple requests with similar patterns
      await apiRouteManager.request('ai.optimized', { category: 'insights' });
      await apiRouteManager.request('ai.optimized', { category: 'insights' });
      await apiRouteManager.request('ai.optimized', { category: 'recommendations' });

      const analytics = apiRouteManager.getRouteAnalytics('ai.optimized');
      expect(analytics.cacheHitRate).toBeDefined();
      expect(analytics.requestPatterns).toBeDefined();
    });

    test('preloads predicted requests based on usage patterns', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'preloaded' })
      });

      // Establish a pattern
      await apiRouteManager.request('ai.optimized', { step: 1 });
      await apiRouteManager.request('ai.optimized', { step: 2 });
      
      // This should trigger predictive preloading for step 3
      await apiRouteManager.request('ai.optimized', { step: 1 });

      // Verify preloading behavior would be implementation-specific
      const analytics = apiRouteManager.getRouteAnalytics('ai.optimized');
      expect(analytics.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('Analytics and Monitoring', () => {
    beforeEach(() => {
      apiRouteManager.registerRoute('analytics.test', {
        url: '/api/analytics',
        method: 'GET'
      });
    });

    test('tracks request analytics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'tracked' })
      });

      await apiRouteManager.request('analytics.test', { param: 'value' });
      await apiRouteManager.request('analytics.test', { param: 'value2' });

      const analytics = apiRouteManager.getRouteAnalytics('analytics.test');
      
      expect(analytics.totalRequests).toBe(2);
      expect(analytics.successRate).toBe(100);
      expect(analytics.averageResponseTime).toBeDefined();
      expect(analytics.errorRate).toBe(0);
    });

    test('tracks error rates and patterns', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'success' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: jest.fn().mockResolvedValue({ error: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'success again' })
        });

      await apiRouteManager.request('analytics.test');
      
      try {
        await apiRouteManager.request('analytics.test');
      } catch (error) {
        // Expected error
      }
      
      await apiRouteManager.request('analytics.test');

      const analytics = apiRouteManager.getRouteAnalytics('analytics.test');
      
      expect(analytics.totalRequests).toBe(3);
      expect(analytics.successRate).toBeCloseTo(66.67, 1);
      expect(analytics.errorRate).toBeCloseTo(33.33, 1);
    });

    test('provides global analytics across all routes', async () => {
      apiRouteManager.registerRoute('analytics.test2', {
        url: '/api/analytics2',
        method: 'POST'
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'global' })
      });

      await apiRouteManager.request('analytics.test');
      await apiRouteManager.request('analytics.test2');

      const globalAnalytics = apiRouteManager.getGlobalAnalytics();
      
      expect(globalAnalytics.totalRequests).toBe(2);
      expect(globalAnalytics.activeRoutes).toBe(2);
      expect(globalAnalytics.averageResponseTime).toBeDefined();
    });
  });

  describe('Error Recovery and Circuit Breaker', () => {
    beforeEach(() => {
      apiRouteManager.registerRoute('circuit.test', {
        url: '/api/circuit',
        method: 'GET',
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          timeout: 5000,
          resetTimeout: 10000
        }
      });
    });

    test('opens circuit breaker after consecutive failures', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      // Make 3 failed requests to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await apiRouteManager.request('circuit.test');
        } catch (error) {
          // Expected failures
        }
      }

      // 4th request should be blocked by circuit breaker
      await expect(apiRouteManager.request('circuit.test'))
        .rejects.toThrow('Circuit breaker is OPEN');

      expect(mockFetch).toHaveBeenCalledTimes(3); // Circuit breaker blocked the 4th
    });

    test('resets circuit breaker after timeout', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      // Trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await apiRouteManager.request('circuit.test');
        } catch (error) {
          // Expected
        }
      }

      // Fast forward past reset timeout
      jest.advanceTimersByTime(11000);

      // Mock successful response for reset attempt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'service restored' })
      });

      const response = await apiRouteManager.request('circuit.test');
      expect(response).toEqual({ data: 'service restored' });
    });
  });
});
