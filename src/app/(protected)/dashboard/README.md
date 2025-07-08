# Dashboard - Operational Command Center

## Overview

The Dashboard serves as the daily operational hub for users, providing at-a-glance status, actionable items, and contextual navigation. It focuses on immediate needs and current activity rather than historical analysis.

## Design Philosophy

**Purpose**: Daily operations, quick overview, immediate actions  
**User mindset**: "What needs my attention today?"  
**Focus**: Current state, actionable insights, operational efficiency

## Content Strategy

### 1. **Today's Summary Section**

- **Current Month Metrics** (not historical trends)

  - Quotes created this month vs last month (simple comparison)
  - Active conversations count
  - Pending quotes (sent but not responded to)
  - Revenue from accepted quotes this month

- **Subscription Status** (enhanced from current implementation)
  - Usage progress with visual indicators
  - Days until reset (for free tier)
  - Feature availability status
  - Quick upgrade prompts when approaching limits

### 2. **Action Required Section**

- **Quotes Needing Attention**
  - Quotes awaiting client response (with days pending)
  - Quotes in "revised" status requiring follow-up
  - Draft quotes older than 7 days (gentle reminder)
- **Communication Alerts**
  - Unread conversations count
  - Follow-up reminders (based on last interaction date)
  - Gmail connection status alerts

### 3. **Contextual Quick Actions** _(avoiding sidebar duplication)_

- **Smart Context Actions** (based on current state)

  - "Continue Draft Quote" (if drafts exist)
  - "Follow Up on Quote #123" (for pending quotes)
  - "Respond to Conversation" (for unread messages)
  - "Review Revision Request" (for revised quotes)

- **Workflow Shortcuts**
  - "Quote for [Recent Client]" (create quote for previous client)
  - "Duplicate Last Quote" (with modifications)
  - "Send Quote Reminder" (for sent but no response)

### 4. **Recent Activity Feed**

- **Last 7 Days Only** (recent, not historical)
  - Quote status changes
  - New conversations initiated
  - Client responses received
  - System notifications (Gmail disconnected, etc.)

### 5. **Active Companies Widget**

- **Enhanced Company Cards** (beyond current list)
  - Last activity date
  - Active quotes count per company
  - Unread conversations per company
  - Quick "New Quote for [Company]" action

### 6. **System Health & Notifications**

- **Integration Status**

  - Gmail connection health
  - Last email sync time
  - API rate limits status

- **Smart Notifications**
  - Subscription renewal reminders
  - Feature usage tips
  - Onboarding progress (for new users)

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ Header: Today's Summary (Current Month Metrics)     │
├─────────────────────┬───────────────────────────────┤
│ Action Required     │ Contextual Quick Actions      │
│ • Pending Quotes    │ • Smart Context Actions       │
│ • Unread Messages   │ • Workflow Shortcuts          │
│ • Follow-ups        │ • Recent Client Actions       │
├─────────────────────┼───────────────────────────────┤
│ Active Companies    │ Recent Activity Feed          │
│ • Enhanced Cards    │ • Last 7 Days                 │
│ • Quick Actions     │ • Status Changes              │
│ • Activity Status   │ • Notifications               │
├─────────────────────┴───────────────────────────────┤
│ System Health & Notifications                       │
└─────────────────────────────────────────────────────┘
```

## Key Differentiators from Analytics

| Dashboard             | Analytics             |
| --------------------- | --------------------- |
| Current month only    | Historical trends     |
| Actionable insights   | Strategic insights    |
| Operational focus     | Business intelligence |
| Quick status check    | Deep analysis         |
| Real-time updates     | Comparative reporting |
| Context-aware actions | Data exploration      |

## Implementation Requirements

### Data Sources

- Current month quotes and their statuses
- Email threads from last 7 days
- Company activity summaries
- Subscription usage real-time data
- Gmail connection status
- System notifications

### Key Hooks Needed

- `useDashboardSummary()` - Today's metrics
- `useActionItems()` - Pending tasks and alerts
- `useRecentActivity()` - Last 7 days activity feed
- `useSystemHealth()` - Integration status
- `useContextualActions()` - Smart action suggestions

### Components to Build

- `TodaysSummary` - Current metrics cards
- `ActionRequired` - Pending items with CTAs
- `ContextualActions` - Smart quick actions
- `RecentActivity` - Activity feed
- `CompanyCards` - Enhanced company widgets
- `SystemHealth` - Status indicators
- `SmartNotifications` - Contextual alerts

### Performance Considerations

- Real-time updates using TanStack Query
- Optimistic updates for quick actions
- Skeleton loading for each section
- Efficient polling for activity feed
- Cache invalidation strategies

## User Experience Goals

1. **Immediate Value**: User sees what needs attention within 3 seconds
2. **Actionable**: Every piece of information leads to a clear next step
3. **Contextual**: Actions and suggestions based on current state
4. **Efficient**: Minimal clicks to common tasks
5. **Informative**: Clear status without overwhelming detail

## Success Metrics

- Time to first action from dashboard load
- Click-through rate on contextual actions
- Reduction in missed follow-ups
- User engagement with activity feed
- Conversion from pending to accepted quotes

## Future Enhancements

- AI-powered action suggestions
- Customizable widget layout
- Mobile-optimized quick actions
- Voice alerts for urgent items
- Integration with calendar for scheduling
