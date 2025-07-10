# Technical Context

## Core Technology Stack

### Frontend

- **Next.js 15.3.1** with App Router - Latest stable version with enhanced performance
- **React 18** - Modern React with concurrent features
- **TypeScript 5** - Strict typing for better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library built on Radix UI

### Backend

- **Next.js API Routes** - Server-side API endpoints
- **Server Actions** - Direct server functions for form handling
- **PostgreSQL** - Primary database for data persistence
- **Drizzle ORM** - Type-safe database operations

### Storage & Assets

- **Supabase Storage** - File storage for company logos and email attachments
- **Next.js Image Optimization** - Optimized image delivery

### Authentication & Authorization

- **Custom Auth System** - Session-based authentication with database storage
- **OAuth Integration** - Google and GitHub authentication
- **Email Verification** - JWT-based email verification system

### **Payment Processing & Subscriptions**

- **Dodo Payments** - Payment processing with webhook integration
- **Subscription Management** - Free/Pro tier system with usage tracking
- **Webhook Processing** - Real-time payment event handling
- **Smart Cancellation** - Retained access until billing period ends

### AI & Machine Learning

- **Google Gemini AI** - Intelligent pricing recommendations and content generation
- **Prompt Engineering** - Structured prompts for consistent AI responses
- **Context-Aware AI** - Company summaries and market analysis integration

### Email Integration

- **Gmail API** - OAuth-based email sending and thread management
- **Email Threading** - Conversation continuity and tracking
- **Token Management** - Automatic token refresh and secure storage

### State Management

- **TanStack Query (React Query)** - Server state management with intelligent caching
- **React Hooks** - Local state management
- **localStorage** - Client-side persistence for form data

### Development Tools

- **TypeScript** - Static type checking
- **ESLint** - Code linting with custom rules
- **Prettier** - Code formatting
- **Biome** - Fast linting and formatting (alternative to ESLint/Prettier)

## Database Architecture

### Primary Tables

```sql
-- Core entities
users          -- User accounts with subscription tiers
companies      -- Company profiles and settings
services       -- Company service catalog
quotes         -- Quote data with AI content
quote_services -- Many-to-many quote-service relationships

-- Payment & Subscription System
payments       -- Payment transaction history
subscriptions  -- Subscription status and billing periods

-- Integrations
gmail_connections -- Gmail OAuth tokens per company
email_threads    -- Email conversation tracking
```

### **Payment System Schema**

```sql
-- Payments table for transaction tracking
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  dodo_payment_id TEXT UNIQUE NOT NULL,
  dodo_subscription_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status payment_status NOT NULL,
  payment_method TEXT,
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Subscriptions table with billing periods
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  dodo_subscription_id TEXT UNIQUE NOT NULL,
  status subscription_status NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Data Relationships

- Users have many Companies (with subscription limits)
- Companies have many Quotes
- Quotes have many Services (many-to-many relationship)
- Users have payment history through Payments table
- Gmail connections are per company
- Email threads track conversation history

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=...
SESSION_SECRET=...

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Gmail API
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...

# AI Services
GEMINI_API_KEY=...

# Email Service
RESEND_API_KEY=...

# Storage
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Payment Processing
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_WEBHOOK_SECRET=...
NEXT_PUBLIC_DODO_PAYMENTS_CONNECT_ID=...
```

### Development vs Production

- **Development**: Uses Mailhog for email testing
- **Production**: Uses Resend for email delivery
- **Both**: PostgreSQL database with connection pooling

## API Architecture

### RESTful Endpoints

```
/api/auth/
├── login              # User authentication
├── logout             # Session termination
├── register           # User registration
├── verify-email       # Email verification
├── forgot-password    # Password reset
├── reset-password     # Password reset confirmation
├── me                 # Current user data with subscription expiry checking
└── callback/          # OAuth callbacks

/api/subscriptions/
├── create-checkout-session  # Subscription creation
└── cancel                   # Subscription cancellation

/api/webhooks/
└── dodo-payments           # Payment webhook handler

/api/send-email             # Email sending via Gmail
/api/send-quote-email       # Quote-specific email sending
```

### **Payment Webhook Integration**

The `/api/webhooks/dodo-payments/route.ts` endpoint processes:

- `payment.succeeded` - Updates payment records and user subscription tiers
- `subscription.active` - Activates user subscriptions
- `subscription.renewed` - Handles automatic renewals
- `subscription.deleted` - Manages cancellations with retained access

### Server Actions

```
server-actions/
├── auth.ts            # Authentication actions
├── company.ts         # Company management
├── quote.ts           # Quote operations
├── subscription.ts    # Subscription tracking
├── dashboard.ts       # Dashboard data
└── index.ts           # Consolidated exports
```

## AI Integration

### Google Gemini Configuration

- **Model**: gemini-pro for text generation
- **Rate Limits**: Configured for production usage
- **Error Handling**: Graceful fallbacks and retry logic

### AI Features

- **Company Summaries**: Background generation of business context
- **Quote Pricing**: Intelligent pricing recommendations with confidence levels
- **Market Analysis**: Location-based market insights
- **Email Generation**: Context-aware email composition

### Prompt Engineering Patterns

```typescript
const prompt = `
Context: ${companyContext}
Task: ${specificTask}
Format: ${expectedFormat}
Constraints: ${businessRules}
`
```

## Performance Optimizations

### Caching Strategy

- **TanStack Query**: 5-minute stale time, 10-minute cache time
- **Browser Caching**: Optimized for static assets
- **Database Queries**: Efficient joins and indexing

### Loading States

- **Skeleton Loading**: Content-specific loading states
- **Progressive Loading**: Prioritized critical content
- **Background Refetching**: Fresh data without user interruption

### Bundle Optimization

- **Code Splitting**: Dynamic imports for large components
- **Tree Shaking**: Elimination of unused code
- **Image Optimization**: Next.js Image component with automatic optimization

## Security Implementation

### Authentication Security

- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: Built-in Next.js protection
- **OAuth Security**: Proper state parameter validation

### Data Security

- **Input Validation**: Zod schemas for runtime validation
- **SQL Injection Prevention**: Drizzle ORM prepared statements
- **Environment Variables**: Secure secret management

### **Payment Security**

- **Webhook Verification**: Cryptographic signature validation
- **PCI Compliance**: Handled by Dodo Payments
- **Secure Token Storage**: Encrypted payment method storage

## Deployment Architecture

### Build Process

- **Build Time**: ~9 seconds optimized build
- **Type Checking**: Full TypeScript validation
- **Bundle Analysis**: Size monitoring and optimization

### Production Requirements

- **Node.js 18+**: Runtime environment
- **PostgreSQL 14+**: Database server
- **Redis** (future): Caching layer
- **CDN**: Static asset delivery

### **Payment Infrastructure**

- **Webhook Endpoints**: Secure HTTPS endpoints for payment events
- **Redundancy**: Multiple webhook URL support
- **Monitoring**: Payment processing success rate tracking

## Development Workflow

### Code Quality

```bash
# Development commands
pnpm dev           # Development server
pnpm build         # Production build
pnpm lint          # ESLint checking
pnpm format        # Prettier formatting
pnpm type-check    # TypeScript validation
```

### Testing Strategy

- **Manual Testing**: Comprehensive user flow validation
- **Build Validation**: Pre-deployment build verification
- **Database Testing**: Migration and schema validation
- **Payment Testing**: Webhook and subscription flow validation

### Version Control

- **Git Hooks**: Pre-commit linting and formatting
- **Branch Strategy**: Feature branches with main deployment
- **Code Review**: Required for all changes

## Monitoring & Analytics

### Application Monitoring

- **Error Tracking**: Console logging and error boundaries
- **Performance Monitoring**: Core Web Vitals tracking
- **User Analytics**: Feature usage and conversion tracking

### **Payment Monitoring**

- **Transaction Success Rates**: Real-time payment processing metrics
- **Webhook Delivery**: Event processing success tracking
- **Subscription Health**: Churn and renewal rate monitoring

### Database Monitoring

- **Query Performance**: Slow query identification
- **Connection Pooling**: Resource utilization tracking
- **Data Integrity**: Constraint violation monitoring

## Scalability Considerations

### Current Capacity

- **User Load**: Designed for thousands of concurrent users
- **Database**: Optimized queries with proper indexing
- **File Storage**: Supabase with CDN delivery

### Future Scaling

- **Horizontal Scaling**: Stateless application design
- **Database Scaling**: Read replicas and connection pooling
- **Caching Layer**: Redis for session and query caching
- **Microservices**: Feature-specific service separation

### **Payment Scaling**

- **Webhook Processing**: Asynchronous event handling
- **Payment Queue**: Background processing for large volumes
- **Redundancy**: Multiple payment processor support

## Integration Dependencies

### External Services

- **Dodo Payments**: Payment processing and subscription management
- **Gmail API**: Email sending and thread management
- **Google Gemini**: AI content and pricing generation
- **Supabase**: File storage and real-time features
- **Resend**: Production email delivery

### Service Level Agreements

- **Payment Processing**: 99.9% uptime with Dodo Payments
- **Email Delivery**: 99.9% delivery rate with Resend
- **AI Services**: Rate-limited but reliable with Google Gemini
- **Storage**: 99.9% availability with Supabase

## Technical Debt & Future Improvements

### Current Optimizations

- **Build Time**: Already optimized at 9 seconds
- **Bundle Size**: Efficient code splitting implemented
- **Database Queries**: Optimized with proper relationships
- **Payment Processing**: Streamlined webhook handling

### Planned Improvements

- **Automated Testing**: Unit and integration test suite
- **Real-time Features**: WebSocket integration for live updates
- **Advanced Caching**: Redis implementation for better performance
- **Monitoring**: APM tool integration for detailed insights

This technical foundation provides a robust, scalable platform capable of handling significant growth while maintaining performance and reliability.
