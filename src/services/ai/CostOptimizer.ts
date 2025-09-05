/**
 * AI Cost Optimization Service
 * Intelligent cost management and resource optimization for AI operations
 */

export interface CostMetrics {
  totalCost: number
  requestCount: number
  averageCostPerRequest: number
  tokenUsage: {
    input: number
    output: number
    total: number
  }
  modelUsage: Record<string, number>
  timeRange: {
    start: Date
    end: Date
  }
}

export interface OptimizationStrategy {
  id: string
  name: string
  description: string
  expectedSavings: number
  implementation: 'immediate' | 'gradual' | 'manual'
  impact: 'low' | 'medium' | 'high'
}

export interface CostAlert {
  id: string
  type: 'budget_exceeded' | 'unusual_spike' | 'inefficient_usage'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  suggestedActions: string[]
  timestamp: Date
}

export class CostOptimizer {
  private static instance: CostOptimizer
  private costHistory: Map<string, CostMetrics[]> = new Map()
  private optimizationRules: Map<string, (context: any) => OptimizationStrategy[]> = new Map()
  private budgetLimits: Map<string, number> = new Map()
  private alerts: CostAlert[] = []
  
  static getInstance(): CostOptimizer {
    if (!CostOptimizer.instance) {
      CostOptimizer.instance = new CostOptimizer()
    }
    return CostOptimizer.instance
  }

  private constructor() {
    this.initializeOptimizationRules()
    this.setupBudgetMonitoring()
  }

  /**
   * Track AI request costs
   */
  async trackRequest(
    operation: string,
    model: string,
    tokenUsage: { input: number; output: number },
    responseTime: number,
    userId?: string
  ): Promise<void> {
    try {
      const cost = this.calculateCost(model, tokenUsage)
      const timestamp = new Date()
      
      // Store cost metrics
      const key = userId ? `user_${userId}` : 'global'
      const existing = this.costHistory.get(key) || []
      
      existing.push({
        totalCost: cost,
        requestCount: 1,
        averageCostPerRequest: cost,
        tokenUsage: {
          input: tokenUsage.input,
          output: tokenUsage.output,
          total: tokenUsage.input + tokenUsage.output
        },
        modelUsage: { [model]: 1 },
        timeRange: { start: timestamp, end: timestamp }
      })

      this.costHistory.set(key, existing.slice(-1000)) // Keep last 1000 requests
      
      // Check for cost alerts
      await this.checkCostAlerts(key, cost, operation)
      
    } catch (error) {
      console.error('Failed to track AI request cost:', error)
    }
  }

  /**
   * Calculate cost based on model and token usage
   */
  private calculateCost(model: string, tokenUsage: { input: number; output: number }): number {
    const pricing = this.getModelPricing(model)
    
    const inputCost = (tokenUsage.input / 1000) * pricing.input
    const outputCost = (tokenUsage.output / 1000) * pricing.output
    
    return inputCost + outputCost
  }

  /**
   * Get pricing for different AI models
   */
  private getModelPricing(model: string): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'default': { input: 0.002, output: 0.002 }
    }

    return pricing[model] || pricing['default']
  }

  /**
   * Get cost metrics for a time period
   */
  getCostMetrics(
    timeRange: { start: Date; end: Date },
    userId?: string
  ): CostMetrics {
    const key = userId ? `user_${userId}` : 'global'
    const history = this.costHistory.get(key) || []
    
    const relevantMetrics = history.filter(metric => 
      metric.timeRange.start >= timeRange.start && 
      metric.timeRange.end <= timeRange.end
    )

    if (relevantMetrics.length === 0) {
      return {
        totalCost: 0,
        requestCount: 0,
        averageCostPerRequest: 0,
        tokenUsage: { input: 0, output: 0, total: 0 },
        modelUsage: {},
        timeRange
      }
    }

    const totalCost = relevantMetrics.reduce((sum, metric) => sum + metric.totalCost, 0)
    const totalRequests = relevantMetrics.reduce((sum, metric) => sum + metric.requestCount, 0)
    const totalTokens = relevantMetrics.reduce((sum, metric) => sum + metric.tokenUsage.total, 0)
    const inputTokens = relevantMetrics.reduce((sum, metric) => sum + metric.tokenUsage.input, 0)
    const outputTokens = relevantMetrics.reduce((sum, metric) => sum + metric.tokenUsage.output, 0)
    
    const modelUsage: Record<string, number> = {}
    relevantMetrics.forEach(metric => {
      Object.entries(metric.modelUsage).forEach(([model, count]) => {
        modelUsage[model] = (modelUsage[model] || 0) + count
      })
    })

    return {
      totalCost,
      requestCount: totalRequests,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens
      },
      modelUsage,
      timeRange
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(userId?: string): Promise<OptimizationStrategy[]> {
    const metrics = this.getCostMetrics({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    }, userId)

    const strategies: OptimizationStrategy[] = []

    // Analyze usage patterns and suggest optimizations
    
    // 1. Model Selection Optimization
    if (metrics.modelUsage['gpt-4'] > 0 && metrics.averageCostPerRequest > 0.05) {
      strategies.push({
        id: 'model_downgrade',
        name: 'Consider Using More Cost-Effective Models',
        description: 'Switch to GPT-3.5-turbo or Claude-3-haiku for routine tasks',
        expectedSavings: metrics.totalCost * 0.3,
        implementation: 'gradual',
        impact: 'medium'
      })
    }

    // 2. Caching Optimization
    const duplicateRequests = this.identifyDuplicateRequests(userId)
    if (duplicateRequests > metrics.requestCount * 0.1) {
      strategies.push({
        id: 'improve_caching',
        name: 'Improve Response Caching',
        description: 'Implement semantic caching to reduce duplicate AI requests',
        expectedSavings: metrics.totalCost * 0.2,
        implementation: 'immediate',
        impact: 'high'
      })
    }

    // 3. Prompt Optimization
    if (metrics.tokenUsage.input > metrics.tokenUsage.output * 2) {
      strategies.push({
        id: 'optimize_prompts',
        name: 'Optimize Prompt Length',
        description: 'Reduce input token usage by optimizing prompt templates',
        expectedSavings: metrics.totalCost * 0.15,
        implementation: 'manual',
        impact: 'medium'
      })
    }

    // 4. Batch Processing
    if (metrics.requestCount > 1000 && metrics.averageCostPerRequest < 0.01) {
      strategies.push({
        id: 'batch_processing',
        name: 'Implement Batch Processing',
        description: 'Group similar requests for more efficient processing',
        expectedSavings: metrics.totalCost * 0.1,
        implementation: 'gradual',
        impact: 'low'
      })
    }

    return strategies.sort((a, b) => b.expectedSavings - a.expectedSavings)
  }

  /**
   * Set budget limits
   */
  setBudgetLimit(limit: number, userId?: string): void {
    const key = userId ? `user_${userId}` : 'global'
    this.budgetLimits.set(key, limit)
  }

  /**
   * Check for cost alerts
   */
  private async checkCostAlerts(key: string, currentCost: number, operation: string): Promise<void> {
    const budget = this.budgetLimits.get(key)
    if (!budget) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dailyCost = this.getCostMetrics({
      start: today,
      end: new Date()
    }, key.startsWith('user_') ? key.substring(5) : undefined)

    // Budget exceeded alert
    if (dailyCost.totalCost > budget) {
      this.alerts.push({
        id: `budget_exceeded_${Date.now()}`,
        type: 'budget_exceeded',
        severity: 'critical',
        message: `Daily budget of $${budget} exceeded. Current cost: $${dailyCost.totalCost.toFixed(2)}`,
        suggestedActions: [
          'Review recent AI requests',
          'Implement request throttling',
          'Switch to lower-cost models'
        ],
        timestamp: new Date()
      })
    }

    // Unusual spike detection
    const avgCost = this.calculateAverageDailyCost(key)
    if (dailyCost.totalCost > avgCost * 2) {
      this.alerts.push({
        id: `cost_spike_${Date.now()}`,
        type: 'unusual_spike',
        severity: 'high',
        message: `Unusual cost spike detected. Today's cost (${dailyCost.totalCost.toFixed(2)}) is ${Math.round((dailyCost.totalCost / avgCost) * 100)}% of average`,
        suggestedActions: [
          'Investigate high-cost operations',
          'Check for request loops or errors',
          'Review caching effectiveness'
        ],
        timestamp: new Date()
      })
    }
  }

  /**
   * Calculate average daily cost
   */
  private calculateAverageDailyCost(key: string): number {
    const history = this.costHistory.get(key) || []
    if (history.length === 0) return 0

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentHistory = history.filter(metric => metric.timeRange.start >= thirtyDaysAgo)
    
    if (recentHistory.length === 0) return 0

    const totalCost = recentHistory.reduce((sum, metric) => sum + metric.totalCost, 0)
    const days = Math.max(1, Math.ceil(recentHistory.length / 10)) // Estimate days
    
    return totalCost / days
  }

  /**
   * Identify duplicate requests
   */
  private identifyDuplicateRequests(userId?: string): number {
    const key = userId ? `user_${userId}` : 'global'
    const history = this.costHistory.get(key) || []
    
    // Simple duplicate detection based on patterns
    // In a real implementation, this would be more sophisticated
    return Math.floor(history.length * 0.05) // Estimate 5% duplicates
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): CostAlert[] {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return this.alerts.filter(alert => alert.timestamp >= oneDayAgo)
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    // Rules for different optimization strategies
    this.optimizationRules.set('model_selection', (context) => {
      // Return model selection optimizations based on context
      return []
    })
    
    this.optimizationRules.set('caching', (context) => {
      // Return caching optimizations based on context
      return []
    })
  }

  /**
   * Setup budget monitoring
   */
  private setupBudgetMonitoring(): void {
    // Set up periodic budget checks
    setInterval(() => {
      this.performBudgetCheck()
    }, 60 * 60 * 1000) // Check every hour
  }

  /**
   * Perform periodic budget check
   */
  private performBudgetCheck(): void {
    this.budgetLimits.forEach((limit, key) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const dailyCost = this.getCostMetrics({
        start: today,
        end: new Date()
      }, key.startsWith('user_') ? key.substring(5) : undefined)

      if (dailyCost.totalCost >= limit * 0.8) { // 80% of budget
        this.alerts.push({
          id: `budget_warning_${Date.now()}`,
          type: 'budget_exceeded',
          severity: 'medium',
          message: `Approaching daily budget limit. Current: $${dailyCost.totalCost.toFixed(2)} / $${limit}`,
          suggestedActions: ['Monitor usage closely', 'Consider cost optimizations'],
          timestamp: new Date()
        })
      }
    })
  }

  /**
   * Generate cost report
   */
  generateCostReport(
    timeRange: { start: Date; end: Date },
    userId?: string
  ): {
    summary: CostMetrics
    trends: { date: string; cost: number }[]
    topModels: { model: string; cost: number; usage: number }[]
    optimizations: OptimizationStrategy[]
  } {
    const summary = this.getCostMetrics(timeRange, userId)
    
    // Generate daily trends
    const trends: { date: string; cost: number }[] = []
    const currentDate = new Date(timeRange.start)
    
    while (currentDate <= timeRange.end) {
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayCost = this.getCostMetrics({
        start: new Date(currentDate),
        end: dayEnd
      }, userId)
      
      trends.push({
        date: currentDate.toISOString().split('T')[0],
        cost: dayCost.totalCost
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Calculate top models by cost
    const topModels = Object.entries(summary.modelUsage).map(([model, usage]) => {
      const modelCost = (summary.totalCost / summary.requestCount) * usage
      return { model, cost: modelCost, usage }
    }).sort((a, b) => b.cost - a.cost)

    return {
      summary,
      trends,
      topModels,
      optimizations: [] // Would be populated with relevant optimizations
    }
  }
}

export const costOptimizer = CostOptimizer.getInstance()
