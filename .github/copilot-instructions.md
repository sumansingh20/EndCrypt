# Finance Encryption Frontend - Copilot Instructions

This is a production-ready React 18 + TypeScript frontend for a FinTech encryption application.

## Project Overview
- **Tech Stack**: React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query, React Router v6
- **Purpose**: Demonstrate end-to-end encryption workflows with AWS KMS integration
- **Architecture**: Single-page application with JWT authentication and encrypted data management

## Development Guidelines
- Use strict TypeScript (no `any` types)
- Functional components with hooks only
- Follow accessibility best practices (ARIA, semantic HTML, keyboard navigation)
- Implement responsive design with mobile-first approach
- Use dark navy (#0f172a) and gold accent (#facc15) theme
- Maintain test coverage for critical components

## API Integration
- Backend provides JWT authentication and AWS KMS encryption/decryption
- All authenticated endpoints require `Authorization: Bearer <JWT>` header
- Handle 401 responses by redirecting to login
- Use React Query for server state management with proper caching

## Security Considerations
- Store JWT in memory (Zustand) with HttpOnly cookie refresh pattern
- Implement input sanitization and validation
- Follow CSP guidelines for production deployment
- Never expose sensitive AWS credentials in frontend code

## Testing Strategy
- Unit tests with Vitest + React Testing Library
- E2E tests with Playwright
- Mock backend for local development
- Test authentication flows, encryption forms, and API integrations