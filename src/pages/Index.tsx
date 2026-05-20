import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import { type Event } from "@/data/events";
import { api } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function transformEvent(event: any): Event {
  return {
    id: event.id.toString(),
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    venue: event.location,
    campus: event.creator_club || "Zetech University",
    posterUrl: event.image_url || "",
    status: "approved" as const,
    registrations: event.registered_count || 0,
    capacity: event.max_participants || 0,
    organizer: event.created_by_name || event.created_by_email || "Zetech University",
    category: event.category,
    featured: false,
  };
}

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events.getRecent(12)
      .then((data: any[]) => setEvents(data.map(transformEvent)))
      .catch(() => {
        // Fallback: load from public events list
        return api.events.getAll()
          .then((data: any[]) => setEvents(data.slice(0, 12).map(transformEvent)))
          .catch(() => setEvents([]));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading events...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <HeroSection />

      <section className="container pb-16 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Upcoming Events</h2>
            <p className="text-muted-foreground text-sm mt-1">The latest approved events on campus</p>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link to="/events">
              Browse All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-2">No upcoming events right now</p>
            <p className="text-sm text-muted-foreground">Check back soon — events are on their way!</p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Index;
