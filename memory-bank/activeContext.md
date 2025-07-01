# Active Context

## Current Focus

- Company onboarding UI implementation
- Multi-step onboarding form with logo upload
- Services management interface
- AI summary generation integration
- Subscription-based feature access

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

4. Company Setup Requirements:

   - Company name, country, business type
   - Logo upload via Supabase storage
   - Services offered by the company (max 20)
   - Skill levels per service (beginner, intermediate, advanced)
   - Company description
   - Base pricing per service (optional)
   - AI-generated company summary for quote context

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

## Current Considerations

1. Multi-step onboarding UI design and implementation
2. Logo upload component integration
3. Services management interface (add/edit/delete services)
4. AI summary generation on company save
5. Onboarding middleware and route protection
6. Subscription validation during onboarding
7. Error handling and user feedback

## Next Steps

1. Create onboarding route and layout
2. Implement multi-step onboarding form
3. Add logo upload component
4. Create services management interface
5. Integrate AI summary generation
6. Add onboarding middleware
7. Implement subscription validation

## Known Issues

- None currently - database and storage setup complete

## Active Questions

1. Should companies be one-to-one with users initially?
2. Multi-currency implementation approach?
3. AI summary generation frequency optimization?

## Current State

Database schema and Supabase storage setup are complete. Ready to implement the comprehensive company onboarding UI with multi-step form, logo upload, services management, and AI summary generation for the PricingGPT platform.
