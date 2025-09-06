import crypto from 'crypto';
import { supabase } from '../supabase';
import { logger } from '../utils/logger';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  metadata: Record<string, any>;
  resolved: boolean;
  createdAt: Date;
}

export interface PrivacySettings {
  userId: string;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  profileVisibility: 'private' | 'public' | 'friends_only';
  dataRetentionDays: number;
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  updatedAt: Date;
}

export interface GDPRRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

class SecurityService {
  // Data Encryption
  encrypt(data: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
      cipher.setAAD(Buffer.from('kasama-ai-security'));

      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encryptedData,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error('Encryption failed');
    }
  }

  decrypt(encryptedData: EncryptedData): string {
    try {
      const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
      decipher.setAAD(Buffer.from('kasama-ai-security'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error });
      throw new Error('Decryption failed');
    }
  }

  // Hash sensitive data (one-way)
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Verify hash
  verifyHash(data: string, hash: string): boolean {
    return this.hashData(data) === hash;
  }

  // Audit Logging
  async logActivity(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) throw error;

      // Check for suspicious activity patterns
      await this.checkSuspiciousActivity(entry.userId, entry.action);

      logger.info('Activity logged', { 
        userId: entry.userId, 
        action: entry.action, 
        riskLevel: entry.riskLevel 
      });
    } catch (error) {
      logger.error('Failed to log activity', { error, entry });
    }
  }

  // Get audit logs for user
  async getAuditLogs(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 100));
      if (options.startDate) query = query.gte('timestamp', options.startDate.toISOString());
      if (options.endDate) query = query.lte('timestamp', options.endDate.toISOString());
      if (options.actions) query = query.in('action', options.actions);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Failed to retrieve audit logs', { error, userId });
      return [];
    }
  }

  // Security Monitoring
  private async checkSuspiciousActivity(userId: string, action: string): Promise<void> {
    try {
      // Check for rapid repeated actions (potential bot/attack)
      const recentActions = await supabase
        .from('audit_logs')
        .select('action, timestamp')
        .eq('user_id', userId)
        .eq('action', action)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      if (recentActions.data && recentActions.data.length > 10) {
        await this.createSecurityAlert({
          type: 'suspicious_activity',
          severity: 'high',
          description: `Rapid repeated action detected: ${action}`,
          userId,
          metadata: { 
            action, 
            count: recentActions.data.length,
            timeWindow: '5 minutes'
          }
        });
      }

      // Check for failed login attempts
      if (action === 'login_failed') {
        const failedAttempts = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('action', 'login_failed')
          .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 minutes

        if (failedAttempts.data && failedAttempts.data.length >= 5) {
          await this.createSecurityAlert({
            type: 'unauthorized_access',
            severity: 'critical',
            description: 'Multiple failed login attempts detected',
            userId,
            metadata: {
              failedAttempts: failedAttempts.data.length,
              timeWindow: '15 minutes'
            }
          });
        }
      }
    } catch (error) {
      logger.error('Failed to check suspicious activity', { error, userId, action });
    }
  }

  // Create security alert
  async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'resolved' | 'createdAt'>): Promise<void> {
    try {
      const securityAlert = {
        ...alert,
        id: crypto.randomUUID(),
        resolved: false,
        created_at: new Date()
      };

      const { error } = await supabase
        .from('security_alerts')
        .insert(securityAlert);

      if (error) throw error;

      // Send notification for high/critical alerts
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await this.notifySecurityTeam(securityAlert);
      }

      logger.warn('Security alert created', securityAlert);
    } catch (error) {
      logger.error('Failed to create security alert', { error, alert });
    }
  }

  // Privacy Controls
  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      return data || null;
    } catch (error) {
      logger.error('Failed to get privacy settings', { error, userId });
      return null;
    }
  }

  async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const updatedSettings = {
        ...settings,
        user_id: userId,
        updated_at: new Date()
      };

      const { error } = await supabase
        .from('privacy_settings')
        .upsert(updatedSettings);

      if (error) throw error;

      await this.logActivity({
        userId,
        action: 'privacy_settings_updated',
        resource: 'privacy_settings',
        resourceId: userId,
        metadata: settings,
        riskLevel: 'low'
      });

      logger.info('Privacy settings updated', { userId });
    } catch (error) {
      logger.error('Failed to update privacy settings', { error, userId, settings });
      throw error;
    }
  }

  // GDPR Compliance
  async createGDPRRequest(
    userId: string, 
    type: GDPRRequest['type'], 
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const request = {
        id: crypto.randomUUID(),
        user_id: userId,
        type,
        status: 'pending' as const,
        requested_at: new Date(),
        metadata
      };

      const { error } = await supabase
        .from('gdpr_requests')
        .insert(request);

      if (error) throw error;

      await this.logActivity({
        userId,
        action: 'gdpr_request_created',
        resource: 'gdpr_request',
        resourceId: request.id,
        metadata: { type, ...metadata },
        riskLevel: 'medium'
      });

      // Auto-process certain request types
      if (type === 'access' || type === 'portability') {
        await this.processGDPRRequest(request.id);
      }

      logger.info('GDPR request created', { requestId: request.id, userId, type });
      return request.id;
    } catch (error) {
      logger.error('Failed to create GDPR request', { error, userId, type });
      throw error;
    }
  }

  async processGDPRRequest(requestId: string): Promise<void> {
    try {
      const { data: request } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('GDPR request not found');

      await supabase
        .from('gdpr_requests')
        .update({ 
          status: 'processing',
          updated_at: new Date()
        })
        .eq('id', requestId);

      switch (request.type) {
        case 'access':
          await this.handleDataAccessRequest(request);
          break;
        case 'portability':
          await this.handleDataPortabilityRequest(request);
          break;
        case 'erasure':
          await this.handleDataErasureRequest(request);
          break;
        case 'rectification':
          await this.handleDataRectificationRequest(request);
          break;
        case 'restriction':
          await this.handleDataRestrictionRequest(request);
          break;
      }

      await supabase
        .from('gdpr_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date()
        })
        .eq('id', requestId);

      logger.info('GDPR request processed', { requestId, type: request.type });
    } catch (error) {
      logger.error('Failed to process GDPR request', { error, requestId });
      
      // Mark as failed
      await supabase
        .from('gdpr_requests')
        .update({ 
          status: 'rejected',
          updated_at: new Date()
        })
        .eq('id', requestId);
    }
  }

  // Data validation and sanitization
  sanitizeInput(input: string): string {
    // Remove potentially harmful characters and scripts
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Rate limiting and throttling
  async checkRateLimit(userId: string, action: string, limit: number, windowMs: number): Promise<boolean> {
    try {
      const windowStart = new Date(Date.now() - windowMs);
      
      const { data: recentActions } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('action', action)
        .gte('timestamp', windowStart.toISOString());

      const actionCount = recentActions?.length || 0;
      
      if (actionCount >= limit) {
        await this.logActivity({
          userId,
          action: 'rate_limit_exceeded',
          resource: 'rate_limiter',
          metadata: { 
            originalAction: action, 
            count: actionCount, 
            limit, 
            windowMs 
          },
          riskLevel: 'medium'
        });
        
        return false; // Rate limit exceeded
      }

      return true; // Within rate limit
    } catch (error) {
      logger.error('Rate limit check failed', { error, userId, action });
      return false; // Fail secure
    }
  }

  // Private helper methods
  private async notifySecurityTeam(alert: any): Promise<void> {
    // Implementation would depend on notification service
    // Could send to Slack, email, PagerDuty, etc.
    logger.error('Security alert notification', alert);
  }

  private async handleDataAccessRequest(request: any): Promise<void> {
    try {
      // Collect all user data
      const userData = await this.collectUserData(request.user_id);
      
      // Store the data export (in practice, would generate downloadable file)
      await supabase
        .from('data_exports')
        .insert({
          user_id: request.user_id,
          request_id: request.id,
          data: userData,
          created_at: new Date()
        });
    } catch (error) {
      logger.error('Failed to handle data access request', { error, requestId: request.id });
      throw error;
    }
  }

  private async handleDataPortabilityRequest(request: any): Promise<void> {
    // Similar to access request but in portable format
    await this.handleDataAccessRequest(request);
  }

  private async handleDataErasureRequest(request: any): Promise<void> {
    try {
      // Mark user for deletion (soft delete initially)
      await supabase
        .from('users')
        .update({ 
          deleted_at: new Date(),
          email: `deleted_${Date.now()}@kasama.ai`,
          full_name: 'Deleted User'
        })
        .eq('id', request.user_id);

      // Anonymize audit logs
      await supabase
        .from('audit_logs')
        .update({ user_id: 'anonymized' })
        .eq('user_id', request.user_id);

    } catch (error) {
      logger.error('Failed to handle data erasure request', { error, requestId: request.id });
      throw error;
    }
  }

  private async handleDataRectificationRequest(request: any): Promise<void> {
    // Would handle data correction based on request metadata
    logger.info('Data rectification requested', { requestId: request.id });
  }

  private async handleDataRestrictionRequest(request: any): Promise<void> {
    // Would restrict processing of user data
    await supabase
      .from('users')
      .update({ processing_restricted: true })
      .eq('id', request.user_id);
  }

  private async collectUserData(userId: string): Promise<Record<string, any>> {
    try {
      // Collect all user-related data from various tables
      const [profile, preferences, assessments, learningProgress] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('user_preferences').select('*').eq('user_id', userId),
        supabase.from('assessments').select('*').eq('user_id', userId),
        supabase.from('learning_progress').select('*').eq('user_id', userId)
      ]);

      return {
        profile: profile.data,
        preferences: preferences.data,
        assessments: assessments.data,
        learningProgress: learningProgress.data,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to collect user data', { error, userId });
      throw error;
    }
  }
}

export const securityService = new SecurityService();
