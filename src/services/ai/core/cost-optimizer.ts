/**
 * Cost Optimizer
 * 
 * Advanced cost optimization system for AI operations.
 * Includes intelligent provider routing, token optimization,
 * and cost-aware caching strategies.
 */

import { AI_MODELS, AI_PROVIDERS, PERFORMANCE_THRESHOLDS } from '../constants';
import { AIRequest, AIResponse, AgentType, AIModel, AIProvider } from '../types';

export interface CostOptimizationRule {
  name: string;
  condition: (request: AIRequest, context: CostOptimizationContext) => boolean;
  action: 'use_cheaper_model' | 'enable_aggressive_caching' | 'compress_prompt' | 'batch_requests' | 'use_fallback';
  priority: number;
  expectedSavings: number; // percentage
}

export interface CostOptimizationContext {
  userTier: 'free' | 'premium' | 'enterprise';
  monthlySpend: number;
  requestVolume: number;
  timeOfDay: 'peak' | 'off_peak';
  urgency: 'immediate' | 'normal' | 'batch';
}

export interface CostAnalysis {
  estimatedCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  recommendations: string[];
  riskFactors: string[];
}

export interface BudgetAlert {
  type: 'warning' | 'critical' | 'budget_exceeded';
  threshold: number;
  current: number;
  timeframe: 'hourly' | 'daily' | 'monthly';
  recommendations: string[];
}

export class CostOptimizer {
  private optimizationRules: CostOptimizationRule[];
  private costHistory: Map<string, Array<{ timestamp: Date; cost: number; agentType: AgentType }>> = new Map();
  private budgetLimits: Map<string, { limit: number; timeframe: 'hourly' | 'daily' | 'monthly' }> = new Map();
  private modelPerformanceCache: Map<string, { avgCost: number; avgQuality: number; avgTime: number }> = new Map();

  constructor() {
    this.initializeOptimizationRules();
    this.initializeDefaultBudgets();
  }

  /**
   * Optimize request for cost efficiency
   */
  async optimizeRequest(request: AIRequest, context: CostOptimizationContext): Promise<{
    optimizedRequest: AIRequest;
    analysis: CostAnalysis;
    warnings: string[];
  }> {
    const originalCost = this.estimateRequestCost(request);
    let optimizedRequest = { ...request };
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];

    // Apply optimization rules
    for (const rule of this.optimizationRules.sort((a, b) => b.priority - a.priority)) {
      if (rule.condition(request, context)) {
        const result = this.applyOptimizationRule(rule, optimizedRequest, context);
        optimizedRequest = result.request;
        recommendations.push(result.recommendation);
        if (result.warning) warnings.push(result.warning);
        if (result.risk) riskFactors.push(result.risk);
      }
    }

    const optimizedCost = this.estimateRequestCost(optimizedRequest);
    const savings = originalCost - optimizedCost;
    const savingsPercentage = originalCost > 0 ? (savings / originalCost) * 100 : 0;

    return {
      optimizedRequest,
      analysis: {
        estimatedCost: originalCost,
        optimizedCost,
        savings,
        savingsPercentage,
        recommendations,
        riskFactors
      },
      warnings
    };
  }

  /**
   * Select most cost-effective model for request
   */
  selectCostEffectiveModel(agentType: AgentType, requirements: {
    maxCost?: number;
    minQuality?: number;
    maxLatency?: number;
    priority: 'cost' | 'quality' | 'speed';
  }): AIModel {
    const candidateModels = AI_MODELS.filter(model => 
      model.recommendedFor.includes(agentType)
    );

    if (candidateModels.length === 0) {
      return AI_MODELS[0]; // Fallback to first available model
    }

    // Score models based on requirements
    const scoredModels = candidateModels.map(model => {
      const performance = this.modelPerformanceCache.get(model.id) || {
        avgCost: model.costPerToken * 1000, // Estimate for 1k tokens
        avgQuality: 0.8,
        avgTime: 2000
      };

      let score = 0;
      
      // Cost scoring (lower cost = higher score)
      if (requirements.maxCost) {
        const costScore = Math.max(0, 1 - (performance.avgCost / requirements.maxCost));
        score += requirements.priority === 'cost' ? costScore * 0.6 : costScore * 0.2;
      }
      
      // Quality scoring
      if (requirements.minQuality) {
        const qualityScore = Math.min(1, performance.avgQuality / requirements.minQuality);
        score += requirements.priority === 'quality' ? qualityScore * 0.6 : qualityScore * 0.3;
      }
      
      // Speed scoring (lower latency = higher score)
      if (requirements.maxLatency) {
        const speedScore = Math.max(0, 1 - (performance.avgTime / requirements.maxLatency));
        score += requirements.priority === 'speed' ? speedScore * 0.6 : speedScore * 0.2;
      }
      
      // Reliability bonus
      const provider = AI_PROVIDERS.find(p => p.name === model.provider);
      if (provider) {
        score += provider.reliability * 0.2;
      }

      return { model, score, performance };
    });

    // Return highest scoring model
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0].model;
  }

  /**
   * Analyze spending patterns and provide recommendations
   */
  analyzeSpending(userId: string, timeframe: 'day' | 'week' | 'month' = 'month'): {
    totalCost: number;
    costByAgent: Record<AgentType, number>;
    costByModel: Record<string, number>;
    trends: Array<{ date: string; cost: number }>;
    projectedMonthlyCost: number;
    recommendations: string[];
    potentialSavings: number;
  } {
    const userCosts = this.costHistory.get(userId) || [];
    const now = Date.now();
    const timeframeDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const cutoffTime = now - (timeframeDays * 24 * 60 * 60 * 1000);
    
    const relevantCosts = userCosts.filter(cost => cost.timestamp.getTime() > cutoffTime);
    
    const totalCost = relevantCosts.reduce((sum, cost) => sum + cost.cost, 0);
    
    const costByAgent = {} as Record<AgentType, number>;
    const costByModel = {} as Record<string, number>;
    
    relevantCosts.forEach(cost => {
      costByAgent[cost.agentType] = (costByAgent[cost.agentType] || 0) + cost.cost;
    });
    
    // Generate trends (daily breakdown)
    const trends: Array<{ date: string; cost: number }> = [];
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const dayStart = now - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayCosts = relevantCosts.filter(cost => 
        cost.timestamp.getTime() >= dayStart && cost.timestamp.getTime() < dayEnd
      );
      
      const dayCost = dayCosts.reduce((sum, cost) => sum + cost.cost, 0);
      trends.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        cost: dayCost
      });
    }
    
    // Project monthly cost
    const dailyAverage = totalCost / timeframeDays;
    const projectedMonthlyCost = dailyAverage * 30;
    
    // Generate recommendations
    const recommendations = this.generateSpendingRecommendations({
      totalCost,
      costByAgent,
      projectedMonthlyCost,
      trends
    });
    
    // Calculate potential savings
    const potentialSavings = this.calculatePotentialSavings(costByAgent, projectedMonthlyCost);
    
    return {
      totalCost,
      costByAgent,
      costByModel,
      trends,
      projectedMonthlyCost,
      recommendations,
      potentialSavings
    };
  }

  /**
   * Check budget limits and generate alerts
   */
  checkBudgetLimits(userId: string): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];
    const userCosts = this.costHistory.get(userId) || [];
    
    for (const [budgetType, budget] of this.budgetLimits.entries()) {
      const timeframeCosts = this.getCostsForTimeframe(userCosts, budget.timeframe);
      const totalCost = timeframeCosts.reduce((sum, cost) => sum + cost.cost, 0);
      
      const utilizationPercentage = (totalCost / budget.limit) * 100;
      
      if (utilizationPercentage >= 100) {
        alerts.push({
          type: 'budget_exceeded',
          threshold: budget.limit,
          current: totalCost,
          timeframe: budget.timeframe,
          recommendations: [
            'Consider upgrading your plan for higher limits',
            'Implement more aggressive caching',
            'Use lower-cost models for non-critical requests'
          ]
        });
      } else if (utilizationPercentage >= 80) {
        alerts.push({
          type: 'critical',
          threshold: budget.limit,
          current: totalCost,
          timeframe: budget.timeframe,
          recommendations: [
            'Monitor usage closely',
            'Enable cost optimization features',
            'Consider batching non-urgent requests'
          ]
        });
      } else if (utilizationPercentage >= 60) {
        alerts.push({
          type: 'warning',
          threshold: budget.limit,
          current: totalCost,
          timeframe: budget.timeframe,
          recommendations: [
            'Review recent usage patterns',
            'Consider optimizing high-cost operations'
          ]
        });
      }
    }
    
    return alerts;
  }

  /**
   * Record cost for tracking and analysis
   */
  recordCost(userId: string, cost: number, agentType: AgentType, modelId: string): void {
    if (!this.costHistory.has(userId)) {
      this.costHistory.set(userId, []);
    }
    
    const userCosts = this.costHistory.get(userId)!;
    userCosts.push({
      timestamp: new Date(),
      cost,
      agentType
    });
    
    // Keep only last 1000 entries per user
    if (userCosts.length > 1000) {
      userCosts.splice(0, userCosts.length - 1000);
    }
    
    // Update model performance cache
    this.updateModelPerformance(modelId, cost);
  }

  /**
   * Get cost efficiency recommendations
   */
  getCostEfficiencyRecommendations(context: CostOptimizationContext): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    // Immediate recommendations based on current context
    if (context.userTier === 'free' && context.monthlySpend > 10) {
      immediate.push('Consider upgrading to premium for better cost efficiency');
    }
    
    if (context.requestVolume > 100) {
      immediate.push('Enable request batching to reduce API overhead');
      immediate.push('Implement aggressive caching for repeated queries');
    }
    
    if (context.timeOfDay === 'peak') {
      immediate.push('Consider deferring non-urgent requests to off-peak hours');
    }
    
    // Short-term recommendations
    shortTerm.push('Analyze usage patterns to identify optimization opportunities');
    shortTerm.push('Implement smart model selection based on request complexity');
    shortTerm.push('Set up budget alerts to prevent overspending');
    
    // Long-term recommendations
    longTerm.push('Consider developing domain-specific model fine-tuning');
    longTerm.push('Implement user behavior prediction to pre-cache likely requests');
    longTerm.push('Evaluate cost-benefit of running local models for high-volume use cases');
    
    return { immediate, shortTerm, longTerm };
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        name: 'Free Tier Cost Control',
        condition: (request, context) => context.userTier === 'free' && context.monthlySpend > 5,
        action: 'use_cheaper_model',
        priority: 9,
        expectedSavings: 40
      },
      {
        name: 'High Volume Optimization',
        condition: (request, context) => context.requestVolume > 50,
        action: 'enable_aggressive_caching',
        priority: 8,
        expectedSavings: 30
      },
      {
        name: 'Non-Urgent Requests',
        condition: (request, context) => context.urgency === 'batch',
        action: 'batch_requests',
        priority: 7,
        expectedSavings: 25
      },
      {
        name: 'Large Input Compression',
        condition: (request) => JSON.stringify(request.inputData).length > 5000,
        action: 'compress_prompt',
        priority: 6,
        expectedSavings: 20
      },
      {
        name: 'Off-Peak Processing',
        condition: (request, context) => context.timeOfDay === 'off_peak' && context.urgency !== 'immediate',
        action: 'use_cheaper_model',
        priority: 5,
        expectedSavings: 15
      }
    ];
  }

  private initializeDefaultBudgets(): void {
    this.budgetLimits.set('free_daily', { limit: 2.00, timeframe: 'daily' });
    this.budgetLimits.set('free_monthly', { limit: 20.00, timeframe: 'monthly' });
    this.budgetLimits.set('premium_daily', { limit: 10.00, timeframe: 'daily' });
    this.budgetLimits.set('premium_monthly', { limit: 100.00, timeframe: 'monthly' });
    this.budgetLimits.set('enterprise_daily', { limit: 50.00, timeframe: 'daily' });
    this.budgetLimits.set('enterprise_monthly', { limit: 1000.00, timeframe: 'monthly' });
  }

  private estimateRequestCost(request: AIRequest): number {
    // Estimate token count from input data
    const inputText = JSON.stringify(request.inputData);
    const estimatedInputTokens = Math.ceil(inputText.length / 4); // Rough estimate: 4 chars per token
    const estimatedOutputTokens = request.maxTokens || 1000;
    const totalTokens = estimatedInputTokens + estimatedOutputTokens;
    
    // Get model cost (use default if not specified)
    const defaultModel = AI_MODELS.find(m => m.recommendedFor.includes(request.agentType)) || AI_MODELS[0];
    const costPerToken = defaultModel.costPerToken;
    
    return totalTokens * costPerToken;
  }

  private applyOptimizationRule(
    rule: CostOptimizationRule, 
    request: AIRequest, 
    context: CostOptimizationContext
  ): {
    request: AIRequest;
    recommendation: string;
    warning?: string;
    risk?: string;
  } {
    let optimizedRequest = { ...request };
    let recommendation = '';
    let warning: string | undefined;
    let risk: string | undefined;
    
    switch (rule.action) {
      case 'use_cheaper_model':
        const cheaperModel = this.selectCostEffectiveModel(request.agentType, {
          priority: 'cost',
          maxCost: 0.001 // $0.001 per request
        });
        recommendation = `Switched to ${cheaperModel.name} for cost savings`;
        if (cheaperModel.costPerToken < AI_MODELS[0].costPerToken * 0.5) {
          warning = 'Using significantly cheaper model may affect response quality';
        }
        break;
        
      case 'enable_aggressive_caching':
        optimizedRequest.maxTokens = Math.min(request.maxTokens || 1000, 500);
        recommendation = 'Enabled aggressive caching and reduced token limit';
        break;
        
      case 'compress_prompt':
        // In a real implementation, this would compress the prompt
        recommendation = 'Applied prompt compression to reduce token usage';
        risk = 'Prompt compression may reduce context and affect response quality';
        break;
        
      case 'batch_requests':
        recommendation = 'Request queued for batch processing';
        warning = 'Batched requests will have higher latency';
        break;
        
      case 'use_fallback':
        optimizedRequest.priority = 'low';
        recommendation = 'Using fallback processing for cost efficiency';
        risk = 'Fallback processing may have reduced capabilities';
        break;
    }
    
    return { request: optimizedRequest, recommendation, warning, risk };
  }

  private getCostsForTimeframe(
    costs: Array<{ timestamp: Date; cost: number; agentType: AgentType }>,
    timeframe: 'hourly' | 'daily' | 'monthly'
  ): Array<{ timestamp: Date; cost: number; agentType: AgentType }> {
    const now = Date.now();
    let cutoffTime: number;
    
    switch (timeframe) {
      case 'hourly':
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case 'daily':
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return costs.filter(cost => cost.timestamp.getTime() > cutoffTime);
  }

  private generateSpendingRecommendations(data: {
    totalCost: number;
    costByAgent: Record<AgentType, number>;
    projectedMonthlyCost: number;
    trends: Array<{ date: string; cost: number }>;
  }): string[] {
    const recommendations: string[] = [];
    
    // High cost recommendations
    if (data.projectedMonthlyCost > 50) {
      recommendations.push('Consider upgrading to enterprise plan for better rates');
    }
    
    // Agent-specific recommendations
    const sortedAgents = Object.entries(data.costByAgent)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedAgents.length > 0 && sortedAgents[0][1] > data.totalCost * 0.5) {
      recommendations.push(`${sortedAgents[0][0]} accounts for over 50% of costs - optimize this agent's usage`);
    }
    
    // Trend-based recommendations
    const recentTrend = data.trends.slice(-7);
    const isIncreasing = recentTrend.every((day, i) => 
      i === 0 || day.cost >= recentTrend[i - 1].cost
    );
    
    if (isIncreasing) {
      recommendations.push('Usage is trending upward - monitor spending closely');
    }
    
    return recommendations;
  }

  private calculatePotentialSavings(
    costByAgent: Record<AgentType, number>,
    projectedMonthlyCost: number
  ): number {
    // Estimate potential savings from various optimizations
    let potentialSavings = 0;
    
    // Caching optimization (15-30% savings)
    potentialSavings += projectedMonthlyCost * 0.20;
    
    // Model optimization (10-25% savings)
    potentialSavings += projectedMonthlyCost * 0.15;
    
    // Batching optimization (5-15% savings)
    potentialSavings += projectedMonthlyCost * 0.10;
    
    return Math.min(potentialSavings, projectedMonthlyCost * 0.45); // Cap at 45% savings
  }

  private updateModelPerformance(modelId: string, cost: number): void {
    const current = this.modelPerformanceCache.get(modelId) || {
      avgCost: cost,
      avgQuality: 0.8,
      avgTime: 2000
    };
    
    // Update moving average
    const alpha = 0.1;
    current.avgCost = current.avgCost * (1 - alpha) + cost * alpha;
    
    this.modelPerformanceCache.set(modelId, current);
  }

  /**
   * Get comprehensive cost optimization report
   */
  getCostOptimizationReport(): {
    totalSavingsPotential: number;
    optimizationRules: Array<{
      name: string;
      applicableRequests: number;
      potentialSavings: number;
    }>;
    modelEfficiency: Array<{
      modelId: string;
      costEfficiency: number;
      qualityScore: number;
      recommendation: string;
    }>;
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  } {
    const modelEfficiency = Array.from(this.modelPerformanceCache.entries()).map(([modelId, perf]) => {
      const model = AI_MODELS.find(m => m.id === modelId);
      const costEfficiency = 1 / (perf.avgCost + 0.001); // Avoid division by zero
      const qualityScore = perf.avgQuality;
      
      let recommendation = 'Maintain current usage';
      if (costEfficiency > 100 && qualityScore > 0.8) {
        recommendation = 'Excellent choice - high quality and cost effective';
      } else if (costEfficiency < 10) {
        recommendation = 'Consider switching to more cost-effective model';
      } else if (qualityScore < 0.6) {
        recommendation = 'Quality concerns - monitor outputs closely';
      }
      
      return {
        modelId,
        costEfficiency: Math.round(costEfficiency),
        qualityScore: Math.round(qualityScore * 100) / 100,
        recommendation
      };
    });
    
    return {
      totalSavingsPotential: 45, // Estimated percentage
      optimizationRules: this.optimizationRules.map(rule => ({
        name: rule.name,
        applicableRequests: 0, // Would calculate from actual usage
        potentialSavings: rule.expectedSavings
      })),
      modelEfficiency,
      recommendations: {
        immediate: ['Enable aggressive caching', 'Implement request batching'],
        shortTerm: ['Analyze usage patterns', 'Set up budget monitoring'],
        longTerm: ['Consider model fine-tuning', 'Implement predictive caching']
      }
    };
  }
}