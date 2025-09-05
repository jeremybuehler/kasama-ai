/**
 * AI Provider Manager
 * 
 * Handles multi-provider AI integration with intelligent routing, fallback,
 * and cost optimization for Claude and OpenAI providers.
 */

import { AI_PROVIDERS, AI_MODELS, AGENT_CONFIGS, ERROR_CODES, API_CONFIG } from '../constants';
import { 
  AIProvider, 
  AIModel, 
  AIRequest, 
  AIResponse, 
  AgentType, 
  AIError,
  RetryConfig 
} from '../types';
import { ErrorHandler } from './error-handler';
import { RateLimiter } from './rate-limiter';

export interface ProviderResponse {
  content: string;
  tokensUsed: number;
  model: string;
  provider: string;
  processingTime: number;
  cost: number;
}

export interface ProviderRequest {
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  context?: string[];
}

export class ProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private models: Map<string, AIModel> = new Map();
  private errorHandler: ErrorHandler;
  private rateLimiter: RateLimiter;
  private providerHealthStatus: Map<string, { healthy: boolean; lastChecked: Date; latency: number }> = new Map();
  
  constructor() {
    this.errorHandler = new ErrorHandler();
    this.rateLimiter = new RateLimiter();
    this.initializeProviders();
    this.startHealthMonitoring();
  }

  private initializeProviders(): void {
    // Register providers
    AI_PROVIDERS.forEach(provider => {
      this.providers.set(provider.name, provider);
      this.providerHealthStatus.set(provider.name, {
        healthy: true,
        lastChecked: new Date(),
        latency: provider.latencyMs
      });
    });

    // Register models
    AI_MODELS.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  /**
   * Route request to optimal provider based on agent type and current conditions
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const config = AGENT_CONFIGS[request.agentType];
    
    // Check rate limiting
    const rateLimitResult = await this.rateLimiter.checkLimit(request);
    if (rateLimitResult.limited) {
      throw this.createError('RATE_LIMIT_EXCEEDED', `Rate limit exceeded. Reset at: ${rateLimitResult.resetTime}`);
    }

    // Determine optimal model and provider
    const selectedModel = this.selectOptimalModel(request.agentType, request.priority);
    const provider = this.providers.get(selectedModel.provider);
    
    if (!provider) {
      throw this.createError('PROVIDER_UNAVAILABLE', `Provider ${selectedModel.provider} not available`);
    }

    // Check provider health
    const health = this.providerHealthStatus.get(selectedModel.provider);
    if (!health?.healthy) {
      // Try fallback model
      const fallbackModel = this.getFallbackModel(request.agentType);
      if (fallbackModel) {
        return this.processRequestWithModel(request, fallbackModel, startTime);
      }
      throw this.createError('PROVIDER_UNAVAILABLE', `All providers for ${request.agentType} are unavailable`);
    }

    return this.processRequestWithModel(request, selectedModel, startTime);
  }

  private async processRequestWithModel(request: AIRequest, model: AIModel, startTime: number): Promise<AIResponse> {
    const config = AGENT_CONFIGS[request.agentType];
    
    try {
      // Build the provider request
      const providerRequest: ProviderRequest = {
        prompt: this.buildPrompt(request),
        model: model.id,
        maxTokens: Math.min(request.maxTokens || config.maxTokens, model.maxTokens),
        temperature: config.temperature,
        systemPrompt: this.buildSystemPrompt(request.agentType),
        context: request.context?.conversationHistory?.map(msg => `${msg.role}: ${msg.content}`)
      };

      // Call the appropriate provider
      const response = await this.callProvider(model.provider, providerRequest);
      
      // Calculate metrics
      const processingTime = Date.now() - startTime;
      const cost = response.tokensUsed * model.costPerToken;

      return {
        id: request.id,
        output: this.parseProviderResponse(response, request.agentType),
        tokensUsed: response.tokensUsed,
        processingTime,
        costCents: Math.round(cost * 100),
        cacheHit: false,
        confidence: this.calculateConfidence(response, model),
        provider: model.provider,
        model: model.id
      };

    } catch (error) {
      // Update provider health status
      this.updateProviderHealth(model.provider, false);
      
      // Handle retries with exponential backoff
      if (this.shouldRetry(error, config.retryConfig)) {
        const fallbackModel = this.getFallbackModel(request.agentType);
        if (fallbackModel && fallbackModel.id !== model.id) {
          console.warn(`Retrying with fallback model: ${fallbackModel.id}`);
          return this.processRequestWithModel(request, fallbackModel, startTime);
        }
      }

      throw this.errorHandler.handleError(error, {
        agentType: request.agentType,
        provider: model.provider,
        model: model.id
      });
    }
  }

  private selectOptimalModel(agentType: AgentType, priority: string): AIModel {
    const config = AGENT_CONFIGS[agentType];
    
    // Get primary model
    let selectedModel = this.models.get(config.defaultModel);
    
    if (!selectedModel) {
      // Fallback to any model recommended for this agent type
      selectedModel = AI_MODELS.find(model => 
        model.recommendedFor.includes(agentType)
      );
    }

    if (!selectedModel) {
      // Last resort: use the first available model
      selectedModel = AI_MODELS[0];
    }

    // Validate provider health
    const health = this.providerHealthStatus.get(selectedModel.provider);
    if (!health?.healthy) {
      const fallbackModel = this.getFallbackModel(agentType);
      if (fallbackModel) {
        selectedModel = fallbackModel;
      }
    }

    return selectedModel;
  }

  private getFallbackModel(agentType: AgentType): AIModel | null {
    const config = AGENT_CONFIGS[agentType];
    const fallbackModel = this.models.get(config.fallbackModel);
    
    if (fallbackModel) {
      const health = this.providerHealthStatus.get(fallbackModel.provider);
      if (health?.healthy) {
        return fallbackModel;
      }
    }

    // Find any healthy model for this agent type
    for (const model of AI_MODELS) {
      if (model.recommendedFor.includes(agentType)) {
        const health = this.providerHealthStatus.get(model.provider);
        if (health?.healthy) {
          return model;
        }
      }
    }

    return null;
  }

  private async callProvider(providerName: string, request: ProviderRequest): Promise<ProviderResponse> {
    const startTime = Date.now();
    
    try {
      switch (providerName) {
        case 'claude':
          return await this.callClaudeAPI(request);
        case 'openai':
          return await this.callOpenAIAPI(request);
        case 'local':
          return await this.callLocalAPI(request);
        default:
          throw new Error(`Unknown provider: ${providerName}`);
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateProviderLatency(providerName, processingTime);
      throw error;
    }
  }

  private async callClaudeAPI(request: ProviderRequest): Promise<ProviderResponse> {
    const startTime = Date.now();
    
    // In development, return mock response
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_CLAUDE_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // Mock latency
      
      return {
        content: this.generateMockResponse(request.prompt),
        tokensUsed: Math.floor(Math.random() * 500) + 100,
        model: request.model,
        provider: 'claude',
        processingTime: Date.now() - startTime,
        cost: (Math.floor(Math.random() * 500) + 100) * 0.000003
      };
    }

    // Production Claude API call
    const response = await fetch(`${API_CONFIG.claude.baseUrl}/${API_CONFIG.claude.version}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ],
        system: request.systemPrompt
      }),
      signal: AbortSignal.timeout(API_CONFIG.claude.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0]?.text || '',
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      model: request.model,
      provider: 'claude',
      processingTime: Date.now() - startTime,
      cost: (data.usage?.input_tokens + data.usage?.output_tokens) * 0.000003
    };
  }

  private async callOpenAIAPI(request: ProviderRequest): Promise<ProviderResponse> {
    const startTime = Date.now();
    
    // In development, return mock response
    if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_OPENAI_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300)); // Mock latency
      
      return {
        content: this.generateMockResponse(request.prompt),
        tokensUsed: Math.floor(Math.random() * 400) + 80,
        model: request.model,
        provider: 'openai',
        processingTime: Date.now() - startTime,
        cost: (Math.floor(Math.random() * 400) + 80) * 0.0000025
      };
    }

    // Production OpenAI API call
    const messages = [];
    
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    if (request.context) {
      request.context.forEach(contextMsg => {
        const [role, content] = contextMsg.split(': ', 2);
        messages.push({ role: role === 'user' ? 'user' : 'assistant', content });
      });
    }
    
    messages.push({ role: 'user', content: request.prompt });

    const response = await fetch(`${API_CONFIG.openai.baseUrl}/${API_CONFIG.openai.version}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature
      }),
      signal: AbortSignal.timeout(API_CONFIG.openai.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
      model: request.model,
      provider: 'openai',
      processingTime: Date.now() - startTime,
      cost: data.usage?.total_tokens * 0.0000025
    };
  }

  private async callLocalAPI(request: ProviderRequest): Promise<ProviderResponse> {
    const startTime = Date.now();
    
    // Mock local model response
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)); // Mock higher latency
    
    return {
      content: this.generateMockResponse(request.prompt),
      tokensUsed: Math.floor(Math.random() * 300) + 50,
      model: 'local-model',
      provider: 'local',
      processingTime: Date.now() - startTime,
      cost: 0 // Free local inference
    };
  }

  private generateMockResponse(prompt: string): string {
    // Generate contextual mock responses based on the prompt
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('assessment') || promptLower.includes('score')) {
      return JSON.stringify({
        score: Math.floor(Math.random() * 40) + 60, // 60-100 range
        insights: [
          'Strong communication foundation detected',
          'Opportunity for growth in emotional regulation',
          'Excellent self-awareness indicators'
        ],
        recommendations: [
          'Practice active listening exercises',
          'Consider mindfulness training',
          'Engage in regular reflection'
        ],
        strengths: ['Communication', 'Self-reflection', 'Empathy'],
        growthAreas: ['Conflict resolution', 'Boundary setting']
      });
    }
    
    if (promptLower.includes('learning') || promptLower.includes('curriculum')) {
      return JSON.stringify({
        pathName: 'Communication Mastery',
        description: 'A personalized learning journey to enhance your communication skills',
        modules: [
          {
            title: 'Active Listening Fundamentals',
            estimatedTime: 45,
            practices: ['Daily listening exercise', 'Reflection journaling']
          },
          {
            title: 'Emotional Intelligence Development',
            estimatedTime: 60,
            practices: ['Emotion naming practice', 'Empathy building exercises']
          }
        ],
        estimatedWeeks: 4
      });
    }
    
    if (promptLower.includes('progress') || promptLower.includes('tracking')) {
      return JSON.stringify({
        currentStreak: Math.floor(Math.random() * 20) + 5,
        improvementRate: `+${Math.floor(Math.random() * 25) + 5}%`,
        patterns: [
          { type: 'consistency', strength: 0.8, description: 'Maintaining regular practice' },
          { type: 'growth', strength: 0.7, description: 'Steady improvement in communication skills' }
        ],
        nextMilestones: ['Complete 30-day streak', 'Master active listening']
      });
    }
    
    if (promptLower.includes('insight') || promptLower.includes('daily')) {
      const insights = [
        'Your consistent practice is building strong relationship foundations',
        'Today is a great day to practice one new communication technique',
        'Remember that small improvements compound over time',
        'Your emotional awareness has grown significantly this week'
      ];
      
      return JSON.stringify({
        dailyInsight: insights[Math.floor(Math.random() * insights.length)],
        recommendation: 'Try the "reflection before reaction" technique in your next challenging conversation',
        motivationalMessage: 'Every conversation is an opportunity to practice what you\'ve learned',
        focusArea: 'Active Listening'
      });
    }
    
    if (promptLower.includes('conflict') || promptLower.includes('communication')) {
      return JSON.stringify({
        strategy: {
          name: 'Collaborative Problem Solving',
          steps: [
            'Listen to understand, not to respond',
            'Acknowledge the other person\'s perspective',
            'Express your own needs clearly',
            'Work together to find solutions'
          ]
        },
        techniques: [
          {
            name: 'I-statements',
            description: 'Express feelings without blame',
            example: 'I feel unheard when conversations get heated'
          }
        ],
        script: 'I understand this is important to you. Can we take a step back and make sure I understand your perspective correctly?'
      });
    }
    
    // Default response
    return 'I understand your request and am here to help you with your relationship development journey. Could you provide more specific details about what you\'d like to focus on?';
  }

  private buildPrompt(request: AIRequest): string {
    // This will be customized per agent in the actual agent implementations
    return JSON.stringify(request.inputData);
  }

  private buildSystemPrompt(agentType: AgentType): string {
    const systemPrompts = {
      assessment_analyst: `You are an expert relationship assessment analyst. Analyze user responses to provide accurate, empathetic insights about their relationship readiness, communication patterns, and growth opportunities. Always be supportive and focus on actionable improvements.`,
      
      learning_coach: `You are a personalized learning coach specializing in relationship development. Create customized learning paths that match the user's goals, current skill level, and time constraints. Focus on practical, evidence-based practices that lead to measurable improvement.`,
      
      progress_tracker: `You are a progress tracking specialist who identifies patterns in user behavior and growth. Analyze activity data to provide insights about consistency, improvement trends, and milestone achievement. Always encourage continued engagement.`,
      
      insight_generator: `You are a relationship insight generator who provides daily, personalized guidance. Create relevant, actionable insights based on user context and recent activity. Your tone should be encouraging, wise, and practical.`,
      
      communication_advisor: `You are an expert communication advisor specializing in conflict resolution and relationship skills. Provide specific, practical advice for challenging interpersonal situations. Focus on empathy, clear communication, and collaborative problem-solving.`
    };

    return systemPrompts[agentType];
  }

  private parseProviderResponse(response: ProviderResponse, agentType: AgentType): unknown {
    try {
      // Try to parse as JSON first
      return JSON.parse(response.content);
    } catch {
      // If not JSON, return as string with metadata
      return {
        content: response.content,
        agentType,
        provider: response.provider,
        model: response.model
      };
    }
  }

  private calculateConfidence(response: ProviderResponse, model: AIModel): number {
    // Base confidence on model quality and response characteristics
    let confidence = 0.8; // Base confidence
    
    // Adjust based on model quality
    const modelCapability = model.strengths.length / 4; // Normalize to 0-1
    confidence += modelCapability * 0.1;
    
    // Adjust based on response length (longer responses might indicate more thought)
    const responseLength = response.content.length;
    if (responseLength > 500) confidence += 0.05;
    if (responseLength > 1000) confidence += 0.05;
    
    // Adjust based on processing time (very fast might indicate cached/simple response)
    if (response.processingTime > 2000) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private shouldRetry(error: unknown, retryConfig: RetryConfig): boolean {
    if (error instanceof Error) {
      return retryConfig.retryableErrors.some(retryableError => 
        error.message.toLowerCase().includes(retryableError.toLowerCase())
      );
    }
    return false;
  }

  private createError(code: keyof typeof ERROR_CODES, message: string): AIError {
    return {
      code,
      message,
      retryable: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT', 'MODEL_OVERLOADED'].includes(code),
      timestamp: new Date()
    };
  }

  private updateProviderHealth(providerName: string, healthy: boolean): void {
    const status = this.providerHealthStatus.get(providerName);
    if (status) {
      status.healthy = healthy;
      status.lastChecked = new Date();
    }
  }

  private updateProviderLatency(providerName: string, latency: number): void {
    const status = this.providerHealthStatus.get(providerName);
    if (status) {
      // Exponential moving average for latency
      status.latency = status.latency * 0.7 + latency * 0.3;
    }
  }

  private startHealthMonitoring(): void {
    // Check provider health every 5 minutes
    setInterval(() => {
      this.checkProviderHealth();
    }, 5 * 60 * 1000);
  }

  private async checkProviderHealth(): Promise<void> {
    for (const [providerName, provider] of this.providers.entries()) {
      try {
        // Simple health check with minimal request
        const testRequest: ProviderRequest = {
          prompt: 'Health check',
          model: provider.models[0]?.id || 'default',
          maxTokens: 10,
          temperature: 0.1
        };

        const startTime = Date.now();
        await this.callProvider(providerName, testRequest);
        const latency = Date.now() - startTime;

        this.updateProviderHealth(providerName, true);
        this.updateProviderLatency(providerName, latency);
        
      } catch (error) {
        console.warn(`Health check failed for provider ${providerName}:`, error);
        this.updateProviderHealth(providerName, false);
      }
    }
  }

  /**
   * Get current provider status and metrics
   */
  getProviderStatus(): Record<string, unknown> {
    const status: Record<string, unknown> = {};
    
    for (const [name, health] of this.providerHealthStatus.entries()) {
      const provider = this.providers.get(name);
      status[name] = {
        healthy: health.healthy,
        lastChecked: health.lastChecked,
        latency: health.latency,
        reliability: provider?.reliability || 0,
        models: provider?.models.map(m => m.id) || []
      };
    }
    
    return status;
  }

  /**
   * Get optimal model for specific agent type
   */
  getOptimalModel(agentType: AgentType, priority: string = 'medium'): AIModel {
    return this.selectOptimalModel(agentType, priority);
  }

  /**
   * Get cost estimate for a request
   */
  estimateCost(agentType: AgentType, estimatedTokens: number): number {
    const model = this.selectOptimalModel(agentType, 'medium');
    return estimatedTokens * model.costPerToken;
  }
}