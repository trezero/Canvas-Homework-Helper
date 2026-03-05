# Student Achievement Dashboard

## Overview
A responsive student achievement dashboard web app supporting both students and observer (parent) accounts. Users connect their Canvas LMS account to view assignments, grades, and track academic progress.

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
- Observer (parent) account support: auto-detects account type, shows linked students, allows switching between observed students
- Search and course filtering
- Dark theme by default with light mode toggle

## Data Model
- **users**: Profile info, Canvas integration credentials, account type (student/observer), observed student info
- **assignments**: Course assignments with status, due dates, weights, grades, Canvas metadata (pointsPossible, score, submittedAt, gradedAt, courseId)

## File Structure
- `shared/schema.ts` - Database schemas and TypeScript types (User, Assignment, DashboardMetrics, PriorityItem, CanvasObservee, CanvasSyncResult)
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface and PostgreSQL implementation
- `server/routes.ts` - API endpoints
- `server/seed.ts` - Demo data seeding (auto-restores assignments if missing)
- `server/canvas.ts` - Canvas LMS API client with pagination, account type detection, observer support
- `client/src/pages/dashboard.tsx` - Main dashboard page
- `client/src/components/` - UI components (metric-cards, deadlines-table, priority-focus, semester-progress, user-settings-modal, observer-student-picker, search-bar)
- `client/src/lib/theme.tsx` - Dark/light theme provider

## API Endpoints
- `GET /api/user` - Get current user profile (token masked as ••••••••••••••••)
- `PATCH /api/user` - Update profile/Canvas settings
- `GET /api/assignments` - Get all assignments
- `GET /api/metrics` - Get computed dashboard metrics
- `GET /api/priorities` - Get priority focus items
- `POST /api/canvas/test` - Test Canvas connection with provided URL/token
- `POST /api/canvas/sync` - Sync data from Canvas LMS (supports observedStudentId param)
- `GET /api/canvas/observees` - List linked students for observer accounts

## Canvas Integration
- Token stored server-side only, returned as `••••••••••••••••` to frontend
- Account type detection via enrollment type check (ObserverEnrollment)
- Observer flow: detects linked students, prompts selection if multiple, uses `as_user_id` param for data access
- Smart assignment status logic based on submission/grading state

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
