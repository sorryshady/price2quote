# Next.js Starter Template

A modern, feature-rich Next.js starter template with authentication, database integration, and beautiful UI components.

## Features

- 🚀 **Next.js 15.3.1** with App Router
- 🔐 **Authentication** with secure session-based auth and bcrypt
- 🎨 **UI Components** using Radix UI and Tailwind CSS
- 📱 **Responsive Design** with mobile-first approach
- 🌙 **Dark Mode** support
- 📧 **Email Integration** with React Email and Nodemailer
- 🗄️ **Database** with PostgreSQL and Drizzle ORM
- 📝 **Form Handling** with React Hook Form and Zod
- 🎭 **Animations** with Motion
- 🔄 **State Management** with Zustand
- 🎯 **TypeScript** for type safety
- 🛠️ **Development Tools** (ESLint, Prettier, etc.)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL

### Installation

1. Clone the repository:

```bash
git clone https://github.com/sorryshady/next-starter.git
cd next-starter
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
# Copy the example environment file
cp .env.example .env.local
```

Required environment variables:

```env
# Database
DB_PASSWORD=your_password
DB_USER=your_user
DB_NAME=next_starter
DB_PORT=5432

# Email (for local development)
EMAIL_PROVIDER=mailhog
SMTP_HOST=localhost
SMTP_PORT=1025

# Auth
AUTH_SECRET=your_auth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

4. Set up the database:

```bash
pnpm db:generate
pnpm db:migrate
```

5. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

## Project Structure

```
├── src/
│   ├── app/                    # App router pages and layouts
│   │   ├── (auth)/            # Authentication pages (login, register, etc.)
│   │   ├── (public)/          # Public pages (home, about, etc.)
│   │   ├── (protected)/       # Protected pages (dashboard, etc.)
│   │   ├── api/               # API routes
│   │   │   └── auth/          # Authentication API endpoints
│   │   ├── server-actions/    # Server actions for form handling
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── components/            # React components
│   │   ├── form-ui/          # Form-related components
│   │   ├── ui/               # Reusable UI components
│   │   ├── navbar/           # Navigation components
│   │   └── providers/        # Context providers
│   │
│   ├── db/                   # Database configuration and schema
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Database schema definitions
│   │
│   ├── email-templates/      # Email templates using React Email
│   ├── env/                  # Environment variable validation
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and helpers
│   ├── providers/            # App-wide providers
│   └── middleware.ts         # Next.js middleware for auth
│
├── public/                   # Static assets
├── memory-bank/             # Project documentation
├── .cursor/                 # Cursor IDE configuration
├── .vscode/                 # VS Code configuration
│
├── next.config.js           # Next.js configuration
├── drizzle.config.ts        # Drizzle ORM configuration
├── components.json          # UI components configuration
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies and scripts
```

### Key Directories Explained

- **`src/app/`**: Contains all the pages and API routes using Next.js App Router

  - `(auth)/`: Authentication-related pages (login, register, etc.)
  - `(public)/`: Publicly accessible pages
  - `(protected)/`: Pages that require authentication
  - `api/`: Backend API endpoints
  - `server-actions/`: Server-side form handling functions

- **`src/components/`**: Reusable React components

  - `form-ui/`: Form components with validation
  - `ui/`: Base UI components (buttons, inputs, etc.)
  - `navbar/`: Navigation components
  - `providers/`: Context providers for state management

- **`src/db/`**: Database-related code

  - Schema definitions
  - Database connection setup
  - Migration utilities

- **`src/lib/`**: Utility functions and helpers

  - Authentication utilities
  - Form validation schemas
  - Common helper functions

- **`src/email-templates/`**: Email templates using React Email

  - Verification emails
  - Password reset emails
  - Notification templates

- **`src/hooks/`**: Custom React hooks
  - Authentication hooks
  - Form handling hooks
  - UI interaction hooks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Local Development with Docker

This project includes Docker configuration for local development, including a PostgreSQL database and Mailhog for email testing.

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and pnpm

### Setup with Docker

1. Create a `.env.local` file with the following variables:

```env
# Database
DB_PASSWORD=your_password
DB_USER=your_user
DB_NAME=next_starter
DB_PORT=5432

```

2. Start the Docker containers:

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database on port 5432
- Mailhog (email testing) on:
  - SMTP server: localhost:1025
  - Web interface: http://localhost:8025

### Testing Email Functionality

1. The application is configured to use Mailhog in development mode
2. All outgoing emails will be captured by Mailhog
3. View captured emails at http://localhost:8025
4. Features available in Mailhog:
   - View email content (HTML and plain text)
   - Test email templates
   - Verify email sending functionality
   - Debug email-related issues

### Database Management

- Database data is persisted in `./docker-data/db`
- Connect to the database using your preferred PostgreSQL client:
  - Host: localhost
  - Port: 5432
  - Database: next_starter
  - Username: your_user (from .env.local)
  - Password: your_password (from .env.local)

### Stopping the Services

```bash
# Stop the containers
docker-compose down

# Stop and remove volumes (this will delete the database data)
docker-compose down -v
```
