# Kasama AI Experiment Tracking System

A comprehensive experiment tracking, A/B testing, and feature flag system designed specifically for AI-powered relationship development platforms.

## 🎯 Overview

This system provides:
- **Feature Flags**: Gradual rollouts and feature toggles
- **A/B Testing**: Split testing for AI responses and UI components
- **User Engagement Analytics**: Comprehensive behavior tracking
- **AI Performance Metrics**: Response quality and cost optimization
- **Real-time Dashboard**: Visual experiment management and analysis

## 🚀 Quick Start

### 1. Initialize Experiments

```typescript
import { initializeExperiments, cleanupExperiments } from '@/lib/experiments';

// When user logs in
const sessionId = initializeExperiments(user.id);

// When user logs out or session ends
cleanupExperiments(sessionId);
```

### 2. Use Feature Flags

```typescript
import { useFeatureFlag, createExperimentContext } from '@/lib/experiments';

const MyComponent = () => {
  const context = createExperimentContext(user.id, sessionId);
  const showNewFeature = useFeatureFlag('ai_agent_v2', context);
  
  return (
    <div>
      {showNewFeature ? <NewAIInterface /> : <CurrentInterface />}
    </div>
  );
};
```

### 3. AI Response A/B Testing

```typescript
import { useAIAgent } from '@/lib/experiments';

const AssessmentComponent = () => {
  const { generateResponse, trackFeedback } = useAIAgent('assessment');
  
  const handleSubmitAssessment = async (answers) => {
    const response = await generateResponse(
      {
        question: "How do you handle conflict?",
        answer: answers.conflict,
        questionType: "text",
        assessmentContext: { stage: "initial" }
      },
      user.id,
      sessionId,
      userProfile
    );
    
    if (response) {
      // Show AI response to user
      setAiResponse(response.content);
      
      // Track user satisfaction
      const satisfaction = await getUserRating(response.content);
      trackFeedback(user.id, sessionId, response.metadata.responseId, satisfaction);
    }
  };
};
```

### 4. Track User Engagement

```typescript
import { trackUserAction, trackPageView } from '@/lib/experiments';

// Track page visits
trackPageView(user.id, sessionId, '/assessment');

// Track user actions
trackUserAction(user.id, sessionId, 'assessment_completed', 'assessment_flow', {
  completionTime: 180, // seconds
  questionsAnswered: 25,
  difficulty: 'intermediate'
});
```

### 5. View Experiment Dashboard

```tsx
import { ExperimentDashboard } from '@/lib/experiments';

const AdminPanel = () => (
  <div>
    <h1>Experiment Management</h1>
    <ExperimentDashboard />
  </div>
);
```

## 🔧 Core Components

### Feature Flag Manager

Controls feature visibility with gradual rollouts:

```typescript
import { featureFlagManager } from '@/lib/experiments';

// Check if feature is enabled for user
const isEnabled = await featureFlagManager.isEnabled(
  'premium_features',
  context,
  false // default value
);

// Get multiple flags at once
const flags = await featureFlagManager.getFlags(
  ['ai_agent_v2', 'new_dashboard', 'premium_features'],
  context
);
```

### AI Testing Framework

A/B tests AI agent responses:

```typescript
import { aiTestingFramework } from '@/lib/experiments';

// Get AI response through experiment system
const response = await aiTestingFramework.getAIResponse(
  'insight', // agent type
  context,
  {
    recentProgress: JSON.stringify(userProgress),
    relationshipStage: 'committed',
    userContext: JSON.stringify(userProfile)
  },
  userProfile
);
```

### Engagement Tracker

Comprehensive user behavior analytics:

```typescript
import { engagementTracker } from '@/lib/experiments';

// Get real-time engagement analysis
const analysis = engagementTracker.getRealtimeEngagement(user.id);
console.log('Engagement Score:', analysis.engagementScore);
console.log('Risk Factors:', analysis.riskFactors);
console.log('Recommendations:', analysis.recommendations);

// Calculate KPIs
const kpis = engagementTracker.calculateEngagementKPIs('week');
console.log('Weekly Active Users:', kpis.weeklyActiveUsers);
console.log('Conversion Rate:', kpis.assessmentCompletionRate);
```

## 🧪 Creating Experiments

### Using the Experiment Builder

```typescript
import { ExperimentBuilder } from '@/lib/experiments';

const experiment = ExperimentBuilder
  .create()
  .fromTemplate('aiResponseTest')
  .setName('Enhanced Assessment Agent V2')
  .setHypothesis('Improved prompts will increase user satisfaction by 15%')
  .setTrafficAllocation(25) // 25% of users
  .setDuration('2025-02-01', '2025-02-15')
  .addVariant({
    name: 'Enhanced Empathy',
    allocation: 50,
    config: {
      promptTemplate: 'enhanced_empathy_template',
      temperature: 0.8
    }
  })
  .build();
```

### Manual Experiment Configuration

```typescript
const experiment = {
  id: 'daily_insights_personalization',
  name: 'Personalized Daily Insights',
  description: 'Test personalized vs generic daily relationship insights',
  hypothesis: 'Personalized insights will increase engagement by 20%',
  status: 'running',
  type: 'ai_response_test',
  
  startDate: '2025-02-01T00:00:00Z',
  endDate: '2025-02-15T23:59:59Z',
  minSampleSize: 2000,
  confidenceLevel: 95,
  
  variants: [
    {
      id: 'control',
      name: 'Generic Insights',
      allocation: 50,
      isControl: true,
      config: { insightType: 'generic' }
    },
    {
      id: 'personalized',
      name: 'Personalized Insights',
      allocation: 50,
      isControl: false,
      config: { 
        insightType: 'personalized',
        useUserHistory: true,
        includeGoalProgress: true
      }
    }
  ],
  
  primaryMetrics: ['user_engagement', 'insight_rating', 'repeat_visits'],
  secondaryMetrics: ['time_spent_reading', 'sharing_rate'],
  guardrailMetrics: ['ai_cost', 'generation_errors']
};
```

## 📊 Analytics and Reporting

### Real-time Experiment Monitoring

```typescript
import { experimentEngine } from '@/lib/experiments';

// Get experiment results
const results = await experimentEngine.getExperimentResults('exp_001');

console.log('Statistical Significance:', results.primaryResults[0].statisticallySignificant);
console.log('P-value:', results.primaryResults[0].pValue);
console.log('Confidence Interval:', results.primaryResults[0].variants['variant'].confidenceInterval);
```

### Cohort Analysis

```typescript
import { engagementTracker } from '@/lib/experiments';

const cohortData = engagementTracker.getCohortAnalysis('acquisition');

cohortData.cohorts.forEach(cohort => {
  console.log(`${cohort.name}: ${cohort.size} users`);
  console.log('Retention rates:', cohort.retentionRates);
  console.log('Engagement score:', cohort.engagementScore);
});
```

### AI Performance Metrics

```typescript
import { aiTestingFramework } from '@/lib/experiments';

const aiAnalytics = aiTestingFramework.getAITestAnalytics('assessment_agent_v2');

console.log('Average Satisfaction:', aiAnalytics.overview.averageSatisfaction);
console.log('Cost Per Response:', aiAnalytics.costAnalysis.costPerResponse);
console.log('Token Efficiency:', aiAnalytics.costAnalysis.tokenEfficiency);
```

## 🔐 Privacy and Compliance

### GDPR Compliance

```typescript
import { configManager } from '@/lib/experiments';

// Enable GDPR mode
configManager.updateConfig({
  enableGDPRMode: true,
  respectDNT: true,
  dataRetentionDays: 30
});
```

### Data Anonymization

```typescript
// User context automatically anonymizes sensitive data
const context = createExperimentContext(user.id, sessionId, {
  // Only necessary data is included
  userType: 'premium',
  deviceType: 'mobile',
  // PII is never stored
});
```

## 🚨 Best Practices

### 1. Statistical Rigor

- **Minimum Sample Size**: Use at least 1000 users per variant
- **Confidence Level**: Use 95% for ship decisions
- **Runtime**: Run experiments for at least 1 week
- **Multiple Testing**: Apply Bonferroni correction for multiple metrics

### 2. Experiment Hygiene

```typescript
// Always validate experiments before running
const validation = configManager.validateExperiment(experiment);
if (!validation.isValid) {
  console.error('Experiment errors:', validation.errors);
  return;
}
```

### 3. Feature Flag Management

```typescript
// Gradual rollout pattern
featureFlagManager.gradualRollout('new_feature', 100, 10); // 10% daily increase

// Emergency controls
featureFlagManager.emergencyDisable('problematic_feature', 'High error rate detected');
```

### 4. AI Response Testing

```typescript
// Always track both quantitative and qualitative metrics
const response = await aiAgent.generateResponse(input, context);

// Quantitative: response time, token usage, cost
// Qualitative: user satisfaction survey
const survey = aiTestingFramework.getSatisfactionSurvey(response.id);
```

## 🔄 Integration with Existing Code

### Update Existing Components

1. **Wrap AI calls**:
```typescript
// Before
const response = await openai.chat.completions.create(params);

// After
const response = await aiAgent.generateResponse(input, context, userProfile);
```

2. **Add feature flags**:
```typescript
// Before
return <NewDashboard />;

// After
const showNewDashboard = useFeatureFlag('new_dashboard_layout', context);
return showNewDashboard ? <NewDashboard /> : <OldDashboard />;
```

3. **Track engagement**:
```typescript
// Before
const handleSubmit = () => { /* submit logic */ };

// After
const handleSubmit = () => {
  trackUserAction(user.id, sessionId, 'form_submitted', 'assessment_flow');
  /* submit logic */
};
```

## 📈 Success Metrics

Track these key metrics for relationship development platform:

### Engagement Metrics
- Daily/Weekly/Monthly Active Users
- Session Duration
- Feature Adoption Rate
- Task Completion Rate

### AI Performance Metrics
- Response Quality Rating (1-5 scale)
- Response Time (<2 seconds target)
- Cost per Interaction (<$0.05 target)
- User Satisfaction (>4.0 average)

### Business Metrics
- User Activation Rate (completed onboarding)
- Retention Rates (Day 1, 7, 30)
- Conversion to Premium
- Churn Rate

## 🛠️ Troubleshooting

### Common Issues

1. **Experiment not assigning users**:
   - Check experiment status is 'running'
   - Verify traffic allocation > 0
   - Confirm user meets audience criteria

2. **Feature flag not working**:
   - Verify flag is enabled
   - Check rollout percentage
   - Confirm environment settings

3. **Metrics not tracking**:
   - Ensure session is active
   - Check event flushing configuration
   - Verify user permissions

### Debug Mode

```typescript
import { experimentEngine } from '@/lib/experiments';

// Enable debug logging
experimentEngine.enableDebugMode(true);

// View current assignments
const assignments = experimentEngine.getUserAssignments(user.id);
console.log('User assignments:', assignments);
```

## 📚 API Reference

See the TypeScript definitions in `types.ts` for complete API documentation.

## 🤝 Contributing

When adding new experiment types or metrics:

1. Update `types.ts` with new interfaces
2. Add validation in `config.ts`
3. Create templates in `experimentTemplates`
4. Update dashboard visualizations
5. Add tests for new functionality

---

**Built for Kasama AI** - Transforming relationships through data-driven AI optimization.