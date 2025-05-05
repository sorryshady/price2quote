# Technical Context

## Technology Stack

- **Framework**: Next.js 15.3.1
- **Language**: TypeScript 5.x
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 4.x
- **Package Manager**: pnpm
- **Node Version**: >= 18.17.0

## Development Environment

### Required Tools

- Node.js (>= 18.17.0)
- pnpm
- Git
- VS Code (recommended)

### VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Setup Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Format code
pnpm format
```

## Dependencies

### Core Dependencies

- next: ^15.3.1
- react: ^19.0.0
- react-dom: ^19.0.0
- next-themes: ^0.4.6
- @radix-ui/react-\*: Various UI primitives
- class-variance-authority: ^0.7.1
- clsx: ^2.1.1
- tailwind-merge: ^3.2.0
- zod: ^3.24.4

### Development Dependencies

- typescript: ^5
- eslint: ^9.26.0
- prettier: ^3.5.3
- tailwindcss: ^4
- Various ESLint plugins and configurations

## Technical Constraints

### Browser Support

- Modern browsers
- No IE11 support
- Progressive enhancement

### Performance Targets

- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Bundle size < 200KB (initial)

### Code Quality Standards

- TypeScript strict mode
- ESLint rules compliance
- Prettier formatting
- Import sorting
- File structure rules

## Configuration Files

### Next.js Config

- `next.config.js`: Next.js configuration
- `next-env.d.ts`: Next.js TypeScript types

### TypeScript

- `tsconfig.json`: TypeScript configuration
- Strict mode enabled
- Path aliases configured

### ESLint

- `eslint.config.mjs`: ESLint configuration
- Next.js recommended rules
- React hooks rules
- Import sorting
- File naming rules

### Prettier

- `.prettierrc`: Prettier configuration
- Import sorting plugin
- Tailwind CSS plugin

### Tailwind CSS

- `tailwind.config.js`: Tailwind configuration
- Custom theme settings
- Component class sorting
- JIT mode enabled

## Environment Variables

- `NEXT_PUBLIC_*`: Public variables
- Type-safe using @t3-oss/env-nextjs
- Zod validation schemas
