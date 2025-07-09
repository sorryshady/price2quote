# Active Context

## Current Focus: MVP Ready → Enhanced Quote Management

**STATUS: MVP COMPLETE ✅** - All core features implemented and functional. Ready for Phase 1 enhancements.

### COMPLETED FOUNDATION:

- **User Management**: Authentication, company onboarding, profile management
- **Quote Creation**: AI-assisted pricing, service selection, PDF generation
- **Email Integration**: Gmail OAuth, conversation tracking, PDF attachments
- **Analytics**: Revenue tracking, quote performance, subscription management
- **Subscription System**: Free/Pro tiers with usage limits and enforcement

### CURRENT PRIORITY: Enhanced Quote Status System 🎯

**Problem Identified**: Current status system (`draft`, `sent`, `revised`, `accepted`, `rejected`) lacks clarity and doesn't support future payment integration.

**Solution Designed**: Refined status flow for better quote-to-cash lifecycle tracking:

```typescript
'draft' → 'sent' → 'under_revision' → 'revised' → 'accepted' → 'project_started' → 'completed' → 'paid'
```

**Implementation Plan**:

- [ ] Database migration for new status values
- [ ] Update TypeScript types and validation schemas
- [ ] Refresh all UI components (status displays, filters, badges)
- [ ] Enhance analytics to track new conversion funnel
- [ ] Add status transition validation logic

### NEXT: Smart Payment Integration Architecture 💰

**Philosophy**: Protect both clients and service providers through milestone-based payment breakdowns.

**Key Features Planned**:

1. **Universal Payment Schemes** - Default structures per company
2. **Quote-Specific Overrides** - Customize when needed
3. **AI-Suggested Structures** - Optimal payment plans based on complexity

**Example Payment Schemes**:

- **Standard**: 30% upfront, 40% milestone, 30% completion
- **Consulting**: 20% retainer, 80% completion
- **Development**: 25% kickoff, 25% design, 25% development, 25% delivery

### ROADMAP OVERVIEW:

**Phase 1** (Current): Enhanced Quote Management

- Enhanced status system implementation
- Analytics enhancement for new status tracking
- Payment scheme architecture planning

**Phase 2** (3-6 months): Smart Payment Integration

- Milestone-based payment system
- Stripe integration
- Client portal for payment tracking

**Phase 3** (6-12 months): Growth Features

- Client portal system
- Advanced AI features
- Template & automation system

**Phase 4** (12+ months): Enterprise & Scale

- Team collaboration
- CRM integration
- API & integrations

## Recent Changes

1. **NEW: User Profile Page Implementation COMPLETED:**

   - **Comprehensive Profile Management**: Complete user profile page with personal information, subscription details, account information, and security settings
   - **Profile Form Component**: Real-time profile editing with React Hook Form and Zod validation for user name updates
   - **Subscription Display**: Visual subscription overview showing current tier (Free/Pro), usage analytics with progress bars, plan features, and upgrade section
   - **Account Information**: Email display, verification status, registration date, and account security information
   - **Connected Accounts Component**: Authentication method display with simplified OAuth provider information and Gmail integration guidance
   - **Security Settings**: Password change functionality for credential users with proper bcrypt validation
   - **Server Actions**: Comprehensive server actions for profile updates, user data fetching, and password changes
   - **Responsive Design**: Mobile-friendly grid layout with logical component grouping and consistent UI/UX
   - **Navigation Integration**: Updated user dropdown menu to link to profile page
   - **Schema Organization**: Proper schema organization with dedicated files for password changes and clean index exports
   - **Simplified Architecture**: Removed unnecessary complexity (session management, email preferences) based on actual system needs
   - **Component Consolidation**: Merged upgrade functionality into subscription display to avoid redundancy
   - **Auth System Alignment**: Simplified connected accounts to reflect actual auth system design (no same email for credentials vs OAuth)
   - **Benefits**: Complete user profile management with essential features, clean UX, and proper integration with existing systems

2. **NEW: Currency System Fix - Company Currency Integration COMPLETED:**

   - **Problem Analysis**: Currency was hardcoded to USD throughout the application, causing confusion in Gemini AI prompts and UI display
   - **Database Schema Update**: Added currency field to companies table with default 'USD'
   - **Utility Function Creation**: Created comprehensive `formatCurrency` utility in `src/lib/utils.ts` with currency symbol mapping
   - **Company Onboarding Update**: Currency from onboarding form now properly saved to companies table
   - **UI Components Update**: Updated all currency displays to use company currency instead of hardcoded USD:
     - Quote preview component with proper currency symbols
     - Quotes listing page with company currency
     - Email composer with proper currency formatting
     - Quote selector with company currency
     - PDF generation with company currency
   - **Gemini AI Prompts Fix**: Updated all AI prompts to use company currency instead of hardcoded $ symbols:
     - AI-assisted quote generation
     - Price negotiation prompts
     - Final quote generation
     - Email generation with proper currency context
   - **Currency Symbol Support**: Added support for major currencies (USD, EUR, GBP, INR, AUD, CAD, JPY) with proper symbols
   - **Fallback Handling**: Implemented graceful fallback for unsupported currencies
   - **Database Migration**: Successfully applied migration to add currency field to companies table
   - **Benefits**: Consistent currency display throughout the application, proper AI context, professional quote presentation

3. **NEW: Production Build Hydration Issues Fix COMPLETED:**

   - **Problem Analysis**: Identified auth state initialization timing issues during login flow, not SSR vs CSR
   - **Root Cause**: Login API returned incomplete user data (missing subscriptionTier), causing hooks to fail
   - **Auth State Persistence**: Fixed `isInitialized` flag not being persisted to localStorage
   - **Login API Enhancement**: Updated `/api/auth/login` to return complete user object with all required fields
   - **Auth Hook Improvements**: Enhanced `useAuth` hook with better state management and error handling
   - **Loading State Optimization**: Added proper loading states in protected layout and pages
   - **State Synchronization**: Ensured `setUser` properly sets `isInitialized: true` for immediate availability
   - **Error Handling**: Improved error handling in `checkAuth` with proper state updates
   - **Benefits**: Eliminates hydration mismatches in production builds, fixes quote usage display, auto-selection works correctly

4. **NEW: Quote Editing System with Revision Management COMPLETED:**

   - **Database Schema**: Added revision fields to quotes table and created quote_versions table
   - **Server Actions**: Created comprehensive quote editing, fetching, and version history actions
   - **Edit Page**: Complete edit quote page with pre-populated form and service management
   - **Version History**: Versions page showing original and all revisions with details
   - **AI Re-analysis**: AI-powered revision analysis with client feedback integration
   - **Revision Limits**: Free tier: 3 original quotes/month, 2 revisions per quote; Pro: unlimited
   - **Subscription Integration**: Revision limits enforced through hooks and UI
   - **Quote Preview**: Enhanced preview component handling both AI-generated and basic quotes
   - **Status Management**: Original quotes marked as "rejected" when revised, revisions as "revised"
   - **Service Management**: Add, remove, edit services with live total calculation
   - **Client Feedback**: Integration of client feedback and revision notes in AI analysis
   - **Benefits**: Complete quote revision workflow with AI assistance and proper version tracking

5. **NEW: Send Email Quote Revision Action Plan CREATED:**

   - **Problem Analysis**: Current send-email shows all quotes including revisions, creating clutter
   - **Solution Design**: Show only latest versions of each quote family for cleaner UX
   - **Implementation Plan**: 3-phase approach: Quote selector updates, email threading, conversation enhancements
   - **File Structure**: Detailed mapping of files to modify and new files to create
   - **UI/UX Improvements**: Version badges, conversation threading, revision context
   - **Testing Strategy**: Unit, integration, and user acceptance testing plans
   - **Timeline**: 4-week implementation schedule with clear milestones
   - **Benefits**: Cleaner quote selection, proper conversation continuity, professional client experience

6. **NEW: Downloadable Attachments System COMPLETED:**

   - **Supabase Storage Integration**: Added download functionality to storage helper in `src/lib/supabase.ts`
   - **Download Utility**: Created `downloadAttachment` function in `src/lib/utils.ts` for browser download
   - **Conversation UI Enhancement**: Updated conversation detail page to make attachments actually clickable and downloadable
   - **Loading States**: Added loading spinners during download with proper state management
   - **Error Handling**: Comprehensive error handling with user feedback via toast notifications
   - **Tooltip Integration**: Added tooltips to clarify that attachments are downloadable
   - **Visual Improvements**: Changed attachment indicators from static text to interactive buttons
   - **Filename Extraction**: Smart filename extraction from storage paths for better UX
   - **Conversation List Update**: Updated attachment indicators in conversation list to show "Has downloadable attachments"
   - **Benefits**: Users can now actually download email attachments instead of just seeing them listed

7. **NEW: Complete Email Sending System COMPLETED:**

   - **Quote Selection**: Searchable quote selector with filtering by status and search terms
   - **Email Composer**: Professional email composer with AI generation, manual editing, and template system
   - **Gmail Integration**: Full Gmail API integration with OAuth token refresh
   - **File Attachments**: Support for PDF, TXT, Word documents with validation
   - **Quote PDF Attachment**: Automatic quote PDF generation and attachment
   - **CC/BCC Support**: Optional CC and BCC fields for email recipients
   - **AI Email Generation**: Context-aware email generation based on quote status
   - **Company Context**: AI uses company phone, name, and business details
   - **Form Reset**: Complete form reset after successful email send
   - **Error Handling**: Comprehensive error handling with user feedback
   - **Mobile Responsive**: Full mobile support with responsive design
   - **Benefits**: Complete email workflow from quote selection to sending

8. **NEW: Email Conversation Tracking System COMPLETED:**

   - **Database Schema**: `email_threads` table to track all sent emails
   - **Conversation History**: View all email conversations with search and filtering
   - **Quote Integration**: Links emails to specific quotes for context
   - **Attachment Tracking**: Records which attachments were sent
   - **Gmail Integration**: Stores Gmail message and thread IDs
   - **Thread Continuation**: Follow-up emails automatically join existing Gmail threads
   - **UI Thread Context**: Visual indication when composing follow-up emails
   - **Conversations Page**: Dedicated page to view and manage email history
   - **Search Functionality**: Search conversations by subject, client, or project
   - **Delete Functionality**: Remove conversations from history
   - **Benefits**: Complete email conversation management with proper thread continuation

9. **NEW: Quote PDF Generation with Company Details COMPLETED:**

   - **Company Data Integration**: PDF includes company logo, name, address, phone, website
   - **Professional Layout**: Executive summary, service breakdown, terms, and next steps
   - **AI Content Display**: Shows all AI-generated quote content in PDF
   - **Branding Support**: Full company branding and contact information
   - **Error Handling**: Graceful fallback if company data is missing
   - **Benefits**: Professional PDF quotes with complete company branding

10. **NEW: Gmail Token Refresh System COMPLETED:**

    - **Token Management**: Automatic refresh of expired Gmail access tokens
    - **Error Prevention**: Prevents 401 authentication errors
    - **Secure Storage**: Proper storage of refresh tokens and expiration times
    - **API Integration**: Seamless integration with Gmail API
    - **Benefits**: Reliable email sending without authentication issues

11. **NEW: Form Reset After Email Send COMPLETED:**

    - **Quote Selection Reset**: Clears selected quote after successful send
    - **Email Form Reset**: Resets all email fields and attachments
    - **User Experience**: Allows users to start fresh for next email
    - **Callback System**: Proper callback system between components
    - **Benefits**: Better workflow for sending multiple emails

12. **NEW: Enhanced Email Composer Features COMPLETED:**

    - **Template System**: Status-based email templates (draft, sent, accepted, rejected, revised)
    - **AI Generation**: Context-aware AI email generation
    - **Manual Editing**: Toggle between AI-generated and manual editing
    - **Attachment Management**: File upload with validation and preview
    - **Quote PDF Toggle**: Option to include quote as PDF attachment
    - **Mobile Optimization**: Full mobile responsiveness
    - **Benefits**: Professional email composition with AI assistance

13. **NEW: Database Relationship Fixes COMPLETED:**

    - **Query Optimization**: Fixed complex relationship queries causing errors
    - **Separate Data Fetching**: Fetch quote and company data separately
    - **Error Prevention**: Eliminated "referencedTable" errors
    - **Performance**: Improved query performance
    - **Benefits**: Stable database operations without relationship errors

14. **NEW: Gmail OAuth Connection System COMPLETED:**

    - **Database Schema**: Created `gmail_connections` table to store Gmail OAuth tokens per company
    - **Gmail OAuth Endpoints**: Separate OAuth flow for Gmail API access with specific scopes
    - **Company Email Integration**: Automatically updates company email field when Gmail is connected
    - **Token Management**: Stores access tokens, refresh tokens, and expiration times
    - **Security**: CSRF protection with state parameters and secure cookie handling
    - **Server Actions**: `getGmailConnectionAction`, `disconnectGmailAction`, `refreshGmailTokenAction`
    - **Frontend Integration**: Updated send-email page with connect/disconnect functionality
    - **Error Handling**: Comprehensive error handling with user-friendly messages
    - **Database Constraints**: Added unique constraint on (userId, companyId) for proper conflict resolution
    - **UI Design**: Clean green label with email display and disconnect button in top right
    - **API Organization**: Properly organized Gmail endpoints under `/api/auth/gmail/` structure
    - **Benefits**: Users can now connect Gmail accounts to specific companies for email sending

15. **NEW: AI Unit Price Recommendation System COMPLETED:**

    - **Fixed AI Prompt**: Updated Gemini prompts to explicitly request PER UNIT prices, not total prices
    - **Automatic Validation**: Added logic to detect when AI returns total prices and convert them to unit prices
    - **Enhanced Logging**: Comprehensive console logging showing unit prices, quantities, and totals
    - **Price Conversion Logic**: Intelligent detection and conversion of total prices to unit prices
    - **Negotiation Clarity**: Updated negotiation prompts to be explicit about unit pricing
    - **Benefits**: AI now correctly recommends unit prices (e.g., $12/unit) instead of total prices (e.g., $480 for 40 units)

16. **NEW: PDF Download System with Complete Data COMPLETED:**

    - **Company Data Integration**: Updated `getQuoteWithServicesAction` to fetch complete company details
    - **Enhanced Quote Creation**: `createQuoteAction` now returns complete quote with company data
    - **localStorage Enhancement**: Stores complete quote data needed for PDF generation
    - **PDF Component Support**: QuotePDF component now has access to all company branding and details
    - **Benefits**: PDF downloads include company logo, address, phone, website, and all branding

17. **NEW: Form State Management with Persistence COMPLETED:**

    - **localStorage Check**: Added useEffect to check for existing quotes on page load
    - **State Restoration**: Automatically restores quote state after page refresh
    - **Error Handling**: Graceful handling of corrupted localStorage data
    - **Data Parsing**: Proper parsing of AI quote data from localStorage
    - **Benefits**: Generated quotes persist across page refreshes and browser sessions

18. **NEW: TanStack Query Invalidation System COMPLETED:**

    - **Query Client Integration**: Added useQueryClient to new-quote page
    - **Automatic Refetching**: Invalidates quotes query after creating new quote
    - **Limit Updates**: Invalidates quote limit query to update usage counts
    - **Real-time Updates**: Quotes list updates immediately without manual refresh
    - **Benefits**: Seamless UX where new quotes appear instantly in the quotes list

19. **NEW: Enhanced UX with Form Hiding COMPLETED:**

    - **Conditional Form Display**: Form is hidden when a quote is generated
    - **Dummy Data Button**: Hidden when quote exists to prevent accidental overwrites
    - **Prominent Actions**: "Create New Quote" button is more prominent (default variant)
    - **Clear Messaging**: Updated page description to reflect current state
    - **Accident Prevention**: Users cannot accidentally overwrite generated quotes
    - **Benefits**: Better UX flow and prevents data loss from accidental form submissions

20. **NEW: AI Quote Data Persistence System COMPLETED:**

    - **Database Schema**: Added `quoteData` JSON field to quotes table to store AI-generated content
    - **Server Actions**: Updated `createQuoteAction` to save AI quote data and `getQuotesAction` to retrieve it
    - **Data Structure**: Stores complete AI-generated quote including executive summary, value proposition, service breakdown, terms, payment terms, delivery timeline, and next steps
    - **Type Safety**: Proper TypeScript interfaces for quote data structures
    - **Benefits**: AI-generated quotes are now permanently stored and retrievable

21. **NEW: Enhanced Quote Viewing System COMPLETED:**

    - **Full AI Quote Display**: "View Quote" button now shows complete AI-generated quote content
    - **QuotePreview Component**: Reused the same professional quote preview component from quote creation
    - **Conditional Rendering**: Shows full AI content if available, falls back to basic quote info
    - **Professional Layout**: Executive summary, value proposition, service breakdown, terms, payment, timeline, and next steps
    - **Type Safety**: Proper type checking for quote data structure
    - **Benefits**: Users can view the complete professional quote document from the quotes listing

22. **NEW: Negotiation System Improvements COMPLETED:**

    - **Price Matching Fix**: Resolved service name mismatch between AI recommendations and selected services
    - **Flexible Matching**: Handles skill level suffixes (e.g., "Cake Baking (advanced)" matches "Cake Baking")
    - **Manual Application**: Removed auto-apply after negotiation - users must click "Apply All Recommendations"
    - **Enhanced Logging**: Comprehensive console logging for debugging negotiation flow
    - **useCallback Optimization**: Fixed stale closure issues with proper dependency management
    - **Benefits**: Reliable negotiation system with proper price updates

23. **NEW: Subscription System Robustness COMPLETED:**

    - **Error Handling**: Added safety checks for invalid subscription tiers
    - **Default Fallbacks**: Gracefully handles missing or corrupted subscription data
    - **Type Safety**: Proper validation before accessing subscription features
    - **Benefits**: System won't crash with data inconsistencies

24. **NEW: Complete Quotes Listing Page COMPLETED:**

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

25. **NEW: Quote Data Fetching System COMPLETED:**

    - **Server Action**: `getQuotesAction` fetches quotes with company and service details
    - **TanStack Query Hook**: `useQuotesQuery` for efficient caching and data fetching
    - **Database Integration**: Fetches quotes with related company and quote services data
    - **Type Safety**: Proper TypeScript interfaces for quote data structures
    - **Benefits**: Fast, cached quote loading with real-time updates

26. **NEW: Complete Quote Creation System COMPLETED:**

    - **Full Quote Form**: Comprehensive form with company selection, project details, services, client info, and final notes
    - **Service Management**: Dynamic service selection with quantity, pricing, and notes
    - **AI Integration**: AI-assisted quote generation with pricing recommendations and market analysis
    - **Quote Preview**: Professional quote preview component with executive summary, service breakdown, terms, and next steps
    - **Database Integration**: Complete quote and quote-services tables with proper relationships
    - **Subscription Limits**: Real-time enforcement of quote creation limits
    - **Form Validation**: Zod schema validation with proper error handling
    - **Dummy Data**: Test data population for birthday event scenario
    - **Benefits**: End-to-end quote creation workflow with AI assistance

27. **NEW: Quote Preview Component COMPLETED:**

    - **Professional Layout**: Executive summary, value proposition, service breakdown, terms, payment, timeline, and next steps
    - **Service Breakdown**: Detailed pricing with quantity, unit price, total, and deliverables
    - **Visual Design**: Clean card-based layout with proper spacing and typography
    - **Total Calculation**: Automatic total amount calculation from services
    - **Benefits**: Professional quote presentation ready for client delivery

28. **NEW: AI Quote Generation with Enhanced Features COMPLETED:**

    - **Market Analysis**: Location-based insights, market conditions, and competitive positioning
    - **Service Recommendations**: AI-suggested pricing with confidence levels (high/medium/low)
    - **Price Ranges**: Min/max thresholds for each service with validation
    - **Negotiation Support**: AI-powered negotiation tips and strategies
    - **One-Click Application**: Apply all AI recommendations instantly
    - **Interactive Negotiation**: Per-service negotiation with AI assistance
    - **Benefits**: Professional AI-powered pricing with market intelligence

29. **NEW: Enhanced AI Context Integration COMPLETED:**

    - **Company AI Summary**: Previously generated business summaries now included in pricing prompts
    - **Rich Context**: AI has access to company's market position, expertise, and operational details
    - **Better Recommendations**: More informed pricing based on actual business context
    - **Updated Interfaces**: Type-safe integration of AI summary data
    - **Benefits**: Significantly improved AI pricing accuracy and relevance

30. **NEW: TypeScript Type Safety COMPLETED:**

    - **Proper Interfaces**: Replaced all `any` types with comprehensive type definitions
    - **AI Response Types**: Full type safety for AI recommendation structures
    - **Function Parameters**: Type-safe function signatures throughout
    - **Benefits**: Better developer experience and runtime safety

31. **NEW: Subscription tracking and limit enforcement system COMPLETED:**

    - **Quotes Table**: Created with proper schema and relationships
    - **Subscription Limits**: Free tier (3 quotes/month, 1 company), Pro tier (unlimited quotes, 5 companies)
    - **Database Functions**: Real-time usage tracking with monthly resets
    - **Server Actions**: API endpoints for checking limits and creating quotes
    - **UI Components**: Beautiful subscription limit cards with upgrade prompts
    - **TanStack Query Hooks**: Efficient caching for subscription data
    - **Header Integration**: User info and subscription status in app header
    - **Limit Enforcement**: Prevents exceeding subscription limits
    - **Benefits**: Complete subscription management with real-time tracking

32. **NEW: Header User Status COMPLETED:**

    - **Quote Usage Display**: Shows current usage for free users (e.g., "Quotes: 2/3")
    - **Subscription Status**: Displays current subscription tier and limits
    - **User Information**: Shows user name and email in header
    - **Benefits**: Users can see their current usage and subscription status at a glance

- **NEW: Gmail Connection Status Logic Fix COMPLETED**
  - **Problem**: Previously, the UI showed 'connected' if the company email field was filled, even if the user never completed Gmail OAuth. This was misleading and could cause errors.
  - **Solution**: The UI now checks for a real, valid Gmail OAuth connection (from the gmail_connections table) and only shows 'connected' if such a connection exists and is not expired. The presence of a company email alone no longer triggers a 'connected' status. Backend and UI logic updated accordingly.
  - **Benefits**: Prevents false positives, ensures users only see 'connected' when a real Gmail connection exists, improves reliability and user trust.

## Next Steps

1. **Send Email Quote Revision Integration (Phase 1)**

   - Update quote selector to show only latest versions
   - Add version indicators and badges
   - Implement conversation threading with original quote IDs
   - Test quote selection functionality

2. **Send Email Quote Revision Integration (Phase 2)**

   - Implement email threading logic
   - Update email composition with revision context
   - Add revision information to email bodies
   - Test email sending and threading

3. **Send Email Quote Revision Integration (Phase 3)**

   - Update conversation page to show revision history
   - Add version navigation in conversations
   - Implement visual timeline of quote revisions
   - Test full conversation flow

4. **Future Enhancements**
   - Implement quote templates
   - Add bulk operations
   - Create advanced reporting and analytics
   - Add client portal functionality

## Current Status

The application now has a complete quote management system with:

- **Quote Creation**: AI-powered quote generation with pricing recommendations
- **Quote Editing**: Complete revision system with version tracking and AI re-analysis
- **Email Integration**: Gmail OAuth integration with quote sending and conversation tracking
- **Subscription Management**: Free/Pro tier limits with revision tracking
- **PDF Generation**: Professional quote PDFs with company branding
- **Version History**: Complete revision timeline and version management

The system is ready for production use with comprehensive error handling and user experience optimizations.

**Next Major Feature**: Send Email Quote Revision Integration to improve the email workflow with proper version handling and conversation continuity.
