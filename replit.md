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
- Full assignment table with sortable columns, score display, and pagination (15 per page)
- Smart filter bar: search, course dropdown, status filter (overdue/pending/completed/priority), hide-completed toggle
- Active filter chips with clear-all option
- Saved filter views (Quick Views): save current filter combo, name it, load with one click, set as default landing view
- Course-grouped view toggle: switch between flat list and collapsible course sections with summary stats (overdue count, avg score)
- Priority focus panel identifying critical/standard/upcoming tasks
- Semester progress tracking
- User settings modal with Canvas LMS integration
- Canvas API integration for syncing assignments and grades
- Observer (parent) account support: auto-detects account type, shows linked students, allows switching between observed students
- Dark theme by default with light mode toggle (persisted in localStorage)

## Data Model
- **users**: Profile info, Canvas integration credentials, account type (student/observer), observed student info
- **assignments**: Course assignments with status, due dates, weights, grades, Canvas metadata (pointsPossible, score, submittedAt, gradedAt, courseId)
- **saved_filters**: User's saved filter presets with name, filter config (course, status, hideLocked, searchQuery), isDefault flag

## File Structure
- `shared/schema.ts` - Database schemas and TypeScript types (User, Assignment, SavedFilter, DashboardMetrics, PriorityItem, CanvasObservee, CanvasSyncResult)
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface and PostgreSQL implementation (includes saved filter CRUD)
- `server/routes.ts` - API endpoints
- `server/seed.ts` - Demo data seeding (auto-restores assignments if missing)
- `server/canvas.ts` - Canvas LMS API client with pagination, account type detection, observer support
- `client/src/pages/dashboard.tsx` - Main dashboard page (orchestrates filters, saved views, data queries)
- `client/src/components/search-bar.tsx` - Smart filter bar with status/course/search/hide-completed
- `client/src/components/saved-filters-bar.tsx` - Quick Views bar for saved filter presets
- `client/src/components/deadlines-table.tsx` - Assignment table with sort/paginate/grouped-view
- `client/src/components/` - Other UI components (metric-cards, priority-focus, semester-progress, user-settings-modal, observer-student-picker, theme-toggle)
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
- `GET /api/saved-filters` - Get user's saved filter presets
- `POST /api/saved-filters` - Create a saved filter
- `PATCH /api/saved-filters/:id` - Update a saved filter
- `DELETE /api/saved-filters/:id` - Delete a saved filter
- `POST /api/saved-filters/:id/default` - Set a filter as the default landing view

## Canvas Integration
- Token stored server-side only, returned as `••••••••••••••••` to frontend
- Account type detection via enrollment type check (ObserverEnrollment)
- Observer flow: detects linked students, prompts selection if multiple, fetches student submissions per course
- Smart assignment status logic based on submission/grading state
- On sync, saves Canvas user's name to fullName (so greeting shows API key owner's first name)

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
