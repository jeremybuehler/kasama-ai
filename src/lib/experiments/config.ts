/**
 * Experiment Configuration and Management Utilities
 * Centralized configuration and utility functions for experiment system
 */

import { ExperimentConfig, Experiment, FeatureFlag, ExperimentContext } from './types';

/**
 * Default Experiment Configuration
 */
export const defaultExperimentConfig: ExperimentConfig = {
  // Assignment and sampling
  hashSalt: 'kasama-experiments-2025',
  assignmentCookieExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Statistical settings
  defaultConfidenceLevel: 95,
  defaultMinSampleSize: 1000,
  defaultRuntime: 14, // days
  
  // Data collection
  enableAutoMetrics: true,
  eventBatchSize: 50,
  eventFlushInterval: 30000, // 30 seconds
  
  // AI integration
  trackAIMetrics: true,
  aiCostTracking: true,
  aiSatisfactionSurveys: true,
  
  // Privacy and compliance
  respectDNT: true,
  enableGDPRMode: false,
  dataRetentionDays: 90,
  
  // Performance
  enableClientSideCaching: true,
  cacheExpiryMinutes: 15
};

/**
 * Environment-specific configurations
 */
export const environmentConfigs = {
  development: {
    ...defaultExperimentConfig,
    eventBatchSize: 1, // Immediate flushing for development
    eventFlushInterval: 1000, // 1 second
    enableGDPRMode: false,
    dataRetentionDays: 7
  },
  
  staging: {
    ...defaultExperimentConfig,
    eventBatchSize: 10,
    eventFlushInterval: 10000, // 10 seconds
    enableGDPRMode: true,
    dataRetentionDays: 30
  },
  
  production: {
    ...defaultExperimentConfig,
    eventBatchSize: 100,
    eventFlushInterval: 60000, // 1 minute
    enableGDPRMode: true,
    dataRetentionDays: 365
  }
};

/**
 * Experiment Templates for Quick Setup
 */
export const experimentTemplates = {
  aiResponseTest: {
    name: 'AI Response A/B Test',
    type: 'ai_response_test' as const,
    description: 'Test different AI response strategies',
    primaryMetrics: ['user_satisfaction', 'response_quality', 'task_completion'],
    secondaryMetrics: ['response_time', 'token_usage', 'user_engagement'],
    guardrailMetrics: ['cost_per_interaction', 'error_rate'],
    variants: [
      {
        id: 'control',
        name: 'Current Response',
        allocation: 50,
        isControl: true,
        config: {}
      },
      {
        id: 'enhanced',
        name: 'Enhanced Response',
        allocation: 50,
        isControl: false,
        config: {}
      }
    ]
  },
  
  uiComponentTest: {
    name: 'UI Component A/B Test',
    type: 'ui_component_test' as const,
    description: 'Test different UI component designs',
    primaryMetrics: ['conversion_rate', 'click_through_rate', 'user_engagement'],
    secondaryMetrics: ['time_on_page', 'bounce_rate'],
    guardrailMetrics: ['page_load_time', 'error_rate'],
    variants: [
      {
        id: 'control',
        name: 'Current Design',
        allocation: 50,
        isControl: true,
        config: {}
      },
      {
        id: 'new_design',
        name: 'New Design',
        allocation: 50,
        isControl: false,
        config: {}
      }
    ]
  },
  
  onboardingFlowTest: {
    name: 'Onboarding Flow Test',
    type: 'onboarding_flow' as const,
    description: 'Optimize user onboarding experience',
    primaryMetrics: ['onboarding_completion', 'time_to_first_value', 'activation_rate'],
    secondaryMetrics: ['step_completion_rates', 'help_requests'],
    guardrailMetrics: ['drop_off_rate', 'user_frustration_score'],
    variants: [
      {
        id: 'current',
        name: 'Current Flow',
        allocation: 50,
        isControl: true,
        config: {}
      },
      {
        id: 'streamlined',
        name: 'Streamlined Flow',
        allocation: 50,
        isControl: false,
        config: {}
      }
    ]
  }
};

/**
 * Feature Flag Templates
 */
export const featureFlagTemplates = {
  aiFeature: {
    name: 'AI Feature Flag',
    description: 'Gradual rollout of AI-powered features',
    rolloutPercentage: 0,
    targetAudience: [],
    tags: ['ai', 'backend']
  },
  
  uiFeature: {
    name: 'UI Feature Flag',
    description: 'Control visibility of UI components',
    rolloutPercentage: 0,
    targetAudience: [],
    tags: ['ui', 'frontend']
  },
  
  premiumFeature: {
    name: 'Premium Feature Flag',
    description: 'Features exclusive to premium users',
    rolloutPercentage: 100,
    targetAudience: [
      {
        type: 'user_type' as const,
        criteria: { subscription: 'premium' },
        name: 'Premium Users'
      }
    ],
    tags: ['premium', 'monetization']
  }
};

/**
 * Configuration Manager
 */
export class ExperimentConfigManager {
  private config: ExperimentConfig;
  private environment: 'development' | 'staging' | 'production';

  constructor(env: 'development' | 'staging' | 'production' = 'development') {
    this.environment = env;
    this.config = environmentConfigs[env];
  }

  getConfig(): ExperimentConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ExperimentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getEnvironment(): string {
    return this.environment;
  }

  // Validation methods
  validateExperiment(experiment: Partial<Experiment>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!experiment.name?.trim()) {
      errors.push('Experiment name is required');
    }

    if (!experiment.hypothesis?.trim()) {
      errors.push('Experiment hypothesis is required');
    }

    if (!experiment.variants || experiment.variants.length < 2) {
      errors.push('At least 2 variants are required');
    }

    if (experiment.variants) {
      const totalAllocation = experiment.variants.reduce((sum, v) => sum + v.allocation, 0);
      if (Math.abs(totalAllocation - 100) > 0.01) {
        errors.push('Variant allocations must sum to 100%');
      }

      const controlCount = experiment.variants.filter(v => v.isControl).length;
      if (controlCount !== 1) {
        errors.push('Exactly one variant must be marked as control');
      }
    }

    if (experiment.trafficAllocation && (experiment.trafficAllocation < 1 || experiment.trafficAllocation > 100)) {
      errors.push('Traffic allocation must be between 1% and 100%');
    }

    if (experiment.minSampleSize && experiment.minSampleSize < 100) {
      errors.push('Minimum sample size should be at least 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateFeatureFlag(flag: Partial<FeatureFlag>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!flag.id?.trim()) {
      errors.push('Feature flag ID is required');
    }

    if (!flag.name?.trim()) {
      errors.push('Feature flag name is required');
    }

    if (flag.rolloutPercentage !== undefined && (flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100)) {
      errors.push('Rollout percentage must be between 0% and 100%');
    }

    if (flag.id && !/^[a-z0-9_]+$/.test(flag.id)) {
      errors.push('Feature flag ID can only contain lowercase letters, numbers, and underscores');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Statistical Utilities
 */
export class StatisticalUtils {
  static calculateSampleSize(
    confidenceLevel: number = 95,
    power: number = 80,
    baseConversion: number = 0.1,
    minimumDetectableEffect: number = 0.2
  ): number {
    // Simplified sample size calculation
    // In production, use a more sophisticated statistical library
    
    const alpha = (100 - confidenceLevel) / 100;
    const beta = (100 - power) / 100;
    
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(1 - beta);
    
    const p1 = baseConversion;
    const p2 = baseConversion * (1 + minimumDetectableEffect);
    
    const pooledP = (p1 + p2) / 2;
    const pooledSE = Math.sqrt(2 * pooledP * (1 - pooledP));
    const effectSize = Math.abs(p2 - p1);
    
    const sampleSize = Math.pow(zAlpha + zBeta, 2) * Math.pow(pooledSE, 2) / Math.pow(effectSize, 2);
    
    return Math.ceil(sampleSize);
  }

  static calculateStatisticalSignificance(
    controlConversions: number,
    controlSampleSize: number,
    variantConversions: number,
    variantSampleSize: number
  ): {
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: [number, number];
  } {
    // Simplified significance testing
    // In production, use a proper statistical testing library
    
    const p1 = controlConversions / controlSampleSize;
    const p2 = variantConversions / variantSampleSize;
    
    const pooledP = (controlConversions + variantConversions) / (controlSampleSize + variantSampleSize);
    const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/controlSampleSize + 1/variantSampleSize));
    
    const zScore = (p2 - p1) / pooledSE;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    const marginOfError = 1.96 * pooledSE; // 95% confidence
    const confidenceInterval: [number, number] = [
      (p2 - p1) - marginOfError,
      (p2 - p1) + marginOfError
    ];
    
    return {
      pValue,
      isSignificant: pValue < 0.05,
      confidenceInterval
    };
  }

  private static getZScore(probability: number): number {
    // Simplified z-score approximation
    // In production, use a proper statistical library
    if (probability >= 0.975) return 1.96;
    if (probability >= 0.95) return 1.645;
    if (probability >= 0.90) return 1.28;
    return 0;
  }

  private static normalCDF(x: number): number {
    // Simplified normal CDF approximation
    // In production, use a proper statistical library
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private static erf(x: number): number {
    // Simplified error function approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

/**
 * Experiment Builder Helper
 */
export class ExperimentBuilder {
  private experiment: Partial<Experiment> = {};

  static create(): ExperimentBuilder {
    return new ExperimentBuilder();
  }

  fromTemplate(templateName: keyof typeof experimentTemplates): this {
    const template = experimentTemplates[templateName];
    this.experiment = {
      ...template,
      id: crypto.randomUUID(),
      status: 'draft',
      confidenceLevel: 95,
      minSampleSize: 1000,
      trafficAllocation: 100,
      audienceSegments: [],
      owner: 'system',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this;
  }

  setName(name: string): this {
    this.experiment.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.experiment.description = description;
    return this;
  }

  setHypothesis(hypothesis: string): this {
    this.experiment.hypothesis = hypothesis;
    return this;
  }

  setTrafficAllocation(percentage: number): this {
    this.experiment.trafficAllocation = percentage;
    return this;
  }

  setDuration(startDate: string, endDate: string): this {
    this.experiment.startDate = startDate;
    this.experiment.endDate = endDate;
    return this;
  }

  addVariant(variant: Partial<ExperimentVariant>): this {
    if (!this.experiment.variants) {
      this.experiment.variants = [];
    }
    
    this.experiment.variants.push({
      id: variant.id || crypto.randomUUID(),
      name: variant.name || 'Variant',
      description: variant.description || '',
      allocation: variant.allocation || 50,
      config: variant.config || {},
      isControl: variant.isControl || false
    });
    
    return this;
  }

  build(): Experiment {
    const configManager = new ExperimentConfigManager();
    const validation = configManager.validateExperiment(this.experiment);
    
    if (!validation.isValid) {
      throw new Error(`Invalid experiment: ${validation.errors.join(', ')}`);
    }
    
    return this.experiment as Experiment;
  }
}

/**
 * Utility Functions
 */
export const createExperimentId = (): string => {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createFeatureFlagId = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

export const calculateExperimentDuration = (
  sampleSize: number,
  trafficAllocation: number,
  dailyUsers: number
): number => {
  const usersPerDay = dailyUsers * (trafficAllocation / 100);
  return Math.ceil(sampleSize / usersPerDay);
};

export const isExperimentReady = (experiment: Experiment): boolean => {
  const now = new Date();
  const startDate = new Date(experiment.startDate);
  
  return experiment.status === 'scheduled' && now >= startDate;
};

export const shouldStopExperiment = (
  experiment: Experiment,
  currentSampleSize: number,
  negativeMetrics: string[]
): boolean => {
  // Stop if experiment has run its course
  if (experiment.endDate && new Date() > new Date(experiment.endDate)) {
    return true;
  }
  
  // Stop if minimum sample size reached and significant negative results
  if (currentSampleSize >= experiment.minSampleSize && negativeMetrics.length > 0) {
    return true;
  }
  
  return false;
};

// Export singleton instances
export const configManager = new ExperimentConfigManager(
  (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development'
);

export const statisticalUtils = new StatisticalUtils();