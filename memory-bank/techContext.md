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
