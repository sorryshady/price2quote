# Active Context

## Current Focus

Implementing a robust authentication system. Registration and email verification flows are now fully polished, including a visually appealing verification page with loader, success/error states, and automatic redirection. Next focus: login, session management, and OAuth integration.

## Recent Changes

1. Registration flow completed:
   - User registration with Zod validation and React Hook Form
   - API integration for user creation
   - Email verification with secure, expiring token (JWT, 15 min)
   - Provider-agnostic email sending (Mailhog for dev, Resend for prod)
   - All server-only logic (token, email) moved to API routes
2. Email verification page now features:
   - Loader, success, and error states with icons
   - Card component and modern, centered styling
   - Automatic redirection on success or error
3. Toast notifications for user feedback
4. Refactored code to ensure no server-only logic in client components

## Active Decisions

1. Using App Router for modern Next.js features
2. Strict TypeScript configuration
3. Radix UI for accessible components
4. Tailwind CSS for styling
5. Comprehensive linting rules
6. Credentials login as initial auth, schema extensible for social providers
7. Email verification tokens generated and validated server-side only
8. Email provider abstraction for easy switching between dev/prod
9. Polished, user-friendly UI for all auth flows

## Current Considerations

1. Schema extensibility for multiple auth providers
2. Secure password handling and session management
3. API and UI integration for auth flows
4. Security best practices (hashing, CSRF, rate limiting)
5. Testing and error handling for auth flows

## Next Steps

1. Implement login and session management (JWT or DB sessions)
2. Prepare for OAuth provider integration (Google, GitHub)
3. Harden security and add tests
4. Add tests for registration and verification flows
5. Harden registration security (rate limiting, CSRF, etc.)

## Known Issues

None at present

## Active Questions

1. Password hashing algorithm selection (bcrypt/argon2)
2. JWT vs DB session management
3. OAuth provider library choice (next-auth vs custom)

## Current State

Registration and email verification are fully functional and visually polished. The system is ready for login, session, and OAuth work.
