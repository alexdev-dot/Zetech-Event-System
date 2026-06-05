import { useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";

export const useSocketNotifications = (userId?: number | string, role?: string, club?: string) => {
  const { socket, isConnected, joinUser, joinAdmin, joinClub } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Join appropriate rooms based on user role
    if (userId) {
      joinUser(Number(userId));
    }

    if (role === "admin") {
      joinAdmin();
    }

    if (role === "club_leader" && club) {
      joinClub(club);
    }
  }, [isConnected, userId, role, club, joinUser, joinAdmin, joinClub]);

  return { isConnected };
};
