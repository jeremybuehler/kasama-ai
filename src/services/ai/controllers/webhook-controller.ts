/**
 * Webhook Controller
 * Handles webhooks from AI providers and external integrations
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { AIOrchestrator } from '../orchestrator';

// Webhook validation schemas
const anthropicWebhookSchema = z.object({
  type: z.string(),
  id: z.string(),
  created_at: z.string(),
  data: z.object({
    id: z.string(),
    type: z.string(),
    status: z.enum(['completed', 'failed', 'cancelled']),
    usage: z.object({
      input_tokens: z.number(),
      output_tokens: z.number()
    }).optional(),
    result: z.unknown().optional(),
    error: z.object({
      type: z.string(),
      message: z.string()
    }).optional()
  })
});

const openaiWebhookSchema = z.object({
  id: z.string(),
  object: z.string(),
  created_at: z.number(),
  type: z.string(),
  data: z.object({
    id: z.string(),
    status: z.enum(['succeeded', 'failed', 'cancelled']),
    usage: z.object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number()
    }).optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      type: z.string()
    }).optional()
  })
});

const genericWebhookSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'custom']),
  requestId: z.string(),
  status: z.enum(['completed', 'failed', 'processing']),
  data: z.unknown(),
  timestamp: z.string()
});

export class WebhookController {
  private orchestrator: AIOrchestrator;
  private webhookSecrets: Map<string, string> = new Map();
  private pendingRequests = new Map<string, { resolve: Function; reject: Function; timestamp: Date }>();

  constructor(orchestrator?: AIOrchestrator) {
    this.orchestrator = orchestrator || new AIOrchestrator({
      enableCaching: true,
      enableRateLimiting: true,
      enableMetrics: true,
      maxConcurrentRequests: 10
    });

    // Initialize webhook secrets from environment
    this.webhookSecrets.set('anthropic', process.env.ANTHROPIC_WEBHOOK_SECRET || '');
    this.webhookSecrets.set('openai', process.env.OPENAI_WEBHOOK_SECRET || '');
  }

  /**
   * Handle Anthropic webhook
   */
  async handleAnthropicWebhook(req: Request, res: Response) {
    try {
      // Verify webhook signature
      if (!this.verifyAnthropicSignature(req)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      const webhook = anthropicWebhookSchema.parse(req.body);
      
      // Process webhook based on type
      switch (webhook.type) {
        case 'message.completed':
          await this.handleMessageCompleted(webhook.data, 'anthropic');
          break;
        case 'message.failed':
          await this.handleMessageFailed(webhook.data, 'anthropic');
          break;
        case 'usage.updated':
          await this.handleUsageUpdate(webhook.data, 'anthropic');
          break;
        default:
          console.warn(`Unknown Anthropic webhook type: ${webhook.type}`);
      }

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      console.error('Anthropic webhook error:', error);
      this.handleWebhookError(error, res);
    }
  }

  /**
   * Handle OpenAI webhook
   */
  async handleOpenAIWebhook(req: Request, res: Response) {
    try {
      // Verify webhook signature
      if (!this.verifyOpenAISignature(req)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      const webhook = openaiWebhookSchema.parse(req.body);
      
      // Process webhook based on type
      switch (webhook.type) {
        case 'completion.succeeded':
          await this.handleCompletionSucceeded(webhook.data, 'openai');
          break;
        case 'completion.failed':
          await this.handleCompletionFailed(webhook.data, 'openai');
          break;
        case 'fine_tuning.job.succeeded':
          await this.handleFineTuningComplete(webhook.data);
          break;
        default:
          console.warn(`Unknown OpenAI webhook type: ${webhook.type}`);
      }

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      console.error('OpenAI webhook error:', error);
      this.handleWebhookError(error, res);
    }
  }

  /**
   * Handle generic webhook for custom integrations
   */
  async handleGenericWebhook(req: Request, res: Response) {
    try {
      const webhook = genericWebhookSchema.parse(req.body);
      
      // Process based on provider
      switch (webhook.provider) {
        case 'custom':
          await this.handleCustomWebhook(webhook);
          break;
        default:
          await this.handleGenericUpdate(webhook);
      }

      res.json({
        success: true,
        message: 'Generic webhook processed successfully'
      });

    } catch (error) {
      console.error('Generic webhook error:', error);
      this.handleWebhookError(error, res);
    }
  }

  /**
   * Register webhook endpoint for async responses
   */
  async registerWebhookCallback(req: Request, res: Response) {
    try {
      const { requestId, callbackUrl, expirationMinutes = 60 } = req.body;
      
      if (!requestId || !callbackUrl) {
        return res.status(400).json({
          success: false,
          error: 'requestId and callbackUrl are required'
        });
      }

      // Store callback information (in production, use Redis or database)
      const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000);
      
      // This would typically be stored in a persistent store
      const callbackInfo = {
        requestId,
        callbackUrl,
        expirationTime,
        registered: new Date()
      };

      res.json({
        success: true,
        message: 'Webhook callback registered successfully',
        callbackInfo: {
          requestId,
          expirationTime: expirationTime.toISOString(),
          webhookUrl: `/api/ai/webhooks/callback/${requestId}`
        }
      });

    } catch (error) {
      this.handleWebhookError(error, res);
    }
  }

  /**
   * Handle webhook callback for specific request
   */
  async handleWebhookCallback(req: Request, res: Response) {
    try {
      const requestId = req.params.requestId;
      const callbackData = req.body;
      
      // Find pending request
      const pendingRequest = this.pendingRequests.get(requestId);
      
      if (!pendingRequest) {
        return res.status(404).json({
          success: false,
          error: 'Request not found or already processed'
        });
      }

      // Process callback
      if (callbackData.success) {
        pendingRequest.resolve(callbackData.data);
      } else {
        pendingRequest.reject(new Error(callbackData.error || 'Callback failed'));
      }

      // Clean up
      this.pendingRequests.delete(requestId);

      res.json({
        success: true,
        message: 'Callback processed successfully'
      });

    } catch (error) {
      this.handleWebhookError(error, res);
    }
  }

  /**
   * Get webhook status and statistics
   */
  async getWebhookStats(req: Request, res: Response) {
    try {
      const stats = {
        pendingCallbacks: this.pendingRequests.size,
        registeredSecrets: this.webhookSecrets.size,
        uptime: process.uptime(),
        lastActivity: new Date().toISOString()
      };

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleWebhookError(error, res);
    }
  }

  // Private methods

  private verifyAnthropicSignature(req: Request): boolean {
    const signature = req.headers['x-signature'] as string;
    const secret = this.webhookSecrets.get('anthropic');
    
    if (!signature || !secret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  }

  private verifyOpenAISignature(req: Request): boolean {
    const signature = req.headers['openai-signature'] as string;
    const secret = this.webhookSecrets.get('openai');
    
    if (!signature || !secret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    return signature === expectedSignature;
  }

  private async handleMessageCompleted(data: any, provider: string) {
    console.log(`Message completed from ${provider}:`, data.id);
    
    // Update metrics
    await this.orchestrator.recordProviderMetrics(provider, {
      requestId: data.id,
      status: 'completed',
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      completionTime: Date.now()
    });
  }

  private async handleMessageFailed(data: any, provider: string) {
    console.log(`Message failed from ${provider}:`, data.id);
    
    // Update metrics and handle failure
    await this.orchestrator.recordProviderMetrics(provider, {
      requestId: data.id,
      status: 'failed',
      error: data.error?.message,
      completionTime: Date.now()
    });
  }

  private async handleUsageUpdate(data: any, provider: string) {
    console.log(`Usage update from ${provider}:`, data);
    
    // Update cost tracking
    await this.orchestrator.updateCostTracking(provider, {
      tokensUsed: data.usage?.total_tokens || 0,
      estimatedCost: this.calculateCost(data.usage, provider)
    });
  }

  private async handleCompletionSucceeded(data: any, provider: string) {
    console.log(`Completion succeeded from ${provider}:`, data.id);
    
    await this.orchestrator.recordProviderMetrics(provider, {
      requestId: data.id,
      status: 'succeeded',
      tokensUsed: data.usage?.total_tokens || 0,
      completionTime: Date.now()
    });
  }

  private async handleCompletionFailed(data: any, provider: string) {
    console.log(`Completion failed from ${provider}:`, data.id);
    
    await this.orchestrator.recordProviderMetrics(provider, {
      requestId: data.id,
      status: 'failed',
      error: data.error?.message,
      completionTime: Date.now()
    });
  }

  private async handleFineTuningComplete(data: any) {
    console.log('Fine-tuning job completed:', data.id);
    // Handle fine-tuning completion logic
  }

  private async handleCustomWebhook(webhook: any) {
    console.log('Custom webhook received:', webhook.requestId);
    // Handle custom webhook logic
  }

  private async handleGenericUpdate(webhook: any) {
    console.log('Generic webhook update:', webhook.requestId);
    // Handle generic update logic
  }

  private calculateCost(usage: any, provider: string): number {
    // Simple cost calculation - in production, use actual pricing
    const tokensUsed = usage?.total_tokens || usage?.input_tokens + usage?.output_tokens || 0;
    const baseRate = provider === 'anthropic' ? 0.000003 : 0.0000025; // per token
    return tokensUsed * baseRate;
  }

  private handleWebhookError(error: any, res: Response) {
    console.error('Webhook error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default WebhookController;
