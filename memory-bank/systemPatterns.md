# System Patterns

## Architecture Overview

The project follows Next.js App Router architecture with a focus on component-based development and modern React patterns.

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

## Technical Constraints

1. Next.js App Router conventions
2. React server components rules
3. TypeScript strict mode
4. Tailwind class order
5. ESLint rules
