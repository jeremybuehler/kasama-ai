# KPI Dictionary

## Overview

This dictionary defines all Key Performance Indicators (KPIs) used to measure product success and business performance.

**Last Updated:**  
**Owner:**  
**Review Cycle:** Quarterly

## KPI Categories

### 1. Business Metrics

#### Revenue Metrics

| KPI Name | Definition                | Formula                                 | Target     | Frequency | Owner   | Data Source    |
| -------- | ------------------------- | --------------------------------------- | ---------- | --------- | ------- | -------------- |
| **MRR**  | Monthly Recurring Revenue | Sum of all monthly subscription revenue | $XXX,XXX   | Monthly   | Finance | Billing System |
| **ARR**  | Annual Recurring Revenue  | MRR × 12                                | $X,XXX,XXX | Monthly   | Finance | Billing System |
| **ARPU** | Average Revenue Per User  | Total Revenue / Number of Users         | $XXX       | Monthly   | Product | Analytics      |
| **LTV**  | Customer Lifetime Value   | ARPU × Average Customer Lifetime        | $X,XXX     | Quarterly | Product | Analytics      |

#### Growth Metrics

| KPI Name          | Definition                  | Formula                                           | Target   | Frequency | Owner     | Data Source |
| ----------------- | --------------------------- | ------------------------------------------------- | -------- | --------- | --------- | ----------- |
| **Growth Rate**   | Month-over-month growth     | (Current MRR - Previous MRR) / Previous MRR × 100 | X%       | Monthly   | Product   | Billing     |
| **CAC**           | Customer Acquisition Cost   | Total Sales & Marketing Cost / New Customers      | $XXX     | Monthly   | Marketing | Multiple    |
| **CAC Payback**   | Time to recover CAC         | CAC / (ARPU × Gross Margin)                       | X months | Monthly   | Finance   | Multiple    |
| **LTV:CAC Ratio** | Return on acquisition spend | LTV / CAC                                         | 3:1      | Quarterly | Product   | Multiple    |

### 2. User Engagement Metrics

#### Activation Metrics

| KPI Name                  | Definition                         | Formula                               | Target  | Frequency | Owner   | Data Source |
| ------------------------- | ---------------------------------- | ------------------------------------- | ------- | --------- | ------- | ----------- |
| **Activation Rate**       | % of users who complete key action | Activated Users / Total Signups × 100 | X%      | Weekly    | Product | Analytics   |
| **Time to Value**         | Time to first meaningful action    | Median time from signup to activation | X hours | Weekly    | Product | Analytics   |
| **Onboarding Completion** | % completing onboarding            | Completed Onboarding / Started × 100  | X%      | Weekly    | Product | Analytics   |

#### Retention Metrics

| KPI Name              | Definition                           | Formula                                                 | Target | Frequency | Owner   | Data Source |
| --------------------- | ------------------------------------ | ------------------------------------------------------- | ------ | --------- | ------- | ----------- |
| **Monthly Retention** | % of users retained month-over-month | Active Users (Month N) / Active Users (Month N-1) × 100 | X%     | Monthly   | Product | Analytics   |
| **Churn Rate**        | % of users who stop using product    | Churned Users / Total Users × 100                       | <X%    | Monthly   | Product | Analytics   |
| **DAU/MAU Ratio**     | Daily to Monthly Active User ratio   | Daily Active Users / Monthly Active Users               | X%     | Daily     | Product | Analytics   |
| **Session Duration**  | Average time spent per session       | Total Session Time / Number of Sessions                 | X min  | Weekly    | Product | Analytics   |

### 3. Product Performance Metrics

#### Feature Adoption

| KPI Name                  | Definition               | Formula                                               | Target | Frequency | Owner   | Data Source |
| ------------------------- | ------------------------ | ----------------------------------------------------- | ------ | --------- | ------- | ----------- |
| **Feature Adoption Rate** | % using specific feature | Feature Users / Total Active Users × 100              | X%     | Monthly   | Product | Analytics   |
| **Feature Engagement**    | Frequency of feature use | Total Feature Uses / Feature Users                    | X/week | Weekly    | Product | Analytics   |
| **Feature Retention**     | Continued feature usage  | Feature Users (Week N) / Feature Users (Week 1) × 100 | X%     | Weekly    | Product | Analytics   |

#### Quality Metrics

| KPI Name                | Definition                       | Formula                                    | Target  | Frequency | Owner       | Data Source |
| ----------------------- | -------------------------------- | ------------------------------------------ | ------- | --------- | ----------- | ----------- |
| **Error Rate**          | % of actions resulting in errors | Errors / Total Actions × 100               | <X%     | Daily     | Engineering | Monitoring  |
| **Page Load Time**      | Average page load speed          | Sum of Load Times / Number of Page Loads   | <X sec  | Daily     | Engineering | Monitoring  |
| **Uptime**              | System availability              | (Total Time - Downtime) / Total Time × 100 | 99.X%   | Daily     | Engineering | Monitoring  |
| **Bug Resolution Time** | Time to fix reported bugs        | Average time from report to resolution     | X hours | Weekly    | Engineering | JIRA        |

### 4. Customer Satisfaction Metrics

| KPI Name                  | Definition                     | Formula                                          | Target   | Frequency | Owner   | Data Source |
| ------------------------- | ------------------------------ | ------------------------------------------------ | -------- | --------- | ------- | ----------- |
| **NPS**                   | Net Promoter Score             | % Promoters - % Detractors                       | >X       | Quarterly | Product | Survey      |
| **CSAT**                  | Customer Satisfaction Score    | Sum of Satisfaction Scores / Number of Responses | >X/5     | Monthly   | Support | Survey      |
| **CES**                   | Customer Effort Score          | Average effort rating                            | <X       | Quarterly | Product | Survey      |
| **Support Ticket Volume** | Number of support requests     | Count of tickets                                 | <X/month | Weekly    | Support | Helpdesk    |
| **First Response Time**   | Time to first support response | Average time to first response                   | <X hours | Daily     | Support | Helpdesk    |
| **Resolution Time**       | Time to resolve issues         | Average time from ticket open to close           | <X hours | Weekly    | Support | Helpdesk    |

### 5. Operational Metrics

#### Team Performance

| KPI Name                 | Definition                     | Formula                                   | Target   | Frequency | Owner       | Data Source |
| ------------------------ | ------------------------------ | ----------------------------------------- | -------- | --------- | ----------- | ----------- |
| **Velocity**             | Development team output        | Story points completed per sprint         | X points | Sprint    | Engineering | JIRA        |
| **Sprint Completion**    | % of planned work completed    | Completed Stories / Planned Stories × 100 | >X%      | Sprint    | Engineering | JIRA        |
| **Deployment Frequency** | How often code is deployed     | Number of deployments                     | X/week   | Weekly    | Engineering | CI/CD       |
| **Lead Time**            | Time from commit to production | Average time from code commit to deploy   | <X hours | Weekly    | Engineering | CI/CD       |

## KPI Measurement Guidelines

### Data Collection Standards

1. **Accuracy**: Ensure data sources are validated
2. **Consistency**: Use same measurement methods
3. **Timeliness**: Collect data at specified intervals
4. **Completeness**: Account for all relevant data points

### Calculation Methods

- **Rolling Averages**: Use 7-day, 30-day, or 90-day windows
- **Cohort Analysis**: Group users by signup date for retention
- **Segmentation**: Break down by user type, plan, geography

### Reporting Requirements

- **Dashboard Updates**: Real-time or daily
- **Weekly Reports**: Every Monday
- **Monthly Reviews**: First week of month
- **Quarterly Business Reviews**: Within 2 weeks of quarter end

## KPI Targets & Thresholds

### Traffic Light System

- 🟢 **Green**: Meeting or exceeding target
- 🟡 **Yellow**: 80-99% of target
- 🔴 **Red**: Below 80% of target

### Escalation Matrix

| Threshold | Action Required | Responsible | Timeline        |
| --------- | --------------- | ----------- | --------------- |
| Green     | Monitor         | Team Lead   | Ongoing         |
| Yellow    | Investigation   | Manager     | Within 48 hours |
| Red       | Action Plan     | Director    | Within 24 hours |

## Historical Benchmarks

### Industry Standards

| Metric        | SaaS Average | Top Quartile | Our Target |
| ------------- | ------------ | ------------ | ---------- |
| Monthly Churn | 5-7%         | <3%          | X%         |
| LTV:CAC       | 3:1          | 5:1          | X:1        |
| NPS           | 30           | 50+          | X          |

## Revision History

| Date | Version | Changes         | Approved By |
| ---- | ------- | --------------- | ----------- |
|      | 1.0     | Initial version |             |

## Glossary

**Active User**: User who has logged in within specified timeframe  
**Churn**: When a customer stops using the product  
**Cohort**: Group of users who share a common characteristic  
**MRR**: Monthly Recurring Revenue from subscriptions  
**Session**: Period of user activity with <30 min inactivity

---

_For questions about KPI definitions or calculations, contact: [Contact]_
