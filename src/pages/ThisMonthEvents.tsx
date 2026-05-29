import EventsFilteredPage from "@/components/EventsFilteredPage";
import { CalendarDays } from "lucide-react";
import { type Event } from "@/data/events";

function isThisMonthEvent(e: Event) {
  if (!e.date) return false;
  const d   = new Date(e.date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const now = new Date();
const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

const ThisMonthEvents = () => (
  <EventsFilteredPage
    title="This Month's Events"
    subtitle={`All events in ${monthName}`}
    icon={CalendarDays}
    iconBg="bg-purple-400/20"
    iconColor="text-purple-300"
    filterFn={(events: Event[]) => events.filter(isThisMonthEvent)}
    emptyMessage={`No events in ${monthName}`}
    emptySubtext="Nothing scheduled this month yet. Browse all upcoming events or check the calendar."
    periodLabel="This Month's"
  />
);

export default ThisMonthEvents;
