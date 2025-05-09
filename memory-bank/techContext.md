# Technical Context

## Core Technologies

### Frontend

- Next.js 15.3.1 (App Router)
- React 19.0.0
- TypeScript 5.8.3
- Tailwind CSS 4
- Motion 12.9.4 (for animations)

### State Management

- Zustand 5.0.4
- React Hook Form 7.56.2
- React Hot Toast 2.5.2

### UI Components

- Radix UI
- Lucide React 0.507.0
- Tabler Icons 3.31.0

### Authentication

- bcryptjs 3.0.2
- jsonwebtoken 9.0.2
- Drizzle ORM 0.43.1

### Database

- PostgreSQL
- Drizzle ORM
- Drizzle Kit 0.31.1

### Email

- React Email
- Nodemailer 7.0.2
- Resend 4.5.1

## Development Setup

### Environment Variables

- NEXT_PUBLIC_API_URL
- AUTH_SECRET
- DATABASE_URL
- EMAIL_PROVIDER
- NODE_ENV

### Development Tools

- ESLint 9.26.0
- Prettier 3.5.3
- TypeScript 5.8.3
- Drizzle Kit

## Technical Constraints

### Authentication

- Session-based auth with database storage
- Secure cookie handling required
- Regular auth checks (5-minute intervals)
- CSRF protection needed

### Performance

- Bundle size monitoring
- Code splitting
- Image optimization
- Font optimization

### Security

- Password hashing with bcrypt
- Secure session management
- Rate limiting
- Input validation

### Browser Support

- Modern browsers
- Mobile responsiveness
- Dark mode support

## Dependencies

### Core

```json
{
  "next": "15.3.1",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "typescript": "5.8.3"
}
```

### UI

```json
{
  "tailwindcss": "4",
  "motion": "12.9.4",
  "lucide-react": "0.507.0",
  "@tabler/icons-react": "3.31.0"
}
```

### State & Forms

```json
{
  "zustand": "5.0.4",
  "react-hook-form": "7.56.2",
  "react-hot-toast": "2.5.2"
}
```

### Auth & Database

```json
{
  "bcryptjs": "3.0.2",
  "jsonwebtoken": "9.0.2",
  "drizzle-orm": "0.43.1"
}
```

## Development Workflow

### Local Development

1. Environment setup
2. Database migration
3. Development server
4. Hot reloading

### Testing

1. Component testing
2. Integration testing
3. E2E testing (planned)

### Deployment

1. Build process
2. Environment configuration
3. Database migration
4. Email provider setup

## Known Technical Limitations

### Current

- No E2E tests yet
- Rate limiting not implemented
- OAuth providers pending

### Planned

- React Query integration
- Comprehensive testing
- Performance monitoring
- Analytics integration

## Authentication

### OAuth Providers

1. Google OAuth:

   - Endpoints:
     - Auth: `https://accounts.google.com/o/oauth2/v2/auth`
     - Token: `https://oauth2.googleapis.com/token`
     - User Info: `https://www.googleapis.com/oauth2/v3/userinfo`
   - Scopes: `openid email profile`
   - Features:
     - Refresh token support
     - Account selection
     - Token expiration

2. GitHub OAuth:
   - Endpoints:
     - Auth: `https://github.com/login/oauth/authorize`
     - Token: `https://github.com/login/oauth/access_token`
     - User Info: `https://api.github.com/user`
     - Emails: `https://api.github.com/user/emails`
   - Scopes: `read:user user:email`
   - Features:
     - Non-expiring tokens
     - Direct login after first auth
     - Email verification

### Token Management

1. Access Tokens:

   - Google: Short-lived (typically 1 hour)
   - GitHub: Non-expiring
   - Stored in database
   - Used for API calls

2. Refresh Tokens:

   - Google only
   - Long-lived
   - Stored in database
   - Used for getting new access tokens

3. Session Tokens:
   - UUID-based
   - 7-day expiration
   - Stored in HTTP-only cookies
   - Used for user authentication

## Security

### OAuth Security

1. State Parameter:

   - UUID generation
   - Secure cookie storage
   - 10-minute expiration
   - CSRF protection

2. Cookie Security:

   - HTTP-only
   - Secure in production
   - SameSite: lax
   - Path: /

3. Error Handling:
   - Redirect-based
   - User-friendly messages
   - Secure error logging
   - Provider conflict prevention

## Database Schema

### OAuth Tables

1. Users:

   ```typescript
   users {
     id: string
     email: string
     name: string
     image: string
     emailVerified: Date
     passwordHash: string
   }
   ```

2. Accounts:

   ```typescript
   accounts {
     userId: string
     provider: string
     providerAccountId: string
     type: 'oauth'
     accessToken: string
     refreshToken: string | null
     expiresAt: Date
   }
   ```

3. Sessions:
   ```typescript
   sessions {
     id: string
     userId: string
     expiresAt: Date
     createdAt: Date
     ip: string
     userAgent: string
   }
   ```

## Environment Variables

### OAuth Configuration

```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=
```

## Dependencies

### OAuth Related

- `drizzle-orm`: Database operations
- `next/server`: API routes and responses
- `crypto`: UUID generation
- `react-hot-toast`: Error notifications
