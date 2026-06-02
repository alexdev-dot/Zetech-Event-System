# Zetech Events Hub

A comprehensive campus events management platform for Zetech University, built with modern web technologies to help students discover, register, and attend campus events.

## 🚀 Features

### For Students
- **Event Discovery**: Browse and search through upcoming campus events
- **Event Registration**: Easy registration system for students
- **My Events**: View registered events and manage registrations
- **Calendar View**: See events by day, week, or month
- **Real-time Notifications**: Live updates for event changes and registrations
- **Social Sharing**: WhatsApp and social media integration
- **Responsive Design**: Mobile-first approach for all devices

### For Administrators
- **Event Management**: Create, edit, and delete events
- **Admin Dashboard**: Analytics with charts and statistics
- **User Management**: View and manage student registrations
- **Activity Monitoring**: Real-time activity tracking
- **Account Settings**: Manage admin credentials
- **Event Approvals**: Approve or reject event submissions

### For Club Leaders
- **Club Dashboard**: Manage club-specific events
- **Event Creation**: Create events for your club
- **Member Management**: View club member registrations
- **Analytics**: Track club event performance

### Technical Features
- **Real-time Updates**: Socket.io for live notifications
- **Secure Authentication**: JWT-based authentication with bcrypt
- **File Uploads**: Image upload support for events
- **Form Validation**: Robust form handling with Zod schema validation
- **Rate Limiting**: API rate limiting for security
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Compression**: Gzip compression for improved performance
- **Security Headers**: Helmet.js for security headers

## 🛠️ Technologies Used

### Frontend Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7.x
- **Routing**: React Router DOM v6
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: shadcn/ui (Radix UI based)
- **Icons**: Lucide React & React Icons
- **Animations**: Tailwind CSS Animate
- **Date Handling**: date-fns
- **Calendar**: React Day Picker
- **Charts**: Recharts
- **Real-time**: Socket.io Client
- **Notifications**: Sonner for toast notifications

### Backend Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken) with bcrypt
- **Database**: Supabase (PostgreSQL) via REST API/RPC
- **Real-time**: Socket.io
- **File Uploads**: Multer
- **Security**: Helmet.js, express-rate-limit, cors
- **Compression**: compression middleware
- **Environment**: dotenv
- **SMS Integration**: Africa's Talking (optional)

### Development Tools

- **Linting**: ESLint with React plugins
- **Type Checking**: TypeScript
- **Package Manager**: npm
- **Version Control**: Git

### Deployment

- **Containerization**: Docker (multi-stage build)
- **Process Management**: PM2
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)

## 📋 Prerequisites

### Quick Start with Docker (Recommended)
The easiest way to run this application on any computer is using Docker. You only need:

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- Supabase account with project configured

### Manual Development Setup
If you prefer to run without Docker, you need:

- Node.js (v18 or higher)
- npm package manager
- Git for version control
- Supabase account with project configured

## 🚀 Getting Started

### Option 1: Quick Start with Docker (Recommended)

This is the fastest way to get the application running on any computer - no Node.js or local dependencies required:

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd Zetech-Event-System
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Set up Supabase database:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to SQL Editor
   - Run `backend/setup_exec_sql.sql`
   - Run `backend/schema.sql`

4. **Run with Docker:**
   ```bash
   docker-compose up -d --build
   ```

5. **Access the application:**
   - Open your browser to `http://localhost:3001`

That's it! The application is now running in a container and can be deployed anywhere Docker is available.

**Docker Commands:**
- `docker-compose up -d --build` - Build and start
- `docker-compose down` - Stop the application
- `docker-compose logs -f` - View logs
- `docker-compose restart` - Restart the application

### Option 2: Manual Development Setup

This option is for developers who want to modify the code or run without Docker.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Zetech-Event-System
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Set Up Environment Variables

#### Frontend Environment Variables (.env)

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API URL for backend (where the backend server is running)
VITE_API_URL=http://localhost:3001

# Supabase Configuration (for frontend client)
# Get these from your Supabase project dashboard: https://supabase.com/dashboard
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_key
```

#### Backend Environment Variables (backend/.env)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration (for backend service role access)
# Get these from your Supabase project dashboard: https://supabase.com/dashboard
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (IMPORTANT: Generate a secure random string at least 32 characters)
# You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_secure_jwt_secret_at_least_32_characters

# Client URL (for CORS configuration - your frontend URL in production)
CLIENT_URL=http://localhost:5173

# Africa's Talking SMS Configuration (Optional - for SMS notifications)
# Get these from: https://africastalking.com/
# Leave these blank if you don't want SMS functionality
AT_API_KEY=
AT_USERNAME=sandbox
```

### 4. Set Up Supabase Database

Before running the application, you need to set up the Supabase database:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Run the SQL from `backend/setup_exec_sql.sql` (creates the exec_sql function)
5. Run the SQL from `backend/schema.sql` (creates database tables)

### 5. Start the Development Servers

#### Start Backend Server

```bash
cd backend
npm start
# Or for development with auto-reload:
npm run dev
```

The backend will start on `http://localhost:3001`

#### Start Frontend Server

```bash
# From the root directory
npm run dev
```

The frontend will start on `http://localhost:5000`

### 6. Open Your Browser

Navigate to `http://localhost:5000` to view the application.

## 📁 Project Structure

```
Zetech-Event-System/
├── backend/                    # Backend Express.js server
│   ├── public/                # Static files (uploads)
│   │   └── uploads/          # User uploaded images
│   ├── .env                  # Backend environment variables (gitignored)
│   ├── .env.example          # Backend environment variables template
│   ├── API.md                # API documentation
│   ├── backup.sql            # Database backup
│   ├── db.js                 # Supabase database connection (RPC)
│   ├── package.json          # Backend dependencies
│   ├── schema.sql            # Database schema
│   ├── server.js             # Express server with Socket.io
│   ├── setup_exec_sql.sql    # SQL setup for exec_sql function
│   └── start.sh              # (removed) Startup script
├── public/                    # Frontend static assets
│   ├── favicon.ico           # Site favicon
│   ├── manifest.json         # PWA manifest
│   └── placeholder.svg       # Placeholder image
├── src/                       # Frontend React application
│   ├── assets/               # React assets
│   │   └── zetech-logo.png  # Logo image
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── AdminAccountSettings.tsx
│   │   ├── AdminAnalytics.tsx
│   │   ├── AdminCombinedSettings.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminSystemSettings.tsx
│   │   ├── ClubLeaderDashboard.tsx
│   │   ├── EventCard.tsx
│   │   ├── HeroSection.tsx
│   │   └── ...              # Other components
│   ├── contexts/             # React contexts
│   │   └── SocketContext.tsx # Socket.io context
│   ├── data/                 # Static data
│   │   └── events.ts         # Sample events data
│   ├── hooks/                # Custom React hooks
│   │   └── useAuth.tsx      # Authentication hook
│   ├── lib/                  # Utility functions
│   │   └── supabase.ts      # Supabase client configuration
│   ├── pages/                # Page components
│   │   ├── AdminDashboard.tsx
│   │   ├── Auth.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── ClubLeaderDashboard.tsx
│   │   ├── CreateEvent.tsx
│   │   ├── EventDetail.tsx
│   │   ├── Events.tsx
│   │   ├── Index.tsx
│   │   ├── MyEvents.tsx
│   │   ├── Profile.tsx
│   │   ├── ThisMonthEvents.tsx
│   │   ├── ThisWeekEvents.tsx
│   │   └── TodayEvents.tsx
│   ├── App.css               # App-specific styles
│   ├── App.tsx               # Main App component with routing
│   ├── index.css             # Global styles
│   └── main.tsx              # Application entry point
├── .env                       # Frontend environment variables (gitignored)
├── .env.example               # Frontend environment variables template
├── .dockerignore              # Docker ignore rules
├── .gitattributes             # Git attributes
├── .gitignore                 # Git ignore rules
├── components.json            # shadcn/ui configuration
├── DEPLOYMENT.md              # Comprehensive deployment guide
├── Dockerfile                 # Multi-stage Docker build configuration
├── MIGRATION_REPORT.md        # Migration report from Replit
├── package.json               # Frontend dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── README.md                  # This file
├── SOCKETIO.md                # Socket.io documentation
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.app.json          # TypeScript app configuration
├── tsconfig.json              # TypeScript configuration
├── tsconfig.node.json         # TypeScript node configuration
└── vite.config.ts             # Vite configuration
```

## 🛠️ Available Scripts

### Frontend Scripts (Root Directory)

```bash
npm run dev          # Start development server (port 5000)
npm run build        # Build for production
npm run build:dev    # Build for development mode
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality checks
npm run start:prod   # Start backend server (for production)
```

### Backend Scripts (Backend Directory)

```bash
npm start            # Start backend server (port 3001)
npm run dev          # Start backend server with auto-reload
npm run init-db      # Initialize database (if setup script exists)
```

## 🗄️ Database Architecture

### Database Connection

The application uses Supabase (PostgreSQL) via REST API/RPC instead of direct TCP connections. This approach:
- Works in all deployment environments (VPS, serverless, containers)
- Bypasses firewall restrictions common in cloud environments
- More secure as it doesn't require direct database port exposure

### Database Tables

- `student_registrations` - Student user accounts
- `admins` - Admin and club leader accounts
- `events` - Event information
- `event_registrations` - Student event registrations

### Database Setup

Run these SQL scripts in your Supabase SQL Editor:

1. `backend/setup_exec_sql.sql` - Creates the exec_sql function for RPC queries
2. `backend/schema.sql` - Creates all database tables and triggers

## 🔌 API Documentation

The backend provides RESTful APIs for all application features. For detailed API documentation, see `backend/API.md`.

### Base URL
- Development: `http://localhost:3001`
- Production: `https://your-domain.com`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Student login
- `POST /api/auth/admin/login` - Admin login

#### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (admin/club leader)
- `PUT /api/events/:id` - Update event (admin/club leader)
- `DELETE /api/events/:id` - Delete event (admin)

#### Event Registration
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:eventId/register/:studentId` - Cancel registration
- `GET /api/students/:studentId/registrations` - Get student registrations

#### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/events/:eventId/registrations` - Get event registrations
- `PUT /api/admin/account` - Update admin account
- `GET /api/admin/activity` - Get activity data
- `GET /api/admin/recent-registrations` - Get recent registrations
- `GET /api/admin/active-sessions` - Get active sessions

#### Health Check
- `GET /api/health` - Server health check

## 🔌 Real-time Features (Socket.io)

The application uses Socket.io for real-time updates. For detailed Socket.io documentation, see `SOCKETIO.md`.

### Socket Events

#### Event Registration
- `registration:success` - Sent to the user who registered
- `event:new-registration` - Sent to all admins
- `event:registration-count-update` - Sent to all connected clients

#### Event Approval
- `event:approved` - Sent to all connected clients
- `event:your-event-approved` - Sent to the event creator
- `event:rejected` - Sent to the event creator

## 🎨 Customization

### Theming

The application uses Tailwind CSS with a custom dark theme. Modify the theme in `tailwind.config.ts`:

```typescript
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... more color definitions
      },
    },
  },
};
```

### Adding UI Components

UI components are built using shadcn/ui. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Update navigation in the appropriate layout component

### Environment Variables

See the "Set Up Environment Variables" section above for all required environment variables.

## 🚀 Deployment

For comprehensive deployment instructions, see `DEPLOYMENT.md`.

### Quick Deployment Options

#### Docker Deployment

```bash
# Build Docker image
docker build -t zetech-event-system:latest .

# Run container
docker run -d -p 3001:3001 --env-file backend/.env zetech-event-system:latest

# Or use Docker Compose
docker-compose up -d
```

#### VPS Deployment (Ubuntu)

```bash
# Install Node.js, PM2, Nginx
# Configure environment variables
# Build frontend
npm run build

# Start backend with PM2
pm2 start backend/server.js --name "zetech-backend"
pm2 save
pm2 startup

# Configure Nginx reverse proxy
# Setup SSL with Let's Encrypt
```

#### Cloud Platform Deployment

- **Railway**: Connect repository, set environment variables, deploy
- **Render**: Connect repository, set build/start commands, deploy
- **Heroku**: Create app, set environment variables, deploy

## 🔒 Security

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password hashing
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Prevention**: Parameterized queries via Supabase RPC
- **File Upload Security**: Multer with file type and size restrictions

### Security Best Practices

1. Never commit `.env` files to version control
2. Use strong JWT secrets (minimum 32 characters)
3. Enable HTTPS in production
4. Keep dependencies updated: `npm audit fix`
5. Use firewall to restrict access
6. Regular database backups
7. Monitor logs for suspicious activity

## 🧪 Testing

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

### Manual Testing

1. Test user registration and login
2. Test event creation and registration
3. Test real-time notifications (open multiple browser tabs)
4. Test file uploads
5. Test admin dashboard features
6. Test API endpoints with tools like Postman

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing code style
4. **Run linting**: `npm run lint`
5. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** with a clear description

### Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing component structure
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add proper error handling
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the documentation**
   - Review this README file
   - Check `DEPLOYMENT.md` for deployment issues
   - Check `backend/API.md` for API documentation
   - Check `SOCKETIO.md` for real-time features

2. **Search existing issues**
   - Check the GitHub Issues page for similar problems
   - Look for closed issues that might have solutions

3. **Create a new issue**
   - Include detailed information about your environment
   - Provide steps to reproduce the issue
   - Include relevant error messages and screenshots

## 🎯 Roadmap

### Completed Features ✅

- [x] Basic event discovery and registration
- [x] User authentication with JWT
- [x] Admin dashboard for event management
- [x] Club leader dashboard
- [x] Real-time notifications with Socket.io
- [x] Responsive design with Tailwind CSS
- [x] Social media integration (WhatsApp sharing)
- [x] File upload support for event images
- [x] Analytics dashboard with charts
- [x] Calendar views (day, week, month)
- [x] SMS notifications (Africa's Talking)

### Upcoming Features 🚧

- [ ] **Mobile App Development**
  - React Native app for iOS and Android
  - Push notifications for event reminders
  - Offline event browsing

- [ ] **Advanced Analytics Dashboard**
  - Event attendance tracking
  - User engagement metrics
  - Revenue and performance analytics
  - Export reports (PDF, Excel)

- [ ] **Event Ticketing System**
  - Integrated payment processing
  - QR code ticket generation
  - Tiered pricing and early bird discounts
  - Refund management

### Future Enhancements 🔮

- [ ] **Student Information System Integration**
  - Automatic student verification
  - Academic calendar integration
  - Course-related event recommendations

- [ ] **AI-Powered Features**
  - Smart event recommendations
  - Automated event categorization
  - Chatbot for event assistance

- [ ] **Multi-campus Support**
  - Support for multiple campuses
  - Campus-specific event filtering
  - Cross-campus event sharing

## 🏆 Acknowledgments

- **Zetech University** for supporting this initiative
- **Supabase** for the generous open-source plan
- **shadcn/ui** for the excellent component library
- **Radix UI** for the accessible component primitives
- **Vite** for the fast build tool
- **Contributors** who help improve this platform

## 📚 Additional Documentation

- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Comprehensive deployment guide
- [`backend/API.md`](backend/API.md) - API documentation
- [`SOCKETIO.md`](SOCKETIO.md) - Socket.io real-time features
- [`MIGRATION_REPORT.md`](MIGRATION_REPORT.md) - Migration from Replit

---

Built with ❤️ for Zetech University students by the Campus Tech Team
