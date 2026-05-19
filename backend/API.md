# Zetech Event System Backend API

## Base URL
`http://localhost:5000`

## Authentication Endpoints

### Student Registration
- **POST** `/api/auth/register`
- **Body**: `{ firstName, lastName, email, admissionNumber, password }`
- **Response**: `{ message, user: { id, email, adminNumber, name, role } }`

### Student Login
- **POST** `/api/auth/login`
- **Body**: `{ admissionNumber, password }`
- **Response**: `{ message, user: { id, email, adminNumber, name, role } }`

### Admin Login
- **POST** `/api/auth/admin/login`
- **Body**: `{ email, password }`
- **Response**: `{ message, user: { id, email, adminNumber, name, role } }`

## Event Management Endpoints

### Get All Events
- **GET** `/api/events`
- **Response**: Array of events with registration counts

### Get Single Event
- **GET** `/api/events/:id`
- **Response**: Single event with registration count

### Create Event
- **POST** `/api/events`
- **Body**: `{ title, description, date, time, location, category, maxParticipants?, imageUrl? }`
- **Response**: `{ message, eventId }`

### Update Event
- **PUT** `/api/events/:id`
- **Body**: `{ title, description, date, time, location, category, maxParticipants?, imageUrl?, status }`
- **Response**: `{ message }`

### Delete Event
- **DELETE** `/api/events/:id`
- **Response**: `{ message }`

## Event Registration Endpoints

### Register for Event
- **POST** `/api/events/:id/register`
- **Body**: `{ studentId }`
- **Response**: `{ message, registrationId }`

### Get Student Registrations
- **GET** `/api/students/:studentId/registrations`
- **Response**: Array of student's event registrations

### Cancel Event Registration
- **DELETE** `/api/events/:eventId/register/:studentId`
- **Response**: `{ message }`

## Admin Dashboard Endpoints

### Get Dashboard Stats
- **GET** `/api/admin/dashboard/stats`
- **Response**: `{ totalEvents, totalStudents, upcomingEvents, totalRegistrations, recentEvents }`

### Get Event Registrations
- **GET** `/api/admin/events/:eventId/registrations`
- **Response**: Array of student registrations for a specific event

### Update Admin Account
- **PUT** `/api/admin/account`
- **Body**: `{ currentPassword, newEmail?, newPassword?, confirmNewPassword? }`
- **Response**: `{ message, admin: { id, email } }`
- **Description**: Update admin email and/or password. Current password is always required for security.

### Get Activity Data
- **GET** `/api/admin/activity`
- **Response**: `{ newRegistrationsToday, activeStudents, activeSessions, recentEventRegistrations, pendingApprovals, lastUpdated }`
- **Description**: Get real-time activity statistics for the admin dashboard.

### Get Recent Registrations
- **GET** `/api/admin/recent-registrations?limit=10`
- **Response**: Array of recent student registrations with details
- **Description**: Get list of recent student registrations with optional limit parameter.

### Get Active Sessions
- **GET** `/api/admin/active-sessions`
- **Response**: Array of active user sessions with last activity timestamps
- **Description**: Get list of currently active user sessions based on recent activity.

## Health Check
- **GET** `/api/health`
- **Response**: `{ status, database }`

## Default Admin Credentials
- **Email**: `admin@zetech.ac.ke`
- **Password**: `admin123`

## Database Schema

### Tables
- `student_registrations`: Student user accounts
- `admins`: Admin user accounts
- `events`: Event information
- `event_registrations`: Student event registrations

## Security Features
- Password hashing with bcrypt
- Input validation
- SQL injection prevention with parameterized queries
- CORS enabled for frontend integration
