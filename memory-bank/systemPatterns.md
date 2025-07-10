# System Patterns

## Architecture Overview

PricingGPT follows a modern Next.js application architecture with clear separation of concerns and scalable patterns.

### Core Technologies

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Backend**: Next.js API routes, Server Actions
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: Supabase for file storage
- **AI**: Google Gemini for pricing and content generation
- **Email**: Gmail API integration
- **Authentication**: Custom auth with session management
- **Payments**: Dodo Payments with webhook integration

### Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (protected)/       # Protected app pages
│   ├── (public)/          # Public pages
│   ├── api/               # API routes
│   └── server-actions/    # Server-side business logic
├── components/            # Reusable React components
├── db/                   # Database schema and migrations
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and integrations
└── types/                # TypeScript type definitions
```

## Database Patterns

### Schema Organization

Database schema is modularly organized with dedicated files:

```typescript
// Primary entities
users.ts // User accounts and subscription tiers
companies.ts // Company profiles and settings
quotes.ts // Quote data and AI content
services.ts // Company services catalog

// Relationship tables
quote - services.ts // Many-to-many quote-service relationships
payments.ts // Payment tracking and history
subscriptions.ts // Subscription status and billing

// Integration tables
gmail - connections.ts // Gmail OAuth tokens
email - threads.ts // Email conversation tracking
```

### **Subscription Billing System Patterns**

**Payment Processing Architecture**:

```
Dodo Payments → Webhook → Database Updates → Auth State Refresh → UI Updates
```

**Key Components**:

1. **Webhook Handler** (`/api/webhooks/dodo-payments/route.ts`):

   - Processes payment.succeeded, subscription events
   - Updates payments table and user subscription tiers
   - Handles UUID conflicts by linking payments to users, not subscriptions

2. **Payment Tracking** (`payments` table):

   - Stores payment_id, amount, currency, status, payment_method
   - Links to users via userId (UUID)
   - Tracks both subscription and one-time payments

3. **Subscription Management** (`/lib/dodo-payments.ts`):

   - `updateUserSubscriptionTier()`: Updates user.subscriptionTier based on payment status
   - `handleSubscriptionWebhook()`: Processes subscription events and tier updates
   - `cancelUserSubscription()`: Handles cancellations with retained access until period end

4. **Smart Cancellation Flow**:

   - Cancellation marks subscription as 'cancelled' but keeps user on pro tier
   - Background expiry checking downgrades users when period actually ends
   - `/api/auth/me` endpoint checks for expired subscriptions

5. **Billing Display Logic**:

   - Free tier: Shows only status
   - Active subscription: Shows next billing date and current period
   - Cancelled subscription: Shows access expiry date (no next billing)

6. **Real-time Auth Updates**:
   - Subscription changes trigger immediate auth state refresh
   - UI components automatically update subscription status
   - Navigation badges reflect current subscription state

### Relationship Patterns

- **One-to-Many**: Users → Companies, Companies → Quotes
- **Many-to-Many**: Quotes ↔ Services (via quote-services junction)
- **Soft References**: Quotes reference companies by ID for flexibility

### Data Integrity

- Foreign key constraints for critical relationships
- Unique constraints to prevent duplicates
- Soft deletes for maintaining data history

## Authentication Patterns

### Custom Auth System

- Session-based authentication with database storage
- OAuth integration (Google, GitHub) with account linking
- Password-based registration with email verification

### Session Management

```typescript
// Server-side session validation
const session = await getSession(request)
if (!session) redirect('/login')

// Client-side auth state
const { user, isLoading } = useAuth()
```

### Route Protection

- Middleware-based route protection
- Server-side session validation
- Client-side auth state management

## Server Actions Pattern

### Organization

Server actions are organized by domain:

```typescript
// src/app/server-actions/index.ts
export * from './auth'
export * from './company'
export * from './quote'
export * from './subscription'
export * from './dashboard'
```

### Error Handling

Consistent error handling across all server actions:

```typescript
export async function createQuoteAction(data: CreateQuoteData) {
  try {
    // Validation
    const validatedData = createQuoteSchema.parse(data)

    // Business logic
    const result = await processQuote(validatedData)

    // Success response
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating quote:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

### Type Safety

All server actions use TypeScript with proper input/output types:

```typescript
interface CreateQuoteResult {
  success: boolean
  data?: Quote
  error?: string
}
```

## Component Patterns

### Composition Over Configuration

Components are designed for reusability and composition:

```typescript
// Generic UI components
<Button variant="primary" size="lg">Save Quote</Button>
<Card>
  <CardHeader>
    <CardTitle>Quote Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Custom Hooks Pattern

Business logic is extracted into custom hooks:

```typescript
// Data fetching hooks
const { quotes, isLoading } = useQuotesQuery()
const { user } = useAuth()

// Business logic hooks
const { canCreateQuote, quotesRemaining } = useSubscriptionLimits()
const { companies, selectedCompany } = useCompanies()
```

### Loading States

Consistent loading patterns throughout the app:

```typescript
// Skeleton loading for better UX
if (isLoading) return <QuotesSkeleton />

// Error states
if (error) return <ErrorMessage />

// Empty states
if (!quotes.length) return <EmptyQuotesState />
```

## AI Integration Patterns

### Prompt Engineering

Structured prompts for consistent AI responses:

```typescript
const prompt = `
Context: Company specializes in ${services.join(', ')}
Location: ${location}
Budget: ${budget}
Complexity: ${complexity}

Generate pricing recommendations for each service with:
- Unit price (not total price)
- Confidence level (high/medium/low)
- Market analysis
- Negotiation tips
`
```

### Response Validation

AI responses are validated and processed:

```typescript
const aiResponse = await gemini.generateContent(prompt)
const recommendations = validateAIRecommendations(aiResponse)
```

### Context Management

AI has access to relevant business context:

```typescript
// Company context
const companyContext = {
  summary: company.aiSummary,
  services: company.services,
  currency: company.currency,
}

// Enhanced prompts with context
const enhancedPrompt = buildPromptWithContext(prompt, companyContext)
```

## Email Integration Patterns

### Gmail OAuth Flow

```
User → Connect Gmail → OAuth → Store Tokens → Use for Sending
```

### Token Management

- Automatic token refresh before expiration
- Secure storage of refresh tokens
- Error handling for invalid tokens

### Thread Continuation

Email threads are tracked for proper conversation flow:

```typescript
// Check for existing thread
const existingThread = await getEmailThread(quoteId)

// Send email with proper thread ID
await sendEmail({
  threadId: existingThread?.gmailThreadId,
  // ... other email data
})
```

## State Management Patterns

### TanStack Query

Efficient data fetching and caching:

```typescript
// Query hooks with caching
export function useQuotesQuery() {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: getQuotesAction,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Mutation with cache invalidation
const createQuoteMutation = useMutation({
  mutationFn: createQuoteAction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['quotes'] })
  },
})
```

### Local Storage

Strategic use of localStorage for form persistence:

```typescript
// Form state persistence
useEffect(() => {
  const savedQuote = localStorage.getItem('currentQuote')
  if (savedQuote) {
    const quoteData = JSON.parse(savedQuote)
    setFormState(quoteData)
  }
}, [])
```

## Error Handling Patterns

### Global Error Boundaries

React error boundaries catch and handle component errors:

```typescript
// Error boundary component
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryProvider>
      {children}
    </ErrorBoundaryProvider>
  )
}
```

### API Error Handling

Consistent error handling across API routes:

```typescript
// API route error handling
export async function POST(request: NextRequest) {
  try {
    // Process request
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
```

### User Feedback

Toast notifications for user feedback:

```typescript
// Success feedback
toast.success('Quote created successfully!')

// Error feedback
toast.error('Failed to create quote. Please try again.')
```

## Performance Patterns

### Code Splitting

Dynamic imports for large components:

```typescript
// Lazy loading for heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Loading boundary
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### Bundle Optimization

- Tree shaking for unused code
- Image optimization with Next.js Image component
- CSS optimization with Tailwind

### Database Optimization

- Efficient queries with proper joins
- Indexing on frequently queried fields
- Pagination for large data sets

## Security Patterns

### Input Validation

Zod schemas for runtime validation:

```typescript
const createQuoteSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  clientEmail: z.string().email(),
  // ... other fields
})
```

### Authentication Security

- CSRF protection for forms
- Secure session management
- Rate limiting on sensitive endpoints

### Data Security

- Environment variables for secrets
- Encryption for sensitive data
- Proper error messages (no sensitive data leakage)

## Monitoring and Logging

### Error Tracking

Comprehensive error logging:

```typescript
// Server-side logging
console.error('Database error:', error)

// Client-side error boundaries
// Automatic error reporting
```

### Performance Monitoring

- Build time tracking
- Bundle size monitoring
- Database query performance
- **Payment processing monitoring**

### User Analytics

- Feature usage tracking
- Performance metrics
- **Subscription conversion tracking**

## Testing Patterns

### Manual Testing Approach

Current testing strategy focuses on:

- Critical user flows (registration, quote creation, email sending)
- Cross-browser compatibility
- Mobile responsiveness
- **Subscription billing flows**
- Error scenarios

### Future Testing Strategy

Planned testing implementation:

```typescript
// Unit tests for business logic
describe('Quote Creation', () => {
  it('should calculate total correctly', () => {
    // Test implementation
  })
})

// Integration tests for API endpoints
describe('Auth API', () => {
  it('should authenticate valid users', () => {
    // Test implementation
  })
})
```

## Scalability Patterns

### Horizontal Scaling

Architecture supports scaling:

- Stateless server design
- Database connection pooling
- CDN for static assets
- **Payment processing redundancy**

### Vertical Scaling

Performance optimizations:

- Efficient database queries
- Component memoization
- Image optimization
- **Payment webhook processing optimization**

### Future Scaling Considerations

- Message queues for background processing
- Microservices for complex features
- Caching layers (Redis)
- **Payment processing monitoring and alerting**

This architecture provides a solid foundation for current needs while supporting future growth and feature expansion.
