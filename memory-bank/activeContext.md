# Active Context

## Current Focus

- **COMPLETED: Gmail OAuth connection system with company-specific email integration**
- **COMPLETED: AI unit price recommendation system with automatic validation**
- **COMPLETED: PDF download system with complete company data**
- **COMPLETED: Form state management with localStorage persistence**
- **COMPLETED: TanStack Query invalidation for real-time updates**
- **COMPLETED: Enhanced UX with form hiding after quote generation**
- **COMPLETED: AI quote data persistence and retrieval system**
- **COMPLETED: Enhanced quote viewing with full AI-generated content**
- **COMPLETED: Negotiation system with proper price matching**
- **COMPLETED: Complete quotes listing page with comprehensive features**
- **COMPLETED: Complete quote creation system with AI integration**
- **COMPLETED: Quote preview component with professional layout**
- **COMPLETED: AI-assisted quote generation with pricing recommendations**
- **COMPLETED: Subscription tracking and limit enforcement system**
- **COMPLETED: Loading state optimizations and TanStack Query implementation**
- **COMPLETED: Phase 2 - AI Integration with Pricing Thresholds**
- Company onboarding form implementation COMPLETED
- AI integration with Gemini for company summary generation COMPLETED
- Database save functionality with background AI processing COMPLETED
- Company profile management with AI summary status COMPLETED
- Ready for Phase 4: PDF export and email integration

## Recent Changes

1. **NEW: Gmail OAuth Connection System COMPLETED:**

   - **Database Schema**: Created `gmail_connections` table to store Gmail OAuth tokens per company
   - **Gmail OAuth Endpoints**: Separate OAuth flow for Gmail API access with specific scopes
   - **Company Email Integration**: Automatically updates company email field when Gmail is connected
   - **Token Management**: Stores access tokens, refresh tokens, and expiration times
   - **Security**: CSRF protection with state parameters and secure cookie handling
   - **Server Actions**: `getGmailConnectionAction`, `disconnectGmailAction`, `refreshGmailTokenAction`
   - **Frontend Integration**: Updated send-email page with connect/disconnect functionality
   - **Error Handling**: Comprehensive error handling with user-friendly messages
   - **Benefits**: Users can now connect Gmail accounts to specific companies for email sending

2. **NEW: AI Unit Price Recommendation System COMPLETED:**

   - **Fixed AI Prompt**: Updated Gemini prompts to explicitly request PER UNIT prices, not total prices
   - **Automatic Validation**: Added logic to detect when AI returns total prices and convert them to unit prices
   - **Enhanced Logging**: Comprehensive console logging showing unit prices, quantities, and totals
   - **Price Conversion Logic**: Intelligent detection and conversion of total prices to unit prices
   - **Negotiation Clarity**: Updated negotiation prompts to be explicit about unit pricing
   - **Benefits**: AI now correctly recommends unit prices (e.g., $12/unit) instead of total prices (e.g., $480 for 40 units)

3. **NEW: PDF Download System with Complete Data COMPLETED:**

   - **Company Data Integration**: Updated `getQuoteWithServicesAction` to fetch complete company details
   - **Enhanced Quote Creation**: `createQuoteAction` now returns complete quote with company data
   - **localStorage Enhancement**: Stores complete quote data needed for PDF generation
   - **PDF Component Support**: QuotePDF component now has access to all company branding and details
   - **Benefits**: PDF downloads include company logo, address, phone, website, and all branding

4. **NEW: Form State Management with Persistence COMPLETED:**

   - **localStorage Check**: Added useEffect to check for existing quotes on page load
   - **State Restoration**: Automatically restores quote state after page refresh
   - **Error Handling**: Graceful handling of corrupted localStorage data
   - **Data Parsing**: Proper parsing of AI quote data from localStorage
   - **Benefits**: Generated quotes persist across page refreshes and browser sessions

5. **NEW: TanStack Query Invalidation System COMPLETED:**

   - **Query Client Integration**: Added useQueryClient to new-quote page
   - **Automatic Refetching**: Invalidates quotes query after creating new quote
   - **Limit Updates**: Invalidates quote limit query to update usage counts
   - **Real-time Updates**: Quotes list updates immediately without manual refresh
   - **Benefits**: Seamless UX where new quotes appear instantly in the quotes list

6. **NEW: Enhanced UX with Form Hiding COMPLETED:**

   - **Conditional Form Display**: Form is hidden when a quote is generated
   - **Dummy Data Button**: Hidden when quote exists to prevent accidental overwrites
   - **Prominent Actions**: "Create New Quote" button is more prominent (default variant)
   - **Clear Messaging**: Updated page description to reflect current state
   - **Accident Prevention**: Users cannot accidentally overwrite generated quotes
   - **Benefits**: Better UX flow and prevents data loss from accidental form submissions

7. **NEW: AI Quote Data Persistence System COMPLETED:**

   - **Database Schema**: Added `quoteData` JSON field to quotes table to store AI-generated content
   - **Server Actions**: Updated `createQuoteAction` to save AI quote data and `getQuotesAction` to retrieve it
   - **Data Structure**: Stores complete AI-generated quote including executive summary, value proposition, service breakdown, terms, payment terms, delivery timeline, and next steps
   - **Type Safety**: Proper TypeScript interfaces for quote data structures
   - **Benefits**: AI-generated quotes are now permanently stored and retrievable

8. **NEW: Enhanced Quote Viewing System COMPLETED:**

   - **Full AI Quote Display**: "View Quote" button now shows complete AI-generated quote content
   - **QuotePreview Component**: Reused the same professional quote preview component from quote creation
   - **Conditional Rendering**: Shows full AI content if available, falls back to basic quote info
   - **Professional Layout**: Executive summary, value proposition, service breakdown, terms, payment, timeline, and next steps
   - **Type Safety**: Proper type checking for quote data structure
   - **Benefits**: Users can view the complete professional quote document from the quotes listing

9. **NEW: Negotiation System Improvements COMPLETED:**

   - **Price Matching Fix**: Resolved service name mismatch between AI recommendations and selected services
   - **Flexible Matching**: Handles skill level suffixes (e.g., "Cake Baking (advanced)" matches "Cake Baking")
   - **Manual Application**: Removed auto-apply after negotiation - users must click "Apply All Recommendations"
   - **Enhanced Logging**: Comprehensive console logging for debugging negotiation flow
   - **useCallback Optimization**: Fixed stale closure issues with proper dependency management
   - **Benefits**: Reliable negotiation system with proper price updates

10. **NEW: Subscription System Robustness COMPLETED:**

    - **Error Handling**: Added safety checks for invalid subscription tiers
    - **Default Fallbacks**: Gracefully handles missing or corrupted subscription data
    - **Type Safety**: Proper validation before accessing subscription features
    - **Benefits**: System won't crash with data inconsistencies

11. **NEW: Complete Quotes Listing Page COMPLETED:**

    - **Comprehensive Quote Display**: Shows all quote information including project title, company, status, amount, client, services, and timestamps
    - **Status Filtering**: Filter quotes by status (draft, sent, accepted, rejected, revised, all)
    - **Quote Preview Modal**: Click "View Quote" to see detailed quote information in a modal
    - **Download Functionality**: "Download PDF" button ready for PDF generation implementation
    - **Subscription Integration**: Shows usage limits for free users with progress bar
    - **Professional UI**: Clean card-based layout with status badges, icons, and hover effects
    - **Service Summary**: Displays selected services with quantities and pricing
    - **Responsive Design**: Works well on all screen sizes
    - **Loading States**: Proper skeleton loading while fetching quotes
    - **Error Handling**: Graceful error states and empty states
    - **Benefits**: Complete quote management interface ready for client use

12. **NEW: Quote Data Fetching System COMPLETED:**

    - **Server Action**: `getQuotesAction` fetches quotes with company and service details
    - **TanStack Query Hook**: `useQuotesQuery` for efficient caching and data fetching
    - **Database Integration**: Fetches quotes with related company and quote services data
    - **Type Safety**: Proper TypeScript interfaces for quote data structures
    - **Benefits**: Fast, cached quote loading with real-time updates

13. **NEW: Complete Quote Creation System COMPLETED:**

    - **Full Quote Form**: Comprehensive form with company selection, project details, services, client info, and final notes
    - **Service Management**: Dynamic service selection with quantity, pricing, and notes
    - **AI Integration**: AI-assisted quote generation with pricing recommendations and market analysis
    - **Quote Preview**: Professional quote preview component with executive summary, service breakdown, terms, and next steps
    - **Database Integration**: Complete quote and quote-services tables with proper relationships
    - **Subscription Limits**: Real-time enforcement of quote creation limits
    - **Form Validation**: Zod schema validation with proper error handling
    - **Dummy Data**: Test data population for birthday event scenario
    - **Benefits**: End-to-end quote creation workflow with AI assistance

14. **NEW: Quote Preview Component COMPLETED:**

    - **Professional Layout**: Executive summary, value proposition, service breakdown, terms, payment, timeline, and next steps
    - **Service Breakdown**: Detailed pricing with quantity, unit price, total, and deliverables
    - **Visual Design**: Clean card-based layout with proper spacing and typography
    - **Total Calculation**: Automatic total amount calculation from services
    - **Benefits**: Professional quote presentation ready for client delivery

15. **NEW: AI Quote Generation with Enhanced Features COMPLETED:**

    - **Market Analysis**: Location-based insights, market conditions, and competitive positioning
    - **Service Recommendations**: AI-suggested pricing with confidence levels (high/medium/low)
    - **Price Ranges**: Min/max thresholds for each service with validation
    - **Negotiation Support**: AI-powered negotiation tips and strategies
    - **One-Click Application**: Apply all AI recommendations instantly
    - **Interactive Negotiation**: Per-service negotiation with AI assistance
    - **Benefits**: Professional AI-powered pricing with market intelligence

16. **NEW: Enhanced AI Context Integration COMPLETED:**

    - **Company AI Summary**: Previously generated business summaries now included in pricing prompts
    - **Rich Context**: AI has access to company's market position, expertise, and operational details
    - **Better Recommendations**: More informed pricing based on actual business context
    - **Updated Interfaces**: Type-safe integration of AI summary data
    - **Benefits**: Significantly improved AI pricing accuracy and relevance

17. **NEW: TypeScript Type Safety COMPLETED:**

    - **Proper Interfaces**: Replaced all `any` types with comprehensive type definitions
    - **AI Response Types**: Full type safety for AI recommendation structures
    - **Function Parameters**: Type-safe function signatures throughout
    - **Benefits**: Better developer experience and runtime safety

18. **NEW: Subscription tracking and limit enforcement system COMPLETED:**

    - **Quotes Table**: Created with proper schema and relationships
    - **Subscription Limits**: Free tier (3 quotes/month, 1 company), Pro tier (unlimited quotes, 5 companies)
    - **Database Functions**: Real-time usage tracking with monthly resets
    - **Server Actions**: API endpoints for checking limits and creating quotes
    - **UI Components**: Beautiful subscription limit cards with upgrade prompts
    - **TanStack Query Hooks**: Efficient caching for subscription data
    - **Header Integration**: User info and subscription status in app header
    - **Limit Enforcement**: Prevents exceeding subscription limits
    - **Benefits**: Complete subscription management with real-time tracking

19. **NEW: Header User Status COMPLETED:**

    - **Quote Usage Display**: Shows current usage for free users (e.g., "Quotes: 2/3")
    - **Subscription Tier Badge**: Clear "Free" or "Pro" indicator
    - **User Information**: Clean display of subscription status
    - **Error Handling**: Graceful fallback if database issues occur
    - **Responsive Design**: Works well on all screen sizes
    - **Benefits**: Always-visible subscription status without sidebar clutter

20. **NEW: Subscription Limit Components COMPLETED:**

    - **SubscriptionLimit**: Full-featured card with usage progress and upgrade prompts
    - **Quote Usage Tracking**: Monthly quote counting with database integration
    - **Company Limit Enforcement**: Prevents adding more companies than allowed
    - **Upgrade Messaging**: Contextual prompts for subscription upgrades
    - **Usage Indicators**: Visual progress bars and status badges
    - **Benefits**: Professional subscription management UI

21. **NEW: TanStack Query Implementation COMPLETED:**

    - Replaced custom loading states with TanStack Query for intelligent caching
    - Implemented proper skeleton loading components throughout the app
    - Fixed race conditions and premature redirects
    - Eliminated resource-intensive re-fetching with 5-minute stale time
    - Added QueryProvider to root layout with dev tools
    - Created `useCompaniesQuery` hook for optimized data fetching
    - **NEW: useQuoteLimit and useCompanyLimit hooks** for subscription tracking
    - **NEW: useQuotesQuery hook** for quote data fetching
    - **Benefits**: No more loading flashes, intelligent caching, better UX

22. **NEW: Loading State Optimizations COMPLETED:**

    - **SidebarSkeleton**: Proper skeleton for navigation loading
    - **AddCompanySkeleton**: Full page skeleton for onboarding form
    - **DashboardSkeleton**: Content-specific skeleton for dashboard
    - **QuotesSkeleton**: Quote listing skeleton with proper structure
    - **LoadingSpinner**: Reusable spinner component with size variants
    - **SkeletonLoader**: Generic skeleton for any content
    - Replaced all loading spinners with meaningful skeleton states
    - Fixed heading flash issues in onboarding form

23. **NEW: Performance Improvements COMPLETED:**

    - **Race Condition Fixes**: Proper timing for companies data loading
    - **Caching Strategy**: 5-minute stale time, 10-minute cache time
    - **Background Refetching**: Fresh data fetched in background
    - **No Duplicate Requests**: Same data shared across components
    - **Automatic Retries**: Failed requests retry once
    - **DevTools Integration**: Built-in debugging tools

24. Authentication System:

    - Complete login flow with session management
    - OAuth authentication (Google and GitHub)
    - Session persistence using cookies and database
    - Auth provider for client-side state management

25. Subscription System:

    - Free tier: 3 quotes/month, 1 company
    - Pro tier: Unlimited quotes, 5 companies
    - Subscription feature checking utilities
    - **NEW: Complete quote tracking and limit enforcement**
    - **NEW: Real-time usage monitoring**
    - **NEW: Database integration for usage tracking**
    - Dodo Payments integration planned

## Next Steps

- **Phase 4: PDF Export and Email Integration** - Ready to implement
- **Email Integration**: Send quotes directly to clients via email
- **Advanced PDF Features**: Custom branding, templates, and styling
- **Quote Analytics**: Track quote performance and conversion rates
- **Client Portal**: Allow clients to view and accept quotes online

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
21. **NEW: AI pricing with confidence levels** - Visual indicators and validation thresholds
22. **NEW: Enhanced AI context** - Company summaries included in pricing prompts
23. **NEW: Type-safe AI integration** - Proper TypeScript interfaces throughout
24. **NEW: Complete quote creation workflow** - End-to-end quote generation with AI assistance
25. **NEW: Professional quote preview** - Ready for client delivery with comprehensive layout
26. **NEW: Interactive AI recommendations** - One-click application and negotiation support
27. **NEW: Complete quote management system** - Listing, filtering, and preview functionality

## Current Considerations

1. **PDF Export**: Implement PDF generation for quotes using libraries like react-pdf or jsPDF
2. **Email Integration**: Connect quotes with Gmail integration for sending to clients
3. **Quote Templates**: Create customizable quote templates for different business types
4. **Quote Analytics**: Track quote performance, conversion rates, and business insights
5. **Multi-currency Support**: Implement currency conversion and display
6. **Quote History**: Maintain complete history of all quotes with status tracking
7. **Client Management**: Build client database and relationship management
8. **Quote Approval Workflow**: For businesses with approval processes
9. **Mobile Optimization**: Ensure quote creation and preview work well on mobile devices
10. **Quote Editing**: Allow editing of existing quotes

## Known Issues

- **RESOLVED: Loading state race conditions** - Fixed with TanStack Query
- **RESOLVED: Resource-intensive re-fetching** - Fixed with intelligent caching
- **RESOLVED: Sidebar flashing** - Fixed with skeleton loading
- **RESOLVED: Weird loading headings** - Fixed with proper skeleton states
- **RESOLVED: Missing quotes table** - Created proper migration and table
- **RESOLVED: TypeScript any types** - Replaced with proper interfaces

## Active Questions

1. Should companies be one-to-one with users initially?
2. Multi-currency implementation approach?
3. AI summary generation frequency optimization?
4. **RESOLVED: Gemini API key management and security** - Implemented securely
5. **NEW: How to display AI summary status in company profile?**
6. **NEW: Quote creation flow and UI design?**
7. **NEW: Phase 3 feature priorities and implementation order?**

## Current State

**Phase 2 AI Integration is now complete and production-ready:**

- ✅ AI-powered quote pricing with confidence levels
- ✅ Market analysis and competitive positioning
- ✅ Enhanced context with company AI summaries
- ✅ Type-safe implementation throughout
- ✅ Beautiful UI for AI recommendations
- ✅ One-click application of AI suggestions
- ✅ Subscription limit enforcement
- ✅ Real-time usage tracking

**Ready for Phase 3: Interactive Features** - Quote status management, client communication, and advanced quote workflows.

- PDF/quote export now uses a professional letterhead layout:
  - Header with logo, company info, and contact details
  - Main content area with card-style sections, consistent margins, and rounded corners
  - Footer for disclaimer/thank you
  - All text uses Helvetica
  - Live preview in app via PDFViewer
- All linter errors are resolved
- No custom font registration complexity
- This is now the standard for all quote/PDF exports
