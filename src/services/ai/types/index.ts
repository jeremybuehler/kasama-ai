/**
 * AI Service Type Definitions
 * Comprehensive TypeScript types for the 5-agent AI system
 */

import { Database } from '../../../lib/database.types';

export type AgentType = Database['public']['Enums']['agent_type'];

// Core AI Request/Response Types
export interface AIRequest {
  id: string;
  userId: string;
  agentType: AgentType;
  inputData: unknown;
  priority: 'low' | 'medium' | 'high';
  maxTokens?: number;
  temperature?: number;
  context?: AIContext;
  metadata?: Record<string, unknown>;
}

export interface AIResponse {
  id: string;
  output: unknown;
  tokensUsed: number;
  processingTime: number;
  costCents: number;
  cacheHit: boolean;
  confidence?: number;
  provider: 'claude' | 'openai' | 'local';
  model: string;
  error?: string;
}

export interface AIContext {
  sessionId?: string;
  conversationHistory?: ConversationMessage[];
  userProfile?: UserProfile;
  recentActivity?: ActivityRecord[];
  assessmentData?: AssessmentData;
  preferences?: UserPreferences;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentType?: AgentType;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  timezone?: string;
  preferences?: UserPreferences;
  metadata?: Record<string, unknown>;
}

export interface UserPreferences {
  communicationStyle?: 'formal' | 'casual' | 'supportive';
  notificationFrequency?: 'immediate' | 'daily' | 'weekly';
  privacyLevel?: 'open' | 'moderate' | 'private';
  learningPace?: 'slow' | 'moderate' | 'fast';
  preferredTopics?: string[];
  aiPersonality?: 'encouraging' | 'direct' | 'analytical';
}

export interface ActivityRecord {
  type: 'assessment' | 'practice' | 'goal' | 'notification';
  timestamp: Date;
  data: Record<string, unknown>;
  rating?: number;
  notes?: string;
}

export interface AssessmentData {
  id: string;
  type: string;
  score?: number;
  answers: Record<string, unknown>;
  insights?: string[];
  completedAt?: Date;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Agent-Specific Types
export interface AssessmentAnalysisInput {
  answers: Record<string, unknown>;
  assessmentType: string;
  previousAssessments?: AssessmentData[];
  userContext?: UserProfile;
}

export interface AssessmentAnalysisOutput {
  score: number;
  insights: AssessmentInsight[];
  recommendations: ActionRecommendation[];
  strengths: string[];
  growthAreas: string[];
  confidenceLevel: number;
}

export interface AssessmentInsight {
  type: 'pattern' | 'strength' | 'opportunity' | 'warning';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  evidence: string[];
}

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  actionItems: string[];
  resources?: ResourceLink[];
}

export interface ResourceLink {
  title: string;
  url: string;
  type: 'article' | 'video' | 'exercise' | 'tool';
  description?: string;
}

export interface LearningPathInput {
  userProfile: UserProfile;
  assessmentResults: AssessmentData[];
  currentGoals?: Goal[];
  learningPreferences?: LearningPreferences;
  timeConstraints?: TimeConstraints;
}

export interface LearningPathOutput {
  pathId: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDurationWeeks: number;
  modules: LearningModule[];
  prerequisites: string[];
  learningObjectives: string[];
  personalizationScore: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedTimeMinutes: number;
  practices: Practice[];
  assessments: string[];
  milestones: Milestone[];
}

export interface Practice {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeMinutes: number;
  instructions: PracticeInstruction[];
  tags: string[];
  prerequisites?: string[];
  learningObjectives: string[];
}

export interface PracticeInstruction {
  step: number;
  instruction: string;
  tips?: string[];
  examples?: string[];
  warnings?: string[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetDate?: Date;
  progress: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface LearningPreferences {
  preferredFormats: ('text' | 'video' | 'audio' | 'interactive')[];
  sessionLength: 'short' | 'medium' | 'long'; // 5-15min, 15-30min, 30+ min
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  challengeLevel: 'comfortable' | 'moderate' | 'challenging';
}

export interface TimeConstraints {
  availableMinutesPerDay: number;
  preferredTimes: ('morning' | 'afternoon' | 'evening')[];
  daysPerWeek: number;
  flexibilityLevel: 'strict' | 'flexible' | 'very_flexible';
}

export interface ProgressAnalysisInput {
  userId: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  includeComparisons?: boolean;
  focusAreas?: string[];
}

export interface ProgressAnalysisOutput {
  overallProgress: ProgressMetrics;
  patterns: ProgressPattern[];
  achievements: Achievement[];
  insights: ProgressInsight[];
  recommendations: ActionRecommendation[];
  nextMilestones: Milestone[];
}

export interface ProgressMetrics {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  averageRating: number;
  totalSessionMinutes: number;
  improvementRate: number; // % change
  consistencyScore: number; // 0-100
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface ProgressPattern {
  type: 'improvement' | 'plateau' | 'decline' | 'spike' | 'consistency';
  category: string;
  strength: number; // 0-1
  description: string;
  timeframe: string;
  confidence: number;
}

export interface Achievement {
  id: string;
  type: 'streak' | 'completion' | 'improvement' | 'milestone' | 'skill';
  title: string;
  description: string;
  earnedAt: Date;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  points?: number;
}

export interface ProgressInsight {
  type: 'celebration' | 'encouragement' | 'adjustment' | 'challenge';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
  evidence: string[];
}

export interface DailyInsightInput {
  userProfile: UserProfile;
  recentActivity: ActivityRecord[];
  currentGoals: Goal[];
  contextualFactors?: ContextualFactors;
}

export interface DailyInsightOutput {
  insight: DailyInsight;
  recommendations: DailyRecommendation[];
  motivationalMessage: string;
  focusArea: string;
  confidenceLevel: number;
}

export interface DailyInsight {
  id: string;
  type: 'pattern' | 'opportunity' | 'celebration' | 'guidance' | 'challenge';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  personalizedElements: string[];
  applicability: number; // 0-1 relevance score
}

export interface DailyRecommendation {
  id: string;
  type: 'practice' | 'reflection' | 'exercise' | 'challenge';
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  instructions: string[];
  expectedOutcome: string;
}

export interface ContextualFactors {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  recentEvents?: string[];
  moodIndicators?: ('positive' | 'neutral' | 'challenging')[];
  environmentalFactors?: string[];
}

export interface ConflictResolutionInput {
  scenario: ConflictScenario;
  userStyle?: CommunicationStyle;
  relationshipContext?: RelationshipContext;
  previousAttempts?: ResolutionAttempt[];
}

export interface ConflictResolutionOutput {
  strategy: ResolutionStrategy;
  techniques: CommunicationTechnique[];
  scriptSuggestions: ScriptSuggestion[];
  alternativeApproaches: AlternativeApproach[];
  followUpActions: string[];
  successPredictors: string[];
}

export interface ConflictScenario {
  type: 'interpersonal' | 'family' | 'romantic' | 'workplace' | 'friendship';
  description: string;
  stakeholders: string[];
  severity: 'low' | 'medium' | 'high';
  duration: 'recent' | 'ongoing' | 'chronic';
  emotionalIntensity: number; // 1-10
  keyIssues: string[];
}

export interface CommunicationStyle {
  primary: 'assertive' | 'passive' | 'aggressive' | 'passive_aggressive';
  adaptability: 'low' | 'medium' | 'high';
  preferredChannels: ('face_to_face' | 'phone' | 'text' | 'email')[];
  conflictTendency: 'avoidant' | 'competitive' | 'accommodating' | 'collaborative';
  emotionalRegulation: 'low' | 'medium' | 'high';
}

export interface RelationshipContext {
  type: 'new' | 'developing' | 'established' | 'strained';
  duration: string;
  importance: 'low' | 'medium' | 'high';
  powerDynamics: 'equal' | 'hierarchical' | 'complex';
  historyOfConflict: 'none' | 'occasional' | 'frequent';
  sharedGoals: string[];
}

export interface ResolutionAttempt {
  approach: string;
  outcome: 'successful' | 'partially_successful' | 'unsuccessful';
  lessonsLearned: string[];
  date: Date;
}

export interface ResolutionStrategy {
  name: string;
  description: string;
  steps: StrategyStep[];
  timeframe: string;
  successRate: number;
  prerequisites: string[];
  warnings?: string[];
}

export interface StrategyStep {
  order: number;
  action: string;
  rationale: string;
  expectedOutcome: string;
  alternatives?: string[];
  timeframe?: string;
}

export interface CommunicationTechnique {
  name: string;
  description: string;
  whenToUse: string[];
  howToImplement: string[];
  examples: string[];
  commonMistakes: string[];
  effectiveness: number; // 0-1
}

export interface ScriptSuggestion {
  situation: string;
  approach: 'direct' | 'gentle' | 'firm' | 'collaborative';
  script: string;
  tone: string;
  bodyLanguage?: string[];
  followUp?: string[];
}

export interface AlternativeApproach {
  name: string;
  description: string;
  whenToConsider: string[];
  pros: string[];
  cons: string[];
  implementationSteps: string[];
}

// Provider Management Types
export interface AIProvider {
  name: 'claude' | 'openai' | 'local';
  priority: number;
  maxTokens: number;
  costPerToken: number;
  rateLimitPerMinute: number;
  latencyMs: number;
  reliability: number; // 0-1
  capabilities: AICapability[];
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'claude' | 'openai' | 'local';
  maxTokens: number;
  costPerToken: number;
  strengths: string[];
  limitations: string[];
  recommendedFor: AgentType[];
}

export interface AICapability {
  name: string;
  quality: number; // 0-1
  speed: number; // 0-1
  cost: number; // 0-1, lower is better
  reliability: number; // 0-1
}

// Cache and Performance Types
export interface CacheEntry {
  key: string;
  value: AIResponse;
  embedding?: number[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

// Error Handling Types
export interface AIError {
  code: string;
  message: string;
  provider?: 'claude' | 'openai' | 'local';
  model?: string;
  agentType?: AgentType;
  retryable: boolean;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// Rate Limiting Types
export interface RateLimit {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: AIRequest) => string;
  onLimitReached?: (request: AIRequest) => void;
}

export interface RateLimitStatus {
  remaining: number;
  resetTime: Date;
  limited: boolean;
}

// Monitoring and Analytics Types
export interface PerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  costEfficiency: number;
  userSatisfaction: number;
}

export interface AgentMetrics {
  agentType: AgentType;
  requestCount: number;
  averageResponseTime: number;
  averageCost: number;
  successRate: number;
  currentLoad: number;
  cacheHitRate: number;
  lastUpdated: Date;
  errorDistribution: Record<string, number>;
}

export interface CostAnalytics {
  totalCost: number;
  costByAgent: Record<AgentType, number>;
  costByProvider: Record<string, number>;
  averageCostPerUser: number;
  cacheEfficiency: number;
  costTrends: CostTrend[];
}

export interface CostTrend {
  date: Date;
  cost: number;
  requestCount: number;
  cacheHitRate: number;
}

// Webhook and Integration Types
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  agentType?: AgentType;
}

export interface IntegrationConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryConfig: RetryConfig;
  rateLimits: RateLimit[];
}