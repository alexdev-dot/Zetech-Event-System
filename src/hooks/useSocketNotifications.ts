import { useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { toast } from "./use-toast";

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

  useEffect(() => {
    if (!socket) return;

    // Event registration success
    const handleRegistrationSuccess = (data: any) => {
      toast({
        title: "Registration Successful!",
        description: `You have successfully registered for ${data.eventTitle}`,
      });
    };

    // Event approved (for club leaders)
    const handleEventApproved = (data: any) => {
      toast({
        title: "Event Approved",
        description: `Your event "${data.eventTitle}" has been approved and is now visible to students.`,
      });
    };

    // Event rejected (for club leaders)
    const handleEventRejected = (data: any) => {
      toast({
        title: "Event Rejected",
        description: `Your event "${data.eventTitle}" was not approved by the admin.`,
        variant: "destructive",
      });
    };

    // New event registration (for admins)
    const handleNewRegistration = (data: any) => {
      toast({
        title: "New Event Registration",
        description: `A student registered for ${data.eventTitle}`,
      });
    };

    // Event count update (for all)
    const handleCountUpdate = (data: any) => {
      // This can be used to update UI counters without full page reload
      console.log("Event count updated:", data);
    };

    socket.on("registration:success", handleRegistrationSuccess);
    socket.on("event:your-event-approved", handleEventApproved);
    socket.on("event:your-event-rejected", handleEventRejected);
    socket.on("event:new-registration", handleNewRegistration);
    socket.on("event:registration-count-update", handleCountUpdate);

    return () => {
      socket.off("registration:success", handleRegistrationSuccess);
      socket.off("event:your-event-approved", handleEventApproved);
      socket.off("event:your-event-rejected", handleEventRejected);
      socket.off("event:new-registration", handleNewRegistration);
      socket.off("event:registration-count-update", handleCountUpdate);
    };
  }, [socket]);

  return { isConnected };
};
