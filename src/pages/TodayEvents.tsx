import EventsFilteredPage from "@/components/EventsFilteredPage";
import { Sun } from "lucide-react";
import { type Event } from "@/data/events";

function isTodayEvent(e: Event) {
  if (!e.date) return false;
  const d   = new Date(e.date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

const TodayEvents = () => (
  <EventsFilteredPage
    title="Today's Events"
    subtitle={`Events happening on ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
    icon={Sun}
    iconBg="bg-yellow-400/20"
    iconColor="text-yellow-300"
    filterFn={(events: Event[]) => events.filter(isTodayEvent)}
    emptyMessage="No events today"
    emptySubtext="Nothing is scheduled for today. Check This Week or browse all upcoming events."
    periodLabel="Today's"
  />
);

export default TodayEvents;
