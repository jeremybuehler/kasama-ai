/**
 * Learning Coach Agent
 * 
 * Specializes in personalized curriculum generation and learning path optimization.
 * Creates customized learning experiences based on user goals, current skills,
 * available time, and learning preferences.
 */

import { ProviderManager } from '../core/provider-manager';
import { SemanticCache } from '../core/semantic-cache';
import { ErrorHandler } from '../core/error-handler';
import { AGENT_CONFIGS } from '../constants';
import {
  AIRequest,
  AIResponse,
  LearningPathInput,
  LearningPathOutput,
  LearningModule,
  Practice,
  UserProfile,
  Goal,
  LearningPreferences,
  TimeConstraints
} from '../types';

export interface LearningContext {
  currentSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  completedPractices: string[];
  timeAvailable: number; // minutes per session
  preferredStyle: 'structured' | 'flexible' | 'exploratory';
  motivationLevel: 'low' | 'medium' | 'high';
}

export interface CurriculumUpdate {
  addedModules: LearningModule[];
  modifiedModules: LearningModule[];
  removedModules: string[];
  reasonForChanges: string;
  expectedOutcomes: string[];
}

export class LearningCoach {
  private providerManager: ProviderManager;
  private cache: SemanticCache;
  private errorHandler: ErrorHandler;
  private config = AGENT_CONFIGS.learning_coach;

  constructor(
    providerManager: ProviderManager,
    cache: SemanticCache,
    errorHandler: ErrorHandler
  ) {
    this.providerManager = providerManager;
    this.cache = cache;
    this.errorHandler = errorHandler;
  }

  /**
   * Generate a personalized learning path based on user profile and goals
   */
  async generateLearningPath(
    input: LearningPathInput,
    context?: LearningContext
  ): Promise<LearningPathOutput> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: input.userProfile.id,
      agentType: 'learning_coach',
      inputData: {
        userProfile: input.userProfile,
        assessmentResults: input.assessmentResults,
        currentGoals: input.currentGoals,
        learningPreferences: input.learningPreferences,
        timeConstraints: input.timeConstraints,
        context
      },
      priority: 'high',
      maxTokens: this.config.maxTokens
    };

    try {
      // Check cache first
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseLearningPathResponse(cachedResponse);
      }

      const prompt = this.buildLearningPathPrompt(input, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseLearningPathResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, {
        agentType: 'learning_coach',
        userId: request.userId,
        requestId
      });
      
      return this.generateFallbackLearningPath(input, context);
    }
  }

  /**
   * Adapt existing learning path based on progress and feedback
   */
  async adaptLearningPath(
    currentPath: LearningPathOutput,
    progressData: {
      completedModules: string[];
      strugglingAreas: string[];
      timeSpent: Record<string, number>;
      userFeedback: string[];
    },
    context?: LearningContext
  ): Promise<CurriculumUpdate> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: 'adaptive',
      agentType: 'learning_coach',
      inputData: {
        currentPath,
        progressData,
        context,
        adaptation: true
      },
      priority: 'medium',
      maxTokens: this.config.maxTokens
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseAdaptationResponse(cachedResponse);
      }

      const prompt = this.buildAdaptationPrompt(currentPath, progressData, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseAdaptationResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'learning_coach' });
      return this.generateFallbackAdaptation(currentPath, progressData);
    }
  }

  /**
   * Generate daily practice recommendations
   */
  async getDailyPractices(
    userProfile: UserProfile,
    currentPath: LearningPathOutput,
    availableTime: number,
    context?: LearningContext
  ): Promise<{
    primaryPractice: Practice;
    optionalPractices: Practice[];
    estimatedBenefit: string;
    motivationalMessage: string;
  }> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: userProfile.id,
      agentType: 'learning_coach',
      inputData: {
        userProfile,
        currentPath,
        availableTime,
        context,
        dailyPractices: true
      },
      priority: 'medium',
      maxTokens: 2000
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseDailyPracticesResponse(cachedResponse);
      }

      const prompt = this.buildDailyPracticesPrompt(userProfile, currentPath, availableTime, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseDailyPracticesResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'learning_coach' });
      return this.generateFallbackDailyPractices(availableTime);
    }
  }

  private buildLearningPathPrompt(input: LearningPathInput, context?: LearningContext): string {
    const contextInfo = context ? `
Learning Context:
- Current Skill Level: ${context.currentSkillLevel}
- Focus Areas: ${context.focusAreas.join(', ')}
- Completed Practices: ${context.completedPractices.length} practices
- Available Time: ${context.timeAvailable} minutes per session
- Preferred Style: ${context.preferredStyle}
- Motivation Level: ${context.motivationLevel}` : '';
    
    return `You are an expert learning coach specializing in relationship development. Create a personalized learning path for this user.

User Profile:
${JSON.stringify(input.userProfile, null, 2)}

Assessment Results:
${JSON.stringify(input.assessmentResults, null, 2)}

Current Goals:
${input.currentGoals ? JSON.stringify(input.currentGoals, null, 2) : 'None specified'}

Learning Preferences:
${input.learningPreferences ? JSON.stringify(input.learningPreferences, null, 2) : 'Not specified'}

Time Constraints:
${input.timeConstraints ? JSON.stringify(input.timeConstraints, null, 2) : 'Flexible'}${contextInfo}

Create a comprehensive learning path in this JSON format:
{
  "pathId": "<unique identifier>",
  "name": "<engaging path name>",
  "description": "<detailed description of the learning journey>",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedDurationWeeks": <number of weeks>,
  "modules": [
    {
      "id": "<module id>",
      "title": "<module title>",
      "description": "<module description>",
      "order": <sequence number>,
      "estimatedTimeMinutes": <total time for module>,
      "practices": [
        {
          "id": "<practice id>",
          "title": "<practice title>",
          "description": "<practice description>",
          "category": "<category>",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedTimeMinutes": <minutes>,
          "instructions": [
            {
              "step": 1,
              "instruction": "<step instruction>",
              "tips": ["<helpful tip>"],
              "examples": ["<example>"],
              "warnings": ["<warning if needed>"]
            }
          ],
          "tags": ["<tag>"],
          "prerequisites": ["<prerequisite if any>"],
          "learningObjectives": ["<objective>"]
        }
      ],
      "assessments": ["<assessment id>"],
      "milestones": [
        {
          "id": "<milestone id>",
          "title": "<milestone title>",
          "description": "<description>",
          "completed": false
        }
      ]
    }
  ],
  "prerequisites": ["<prerequisite>"],
  "learningObjectives": ["<overall objective>"],
  "personalizationScore": <0-1 score indicating how well this fits the user>
}

Design principles:
1. Match the user's current skill level and goals
2. Respect time constraints and preferences
3. Create progressive difficulty with clear milestones
4. Include practical, actionable practices
5. Provide variety to maintain engagement
6. Focus on evidence-based relationship skills
7. Be encouraging and supportive in tone`;
  }

  private buildAdaptationPrompt(
    currentPath: LearningPathOutput,
    progressData: any,
    context?: LearningContext
  ): string {
    return `Analyze the current learning path and user progress to suggest adaptations.

Current Learning Path:
${JSON.stringify(currentPath, null, 2)}

Progress Data:
${JSON.stringify(progressData, null, 2)}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide adaptation recommendations in this JSON format:
{
  "addedModules": [
    {
      "id": "<new module id>",
      "title": "<title>",
      "description": "<description>",
      "order": <position in path>,
      "estimatedTimeMinutes": <time>,
      "practices": [...],
      "assessments": [...],
      "milestones": [...]
    }
  ],
  "modifiedModules": [
    {
      "id": "<existing module id>",
      "changes": {
        "difficulty": "<new difficulty if changed>",
        "practices": [...],
        "estimatedTime": <new time if changed>
      }
    }
  ],
  "removedModules": ["<module id to remove>"],
  "reasonForChanges": "<explanation of why these changes are recommended>",
  "expectedOutcomes": ["<expected benefit from changes>"]
}

Focus on:
1. Addressing struggling areas with additional support
2. Accelerating through mastered content
3. Adjusting based on time availability
4. Incorporating user feedback
5. Maintaining motivation and engagement`;
  }

  private buildDailyPracticesPrompt(
    userProfile: UserProfile,
    currentPath: LearningPathOutput,
    availableTime: number,
    context?: LearningContext
  ): string {
    return `Recommend today's practice activities for this user.

User: ${userProfile.fullName || 'Anonymous'}
Current Learning Path: ${currentPath.name}
Available Time Today: ${availableTime} minutes

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Current Path Modules:
${JSON.stringify(currentPath.modules.slice(0, 3), null, 2)}

Provide daily practice recommendations in this JSON format:
{
  "primaryPractice": {
    "id": "<practice id>",
    "title": "<practice title>",
    "description": "<description>",
    "category": "<category>",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedTimeMinutes": <time within available time>,
    "instructions": [...],
    "tags": [...],
    "learningObjectives": [...]
  },
  "optionalPractices": [
    {
      "id": "<optional practice id>",
      "title": "<title>",
      "description": "<description>",
      "estimatedTimeMinutes": <time>,
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "estimatedBenefit": "<explanation of how today's practice will help>",
  "motivationalMessage": "<encouraging, personalized message>"
}

Prioritize:
1. Practices that fit the available time
2. Current skill level and progress
3. Variety to prevent boredom
4. Actionable, real-world application
5. Building on previous learning`;
  }

  private parseLearningPathResponse(response: AIResponse): LearningPathOutput {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return this.validateLearningPathOutput(parsed);
    } catch (error) {
      console.error('Failed to parse learning path response:', error);
      return this.createDefaultLearningPath();
    }
  }

  private parseAdaptationResponse(response: AIResponse): CurriculumUpdate {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return {
        addedModules: parsed.addedModules || [],
        modifiedModules: parsed.modifiedModules || [],
        removedModules: parsed.removedModules || [],
        reasonForChanges: parsed.reasonForChanges || 'Adaptation based on progress data',
        expectedOutcomes: parsed.expectedOutcomes || ['Improved learning experience']
      };
    } catch (error) {
      console.error('Failed to parse adaptation response:', error);
      return {
        addedModules: [],
        modifiedModules: [],
        removedModules: [],
        reasonForChanges: 'Maintaining current path structure',
        expectedOutcomes: ['Continued progress']
      };
    }
  }

  private parseDailyPracticesResponse(response: AIResponse): {
    primaryPractice: Practice;
    optionalPractices: Practice[];
    estimatedBenefit: string;
    motivationalMessage: string;
  } {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return {
        primaryPractice: parsed.primaryPractice || this.createDefaultPractice(),
        optionalPractices: parsed.optionalPractices || [],
        estimatedBenefit: parsed.estimatedBenefit || 'Daily practice builds relationship skills',
        motivationalMessage: parsed.motivationalMessage || 'Every small step counts on your journey!'
      };
    } catch (error) {
      console.error('Failed to parse daily practices response:', error);
      return {
        primaryPractice: this.createDefaultPractice(),
        optionalPractices: [],
        estimatedBenefit: 'Regular practice strengthens relationship skills',
        motivationalMessage: 'Great job taking time for your personal growth today!'
      };
    }
  }

  private validateLearningPathOutput(output: any): LearningPathOutput {
    return {
      pathId: output.pathId || crypto.randomUUID(),
      name: output.name || 'Personalized Relationship Development Path',
      description: output.description || 'A customized learning journey designed for your relationship goals',
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(output.difficulty) ? output.difficulty : 'beginner',
      estimatedDurationWeeks: Math.max(1, Math.min(52, output.estimatedDurationWeeks || 4)),
      modules: Array.isArray(output.modules) ? output.modules : this.createDefaultModules(),
      prerequisites: Array.isArray(output.prerequisites) ? output.prerequisites : [],
      learningObjectives: Array.isArray(output.learningObjectives) ? output.learningObjectives : ['Improve relationship skills'],
      personalizationScore: Math.max(0, Math.min(1, output.personalizationScore || 0.8))
    };
  }

  private generateFallbackLearningPath(input: LearningPathInput, context?: LearningContext): LearningPathOutput {
    const skillLevel = context?.currentSkillLevel || 'beginner';
    
    return {
      pathId: crypto.randomUUID(),
      name: 'Relationship Foundations Path',
      description: 'A comprehensive introduction to building strong relationship skills',
      difficulty: skillLevel,
      estimatedDurationWeeks: skillLevel === 'beginner' ? 6 : skillLevel === 'intermediate' ? 4 : 3,
      modules: this.createDefaultModules(),
      prerequisites: [],
      learningObjectives: [
        'Develop effective communication skills',
        'Build emotional intelligence',
        'Learn conflict resolution strategies',
        'Strengthen relationship awareness'
      ],
      personalizationScore: 0.7
    };
  }

  private generateFallbackAdaptation(currentPath: LearningPathOutput, progressData: any): CurriculumUpdate {
    return {
      addedModules: [],
      modifiedModules: [],
      removedModules: [],
      reasonForChanges: 'Maintaining current learning structure based on available data',
      expectedOutcomes: ['Continued skill development', 'Steady progress toward goals']
    };
  }

  private generateFallbackDailyPractices(availableTime: number): {
    primaryPractice: Practice;
    optionalPractices: Practice[];
    estimatedBenefit: string;
    motivationalMessage: string;
  } {
    return {
      primaryPractice: this.createDefaultPractice(availableTime),
      optionalPractices: [
        {
          id: 'optional-1',
          title: 'Gratitude Reflection',
          description: 'Take a moment to appreciate positive aspects of your relationships',
          category: 'reflection',
          difficulty: 'beginner',
          estimatedTimeMinutes: 5,
          instructions: [],
          tags: ['gratitude', 'mindfulness'],
          prerequisites: [],
          learningObjectives: ['Practice appreciation', 'Build positive mindset']
        }
      ],
      estimatedBenefit: 'Today\'s practice will help you develop better relationship awareness and communication skills',
      motivationalMessage: 'You\'re doing great by prioritizing your relationship development!'
    };
  }

  private createDefaultLearningPath(): LearningPathOutput {
    return {
      pathId: crypto.randomUUID(),
      name: 'Communication Essentials',
      description: 'Master the fundamentals of effective relationship communication',
      difficulty: 'beginner',
      estimatedDurationWeeks: 4,
      modules: this.createDefaultModules(),
      prerequisites: [],
      learningObjectives: [
        'Learn active listening techniques',
        'Practice expressing needs clearly',
        'Develop empathy and understanding',
        'Build conflict resolution skills'
      ],
      personalizationScore: 0.6
    };
  }

  private createDefaultModules(): LearningModule[] {
    return [
      {
        id: 'module-1',
        title: 'Active Listening Fundamentals',
        description: 'Learn to truly hear and understand others',
        order: 1,
        estimatedTimeMinutes: 120,
        practices: [this.createDefaultPractice()],
        assessments: ['listening-assessment'],
        milestones: [{
          id: 'milestone-1',
          title: 'First Week Complete',
          description: 'Completed first module and practice',
          completed: false
        }]
      },
      {
        id: 'module-2',
        title: 'Emotional Awareness',
        description: 'Understand and express emotions effectively',
        order: 2,
        estimatedTimeMinutes: 90,
        practices: [],
        assessments: [],
        milestones: []
      }
    ];
  }

  private createDefaultPractice(timeLimit?: number): Practice {
    const estimatedTime = timeLimit ? Math.min(timeLimit, 15) : 10;
    
    return {
      id: 'practice-default',
      title: 'Daily Check-In Practice',
      description: 'A simple practice to build self-awareness and reflection skills',
      category: 'self_awareness',
      difficulty: 'beginner',
      estimatedTimeMinutes: estimatedTime,
      instructions: [
        {
          step: 1,
          instruction: 'Find a quiet moment in your day',
          tips: ['Morning or evening works well'],
          examples: ['During morning coffee', 'Before bed'],
          warnings: []
        },
        {
          step: 2,
          instruction: 'Ask yourself: How am I feeling right now?',
          tips: ['Be honest with yourself', 'Name specific emotions'],
          examples: ['"I feel excited and a little nervous"'],
          warnings: []
        },
        {
          step: 3,
          instruction: 'Reflect on one interaction from today',
          tips: ['Choose something meaningful', 'Consider what went well'],
          examples: ['A conversation with a friend', 'A challenging work discussion'],
          warnings: []
        }
      ],
      tags: ['reflection', 'daily', 'awareness'],
      prerequisites: [],
      learningObjectives: [
        'Build daily reflection habit',
        'Increase emotional awareness',
        'Practice mindful attention to relationships'
      ]
    };
  }

  /**
   * Generate learning recommendations based on assessment results
   */
  async recommendLearningFocus(
    assessmentResults: any[],
    userGoals: Goal[]
  ): Promise<{
    priorityAreas: string[];
    suggestedModules: string[];
    estimatedTimeCommitment: number;
    difficultyRecommendation: 'beginner' | 'intermediate' | 'advanced';
  }> {
    // Analyze assessment results to determine focus areas
    const priorityAreas: string[] = [];
    const suggestedModules: string[] = [];
    
    // Basic heuristic analysis (in production, use AI for this)
    if (assessmentResults.some(result => result.category === 'communication')) {
      priorityAreas.push('communication');
      suggestedModules.push('active-listening', 'clear-expression');
    }
    
    if (assessmentResults.some(result => result.category === 'emotional_intelligence')) {
      priorityAreas.push('emotional_intelligence');
      suggestedModules.push('emotion-recognition', 'empathy-building');
    }
    
    // Default recommendations
    if (priorityAreas.length === 0) {
      priorityAreas.push('communication', 'self_awareness');
      suggestedModules.push('communication-basics', 'self-reflection');
    }
    
    return {
      priorityAreas,
      suggestedModules,
      estimatedTimeCommitment: 30, // minutes per week
      difficultyRecommendation: 'beginner'
    };
  }

  /**
   * Track learning progress and adjust recommendations
   */
  trackProgress(
    userId: string,
    completedPractices: string[],
    timeSpent: number,
    userFeedback?: string
  ): {
    progressScore: number;
    insights: string[];
    nextRecommendations: string[];
  } {
    const progressScore = Math.min(100, (completedPractices.length / 10) * 100);
    
    const insights: string[] = [];
    if (completedPractices.length >= 5) {
      insights.push('Great consistency! You\'re building strong habits.');
    }
    if (timeSpent > 150) {
      insights.push('You\'re dedicating good time to your development.');
    }
    
    const nextRecommendations = [
      'Try applying one skill in a real conversation today',
      'Reflect on how your new skills are impacting your relationships',
      'Consider sharing your learning journey with someone you trust'
    ];
    
    return {
      progressScore,
      insights: insights.length > 0 ? insights : ['Keep up the great work!'],
      nextRecommendations
    };
  }
}