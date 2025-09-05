/**
 * AI Orchestrator Test Suite
 * Tests for core AI orchestration logic, agent coordination, and system intelligence
 */

import { AIOrchestrator } from '../../../services/ai/orchestrator';
import { 
  mockUserProfiles, 
  mockAIResponses, 
  generateMockAssessmentData,
  createMockApiManager 
} from '../../utils/test-utils';

// Mock external dependencies
jest.mock('../../../lib/api-route-manager');

describe('AI Orchestrator', () => {
  let orchestrator: AIOrchestrator;
  let mockApiManager: any;

  beforeEach(() => {
    mockApiManager = createMockApiManager();
    orchestrator = new AIOrchestrator({
      apiManager: mockApiManager,
      config: {
        maxConcurrentRequests: 5,
        defaultTimeout: 30000,
        retryAttempts: 3,
        enableAnalytics: true,
        enableCaching: true
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Assessment Analysis', () => {
    test('analyzes assessment with comprehensive insights', async () => {
      const assessmentData = {
        responses: [
          { questionId: 'q1', response: 'I listen actively when my partner speaks' },
          { questionId: 'q2', response: 'I struggle with expressing my needs clearly' },
          { questionId: 'q3', response: 'Conflict makes me uncomfortable' }
        ],
        userId: mockUserProfiles.free.id,
        assessmentType: 'communication_style' as const
      };

      const analysis = await orchestrator.analyzeAssessment(assessmentData);

      expect(analysis).toMatchObject({
        score: expect.any(Number),
        insights: expect.arrayContaining([
          expect.objectContaining({
            type: expect.oneOf(['strength', 'growth_area', 'neutral']),
            title: expect.any(String),
            description: expect.any(String),
            priority: expect.oneOf(['low', 'medium', 'high']),
            category: expect.any(String)
          })
        ]),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            category: expect.any(String),
            priority: expect.oneOf(['low', 'medium', 'high']),
            estimatedTime: expect.any(Number),
            difficulty: expect.oneOf(['beginner', 'intermediate', 'advanced'])
          })
        ]),
        strengths: expect.any(Array),
        growthAreas: expect.any(Array),
        confidenceLevel: expect.any(Number)
      });

      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
      expect(analysis.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(analysis.confidenceLevel).toBeLessThanOrEqual(1);
    });

    test('adapts analysis based on user subscription tier', async () => {
      const assessmentData = {
        responses: [{ questionId: 'q1', response: 'Test response' }],
        userId: mockUserProfiles.professional.id,
        assessmentType: 'communication_style' as const
      };

      const analysis = await orchestrator.analyzeAssessment(assessmentData);

      // Professional tier should get more detailed insights
      expect(analysis.insights.length).toBeGreaterThan(2);
      expect(analysis.recommendations.length).toBeGreaterThan(3);
      expect(analysis).toHaveProperty('detailedAnalysis');
      expect(analysis).toHaveProperty('advancedMetrics');
    });

    test('handles assessment errors gracefully', async () => {
      mockApiManager.request.mockRejectedValue(new Error('AI service unavailable'));

      const assessmentData = {
        responses: [{ questionId: 'q1', response: 'Test' }],
        userId: 'test-user',
        assessmentType: 'communication_style' as const
      };

      await expect(orchestrator.analyzeAssessment(assessmentData))
        .rejects.toThrow('Assessment analysis failed');
    });

    test('validates assessment data before processing', async () => {
      const invalidAssessmentData = {
        responses: [], // Empty responses
        userId: '',    // Empty user ID
        assessmentType: 'invalid_type' as any
      };

      await expect(orchestrator.analyzeAssessment(invalidAssessmentData))
        .rejects.toThrow('Invalid assessment data');
    });
  });

  describe('Learning Path Generation', () => {
    test('generates personalized learning path', async () => {
      const context = {
        userId: mockUserProfiles.premium.id,
        assessmentResults: generateMockAssessmentData(),
        preferences: {
          focusAreas: ['communication', 'conflict_resolution'],
          learningPace: 'moderate' as const,
          timeCommitment: 30, // minutes per day
          difficulty: 'intermediate' as const
        },
        currentLevel: 'beginner' as const
      };

      const learningPath = await orchestrator.generateLearningPath(context);

      expect(learningPath).toMatchObject({
        pathId: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        difficulty: context.preferences.difficulty,
        estimatedDurationWeeks: expect.any(Number),
        modules: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            order: expect.any(Number),
            estimatedTimeMinutes: expect.any(Number),
            practices: expect.any(Array),
            assessments: expect.any(Array),
            milestones: expect.any(Array)
          })
        ]),
        prerequisites: expect.any(Array),
        learningObjectives: expect.any(Array),
        personalizationScore: expect.any(Number)
      });

      expect(learningPath.personalizationScore).toBeGreaterThan(0.7);
      expect(learningPath.modules.length).toBeGreaterThan(0);
    });

    test('adapts learning path for different learning paces', async () => {
      const slowPaceContext = {
        userId: 'test-user',
        assessmentResults: generateMockAssessmentData(),
        preferences: {
          focusAreas: ['communication'],
          learningPace: 'slow' as const,
          timeCommitment: 10,
          difficulty: 'beginner' as const
        },
        currentLevel: 'beginner' as const
      };

      const fastPaceContext = {
        ...slowPaceContext,
        preferences: {
          ...slowPaceContext.preferences,
          learningPace: 'fast' as const,
          timeCommitment: 60
        }
      };

      const slowPath = await orchestrator.generateLearningPath(slowPaceContext);
      const fastPath = await orchestrator.generateLearningPath(fastPaceContext);

      expect(slowPath.estimatedDurationWeeks).toBeGreaterThan(fastPath.estimatedDurationWeeks);
      expect(slowPath.modules[0].practices.length).toBeLessThan(fastPath.modules[0].practices.length);
    });

    test('includes appropriate practices for focus areas', async () => {
      const context = {
        userId: 'test-user',
        assessmentResults: generateMockAssessmentData(),
        preferences: {
          focusAreas: ['active_listening', 'empathy'],
          learningPace: 'moderate' as const,
          timeCommitment: 30,
          difficulty: 'intermediate' as const
        },
        currentLevel: 'intermediate' as const
      };

      const learningPath = await orchestrator.generateLearningPath(context);

      const allPractices = learningPath.modules.flatMap(m => m.practices);
      const listeningPractices = allPractices.filter(p => 
        p.tags.includes('active-listening') || p.category === 'listening'
      );
      const empathyPractices = allPractices.filter(p => 
        p.tags.includes('empathy') || p.category === 'empathy'
      );

      expect(listeningPractices.length).toBeGreaterThan(0);
      expect(empathyPractices.length).toBeGreaterThan(0);
    });
  });

  describe('Daily Insights Generation', () => {
    test('generates contextual daily insights', async () => {
      const context = {
        userId: mockUserProfiles.free.id,
        recentActivity: {
          practicesCompleted: ['practice-1', 'practice-2'],
          assessmentsTaken: ['communication-assessment'],
          lastActiveDate: new Date().toISOString(),
          streak: 5
        },
        progressData: {
          currentLevel: 'intermediate' as const,
          progressPercentage: 72,
          milestones: [],
          trends: []
        },
        preferences: mockUserProfiles.free.preferences
      };

      const insights = await orchestrator.generateDailyInsights(context);

      expect(insights).toMatchObject({
        insights: expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            message: expect.any(String),
            icon: expect.any(String),
            priority: expect.oneOf(['low', 'medium', 'high']),
            type: expect.oneOf(['progress', 'suggestion', 'encouragement', 'milestone'])
          })
        ]),
        motivationalMessage: expect.any(String),
        nextSteps: expect.any(Array)
      });

      expect(insights.insights.length).toBeGreaterThan(0);
      expect(insights.nextSteps.length).toBeGreaterThan(0);
    });

    test('adapts insights to user communication style', async () => {
      const analyticalContext = {
        userId: mockUserProfiles.professional.id,
        recentActivity: { practicesCompleted: [], assessmentsTaken: [], lastActiveDate: new Date().toISOString(), streak: 0 },
        progressData: { currentLevel: 'intermediate' as const, progressPercentage: 60, milestones: [], trends: [] },
        preferences: mockUserProfiles.professional.preferences
      };

      const supportiveContext = {
        ...analyticalContext,
        userId: mockUserProfiles.free.id,
        preferences: mockUserProfiles.free.preferences
      };

      const analyticalInsights = await orchestrator.generateDailyInsights(analyticalContext);
      const supportiveInsights = await orchestrator.generateDailyInsights(supportiveContext);

      // Analytical style should have more data-driven language
      expect(analyticalInsights.motivationalMessage).toMatch(/progress|data|analysis|metrics/i);
      
      // Supportive style should have more encouraging language
      expect(supportiveInsights.motivationalMessage).toMatch(/great|wonderful|doing well|proud/i);
    });

    test('recognizes and celebrates milestones', async () => {
      const context = {
        userId: 'test-user',
        recentActivity: {
          practicesCompleted: ['practice-1'],
          assessmentsTaken: [],
          lastActiveDate: new Date().toISOString(),
          streak: 7 // Week streak milestone
        },
        progressData: {
          currentLevel: 'intermediate' as const,
          progressPercentage: 75, // 75% milestone
          milestones: [
            { id: 'week-streak', title: '7-day streak', completed: true, progress: 100 }
          ],
          trends: []
        },
        preferences: { communicationStyle: 'supportive' as const, aiPersonality: 'encouraging' as const, learningPace: 'moderate' as const }
      };

      const insights = await orchestrator.generateDailyInsights(context);

      const milestoneInsights = insights.insights.filter(i => i.type === 'milestone');
      expect(milestoneInsights.length).toBeGreaterThan(0);
      expect(milestoneInsights[0].message).toMatch(/streak|milestone|achievement/i);
    });
  });

  describe('Progress Tracking', () => {
    test('tracks comprehensive progress metrics', async () => {
      const trackingData = {
        userId: mockUserProfiles.premium.id,
        activityData: {
          practicesCompleted: [
            { practiceId: 'p1', completedAt: new Date(), score: 85 },
            { practiceId: 'p2', completedAt: new Date(), score: 92 }
          ],
          assessmentsCompleted: [
            { assessmentId: 'a1', completedAt: new Date(), score: 78 }
          ],
          timeSpent: 45, // minutes
          streak: 3
        },
        learningPath: mockAIResponses.learningPath
      };

      const progress = await orchestrator.trackProgress(trackingData);

      expect(progress).toMatchObject({
        currentLevel: expect.oneOf(['beginner', 'intermediate', 'advanced']),
        progressPercentage: expect.any(Number),
        milestones: expect.any(Array),
        trends: expect.arrayContaining([
          expect.objectContaining({
            metric: expect.any(String),
            direction: expect.oneOf(['up', 'down', 'stable']),
            value: expect.any(Number),
            period: expect.any(String)
          })
        ]),
        achievements: expect.any(Array),
        recommendations: expect.any(Array)
      });

      expect(progress.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(progress.progressPercentage).toBeLessThanOrEqual(100);
    });

    test('identifies learning trends and patterns', async () => {
      const trackingData = {
        userId: 'test-user',
        activityData: {
          practicesCompleted: Array(10).fill(null).map((_, i) => ({
            practiceId: `p${i}`,
            completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Daily over 10 days
            score: 70 + i * 2 // Improving trend
          })),
          assessmentsCompleted: [],
          timeSpent: 30,
          streak: 10
        },
        learningPath: mockAIResponses.learningPath
      };

      const progress = await orchestrator.trackProgress(trackingData);

      const improvementTrend = progress.trends.find(t => t.metric === 'practice_scores');
      expect(improvementTrend).toBeDefined();
      expect(improvementTrend?.direction).toBe('up');
    });

    test('suggests appropriate next actions based on progress', async () => {
      const trackingData = {
        userId: 'test-user',
        activityData: {
          practicesCompleted: [], // No recent activity
          assessmentsCompleted: [],
          timeSpent: 0,
          streak: 0
        },
        learningPath: mockAIResponses.learningPath
      };

      const progress = await orchestrator.trackProgress(trackingData);

      expect(progress.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'get_started',
          priority: 'high'
        })
      );
    });
  });

  describe('Communication Guidance', () => {
    test('provides contextual communication advice', async () => {
      const context = {
        userId: 'test-user',
        scenario: 'difficult_conversation',
        participantInfo: {
          relationshipType: 'romantic_partner',
          communicationStyle: 'direct',
          currentMood: 'frustrated'
        },
        userGoals: ['resolve_conflict', 'maintain_connection'],
        previousAttempts: [
          { approach: 'direct_confrontation', outcome: 'escalated' }
        ]
      };

      const guidance = await orchestrator.provideCommunicationGuidance(context);

      expect(guidance).toMatchObject({
        primaryAdvice: expect.any(String),
        strategies: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String),
            when_to_use: expect.any(String),
            steps: expect.any(Array)
          })
        ]),
        phrasesSuggestions: expect.any(Array),
        thingsToAvoid: expect.any(Array),
        expectedOutcomes: expect.any(Array),
        followUpActions: expect.any(Array),
        confidenceLevel: expect.any(Number)
      });

      expect(guidance.strategies.length).toBeGreaterThan(0);
      expect(guidance.confidenceLevel).toBeGreaterThan(0.5);
    });

    test('adapts advice based on relationship context', async () => {
      const romanticContext = {
        userId: 'test-user',
        scenario: 'expressing_needs',
        participantInfo: {
          relationshipType: 'romantic_partner',
          communicationStyle: 'supportive',
          currentMood: 'receptive'
        },
        userGoals: ['improve_intimacy'],
        previousAttempts: []
      };

      const professionalContext = {
        ...romanticContext,
        participantInfo: {
          ...romanticContext.participantInfo,
          relationshipType: 'colleague'
        },
        userGoals: ['maintain_professionalism', 'resolve_work_issue']
      };

      const romanticGuidance = await orchestrator.provideCommunicationGuidance(romanticContext);
      const professionalGuidance = await orchestrator.provideCommunicationGuidance(professionalContext);

      expect(romanticGuidance.phrasesSuggestions[0]).toMatch(/feel|love|connection|us/i);
      expect(professionalGuidance.phrasesSuggestions[0]).toMatch(/work|project|team|collaboration/i);
    });

    test('considers user communication style preferences', async () => {
      const directUserContext = {
        userId: mockUserProfiles.professional.id,
        scenario: 'setting_boundaries',
        participantInfo: {
          relationshipType: 'friend',
          communicationStyle: 'analytical',
          currentMood: 'neutral'
        },
        userGoals: ['clear_boundaries'],
        previousAttempts: []
      };

      const supportiveUserContext = {
        ...directUserContext,
        userId: mockUserProfiles.free.id
      };

      const directGuidance = await orchestrator.provideCommunicationGuidance(directUserContext);
      const supportiveGuidance = await orchestrator.provideCommunicationGuidance(supportiveUserContext);

      expect(directGuidance.primaryAdvice).toMatch(/clear|direct|specific|straightforward/i);
      expect(supportiveGuidance.primaryAdvice).toMatch(/gentle|understanding|supportive|kind/i);
    });
  });

  describe('System Health and Metrics', () => {
    test('retrieves comprehensive health status', async () => {
      const healthStatus = await orchestrator.getHealthStatus();

      expect(healthStatus).toMatchObject({
        status: expect.oneOf(['healthy', 'degraded', 'unhealthy']),
        agents: expect.objectContaining({
          assessment: expect.oneOf(['operational', 'degraded', 'error']),
          learning: expect.oneOf(['operational', 'degraded', 'error']),
          insights: expect.oneOf(['operational', 'degraded', 'error']),
          guidance: expect.oneOf(['operational', 'degraded', 'error']),
          progress: expect.oneOf(['operational', 'degraded', 'error'])
        }),
        metrics: expect.objectContaining({
          responseTime: expect.any(Number),
          successRate: expect.any(Number),
          activeUsers: expect.any(Number),
          requestsPerHour: expect.any(Number)
        }),
        issues: expect.any(Array),
        lastChecked: expect.any(String)
      });

      expect(healthStatus.metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(healthStatus.metrics.successRate).toBeLessThanOrEqual(100);
    });

    test('reports system metrics accurately', async () => {
      // Simulate some activity
      await orchestrator.analyzeAssessment({
        responses: [{ questionId: 'q1', response: 'test' }],
        userId: 'test-user',
        assessmentType: 'communication_style'
      });

      const metrics = await orchestrator.getSystemMetrics();

      expect(metrics).toMatchObject({
        totalRequests: expect.any(Number),
        averageResponseTime: expect.any(Number),
        errorRate: expect.any(Number),
        cacheHitRate: expect.any(Number),
        activeConnections: expect.any(Number),
        memoryUsage: expect.any(Number),
        cpuUsage: expect.any(Number),
        uptime: expect.any(Number)
      });

      expect(metrics.totalRequests).toBeGreaterThan(0);
    });

    test('detects performance degradation', async () => {
      // Mock slow responses
      mockApiManager.request.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      );

      const healthStatus = await orchestrator.getHealthStatus();
      
      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.issues).toContainEqual(
        expect.objectContaining({
          type: 'performance',
          severity: expect.oneOf(['low', 'medium', 'high']),
          message: expect.stringContaining('response time')
        })
      );
    });
  });

  describe('Error Handling and Resilience', () => {
    test('handles partial service failures gracefully', async () => {
      // Mock one service failing
      mockApiManager.request.mockImplementation((routeId: string) => {
        if (routeId === 'ai.insights') {
          return Promise.reject(new Error('Insights service down'));
        }
        return Promise.resolve(mockAIResponses.assessmentAnalysis);
      });

      const healthStatus = await orchestrator.getHealthStatus();
      
      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.agents.insights).toBe('error');
      expect(healthStatus.agents.assessment).toBe('operational');
    });

    test('provides fallback responses when services are unavailable', async () => {
      mockApiManager.request.mockRejectedValue(new Error('All services down'));

      const context = {
        userId: 'test-user',
        recentActivity: { practicesCompleted: [], assessmentsTaken: [], lastActiveDate: new Date().toISOString(), streak: 0 },
        progressData: { currentLevel: 'beginner' as const, progressPercentage: 0, milestones: [], trends: [] },
        preferences: { communicationStyle: 'supportive' as const, aiPersonality: 'encouraging' as const, learningPace: 'moderate' as const }
      };

      const insights = await orchestrator.generateDailyInsights(context);

      expect(insights).toBeDefined();
      expect(insights.insights.length).toBeGreaterThan(0);
      expect(insights.motivationalMessage).toContain('fallback');
    });

    test('retries failed requests with exponential backoff', async () => {
      let attemptCount = 0;
      mockApiManager.request.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve(mockAIResponses.assessmentAnalysis);
      });

      const analysis = await orchestrator.analyzeAssessment({
        responses: [{ questionId: 'q1', response: 'test' }],
        userId: 'test-user',
        assessmentType: 'communication_style'
      });

      expect(analysis).toBeDefined();
      expect(attemptCount).toBe(3);
    });

    test('circuit breaker prevents cascade failures', async () => {
      // Cause multiple failures to trip circuit breaker
      mockApiManager.request.mockRejectedValue(new Error('Service failure'));

      // Make multiple failing requests
      const promises = Array(5).fill(null).map(() => 
        orchestrator.analyzeAssessment({
          responses: [{ questionId: 'q1', response: 'test' }],
          userId: 'test-user',
          assessmentType: 'communication_style'
        }).catch(() => null)
      );

      await Promise.all(promises);

      // Circuit breaker should now be open
      const healthStatus = await orchestrator.getHealthStatus();
      expect(healthStatus.issues).toContainEqual(
        expect.objectContaining({
          type: 'circuit_breaker',
          message: expect.stringContaining('circuit breaker is open')
        })
      );
    });
  });
});
