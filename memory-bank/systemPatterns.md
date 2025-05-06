# System Patterns

## Architecture Overview

The project follows Next.js App Router architecture with a focus on component-based development and modern React patterns.

## Authentication System Architecture

- **Extensible Schema**: Users table supports credentials and social login. Accounts table links users to external providers (Google, GitHub, etc.).
- **Secure Password Handling**: Passwords are hashed (bcrypt/argon2) and never stored in plain text.
- **Session Management**: Supports JWT or DB-backed sessions for user authentication.
- **Provider Abstraction**: Logic is modular to allow easy addition of new OAuth providers.
- **Security Best Practices**: CSRF protection, rate limiting, input validation (zod), secure cookies.
- **Separation of Concerns**: Schema, logic, and UI are modularized for maintainability.

## Directory Structure

```
src/
├── app/             # App Router pages and layouts
├── components/      # Reusable React components
├── lib/            # Utility functions and shared logic
├── styles/         # Global styles and Tailwind config
└── types/          # TypeScript type definitions
```

## Key Technical Decisions

### 1. Routing & Layout

- App Router for file-based routing
- Root layout with provider wrapping
- Nested layouts for shared UI elements
- Client and server components separation

### 2. Component Architecture

- Atomic design principles
- Composition over inheritance
- Radix UI for accessible primitives
- Component-specific styling with Tailwind

### 3. State Management

- React hooks for local state
- Context for theme management
- Server components for data fetching
- Props for component communication
- **User context for authentication state**

### 4. Styling Approach

- Tailwind CSS for utility-first styling
- CSS modules for component-specific styles
- CSS variables for theming
- Responsive design patterns

### 5. Type System

- Strict TypeScript configuration
- Zod for runtime type validation
- Type-safe environment variables
- Proper type exports

### 6. Code Quality

- ESLint for code linting
- Prettier for code formatting
- Import sorting
- File naming conventions

## Design Patterns

### Component Patterns

- Compound components
- Render props (when needed)
- Custom hooks
- Higher-order components (sparingly)

### Data Patterns

- Server components for data fetching
- Loading and error states
- Optimistic updates
- Proper type validation
- **Auth flows with clear error handling and feedback**

### Performance Patterns

- Code splitting
- Image optimization
- Font optimization
- Bundle size monitoring

## Component Relationships

- Provider wrapping application
- Layout components for structure
- Shared components for reuse
- Page components for routes
- **Auth provider/context for user state**

## Technical Constraints

1. Next.js App Router conventions
2. React server components rules
3. TypeScript strict mode
4. Tailwind class order
5. ESLint rules

## Email Verification & Provider Abstraction Pattern

- **Server-only Token Generation:**
  - Email verification tokens (JWT, 15 min expiry) are generated only in API routes or server actions, never in client components.
  - Tokens include user id, email, and a type for validation.
- **React Email Template Rendering:**
  - Email templates are authored as React components and rendered to HTML using `@react-email/render` in the API route before sending.
- **Provider-Agnostic Email Delivery:**
  - Email sending is abstracted behind a provider interface (Mailhog for local/dev, Resend for production).
  - The provider is selected via environment variable or NODE_ENV, allowing seamless switching with minimal code changes.
- **Separation of Concerns:**
  - Client components never import or use server-only code (e.g., nodemailer, process.env, token generation).
  - All sensitive logic and secrets are handled server-side.
- **Pattern Benefits:**
  - Secure, maintainable, and easily extensible for new providers or email types.
  - Enables local email testing (Mailhog) and production delivery (Resend) with the same codebase.
