# Socket.io Real-Time Implementation

## Overview
The application now has real-time functionality using Socket.io. This enables live updates for event registrations, approvals, rejections, and other important actions without requiring page refreshes.

## Backend Setup

### Dependencies
- `socket.io` - Server-side Socket.io library
- Replaced `ws` with `socket.io` in backend/package.json

### Server Configuration
The backend server (`backend/server.js`) now:
1. Creates an HTTP server with Socket.io
2. Sets up CORS for the frontend
3. Implements room-based messaging for targeted notifications

### Available Rooms
- `user:{userId}` - Personal notifications for a specific user
- `admins` - Broadcast to all admin users
- `club:{clubName}` - Broadcast to members of a specific club

### Socket Events Emitted

#### Event Registration
- `registration:success` - Sent to the user who registered
- `event:new-registration` - Sent to all admins
- `event:new-registration` - Sent to the club leader of the event
- `event:registration-count-update` - Sent to all connected clients

#### Event Approval
- `event:approved` - Sent to all connected clients
- `event:your-event-approved` - Sent to the event creator
- `event:approved` - Sent to the club of the event

#### Event Rejection
- `event:your-event-rejected` - Sent to the event creator
- `event:rejected` - Sent to the club of the event

## Frontend Setup

### Dependencies
- `socket.io-client` - Client-side Socket.io library

### Context Provider
`src/contexts/SocketContext.tsx` provides:
- `socket` - The Socket.io client instance
- `isConnected` - Connection status
- `joinUser(userId)` - Join user-specific room
- `joinAdmin()` - Join admin room
- `joinClub(club)` - Join club-specific room

### Custom Hook
`src/hooks/useSocketNotifications.ts` provides:
- Automatic room joining based on user role
- Toast notifications for real-time events
- Easy integration into any component

### Environment Variables
Create `.env` file in the root:
```
VITE_API_URL=http://localhost:3001
```

## Usage

### In Components
Simply import and use the hook:

```tsx
import { useSocketNotifications } from "@/hooks/useSocketNotifications";

function MyComponent() {
  const { user } = useAuth();
  
  // Enable real-time notifications
  useSocketNotifications(user?.id, user?.role, user?.club);
  
  return <div>...</div>;
}
```

### Already Integrated
- **AdminDashboard** - Receives notifications for new registrations
- **ClubLeaderDashboard** - Receives notifications for event approvals/rejections

## Adding New Socket Events

### Backend
1. Emit the event using helper functions:
```javascript
emitToUser(userId, "event:name", data);
emitToAdmins("event:name", data);
emitToClub(club, "event:name", data);
emitToAll("event:name", data);
```

### Frontend
1. Add event listener in `useSocketNotifications.ts`:
```javascript
const handleNewEvent = (data: any) => {
  toast({ title: "New Event", description: data.message });
};

socket.on("event:name", handleNewEvent);

// Cleanup
return () => {
  socket.off("event:name", handleNewEvent);
};
```

## Benefits
- Real-time updates without page refresh
- Targeted notifications based on user roles
- Improved user experience
- Reduced server load (no polling needed)
- Automatic reconnection handling

## Testing
1. Start the backend server: `cd backend && npm start`
2. Start the frontend: `npm run dev`
3. Open the application in multiple browser windows/tabs
4. Perform actions (register for events, approve/reject events)
5. Observe real-time notifications in other windows
