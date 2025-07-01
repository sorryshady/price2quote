# Active Context

## Current Focus

- **COMPLETED: Subscription tracking and limit enforcement system**
- **COMPLETED: Loading state optimizations and TanStack Query implementation**
- Company onboarding form implementation COMPLETED
- AI integration with Gemini for company summary generation COMPLETED
- Database save functionality with background AI processing COMPLETED
- Company profile management with AI summary status COMPLETED
- Ready for next phase: Quote creation system and company profile page

## Recent Changes

1. **NEW: Subscription Tracking System COMPLETED:**

   - **Quotes Table**: Created with proper schema and relationships
   - **Subscription Limits**: Free tier (3 quotes/month, 1 company), Pro tier (unlimited quotes, 5 companies)
   - **Database Functions**: Real-time usage tracking with monthly resets
   - **Server Actions**: API endpoints for checking limits and creating quotes
   - **UI Components**: Beautiful subscription limit cards with upgrade prompts
   - **TanStack Query Hooks**: Efficient caching for subscription data
   - **Header Integration**: User info and subscription status in app header
   - **Limit Enforcement**: Prevents exceeding subscription limits
   - **Benefits**: Complete subscription management with real-time tracking

2. **NEW: Header User Status COMPLETED:**

   - **Quote Usage Display**: Shows current usage for free users (e.g., "Quotes: 2/3")
   - **Subscription Tier Badge**: Clear "Free" or "Pro" indicator
   - **User Information**: Clean display of subscription status
   - **Error Handling**: Graceful fallback if database issues occur
   - **Responsive Design**: Works well on all screen sizes
   - **Benefits**: Always-visible subscription status without sidebar clutter

3. **NEW: Subscription Limit Components COMPLETED:**

   - **SubscriptionLimit**: Full-featured card with usage progress and upgrade prompts
   - **Quote Usage Tracking**: Monthly quote counting with database integration
   - **Company Limit Enforcement**: Prevents adding more companies than allowed
   - **Upgrade Messaging**: Contextual prompts for subscription upgrades
   - **Usage Indicators**: Visual progress bars and status badges
   - **Benefits**: Professional subscription management UI

4. **NEW: TanStack Query Implementation COMPLETED:**

   - Replaced custom loading states with TanStack Query for intelligent caching
   - Implemented proper skeleton loading components throughout the app
   - Fixed race conditions and premature redirects
   - Eliminated resource-intensive re-fetching with 5-minute stale time
   - Added QueryProvider to root layout with dev tools
   - Created `useCompaniesQuery` hook for optimized data fetching
   - **NEW: useQuoteLimit and useCompanyLimit hooks** for subscription tracking
   - **Benefits**: No more loading flashes, intelligent caching, better UX

5. **NEW: Loading State Optimizations COMPLETED:**

   - **SidebarSkeleton**: Proper skeleton for navigation loading
   - **AddCompanySkeleton**: Full page skeleton for add-company form
   - **DashboardSkeleton**: Content-specific skeleton for dashboard
   - **LoadingSpinner**: Reusable spinner component with size variants
   - **SkeletonLoader**: Generic skeleton for any content
   - Replaced all loading spinners with meaningful skeleton states
   - Fixed heading flash issues in onboarding form

6. **NEW: Performance Improvements COMPLETED:**

   - **Race Condition Fixes**: Proper timing for companies data loading
   - **Caching Strategy**: 5-minute stale time, 10-minute cache time
   - **Background Refetching**: Fresh data fetched in background
   - **No Duplicate Requests**: Same data shared across components
   - **Automatic Retries**: Failed requests retry once
   - **DevTools Integration**: Built-in debugging tools

7. Authentication System:

   - Complete login flow with session management
   - OAuth authentication (Google and GitHub)
   - Session persistence using cookies and database
   - Auth provider for client-side state management

8. Subscription System:

   - Free tier: 3 quotes/month, 1 company
   - Pro tier: Unlimited quotes, 5 companies
   - Subscription feature checking utilities
   - **NEW: Complete quote tracking and limit enforcement**
   - **NEW: Real-time usage monitoring**
   - **NEW: Database integration for usage tracking**
   - Dodo Payments integration planned

9. Project Context:

   - Identified as PricingGPT platform
   - AI-powered pricing recommendations
   - Multi-currency support
   - Gmail integration for emails
   - PDF quote generation

10. Company Onboarding Implementation COMPLETED:

    - Multi-step onboarding form (Company Info, Profile, Services, Summary)
    - localStorage persistence for form data and current step
    - Logo upload with Base64 preview (max 4MB)
    - Services management (add/edit/remove up to 20 services)
    - Form validation and error handling
    - Responsive UI with progress indicators
    - Hydration from localStorage on page reload
    - **NEW: Complete save flow with database integration**
    - **NEW: Logo upload to Supabase storage**
    - **NEW: Background AI summary generation**

11. Database & Storage Setup:

    - Companies and services tables created with proper relationships
    - **NEW: Quotes table with subscription tracking**
    - **NEW: Quote status enum (draft, sent, accepted, rejected)**
    - Supabase storage bucket 'company-logos' configured
    - Storage policies set for public access with API route control
    - Logo upload utility function implemented using DRY storage helpers
    - TypeScript types defined for Company and Service interfaces
    - **NEW: AI summary fields added (aiSummary, aiSummaryStatus)**
    - **NEW: Database migration completed**

12. AI Integration COMPLETED:

    - Gemini AI SDK installed and configured
    - Detailed prompt engineering for company summaries (4-6 sentences)
    - Server-side background processing implementation
    - Error handling and status tracking
    - **NEW: Background AI summary generation with database updates**

13. Server Actions Organization COMPLETED:
    - Modular structure: auth.ts, company.ts, quote.ts, subscription.ts, index.ts
    - Clean exports and type safety
    - Scalable architecture for future actions

## Active Decisions

1. Company setup is mandatory for quote generation
2. One-to-one relationship between users and companies initially
3. Progressive onboarding flow after login
4. Subscription-based feature access
5. AI integration with Gemini for pricing recommendations
6. Supabase storage for company logos
7. AI summary generation for company context in quotes
8. Service limit: 20 services per company
9. Skill levels: Per-service granularity
10. Base pricing: Store per service (optional)
11. AI summary updates: On-demand with smart triggers
12. Storage access controlled through API routes (not Supabase auth)
13. **COMPLETED: Server-side background AI processing** - Save company immediately, trigger AI generation in background
14. **COMPLETED: AI summary status tracking** - pending/generating/completed/failed states in database
15. **COMPLETED: Immediate user feedback** - User gets success message while AI processes in background
16. **NEW: TanStack Query for data fetching** - Intelligent caching with 5-minute stale time
17. **NEW: Skeleton loading over spinners** - Better UX with meaningful loading states
18. **NEW: Proper race condition handling** - No more premature redirects or flashing content
19. **NEW: Header-based subscription display** - Always visible user status without sidebar clutter
20. **NEW: Real-time subscription tracking** - Database integration for accurate usage monitoring

## Current Considerations

1. Quote creation system implementation
2. Company profile page implementation to display AI summary status
3. Retry mechanism for failed AI generation
4. Company management interface for multiple companies (Pro tier)
5. Integration with quote generation system
6. Analytics dashboard for company performance
7. Multi-company support implementation

## Next Steps

1. **IMMEDIATE: Implement quote creation system** with subscription limit enforcement
2. **IMMEDIATE: Create company profile page** with AI summary status display
3. Add retry button for failed AI summary generation
4. Create company management interface
5. Add analytics and reporting features
6. Implement multi-company support for Pro tier

## Known Issues

- **RESOLVED: Loading state race conditions** - Fixed with TanStack Query
- **RESOLVED: Resource-intensive re-fetching** - Fixed with intelligent caching
- **RESOLVED: Sidebar flashing** - Fixed with skeleton loading
- **RESOLVED: Weird loading headings** - Fixed with proper skeleton states
- **RESOLVED: Missing quotes table** - Created proper migration and table

## Active Questions

1. Should companies be one-to-one with users initially?
2. Multi-currency implementation approach?
3. AI summary generation frequency optimization?
4. **RESOLVED: Gemini API key management and security** - Implemented securely
5. **NEW: How to display AI summary status in company profile?**
6. **NEW: Quote creation flow and UI design?**

## Current State

**Subscription tracking system is now complete and production-ready:**

- Real-time quote usage tracking with monthly resets
- Company limit enforcement for free users
- Beautiful UI components for subscription management
- Header integration for always-visible status
- Database integration with proper error handling
- TanStack Query for efficient data fetching and caching

**Loading and data fetching system is optimized:**

- TanStack Query provides intelligent caching and background updates
- Skeleton loading states provide smooth UX without flashing content
- Race conditions eliminated with proper data loading timing
- Performance optimized with 5-minute stale time and background refetching
- Dev tools available for debugging and monitoring

Company onboarding system is fully implemented and working flawlessly. The complete flow includes:

- Multi-step form with data persistence
- Logo upload to Supabase storage
- Database save with proper relationships
- Background AI summary generation using Gemini
- Immediate user feedback with toast notifications
- Clean server actions architecture
- **NEW: Optimized loading states and data fetching**
- **NEW: Complete subscription tracking and limit enforcement**

Ready to implement the quote creation system and company profile page.
