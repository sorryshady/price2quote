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

### 1. **Auth State Management Pattern**

**Problem**: Hydration mismatches in production builds due to auth state initialization timing

**Solution**:

- **Complete User Data**: Login API returns full user object including `subscriptionTier`
- **State Persistence**: Persist `isInitialized` flag to localStorage to prevent re-initialization
- **Loading States**: Wait for auth initialization before rendering protected content
- **State Synchronization**: Ensure `setUser` immediately sets `isInitialized: true`

**Implementation**:

```typescript
// Auth hook with proper state management
const { user, isLoading, isInitialized } = useAuth()

// Protected layout waits for initialization
if (!isInitialized || isLoading) {
  return <LoadingSpinner />
}

// Login API returns complete user data
return NextResponse.json({
  success: true,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
    // ... other fields
  },
})
```

**Benefits**: Eliminates hydration mismatches, ensures consistent state across environments

### 2. **Quote Creation Pattern**

**Comprehensive Form Management:**

```typescript
// Multi-section form with dynamic service selection
const form = useForm<QuoteFormData>({
  resolver: zodResolver(quoteSchema),
  defaultValues: {
    companyId: '',
    projectTitle: '',
    // ... other fields
  },
})

// Dynamic service management with local state
const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
```

**Service Selection and Pricing:**

```typescript
// Service toggle with quantity and pricing
const handleServiceToggle = (service: Service) => {
  setSelectedServices((prev) => {
    const existing = prev.find((s) => s.serviceId === service.id)
    if (existing) {
      return prev.filter((s) => s.serviceId !== service.id)
    } else {
      return [
        ...prev,
        {
          serviceId: service.id,
          service,
          quantity: 1,
          unitPrice: parseFloat(service.basePrice || '0'),
          notes: '',
        },
      ]
    }
  })
}
```

**AI Integration with Quote Generation:**

```typescript
// AI-assisted quote generation with enhanced context
const result = await generateAIAssistedQuoteAction({
  companyId: formData.companyId,
  projectData: {
    title: formData.projectTitle,
    description: formData.projectDescription,
    complexity: formData.projectComplexity,
    // ... other project data
  },
  selectedServices: selectedServices.map((s) => ({
    serviceId: s.serviceId,
    serviceName: s.service.name,
    skillLevel: s.service.skillLevel,
    basePrice: s.service.basePrice,
    quantity: s.quantity,
    currentPrice: s.unitPrice,
  })),
})
```

### 3. **Quote Preview Pattern**

**Professional Layout Structure:**

```typescript
// Modular quote sections with consistent styling
<Card>
  <CardHeader>
    <CardTitle>Executive Summary</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">
      {quoteData.quoteDocument.executiveSummary}
    </p>
  </CardContent>
</Card>
```

**Service Breakdown with Calculations:**

```typescript
// Dynamic service rendering with totals
{quoteData.quoteDocument.serviceBreakdown.map((service, index) => (
  <div key={index} className="space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-medium">{service.serviceName}</h4>
      <Badge variant="outline">
        ${service.totalPrice.toFixed(2)}
      </Badge>
    </div>
    {/* Service details */}
  </div>
))}
```

### 4. **AI Integration Pattern**

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

**AI Recommendations with Interactive Features:**

```typescript
// AI response structure with market analysis
interface AIQuoteResponse {
  marketAnalysis: {
    locationFactor: string
    marketConditions: string
    competitivePosition: string
  }
  serviceRecommendations: Array<{
    serviceName: string
    currentPrice: number
    recommendedPrice: number
    confidenceLevel: 'high' | 'medium' | 'low'
    reasoning: string
    priceRange: { min: number; max: number }
  }>
  negotiationTips: string[]
}
```

### 5. **User Profile Page Pattern**

**Comprehensive User Management Architecture:**

```typescript
// Profile page layout with logical component grouping
<div className="container mx-auto p-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Left Column: Personal & Account */}
    <div className="space-y-6">
      <ProfileForm />
      <AccountInfo />
      <ConnectedAccounts />
    </div>

    {/* Right Column: Subscription & Security */}
    <div className="space-y-6">
      <SubscriptionDisplay />
      <ProfileSecurity />
    </div>
  </div>
</div>
```

**Form Management with Real-time Validation:**

```typescript
// Profile form with proper state management
const form = useForm<{ name: string }>({
  resolver: zodResolver(profileSchema),
  defaultValues: { name: user?.name || '' },
})

// Real-time dirty state tracking
const isDirty = form.formState.isDirty
const isSubmitting = form.formState.isSubmitting

// Server action integration
const onSubmit = async (data: { name: string }) => {
  const result = await updateUserProfileAction(data)
  if (result.success) {
    form.reset({ name: data.name }) // Reset dirty state
    toast.success('Profile updated successfully')
  }
}
```

**Subscription Analytics with Visual Indicators:**

```typescript
// Usage analytics with progress visualization
const { data: quoteLimit } = useQuoteLimit()
const { data: companyLimit } = useCompanyLimit()

// Custom Progress component for usage display
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">Quotes Used</span>
    <span className="text-sm font-medium">
      {quoteLimit?.used || 0} / {quoteLimit?.limit || 0}
    </span>
  </div>
  <Progress
    value={((quoteLimit?.used || 0) / (quoteLimit?.limit || 1)) * 100}
    className="h-2"
  />
</div>
```

**Security Settings with Conditional Rendering:**

```typescript
// Conditional security features based on auth method
{user?.hasPassword ? (
  <ChangePasswordForm />
) : (
  <div className="rounded-md bg-blue-50 p-4">
    <p className="text-sm text-blue-700">
      You're signed in with {user?.authProvider}.
      Password changes are managed through your OAuth provider.
    </p>
  </div>
)}
```

**Server Actions Pattern for Profile Management:**

```typescript
// Comprehensive profile server actions
export async function updateUserProfileAction(data: { name: string }) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const validatedData = profileSchema.parse(data)

    await db
      .update(users)
      .set({ name: validatedData.name, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update profile' }
  }
}

// User data fetching with connected accounts
export async function getUserProfileAction() {
  const user = await getCurrentUser()
  const connectedAccounts = await getConnectedAccounts(user.id)
  const hasPassword = await checkUserHasPassword(user.id)

  return {
    user: { ...user, hasPassword },
    connectedAccounts,
  }
}
```

**Schema Organization Pattern:**

```typescript
// Dedicated schema files with proper exports
// src/lib/schemas/change-password.ts
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// src/lib/schemas/index.ts - Clean exports only
export { changePasswordSchema } from './change-password'
export { loginSchema } from './login'
export { registerSchema } from './register'
```

**Benefits:**

- **Logical Organization**: Components grouped by functionality (personal vs subscription)
- **Real-time Feedback**: Immediate form validation and state updates
- **Conditional Features**: Different UI based on user authentication method
- **Responsive Design**: Mobile-friendly layout with proper grid system
- **Server-side Validation**: Comprehensive validation in server actions
- **Clean Architecture**: Proper separation of concerns and schema organization
- **User Experience**: Intuitive navigation and clear information hierarchy

### 5. **Subscription Management Pattern**

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

### 5. **Data Fetching Pattern (TanStack Query)**

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

### 6. **Form Management Pattern**

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

### 7. **File Upload Pattern**

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

### 8. **Server Actions Pattern**

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

**Quote Creation with AI Integration:**

```typescript
// Complete quote creation workflow
export async function createQuoteAction(data: CreateQuoteData) {
  // Check subscription limits
  const canCreate = await canUserCreateQuote(data.userId, 'free')

  // Generate AI quote document
  const finalQuoteResult = await generateFinalQuoteAction({
    companyId: data.companyId,
    projectData: data.projectData,
    finalData: data.finalData,
  })

  // Save to database with all data
  const [quote] = await db
    .insert(quotes)
    .values({
      userId: data.userId,
      companyId: data.companyId,
      // ... other fields
    })
    .returning()

  // Insert quote services
  await db.insert(quoteServices).values(quoteServiceData)
}
```

### 9. **Component Architecture Pattern**

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

**Quote Preview Component Pattern:**

```typescript
// Modular quote sections with consistent styling
export function QuotePreview({ quoteData, onClose }: QuotePreviewProps) {
  const totalAmount = quoteData.quoteDocument.serviceBreakdown.reduce(
    (sum, service) => sum + service.totalPrice,
    0,
  )

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {quoteData.quoteDocument.executiveSummary}
          </p>
        </CardContent>
      </Card>

      {/* Service Breakdown */}
      <Card>
        {/* Service details with pricing */}
      </Card>

      {/* Terms and other sections */}
    </div>
  )
}
```

### 10. **Database Schema Pattern**

**Quote Management Schema:**

```sql
-- Quotes table with comprehensive fields
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_title VARCHAR(255) NOT NULL,
  project_description TEXT,
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status quote_status DEFAULT 'draft' NOT NULL,
  client_email VARCHAR(255),
  client_name VARCHAR(255),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Quote services junction table
CREATE TABLE quote_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity DECIMAL(5,2) DEFAULT '1' NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 11. **Error Handling Pattern**

**Graceful Error Handling:**

```typescript
// Server action error handling
export async function createQuoteAction(data: CreateQuoteData) {
  try {
    // Implementation
    return { success: true, quote }
  } catch (error) {
    console.error('Error creating quote:', error)
    return {
      success: false,
      error: 'Failed to create quote',
    }
  }
}
```

**User-Friendly Error Messages:**

```typescript
// Form validation with clear error messages
const quoteSchema = z.object({
  companyId: z.string().min(1, 'Please select a company'),
  projectTitle: z.string().min(1, 'Project title is required'),
  clientLocation: z.string().min(1, 'Client location is required'),
  // ... other validations
})
```

### 12. **Performance Optimization Pattern**

**Intelligent Caching:**

```typescript
// TanStack Query with optimized settings
const { data: companies } = useCompaniesQuery({
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  retry: 1,
})
```

**Background Processing:**

```typescript
// AI generation in background without blocking UI
const generateCompanySummary = async (companyId: string) => {
  // Update status to generating
  await db
    .update(companies)
    .set({ aiSummaryStatus: 'generating' })
    .where(eq(companies.id, companyId))

  try {
    // Generate AI summary
    const summary = await generateAISummary(companyData)

    // Update with result
    await db
      .update(companies)
      .set({
        aiSummary: summary,
        aiSummaryStatus: 'completed',
      })
      .where(eq(companies.id, companyId))
  } catch (error) {
    // Handle error
    await db
      .update(companies)
      .set({ aiSummaryStatus: 'failed' })
      .where(eq(companies.id, companyId))
  }
}
```

### 5. **Email Attachment Management Pattern**

**Supabase Storage Integration:**

```typescript
// Storage helper with download functionality
export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    if (error) throw error
    return data
  },

  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(path)
    if (error) throw error
    return data
  },

  getPublicUrl: (bucket: string, path: string) => {
    return supabase.storage.from(bucket).getPublicUrl(path)
  },
}
```

**Download Utility Function:**

```typescript
// Browser download with proper error handling
export async function downloadAttachment(
  attachmentPath: string,
  originalFilename?: string,
): Promise<void> {
  try {
    const blob = await storage.download('email-attachments', attachmentPath)
    const filename =
      originalFilename || attachmentPath.split('/').pop() || 'attachment'

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading attachment:', error)
    throw new Error('Failed to download attachment')
  }
}
```

**Interactive UI Components:**

```typescript
// Download button with loading state
const [downloadingAttachments, setDownloadingAttachments] = useState<Set<string>>(new Set())

<Button
  variant="outline"
  size="sm"
  className="flex items-center gap-2"
  disabled={downloadingAttachments.has(attachment)}
  onClick={async () => {
    setDownloadingAttachments(prev => new Set(prev).add(attachment))
    try {
      await downloadAttachment(attachment)
      toast.custom(<CustomToast message="Downloaded successfully" type="success" />)
    } catch (error) {
      toast.custom(<CustomToast message="Download failed" type="error" />)
    } finally {
      setDownloadingAttachments(prev => {
        const newSet = new Set(prev)
        newSet.delete(attachment)
        return newSet
      })
    }
  }}
>
  {downloadingAttachments.has(attachment) ? (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  ) : (
    <Download className="h-4 w-4" />
  )}
  <span className="text-sm">{attachment.split('/').pop() || attachment}</span>
</Button>
```

**Tooltip Integration for UX:**

```typescript
// Tooltip wrapper for better user guidance
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button /* download button props */ />
    </TooltipTrigger>
    <TooltipContent>
      <p>Click to download attachment</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Database Schema for Attachment Tracking:**

```typescript
// Email threads table with attachment storage
const emailThreads = pgTable('email_threads', {
  // ... other fields
  attachments: text('attachments'), // JSON array of attachment filenames
  includeQuotePdf: boolean('include_quote_pdf').default(false),
})
```

**Key Benefits:**

- Secure file storage in Supabase with proper access control
- Interactive download buttons with loading states
- Comprehensive error handling with user feedback
- Smart filename extraction for better UX
- Tooltip integration for clarity
- Proper cleanup of browser resources

## PDF Export & Quote Document Pattern

- Letterhead-style header at the top with logo, company name, and contact info (website, phone, address)
- Main content area is centered, with marginTop, marginBottom, and marginHorizontal (e.g. 48px) so content never touches the page edge
- All main sections (executive summary, service breakdown, terms, etc.) are displayed as card-style sections with rounded corners, light gray backgrounds, and padding
- Footer area at the bottom for disclaimer or thank you message, always with margin
- All text uses Helvetica for maximum compatibility and a clean, professional look
- PDFViewer is used in the app for live preview and rapid design iteration
- All linter errors are resolved and code is type-safe
- No custom font registration complexity; Helvetica is used for all weights/styles
- This pattern is now the standard for all PDF/quote exports in the project

## Component Relationships

### Quote Creation Flow

```mermaid
graph TD
    A[New Quote Page] --> B[Company Selection]
    B --> C[Project Details]
    C --> D[Service Selection]
    D --> E[Client Information]
    E --> F[Final Notes]
    F --> G[AI Generation]
    G --> H[Quote Preview]
    H --> I[Save Quote]
    I --> J[Database]
```

### AI Integration Flow

```mermaid
graph TD
    A[User Input] --> B[AI Prompt Generation]
    B --> C[Gemini AI]
    C --> D[AI Response]
    D --> E[Validation]
    E --> F[UI Display]
    F --> G[User Action]
    G --> H[Apply Changes]
    H --> I[Form Update]
```

### Data Flow Architecture

```mermaid
graph TD
    A[React Components] --> B[TanStack Query]
    B --> C[Server Actions]
    C --> D[Database]
    D --> E[AI Services]
    E --> F[External APIs]
```

## Best Practices

1. **Type Safety**: Use TypeScript interfaces for all data structures
2. **Error Handling**: Implement graceful error handling at all levels
3. **Performance**: Use TanStack Query for intelligent caching
4. **UX**: Provide meaningful loading states and feedback
5. **Security**: Validate all inputs and implement proper authentication
6. **Scalability**: Use modular architecture for easy expansion
7. **Testing**: Write comprehensive tests for all critical paths
8. **Documentation**: Maintain clear documentation for all patterns

This architecture provides a solid foundation for the PricingGPT platform with AI-powered features, robust subscription management, and excellent user experience.
