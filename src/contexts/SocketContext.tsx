import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface Notification {
  id: string;
  type: "registration:success" | "event:your-event-approved" | "event:your-event-rejected" | "event:new-registration" | "event:posted";
  title: string;
  message: string;
  eventId?: number;
  timestamp: string;
  read: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  joinUser: (userId: number) => void;
  joinAdmin: () => void;
  joinClub: (club: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

const MAX_NOTIFICATIONS = 20;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "read">) => {
    setNotifications((prev) => {
      const newNotif: Notification = {
        ...notif,
        id: `${Date.now()}-${Math.random()}`,
        read: false,
      };
      return [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  useEffect(() => {
    const socketInstance = io({
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socketInstance.on("registration:success", (data: { eventId: number; eventTitle: string }) => {
      addNotification({
        type: "registration:success",
        title: "Registration Confirmed",
        message: `You're registered for "${data.eventTitle}"`,
        eventId: data.eventId,
        timestamp: new Date().toISOString(),
      });
    });

    socketInstance.on("event:your-event-approved", (data: { eventId: number; eventTitle: string }) => {
      addNotification({
        type: "event:your-event-approved",
        title: "Event Approved",
        message: `Your event "${data.eventTitle}" was approved and is now live`,
        eventId: data.eventId,
        timestamp: new Date().toISOString(),
      });
    });

    socketInstance.on("event:your-event-rejected", (data: { eventId: number; eventTitle: string }) => {
      addNotification({
        type: "event:your-event-rejected",
        title: "Event Rejected",
        message: `Your event "${data.eventTitle}" was not approved`,
        eventId: data.eventId,
        timestamp: new Date().toISOString(),
      });
    });

    socketInstance.on("event:new-registration", (data: { eventId: number; eventTitle: string; studentName?: string }) => {
      addNotification({
        type: "event:new-registration",
        title: "New Registration",
        message: data.studentName
          ? `${data.studentName} registered for "${data.eventTitle}"`
          : `New registration for "${data.eventTitle}"`,
        eventId: data.eventId,
        timestamp: new Date().toISOString(),
      });
    });

    socketInstance.on("event:approved", (data: { eventId: number; eventTitle: string }) => {
      addNotification({
        type: "event:posted",
        title: "New Event Posted",
        message: `"${data.eventTitle}" is now available`,
        eventId: data.eventId,
        timestamp: new Date().toISOString(),
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [addNotification]);

  const joinUser = (userId: number) => {
    if (socket) socket.emit("join", userId);
  };

  const joinAdmin = () => {
    if (socket) socket.emit("join-admin");
  };

  const joinClub = (club: string) => {
    if (socket) socket.emit("join-club-leader", club);
  };

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, notifications, unreadCount, markAllRead, clearNotification, joinUser, joinAdmin, joinClub }}
    >
      {children}
    </SocketContext.Provider>
  );
};
