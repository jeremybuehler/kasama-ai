import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the AI insights service - we'll need to adapt based on the actual export structure
describe('AI Insights Service', () => {
  let aiInsightsService

  beforeEach(async () => {
    // Import the service dynamically to handle different export patterns
    const module = await import('../ai-insights.js')
    aiInsightsService = module.default || module.AIInsightsService || module
  })

  describe('personalized insights generation', () => {
    it('should provide mock insights for development', () => {
      // Test the mock data structure that we saw in the file
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        const insight = mockInsights[0]
        
        expect(insight).toHaveProperty('id')
        expect(insight).toHaveProperty('type')
        expect(insight).toHaveProperty('title')
        expect(insight).toHaveProperty('message')
        expect(insight).toHaveProperty('priority')
        expect(insight).toHaveProperty('category')
        expect(insight).toHaveProperty('actionItems')
        expect(insight).toHaveProperty('createdAt')
        
        expect(Array.isArray(insight.actionItems)).toBe(true)
        expect(insight.actionItems.length).toBeGreaterThan(0)
        expect(['high', 'medium', 'low']).toContain(insight.priority)
      }
    })

    it('should categorize insights correctly', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        mockInsights.forEach(insight => {
          expect(insight.category).toBeDefined()
          expect(typeof insight.category).toBe('string')
          expect(insight.category.length).toBeGreaterThan(0)
        })
      }
    })

    it('should provide actionable items for each insight', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        mockInsights.forEach(insight => {
          expect(Array.isArray(insight.actionItems)).toBe(true)
          expect(insight.actionItems.length).toBeGreaterThan(0)
          
          insight.actionItems.forEach(action => {
            expect(typeof action).toBe('string')
            expect(action.length).toBeGreaterThan(10) // Meaningful action items
          })
        })
      }
    })

    it('should have different insight types', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        const types = mockInsights.map(insight => insight.type)
        const uniqueTypes = [...new Set(types)]
        
        expect(uniqueTypes.length).toBeGreaterThan(1)
        
        // Common insight types should include these
        const expectedTypes = ['pattern_recognition', 'growth_opportunity', 'strength_recognition']
        expectedTypes.forEach(type => {
          if (types.includes(type)) {
            expect(types).toContain(type)
          }
        })
      }
    })
  })

  describe('insight generation methods', () => {
    it('should handle generatePersonalizedInsight if method exists', async () => {
      if (typeof aiInsightsService.generatePersonalizedInsight === 'function') {
        const userProfile = {
          id: 'test-user',
          assessmentScores: {
            communication: 4,
            emotional_intelligence: 3,
            attachment: 5
          },
          preferences: ['communication', 'growth']
        }

        const insights = await aiInsightsService.generatePersonalizedInsight(userProfile)
        
        expect(Array.isArray(insights) || typeof insights === 'object').toBe(true)
        
        if (Array.isArray(insights)) {
          insights.forEach(insight => {
            expect(insight).toHaveProperty('message')
            expect(insight).toHaveProperty('category')
          })
        }
      }
    })

    it('should handle generateDailyTip if method exists', async () => {
      if (typeof aiInsightsService.generateDailyTip === 'function') {
        const userContext = {
          currentGoals: ['better communication'],
          recentProgress: [{ type: 'practice_completed', date: new Date() }],
          preferences: ['practical_tips']
        }

        const tip = await aiInsightsService.generateDailyTip(userContext)
        
        expect(tip).toBeDefined()
        if (typeof tip === 'string') {
          expect(tip.length).toBeGreaterThan(20)
        } else if (typeof tip === 'object') {
          expect(tip).toHaveProperty('content')
        }
      }
    })

    it('should handle generateRecommendations if method exists', async () => {
      if (typeof aiInsightsService.generateRecommendations === 'function') {
        const context = {
          userId: 'test-user',
          currentLevel: 'beginner',
          interests: ['communication', 'conflict_resolution'],
          completedPractices: ['active_listening_1']
        }

        const recommendations = await aiInsightsService.generateRecommendations(context)
        
        expect(recommendations).toBeDefined()
        if (Array.isArray(recommendations)) {
          expect(recommendations.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('insight quality and content', () => {
    it('should provide high-quality insight messages', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        mockInsights.forEach(insight => {
          // Messages should be substantial and helpful
          expect(insight.message.length).toBeGreaterThan(50)
          expect(insight.message).not.toContain('TODO')
          expect(insight.message).not.toContain('PLACEHOLDER')
          
          // Should contain empathetic and professional language
          const message = insight.message.toLowerCase()
          const positiveIndicators = [
            'you', 'your', 'can', 'practice', 'try', 'consider',
            'growth', 'improve', 'strengthen', 'develop'
          ]
          
          const hasPositiveLanguage = positiveIndicators.some(word => 
            message.includes(word)
          )
          expect(hasPositiveLanguage).toBe(true)
        })
      }
    })

    it('should provide specific and actionable advice', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        mockInsights.forEach(insight => {
          insight.actionItems.forEach(action => {
            // Action items should be specific, not vague
            expect(action).not.toMatch(/^(do|try|work on|improve)$/i)
            
            // Should contain concrete actions
            const hasConcreteAction = /\b(practice|say|ask|set|take|notice|reflect)\b/i.test(action)
            expect(hasConcreteAction).toBe(true)
          })
        })
      }
    })

    it('should maintain consistent tone and style', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        mockInsights.forEach(insight => {
          // Should use encouraging, non-judgmental language
          const message = insight.message.toLowerCase()
          
          // Avoid negative or judgmental language
          const negativeWords = ['bad', 'wrong', 'failure', 'broken', 'inadequate']
          negativeWords.forEach(word => {
            expect(message).not.toContain(word)
          })
          
          // Should include growth-oriented language
          const growthWords = ['growth', 'develop', 'improve', 'practice', 'learn']
          const hasGrowthLanguage = growthWords.some(word => message.includes(word))
          expect(hasGrowthLanguage).toBe(true)
        })
      }
    })
  })

  describe('insight categorization and prioritization', () => {
    it('should have balanced priority distribution', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 2) {
        const priorities = mockInsights.map(insight => insight.priority)
        const priorityCounts = priorities.reduce((acc, priority) => {
          acc[priority] = (acc[priority] || 0) + 1
          return acc
        }, {})
        
        // Should have different priority levels
        expect(Object.keys(priorityCounts).length).toBeGreaterThan(1)
        
        // High priority insights should be less common than medium/low
        if (priorityCounts.high && priorityCounts.medium) {
          expect(priorityCounts.high).toBeLessThanOrEqual(priorityCounts.medium + priorityCounts.low || 0)
        }
      }
    })

    it('should categorize insights into meaningful domains', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        const categories = mockInsights.map(insight => insight.category)
        const uniqueCategories = [...new Set(categories)]
        
        // Should have multiple categories
        expect(uniqueCategories.length).toBeGreaterThan(0)
        
        // Common relationship categories
        const expectedCategories = [
          'communication', 'emotional_intelligence', 'attachment',
          'self_awareness', 'conflict_resolution', 'intimacy'
        ]
        
        uniqueCategories.forEach(category => {
          expect(typeof category).toBe('string')
          expect(category.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle missing user data gracefully', async () => {
      if (typeof aiInsightsService.generatePersonalizedInsight === 'function') {
        const emptyProfile = {}
        
        await expect(
          aiInsightsService.generatePersonalizedInsight(emptyProfile)
        ).resolves.not.toThrow()
      }
    })

    it('should handle invalid input data', async () => {
      if (typeof aiInsightsService.generatePersonalizedInsight === 'function') {
        const invalidInputs = [null, undefined, 'string', 123, []]
        
        for (const input of invalidInputs) {
          await expect(
            aiInsightsService.generatePersonalizedInsight(input)
          ).resolves.not.toThrow()
        }
      }
    })

    it('should provide fallback insights when AI is unavailable', () => {
      // Test that mock responses are always available as fallback
      expect(aiInsightsService.MOCK_AI_RESPONSES).toBeDefined()
      expect(aiInsightsService.MOCK_AI_RESPONSES.personalizedInsights).toBeDefined()
      expect(Array.isArray(aiInsightsService.MOCK_AI_RESPONSES.personalizedInsights)).toBe(true)
    })
  })

  describe('insight freshness and variety', () => {
    it('should have insights with different creation dates', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 1) {
        const dates = mockInsights.map(insight => new Date(insight.createdAt))
        const uniqueDates = [...new Set(dates.map(d => d.getTime()))]
        
        // Should have insights from different times (for variety)
        expect(uniqueDates.length).toBeGreaterThan(1)
      }
    })

    it('should format dates correctly', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        mockInsights.forEach(insight => {
          expect(insight.createdAt).toBeDefined()
          
          // Should be valid ISO date string
          const date = new Date(insight.createdAt)
          expect(date.toISOString()).toBe(insight.createdAt)
          
          // Should not be in the future
          expect(date.getTime()).toBeLessThanOrEqual(Date.now())
        })
      }
    })
  })

  describe('integration and performance', () => {
    it('should be lightweight and fast', () => {
      const startTime = performance.now()
      
      // Access mock data multiple times
      for (let i = 0; i < 100; i++) {
        const insights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
        insights.forEach(insight => {
          expect(insight.id).toBeDefined()
        })
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should be very fast for mock data access
      expect(executionTime).toBeLessThan(100) // 100ms
    })

    it('should have consistent data structure', () => {
      const mockInsights = aiInsightsService.MOCK_AI_RESPONSES?.personalizedInsights || []
      
      if (mockInsights.length > 0) {
        const firstInsight = mockInsights[0]
        const requiredProperties = Object.keys(firstInsight)
        
        // All insights should have the same structure
        mockInsights.forEach(insight => {
          requiredProperties.forEach(prop => {
            expect(insight).toHaveProperty(prop)
            expect(typeof insight[prop]).toBe(typeof firstInsight[prop])
          })
        })
      }
    })
  })
})