# Components

This directory contains reusable React components.

## Structure

Components are organized by feature or type:

### UI Components (from shadcn/ui)
- Button, Input, Card, Dialog, etc.
- Installed via `npx shadcn-ui@latest add <component>`

### Feature Components
- `auth/` - Authentication related components
- `booking/` - Booking flow components
- `dashboard/` - Dashboard components
- `event-types/` - Event type management
- `availability/` - Availability management
- `profile/` - User profile components
- `team/` - Team management components
- `analytics/` - Analytics and charts

### Shared Components
- `layout/` - Layout components (Header, Footer, Sidebar)
- `forms/` - Form components and wrappers
- `ui/` - Base UI components from shadcn/ui

## Guidelines

- Keep components small and focused
- Use TypeScript for type safety
- Export components as named exports
- Include prop types and documentation
- Use Tailwind CSS for styling
- Follow React best practices
