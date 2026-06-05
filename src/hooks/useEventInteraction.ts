import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { api } from "@/lib/api";

interface InteractionData {
  eventId: string | number;
  eventType: "view" | "click" | "register";
  timeSpent?: number;
}

export const useEventInteraction = () => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const currentEventIdRef = useRef<string | number | null>(null);

  // Track when user starts viewing an event
  const trackViewStart = (eventId: string | number) => {
    if (!user || user.role !== "user") return;
    
    currentEventIdRef.current = eventId;
    startTimeRef.current = Date.now();
    setIsTracking(true);
  };

  // Track when user stops viewing an event
  const trackViewEnd = async () => {
    if (!user || user.role !== "user" || !startTimeRef.current || !currentEventIdRef.current) {
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000); // Convert to seconds
    
    // Only track if user spent at least 3 seconds viewing
    if (timeSpent >= 3) {
      try {
        await api.events.trackInteraction({
          user_id: user.id,
          event_id: currentEventIdRef.current,
          interaction_type: "view",
          time_spent: timeSpent,
        });
      } catch (error) {
        console.error("Failed to track interaction:", error);
      }
    }

    // Reset tracking state
    startTimeRef.current = null;
    currentEventIdRef.current = null;
    setIsTracking(false);
  };

  // Track click on event card
  const trackClick = async (eventId: string | number) => {
    if (!user || user.role !== "user") return;

    try {
      await api.events.trackInteraction({
        user_id: user.id,
        event_id: eventId,
        interaction_type: "click",
        time_spent: 0,
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  // Track registration
  const trackRegistration = async (eventId: string | number) => {
    if (!user || user.role !== "user") return;

    try {
      await api.events.trackInteraction({
        user_id: user.id,
        event_id: eventId,
        interaction_type: "register",
        time_spent: 0,
      });
    } catch (error) {
      console.error("Failed to track registration:", error);
    }
  };

  // Auto-track view end when component unmounts
  useEffect(() => {
    return () => {
      if (isTracking) {
        trackViewEnd();
      }
    };
  }, [isTracking]);

  return {
    trackViewStart,
    trackViewEnd,
    trackClick,
    trackRegistration,
    isTracking,
  };
};
