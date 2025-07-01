# System Patterns

## Architecture Overview

The application follows a modern Next.js 14 architecture with App Router, featuring:

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes and server actions
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: Supabase storage for file uploads
- **AI**: Google Gemini for intelligent features
- **State Management**: TanStack Query for server state, React hooks for local state
- **Authentication**: NextAuth.js with OAuth providers

## Key Design Patterns

### 1. **AI Integration Pattern**

**Company Summary Generation:**

```typescript
// Background processing with status tracking
const [company] = await db.insert(companies).values(data).returning()
// Trigger AI generation in background
generateCompanySummary(company.id)
```

**AI Quote Pricing with Confidence Levels:**

```typescript
// Structured AI prompts with validation
const aiResponse = await generateAIAssistedQuote({
  companyData: {
    /* company context with AI summary */
  },
  projectData: {
    /* project requirements */
  },
})
// Validate and apply confidence thresholds
const validatedResponse = validateConfidenceLevels(aiResponse)
```

**Enhanced Context Integration:**

- Company AI summaries included in pricing prompts
- Market analysis based on location and business context
- Confidence levels (high/medium/low) with visual indicators
- Price range validation with min/max thresholds

### 2. **Subscription Management Pattern**

**Real-time Usage Tracking:**

```typescript
// Database functions for monthly quote counting
const currentQuotes = await db.execute(sql`
  SELECT COUNT(*) FROM quotes 
  WHERE user_id = ${userId} 
  AND created_at >= date_trunc('month', CURRENT_DATE)
`)
```

**Limit Enforcement:**

```typescript
// Server-side validation before operations
const canCreate = await canUserCreateQuote(userId, subscriptionTier)
if (!canCreate) {
  return { success: false, error: 'Quote limit reached' }
}
```

**UI Integration:**

- Header-based subscription status display
- TanStack Query hooks for efficient caching
- Real-time updates with background refetching

### 3. **Data Fetching Pattern (TanStack Query)**

**Optimized Caching Strategy:**

```typescript
// 5-minute stale time, 10-minute cache time
const { data: companies } = useCompaniesQuery({
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
})
```

**Skeleton Loading States:**

```typescript
// Meaningful loading states over spinners
if (isLoading) return <SidebarSkeleton />
if (error) return <ErrorState />
```

**Background Refetching:**

- Fresh data fetched in background when stale
- No loading flashes or user interruption
- Automatic retries for failed requests

### 4. **Form Management Pattern**

**Multi-step Forms with Persistence:**

```typescript
// localStorage persistence with hydration
const [currentStep, setCurrentStep] = useState(() => {
  if (typeof window !== 'undefined') {
    return parseInt(localStorage.getItem('currentStep') || '0')
  }
  return 0
})
```

**Validation and Error Handling:**

```typescript
// Zod schema validation with server actions
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: getStoredValues(),
})
```

### 5. **File Upload Pattern**

**Supabase Storage Integration:**

```typescript
// Controlled upload with preview
const uploadLogo = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('company-logos')
    .upload(`${userId}/${filename}`, file)
}
```

**Base64 Preview:**

```typescript
// Immediate preview while uploading
const preview = await fileToBase64(file)
setLogoPreview(preview)
```

### 6. **Server Actions Pattern**

**Modular Organization:**

```
server-actions/
├── auth.ts          # Authentication actions
├── company.ts       # Company management
├── quote.ts         # Quote operations
├── subscription.ts  # Subscription tracking
└── index.ts         # Clean exports
```

**Type-safe Implementation:**

```typescript
// Proper TypeScript interfaces throughout
interface CreateQuoteData {
  userId: string
  companyId: string
  // ... other fields
}

export async function createQuoteAction(data: CreateQuoteData) {
  // Implementation with proper error handling
}
```

### 7. **Component Architecture Pattern**

**Atomic Design with Feature Organization:**

```
components/
├── ui/              # Reusable UI components
├── form-ui/         # Form-specific components
├── navbar/          # Navigation components
└── providers/       # Context providers
```

**Skeleton Loading Pattern:**

```typescript
// Content-specific skeletons
export function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted animate-pulse rounded" />
      {/* More skeleton elements */}
    </div>
  )
}
```

### 8. **Error Handling Pattern**

**Graceful Degradation:**

```typescript
// Error boundaries and fallbacks
try {
  const result = await action()
  if (!result.success) {
    // Handle specific errors
  }
} catch (error) {
  // Fallback UI
  console.error('Error:', error)
}
```

**User-friendly Error Messages:**

- Contextual error messages
- Retry mechanisms for failed operations
- Fallback states for missing data

### 9. **Performance Optimization Pattern**

**Intelligent Caching:**

- TanStack Query for server state
- localStorage for form persistence
- React.memo for expensive components
- Lazy loading for heavy features

**Race Condition Prevention:**

```typescript
// Proper loading state management
const { data, isLoading, error } = useQuery({
  queryKey: ['companies'],
  enabled: !!user, // Only fetch when user is available
})
```

### 10. **Type Safety Pattern**

**Comprehensive TypeScript Usage:**

```typescript
// Proper interfaces for all data structures
interface CompanyWithServices {
  id: string
  name: string
  services: Service[]
  // ... other fields
}

// Type-safe function signatures
function handleApplyAIRecommendations(
  recommendations: ServiceRecommendation[],
) {
  // Implementation
}
```

**Database Schema Types:**

- Drizzle schema definitions
- Generated TypeScript types
- Runtime type validation

## Component Relationships

### **Quote Creation Flow:**

```
NewQuotePage
├── Company Selection (auto-selected for free users)
├── Project Details Form
├── Services Selection (from company services)
├── Quote Details (pricing configuration)
├── Client Information
├── AI Quote Generation (with confidence levels)
└── Quote Creation (with subscription limits)
```

### **AI Integration Flow:**

```
Company Creation
├── Save Company Data
├── Trigger AI Summary Generation (background)
├── Update AI Summary Status
└── Store AI Summary for Quote Context

Quote Creation
├── Gather Project Data
├── Include Company AI Summary in Context
├── Generate AI Pricing Recommendations
├── Display Confidence Levels and Reasoning
└── Apply Recommendations to Quote
```

### **Subscription Management Flow:**

```
User Action
├── Check Subscription Limits (server-side)
├── Validate Operation (quotes/companies)
├── Execute Action if Allowed
├── Update Usage Counters
└── Display Updated Status (header/sidebar)
```

## Database Relationships

### **Core Entities:**

```
users (1) ── (many) companies
companies (1) ── (many) services
users (1) ── (many) quotes
quotes (1) ── (many) quote_services
services (1) ── (many) quote_services
```

### **Subscription Tracking:**

- Monthly quote counting with database functions
- Real-time usage monitoring
- Limit enforcement at database level

## Security Patterns

### **Authentication:**

- NextAuth.js with OAuth providers
- Session-based authentication
- Protected routes with middleware
- Server-side session validation

### **File Upload Security:**

- API route-controlled uploads
- File type and size validation
- Secure storage policies
- Public access with controlled URLs

### **Data Access:**

- User-scoped data access
- Server-side validation for all operations
- Subscription limit enforcement
- Proper error handling without data leakage

## Performance Patterns

### **Caching Strategy:**

- TanStack Query for intelligent caching
- 5-minute stale time for fresh data
- Background refetching for updates
- localStorage for form persistence

### **Loading States:**

- Skeleton loading over spinners
- Content-specific loading states
- Progressive enhancement
- No loading flashes or race conditions

### **Bundle Optimization:**

- Dynamic imports for heavy components
- Tree shaking for unused code
- Image optimization with Next.js
- Efficient component splitting

This architecture provides a solid foundation for the PricingGPT platform with AI-powered features, robust subscription management, and excellent user experience.
