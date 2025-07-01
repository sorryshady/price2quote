# Active Context

## Current Focus

- Comprehensive company onboarding flow implementation
- Database schema updates for companies with extended fields
- Supabase storage integration for company logos
- Services and skill level management (20 services limit)
- AI summary generation for company context
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

## Current Considerations

1. Comprehensive company onboarding flow design
2. Database schema for companies with extended fields
3. Services and skill levels data structure (20 services limit)
4. Supabase storage bucket setup and configuration
5. AI summary generation implementation with smart triggers
6. Base pricing storage and currency handling
7. Subscription tier enforcement
8. Multi-currency support implementation

## Next Steps

1. Design comprehensive company onboarding flow
2. Update database schema for companies with all required fields
3. Set up Supabase storage bucket for logos
4. Create services and skill levels schema (20 services limit)
5. Implement onboarding middleware
6. Create company setup forms with all fields
7. Plan AI summary generation architecture with smart triggers
8. Add subscription validation
9. Implement base pricing storage per service

## Known Issues

- None currently - focusing on comprehensive onboarding flow design

## Active Questions

1. Should companies be one-to-one with users initially?
2. Multi-currency implementation approach?
3. AI summary generation frequency optimization?

## Current State

Authentication system is complete. Ready to implement comprehensive company onboarding flow with extended company profile, services (20 limit), skill levels per service, base pricing, and AI summary generation for the PricingGPT platform.
