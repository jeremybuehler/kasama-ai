/**
 * Communication Advisor Agent
 * 
 * Specializes in conflict resolution coaching, communication strategies,
 * and personalized advice for challenging interpersonal situations.
 */

import { ProviderManager } from '../core/provider-manager';
import { SemanticCache } from '../core/semantic-cache';
import { ErrorHandler } from '../core/error-handler';
import { AGENT_CONFIGS } from '../constants';
import {
  AIRequest,
  AIResponse,
  ConflictResolutionInput,
  ConflictResolutionOutput,
  ConflictScenario,
  CommunicationStyle,
  RelationshipContext,
  ResolutionStrategy,
  CommunicationTechnique,
  ScriptSuggestion,
  AlternativeApproach,
  UserProfile
} from '../types';

export interface CommunicationContext {
  urgency: 'immediate' | 'soon' | 'when_ready';
  emotionalState: 'calm' | 'stressed' | 'angry' | 'sad' | 'confused';
  previousAttempts: number;
  preferredApproach: 'direct' | 'gentle' | 'collaborative' | 'assertive';
  culturalConsiderations: string[];
  timeConstraints: string;
}

export interface CommunicationAssessment {
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedTechniques: string[];
  personalizedTips: string[];
  practiceExercises: string[];
  confidenceBuilders: string[];
}

export interface DialogueCoaching {
  scenario: string;
  yourLines: ScriptSuggestion[];
  likelyResponses: Array<{
    response: string;
    howToHandle: string;
    followUpOptions: string[];
  }>;
  recoveryStrategies: string[];
  successIndicators: string[];
}

export class CommunicationAdvisor {
  private providerManager: ProviderManager;
  private cache: SemanticCache;
  private errorHandler: ErrorHandler;
  private config = AGENT_CONFIGS.communication_advisor;
  private conversationHistory: Map<string, Array<{ scenario: string; advice: string; outcome?: string }>> = new Map();

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
   * Provide conflict resolution strategies and communication guidance
   */
  async resolveConflict(
    input: ConflictResolutionInput,
    context?: CommunicationContext
  ): Promise<ConflictResolutionOutput> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: 'communication-advisor',
      agentType: 'communication_advisor',
      inputData: {
        ...input,
        context,
        conversationHistory: this.getRecentHistory('conflict', 3)
      },
      priority: 'high',
      maxTokens: this.config.maxTokens
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseConflictResolutionResponse(cachedResponse);
      }

      const prompt = this.buildConflictResolutionPrompt(input, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      const result = this.parseConflictResolutionResponse(response);
      this.recordAdvice('conflict', input.scenario.description, JSON.stringify(result));
      
      return result;
      
    } catch (error) {
      this.errorHandler.handleError(error, {
        agentType: 'communication_advisor',
        requestId
      });
      
      return this.generateFallbackConflictResolution(input, context);
    }
  }

  /**
   * Assess communication style and provide personalized improvement plan
   */
  async assessCommunicationStyle(
    userProfile: UserProfile,
    selfReportedStyle: CommunicationStyle,
    recentExamples: string[],
    context?: CommunicationContext
  ): Promise<CommunicationAssessment> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: userProfile.id,
      agentType: 'communication_advisor',
      inputData: {
        userProfile,
        selfReportedStyle,
        recentExamples,
        context,
        assessment: true
      },
      priority: 'medium',
      maxTokens: this.config.maxTokens
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseCommunicationAssessmentResponse(cachedResponse);
      }

      const prompt = this.buildCommunicationAssessmentPrompt(userProfile, selfReportedStyle, recentExamples, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      return this.parseCommunicationAssessmentResponse(response);
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'communication_advisor' });
      return this.generateFallbackCommunicationAssessment(selfReportedStyle);
    }
  }

  /**
   * Provide dialogue coaching for specific upcoming conversations
   */
  async coachDialogue(
    scenario: string,
    userGoals: string[],
    concernedAbout: string[],
    relationshipContext: RelationshipContext,
    context?: CommunicationContext
  ): Promise<DialogueCoaching> {
    const requestId = crypto.randomUUID();
    
    const request: AIRequest = {
      id: requestId,
      userId: 'dialogue-coach',
      agentType: 'communication_advisor',
      inputData: {
        scenario,
        userGoals,
        concernedAbout,
        relationshipContext,
        context,
        dialogueCoaching: true
      },
      priority: 'high',
      maxTokens: this.config.maxTokens
    };

    try {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        return this.parseDialogueCoachingResponse(cachedResponse);
      }

      const prompt = this.buildDialogueCoachingPrompt(scenario, userGoals, concernedAbout, relationshipContext, context);
      const providerRequest = { ...request, inputData: { prompt, ...request.inputData } };
      
      const response = await this.providerManager.processRequest(providerRequest);
      await this.cache.set(request, response);
      
      const result = this.parseDialogueCoachingResponse(response);
      this.recordAdvice('dialogue', scenario, JSON.stringify(result));
      
      return result;
      
    } catch (error) {
      this.errorHandler.handleError(error, { agentType: 'communication_advisor' });
      return this.generateFallbackDialogueCoaching(scenario, userGoals);
    }
  }

  /**
   * Generate quick communication tips for immediate situations
   */
  async getQuickTips(
    situation: 'before_difficult_conversation' | 'during_conflict' | 'after_argument' | 'feeling_misunderstood' | 'need_to_apologize',
    context?: CommunicationContext
  ): Promise<{
    immediateActions: string[];
    thingsToAvoid: string[];
    phrases: {
      helpful: string[];
      harmful: string[];
    };
    followUp: string[];
  }> {
    const tips = {
      before_difficult_conversation: {
        immediateActions: [
          'Take 3 deep breaths to center yourself',
          'Clarify your main goal for the conversation',
          'Choose a private, comfortable setting',
          'Start with a positive intention: "I care about our relationship"'
        ],
        thingsToAvoid: [
          'Having the conversation when emotions are high',
          'Bringing up past grievances',
          'Using absolute words like "always" or "never"',
          'Assuming you know their intentions'
        ],
        phrases: {
          helpful: [
            '"I\'d like to talk about... because I care about us"',
            '"I\'ve been feeling... and I\'d love your perspective"',
            '"Can we find a time to discuss something important?"',
            '"I want to understand your point of view"'
          ],
          harmful: [
            '"We need to talk" (sounds ominous)',
            '"You always..." or "You never..."',
            '"This is all your fault"',
            '"If you really cared, you would..."'
          ]
        },
        followUp: [
          'Schedule a specific time if emotions are high',
          'Prepare to listen as much as you speak',
          'Have realistic expectations for one conversation'
        ]
      },
      during_conflict: {
        immediateActions: [
          'Pause and breathe before responding',
          'Listen to understand, not to win',
          'Use "I" statements to express your feelings',
          'Acknowledge their perspective: "I hear that you feel..."'
        ],
        thingsToAvoid: [
          'Raising your voice or matching their intensity',
          'Bringing up unrelated issues',
          'Name-calling or personal attacks',
          'Trying to "win" the argument'
        ],
        phrases: {
          helpful: [
            '"I need a moment to process what you\'re saying"',
            '"Help me understand your perspective"',
            '"I feel... when... because..."',
            '"What would a good solution look like to you?"'
          ],
          harmful: [
            '"You\'re being ridiculous"',
            '"That\'s not what happened"',
            '"You\'re too sensitive"',
            '"Just calm down"'
          ]
        },
        followUp: [
          'Take a break if emotions escalate',
          'Summarize what you heard to ensure understanding',
          'Focus on finding solutions, not proving points'
        ]
      },
      after_argument: {
        immediateActions: [
          'Give yourself time to cool down',
          'Reflect on what happened without blame',
          'Consider their perspective',
          'Think about what you\'d like to repair or clarify'
        ],
        thingsToAvoid: [
          'Rehashing the argument immediately',
          'Venting to others before talking to them',
          'Making assumptions about their intentions',
          'Ignoring the issue and hoping it goes away'
        ],
        phrases: {
          helpful: [
            '"I\'d like to talk about what happened earlier"',
            '"I realize I may have said things that hurt you"',
            '"I value our relationship and want to work this out"',
            '"What can we do differently next time?"'
          ],
          harmful: [
            '"I told you so"',
            '"See? You did it again"',
            '"I\'m not apologizing for telling the truth"',
            '"You started it"'
          ]
        },
        followUp: [
          'Plan to circle back when you\'re both calmer',
          'Focus on repair, not rehashing',
          'Make agreements about how to handle future disagreements'
        ]
      },
      feeling_misunderstood: {
        immediateActions: [
          'Pause before assuming bad intent',
          'Ask clarifying questions',
          'Share your perspective calmly',
          'Check if this is the right time for the conversation'
        ],
        thingsToAvoid: [
          'Getting defensive immediately',
          'Assuming they meant to hurt you',
          'Shutting down or withdrawing completely',
          'Explaining the same thing repeatedly'
        ],
        phrases: {
          helpful: [
            '"I don\'t think I\'m explaining this clearly..."',
            '"Let me try to share this differently"',
            '"I\'m feeling misunderstood. Can we start over?"',
            '"What did you hear me say?"'
          ],
          harmful: [
            '"You\'re not listening"',
            '"You don\'t understand anything"',
            '"Forget it, never mind"',
            '"Why don\'t you get it?"'
          ]
        },
        followUp: [
          'Try a different approach or timing',
          'Ask what would help them understand',
          'Consider if the issue is worth pursuing'
        ]
      },
      need_to_apologize: {
        immediateActions: [
          'Take full responsibility for your part',
          'Be specific about what you\'re sorry for',
          'Acknowledge the impact on them',
          'Commit to different behavior going forward'
        ],
        thingsToAvoid: [
          'Making excuses or justifying your behavior',
          'Saying "I\'m sorry, but..."',
          'Minimizing their feelings',
          'Expecting immediate forgiveness'
        ],
        phrases: {
          helpful: [
            '"I\'m sorry I... That must have felt..."',
            '"I take full responsibility for..."',
            '"You didn\'t deserve that, and I was wrong"',
            '"How can I make this right?"'
          ],
          harmful: [
            '"I\'m sorry you feel that way"',
            '"I\'m sorry, but you also..."',
            '"I didn\'t mean it that way"',
            '"I\'m sorry if I hurt you"'
          ]
        },
        followUp: [
          'Give them time to process your apology',
          'Follow through on any commitments you make',
          'Show changed behavior, not just words'
        ]
      }
    };

    return tips[situation] || tips.before_difficult_conversation;
  }

  private buildConflictResolutionPrompt(input: ConflictResolutionInput, context?: CommunicationContext): string {
    const contextInfo = context ? `
Communication Context:
- Urgency: ${context.urgency}
- Emotional State: ${context.emotionalState}
- Previous Attempts: ${context.previousAttempts}
- Preferred Approach: ${context.preferredApproach}
- Cultural Considerations: ${context.culturalConsiderations.join(', ') || 'None specified'}
- Time Constraints: ${context.timeConstraints}` : '';
    
    return `You are an expert communication advisor specializing in conflict resolution. Provide comprehensive, actionable guidance for this situation.

Conflict Scenario:
${JSON.stringify(input.scenario, null, 2)}

User's Communication Style:
${input.userStyle ? JSON.stringify(input.userStyle, null, 2) : 'Not provided'}

Relationship Context:
${input.relationshipContext ? JSON.stringify(input.relationshipContext, null, 2) : 'Not provided'}

Previous Attempts:
${input.previousAttempts ? JSON.stringify(input.previousAttempts, null, 2) : 'None'}${contextInfo}

Provide conflict resolution guidance in this JSON format:
{
  "strategy": {
    "name": "<strategy name>",
    "description": "<detailed description>",
    "steps": [
      {
        "order": 1,
        "action": "<specific action>",
        "rationale": "<why this step>",
        "expectedOutcome": "<what to expect>",
        "alternatives": ["<alternative if this doesn't work>"],
        "timeframe": "<when to do this>"
      }
    ],
    "timeframe": "<overall timeframe>",
    "successRate": <0-1 probability>,
    "prerequisites": ["<what needs to be true first>"],
    "warnings": ["<potential risks>"]
  },
  "techniques": [
    {
      "name": "<technique name>",
      "description": "<how to use it>",
      "whenToUse": ["<situation>"],
      "howToImplement": ["<implementation step>"],
      "examples": ["<example>"],
      "commonMistakes": ["<what to avoid>"],
      "effectiveness": <0-1 score>
    }
  ],
  "scriptSuggestions": [
    {
      "situation": "<when to use this>",
      "approach": "direct|gentle|firm|collaborative",
      "script": "<exact words to consider>",
      "tone": "<how to say it>",
      "bodyLanguage": ["<nonverbal tips>"],
      "followUp": ["<what to do next>"]
    }
  ],
  "alternativeApproaches": [
    {
      "name": "<alternative name>",
      "description": "<description>",
      "whenToConsider": ["<when this is better>"],
      "pros": ["<advantage>"],
      "cons": ["<disadvantage>"],
      "implementationSteps": ["<how to do it>"]
    }
  ],
  "followUpActions": ["<what to do after>"],
  "successPredictors": ["<signs this is working>"]
}

Focus on:
1. Practical, specific guidance
2. Empathy for all parties involved
3. De-escalation and understanding
4. Long-term relationship health
5. Cultural sensitivity and respect
6. Realistic expectations and outcomes`;
  }

  private buildCommunicationAssessmentPrompt(
    userProfile: UserProfile,
    selfReportedStyle: CommunicationStyle,
    recentExamples: string[],
    context?: CommunicationContext
  ): string {
    return `Assess this user's communication style and provide personalized improvement guidance.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Self-Reported Communication Style:
${JSON.stringify(selfReportedStyle, null, 2)}

Recent Communication Examples:
${recentExamples.map((example, i) => `${i + 1}. ${example}`).join('\n')}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide assessment in this JSON format:
{
  "strengthAreas": ["<communication strength>"],
  "improvementAreas": ["<area to develop>"],
  "recommendedTechniques": ["<specific technique to learn>"],
  "personalizedTips": ["<tip tailored to their style>"],
  "practiceExercises": ["<exercise to practice>"],
  "confidenceBuilders": ["<ways to build communication confidence>"]
}

Consider:
1. Patterns in their examples
2. Alignment between self-perception and examples
3. Specific, actionable improvements
4. Building on existing strengths
5. Addressing confidence and comfort levels`;
  }

  private buildDialogueCoachingPrompt(
    scenario: string,
    userGoals: string[],
    concernedAbout: string[],
    relationshipContext: RelationshipContext,
    context?: CommunicationContext
  ): string {
    return `Provide dialogue coaching for this upcoming conversation.

Scenario: ${scenario}

User's Goals:
${userGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n')}

What They're Concerned About:
${concernedAbout.map((concern, i) => `${i + 1}. ${concern}`).join('\n')}

Relationship Context:
${JSON.stringify(relationshipContext, null, 2)}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide coaching in this JSON format:
{
  "scenario": "<scenario summary>",
  "yourLines": [
    {
      "situation": "<when to use>",
      "approach": "direct|gentle|firm|collaborative",
      "script": "<suggested words>",
      "tone": "<how to deliver>",
      "bodyLanguage": ["<nonverbal cues>"],
      "followUp": ["<next steps>"]
    }
  ],
  "likelyResponses": [
    {
      "response": "<what they might say>",
      "howToHandle": "<your response strategy>",
      "followUpOptions": ["<possible next moves>"]
    }
  ],
  "recoveryStrategies": ["<if things go wrong>"],
  "successIndicators": ["<signs the conversation is going well>"]
}

Focus on:
1. Preparing for multiple scenarios
2. Specific language and phrasing
3. Handling difficult responses
4. Maintaining relationship focus
5. Achieving user's stated goals`;
  }

  private parseConflictResolutionResponse(response: AIResponse): ConflictResolutionOutput {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return this.validateConflictResolutionOutput(parsed);
    } catch (error) {
      console.error('Failed to parse conflict resolution response:', error);
      return this.createDefaultConflictResolution();
    }
  }

  private parseCommunicationAssessmentResponse(response: AIResponse): CommunicationAssessment {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return {
        strengthAreas: Array.isArray(parsed.strengthAreas) ? parsed.strengthAreas : ['Active participation'],
        improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : ['Continued growth'],
        recommendedTechniques: Array.isArray(parsed.recommendedTechniques) ? parsed.recommendedTechniques : ['Active listening'],
        personalizedTips: Array.isArray(parsed.personalizedTips) ? parsed.personalizedTips : ['Practice daily'],
        practiceExercises: Array.isArray(parsed.practiceExercises) ? parsed.practiceExercises : ['Daily reflection'],
        confidenceBuilders: Array.isArray(parsed.confidenceBuilders) ? parsed.confidenceBuilders : ['Start small']
      };
    } catch (error) {
      console.error('Failed to parse communication assessment response:', error);
      return this.createDefaultCommunicationAssessment();
    }
  }

  private parseDialogueCoachingResponse(response: AIResponse): DialogueCoaching {
    try {
      let parsed;
      if (typeof response.output === 'string') {
        parsed = JSON.parse(response.output);
      } else {
        parsed = response.output;
      }
      
      return {
        scenario: parsed.scenario || 'Upcoming conversation',
        yourLines: Array.isArray(parsed.yourLines) ? parsed.yourLines : [this.createDefaultScriptSuggestion()],
        likelyResponses: Array.isArray(parsed.likelyResponses) ? parsed.likelyResponses : [],
        recoveryStrategies: Array.isArray(parsed.recoveryStrategies) ? parsed.recoveryStrategies : ['Stay calm and refocus'],
        successIndicators: Array.isArray(parsed.successIndicators) ? parsed.successIndicators : ['Mutual understanding']
      };
    } catch (error) {
      console.error('Failed to parse dialogue coaching response:', error);
      return this.createDefaultDialogueCoaching();
    }
  }

  private validateConflictResolutionOutput(output: any): ConflictResolutionOutput {
    return {
      strategy: output.strategy || this.createDefaultStrategy(),
      techniques: Array.isArray(output.techniques) ? output.techniques : [this.createDefaultTechnique()],
      scriptSuggestions: Array.isArray(output.scriptSuggestions) ? output.scriptSuggestions : [this.createDefaultScriptSuggestion()],
      alternativeApproaches: Array.isArray(output.alternativeApproaches) ? output.alternativeApproaches : [],
      followUpActions: Array.isArray(output.followUpActions) ? output.followUpActions : ['Follow up later'],
      successPredictors: Array.isArray(output.successPredictors) ? output.successPredictors : ['Improved understanding']
    };
  }

  private generateFallbackConflictResolution(input: ConflictResolutionInput, context?: CommunicationContext): ConflictResolutionOutput {
    return {
      strategy: {
        name: 'Calm Communication Approach',
        description: 'Focus on understanding each other and finding common ground',
        steps: [
          {
            order: 1,
            action: 'Take time to calm down and prepare',
            rationale: 'Emotional regulation leads to better outcomes',
            expectedOutcome: 'Clearer thinking and better self-control',
            alternatives: ['Take a longer break if needed'],
            timeframe: '10-30 minutes before the conversation'
          },
          {
            order: 2,
            action: 'Start with a positive intention',
            rationale: 'Sets a collaborative tone',
            expectedOutcome: 'Reduced defensiveness',
            alternatives: ['Acknowledge the difficulty of the conversation'],
            timeframe: 'First minute of conversation'
          }
        ],
        timeframe: 'One conversation, may need follow-up',
        successRate: 0.7,
        prerequisites: ['Both parties willing to talk'],
        warnings: ['May need multiple conversations for complex issues']
      },
      techniques: [this.createDefaultTechnique()],
      scriptSuggestions: [this.createDefaultScriptSuggestion()],
      alternativeApproaches: [
        {
          name: 'Written Communication First',
          description: 'Sometimes writing out thoughts first can clarify the conversation',
          whenToConsider: ['High emotions', 'Complex issues', 'History of arguments'],
          pros: ['Time to think', 'Clear expression'],
          cons: ['Less personal', 'Might delay resolution'],
          implementationSteps: ['Write your thoughts', 'Share and discuss', 'Have follow-up conversation']
        }
      ],
      followUpActions: [
        'Check in after a day or two',
        'Notice if agreements are being kept',
        'Be willing to adjust the approach if needed'
      ],
      successPredictors: [
        'Both people feel heard',
        'Concrete agreements are made',
        'Emotional tension decreases'
      ]
    };
  }

  private generateFallbackCommunicationAssessment(selfReportedStyle: CommunicationStyle): CommunicationAssessment {
    return {
      strengthAreas: [
        'Shows interest in improving communication',
        'Self-aware about communication patterns'
      ],
      improvementAreas: [
        'Practice active listening techniques',
        'Develop emotional regulation skills'
      ],
      recommendedTechniques: [
        'I-statements for expressing feelings',
        'Paraphrasing to confirm understanding',
        'Taking breaks when emotions run high'
      ],
      personalizedTips: [
        'Start with low-stakes conversations to practice',
        'Notice your emotional state before important conversations',
        'Ask questions to understand others\' perspectives'
      ],
      practiceExercises: [
        'Daily: Ask one clarifying question in conversations',
        'Weekly: Practice expressing appreciation to someone',
        'Monthly: Have a deeper conversation with someone you care about'
      ],
      confidenceBuilders: [
        'Remember that everyone is learning to communicate better',
        'Focus on progress, not perfection',
        'Celebrate small improvements in your interactions'
      ]
    };
  }

  private generateFallbackDialogueCoaching(scenario: string, userGoals: string[]): DialogueCoaching {
    return {
      scenario: scenario || 'Upcoming important conversation',
      yourLines: [this.createDefaultScriptSuggestion()],
      likelyResponses: [
        {
          response: 'They might initially be defensive',
          howToHandle: 'Stay calm and acknowledge their feelings',
          followUpOptions: ['Ask questions to understand their perspective', 'Share your own feelings using I-statements']
        },
        {
          response: 'They might be more receptive than expected',
          howToHandle: 'Express appreciation for their openness',
          followUpOptions: ['Work together on solutions', 'Make specific agreements']
        }
      ],
      recoveryStrategies: [
        'If emotions escalate, suggest taking a break',
        'Return to your shared goals for the relationship',
        'Ask: "What would help us move forward?"
      ],
      successIndicators: [
        'Both people feel heard and understood',
        'You make progress toward your stated goals',
        'The conversation ends with a plan or agreement'
      ]
    };
  }

  private createDefaultConflictResolution(): ConflictResolutionOutput {
    return {
      strategy: this.createDefaultStrategy(),
      techniques: [this.createDefaultTechnique()],
      scriptSuggestions: [this.createDefaultScriptSuggestion()],
      alternativeApproaches: [],
      followUpActions: ['Follow up to see how things are going'],
      successPredictors: ['Better understanding between both parties']
    };
  }

  private createDefaultStrategy(): ResolutionStrategy {
    return {
      name: 'Understanding-First Approach',
      description: 'Focus on understanding each other before trying to solve the problem',
      steps: [
        {
          order: 1,
          action: 'Listen to understand their perspective',
          rationale: 'People need to feel heard before they can hear others',
          expectedOutcome: 'They feel valued and understood',
          alternatives: ['Ask questions if you\'re not understanding'],
          timeframe: 'First part of conversation'
        }
      ],
      timeframe: 'One focused conversation',
      successRate: 0.8,
      prerequisites: ['Willingness to listen'],
      warnings: ['May take longer than expected']
    };
  }

  private createDefaultTechnique(): CommunicationTechnique {
    return {
      name: 'Active Listening',
      description: 'Listen fully and reflect back what you hear',
      whenToUse: ['When someone is sharing something important', 'During disagreements'],
      howToImplement: ['Put away distractions', 'Make eye contact', 'Summarize what you heard'],
      examples: ['"What I hear you saying is..."', '"It sounds like you felt..."'],
      commonMistakes: ['Preparing your response while they\'re talking', 'Judging what they\'re saying'],
      effectiveness: 0.9
    };
  }

  private createDefaultScriptSuggestion(): ScriptSuggestion {
    return {
      situation: 'Starting a difficult conversation',
      approach: 'gentle',
      script: 'I care about our relationship and would like to talk about something that\'s been on my mind. Is this a good time?',
      tone: 'Warm but serious',
      bodyLanguage: ['Open posture', 'Eye contact', 'Relaxed expression'],
      followUp: ['Wait for their response', 'Adjust timing if needed', 'Start with your feelings, not accusations']
    };
  }

  private createDefaultCommunicationAssessment(): CommunicationAssessment {
    return {
      strengthAreas: ['Willingness to learn', 'Self-reflection'],
      improvementAreas: ['Active listening', 'Emotional expression'],
      recommendedTechniques: ['I-statements', 'Paraphrasing'],
      personalizedTips: ['Practice with low-stakes conversations', 'Notice emotional reactions'],
      practiceExercises: ['Daily check-ins', 'Weekly deeper conversations'],
      confidenceBuilders: ['Start small', 'Celebrate progress']
    };
  }

  private createDefaultDialogueCoaching(): DialogueCoaching {
    return {
      scenario: 'Important conversation',
      yourLines: [this.createDefaultScriptSuggestion()],
      likelyResponses: [],
      recoveryStrategies: ['Stay calm', 'Return to the main point'],
      successIndicators: ['Mutual understanding', 'Forward progress']
    };
  }

  private recordAdvice(type: string, scenario: string, advice: string): void {
    if (!this.conversationHistory.has(type)) {
      this.conversationHistory.set(type, []);
    }
    
    const history = this.conversationHistory.get(type)!;
    history.push({ scenario, advice });
    
    // Keep only last 10 entries per type
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  private getRecentHistory(type: string, limit: number): Array<{ scenario: string; advice: string }> {
    const history = this.conversationHistory.get(type) || [];
    return history.slice(-limit);
  }

  /**
   * Get communication advisor analytics
   */
  getCommunicationAnalytics(): {
    totalAdviceGiven: number;
    conflictResolutions: number;
    assessmentsProvided: number;
    dialogueCoaching: number;
    successRate: number;
    topChallenges: Record<string, number>;
  } {
    // Mock analytics - in production, this would query actual data
    return {
      totalAdviceGiven: 0,
      conflictResolutions: 0,
      assessmentsProvided: 0,
      dialogueCoaching: 0,
      successRate: 0.85,
      topChallenges: {
        'difficult_conversations': 35,
        'conflict_resolution': 25,
        'emotional_expression': 20,
        'active_listening': 15,
        'boundary_setting': 5
      }
    };
  }
}