# 📧 Incoming Email Tracking System

## Overview

This document outlines the plan for implementing incoming email tracking functionality to complement our existing email sending system. The goal is to create a complete conversation management system that tracks both sent and received emails, enabling automated quote status updates and better client communication.

## Current State

### ✅ What We Have

- **Gmail OAuth Integration**: Connected Gmail accounts with `gmail.send` and `gmail.readonly` scopes
- **Email Threads Database**: Stores sent emails with Gmail message IDs and thread IDs
- **Conversation Management**: View and manage email conversations with search and filtering
- **Downloadable Attachments**: Interactive download system for email attachments
- **Quote Integration**: Links emails to specific quotes for context

### ❌ What We're Missing

- Incoming email fetching and storage
- Real-time email monitoring
- Client response tracking
- Quote status updates based on responses
- Complete conversation thread visibility

## System Architecture

### Database Schema

#### Enhanced Email Threads Table

```sql
-- Add new fields to existing email_threads table
ALTER TABLE email_threads ADD COLUMN direction VARCHAR(10) DEFAULT 'outbound';
ALTER TABLE email_threads ADD COLUMN from_email VARCHAR(255);
ALTER TABLE email_threads ADD COLUMN is_read BOOLEAN DEFAULT false;
ALTER TABLE email_threads ADD COLUMN gmail_labels TEXT; -- JSON array of Gmail labels
ALTER TABLE email_threads ADD COLUMN email_type VARCHAR(50); -- 'quote_sent', 'client_response', 'follow_up', etc.
```

#### Email Sync Status Table

```sql
CREATE TABLE email_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMP,
  last_message_id VARCHAR(255),
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);
```

### Gmail API Integration

#### Enhanced OAuth Scopes

```typescript
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify', // For marking as read
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')
```

#### Core Gmail API Functions

```typescript
// src/lib/gmail.ts

// Fetch all messages in a thread
export async function fetchThreadMessages(
  accessToken: string,
  threadId: string,
): Promise<GmailMessage[]>

// Fetch recent emails from inbox
export async function fetchRecentEmails(
  accessToken: string,
  maxResults: number = 50,
  query?: string,
): Promise<GmailMessage[]>

// Get detailed email content
export async function getEmailDetails(
  accessToken: string,
  messageId: string,
): Promise<GmailMessageDetail>

// Mark email as read
export async function markEmailAsRead(
  accessToken: string,
  messageId: string,
): Promise<void>

// Search emails by criteria
export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults: number = 50,
): Promise<GmailMessage[]>
```

## Implementation Phases

### Phase 1: Database Schema Enhancement

#### 1.1 Update Email Threads Schema

- Add direction field to distinguish inbound/outbound emails
- Add from_email field for incoming emails
- Add is_read field for tracking read status
- Add gmail_labels for Gmail label tracking
- Add email_type for categorization

#### 1.2 Create Email Sync Status Table

- Track sync status per company
- Store last sync timestamp and message ID
- Enable/disable sync per company
- Configurable sync frequency

#### 1.3 Database Migration

```sql
-- Migration file: 0005_email_tracking_enhancement.sql
-- Add new columns to email_threads
-- Create email_sync_status table
-- Add indexes for performance
```

### Phase 2: Gmail API Integration

#### 2.1 Enhanced OAuth Flow

- Update OAuth scopes to include `gmail.modify`
- Handle scope changes for existing connections
- Implement scope upgrade flow

#### 2.2 Email Fetching Functions

```typescript
// Core email fetching functionality
interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: GmailMessagePayload
  internalDate: string
}

interface GmailMessagePayload {
  headers: GmailHeader[]
  parts?: GmailMessagePayload[]
  body?: GmailMessageBody
}

interface GmailHeader {
  name: string
  value: string
}
```

#### 2.3 Email Processing Utilities

```typescript
// Email parsing and processing
export function parseGmailMessage(message: GmailMessage): ParsedEmail
export function extractEmailAddresses(headers: GmailHeader[]): EmailAddresses
export function decodeEmailBody(body: GmailMessageBody): string
export function extractAttachments(payload: GmailMessagePayload): Attachment[]
```

### Phase 3: Email Sync Service

#### 3.1 Background Sync Service

```typescript
// src/lib/email-sync.ts

export class EmailSyncService {
  // Main sync orchestration
  async syncAllCompanies(): Promise<void>
  async syncCompanyEmails(companyId: string): Promise<void>

  // Email processing
  async processIncomingEmail(email: GmailMessage): Promise<void>
  async matchEmailToQuote(email: ParsedEmail): Promise<EmailMatchResult>
  async updateQuoteStatusFromEmail(email: ParsedEmail): Promise<void>

  // Utility methods
  async shouldProcessEmail(email: GmailMessage): Promise<boolean>
  async isEmailFromClient(email: ParsedEmail): Promise<boolean>
}
```

#### 3.2 Email Matching Algorithms

```typescript
interface EmailMatchResult {
  quoteId: string | null
  confidence: 'high' | 'medium' | 'low'
  matchType: 'thread' | 'subject' | 'client' | 'body'
  reasoning: string
}

// Matching strategies in order of reliability:
// 1. Thread ID matching (most reliable)
// 2. Subject line matching with quote ID
// 3. Client email matching
// 4. Quote reference in email body
// 5. Company domain matching
```

#### 3.3 Sync Configuration

```typescript
interface SyncConfig {
  enabled: boolean
  frequencyMinutes: number
  maxEmailsPerSync: number
  syncUnreadOnly: boolean
  includeLabels: string[]
  excludeLabels: string[]
}
```

### Phase 4: Server Actions & API Endpoints

#### 4.1 New Server Actions

```typescript
// src/app/server-actions/email-sync.ts

export async function syncIncomingEmailsAction(companyId: string)
export async function getIncomingEmailsAction(conversationId: string)
export async function markEmailAsReadAction(messageId: string)
export async function enableEmailSyncAction(companyId: string)
export async function disableEmailSyncAction(companyId: string)
export async function updateSyncConfigAction(
  companyId: string,
  config: SyncConfig,
)
export async function getSyncStatusAction(companyId: string)
```

#### 4.2 API Endpoints

```typescript
// src/app/api/email-sync/route.ts
POST /api/email-sync - Manual sync trigger for all companies
GET /api/email-sync/status - Get global sync status

// src/app/api/email-sync/[companyId]/route.ts
POST /api/email-sync/[companyId] - Sync specific company
PUT /api/email-sync/[companyId]/enable - Enable sync
PUT /api/email-sync/[companyId]/disable - Disable sync
PUT /api/email-sync/[companyId]/config - Update sync configuration
GET /api/email-sync/[companyId]/status - Get company sync status

// src/app/api/email-sync/[companyId]/emails/route.ts
GET /api/email-sync/[companyId]/emails - Get recent incoming emails
POST /api/email-sync/[companyId]/emails/[messageId]/read - Mark as read
```

### Phase 5: UI Enhancements

#### 5.1 Enhanced Conversation Detail Page

```typescript
// Updated conversation view with incoming emails
interface EnhancedEmailThread extends EmailThread {
  direction: 'inbound' | 'outbound';
  fromEmail?: string;
  isRead: boolean;
  gmailLabels: string[];
  emailType: string;
}

// UI Components
- EmailDirectionIndicator: Shows inbound/outbound with icons
- UnreadEmailBadge: Visual indicator for unread emails
- EmailSyncStatus: Shows sync status and last sync time
- EmailActions: Mark as read, reply, forward actions
```

#### 5.2 Email Sync Settings Component

```typescript
// src/app/(protected)/conversations/_components/email-sync-settings.tsx

interface EmailSyncSettingsProps {
  companyId: string;
  currentConfig: SyncConfig;
  onConfigUpdate: (config: SyncConfig) => void;
}

// Features:
- Enable/disable automatic sync
- Sync frequency settings (5, 15, 30, 60 minutes)
- Last sync status display with timestamp
- Manual sync button with loading state
- Email notification preferences
- Label filtering options
```

#### 5.3 Real-time Updates

```typescript
// WebSocket or polling implementation
interface EmailUpdate {
  type: 'new_email' | 'email_read' | 'sync_status';
  companyId: string;
  conversationId?: string;
  data: any;
}

// Real-time features:
- New email notifications with toast
- Quote status change alerts
- Unread email indicators in navigation
- Live sync status updates
```

### Phase 6: Quote Status Automation

#### 6.1 AI-Powered Response Analysis

```typescript
// Use Gemini to analyze email content
interface EmailAnalysis {
  intent: 'accept' | 'reject' | 'negotiate' | 'question' | 'neutral'
  confidence: number
  suggestedQuoteStatus: QuoteStatus
  keyPoints: string[]
  actionRequired: boolean
  suggestedResponse?: string
}

// AI Analysis Prompts
const ANALYSIS_PROMPTS = {
  accept: 'Analyze if this email indicates quote acceptance',
  reject: 'Analyze if this email indicates quote rejection',
  negotiate: 'Analyze if this email indicates price negotiation',
  question: 'Analyze if this email contains questions about the quote',
}
```

#### 6.2 Automated Status Updates

```typescript
// Automatic quote status updates based on email content
const STATUS_UPDATE_RULES = {
  accepted: ['accept', 'approved', 'go ahead', 'proceed'],
  rejected: ['reject', 'decline', 'not interested', 'too expensive'],
  revised: ['revise', 'modify', 'adjust', 'change'],
  negotiate: ['negotiate', 'discuss', 'counter', 'better price'],
}

// Implementation:
// 1. Analyze email content with AI
// 2. Extract key phrases and sentiment
// 3. Match against status update rules
// 4. Update quote status with confidence level
// 5. Send notification to user
```

#### 6.3 Smart Notifications

```typescript
// Intelligent notification system
interface EmailNotification {
  type: 'quote_accepted' | 'quote_rejected' | 'negotiation' | 'question'
  priority: 'high' | 'medium' | 'low'
  actionRequired: boolean
  suggestedActions: string[]
  quoteId: string
  clientEmail: string
}
```

## Technical Considerations

### Rate Limiting & Quotas

```typescript
// Gmail API quotas:
// - 1 billion requests per day
// - 250 requests per second per user
// - 100 requests per 100 seconds per user

// Implementation strategies:
- Implement exponential backoff for failed requests
- Cache email data to minimize API calls
- Use batch requests where possible
- Monitor quota usage and implement alerts
```

### Privacy & Security

```typescript
// Security considerations:
- Only sync emails related to quote conversations
- Implement data retention policies (30 days by default)
- Secure storage of email content with encryption
- User consent for email monitoring
- GDPR compliance for EU users
- Audit logging for all email access
```

### Performance Optimization

```typescript
// Performance strategies:
- Background sync with configurable intervals
- Efficient email matching algorithms with caching
- Database indexing for fast queries
- Pagination for large email threads
- Lazy loading of email content
- Compression for email storage
```

### Error Handling

```typescript
// Comprehensive error handling:
interface SyncError {
  type: 'rate_limit' | 'auth_error' | 'network_error' | 'quota_exceeded';
  message: string;
  retryAfter?: number;
  actionRequired: boolean;
}

// Error recovery strategies:
- Automatic retry with exponential backoff
- User notification for critical errors
- Fallback to manual sync
- Graceful degradation of features
```

## Implementation Timeline

### Week 1: Foundation

- [ ] Database schema updates and migrations
- [ ] Enhanced Gmail API integration
- [ ] Basic email fetching functionality
- [ ] Email parsing utilities

### Week 2: Core Functionality

- [ ] Email sync service implementation
- [ ] Email matching algorithms
- [ ] Server actions and API endpoints
- [ ] Basic UI updates for conversation view

### Week 3: UI & UX

- [ ] Enhanced conversation detail page
- [ ] Email sync settings component
- [ ] Real-time update system
- [ ] Notification system

### Week 4: Automation & Polish

- [ ] AI-powered response analysis
- [ ] Automated quote status updates
- [ ] Performance optimization
- [ ] Testing and bug fixes

## Benefits & Impact

### For Users

1. **Complete Conversation Tracking**: See both sent and received emails in one place
2. **Automated Quote Management**: Quote status updates based on client responses
3. **Better Client Communication**: Never miss important client emails
4. **Professional Workflow**: Maintain complete email history for each quote
5. **Time Savings**: Automated analysis and status updates

### For Business

1. **Improved Customer Service**: Faster response to client inquiries
2. **Better Quote Tracking**: Real-time visibility into quote status
3. **Data Insights**: Analytics on client response patterns
4. **Professional Image**: Complete conversation management
5. **Competitive Advantage**: Advanced email integration features

## Future Enhancements

### Advanced Features

- **Email Templates**: AI-generated responses based on client emails
- **Smart Scheduling**: Optimal time suggestions for follow-ups
- **Analytics Dashboard**: Client response time and pattern analysis
- **Mobile Push Notifications**: Real-time alerts for important emails
- **Integration with CRM**: Export conversation data to external systems

### AI Enhancements

- **Sentiment Analysis**: Track client satisfaction over time
- **Predictive Analytics**: Forecast quote acceptance probability
- **Smart Categorization**: Automatically categorize email types
- **Response Suggestions**: AI-powered response recommendations

## Conclusion

The incoming email tracking system will transform our email management from a one-way sending system into a complete conversation management platform. This enhancement will provide users with unprecedented visibility into their client communications while automating routine tasks and improving overall workflow efficiency.

The implementation follows a phased approach to ensure stability and user adoption, with each phase building upon the previous one to create a robust and scalable system.
