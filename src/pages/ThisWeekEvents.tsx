import EventsFilteredPage from "@/components/EventsFilteredPage";
import { TrendingUp } from "lucide-react";
import { type Event } from "@/data/events";

function getWeekRange() {
  const now   = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
  const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
  return { start, end };
}

function isThisWeekEvent(e: Event) {
  if (!e.date) return false;
  const d = new Date(e.date);
  const { start, end } = getWeekRange();
  return d >= start && d <= end;
}

const { start, end } = getWeekRange();
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const weekLabel = `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;

const ThisWeekEvents = () => (
  <EventsFilteredPage
    title="This Week's Events"
    subtitle={`Events from ${weekLabel}`}
    icon={TrendingUp}
    iconBg="bg-blue-400/20"
    iconColor="text-blue-300"
    filterFn={(events: Event[]) => events.filter(isThisWeekEvent)}
    emptyMessage="No events this week"
    emptySubtext="Nothing scheduled for this week. Browse all upcoming events or check next month."
    periodLabel="This Week's"
  />
);

export default ThisWeekEvents;
