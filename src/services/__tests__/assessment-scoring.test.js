import { describe, it, expect, beforeEach } from 'vitest'

// Import the AssessmentScoringService
// Note: Since this is a JS file, we'll need to handle the import properly
const AssessmentScoringService = (await import('../assessment-scoring.js')).default || 
  (await import('../assessment-scoring.js')).AssessmentScoringService

describe('AssessmentScoringService', () => {
  let service

  beforeEach(() => {
    service = new AssessmentScoringService()
  })

  describe('initialization', () => {
    it('should initialize with correct scoring weights', () => {
      expect(service.scoringWeights).toBeDefined()
      expect(service.scoringWeights.communication_style).toBe(0.2)
      expect(service.scoringWeights.emotional_availability).toBe(0.15)
      expect(service.scoringWeights.attachment_patterns).toBe(0.2)
    })

    it('should have category mappings defined', () => {
      expect(service.categoryMappings).toBeDefined()
      expect(service.categoryMappings.communication).toContain('communication_style')
      expect(service.categoryMappings.emotional_intelligence).toContain('emotional_availability')
    })

    it('should have weights that sum to approximately 1', () => {
      const totalWeight = Object.values(service.scoringWeights)
        .reduce((sum, weight) => sum + weight, 0)
      
      expect(totalWeight).toBeCloseTo(1, 2)
    })
  })

  describe('calculateOverallScore', () => {
    it('should return default score for empty answers', () => {
      const result = service.calculateOverallScore({})
      
      expect(result.score).toBe(0)
      expect(result.breakdown).toEqual({})
      expect(Array.isArray(result.insights)).toBe(true)
    })

    it('should return default score for null/undefined answers', () => {
      const result1 = service.calculateOverallScore(null)
      const result2 = service.calculateOverallScore(undefined)
      
      expect(result1.score).toBe(0)
      expect(result2.score).toBe(0)
    })

    it('should calculate score for valid answers', () => {
      const answers = {
        communication_style: 4,
        emotional_availability: 3,
        attachment_patterns: 5,
        intimacy_comfort: 4,
        conflict_resolution: 3,
        emotional_regulation: 4,
      }

      const result = service.calculateOverallScore(answers)

      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(typeof result.breakdown).toBe('object')
      expect(Array.isArray(result.insights)).toBe(true)
    })

    it('should handle partial answers', () => {
      const partialAnswers = {
        communication_style: 4,
        emotional_availability: 3,
      }

      const result = service.calculateOverallScore(partialAnswers)

      expect(result.score).toBeGreaterThan(0)
      expect(result.breakdown).toBeDefined()
    })

    it('should validate score range (0-100)', () => {
      const maxAnswers = {
        communication_style: 5,
        emotional_availability: 5,
        attachment_patterns: 5,
        intimacy_comfort: 5,
        conflict_resolution: 5,
        emotional_regulation: 5,
      }

      const minAnswers = {
        communication_style: 1,
        emotional_availability: 1,
        attachment_patterns: 1,
        intimacy_comfort: 1,
        conflict_resolution: 1,
        emotional_regulation: 1,
      }

      const maxResult = service.calculateOverallScore(maxAnswers)
      const minResult = service.calculateOverallScore(minAnswers)

      expect(maxResult.score).toBeLessThanOrEqual(100)
      expect(minResult.score).toBeGreaterThanOrEqual(0)
      expect(maxResult.score).toBeGreaterThan(minResult.score)
    })
  })

  describe('calculateCategoryScores', () => {
    it('should calculate category scores correctly', () => {
      const answers = {
        communication_style: 4,
        conflict_resolution: 3,
        emotional_availability: 5,
        emotional_regulation: 4,
      }

      // Access the method if it exists (it might be private)
      if (service.calculateCategoryScores) {
        const categoryScores = service.calculateCategoryScores(answers)

        expect(categoryScores).toBeDefined()
        expect(typeof categoryScores).toBe('object')
        
        // Communication category should include communication_style and conflict_resolution
        if (categoryScores.communication) {
          expect(categoryScores.communication).toBeGreaterThan(0)
        }
      }
    })

    it('should handle missing categories gracefully', () => {
      const limitedAnswers = {
        communication_style: 4,
      }

      if (service.calculateCategoryScores) {
        const result = service.calculateCategoryScores(limitedAnswers)
        expect(result).toBeDefined()
      }
    })
  })

  describe('score insights generation', () => {
    it('should generate insights based on score ranges', () => {
      const highScoreAnswers = {
        communication_style: 5,
        emotional_availability: 5,
        attachment_patterns: 5,
        intimacy_comfort: 5,
        conflict_resolution: 5,
        emotional_regulation: 5,
      }

      const lowScoreAnswers = {
        communication_style: 2,
        emotional_availability: 2,
        attachment_patterns: 2,
        intimacy_comfort: 2,
        conflict_resolution: 2,
        emotional_regulation: 2,
      }

      const highResult = service.calculateOverallScore(highScoreAnswers)
      const lowResult = service.calculateOverallScore(lowScoreAnswers)

      expect(highResult.insights.length).toBeGreaterThan(0)
      expect(lowResult.insights.length).toBeGreaterThan(0)
      
      // High score insights should be different from low score insights
      expect(highResult.insights[0]).not.toBe(lowResult.insights[0])
    })

    it('should provide actionable insights', () => {
      const answers = {
        communication_style: 3,
        emotional_availability: 4,
        attachment_patterns: 2, // Low score to trigger specific insight
      }

      const result = service.calculateOverallScore(answers)

      expect(result.insights.length).toBeGreaterThan(0)
      result.insights.forEach(insight => {
        expect(typeof insight).toBe('string')
        expect(insight.length).toBeGreaterThan(0)
      })
    })
  })

  describe('edge cases and validation', () => {
    it('should handle invalid score values', () => {
      const invalidAnswers = {
        communication_style: 'invalid',
        emotional_availability: null,
        attachment_patterns: undefined,
        intimacy_comfort: -1,
        conflict_resolution: 10, // Above scale
      }

      const result = service.calculateOverallScore(invalidAnswers)

      // Should handle gracefully without throwing
      expect(result).toBeDefined()
      expect(typeof result.score).toBe('number')
    })

    it('should handle extreme values', () => {
      const extremeAnswers = {
        communication_style: 0,
        emotional_availability: 6,
        attachment_patterns: -5,
        intimacy_comfort: 1000,
      }

      expect(() => {
        service.calculateOverallScore(extremeAnswers)
      }).not.toThrow()
    })

    it('should handle empty strings as answers', () => {
      const emptyStringAnswers = {
        communication_style: '',
        emotional_availability: ' ',
        attachment_patterns: null,
      }

      const result = service.calculateOverallScore(emptyStringAnswers)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('category-specific scoring', () => {
    it('should weight categories according to importance', () => {
      const communicationFocusedAnswers = {
        communication_style: 5,
        conflict_resolution: 5,
        emotional_availability: 1,
        attachment_patterns: 1,
        intimacy_comfort: 1,
        emotional_regulation: 1,
      }

      const attachmentFocusedAnswers = {
        communication_style: 1,
        conflict_resolution: 1,
        emotional_availability: 1,
        attachment_patterns: 5,
        intimacy_comfort: 5,
        emotional_regulation: 1,
      }

      const commResult = service.calculateOverallScore(communicationFocusedAnswers)
      const attachResult = service.calculateOverallScore(attachmentFocusedAnswers)

      // Both should reflect their respective strengths
      expect(commResult.score).toBeGreaterThan(0)
      expect(attachResult.score).toBeGreaterThan(0)
      
      // Communication and attachment patterns both have 0.2 weight, so scores should be similar
      expect(Math.abs(commResult.score - attachResult.score)).toBeLessThan(10)
    })
  })

  describe('breakdown analysis', () => {
    it('should provide detailed breakdown of scores', () => {
      const answers = {
        communication_style: 4,
        emotional_availability: 3,
        attachment_patterns: 5,
      }

      const result = service.calculateOverallScore(answers)

      expect(result.breakdown).toBeDefined()
      expect(typeof result.breakdown).toBe('object')
    })
  })

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now()
      
      // Run multiple calculations
      for (let i = 0; i < 100; i++) {
        const randomAnswers = {
          communication_style: Math.floor(Math.random() * 5) + 1,
          emotional_availability: Math.floor(Math.random() * 5) + 1,
          attachment_patterns: Math.floor(Math.random() * 5) + 1,
          intimacy_comfort: Math.floor(Math.random() * 5) + 1,
          conflict_resolution: Math.floor(Math.random() * 5) + 1,
          emotional_regulation: Math.floor(Math.random() * 5) + 1,
        }
        
        service.calculateOverallScore(randomAnswers)
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete within reasonable time (1 second for 100 calculations)
      expect(executionTime).toBeLessThan(1000)
    })
  })
})