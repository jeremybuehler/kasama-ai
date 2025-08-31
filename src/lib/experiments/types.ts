/**
 * Experiment Tracking System Types
 * Comprehensive A/B testing and feature flag system for Kasama AI
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetAudience?: AudienceSegment[];
  environment: 'development' | 'staging' | 'production';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface AudienceSegment {
  type: 'user_type' | 'geo' | 'device' | 'custom';
  criteria: Record<string, any>;
  name: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: ExperimentStatus;
  type: ExperimentType;
  
  // Configuration
  startDate: string;
  endDate?: string;
  minSampleSize: number;
  confidenceLevel: number; // 90, 95, 99
  variants: ExperimentVariant[];
  
  // Targeting
  audienceSegments: AudienceSegment[];
  trafficAllocation: number; // Percentage of users included
  
  // AI-specific
  aiProvider?: 'openai' | 'anthropic' | 'local';
  promptTemplates?: Record<string, string>;
  
  // Analytics
  primaryMetrics: string[];
  secondaryMetrics: string[];
  guardrailMetrics: string[];
  
  // Metadata
  owner: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ExperimentStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'stopped' 
  | 'archived';

export type ExperimentType = 
  | 'ai_response_test'
  | 'ui_component_test' 
  | 'feature_test'
  | 'onboarding_flow'
  | 'engagement_optimization'
  | 'pricing_test';

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // Percentage of experiment traffic
  config: Record<string, any>;
  isControl: boolean;
}

export interface ExperimentAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
  sessionId?: string;
  sticky: boolean; // Whether user stays in same variant
}

export interface MetricEvent {
  id: string;
  userId: string;
  sessionId: string;
  experimentId?: string;
  variantId?: string;
  
  // Event details
  eventType: string;
  eventName: string;
  timestamp: string;
  
  // Context
  page: string;
  component?: string;
  feature?: string;
  
  // Values
  value?: number;
  category?: string;
  properties?: Record<string, any>;
  
  // AI-specific metrics
  aiProvider?: string;
  responseTime?: number;
  tokenCount?: number;
  cost?: number;
  satisfaction?: number; // 1-5 rating
}

export interface ExperimentResults {
  experimentId: string;
  generatedAt: string;
  
  // Sample sizes
  totalUsers: number;
  variantStats: Record<string, VariantStats>;
  
  // Statistical analysis
  primaryResults: MetricResult[];
  secondaryResults: MetricResult[];
  guardrailResults: MetricResult[];
  
  // Decision support
  recommendation: ExperimentDecision;
  confidence: number;
  significantResults: string[];
  
  // Time series data
  timeSeriesData: TimeSeriesPoint[];
}

export interface VariantStats {
  variantId: string;
  sampleSize: number;
  conversionRate?: number;
  averageValue?: number;
  retentionRate?: number;
  engagementScore?: number;
}

export interface MetricResult {
  metricName: string;
  variants: Record<string, {
    mean: number;
    standardError: number;
    confidenceInterval: [number, number];
    sampleSize: number;
  }>;
  
  // Statistical tests
  pValue?: number;
  statisticallySignificant: boolean;
  practicalSignificance?: boolean;
  effectSize?: number;
  
  // Comparison to control
  controlVariant: string;
  relativeImprovement?: Record<string, number>;
}

export interface TimeSeriesPoint {
  timestamp: string;
  variantId: string;
  metricName: string;
  value: number;
  count: number;
}

export type ExperimentDecision = 
  | 'continue' 
  | 'ship_winner' 
  | 'stop_negative' 
  | 'inconclusive' 
  | 'extend_duration';

// User engagement tracking
export interface UserEngagementMetrics {
  userId: string;
  sessionId: string;
  date: string;
  
  // Basic engagement
  pageViews: number;
  sessionDuration: number;
  bounceRate: number;
  
  // Feature engagement
  aiInteractions: number;
  assessmentCompletions: number;
  practiceEngagement: number;
  goalProgress: number;
  
  // Quality metrics
  taskCompletionRate: number;
  errorRate: number;
  helpRequests: number;
  feedbackSubmissions: number;
  
  // AI-specific metrics
  aiResponseSatisfaction: number; // Average 1-5 rating
  aiResponseTime: number; // Average response time
  aiTokenUsage: number;
  aiCost: number;
  
  // Retention indicators
  returnVisits: number;
  streakDays: number;
  churnRisk: number; // 0-1 probability
}

// Dashboard and UI types
export interface ExperimentDashboard {
  activeExperiments: Experiment[];
  recentResults: ExperimentResults[];
  flagStatus: FeatureFlag[];
  systemHealth: {
    assignmentLatency: number;
    eventIngestionDelay: number;
    errorRate: number;
    dataQuality: number;
  };
  alerts: ExperimentAlert[];
}

export interface ExperimentAlert {
  id: string;
  type: 'performance' | 'statistical' | 'technical' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  experimentId?: string;
  createdAt: string;
  resolved: boolean;
  actionRequired: boolean;
}

// Configuration and settings
export interface ExperimentConfig {
  // Sampling and assignment
  hashSalt: string;
  assignmentCookieExpiry: number;
  
  // Statistical settings
  defaultConfidenceLevel: number;
  defaultMinSampleSize: number;
  defaultRuntime: number; // days
  
  // Data collection
  enableAutoMetrics: boolean;
  eventBatchSize: number;
  eventFlushInterval: number;
  
  // AI integration
  trackAIMetrics: boolean;
  aiCostTracking: boolean;
  aiSatisfactionSurveys: boolean;
  
  // Privacy and compliance
  respectDNT: boolean;
  enableGDPRMode: boolean;
  dataRetentionDays: number;
  
  // Performance
  enableClientSideCaching: boolean;
  cacheExpiryMinutes: number;
}

// Utility types
export interface ExperimentContext {
  userId: string;
  sessionId: string;
  userAgent: string;
  ipAddress?: string;
  referrer?: string;
  utm: Record<string, string>;
  userType: 'new' | 'returning' | 'premium';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
}

export interface ExperimentError {
  type: 'assignment' | 'tracking' | 'analysis' | 'configuration';
  message: string;
  experimentId?: string;
  userId?: string;
  timestamp: string;
  stack?: string;
  metadata?: Record<string, any>;
}