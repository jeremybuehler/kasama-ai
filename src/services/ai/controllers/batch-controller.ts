/**
 * Batch Controller
 * Handles batch processing of multiple AI agent requests for efficiency
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AIOrchestrator, BatchRequest, BatchResponse } from '../orchestrator';
import { AIRequest, AgentType } from '../types';

// Validation schemas
const batchRequestSchema = z.object({
  requests: z.array(z.object({
    id: z.string().optional(),
    userId: z.string().optional(),
    agentType: z.enum(['assessment_analyst', 'learning_coach', 'progress_tracker', 'insight_generator', 'communication_advisor'] as const),
    inputData: z.unknown(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(2).optional()
  })).max(50), // Limit batch size
  options: z.object({
    parallel: z.boolean().default(true),
    maxConcurrency: z.number().positive().max(10).default(5),
    failFast: z.boolean().default(false),
    timeout: z.number().positive().default(300000) // 5 minutes
  }).optional()
});

const scheduledBatchSchema = z.object({
  requests: z.array(z.object({
    id: z.string(),
    agentType: z.enum(['assessment_analyst', 'learning_coach', 'progress_tracker', 'insight_generator', 'communication_advisor'] as const),
    inputData: z.unknown(),
    scheduledTime: z.string().datetime(),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  })),
  userId: z.string().uuid(),
  description: z.string().optional()
});

export class BatchController {
  private orchestrator: AIOrchestrator;
  private activeBatches = new Map<string, { status: string; progress: number; results?: any }>();
  private batchQueue: Array<{ id: string; request: BatchRequest; timestamp: Date }> = [];

  constructor(orchestrator?: AIOrchestrator) {
    this.orchestrator = orchestrator || new AIOrchestrator({
      enableCaching: true,
      enableRateLimiting: true,
      enableMetrics: true,
      maxConcurrentRequests: 20, // Higher for batch processing
      performanceLogging: process.env.NODE_ENV === 'development'
    });
  }

  /**
   * Process a batch of AI requests
   */
  async processBatch(req: Request, res: Response) {
    try {
      const validated = batchRequestSchema.parse(req.body);
      const batchId = crypto.randomUUID();
      
      // Convert to AIRequest format
      const aiRequests: AIRequest[] = validated.requests.map((r, index) => ({
        id: r.id || `${batchId}-${index}`,
        userId: r.userId || 'batch',
        agentType: r.agentType,
        inputData: r.inputData,
        priority: r.priority,
        maxTokens: r.maxTokens,
        temperature: r.temperature
      }));

      const batchRequest: BatchRequest = {
        requests: aiRequests,
        options: validated.options || {
          parallel: true,
          maxConcurrency: 5,
          failFast: false
        }
      };

      // Track batch status
      this.activeBatches.set(batchId, {
        status: 'processing',
        progress: 0
      });

      // Process batch asynchronously
      this.processBatchAsync(batchId, batchRequest)
        .then(results => {
          this.activeBatches.set(batchId, {
            status: 'completed',
            progress: 100,
            results
          });
        })
        .catch(error => {
          this.activeBatches.set(batchId, {
            status: 'failed',
            progress: 0,
            results: { error: error.message }
          });
        });

      res.json({
        success: true,
        batchId,
        status: 'accepted',
        message: `Batch with ${aiRequests.length} requests accepted for processing`,
        statusUrl: `/api/ai/batch/${batchId}/status`,
        estimatedCompletion: new Date(Date.now() + (aiRequests.length * 2000)) // Rough estimate
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get batch processing status
   */
  async getBatchStatus(req: Request, res: Response) {
    try {
      const batchId = req.params.batchId;
      const batch = this.activeBatches.get(batchId);

      if (!batch) {
        return res.status(404).json({
          success: false,
          error: 'Batch not found'
        });
      }

      res.json({
        success: true,
        batchId,
        status: batch.status,
        progress: batch.progress,
        results: batch.status === 'completed' ? batch.results : undefined,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Cancel a batch processing job
   */
  async cancelBatch(req: Request, res: Response) {
    try {
      const batchId = req.params.batchId;
      const batch = this.activeBatches.get(batchId);

      if (!batch) {
        return res.status(404).json({
          success: false,
          error: 'Batch not found'
        });
      }

      if (batch.status === 'completed' || batch.status === 'failed') {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel batch with status: ${batch.status}`
        });
      }

      // Mark as cancelled
      this.activeBatches.set(batchId, {
        ...batch,
        status: 'cancelled'
      });

      res.json({
        success: true,
        message: 'Batch cancelled successfully',
        batchId
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Schedule a batch for later processing
   */
  async scheduleBatch(req: Request, res: Response) {
    try {
      const validated = scheduledBatchSchema.parse(req.body);
      const batchId = crypto.randomUUID();
      
      // Convert to batch format
      const batchRequest: BatchRequest = {
        requests: validated.requests.map(r => ({
          id: r.id,
          userId: validated.userId,
          agentType: r.agentType,
          inputData: r.inputData,
          priority: r.priority
        }))
      };

      // Add to queue (in production, use a proper job queue like Bull)
      this.batchQueue.push({
        id: batchId,
        request: batchRequest,
        timestamp: new Date()
      });

      res.json({
        success: true,
        batchId,
        status: 'scheduled',
        message: 'Batch scheduled for processing',
        queuePosition: this.batchQueue.length
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get batch processing statistics
   */
  async getBatchStats(req: Request, res: Response) {
    try {
      const activeBatchCount = Array.from(this.activeBatches.values())
        .filter(b => b.status === 'processing').length;
      
      const completedBatchCount = Array.from(this.activeBatches.values())
        .filter(b => b.status === 'completed').length;
      
      const failedBatchCount = Array.from(this.activeBatches.values())
        .filter(b => b.status === 'failed').length;

      res.json({
        success: true,
        stats: {
          active: activeBatchCount,
          completed: completedBatchCount,
          failed: failedBatchCount,
          queued: this.batchQueue.length,
          total: this.activeBatches.size
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Process batch requests asynchronously
   */
  private async processBatchAsync(batchId: string, batchRequest: BatchRequest): Promise<BatchResponse> {
    const startTime = Date.now();
    const responses: BatchResponse['responses'] = [];
    
    if (batchRequest.options?.parallel !== false) {
      // Process in parallel with concurrency limit
      const concurrency = batchRequest.options?.maxConcurrency || 5;
      const chunks = this.chunkArray(batchRequest.requests, concurrency);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async request => {
          try {
            const response = await this.orchestrator.processGenericRequest(request);
            return { request, response };
          } catch (error) {
            return { 
              request, 
              error: error instanceof Error ? error : new Error('Unknown error') 
            };
          }
        });
        
        const chunkResults = await Promise.all(chunkPromises);
        responses.push(...chunkResults);
        
        // Update progress
        const progress = (responses.length / batchRequest.requests.length) * 100;
        const currentBatch = this.activeBatches.get(batchId);
        if (currentBatch) {
          this.activeBatches.set(batchId, {
            ...currentBatch,
            progress
          });
        }
      }
    } else {
      // Process sequentially
      for (let i = 0; i < batchRequest.requests.length; i++) {
        const request = batchRequest.requests[i];
        try {
          const response = await this.orchestrator.processGenericRequest(request);
          responses.push({ request, response });
        } catch (error) {
          responses.push({ 
            request, 
            error: error instanceof Error ? error : new Error('Unknown error') 
          });
          
          if (batchRequest.options?.failFast) {
            break;
          }
        }
        
        // Update progress
        const progress = ((i + 1) / batchRequest.requests.length) * 100;
        const currentBatch = this.activeBatches.get(batchId);
        if (currentBatch) {
          this.activeBatches.set(batchId, {
            ...currentBatch,
            progress
          });
        }
      }
    }

    const endTime = Date.now();
    const successCount = responses.filter(r => !r.error).length;
    const errorCount = responses.filter(r => r.error).length;
    const cacheHits = responses.filter(r => r.response?.cacheHit).length;

    return {
      responses,
      metrics: {
        totalTime: endTime - startTime,
        successCount,
        errorCount,
        cacheHits
      }
    };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private handleError(error: any, res: Response) {
    console.error('Batch Controller error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default BatchController;
