/**
 * AI System Types and Interfaces
 * Central type definitions for the AI orchestration system
 */

// ==================== CORE TYPES ====================

export type AgentType = 
  | 'assessment_analyst'
  | 'learning_coach'
  | 'progress_tracker'
  | 'insight_generator'
  | 'communication_advisor';

export type ProviderType = 'claude' | 'openai' | 'local';

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

// ==================== USER & PROFILE ====================

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'premium' | 'professional';
  preferences: {
    communicationStyle: 'supportive' | 'analytical' | 'direct' | 'formal';
    aiPersonality: 'encouraging' | 'analytical' | 'direct' | 'gentle';
    learningPace?: 'slow' | 'moderate' | 'fast';
    reminderFrequency?: 'daily' | 'weekly' | 'as_needed';
    timezone?: string;
    language?: string;
  };
  relationshipStatus?: 'single' | 'dating' | 'committed' | 'married' | 'complicated' | 'prefer_not_to_say';
  goals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AI REQUEST/RESPONSE ====================

export interface AIRequest {
  id: string;
  userId: string;
  agentType: AgentType;
  inputData: any;
  context?: any;
  priority: RequestPriority;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AIResponse {
  id: string;
  requestId: string;
  agentType: AgentType;
  data: any;
  confidence: number;
  processingTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  provider: ProviderType;
  cacheHit: boolean;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ==================== ASSESSMENT ANALYST ====================

export interface AssessmentAnalysisInput {
  assessmentType: 'relationship_health' | 'communication_style' | 'attachment_style' | 'conflict_resolution' | 'emotional_intelligence';
  responses: Record<string, any>;
  userProfile?: UserProfile;
  previousAssessments?: any[];
  analysisLevel: 'basic' | 'detailed' | 'comprehensive';
}

export interface AssessmentResult {
  overallScore: number;
  dimensionScores: Record<string, number>;
  insights: string[];
  recommendations: string[];
  growth_areas: string[];
  strengths: string[];
  actionable_steps: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    timeframe: string;
  }>;
  comparison?: {
    previousScore?: number;
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
  };
}

// ==================== LEARNING COACH ====================

export interface LearningPathInput {
  userProfile: UserProfile;
  assessmentResults: AssessmentResult[];
  currentGoals: string[];
  learningPreferences: {
    preferredFormat?: 'interactive' | 'reading' | 'video' | 'audio';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    focusAreas?: string[];
  };
  timeConstraints: {
    availableMinutesPerDay: number;
    preferredSchedule?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  };
}

export interface LearningPath {
  pathId: string;
  name: string;
  description: string;
  estimatedDuration: number; // in days
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: LearningModule[];
  personalizationScore: number;
  adaptations: string[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  practices: Practice[];
  learningObjectives: string[];
  prerequisites?: string[];
}

export interface Practice {
  id: string;
  title: string;
  description: string;
  type: 'reflection' | 'exercise' | 'conversation' | 'mindfulness' | 'journaling';
  estimatedTimeMinutes: number;
  instructions: string[];
  materials?: string[];
  successCriteria: string[];
}

// ==================== PROGRESS TRACKER ====================

export interface ProgressAnalysisInput {
  userId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  activities: Array<{
    id: string;
    type: string;
    date: Date;
    completed: boolean;
    score?: number;
    duration?: number;
    notes?: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    targetDate: Date;
    progress: number;
  }>;
  assessmentHistory?: AssessmentResult[];
}

export interface ProgressAnalysis {
  overallProgress: number;
  trends: {
    consistency: number;
    improvement: number;
    engagement: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedDate: Date;
    category: string;
  }>;
  insights: string[];
  recommendations: string[];
  nextMilestones: Array<{
    title: string;
    description: string;
    estimatedDate: Date;
    progress: number;
  }>;
  streaks: {
    current: number;
    longest: number;
    type: string;
  };
}

// ==================== INSIGHT GENERATOR ====================

export interface DailyInsightInput {
  userProfile: UserProfile;
  recentActivities: any[];
  currentGoals: string[];
  mood?: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
  availableTime?: number;
  specificSituation?: string;
}

export interface DailyInsight {
  id: string;
  title: string;
  message: string;
  category: 'motivation' | 'skill_building' | 'relationship_tip' | 'mindfulness' | 'progress_celebration';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions?: Array<{
    title: string;
    description: string;
    estimatedTimeMinutes: number;
  }>;
  relatedGoals: string[];
  personalizedElements: string[];
  validUntil?: Date;
}

// ==================== COMMUNICATION ADVISOR ====================

export interface ConflictResolutionInput {
  scenario: string;
  participants: string[];
  conflictType: 'misunderstanding' | 'values_difference' | 'behavior_issue' | 'unmet_needs' | 'boundary_violation';
  urgency: 'low' | 'medium' | 'high';
  previousAttempts?: string[];
  desiredOutcome: string;
  relationshipContext: {
    type: 'romantic' | 'family' | 'friendship' | 'professional';
    duration: string;
    dynamics: string[];
  };
}

export interface ConflictResolutionAdvice {
  approachStrategy: string;
  immediateSteps: Array<{
    step: number;
    action: string;
    rationale: string;
    expectedOutcome: string;
  }>;
  communicationTips: string[];
  phraseSuggestions: {
    opening: string[];
    clarifying: string[];
    empathy: string[];
    resolution: string[];
  };
  potentialPitfalls: string[];
  followUpActions: string[];
  successIndicators: string[];
}

// ==================== ANALYTICS & METRICS ====================

export interface AgentMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  averageConfidenceScore: number;
  cacheHitRate: number;
  costMetrics: {
    totalCost: number;
    averageCostPerRequest: number;
  };
}

export interface CostAnalytics {
  totalCost: number;
  costByAgent: Record<AgentType, number>;
  costByProvider: Record<ProviderType, number>;
  averageCostPerUser: number;
  cacheEfficiency: number;
  costTrends: Array<{
    date: Date;
    cost: number;
    requests: number;
  }>;
}

// ==================== CONTEXT ====================

export interface UserContext {
  userProfile: UserProfile;
  assessmentHistory: AssessmentResult[];
  learningPath?: LearningPath;
  progressHistory: any[];
  completedPractices: Practice[];
  currentGoals: string[];
  recentActivity: any[];
  relationshipStatus: string;
  milestones: any[];
  upcomingMilestones: any[];
}

// ==================== PROVIDER INTEGRATION ====================

export interface ProviderRequest {
  agentType: AgentType;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  context?: any;
  priority: RequestPriority;
}

export interface ProviderResponse {
  content: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  processingTime: number;
  provider: ProviderType;
  model: string;
  confidence?: number;
}

// ==================== ERROR HANDLING ====================

export interface AIError extends Error {
  code: string;
  agentType?: AgentType;
  provider?: ProviderType;
  retryable: boolean;
  context?: any;
}

// ==================== CACHING ====================

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: Date;
  ttl: number;
  hits: number;
  semanticHash: string;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: Date;
  newestEntry: Date;
}

// ==================== RATE LIMITING ====================

export interface RateLimitStatus {
  limited: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
  burstLimit: number;
}

// ==================== BATCH PROCESSING ====================

export interface BatchOptions {
  parallel: boolean;
  maxConcurrency: number;
  failFast: boolean;
  timeout?: number;
}

export interface BatchResult<T = any> {
  success: boolean;
  data?: T;
  error?: AIError;
  processingTime: number;
}

// ==================== EXPORT ALL ====================

export type {
  UserProfile,
  AIRequest,
  AIResponse,
  AssessmentAnalysisInput,
  AssessmentResult,
  LearningPathInput,
  LearningPath,
  LearningModule,
  Practice,
  ProgressAnalysisInput,
  ProgressAnalysis,
  DailyInsightInput,
  DailyInsight,
  ConflictResolutionInput,
  ConflictResolutionAdvice,
  AgentMetrics,
  CostAnalytics,
  UserContext,
  ProviderRequest,
  ProviderResponse,
  AIError,
  CacheEntry,
  CacheStats,
  RateLimitStatus,
  RateLimitConfig,
  BatchOptions,
  BatchResult
};
