# 🛡️ Kasama AI - Security Deployment Runbook

## Overview

This runbook provides step-by-step procedures for managing secure deployments, handling security incidents, and maintaining the security posture of the Kasama AI deployment pipeline.

## 🚨 Emergency Response Procedures

### Immediate Security Incident Response

#### 1. Security Breach Detection
```bash
# Immediately disable all deployments
gh workflow disable deploy.yml

# Check recent deployments for compromise
gh run list --workflow=deploy.yml --limit 10

# Review security scan results
gh run view LATEST_RUN_ID --log
```

#### 2. Rollback Procedure (Emergency)
```bash
# Get current production deployment
vercel ls --prod --token=$VERCEL_TOKEN

# Find last known good deployment
vercel ls --token=$VERCEL_TOKEN | grep "READY" | head -2

# Emergency rollback
vercel alias set PREVIOUS_DEPLOYMENT_URL app.kasama.ai --token=$VERCEL_TOKEN

# Verify rollback success
curl -I https://app.kasama.ai
```

#### 3. Incident Communication
```bash
# Create incident issue
gh issue create \
  --title "SECURITY INCIDENT: $(date)" \
  --body "Security incident detected. Investigating..." \
  --label "security,incident,high-priority"

# Notify team (add your notification commands)
# Slack, email, or other alerting systems
```

## 🔍 Security Validation Procedures

### Pre-Deployment Security Audit

#### 1. Manual Security Review
```bash
# Check for sensitive data exposure
rg -g "*.{js,ts,jsx,tsx}" "(api[_-]?key|secret|password|token)" src/ --context 2

# Verify environment configuration
cat .env.example
echo "Ensure no secrets in .env.example"

# Check dependencies for vulnerabilities
npm audit --audit-level moderate
```

#### 2. Code Quality Assessment
```bash
# Run full quality checks
npm run typecheck
npm run lint
npm run test
npm run build

# Security-focused lint rules
npx eslint src/ --ext .ts,.tsx,.js,.jsx --config .eslintrc-security.js
```

#### 3. Infrastructure Security Check
```bash
# Verify Vercel security headers
curl -I https://app.kasama.ai | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"

# Check SSL configuration
curl -I https://app.kasama.ai | grep -i "strict-transport-security"

# Validate DNS configuration
dig +short app.kasama.ai
```

### Deployment Security Validation

#### 1. Pre-Deployment Gates
```yaml
Security Checklist:
- [ ] No hardcoded secrets detected
- [ ] Dependency vulnerabilities < high severity
- [ ] TypeScript compilation successful
- [ ] ESLint security rules passing
- [ ] Production build successful
- [ ] Risk score < 50
```

#### 2. During Deployment Monitoring
```bash
# Monitor deployment progress
gh run watch WORKFLOW_RUN_ID

# Check deployment logs for security warnings
vercel logs https://app.kasama.ai --token=$VERCEL_TOKEN

# Verify deployment metadata
curl -s https://app.kasama.ai/_vercel/insights | jq
```

#### 3. Post-Deployment Verification
```bash
# Comprehensive health check
curl -s -w "@curl-format.txt" https://app.kasama.ai

# Security headers validation
curl -I https://app.kasama.ai | tee deployment-headers.log

# Content integrity check
curl -s https://app.kasama.ai | grep -o "Kasama" | wc -l
```

## 🔒 Access Control Management

### GitHub Repository Access

#### 1. Team Member Onboarding
```bash
# Add user to repository
gh api repos/:owner/:repo/collaborators/USERNAME -X PUT \
  --field permission=push

# Verify access levels
gh api repos/:owner/:repo/collaborators | jq '.[] | {login: .login, permissions: .permissions}'
```

#### 2. Access Review Process
```bash
# Audit repository access
gh api repos/:owner/:repo/collaborators --paginate | \
  jq '.[] | {login: .login, admin: .permissions.admin, push: .permissions.push}'

# Review branch protection rules
gh api repos/:owner/:repo/branches/main/protection | jq
```

### Vercel Access Control

#### 1. Team Access Management
```bash
# List team members
vercel teams list --token=$VERCEL_TOKEN

# Check project access
vercel project list --token=$VERCEL_TOKEN
```

#### 2. API Token Security
```bash
# Verify token permissions
vercel whoami --token=$VERCEL_TOKEN

# Rotate tokens (quarterly)
# 1. Create new token in Vercel dashboard
# 2. Update GitHub secret: gh secret set VERCEL_TOKEN
# 3. Test deployment
# 4. Delete old token
```

## 🔧 Security Configuration Management

### Environment Variables Security

#### 1. Secret Rotation Schedule
```yaml
Rotation Schedule:
- API Keys: Every 90 days
- Database Credentials: Every 60 days
- Deployment Tokens: Every 30 days
- SSL Certificates: Every 365 days (auto-renewed)
```

#### 2. Secret Validation Process
```bash
# Validate all required secrets
node scripts/setup-github-secrets.js

# Check for exposed secrets
gh secret list

# Verify environment separation
gh api repos/:owner/:repo/environments | jq '.environments[].name'
```

### Security Policy Updates

#### 1. Dependency Security Management
```bash
# Update dependencies monthly
npm audit fix
npm update

# Review security advisories
npm audit --json | jq '.advisories'

# Update GitHub Actions
gh workflow view ci.yml | grep "uses:"
```

#### 2. Security Configuration Reviews
```bash
# Review branch protection rules
gh api repos/:owner/:repo/branches/main/protection

# Check environment protection rules
gh api repos/:owner/:repo/environments/production

# Validate workflow permissions
grep -r "permissions:" .github/workflows/
```

## 📊 Security Monitoring & Alerting

### Continuous Security Monitoring

#### 1. Automated Security Scans
```bash
# Daily security scan schedule
# (Configured in .github/workflows/security.yml)

# Manual security scan
gh workflow run security.yml

# Review scan results
gh run list --workflow=security.yml --limit 5
```

#### 2. Performance & Security Metrics
```bash
# Check deployment success rate
gh run list --workflow=deploy.yml --json | \
  jq '[.[] | select(.conclusion)] | group_by(.conclusion) | map({status: .[0].conclusion, count: length})'

# Monitor response times
curl -w "%{time_total}\n" -o /dev/null -s https://app.kasama.ai

# Security header compliance
curl -I https://app.kasama.ai 2>/dev/null | \
  grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)" | wc -l
```

### Alert Configuration

#### 1. GitHub Actions Alerts
```yaml
Alert Triggers:
- Deployment failures
- Security scan failures
- High/Critical vulnerabilities
- Unauthorized access attempts
```

#### 2. External Monitoring
```bash
# Set up external monitoring (examples)
# UptimeRobot, Pingdom, or similar service
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
  -d "api_key=YOUR_API_KEY" \
  -d "friendly_name=Kasama AI Production" \
  -d "url=https://app.kasama.ai" \
  -d "type=1"
```

## 🧪 Testing & Validation Procedures

### Security Testing Protocols

#### 1. Penetration Testing Checklist
```yaml
Quarterly Security Tests:
- [ ] OWASP Top 10 vulnerabilities
- [ ] Authentication bypass attempts
- [ ] Session management testing
- [ ] Input validation testing
- [ ] SQL injection testing
- [ ] XSS vulnerability testing
- [ ] CSRF protection testing
```

#### 2. Deployment Pipeline Testing
```bash
# Test staging deployment
gh workflow run deploy.yml --ref main -f environment=staging

# Validate security gates
gh run view WORKFLOW_RUN_ID | grep -E "(Security|Risk Score)"

# Test rollback functionality
# (Include in staging environment testing)
```

### Compliance Validation

#### 1. Regulatory Compliance
```yaml
Compliance Checks:
- [ ] GDPR data protection measures
- [ ] CCPA privacy controls
- [ ] SOC 2 security controls
- [ ] Industry-specific requirements
```

#### 2. Security Audit Preparation
```bash
# Generate security documentation
gh api repos/:owner/:repo/security-advisories
npm audit --json > security-audit.json
vercel logs --token=$VERCEL_TOKEN > deployment-logs.txt

# Create compliance report
node scripts/generate-compliance-report.js
```

## 📋 Maintenance Procedures

### Regular Security Maintenance

#### 1. Weekly Tasks
```bash
# Review security scan results
gh run list --workflow=security.yml --limit 7

# Check for dependency updates
npm outdated

# Validate backup procedures
# (Project-specific backup validation)
```

#### 2. Monthly Tasks
```bash
# Update all dependencies
npm update && npm audit fix

# Review access controls
gh api repos/:owner/:repo/collaborators

# Test disaster recovery procedures
# (Include rollback and incident response)
```

#### 3. Quarterly Tasks
```bash
# Comprehensive security audit
# Full penetration testing
# Access review and cleanup
# Security policy updates
# Incident response plan testing
```

## 🎯 Performance Metrics & KPIs

### Security Metrics Dashboard

```yaml
Key Security Metrics:
- Deployment Security Score: Target ≥ 95/100
- Mean Time to Detect (MTTD): Target < 5 minutes
- Mean Time to Respond (MTTR): Target < 15 minutes
- Security Incident Count: Target 0 per quarter
- Vulnerability Remediation Time: Target < 24 hours
```

### Operational Metrics

```yaml
Deployment Metrics:
- Deployment Success Rate: Target ≥ 99%
- Rollback Rate: Target < 1%
- Mean Deployment Time: Target < 5 minutes
- Health Check Pass Rate: Target ≥ 99%
```

## 📚 Reference Documentation

### Quick Reference Commands

#### Security Incident Response
```bash
# Emergency deployment disable
gh workflow disable deploy.yml

# Emergency rollback
vercel alias set LAST_GOOD_DEPLOYMENT app.kasama.ai --token=$VERCEL_TOKEN

# Security scan
gh workflow run security.yml
```

#### Daily Operations
```bash
# Check deployment status
gh run list --workflow=deploy.yml --limit 5

# Monitor security scans
gh run list --workflow=security.yml --limit 5

# Validate production health
curl -I https://app.kasama.ai
```

### Contact Information

```yaml
Security Team Contacts:
- Primary: security@kasama.ai
- Secondary: devops@kasama.ai
- Emergency: +1-XXX-XXX-XXXX

External Contacts:
- Vercel Support: support@vercel.com
- GitHub Support: support@github.com
```

---

**Runbook Version**: 1.0  
**Last Updated**: August 31, 2025  
**Next Review**: November 30, 2025  
**Owner**: DevOps Security Team