# Project Board Structure

## Overview

This document defines the project board structure for PRD development and management. The board uses a Kanban-style approach with swimlanes for different project phases.

## Board Configuration

### Swimlanes (Horizontal Rows)

1. **🔍 Discovery**
   - Market research activities
   - User research tasks
   - Competitive analysis

2. **🔬 Research**
   - User interviews
   - Surveys
   - Data analysis

3. **🎯 Synthesis**
   - Insights compilation
   - Pattern identification
   - Requirements definition

4. **✍️ Drafting**
   - PRD section writing
   - Technical documentation
   - Design specifications

5. **👁️ Review**
   - Stakeholder reviews
   - Feedback incorporation
   - Quality checks

6. **✅ Finalization**
   - Final approvals
   - Documentation publishing
   - Handoff preparation

### Columns (Vertical Status)

1. **📋 Backlog**
   - Unstarted tasks
   - Future work items
   - Ideas for consideration

2. **🎯 To Do**
   - Prioritized for current sprint
   - Ready to start
   - All dependencies resolved

3. **🚀 In Progress**
   - Actively being worked on
   - Work started but not complete
   - Maximum WIP limit: 3 per person

4. **👀 In Review**
   - Awaiting feedback
   - Under stakeholder review
   - Pending approval

5. **✅ Done**
   - Completed tasks
   - Approved deliverables
   - Archived items

6. **⚠️ Blocked**
   - Waiting on dependencies
   - Need clarification
   - Technical impediments

## Card Templates

### Standard Task Card

```
Title: [Clear, action-oriented title]
Type: [Discovery/Research/Documentation/Review]
Priority: [Critical/High/Medium/Low]
Assignee: [Team member name]
Due Date: [YYYY-MM-DD]
Estimate: [Hours or Story Points]

Description:
- Clear acceptance criteria
- Context and background
- Dependencies

Checklist:
- [ ] Sub-task 1
- [ ] Sub-task 2
- [ ] Sub-task 3

Labels: #phase #workstream #priority
```

### User Story Card

```
As a [user type]
I want [goal/desire]
So that [benefit/value]

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

Notes:
- Additional context
- Related documents
```

## Initial Backlog Items

### Discovery Lane

- [ ] Analyze market trends and opportunities
- [ ] Identify key competitors
- [ ] Define target user segments
- [ ] Research regulatory requirements
- [ ] Technology landscape assessment

### Research Lane

- [ ] Create user interview guide
- [ ] Schedule and conduct 10 user interviews
- [ ] Design and deploy user survey
- [ ] Analyze existing product analytics
- [ ] Synthesize customer support tickets

### Synthesis Lane

- [ ] Create user personas
- [ ] Map user journeys
- [ ] Define problem statements
- [ ] Prioritize feature requirements
- [ ] Create opportunity matrix

### Drafting Lane

- [ ] Write executive summary
- [ ] Document user stories
- [ ] Define success metrics
- [ ] Create technical requirements
- [ ] Develop timeline and milestones

### Review Lane

- [ ] Stakeholder review session
- [ ] Technical feasibility review
- [ ] Legal/compliance review
- [ ] Budget and resource review
- [ ] Risk assessment review

### Finalization Lane

- [ ] Incorporate final feedback
- [ ] Get executive approval
- [ ] Create presentation deck
- [ ] Publish to team wiki
- [ ] Schedule kickoff meeting

## Workflow Rules

### Definition of Ready

A task is ready when:

- Clear description and acceptance criteria
- All dependencies identified
- Estimated effort provided
- Assignee designated
- Resources available

### Definition of Done

A task is done when:

- All acceptance criteria met
- Documentation updated
- Reviewed by relevant stakeholders
- Tests passed (if applicable)
- Knowledge transferred

### WIP Limits

- Discovery: 5 items
- Research: 3 items
- Synthesis: 3 items
- Drafting: 4 items
- Review: 5 items
- Finalization: 2 items

## Automation Rules

### Auto-move Triggers

1. When PR is created → Move to "In Review"
2. When PR is merged → Move to "Done"
3. When blocked label added → Move to "Blocked"
4. When due date passes → Add overdue label

### Notifications

1. Card assigned → Notify assignee
2. Card blocked → Notify PM
3. Card in review > 3 days → Escalate
4. Sprint ending → Summary report

## Metrics & Reporting

### Key Metrics

- **Cycle Time**: Time from "To Do" to "Done"
- **Lead Time**: Time from "Backlog" to "Done"
- **Throughput**: Cards completed per week
- **WIP**: Current work in progress
- **Blockers**: Number and age of blocked items

### Weekly Reports

- Sprint velocity
- Completed vs planned
- Upcoming milestones
- Risk items
- Team capacity

### Dashboard Views

#### Executive View

- Overall progress percentage
- Key milestones status
- Critical path items
- Risk register summary

#### Team View

- Current sprint board
- Individual assignments
- Blocked items
- Today's priorities

#### Stakeholder View

- Items in review
- Completed deliverables
- Upcoming decisions needed
- Timeline status

## Integration Points

### GitHub Integration

- Link PRs to cards
- Auto-update based on commits
- Create cards from issues

### Slack Integration

- Daily standup reminders
- Card update notifications
- Weekly summary posts

### Calendar Integration

- Due date syncing
- Meeting scheduling
- Milestone tracking

## Best Practices

### Daily Standups

- Review board together
- Update card status
- Identify blockers
- Plan day's work

### Card Hygiene

- Update cards daily
- Add comments for context
- Attach relevant documents
- Keep descriptions current

### Sprint Planning

- Review backlog priority
- Estimate new items
- Balance workload
- Set sprint goals

### Retrospectives

- Review completed work
- Identify improvements
- Update processes
- Celebrate successes

## Tool Recommendations

### For GitHub Projects

```yaml
name: PRD Development Board
description: Product Requirements Document development tracker
columns:
  - name: Backlog
  - name: To Do
  - name: In Progress
  - name: In Review
  - name: Done
  - name: Blocked
```

### For Jira

```
Project Type: Kanban
Issue Types: Task, Story, Bug, Epic
Swimlanes: By Epic (Phases)
Quick Filters: My Items, Blocked, Overdue
```

### For Notion

```
Database Properties:
- Status (Select)
- Phase (Select)
- Assignee (Person)
- Due Date (Date)
- Priority (Select)
- Progress (Progress Bar)
Views:
- Board by Status
- Table by Phase
- Calendar by Due Date
- Gallery for Deliverables
```

## Getting Started Checklist

- [ ] Choose project board tool
- [ ] Create board with defined structure
- [ ] Import initial backlog items
- [ ] Set up automation rules
- [ ] Configure integrations
- [ ] Train team on workflow
- [ ] Schedule recurring meetings
- [ ] Create first sprint
- [ ] Begin tracking metrics
- [ ] Set up reporting dashboards

---

_Board Version: 1.0_  
_Last Updated: [Date]_  
_Owner: Program Manager_
