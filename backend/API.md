# Zetech Events Hub - API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Public Endpoints

### Health Check
**GET** `/api/health`

Check API and database connectivity.

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

### Categories
**GET** `/api/categories`

Get all event categories with subcategories.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tech & Academic",
    "display_order": 0,
    "subcategories": [
      {
        "id": 1,
        "category_id": 1,
        "name": "IT Club (iTech)",
        "display_order": 0
      }
    ]
  }
]
```

---

### Events
**GET** `/api/events`

Get all upcoming events.

**Query Parameters:**
- None

**Response:**
```json
[
  {
    "id": 1,
    "title": "Event Title",
    "description": "Event description",
    "date": "2024-01-15",
    "time": "14:00:00",
    "location": "Main Hall",
    "category": "Tech & Academic",
    "max_participants": 100,
    "image_url": "https://...",
    "status": "upcoming",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### Recent Events
**GET** `/api/events/recent`

Get recent events (limited).

**Query Parameters:**
- `limit` (optional, default: 12, max: 24)

**Response:** Same as `/api/events`

---

### Event Details
**GET** `/api/events/:id`

Get details of a specific event.

**Path Parameters:**
- `id` (required) - Event ID

**Response:** Same as `/api/events` (single object)

---

## Authentication Endpoints

### Student Registration
**POST** `/api/auth/register`

Register a new student account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "admissionNumber": "BIT-01-0001/2024",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "admissionNumber": "BIT-01-0001/2024",
    "role": "user"
  }
}
```

---

### Student Login
**POST** `/api/auth/login`

Login as a student.

**Request Body:**
```json
{
  "admissionNumber": "BIT-01-0001/2024",
  "password": "password123"
}
```

**Response:** Same as registration

---

### Admin/Club Leader Login
**POST** `/api/auth/admin/login`

Login as admin or club leader.

**Request Body:**
```json
{
  "email": "admin@zetech.ac.ke",
  "password": "password123"
}
```

**Response:** Same as student login

---

### Get Current User
**GET** `/api/auth/me`

Get current authenticated user details.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "admissionNumber": "BIT-01-0001/2024",
  "role": "user"
}
```

---

## Event Management (Admin/Club Leader)

### Upload Image
**POST** `/api/upload`

Upload an event image.

**Headers:**
- `Authorization: Bearer <token>`

**Request:** `multipart/form-data` with file field

**Response:**
```json
{
  "imageUrl": "http://localhost:3001/uploads/image.jpg"
}
```

---

### Create Event
**POST** `/api/events`

Create a new event.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "date": "2024-01-15",
  "time": "14:00",
  "location": "Main Hall",
  "category": "Tech & Academic",
  "max_participants": 100,
  "image_url": "https://...",
  "end_date": "2024-01-15"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Event Title",
  "status": "pending" // or "upcoming" for admin
}
```

**Note:** Admin events are auto-approved, club leader events require approval.

---

### Update Event
**PUT** `/api/events/:id`

Update an existing event.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Event ID

**Request Body:** Same as create event

**Response:** Updated event object

---

### Delete Event
**DELETE** `/api/events/:id`

Delete an event.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Event ID

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

---

## Admin Event Approval

### Get Pending Events
**GET** `/api/admin/events/pending`

Get all pending events awaiting approval.

**Headers:**
- `Authorization: Bearer <token>`

**Response:** Array of pending events

---

### Approve Event
**PATCH** `/api/admin/events/:id/approve`

Approve a pending event.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Event ID

**Response:**
```json
{
  "message": "Event approved successfully"
}
```

---

### Reject Event
**PATCH** `/api/admin/events/:id/reject`

Reject a pending event.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Event ID

**Request Body:**
```json
{
  "reason": "Event does not meet guidelines"
}
```

**Response:**
```json
{
  "message": "Event rejected successfully"
}
```

---

### Get All Events (Admin)
**GET** `/api/admin/events`

Get all events including pending (admin view).

**Headers:**
- `Authorization: Bearer <token>`

**Response:** Array of all events

---

## Event Registration

### Register for Event
**POST** `/api/events/:id/register`

Register current student for an event.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Event ID

**Response:**
```json
{
  "message": "Registration successful"
}
```

---

### Cancel Registration
**DELETE** `/api/events/:eventId/register/:studentId`

Cancel event registration.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `eventId` (required) - Event ID
- `studentId` (required) - Student ID

**Response:**
```json
{
  "message": "Registration cancelled successfully"
}
```

---

### Get Student Registrations
**GET** `/api/students/:studentId/registrations`

Get all registrations for a student.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `studentId` (required) - Student ID

**Response:**
```json
[
  {
    "id": 1,
    "event_id": 1,
    "student_id": 1,
    "registration_date": "2024-01-01T00:00:00Z",
    "status": "registered"
  }
]
```

---

## Admin Dashboard

### Dashboard Stats
**GET** `/api/admin/dashboard/stats`

Get dashboard statistics.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "totalEvents": 100,
  "pendingEvents": 5,
  "upcomingEvents": 20,
  "totalStudents": 500,
  "totalRegistrations": 250
}
```

---

### Get Event Registrations
**GET** `/api/admin/events/:eventId/registrations`

Get all registrations for a specific event.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `eventId` (required) - Event ID

**Response:** Array of registrations with student details

---

### Get All Students
**GET** `/api/admin/students`

Get all students with pagination.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50, max: 200)

**Response:**
```json
{
  "students": [...],
  "total": 500,
  "page": 1,
  "limit": 50
}
```

---

### Delete Student
**DELETE** `/api/admin/students/:studentId`

Delete a student account.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `studentId` (required) - Student ID

**Response:**
```json
{
  "message": "Student deleted successfully"
}
```

---

### Get Student Activity
**GET** `/api/admin/students/:studentId/activity`

Get activity log for a student.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `studentId` (required) - Student ID

**Response:**
```json
[
  {
    "id": 1,
    "event_type": "registration",
    "details": "Registered for Event X",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### Analytics
**GET** `/api/admin/analytics`

Get analytics data.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "eventsByCategory": [...],
  "registrationsOverTime": [...],
  "popularEvents": [...]
}
```

---

## Category Management (Admin)

### Get All Categories (Admin)
**GET** `/api/admin/categories`

Get all categories with subcategories.

**Headers:**
- `Authorization: Bearer <token>`

**Response:** Same as public categories endpoint

---

### Create Category
**POST** `/api/admin/categories`

Create a new category.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Category"
}
```

**Response:** Created category object

---

### Update Category
**PUT** `/api/admin/categories/:id`

Rename a category.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Category ID

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Response:** Updated category object

---

### Delete Category
**DELETE** `/api/admin/categories/:id`

Delete a category (subcategories cascade).

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Category ID

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

---

### Add Subcategory
**POST** `/api/admin/categories/:id/subcategories`

Add a subcategory to a category.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Category ID

**Request Body:**
```json
{
  "name": "Subcategory Name"
}
```

**Response:** Created subcategory object

---

### Update Subcategory
**PUT** `/api/admin/subcategories/:id`

Rename a subcategory.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Subcategory ID

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Response:** Updated subcategory object

---

### Delete Subcategory
**DELETE** `/api/admin/subcategories/:id`

Delete a subcategory.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `id` (required) - Subcategory ID

**Response:**
```json
{
  "message": "Subcategory deleted successfully"
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Rate Limiting

- Auth endpoints: 5 requests per 15 minutes per IP
- Admin write operations: 10 requests per minute per user
- Event actions: 10 requests per minute per user
- Upload: 5 requests per minute per user

---

## WebSocket Events

The API also supports WebSocket connections for real-time notifications:

### Connection
```
ws://localhost:3001
```

### Events
- `event:approved` - Event approved by admin
- `registration:success` - Successful event registration
- `event:your-event-approved` - Your event was approved
- `event:your-event-rejected` - Your event was rejected
- `event:new-registration` - New registration for your event
