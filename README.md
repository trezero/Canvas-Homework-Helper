# Canvas Homework Helper

A comprehensive web application that integrates with Canvas LMS to help students and parents track homework assignments, grades, and academic progress. Built with modern web technologies for a seamless user experience.

![Canvas Homework Helper](greeting.png)

## Features

### 🎓 Student Dashboard
- **Real-time Assignment Tracking**: Sync assignments directly from Canvas LMS
- **Smart Status Management**: Automatic categorization (missing, graded, upcoming, etc.)
- **Grade Analytics**: Average score calculations and semester progress tracking
- **Priority Focus**: Highlight critical assignments and upcoming deadlines
- **Advanced Filtering**: Search by course, status, and custom filters
- **Saved Views**: Create and save custom filter combinations for quick access

### 👨‍👩‍👧‍👦 Parent/Observer Support
- **Multi-Student Monitoring**: Parents can view assignments for multiple linked students
- **Observer Accounts**: Full support for Canvas observer accounts
- **Student Switching**: Easily switch between different student profiles

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with dark/light theme support
- **Mobile-Friendly**: Optimized for all device sizes
- **Intuitive Navigation**: Streamlined interface for quick access to information
- **Real-time Updates**: Live synchronization with Canvas data

### 🔧 Technical Features
- **Secure Authentication**: Replit Auth integration with session management
- **Canvas API Integration**: Robust connection to Canvas LMS APIs
- **Database Storage**: PostgreSQL with Drizzle ORM for reliable data persistence
- **Type-Safe**: Full TypeScript implementation for better code quality

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with Replit Auth
- **WebSockets**: Real-time communication support

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Icons**: Lucide React

### Development Tools
- **Linting**: TypeScript compiler
- **Database Management**: Drizzle Kit
- **Package Management**: npm
- **Deployment**: Replit platform

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **Canvas LMS Account** with API access
- **Replit Account** (for authentication)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/trezero/Canvas-Homework-Helper.git
cd Canvas-Homework-Helper
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Push database schema
npm run db:push
```

### 4. Environment Configuration
Create a `.env` file in the root directory with the following variables:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/canvas_helper

# Replit Auth (automatically configured on Replit platform)
REPLIT_DB_URL=...

# Server
NODE_ENV=development
PORT=5000
```

### 5. Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### Getting Started

1. **Sign Up/Login**: Use Replit authentication to create an account
2. **Configure Canvas**: Add your Canvas instance URL and API token in settings
3. **Sync Data**: Click "Update Records" to sync assignments from Canvas
4. **Explore Dashboard**: View your assignments, grades, and progress

### Canvas API Setup

To connect your Canvas account:

1. Go to your Canvas instance settings
2. Generate a new access token under "Approved Integrations"
3. Copy the token and your Canvas base URL (e.g., `https://your-school.instructure.com`)
4. Enter these in the application settings

### For Parents/Observers

1. Use your observer account credentials
2. The app will detect linked students automatically
3. Select which student to view from the dashboard
4. Monitor assignments and progress for each student

### Advanced Features

- **Saved Filters**: Create custom views for different scenarios (e.g., "Overdue Assignments", "This Week's Work")
- **Search**: Find assignments by course name, subject, or notes
- **Status Filtering**: Focus on specific assignment states (missing, graded, upcoming)
- **Theme Toggle**: Switch between light and dark modes

## API Reference

### Authentication Endpoints
- `GET /api/user` - Get current user information
- `PATCH /api/user` - Update user profile and Canvas settings

### Assignment Endpoints
- `GET /api/assignments` - Retrieve all assignments
- `GET /api/metrics` - Get dashboard metrics and analytics
- `GET /api/priorities` - Get priority assignments

### Canvas Integration
- `POST /api/canvas/test` - Test Canvas API connection
- `POST /api/canvas/sync` - Sync assignments from Canvas
- `GET /api/canvas/observees` - Get linked students (for observers)

### Saved Filters
- `GET /api/saved-filters` - Retrieve saved filter configurations
- `POST /api/saved-filters` - Create new saved filter
- `PATCH /api/saved-filters/:id` - Update saved filter
- `DELETE /api/saved-filters/:id` - Delete saved filter

## Database Schema

### Core Tables

**users**
- User account information and Canvas integration settings
- Supports both student and observer account types

**assignments**
- Assignment data synced from Canvas
- Includes status tracking, grades, and metadata

**saved_filters**
- User-defined filter configurations for quick access

**sessions**
- Session storage for Replit authentication

## Development

### Available Scripts
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database migrations
npm run db:push
```

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Express backend
│   ├── routes.ts          # API route definitions
│   ├── canvas.ts          # Canvas API integration
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
│   ├── schema.ts          # Database schema definitions
│   └── models/            # Data models
└── script/                 # Build and utility scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure responsive design for mobile devices

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features on GitHub Issues
- **Canvas API**: Refer to [Canvas LMS API Documentation](https://canvas.instructure.com/doc/api/)

## Acknowledgments

- Built with [Replit](https://replit.com) platform
- Canvas LMS integration using [Canvas API](https://canvas.instructure.com/doc/api/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Canvas Homework Helper v4.2 Professional** - Making academic management effortless.
