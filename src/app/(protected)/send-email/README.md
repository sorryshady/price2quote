# Send Email Functionality

## Overview

The send-email page provides a complete email management system for sending quotes to clients via Gmail integration. Users can select quotes, compose emails with AI assistance, and track conversations.

## Features

### 🔐 Gmail OAuth Integration

- **Connection Management**: Connect/disconnect Gmail accounts per company
- **Token Storage**: Secure storage of OAuth tokens with refresh capability
- **Status Display**: Visual indicator showing connected email address
- **Security**: CSRF protection and secure cookie handling

### 📧 Email Composition System

- **Quote Selection**: Searchable quote cards with filtering by status
- **Smart Subject Lines**: AI-generated subjects based on quote status
- **AI Email Generation**: Context-aware email content generation
- **Manual Editing**: Full control over email content
- **CC/BCC Support**: Optional carbon copy and blind carbon copy fields

### 🎯 Status-Based Email Types

#### 1. Draft → First Time Sending

- **Subject**: "Quote for [Project Name] - [Company Name]"
- **Content**: Professional quote presentation with executive summary
- **Purpose**: Initial quote delivery

#### 2. Sent → Follow-up

- **Subject**: "Follow-up: Quote for [Project Name]"
- **Content**: Polite follow-up asking for feedback/decision
- **Purpose**: Check on quote status and encourage response

#### 3. Revised → Updated Quote

- **Subject**: "Updated Quote for [Project Name] - Revised"
- **Content**: Explanation of changes and new pricing
- **Purpose**: Deliver revised quote with context

#### 4. Accepted → Thank You

- **Subject**: "Thank You - Project Confirmation"
- **Content**: Gratitude, next steps, and project kickoff details
- **Purpose**: Confirm acceptance and outline next steps

#### 5. Rejected → Feedback Request

- **Subject**: "Thank You for Your Consideration"
- **Content**: Professional response, request for feedback on rejection reasons
- **Purpose**: Maintain relationship and gather feedback

### 💬 Conversation Tracking

- **Email Threading**: Save all sent emails for conversation history
- **Chat Interface**: Conversations route with chat-like interface
- **Reply Instructions**: Every email includes "Please reply to this email for smoother conversations"

## UI Components

### Quote Selection Interface

```
┌─────────────────────────────────────────────────┐
│ 🔍 Search quotes...                             │
├─────────────────────────────────────────────────┤
│ [Filter: All] [Draft] [Sent] [Accepted] [Rejected]
├─────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐         │
│ │ Project: Birthday│ │ Project: Website│         │
│ │ Client: John Doe│ │ Client: Jane Co │         │
│ │ Amount: $500    │ │ Amount: $1,200  │         │
│ │ Status: Draft   │ │ Status: Sent    │         │
│ │ [Select]        │ │ [Select]        │         │
│ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────┘
```

### Email Composition Form

```
┌─────────────────────────────────────────────────┐
│ To: [client@email.com]                          │
│ Subject: [AI-generated subject] [Edit]          │
│ CC: [optional]                                  │
│ BCC: [optional]                                 │
├─────────────────────────────────────────────────┤
│ Message:                                        │
│ [AI-generated content]                          │
│                                                 │
│ [Generate Email Body with AI] [Send Email]      │
└─────────────────────────────────────────────────┘
```

## Database Schema

### Gmail Connections Table

```sql
CREATE TABLE gmail_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  gmail_email VARCHAR(255) NOT NULL,
  access_token VARCHAR(2048) NOT NULL,
  refresh_token VARCHAR(2048),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);
```

### Email Threads Table (Future)

```sql
CREATE TABLE email_threads (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id),
  user_id UUID REFERENCES users(id),
  client_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent',
  thread_id VARCHAR(255) -- For Gmail thread tracking
);
```

## API Endpoints

### Gmail OAuth

- `GET /api/auth/gmail` - Initiate Gmail OAuth
- `GET /api/auth/callback/gmail` - Handle OAuth callback
- `POST /api/auth/gmail/disconnect` - Disconnect Gmail account

### Email Management (Future)

- `POST /api/gmail/send` - Send email via Gmail API
- `GET /api/email/threads` - Get email conversation history
- `POST /api/email/generate` - Generate AI email content

## Server Actions

### Gmail Management

- `getGmailConnectionAction(companyId)` - Get connection status
- `disconnectGmailAction(companyId)` - Disconnect Gmail
- `refreshGmailTokenAction(companyId)` - Refresh expired tokens

### Email Actions (Future)

- `sendEmailAction(data)` - Send email and update quote status
- `generateEmailContentAction(quoteId, type)` - Generate AI email content
- `getEmailThreadsAction(quoteId)` - Get conversation history

## State Management

### Local State

```typescript
interface EmailState {
  selectedQuote: Quote | null
  clientEmail: string
  subject: string
  cc: string
  bcc: string
  message: string
  isGenerating: boolean
  isSending: boolean
}
```

### Quote Selection State

```typescript
interface QuoteSelectionState {
  searchQuery: string
  statusFilter: QuoteStatus | 'all'
  selectedQuoteId: string | null
}
```

## AI Integration

### Email Content Generation

- **Context**: Quote data, company info, client details
- **Status Awareness**: Different content based on quote status
- **Tone**: Professional, friendly, and appropriate for each situation
- **Customization**: Users can edit AI-generated content

### Prompt Examples

```
For Draft quotes:
"Generate a professional email introducing the quote for [project] to [client]. Include the executive summary and key highlights."

For Follow-ups:
"Generate a polite follow-up email for the quote sent to [client] for [project]. Ask for feedback and next steps."

For Accepted quotes:
"Generate a thank you email for the accepted quote for [project]. Include next steps and project kickoff details."
```

## Error Handling

### Gmail Connection Errors

- OAuth flow failures
- Token expiration
- Network connectivity issues
- Invalid permissions

### Email Sending Errors

- Gmail API rate limits
- Invalid email addresses
- Message size limits
- Network timeouts

### User Feedback

- Toast notifications for success/error states
- Loading states during operations
- Clear error messages with actionable steps

## Security Considerations

### OAuth Security

- CSRF protection with state parameters
- Secure cookie handling
- Token encryption in database
- Automatic token refresh

### Email Security

- Input validation for email addresses
- Content sanitization
- Rate limiting for email sending
- Audit logging for sent emails

## Future Enhancements

### Email Templates

- Customizable email templates
- Template library for common scenarios
- Branded email signatures

### Advanced Features

- Email scheduling
- Read receipts
- Email analytics
- Bulk email sending

### Integration Features

- Calendar integration for project scheduling
- CRM integration for client management
- Invoice generation from accepted quotes

## Development Notes

### File Structure

```
src/app/(protected)/send-email/
├── page.tsx              # Main page component
├── README.md             # This documentation
├── _components/          # Page-specific components
│   ├── quote-selector.tsx
│   ├── email-form.tsx
│   └── email-preview.tsx
└── _hooks/               # Custom hooks
    ├── use-email-state.ts
    └── use-quote-selection.ts
```

### Key Dependencies

- Gmail API for email sending
- Gemini AI for content generation
- TanStack Query for data fetching
- React Hook Form for form management

### Testing Strategy

- Unit tests for AI content generation
- Integration tests for Gmail API
- E2E tests for complete email flow
- Accessibility testing for form components
