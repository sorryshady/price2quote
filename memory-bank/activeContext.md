# Active Context

## Current Focus

- Company onboarding form implementation COMPLETED
- AI integration with Gemini for company summary generation
- Database save functionality with background AI processing
- Company profile management with AI summary status

## Recent Changes

1. Authentication System:

   - Complete login flow with session management
   - OAuth authentication (Google and GitHub)
   - Session persistence using cookies and database
   - Auth provider for client-side state management

2. Subscription System:

   - Free tier: 3 quotes/month, 1 company
   - Pro tier: Unlimited quotes, 5 companies
   - Subscription feature checking utilities
   - Dodo Payments integration planned

3. Project Context:

   - Identified as PricingGPT platform
   - AI-powered pricing recommendations
   - Multi-currency support
   - Gmail integration for emails
   - PDF quote generation

4. Company Onboarding Implementation COMPLETED:

   - Multi-step onboarding form (Company Info, Profile, Services, Summary)
   - localStorage persistence for form data and current step
   - Logo upload with Base64 preview (max 4MB)
   - Services management (add/edit/remove up to 20 services)
   - Form validation and error handling
   - Responsive UI with progress indicators
   - Hydration from localStorage on page reload

5. Database & Storage Setup:
   - Companies and services tables created with proper relationships
   - Supabase storage bucket 'company-logos' configured
   - Storage policies set for public access with API route control
   - Logo upload utility function implemented using DRY storage helpers
   - TypeScript types defined for Company and Service interfaces

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
13. **NEW: Server-side background AI processing** - Save company immediately, trigger AI generation in background
14. **NEW: AI summary status tracking** - pending/generating/completed/failed states in database

## Current Considerations

1. Gemini AI integration setup and configuration
2. Database schema updates for AI summary fields
3. Background AI processing implementation
4. Company save API endpoint with logo upload
5. AI summary generation prompt engineering
6. Error handling for AI generation failures
7. Company profile page with AI summary status display

## Next Steps

1. **IMMEDIATE: Setup Gemini AI integration**
2. Update database schema for AI summary fields
3. Implement company save API endpoint
4. Create background AI processing function
5. Add AI summary status to company profile
6. Implement retry mechanism for failed AI generation

## Known Issues

- None currently - onboarding form implementation complete

## Active Questions

1. Should companies be one-to-one with users initially?
2. Multi-currency implementation approach?
3. AI summary generation frequency optimization?
4. **NEW: Gemini API key management and security?**

## Current State

Company onboarding form is fully implemented and functional. Ready to implement AI integration with Gemini for company summary generation, followed by database save functionality with background processing.
