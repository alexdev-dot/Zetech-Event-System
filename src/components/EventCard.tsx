import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/data/events";

const categoryColors: Record<string, string> = {
  Technology: "bg-primary text-primary-foreground",
  Culture: "bg-secondary text-secondary-foreground",
  Career: "bg-primary text-primary-foreground",
  Sports: "bg-secondary text-secondary-foreground",
  Business: "bg-primary text-primary-foreground",
  Wellness: "bg-secondary text-secondary-foreground",
};

const EventCard = ({ event }: { event: Event }) => {
  const dateObj = new Date(event.date);
  const month = dateObj.toLocaleString("default", { month: "short" }).toUpperCase();
  const day = dateObj.getDate();

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block bg-card rounded-lg overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300"
    >
      {/* Date badge + poster */}
      <div className="relative h-44 hero-gradient flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          <div className="text-xs font-semibold tracking-widest opacity-80">{month}</div>
          <div className="text-4xl font-heading font-bold">{day}</div>
        </div>
        <Badge className={`absolute top-3 right-3 ${categoryColors[event.category] || "bg-muted text-muted-foreground"}`}>
          {event.category}
        </Badge>
      </div>

      <div className="p-5">
        <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {event.title}
        </h3>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            <span>{event.registrations}/{event.capacity} registered</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          {event.department}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
