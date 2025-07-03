# Active Context

## Current Focus

- **COMPLETED: Quote Editing System with Revision Management**
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
- **COMPLETED: Quote creation system with AI integration**
- **COMPLETED: Quote preview component with professional layout**
- **COMPLETED: AI-assisted quote generation with pricing recommendations**
- **COMPLETED: Subscription tracking and limit enforcement system**
- **COMPLETED: Loading state optimizations and TanStack Query implementation**
- **COMPLETED: Phase 2 - AI Integration with Pricing Thresholds**
- **COMPLETED: Email sending system with Gmail integration**
- **COMPLETED: Quote PDF generation with company details**
- **COMPLETED: Email conversation tracking system**
- **COMPLETED: Form reset after successful email send**
- **COMPLETED: Downloadable attachments system for email conversations**
- Company onboarding form implementation COMPLETED
- AI integration with Gemini for company summary generation COMPLETED
- Database save functionality with background AI processing COMPLETED
- Company profile management with AI summary status COMPLETED
- Gmail sync is direction-aware (outbound/inbound) using sender address
- Outbound emails are only marked as read if client opens
- UI improvements: quoted content toggle, accurate unread counts, conversation grouping by thread
- **NEXT: Send Email Quote Revision Integration**

## Recent Changes

1. **NEW: Quote Editing System with Revision Management COMPLETED:**

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

2. **NEW: Send Email Quote Revision Action Plan CREATED:**

   - **Problem Analysis**: Current send-email shows all quotes including revisions, creating clutter
   - **Solution Design**: Show only latest versions of each quote family for cleaner UX
   - **Implementation Plan**: 3-phase approach: Quote selector updates, email threading, conversation enhancements
   - **File Structure**: Detailed mapping of files to modify and new files to create
   - **UI/UX Improvements**: Version badges, conversation threading, revision context
   - **Testing Strategy**: Unit, integration, and user acceptance testing plans
   - **Timeline**: 4-week implementation schedule with clear milestones
   - **Benefits**: Cleaner quote selection, proper conversation continuity, professional client experience

3. **NEW: Downloadable Attachments System COMPLETED:**

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

4. **NEW: Complete Email Sending System COMPLETED:**

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

5. **NEW: Email Conversation Tracking System COMPLETED:**

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

6. **NEW: Quote PDF Generation with Company Details COMPLETED:**

   - **Company Data Integration**: PDF includes company logo, name, address, phone, website
   - **Professional Layout**: Executive summary, service breakdown, terms, and next steps
   - **AI Content Display**: Shows all AI-generated quote content in PDF
   - **Branding Support**: Full company branding and contact information
   - **Error Handling**: Graceful fallback if company data is missing
   - **Benefits**: Professional PDF quotes with complete company branding

7. **NEW: Gmail Token Refresh System COMPLETED:**

   - **Token Management**: Automatic refresh of expired Gmail access tokens
   - **Error Prevention**: Prevents 401 authentication errors
   - **Secure Storage**: Proper storage of refresh tokens and expiration times
   - **API Integration**: Seamless integration with Gmail API
   - **Benefits**: Reliable email sending without authentication issues

8. **NEW: Form Reset After Email Send COMPLETED:**

   - **Quote Selection Reset**: Clears selected quote after successful send
   - **Email Form Reset**: Resets all email fields and attachments
   - **User Experience**: Allows users to start fresh for next email
   - **Callback System**: Proper callback system between components
   - **Benefits**: Better workflow for sending multiple emails

9. **NEW: Enhanced Email Composer Features COMPLETED:**

   - **Template System**: Status-based email templates (draft, sent, accepted, rejected, revised)
   - **AI Generation**: Context-aware AI email generation
   - **Manual Editing**: Toggle between AI-generated and manual editing
   - **Attachment Management**: File upload with validation and preview
   - **Quote PDF Toggle**: Option to include quote as PDF attachment
   - **Mobile Optimization**: Full mobile responsiveness
   - **Benefits**: Professional email composition with AI assistance

10. **NEW: Database Relationship Fixes COMPLETED:**

    - **Query Optimization**: Fixed complex relationship queries causing errors
    - **Separate Data Fetching**: Fetch quote and company data separately
    - **Error Prevention**: Eliminated "referencedTable" errors
    - **Performance**: Improved query performance
    - **Benefits**: Stable database operations without relationship errors

11. **NEW: Gmail OAuth Connection System COMPLETED:**

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

12. **NEW: AI Unit Price Recommendation System COMPLETED:**

    - **Fixed AI Prompt**: Updated Gemini prompts to explicitly request PER UNIT prices, not total prices
    - **Automatic Validation**: Added logic to detect when AI returns total prices and convert them to unit prices
    - **Enhanced Logging**: Comprehensive console logging showing unit prices, quantities, and totals
    - **Price Conversion Logic**: Intelligent detection and conversion of total prices to unit prices
    - **Negotiation Clarity**: Updated negotiation prompts to be explicit about unit pricing
    - **Benefits**: AI now correctly recommends unit prices (e.g., $12/unit) instead of total prices (e.g., $480 for 40 units)

13. **NEW: PDF Download System with Complete Data COMPLETED:**

    - **Company Data Integration**: Updated `getQuoteWithServicesAction` to fetch complete company details
    - **Enhanced Quote Creation**: `createQuoteAction` now returns complete quote with company data
    - **localStorage Enhancement**: Stores complete quote data needed for PDF generation
    - **PDF Component Support**: QuotePDF component now has access to all company branding and details
    - **Benefits**: PDF downloads include company logo, address, phone, website, and all branding

14. **NEW: Form State Management with Persistence COMPLETED:**

    - **localStorage Check**: Added useEffect to check for existing quotes on page load
    - **State Restoration**: Automatically restores quote state after page refresh
    - **Error Handling**: Graceful handling of corrupted localStorage data
    - **Data Parsing**: Proper parsing of AI quote data from localStorage
    - **Benefits**: Generated quotes persist across page refreshes and browser sessions

15. **NEW: TanStack Query Invalidation System COMPLETED:**

    - **Query Client Integration**: Added useQueryClient to new-quote page
    - **Automatic Refetching**: Invalidates quotes query after creating new quote
    - **Limit Updates**: Invalidates quote limit query to update usage counts
    - **Real-time Updates**: Quotes list updates immediately without manual refresh
    - **Benefits**: Seamless UX where new quotes appear instantly in the quotes list

16. **NEW: Enhanced UX with Form Hiding COMPLETED:**

    - **Conditional Form Display**: Form is hidden when a quote is generated
    - **Dummy Data Button**: Hidden when quote exists to prevent accidental overwrites
    - **Prominent Actions**: "Create New Quote" button is more prominent (default variant)
    - **Clear Messaging**: Updated page description to reflect current state
    - **Accident Prevention**: Users cannot accidentally overwrite generated quotes
    - **Benefits**: Better UX flow and prevents data loss from accidental form submissions

17. **NEW: AI Quote Data Persistence System COMPLETED:**

    - **Database Schema**: Added `quoteData` JSON field to quotes table to store AI-generated content
    - **Server Actions**: Updated `createQuoteAction` to save AI quote data and `getQuotesAction` to retrieve it
    - **Data Structure**: Stores complete AI-generated quote including executive summary, value proposition, service breakdown, terms, payment terms, delivery timeline, and next steps
    - **Type Safety**: Proper TypeScript interfaces for quote data structures
    - **Benefits**: AI-generated quotes are now permanently stored and retrievable

18. **NEW: Enhanced Quote Viewing System COMPLETED:**

    - **Full AI Quote Display**: "View Quote" button now shows complete AI-generated quote content
    - **QuotePreview Component**: Reused the same professional quote preview component from quote creation
    - **Conditional Rendering**: Shows full AI content if available, falls back to basic quote info
    - **Professional Layout**: Executive summary, value proposition, service breakdown, terms, payment, timeline, and next steps
    - **Type Safety**: Proper type checking for quote data structure
    - **Benefits**: Users can view the complete professional quote document from the quotes listing

19. **NEW: Negotiation System Improvements COMPLETED:**

    - **Price Matching Fix**: Resolved service name mismatch between AI recommendations and selected services
    - **Flexible Matching**: Handles skill level suffixes (e.g., "Cake Baking (advanced)" matches "Cake Baking")
    - **Manual Application**: Removed auto-apply after negotiation - users must click "Apply All Recommendations"
    - **Enhanced Logging**: Comprehensive console logging for debugging negotiation flow
    - **useCallback Optimization**: Fixed stale closure issues with proper dependency management
    - **Benefits**: Reliable negotiation system with proper price updates

20. **NEW: Subscription System Robustness COMPLETED:**

    - **Error Handling**: Added safety checks for invalid subscription tiers
    - **Default Fallbacks**: Gracefully handles missing or corrupted subscription data
    - **Type Safety**: Proper validation before accessing subscription features
    - **Benefits**: System won't crash with data inconsistencies

21. **NEW: Complete Quotes Listing Page COMPLETED:**

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

22. **NEW: Quote Data Fetching System COMPLETED:**

    - **Server Action**: `getQuotesAction` fetches quotes with company and service details
    - **TanStack Query Hook**: `useQuotesQuery` for efficient caching and data fetching
    - **Database Integration**: Fetches quotes with related company and quote services data
    - **Type Safety**: Proper TypeScript interfaces for quote data structures
    - **Benefits**: Fast, cached quote loading with real-time updates

23. **NEW: Complete Quote Creation System COMPLETED:**

    - **Full Quote Form**: Comprehensive form with company selection, project details, services, client info, and final notes
    - **Service Management**: Dynamic service selection with quantity, pricing, and notes
    - **AI Integration**: AI-assisted quote generation with pricing recommendations and market analysis
    - **Quote Preview**: Professional quote preview component with executive summary, service breakdown, terms, and next steps
    - **Database Integration**: Complete quote and quote-services tables with proper relationships
    - **Subscription Limits**: Real-time enforcement of quote creation limits
    - **Form Validation**: Zod schema validation with proper error handling
    - **Dummy Data**: Test data population for birthday event scenario
    - **Benefits**: End-to-end quote creation workflow with AI assistance

24. **NEW: Quote Preview Component COMPLETED:**

    - **Professional Layout**: Executive summary, value proposition, service breakdown, terms, payment, timeline, and next steps
    - **Service Breakdown**: Detailed pricing with quantity, unit price, total, and deliverables
    - **Visual Design**: Clean card-based layout with proper spacing and typography
    - **Total Calculation**: Automatic total amount calculation from services
    - **Benefits**: Professional quote presentation ready for client delivery

25. **NEW: AI Quote Generation with Enhanced Features COMPLETED:**

    - **Market Analysis**: Location-based insights, market conditions, and competitive positioning
    - **Service Recommendations**: AI-suggested pricing with confidence levels (high/medium/low)
    - **Price Ranges**: Min/max thresholds for each service with validation
    - **Negotiation Support**: AI-powered negotiation tips and strategies
    - **One-Click Application**: Apply all AI recommendations instantly
    - **Interactive Negotiation**: Per-service negotiation with AI assistance
    - **Benefits**: Professional AI-powered pricing with market intelligence

26. **NEW: Enhanced AI Context Integration COMPLETED:**

    - **Company AI Summary**: Previously generated business summaries now included in pricing prompts
    - **Rich Context**: AI has access to company's market position, expertise, and operational details
    - **Better Recommendations**: More informed pricing based on actual business context
    - **Updated Interfaces**: Type-safe integration of AI summary data
    - **Benefits**: Significantly improved AI pricing accuracy and relevance

27. **NEW: TypeScript Type Safety COMPLETED:**

    - **Proper Interfaces**: Replaced all `any` types with comprehensive type definitions
    - **AI Response Types**: Full type safety for AI recommendation structures
    - **Function Parameters**: Type-safe function signatures throughout
    - **Benefits**: Better developer experience and runtime safety

28. **NEW: Subscription tracking and limit enforcement system COMPLETED:**

    - **Quotes Table**: Created with proper schema and relationships
    - **Subscription Limits**: Free tier (3 quotes/month, 1 company), Pro tier (unlimited quotes, 5 companies)
    - **Database Functions**: Real-time usage tracking with monthly resets
    - **Server Actions**: API endpoints for checking limits and creating quotes
    - **UI Components**: Beautiful subscription limit cards with upgrade prompts
    - **TanStack Query Hooks**: Efficient caching for subscription data
    - **Header Integration**: User info and subscription status in app header
    - **Limit Enforcement**: Prevents exceeding subscription limits
    - **Benefits**: Complete subscription management with real-time tracking

29. **NEW: Header User Status COMPLETED:**

    - **Quote Usage Display**: Shows current usage for free users (e.g., "Quotes: 2/3")
    - **Subscription Status**: Displays current subscription tier and limits
    - **User Information**: Shows user name and email in header
    - **Benefits**: Users can see their current usage and subscription status at a glance

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
