# Zetech Event System - Complete System Architecture and Data Flow

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Architecture](#database-architecture)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Authentication Flow](#authentication-flow)
8. [Real-time Communication](#real-time-communication)
9. [API Structure](#api-structure)
10. [Security Architecture](#security-architecture)
11. [Deployment Architecture](#deployment-architecture)

---

## System Overview

The Zetech Event System is a full-stack web application built with a modern, scalable architecture designed for campus event management. The system follows a **client-server architecture** with real-time capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           React Frontend (Vite + TypeScript)                  │ │
│  │  - React Router for navigation                                │ │
│  │  - TanStack Query for data fetching                           │ │
│  │  - Socket.io Client for real-time updates                     │ │
│  │  - React Hook Form + Zod for form validation                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                        │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Express.js Application                          │ │
│  │  - REST API Endpoints                                         │ │
│  │  - Socket.io Server for real-time                            │ │
│  │  - JWT Authentication Middleware                              │ │
│  │  - Rate Limiting & Security Middleware                        │ │
│  │  - Multer for File Uploads                                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/RPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                              │ │
│  │  - Student Registrations                                      │ │
│  │  - Admins (Admin & Club Leaders)                              │ │
│  │  - Events                                                     │ │
│  │  - Event Registrations                                        │ │
│  │  - Event Reactions/Comments                                   │ │
│  │  - Security Audit Logs                                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### Layer 1: Presentation Layer (Frontend)
- **Technology**: React 18 + TypeScript + Vite
- **Responsibility**: User interface, user interactions, client-side validation
- **Key Libraries**: React Router, TanStack Query, Socket.io Client, shadcn/ui

### Layer 2: Application Layer (Backend)
- **Technology**: Node.js + Express.js
- **Responsibility**: Business logic, API endpoints, authentication, real-time communication
- **Key Libraries**: JWT, bcrypt, Socket.io, Multer, Helmet

### Layer 3: Data Layer (Database)
- **Technology**: Supabase (PostgreSQL)
- **Responsibility**: Data persistence, relationships, constraints
- **Access Method**: REST API via RPC (Remote Procedure Call)

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── Layout.tsx            # Main layout wrapper
│   ├── EventCard.tsx         # Event display component
│   ├── HeroSection.tsx      # Landing page hero
│   └── ...                   # Other feature components
├── pages/
│   ├── Index.tsx             # Landing page
│   ├── Events.tsx            # Events listing
│   ├── EventDetail.tsx      # Single event view
│   ├── Auth.tsx             # Authentication page
│   ├── AdminDashboard.tsx   # Admin interface
│   ├── ClubLeaderDashboard.tsx
│   └── ...                  # Other pages
├── contexts/
│   └── SocketContext.tsx    # Socket.io context provider
├── hooks/
│   └── useAuth.tsx          # Authentication hook
├── lib/
│   └── supabase.ts          # Supabase client config
└── App.tsx                  # Main app with routing
```

### State Management Strategy

1. **Server State**: TanStack Query (React Query)
   - Caches API responses
   - Automatic refetching
   - Optimistic updates
   - Loading/error states

2. **Client State**: React Context + useState
   - User authentication state
   - Socket connection state
   - UI state (modals, drawers)

3. **Form State**: React Hook Form + Zod
   - Form validation
   - Error handling
   - Type-safe forms

### Data Fetching Pattern

```typescript
// Example: Fetching events
const { data: events, isLoading, error } = useQuery({
  queryKey: ['events'],
  queryFn: async () => {
    const response = await fetch('/api/events');
    return response.json();
  }
});
```

### Routing Architecture

React Router DOM v6 with protected routes:
- Public routes: `/`, `/events`, `/auth`
- Student protected: `/my-events`, `/profile`
- Admin protected: `/admin/dashboard`
- Club Leader protected: `/club-leader/dashboard`

---

## Backend Architecture

### Server Structure

```
backend/
├── server.js                 # Main Express server
├── db.js                     # Supabase connection (RPC)
├── schema.sql                # Database schema
├── setup_exec_sql.sql        # SQL function setup
├── public/
│   └── uploads/             # Uploaded images
├── package.json
└── .env                      # Environment variables
```

### Middleware Stack (Execution Order)

1. **Helmet.js** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **CSRF Protection** - Token validation
4. **Compression** - Gzip compression
5. **Rate Limiting** - Request throttling
6. **Express JSON Parser** - Request body parsing
7. **Static File Serving** - Uploads directory
8. **Custom Auth Middleware** - JWT verification
9. **Route Handlers** - API endpoints

### Key Backend Components

#### 1. Database Connection (db.js)
- Uses Supabase REST API via RPC
- No direct TCP connection to database
- Works in all deployment environments
- SQL injection protection via parameterized queries

#### 2. Authentication System
- JWT tokens for stateless authentication
- bcrypt for password hashing
- Token expiration: 8 hours
- Auth cache for performance (30s TTL)

#### 3. Real-time Communication (Socket.io)
- WebSocket connections for live updates
- Room-based subscriptions (user-specific, admin, club)
- Event notifications (registrations, approvals)

#### 4. File Upload System
- Multer for multipart/form-data handling
- Image validation (type, size, extension)
- Unique filename generation
- 5MB file size limit

#### 5. Security Layers
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting (global, auth, upload, admin)
- Brute force protection

---

## Database Architecture

### Database Connection Method

**Important**: The application uses Supabase via REST API/RPC instead of direct TCP connections.

**Why this approach?**
- Works in all deployment environments (VPS, serverless, containers)
- Bypasses firewall restrictions
- More secure (no direct database port exposure)
- Compatible with serverless platforms

### Database Schema

#### Core Tables

1. **student_registrations**
   - User accounts for students
   - Fields: id, first_name, last_name, admission_number, email, password, phone, status
   - Indexes: admission_number, email, status, created_at

2. **admins**
   - Admin and club leader accounts
   - Fields: id, admin_email, password_hash, name, role, club, created_at
   - Roles: 'admin', 'club_leader'
   - Indexes: admin_email, role

3. **events**
   - Event information
   - Fields: id, title, description, date, time, location, category, max_participants, image_url, status, created_by
   - Status values: 'pending', 'upcoming', 'ongoing', 'completed', 'cancelled', 'rejected'
   - Indexes: status, date, created_by, created_at

4. **event_registrations**
   - Student event registrations
   - Fields: id, event_id, student_id, registration_date, status
   - Status values: 'registered', 'attended', 'cancelled'
   - Indexes: event_id, student_id, status
   - Constraints: UNIQUE(event_id, student_id)

#### Engagement Tables

5. **event_reactions**
   - User reactions to events (fire, heart, wow)
   - UNIQUE constraint: one reaction per user per event

6. **event_comments**
   - Comments on events

7. **event_waitlist**
   - Waitlist for full events

8. **event_gallery**
   - Event images uploaded by admins

#### System Tables

9. **system_settings**
    - Application configuration
    - Key-value pairs for system settings

12. **event_categories**
    - Event categories with display order

13. **event_subcategories**
    - Event subcategories linked to categories

14. **security_audit_logs**
    - Security event logging
    - Tracks: logins, failed attempts, data changes

### Database Relationships

```
student_registrations (1) ────────< (N) event_registrations >─────── (1) events
                                    │
                                    │
                                    ▼
                             (status tracking)

admins (1) ───────────────────────< (N) events
(created_by)

event_categories (1) ────────────< (N) event_subcategories
event_categories (1) ────────────< (N) events
```

---

## Data Flow Diagrams

### 1. User Registration Flow

```
User Browser
    │
    │ POST /api/auth/register
    │ { first_name, last_name, admission_number, email, password }
    ▼
Backend Server
    │
    ├─→ Validate input (Zod schema)
    ├─→ Check if email/admission exists
    ├─→ Hash password (bcrypt)
    ├─→ Insert into student_registrations
    ├─→ Generate JWT token
    └─→ Return { success, token, user }
    │
    ▼
User Browser
    │
    ├─→ Store token in localStorage
    ├─→ Update auth context
    └─→ Redirect to dashboard
```

### 2. Event Registration Flow

```
User Browser
    │
    │ POST /api/events/:id/register
    │ Headers: Authorization: Bearer <token>
    ▼
Backend Server
    │
    ├─→ Verify JWT token
    ├─→ Extract user_id from token
    ├─→ Check event exists and is open
    ├─→ Check if user already registered
    ├─→ Check event capacity
    ├─→ Insert into event_registrations
    ├─→ Emit Socket.io event: 'registration:success'
    ├─→ Emit Socket.io event: 'event:new-registration' (to admins)
    └─→ Return { success }
    │
    ▼
Supabase Database
    │
    └─→ Store registration record
```

### 3. Event Creation Flow (Admin)

```
Admin Browser
    │
    │ POST /api/events
    │ Headers: Authorization: Bearer <admin_token>
    │ Body: { title, description, date, time, location, category, image }
    ▼
Backend Server
    │
    ├─→ Verify JWT token (admin role)
    ├─→ Validate input
    ├─→ Upload image (if provided) → Multer
    ├─→ Insert into events table
    ├─→ Emit Socket.io event: 'event:created'
    └─→ Return { success, event }
    │
    ▼
Supabase Database
    │
    └─→ Store event record
```

### 4. Real-time Notification Flow

```
Event Registration Occurs
    │
    ▼
Backend Server
    │
    ├─→ Process registration
    ├─→ Socket.io emit: 'registration:success'
    │   └─→ To room: `user:${student_id}`
    ├─→ Socket.io emit: 'event:new-registration'
    │   └─→ To room: 'admins'
    └─→ Socket.io emit: 'event:registration-count-update'
        └─→ To all connected clients
    │
    ▼
Connected Clients
    │
    ├─→ Student browser: Receives success notification
    ├─→ Admin browsers: Receive new registration alert
    └─→ All browsers: Update registration counts
```

### 5. Event Approval Flow

```
Admin Browser
    │
    │ PUT /api/events/:id/approve
    │ Headers: Authorization: Bearer <admin_token>
    ▼
Backend Server
    │
    ├─→ Verify JWT token (admin role)
    ├─→ Update event status: 'pending' → 'upcoming'
    ├─→ Emit Socket.io: 'event:approved' (to all)
    ├─→ Emit Socket.io: 'event:your-event-approved' (to creator)
    └─→ Return { success }
    │
    ▼
Supabase Database
    │
    └─→ Update event status
```

---

## Authentication Flow

### JWT-Based Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN PROCESS                             │
└─────────────────────────────────────────────────────────────┘

1. User submits credentials
   POST /api/auth/login
   { admission_number/email, password }

2. Backend validates credentials
   - Find user in database
   - Compare password hash (bcrypt)
   - Generate JWT token (signed with JWT_SECRET)
   - Token payload: { id, email, role, admission_number }
   - Token expires in 8 hours

3. Backend returns token
   { token, user: { id, email, role, ... } }

4. Client stores token
   - localStorage.setItem('token', token)

5. Client includes token in requests
   Authorization: Bearer <token>

6. Backend verifies token
   - Decode JWT
   - Check signature
   - Check expiration
   - Extract user info
```

### Protected Route Middleware

```javascript
// Backend middleware
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

### Role-Based Access Control

```
Roles:
- user: Regular student
- admin: System administrator
- club_leader: Club event manager

Route Protection:
/api/events/*              - Public (read), Protected (write)
/api/admin/*               - Admin only
/api/club-leader/*         - Club leader only
/api/students/me/*         - Student only (own data)
```

---

## Real-time Communication

### Socket.io Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  SOCKET.IO SERVER                            │
└─────────────────────────────────────────────────────────────┘

Connection: ws://localhost:3001

Rooms:
- user:{userId}           - Personal notifications
- admins                  - All admins
- club:{clubName}        - Club-specific notifications
```

### Socket Events

#### Client → Server

```javascript
socket.emit('join', userId)              // Join user room
socket.emit('join-admin')               // Join admin room
socket.emit('join-club-leader', club)   // Join club room
```

#### Server → Client

```javascript
// Registration events
io.to(`user:${userId}`).emit('registration:success', data)
io.to('admins').emit('event:new-registration', data)
io.emit('event:registration-count-update', data)

// Event approval events
io.emit('event:approved', event)
io.to(`user:${creatorId}`).emit('event:your-event-approved', event)
io.to(`user:${creatorId}`).emit('event:rejected', event)

```

### Socket Context (Frontend)

```typescript
// SocketContext.tsx provides:
const socket = useContext(SocketContext);

// Automatically:
- Connects on mount
- Joins user room on authentication
- Reconnects on disconnect
- Cleans up on unmount
```

---

## API Structure

### REST API Endpoints

#### Authentication
```
POST   /api/auth/register              - Student registration
POST   /api/auth/login                 - Student login
POST   /api/auth/admin/login           - Admin login
GET    /api/auth/me                    - Get current user
```

#### Events
```
GET    /api/events                     - List all events
GET    /api/events/today               - Today's events
GET    /api/events/week                - This week's events
GET    /api/events/month               - This month's events
GET    /api/events/:id                 - Get single event
POST   /api/events                     - Create event (admin/leader)
PUT    /api/events/:id                 - Update event (admin/leader)
DELETE /api/events/:id                 - Delete event (admin)
PUT    /api/events/:id/approve         - Approve event (admin)
PUT    /api/events/:id/reject          - Reject event (admin)
```

#### Event Registration
```
POST   /api/events/:id/register         - Register for event
DELETE /api/events/:eventId/register/:studentId - Cancel registration
GET    /api/students/:studentId/registrations - Get user registrations
GET    /api/events/:id/registrations   - Get event registrations
```

#### Admin
```
GET    /api/admin/dashboard/stats      - Dashboard statistics
GET    /api/admin/activity             - Activity data
GET    /api/admin/recent-registrations - Recent registrations
GET    /api/admin/active-sessions      - Active sessions
PUT    /api/admin/account              - Update admin account
GET    /api/admin/students             - List all students
PUT    /api/admin/students/:id         - Update student
DELETE /api/admin/students/:id         - Delete student
```

#### Club Leader
```
GET    /api/club-leader/dashboard      - Club dashboard
GET    /api/club-leader/events         - Club events
GET    /api/club-leader/members        - Club members
```

#### Student Profile
```
GET    /api/students/me                - Get profile
PUT    /api/students/me                - Update profile
```

#### Engagement
```
POST   /api/events/:id/reactions       - Add reaction
DELETE /api/events/:id/reactions       - Remove reaction
POST   /api/events/:id/comments        - Add comment
POST   /api/events/:id/waitlist       - Join waitlist
```

#### System
```
GET    /api/health                     - Health check
GET    /api/settings                   - System settings
PUT    /api/settings                   - Update settings (admin)
```

### Request/Response Format

**Request:**
```json
{
  "data": { /* payload */ },
  "headers": {
    "Authorization": "Bearer <jwt_token>",
    "Content-Type": "application/json"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "error_code"
}
```

---

## Security Architecture

### Multi-Layer Security

#### Layer 1: Network Security
- HTTPS/TLS encryption
- CORS configuration
- Security headers (Helmet.js)

#### Layer 2: Authentication
- JWT tokens with expiration
- Strong password requirements (8+ chars, uppercase, lowercase, number, special)
- bcrypt password hashing (salt rounds: 10)

#### Layer 3: Authorization
- Role-based access control (RBAC)
- Protected route middleware
- Resource ownership checks

#### Layer 4: Input Validation
- Zod schema validation (frontend)
- Input sanitization (backend)
- SQL injection prevention (parameterized queries)
- XSS protection

#### Layer 5: Rate Limiting
- Global: 2000 requests/15min
- Auth: 10 login attempts/15min
- Upload: 10 uploads/minute
- Admin write: 120 writes/minute
- Event action: 20 actions/minute

#### Layer 6: Brute Force Protection
- IP-based lockout (15 min after 5 failures)
- Account-based lockout (15 min after 5 failures)
- Failed attempt tracking

#### Layer 7: Audit Logging
- Security audit log table
- Tracks: logins, failed attempts, data changes
- Includes: IP, user agent, timestamp, details

#### Layer 8: File Upload Security
- File type validation (MIME + extension)
- File size limits (5MB)
- Filename sanitization
- Unique filename generation

### Security Headers (Helmet.js)

```
- X-Content-Type-Options: nosniff
- X-Frame-Options: deny
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: default-src 'self'
- Referrer-Policy: strict-origin-when-cross-origin
```

---

## Deployment Architecture

### Docker Containerization

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINER                         │
└─────────────────────────────────────────────────────────────┘

Multi-stage build:
1. Frontend Builder (Node.js Alpine)
   - Install dependencies
   - Build React app (Vite)
   - Output: /app/dist

2. Backend Builder (Node.js Alpine)
   - Install dependencies
   - Copy backend code
   - Output: /app/backend

3. Production Image (Node.js Alpine)
   - Copy frontend build
   - Copy backend code
   - Non-root user (nodejs:1001)
   - Health check endpoint
   - Port: 3001
```

### Deployment Options

#### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d --build
```
- Single command deployment
- Environment variable configuration
- Volume mounts for uploads
- Automatic restart

#### Option 2: VPS with PM2
```bash
npm run build
pm2 start backend/server.js
nginx reverse proxy
```

#### Option 3: Cloud Platforms
- Railway, Render, Heroku
- Environment variable configuration
- Automatic SSL

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN NAME                              │
│                  events.zetech.ac.ke                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                      │
│  - SSL/TLS termination (Let's Encrypt)                       │
│  - Static file serving                                      │
│  - WebSocket proxy                                          │
│  - Load balancing (future)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVER                        │
│  - Docker container                                         │
│  - Express.js backend                                       │
│  - Socket.io server                                         │
│  - Port: 3001                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                            │
│  - PostgreSQL database                                      │
│  - REST API                                                 │
│  - Real-time subscriptions                                  │
│  - Automatic backups                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Caching Strategy

1. **Frontend Caching (TanStack Query)**
   - Stale time: 60 seconds
   - Cache time: 5 minutes
   - Automatic refetch on focus

2. **Backend Caching (NodeCache)**
   - Event data: 60 seconds TTL
   - Auth tokens: 30 seconds TTL
   - Reduces DB queries by ~99%

3. **HTTP Caching**
   - Static assets: Cache-Control headers
   - API responses: ETag support

### Database Optimization

1. **Indexes**
   - All foreign keys
   - Frequently queried fields
   - Composite indexes for common queries

2. **Query Optimization**
   - Parameterized queries
   - Connection pooling
   - Batch operations

### Compression

- Gzip compression middleware
- Reduces payload size by ~70%
- Applied to all API responses

---

## Monitoring and Logging

### Application Logging

- Console logs for development
- Error tracking in production
- Security audit log in database

### Health Check

```bash
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Docker Health Check

- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
- Start period: 40 seconds

---

## Summary

The Zetech Event System is built with a modern, scalable architecture that separates concerns across three main layers:

1. **Frontend**: React-based SPA with real-time capabilities
2. **Backend**: Express.js API with WebSocket support
3. **Database**: Supabase PostgreSQL accessed via REST API/RPC

Key architectural decisions:
- **Stateless authentication** using JWT tokens
- **Real-time updates** via Socket.io
- **Database access** via Supabase RPC for deployment flexibility
- **Multi-layer security** with rate limiting, input validation, and audit logging
- **Docker containerization** for easy deployment
- **Caching strategy** for performance optimization

This architecture ensures the application is secure, scalable, maintainable, and can be deployed on any platform that supports Docker.
