# Student Achievement Dashboard

## Overview
A responsive student achievement dashboard web app where students can connect their Canvas LMS account, view assignments, grades, and track academic progress.

## Architecture
- **Frontend**: React + TypeScript + Vite, dark-themed dashboard UI
- **Backend**: Express.js with session management
- **Database**: PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components

## Key Features
- Dashboard with metric cards (completion rate, on-time streak, total tasks, current standing)
- Upcoming deadlines table with status badges
- Priority focus panel identifying critical/standard/upcoming tasks
- Semester progress tracking
- User settings modal with Canvas LMS integration
- Canvas API integration for syncing assignments and grades
- Search and course filtering
- Dark theme by default

## Data Model
- **users**: Profile info, Canvas integration credentials
- **assignments**: Course assignments with status, due dates, weights, grades

## File Structure
- `shared/schema.ts` - Database schemas and TypeScript types
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface and PostgreSQL implementation
- `server/routes.ts` - API endpoints
- `server/seed.ts` - Demo data seeding
- `client/src/pages/dashboard.tsx` - Main dashboard page
- `client/src/components/` - UI components (metric-cards, deadlines-table, priority-focus, semester-progress, user-settings-modal, search-bar)
- `client/src/lib/theme.tsx` - Dark/light theme provider

## API Endpoints
- `GET /api/user` - Get current user profile
- `PATCH /api/user` - Update profile/Canvas settings
- `GET /api/assignments` - Get all assignments
- `GET /api/metrics` - Get computed dashboard metrics
- `GET /api/priorities` - Get priority focus items
- `POST /api/canvas/sync` - Sync data from Canvas LMS

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
