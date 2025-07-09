# PricingGPT - AI-Powered Pricing Platform

A modern web application that helps freelancers and businesses generate AI-powered pricing recommendations and professional quotes using Google's Gemini AI.

## 🚀 Features

### Core Functionality

- 🤖 **AI-Powered Pricing**: Generate intelligent pricing recommendations using Google's Gemini AI
- 📊 **Professional Quote Generation**: Create comprehensive quotes with AI assistance
- 📄 **PDF Export**: Generate professional quote PDFs with company branding
- 📧 **Gmail Integration**: Send quotes directly via Gmail with OAuth authentication
- 🌍 **Multi-Currency Support**: Support for 30+ currencies worldwide
- 💳 **Subscription Management**: Free and Pro tiers with usage tracking

### Technical Stack

- 🚀 **Next.js 15.3.1** with App Router
- 🔐 **Authentication** with secure session-based auth and bcrypt
- 🎨 **UI Components** using Radix UI and Tailwind CSS
- 📱 **Responsive Design** with mobile-first approach
- 🌙 **Dark Mode** support
- 🗄️ **Database** with PostgreSQL and Drizzle ORM
- 📝 **Form Handling** with React Hook Form and Zod
- 🔄 **State Management** with TanStack Query and Zustand
- 🎯 **TypeScript** for type safety

## 📋 Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database
- Google OAuth credentials (for Gmail integration)
- Google Gemini API key

## 🛠️ Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd price2quote
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Set up environment variables:**

Create a `.env.local` file with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=price2quote
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Application URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Authentication
AUTH_SECRET=your_secure_auth_secret_here

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=${NEXT_PUBLIC_API_URL}/api/auth/callback/google

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=${NEXT_PUBLIC_API_URL}/api/auth/callback/github

# Gmail API (for email sending)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Supabase (for file storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (for development)
MAILHOG_HOST=localhost
MAILHOG_PORT=1025
EMAIL_FROM=noreply@yourapp.com

# Resend (for production email)
RESEND_API_KEY=your_resend_api_key
```

4. **Set up the database:**

```bash
pnpm db:generate
pnpm db:migrate
```

5. **Start the development server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

## 🏗️ Project Structure

```
├── src/
│   ├── app/                    # App router pages and layouts
│   │   ├── (auth)/            # Authentication pages (login, register, etc.)
│   │   ├── (public)/          # Public pages (home, about, contact)
│   │   ├── (protected)/       # Protected pages (dashboard, quotes, etc.)
│   │   │   ├── add-company/   # Company onboarding
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── quotes/        # Quote management
│   │   │   ├── conversations/ # Email conversations
│   │   │   ├── send-email/    # Email composer
│   │   │   └── profile/       # User profile
│   │   ├── api/               # API routes
│   │   └── server-actions/    # Server actions
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── navbar/           # Navigation components
│   │   ├── form-ui/          # Form components
│   │   └── providers/        # Context providers
│   │
│   ├── db/                   # Database configuration
│   │   ├── schema/           # Database schema definitions
│   │   └── migrations/       # Database migrations
│   │
│   ├── lib/                  # Utility functions
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── gemini.ts         # AI integration
│   │   ├── gmail.ts          # Gmail API integration
│   │   ├── mailer.ts         # Email utilities
│   │   └── schemas/          # Validation schemas
│   │
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── email-templates/      # Email templates
│
├── memory-bank/              # Project documentation
├── public/                   # Static assets
└── docker-compose.yml        # Docker configuration
```

## 🔐 Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Gmail API Setup

1. In Google Cloud Console, enable Gmail API
2. Create OAuth 2.0 credentials for web application
3. Add authorized JavaScript origins and redirect URIs
4. Download credentials and add to environment variables

## 🤖 AI Integration

The application uses Google's Gemini AI for:

- **Company Summary Generation**: AI-powered business summaries
- **Pricing Recommendations**: Market-based pricing suggestions with confidence levels
- **Quote Generation**: Professional quote content creation
- **Email Composition**: Context-aware email generation
- **Quote Revision Analysis**: AI-assisted quote revisions

## 💼 Subscription System

### Free Tier

- 3 quotes per month
- 1 company profile
- 2 revisions per quote
- Basic features

### Pro Tier

- Unlimited quotes
- Up to 5 companies
- Unlimited revisions
- Priority support
- Advanced analytics

## 🌍 Multi-Currency Support

Supported currencies include:

- USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, INR, BRL, MXN, KRW, SGD, NOK, SEK, DKK, PLN, CZK, HUF, ILS, ZAR, PHP, THB, MYR, IDR, VND, TRY, RUB, AED, SAR

## 🐳 Local Development with Docker

The project includes Docker configuration for local development:

1. **Create environment file:**

```env
# Database
DB_PASSWORD=your_password
DB_USER=your_user
DB_NAME=price2quote
DB_PORT=5432
```

2. **Start services:**

```bash
docker-compose up -d
```

This starts:

- PostgreSQL database on port 5432
- Mailhog (email testing) on port 8025

3. **View emails:**

- Mailhog web interface: http://localhost:8025

## 🔧 Configuration

### Database Schema

The application uses a comprehensive database schema including:

- **Users & Authentication**: User accounts, sessions, OAuth connections
- **Companies**: Business profiles with AI-generated summaries
- **Services**: Company service offerings with pricing
- **Quotes**: Quote generation and management with versioning
- **Email Threads**: Conversation tracking and threading
- **Subscriptions**: Usage tracking and limits

### Key Features

1. **Company Onboarding**: Multi-step form with logo upload and AI summary generation
2. **Quote Creation**: AI-assisted pricing with service selection and client management
3. **Email Integration**: Gmail OAuth with conversation threading and PDF attachments
4. **Quote Management**: Version history, revisions, and status tracking
5. **Analytics**: Usage tracking and subscription management

## 📊 Production Deployment

### Environment Setup

Ensure all environment variables are configured for production:

- Use production database credentials
- Configure production OAuth redirect URIs
- Set up production email service (Resend)
- Configure Supabase for file storage
- Use production Gemini API key

### Performance Considerations

- Database connection pooling
- Image optimization for company logos
- PDF generation optimization
- Email sending rate limits
- Cache management

## 🔒 Security

- Session-based authentication with secure cookies
- Password hashing with bcrypt
- CSRF protection
- Input validation with Zod
- Row-level security for database access
- Secure file upload handling
- OAuth token management

## 🧪 Testing

The application includes:

- Component testing setup
- API route testing
- Form validation testing
- Authentication flow testing
- Email integration testing

## 🗺️ Product Roadmap

### Current Status: MVP Ready ✅

The application has a solid foundation with core features implemented. Next phase focuses on enhancing the quote lifecycle and preparing for growth features.

### Phase 1: Enhanced Quote Management (Current Priority)

#### Enhanced Quote Status System 🎯

**Problem**: Current status system (`draft`, `sent`, `revised`, `accepted`, `rejected`) lacks clarity and doesn't support future payment integration.

**Solution**: Refined status flow that better represents the quote-to-cash lifecycle:

```typescript
export const quoteStatusEnum = pgEnum('quote_status', [
  // Quote Lifecycle
  'draft', // Initial creation, not ready to send
  'awaiting_client', // Sent to client, awaiting response
  'under_revision', // Client requested changes, being worked on
  'revised', // Revisions completed, ready to resend
  'accepted', // Client approved the quote
  'rejected', // Client declined
  'expired', // Quote expired without response
  'paid', // Payment received - project financially complete
])
```

**Benefits**:

- Clear workflow progression
- Better analytics and conversion funnel tracking
- Payment integration ready with `paid` status
- Eliminates confusion around revision states
- Supports future milestone payment system

#### Implementation Tasks:

- [ ] Database migration for new status values
- [ ] Update TypeScript types and validation schemas
- [ ] Refresh all UI components (status displays, filters, badges)
- [x] Enhance analytics to track new conversion funnel
- [x] Add `paid` status for payment completion tracking
- [ ] Add status transition validation logic

### Phase 2: Smart Payment Integration (3-6 months)

#### Milestone-Based Payment System 💰

**Philosophy**: Protect both clients and service providers through structured payment breakdowns.

**Key Features**:

1. **Universal Payment Schemes** - Set default payment structures per company
2. **Quote-Specific Overrides** - Customize when needed for minimal friction
3. **AI-Suggested Structures** - Optimal payment plans based on project complexity

**Example Payment Schemes**:

```typescript
const paymentSchemes = {
  standard: [
    { percentage: 30, trigger: 'upfront', description: 'Project initiation' },
    {
      percentage: 40,
      trigger: 'milestone',
      description: 'Mid-project milestone',
    },
    {
      percentage: 30,
      trigger: 'completion',
      description: 'Project completion',
    },
  ],
  consulting: [
    { percentage: 20, trigger: 'upfront', description: 'Retainer' },
    {
      percentage: 80,
      trigger: 'completion',
      description: 'Final deliverables',
    },
  ],
  development: [
    { percentage: 25, trigger: 'upfront', description: 'Project kickoff' },
    { percentage: 25, trigger: 'milestone', description: 'Design approval' },
    {
      percentage: 25,
      trigger: 'milestone',
      description: 'Development milestone',
    },
    { percentage: 25, trigger: 'completion', description: 'Final delivery' },
  ],
}
```

**Implementation Plan**:

- [ ] Database schema for payment schemes and milestone tracking
- [ ] Company settings for default payment structures
- [ ] Quote creation with payment timeline visualization
- [ ] Stripe integration for automated milestone payments
- [ ] Client portal for payment status and milestone approval

### Phase 3: Growth Features (6-12 months)

#### Client Portal System 🎯

- Branded client-facing quote review pages
- Digital signature collection
- Feedback and approval workflows
- Quote comparison for revisions

#### Advanced AI Features 🤖

- Competitive pricing analysis and industry benchmarking
- Seasonal pricing recommendations
- Client budget optimization
- Template generation based on successful quotes

#### Template & Automation System 📋

- Quote templates by industry/service type
- Custom branding templates
- Automated follow-up sequences
- Template marketplace (Pro feature)

### Phase 4: Enterprise & Scale (12+ months)

#### Team Collaboration 👥

- Multi-user companies with role-based permissions
- Quote approval workflows
- Team analytics and performance tracking
- Collaborative quote editing

#### CRM Integration 📊

- Client relationship management
- Lead tracking and nurturing
- Communication history
- Advanced analytics and forecasting

#### API & Integrations 🔌

- Public API for third-party integrations
- Zapier/Make.com connections
- Calendar integration for project timelines
- Accounting software sync (QuickBooks, Xero)

### Immediate Next Steps

1. **Enhanced Status System Implementation** (Week 1-2)
2. **Analytics Enhancement** for new status tracking (Week 3)
3. **Payment Scheme Architecture Planning** (Week 4)
4. **Client Portal MVP Design** (Month 2)

## 📖 Documentation

Additional documentation is available in the `memory-bank/` directory:

- `projectbrief.md` - Project overview and requirements
- `productContext.md` - Product goals and user experience
- `systemPatterns.md` - Technical architecture and patterns
- `techContext.md` - Technology stack and constraints
- `progress.md` - Current status and completed features
- `activeContext.md` - Current work and next steps

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical issues:

1. Check environment variables are properly configured
2. Verify database connectivity
3. Ensure all required APIs are enabled
4. Check OAuth configuration and redirect URIs
5. Review application logs for detailed error messages

For questions about features or usage, please refer to the documentation in the `memory-bank/` directory.
