import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import { type Event } from "@/data/events";
import { api } from "@/lib/api";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type BackendEvent = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  image_url?: string | null;
  status?: string | null;
  registered_count?: number | null;
  max_participants?: number | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  creator_club?: string | null;
  category?: string | null;
};

function transformEvent(event: BackendEvent): Event {
  return {
    id: String(event.id),
    title: event.title ?? "",
    description: event.description ?? "",
    date: event.date ?? "",
    time: event.time ?? "",
    venue: event.location ?? "",
    campus: event.creator_club ?? "Zetech University",
    posterUrl: event.image_url ?? "",
    status: "approved",
    registrations: event.registered_count ?? 0,
    capacity: event.max_participants ?? 0,
    organizer: event.created_by_name ?? event.created_by_email ?? "Zetech University",
    category: event.category ?? "",
    featured: false,
  };
}

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredCategories, setRegisteredCategories] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    api.events
      .getRecent(20)
      .then((data: BackendEvent[]) => setEvents(data.map(transformEvent)))
      .catch(() =>
        api.events
          .getAll()
          .then((data: BackendEvent[]) => setEvents(data.slice(0, 20).map(transformEvent)))
          .catch(() => setEvents([]))
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== "user") return;
    api.students
      .getRegistrations(String(user.id))
      .then((regs: any[]) => {
        const cats = [...new Set(regs.map((r: any) => r.category).filter(Boolean))] as string[];
        setRegisteredCategories(cats);
      })
      .catch(() => {});
  }, [user]);

  const forYouEvents = registeredCategories.length > 0
    ? events.filter(
        e =>
          registeredCategories.includes(e.category) &&
          new Date(e.date) >= new Date()
      ).slice(0, 8)
    : [];

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .slice(0, 12);

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

      {/* For You Section — only shown to logged-in students with history */}
      {user && user.role === "user" && forYouEvents.length > 0 && (
        <section className="container pb-10 pt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  For You
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Picked based on events you've attended
              </p>
            </div>
            <Button asChild variant="ghost" className="text-primary">
              <Link to="/events">
                See all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {forYouEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="container pb-16 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              The latest approved events on campus
            </p>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link to="/events">
              Browse All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {upcomingEvents.map(event => (
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
