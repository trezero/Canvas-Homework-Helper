# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Express + Vite HMR) on port 5000
npm run build        # Production build (uses script/build.ts)
npm start            # Start production server from dist/
npm run check        # TypeScript type checking (no emit)
npm run db:push      # Push schema changes to PostgreSQL via Drizzle Kit
```

Requires `DATABASE_URL` env var pointing to a PostgreSQL instance.

## Architecture

Full-stack TypeScript app that integrates with Canvas LMS to track student homework, grades, and progress. Originally built on Replit.

### Three-layer structure

- **`client/`** — React 18 SPA built with Vite. Uses Tailwind CSS + shadcn/ui components (`client/src/components/ui/`). Routing via Wouter, state via TanStack Query. Single main page: `dashboard.tsx`.
- **`server/`** — Express 5 API. All routes in `routes.ts`, DB access in `storage.ts` (implements `IStorage` interface), Canvas API client in `canvas.ts`. Auth via Replit Auth (Passport.js + OpenID in `server/replit_integrations/auth/`).
- **`shared/`** — Drizzle ORM schema (`schema.ts`), shared types, and pure logic used by both client and server.

### Path aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

Configured in both `tsconfig.json` and `vite.config.ts`.

### Key domain concepts

**Assignment status system** — Assignments use a flag-based status model defined in `shared/status-resolver.ts`. Raw boolean flags (`hasSubmission`, `isGraded`, `isMissing`, `isLate`, `hasReplies`, `isLocked`) are resolved into one of 8 statuses: `missing`, `missing_available`, `graded_late`, `submitted_late`, `graded_on_time`, `submitted_pending_grade`, `upcoming`, `no_status`. The resolver is used both during Canvas sync and for migrating legacy statuses.

**Canvas sync flow** — `POST /api/canvas/sync` triggers `CanvasClient.syncStudentData()` which fetches all courses and assignments via paginated Canvas API calls, derives flags/status for each, then replaces all stored assignments for that user (delete-all + re-insert).

**Observer/parent support** — The app detects observer accounts via Canvas enrollment types and supports switching between linked students (observees).

**Allowance calculator** — `shared/allowance-calculator.ts` computes suggested allowance amounts based on assignment completion data.

### Database

PostgreSQL with Drizzle ORM. Schema defined in `shared/schema.ts` and `shared/models/auth.ts`. Tables: `users`, `sessions` (required for Replit Auth), `assignments`, `saved_filters`, `allowance_settings`. No migration files — uses `drizzle-kit push` for schema sync.

### API pattern

All API routes require authentication (`isAuthenticated` middleware). User ID extracted from Replit Auth claims via `(req.user as any)?.claims?.sub`. Canvas API token is stored encrypted in the users table and masked in API responses.
