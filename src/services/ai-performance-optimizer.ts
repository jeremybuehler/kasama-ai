import { getOptimizedSupabase } from "../lib/supabase-optimized";
import { Database } from "../lib/database.types";

type AgentType = Database["public"]["Enums"]["agent_type"];

// AI Request types for the 5-agent system
interface AIRequest {
  id: string;
  userId: string;
  agentType: AgentType;
  inputData: any;
  priority: 'low' | 'medium' | 'high';
  maxTokens?: number;
  temperature?: number;
  resolve: (response: AIResponse) => void;
  reject: (error: Error) => void;
}

interface AIResponse {
  id: string;
  output: any;
  tokensUsed: number;
  processingTime: number;
  costCents: number;
  cacheHit: boolean;
  confidence?: number;
}

interface AgentMetrics {
  agentType: AgentType;
  averageResponseTime: number;
  averageCost: number;
  successRate: number;
  currentLoad: number;
  cacheHitRate: number;
  lastUpdated: Date;
}

// Semantic similarity caching for AI responses
class SemanticCache {
  private vectorStore = new Map<string, { embedding: number[]; response: AIResponse; timestamp: number }>();
  private similarityThreshold = 0.85;
  private maxCacheSize = 10000;
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate a simple embedding for semantic similarity
   * In production, use a proper embedding service like OpenAI or Cohere
   */
  private generateEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(100).fill(0);
    
    words.forEach((word, i) => {
      const hash = this.simpleHash(word);
      embedding[hash % 100] += 1;
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getCachedResponse(prompt: string, agentType: AgentType): Promise<AIResponse | null> {
    const embedding = this.generateEmbedding(prompt);
    const cacheKey = `${agentType}:${prompt}`;
    
    // First check exact match
    const exactMatch = this.vectorStore.get(cacheKey);
    if (exactMatch && Date.now() - exactMatch.timestamp < this.cacheTTL) {
      return { ...exactMatch.response, cacheHit: true };
    }

    // Check for semantic similarity
    for (const [key, cached] of this.vectorStore.entries()) {
      if (!key.startsWith(`${agentType}:`)) continue;
      
      const similarity = this.cosineSimilarity(embedding, cached.embedding);
      if (similarity > this.similarityThreshold && Date.now() - cached.timestamp < this.cacheTTL) {
        return { ...cached.response, cacheHit: true };
      }
    }

    return null;
  }

  async cacheResponse(prompt: string, agentType: AgentType, response: AIResponse): Promise<void> {
    const embedding = this.generateEmbedding(prompt);
    const cacheKey = `${agentType}:${prompt}`;
    
    // Clean up old entries if cache is full
    if (this.vectorStore.size >= this.maxCacheSize) {
      this.cleanupOldEntries();
    }
    
    this.vectorStore.set(cacheKey, {
      embedding,
      response: { ...response, cacheHit: false },
      timestamp: Date.now(),
    });
  }

  private cleanupOldEntries(): void {
    const now = Date.now();
    const entries = Array.from(this.vectorStore.entries());
    
    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > this.cacheTTL) {
        this.vectorStore.delete(key);
      }
    });
    
    // If still too full, remove oldest entries
    if (this.vectorStore.size >= this.maxCacheSize) {
      const sortedEntries = entries
        .filter(([key]) => this.vectorStore.has(key))
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = Math.floor(this.maxCacheSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove; i++) {
        this.vectorStore.delete(sortedEntries[i][0]);
      }
    }
  }

  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: Date | null;
  } {
    let oldestTimestamp = Number.MAX_VALUE;
    for (const cached of this.vectorStore.values()) {
      if (cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
      }
    }

    return {
      size: this.vectorStore.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
      oldestEntry: oldestTimestamp === Number.MAX_VALUE ? null : new Date(oldestTimestamp),
    };
  }
}

// AI Performance Optimizer for the 5-agent system
export class AIPerformanceOptimizer {
  private requestQueue: AIRequest[] = [];
  private batchTimeout = 150; // 150ms batching window
  private maxBatchSize = 10;
  private isProcessing = false;
  private semanticCache = new SemanticCache();
  private supabase = getOptimizedSupabase();
  
  // Agent metrics for intelligent routing
  private agentMetrics = new Map<AgentType, AgentMetrics>();

  constructor() {
    this.initializeAgentMetrics();
    this.startPerformanceMonitoring();
  }

  private initializeAgentMetrics(): void {
    const agentTypes: AgentType[] = [
      'assessment_analyst',
      'learning_coach', 
      'progress_tracker',
      'insight_generator',
      'communication_advisor'
    ];

    agentTypes.forEach(agentType => {
      this.agentMetrics.set(agentType, {
        agentType,
        averageResponseTime: 1500,
        averageCost: 0.02,
        successRate: 0.95,
        currentLoad: 0,
        cacheHitRate: 0.3,
        lastUpdated: new Date(),
      });
    });
  }

  /**
   * Process AI request with caching, batching, and optimization
   */
  async processAIRequest(request: Omit<AIRequest, 'id' | 'resolve' | 'reject'>): Promise<AIResponse> {
    const requestId = crypto.randomUUID();
    
    // Check semantic cache first
    const cachedResponse = await this.semanticCache.getCachedResponse(
      JSON.stringify(request.inputData),
      request.agentType
    );

    if (cachedResponse) {
      // Record cache hit
      await this.recordInteraction({
        userId: request.userId,
        agentType: request.agentType,
        inputData: request.inputData,
        outputData: cachedResponse.output,
        processingTime: 50, // Fast cache retrieval
        tokenCount: cachedResponse.tokensUsed,
        costCents: 0, // No cost for cache hits
        cacheHit: true,
      });

      return cachedResponse;
    }

    return new Promise((resolve, reject) => {
      const aiRequest: AIRequest = {
        id: requestId,
        ...request,
        resolve,
        reject,
      };

      this.requestQueue.push(aiRequest);
      this.scheduleBatchProcessing();
    });
  }

  private scheduleBatchProcessing(): void {
    if (this.isProcessing) return;

    setTimeout(() => {
      if (this.requestQueue.length > 0) {
        this.processBatch();
      }
    }, this.batchTimeout);
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.requestQueue.splice(0, this.maxBatchSize);

    try {
      // Group requests by agent type for efficient processing
      const groupedRequests = this.groupRequestsByAgent(batch);
      
      await Promise.all(
        Array.from(groupedRequests.entries()).map(([agentType, requests]) =>
          this.processAgentGroup(agentType, requests)
        )
      );
    } catch (error) {
      console.error('Batch processing error:', error);
      batch.forEach(request => request.reject(error as Error));
    } finally {
      this.isProcessing = false;
      
      // Process remaining requests if any
      if (this.requestQueue.length > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }

  private groupRequestsByAgent(requests: AIRequest[]): Map<AgentType, AIRequest[]> {
    const grouped = new Map<AgentType, AIRequest[]>();
    
    requests.forEach(request => {
      if (!grouped.has(request.agentType)) {
        grouped.set(request.agentType, []);
      }
      grouped.get(request.agentType)!.push(request);
    });
    
    return grouped;
  }

  private async processAgentGroup(agentType: AgentType, requests: AIRequest[]): Promise<void> {
    const startTime = Date.now();
    
    // Update current load
    const metrics = this.agentMetrics.get(agentType)!;
    metrics.currentLoad = requests.length;

    try {
      // Process requests based on agent type
      const responses = await this.callAgentAPI(agentType, requests);
      
      // Process responses and cache them
      await Promise.all(
        responses.map(async (response, index) => {
          const request = requests[index];
          const processingTime = Date.now() - startTime;
          
          // Cache the response
          await this.semanticCache.cacheResponse(
            JSON.stringify(request.inputData),
            agentType,
            response
          );

          // Record interaction
          await this.recordInteraction({
            userId: request.userId,
            agentType: request.agentType,
            inputData: request.inputData,
            outputData: response.output,
            processingTime,
            tokenCount: response.tokensUsed,
            costCents: response.costCents,
            cacheHit: false,
          });

          // Update metrics
          this.updateAgentMetrics(agentType, response, processingTime);
          
          request.resolve(response);
        })
      );
    } catch (error) {
      console.error(`Error processing ${agentType} requests:`, error);
      requests.forEach(request => request.reject(error as Error));
    } finally {
      // Reset load
      metrics.currentLoad = 0;
      metrics.lastUpdated = new Date();
    }
  }

  /**
   * Mock AI API calls for different agents
   * In production, integrate with actual Claude/OpenAI APIs
   */
  private async callAgentAPI(agentType: AgentType, requests: AIRequest[]): Promise<AIResponse[]> {
    // Simulate API latency
    const baseLatency = this.getAgentLatency(agentType);
    await new Promise(resolve => setTimeout(resolve, baseLatency));

    return requests.map(request => ({
      id: request.id,
      output: this.generateMockResponse(agentType, request.inputData),
      tokensUsed: Math.floor(Math.random() * 500) + 100,
      processingTime: baseLatency + Math.floor(Math.random() * 200),
      costCents: this.calculateCost(agentType, Math.floor(Math.random() * 500) + 100),
      cacheHit: false,
      confidence: 0.8 + Math.random() * 0.2,
    }));
  }

  private getAgentLatency(agentType: AgentType): number {
    const baseLatencies = {
      assessment_analyst: 800,
      learning_coach: 1200,
      progress_tracker: 600,
      insight_generator: 1000,
      communication_advisor: 900,
    };
    return baseLatencies[agentType];
  }

  private generateMockResponse(agentType: AgentType, inputData: any): any {
    // Mock responses for different agent types
    const mockResponses = {
      assessment_analyst: {
        score: Math.floor(Math.random() * 100) + 1,
        insights: ['Strong communication skills', 'Room for growth in empathy'],
        recommendations: ['Practice active listening', 'Consider couples therapy'],
      },
      learning_coach: {
        learningPath: 'Communication Mastery',
        nextSteps: ['Complete Module 1', 'Practice daily exercises'],
        estimatedCompletion: '2 weeks',
      },
      progress_tracker: {
        streak: Math.floor(Math.random() * 30) + 1,
        improvement: '+15% this week',
        milestones: ['Completed first assessment', 'Maintained 7-day streak'],
      },
      insight_generator: {
        dailyInsight: 'Your communication style shows great potential for growth',
        actionItems: ['Try one new conversation technique today'],
        motivationalMessage: 'Every small step counts in your relationship journey',
      },
      communication_advisor: {
        advice: 'Consider using "I" statements to express your feelings',
        techniques: ['Active listening', 'Emotional validation'],
        examples: ['Instead of "You never listen", try "I feel unheard when..."'],
      },
    };

    return mockResponses[agentType];
  }

  private calculateCost(agentType: AgentType, tokens: number): number {
    const costPerToken = {
      assessment_analyst: 0.00008, // $0.08 per 1K tokens
      learning_coach: 0.00006,    // $0.06 per 1K tokens
      progress_tracker: 0.00004,  // $0.04 per 1K tokens
      insight_generator: 0.00005, // $0.05 per 1K tokens
      communication_advisor: 0.00007, // $0.07 per 1K tokens
    };

    return Math.round(tokens * costPerToken[agentType] * 100); // Convert to cents
  }

  private updateAgentMetrics(agentType: AgentType, response: AIResponse, processingTime: number): void {
    const metrics = this.agentMetrics.get(agentType)!;
    
    // Update moving averages
    const alpha = 0.1; // Smoothing factor
    metrics.averageResponseTime = metrics.averageResponseTime * (1 - alpha) + processingTime * alpha;
    metrics.averageCost = metrics.averageCost * (1 - alpha) + response.costCents * alpha;
    
    if (response.confidence && response.confidence > 0.7) {
      metrics.successRate = metrics.successRate * (1 - alpha) + 1 * alpha;
    } else {
      metrics.successRate = metrics.successRate * (1 - alpha) + 0 * alpha;
    }
    
    metrics.lastUpdated = new Date();
  }

  private async recordInteraction(interaction: {
    userId: string;
    agentType: AgentType;
    inputData: any;
    outputData: any;
    processingTime: number;
    tokenCount: number;
    costCents: number;
    cacheHit: boolean;
  }): Promise<void> {
    try {
      await this.supabase.mainClient
        .from('ai_interactions')
        .insert({
          user_id: interaction.userId,
          agent_type: interaction.agentType,
          input_data: interaction.inputData,
          output_data: interaction.outputData,
          processing_time_ms: interaction.processingTime,
          token_count: interaction.tokenCount,
          cost_cents: interaction.costCents,
          cache_hit: interaction.cacheHit,
        });
    } catch (error) {
      console.error('Failed to record AI interaction:', error);
    }
  }

  /**
   * Get performance statistics for monitoring
   */
  getPerformanceStats(): {
    agents: Array<AgentMetrics>;
    cache: ReturnType<SemanticCache['getCacheStats']>;
    queueSize: number;
    totalInteractions: number;
  } {
    return {
      agents: Array.from(this.agentMetrics.values()),
      cache: this.semanticCache.getCacheStats(),
      queueSize: this.requestQueue.length,
      totalInteractions: 0, // Would track this over time
    };
  }

  /**
   * Get cost analytics for the current period
   */
  async getCostAnalytics(userId?: string, days: number = 30): Promise<{
    totalCost: number;
    costByAgent: Record<AgentType, number>;
    averageCostPerUser: number;
    cacheEfficiency: number;
  }> {
    try {
      const { data, error } = await this.supabase.cachedQuery(
        `cost_analytics_${userId || 'all'}_${days}`,
        async (client) => {
          let query = client
            .from('ai_interactions')
            .select('agent_type, cost_cents, cache_hit')
            .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

          if (userId) {
            query = query.eq('user_id', userId);
          }

          return query;
        },
        5 * 60 * 1000 // 5 minute cache
      );

      if (error) throw error;

      const totalCost = data?.reduce((sum, row) => sum + row.cost_cents, 0) || 0;
      const cacheHits = data?.filter(row => row.cache_hit).length || 0;
      const totalRequests = data?.length || 0;

      const costByAgent = {} as Record<AgentType, number>;
      data?.forEach(row => {
        costByAgent[row.agent_type] = (costByAgent[row.agent_type] || 0) + row.cost_cents;
      });

      return {
        totalCost: totalCost / 100, // Convert cents to dollars
        costByAgent: Object.fromEntries(
          Object.entries(costByAgent).map(([agent, cost]) => [agent, cost / 100])
        ) as Record<AgentType, number>,
        averageCostPerUser: totalCost / 100, // Would calculate per unique user
        cacheEfficiency: totalRequests > 0 ? cacheHits / totalRequests : 0,
      };
    } catch (error) {
      console.error('Failed to get cost analytics:', error);
      return {
        totalCost: 0,
        costByAgent: {} as Record<AgentType, number>,
        averageCostPerUser: 0,
        cacheEfficiency: 0,
      };
    }
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
      this.logPerformanceMetrics();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredCache(): void {
    // Cache cleanup is handled internally by SemanticCache
    const stats = this.semanticCache.getCacheStats();
    if (stats.size > stats.maxSize * 0.9) {
      console.warn('AI cache approaching capacity:', stats);
    }
  }

  private logPerformanceMetrics(): void {
    const stats = this.getPerformanceStats();
    console.log('AI Performance Stats:', {
      queueSize: stats.queueSize,
      cacheHitRate: stats.cache.hitRate,
      avgResponseTimes: stats.agents.map(a => ({
        agent: a.agentType,
        responseTime: a.averageResponseTime,
        cost: a.averageCost,
      })),
    });
  }
}

// Export singleton instance
export const aiOptimizer = new AIPerformanceOptimizer();