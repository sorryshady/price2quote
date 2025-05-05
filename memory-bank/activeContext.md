# Active Context

## Current Focus

Designing and implementing a bulletproof authentication system. Initial focus is on credentials-based login, with extensibility for social login (Google, GitHub) in the near future.

## Recent Changes

1. Project initialization with Next.js 15.3.1
2. Configuration of development tools:
   - ESLint
   - Prettier
   - TypeScript
   - Tailwind CSS
3. Setup of base components and layouts
4. Implementation of theme switching
5. Documentation setup

## Active Decisions

1. Using App Router for modern Next.js features
2. Implementing strict TypeScript configuration
3. Adopting Radix UI for accessible components
4. Using Tailwind CSS for styling
5. Setting up comprehensive linting rules
6. Authentication system will use credentials login first, with a schema and logic designed for easy addition of social providers.

## Current Considerations

1. Schema extensibility for multiple auth providers
2. Secure password handling and session management
3. API and UI integration for auth flows
4. Security best practices (hashing, CSRF, rate limiting)
5. Testing and error handling for auth flows

## Next Steps

1. Update DB schema for credentials and social login extensibility
2. Implement credentials registration and login (with password hashing)
3. Add session management (JWT or DB sessions)
4. Prepare for OAuth provider integration (Google, GitHub)
5. Build UI forms and API endpoints for auth
6. Harden security and add tests

## Known Issues

None at present - initial setup phase

## Active Questions

1. Password hashing algorithm selection (bcrypt/argon2)
2. JWT vs DB session management
3. OAuth provider library choice (next-auth vs custom)

## Current State

The project is transitioning from initial setup to implementing a robust authentication system, starting with credentials and planning for social login extensibility.
