/**
 * Security Manager - Production-Grade Security Implementation
 * Comprehensive security hardening for Kasama AI platform
 */

import { supabase } from '../supabase'
import { costOptimizer } from '../../services/ai/CostOptimizer'

export interface SecurityConfig {
  enableCSP: boolean
  enableRateLimiting: boolean
  enableXSSProtection: boolean
  enableClickjackingProtection: boolean
  enableContentTypeValidation: boolean
  maxRequestsPerMinute: number
  sessionTimeout: number
  enableRequestLogging: boolean
}

export interface SecurityThreat {
  id: string
  type: 'xss' | 'csrf' | 'injection' | 'brute_force' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  source: string
  timestamp: Date
  blocked: boolean
  metadata?: Record<string, any>
}

export interface RateLimitEntry {
  ip: string
  userId?: string
  requests: number
  windowStart: number
  blocked: boolean
}

export class SecurityManager {
  private static instance: SecurityManager
  private config: SecurityConfig
  private rateLimitMap: Map<string, RateLimitEntry> = new Map()
  private threatLog: SecurityThreat[] = []
  private blockedIPs: Set<string> = new Set()
  private trustedOrigins: Set<string> = new Set()
  
  static getInstance(config?: Partial<SecurityConfig>): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager(config)
    }
    return SecurityManager.instance
  }

  private constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableCSP: true,
      enableRateLimiting: true,
      enableXSSProtection: true,
      enableClickjackingProtection: true,
      enableContentTypeValidation: true,
      maxRequestsPerMinute: 60,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enableRequestLogging: process.env.NODE_ENV !== 'production',
      ...config
    }
    
    this.initializeTrustedOrigins()
    this.setupCSP()
    this.startSecurityMonitoring()
  }

  /**
   * Initialize trusted origins for CORS and CSP
   */
  private initializeTrustedOrigins(): void {
    const origins = [
      'https://kasama-ai.com',
      'https://app.kasama-ai.com',
      'https://api.kasama-ai.com',
      process.env.VITE_APP_URL,
      process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined
    ].filter(Boolean) as string[]

    origins.forEach(origin => this.trustedOrigins.add(origin))
  }

  /**
   * Setup Content Security Policy
   */
  private setupCSP(): void {
    if (!this.config.enableCSP || typeof document === 'undefined') return

    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Vite dev mode
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : undefined
      ].filter(Boolean),
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled components
        'https://fonts.googleapis.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        process.env.VITE_SUPABASE_URL
      ].filter(Boolean),
      'connect-src': [
        "'self'",
        process.env.VITE_SUPABASE_URL,
        'https://api.openai.com',
        'https://api.anthropic.com',
        'wss:',
        process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : undefined
      ].filter(Boolean),
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': []
    }

    const cspString = Object.entries(cspDirectives)
      .map(([directive, sources]) => 
        `${directive} ${sources.join(' ')}`
      )
      .join('; ')

    // Set CSP header (for server-side rendering)
    if (typeof window !== 'undefined' && document.head) {
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = cspString
      document.head.appendChild(meta)
    }
  }

  /**
   * Validate request for security threats
   */
  async validateRequest(
    request: {
      url: string
      method: string
      headers: Record<string, string>
      body?: any
      ip?: string
      userId?: string
    }
  ): Promise<{ allowed: boolean; threat?: SecurityThreat }> {
    try {
      // Rate limiting check
      if (this.config.enableRateLimiting) {
        const rateLimitResult = await this.checkRateLimit(request.ip, request.userId)
        if (!rateLimitResult.allowed) {
          const threat: SecurityThreat = {
            id: `rate_limit_${Date.now()}`,
            type: 'brute_force',
            severity: 'high',
            description: 'Rate limit exceeded',
            source: request.ip || 'unknown',
            timestamp: new Date(),
            blocked: true,
            metadata: { requests: rateLimitResult.requests }
          }
          this.logThreat(threat)
          return { allowed: false, threat }
        }
      }

      // XSS detection
      if (this.config.enableXSSProtection) {
        const xssResult = this.detectXSS(request.body, request.url)
        if (xssResult.detected) {
          const threat: SecurityThreat = {
            id: `xss_${Date.now()}`,
            type: 'xss',
            severity: 'high',
            description: 'Potential XSS attack detected',
            source: request.ip || 'unknown',
            timestamp: new Date(),
            blocked: true,
            metadata: { patterns: xssResult.patterns }
          }
          this.logThreat(threat)
          return { allowed: false, threat }
        }
      }

      // SQL injection detection
      const injectionResult = this.detectInjection(request.body, request.url)
      if (injectionResult.detected) {
        const threat: SecurityThreat = {
          id: `injection_${Date.now()}`,
          type: 'injection',
          severity: 'critical',
          description: 'Potential SQL injection detected',
          source: request.ip || 'unknown',
          timestamp: new Date(),
          blocked: true,
          metadata: { patterns: injectionResult.patterns }
        }
        this.logThreat(threat)
        return { allowed: false, threat }
      }

      // Check blocked IPs
      if (request.ip && this.blockedIPs.has(request.ip)) {
        const threat: SecurityThreat = {
          id: `blocked_ip_${Date.now()}`,
          type: 'suspicious_activity',
          severity: 'high',
          description: 'Request from blocked IP address',
          source: request.ip,
          timestamp: new Date(),
          blocked: true
        }
        this.logThreat(threat)
        return { allowed: false, threat }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Security validation error:', error)
      return { allowed: true } // Fail open for availability
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(
    ip?: string,
    userId?: string
  ): Promise<{ allowed: boolean; requests: number }> {
    const key = userId || ip || 'anonymous'
    const now = Date.now()
    const windowDuration = 60 * 1000 // 1 minute

    let entry = this.rateLimitMap.get(key)
    
    if (!entry || (now - entry.windowStart) > windowDuration) {
      // New window
      entry = {
        ip: ip || 'unknown',
        userId,
        requests: 1,
        windowStart: now,
        blocked: false
      }
    } else {
      // Same window
      entry.requests++
    }

    entry.blocked = entry.requests > this.config.maxRequestsPerMinute

    this.rateLimitMap.set(key, entry)

    // Clean old entries
    if (this.rateLimitMap.size > 10000) {
      this.cleanupRateLimit()
    }

    return {
      allowed: !entry.blocked,
      requests: entry.requests
    }
  }

  /**
   * Detect XSS attacks
   */
  private detectXSS(data: any, url: string): { detected: boolean; patterns: string[] } {
    if (!data) return { detected: false, patterns: [] }

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /document\.cookie/gi,
      /eval\s*\(/gi,
      /alert\s*\(/gi,
      /confirm\s*\(/gi,
      /prompt\s*\(/gi
    ]

    const dataString = typeof data === 'string' ? data : JSON.stringify(data)
    const detectedPatterns: string[] = []

    for (const pattern of xssPatterns) {
      if (pattern.test(dataString)) {
        detectedPatterns.push(pattern.source)
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    }
  }

  /**
   * Detect SQL injection attacks
   */
  private detectInjection(data: any, url: string): { detected: boolean; patterns: string[] } {
    if (!data) return { detected: false, patterns: [] }

    const injectionPatterns = [
      /('|(\\')|(;)|(\\;)|(\\x27)|(\\x2D\\x2D))/gi,
      /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /update\s+.*\s+set/gi,
      /exec\s*\(/gi,
      /sp_executesql/gi
    ]

    const dataString = typeof data === 'string' ? data : JSON.stringify(data)
    const detectedPatterns: string[] = []

    for (const pattern of injectionPatterns) {
      if (pattern.test(dataString)) {
        detectedPatterns.push(pattern.source)
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    }
  }

  /**
   * Log security threat
   */
  private logThreat(threat: SecurityThreat): void {
    this.threatLog.push(threat)
    
    // Keep only recent threats (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.threatLog = this.threatLog.filter(t => t.timestamp >= oneDayAgo)

    // Log to console in development
    if (this.config.enableRequestLogging) {
      console.warn('Security threat detected:', threat)
    }

    // Block IP for repeated high-severity threats
    if (threat.severity === 'critical' || threat.severity === 'high') {
      const recentThreats = this.threatLog.filter(
        t => t.source === threat.source && 
        t.timestamp >= new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      )
      
      if (recentThreats.length >= 3) {
        this.blockedIPs.add(threat.source)
        console.warn(`IP ${threat.source} blocked due to repeated threats`)
      }
    }

    // Send alert for critical threats
    if (threat.severity === 'critical') {
      this.sendSecurityAlert(threat)
    }
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(threat: SecurityThreat): Promise<void> {
    try {
      // In production, this would send alerts via email, Slack, etc.
      console.error('CRITICAL SECURITY THREAT:', threat)
      
      // Log to Supabase for monitoring
      if (supabase) {
        await supabase
          .from('security_threats')
          .insert([{
            threat_id: threat.id,
            type: threat.type,
            severity: threat.severity,
            description: threat.description,
            source: threat.source,
            metadata: threat.metadata,
            blocked: threat.blocked,
            created_at: threat.timestamp.toISOString()
          }])
      }
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }

  /**
   * Cleanup old rate limit entries
   */
  private cleanupRateLimit(): void {
    const now = Date.now()
    const windowDuration = 60 * 1000

    for (const [key, entry] of this.rateLimitMap.entries()) {
      if ((now - entry.windowStart) > windowDuration) {
        this.rateLimitMap.delete(key)
      }
    }
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Clean up rate limits every 5 minutes
    setInterval(() => {
      this.cleanupRateLimit()
    }, 5 * 60 * 1000)

    // Unblock IPs after 1 hour
    setInterval(() => {
      this.blockedIPs.clear()
    }, 60 * 60 * 1000)

    // Monitor for cost-based security threats
    setInterval(() => {
      this.monitorCostThreats()
    }, 10 * 60 * 1000) // Every 10 minutes
  }

  /**
   * Monitor for cost-based security threats (e.g., API abuse)
   */
  private async monitorCostThreats(): Promise<void> {
    try {
      const alerts = costOptimizer.getActiveAlerts()
      
      for (const alert of alerts) {
        if (alert.severity === 'critical' && alert.type === 'unusual_spike') {
          const threat: SecurityThreat = {
            id: `cost_abuse_${Date.now()}`,
            type: 'suspicious_activity',
            severity: 'high',
            description: 'Unusual API usage spike detected - possible abuse',
            source: 'cost_monitoring',
            timestamp: new Date(),
            blocked: false,
            metadata: { alert }
          }
          
          this.logThreat(threat)
        }
      }
    } catch (error) {
      console.error('Cost threat monitoring error:', error)
    }
  }

  /**
   * Validate session security
   */
  async validateSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession()
      
      if (!session?.session) {
        return false
      }

      // Check session expiry
      const expiresAt = session.session.expires_at
      if (expiresAt && expiresAt * 1000 < Date.now()) {
        return false
      }

      // Validate user ID matches
      if (session.session.user?.id !== userId) {
        const threat: SecurityThreat = {
          id: `session_mismatch_${Date.now()}`,
          type: 'suspicious_activity',
          severity: 'high',
          description: 'Session user ID mismatch',
          source: userId,
          timestamp: new Date(),
          blocked: true
        }
        this.logThreat(threat)
        return false
      }

      return true
    } catch (error) {
      console.error('Session validation error:', error)
      return false
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    threatsBlocked: number
    rateLimitViolations: number
    blockedIPs: number
    threatsByType: Record<string, number>
    threatsBySeverity: Record<string, number>
  } {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentThreats = this.threatLog.filter(t => t.timestamp >= oneDayAgo)

    const threatsByType: Record<string, number> = {}
    const threatsBySeverity: Record<string, number> = {}

    for (const threat of recentThreats) {
      threatsByType[threat.type] = (threatsByType[threat.type] || 0) + 1
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1
    }

    const rateLimitViolations = Array.from(this.rateLimitMap.values())
      .filter(entry => entry.blocked).length

    return {
      threatsBlocked: recentThreats.filter(t => t.blocked).length,
      rateLimitViolations,
      blockedIPs: this.blockedIPs.size,
      threatsByType,
      threatsBySeverity
    }
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  /**
   * Validate file upload security
   */
  validateFileUpload(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 10MB)' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' }
    }

    // Check file extension matches MIME type
    const extension = file.name.toLowerCase().split('.').pop()
    const expectedExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt']
    }

    const expected = expectedExtensions[file.type]
    if (expected && extension && !expected.includes(extension)) {
      return { valid: false, error: 'File extension does not match content type' }
    }

    return { valid: true }
  }

  /**
   * Generate security headers for HTTP responses
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
}

export const securityManager = SecurityManager.getInstance()
