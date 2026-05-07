import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import { events, type Event } from "@/data/events";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [allEvents, setAllEvents] = useState<Event[]>(events);
  
  useEffect(() => {
    // Load events from localStorage or use static events
    const storedApprovedEvents = localStorage.getItem('approvedEvents');
    let approvedEvents;
    
    if (storedApprovedEvents) {
      const parsed = JSON.parse(storedApprovedEvents);
      approvedEvents = parsed.length > 0 ? parsed : events;
    } else {
      localStorage.setItem('approvedEvents', JSON.stringify(events));
      approvedEvents = events;
    }
    
    setAllEvents(approvedEvents);
  }, []);
  
  const featuredEvent = allEvents.find((e) => e.featured);
  const upcomingEvents = allEvents.filter((e) => !e.featured).slice(0, 4);
  

  return (
    <Layout>
      <HeroSection />

      {/* Featured Event */}
      {featuredEvent ? (
        <section className="container py-12">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Featured Event</h2>
          <Link
            to={`/events/${featuredEvent.id}`}
            className="block bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 md:flex"
          >
            <div className="md:w-1/3 h-48 md:h-auto hero-gradient flex items-center justify-center">
              <div className="text-center text-primary-foreground p-4 sm:p-6">
                <div className="text-xs sm:text-sm font-semibold tracking-widest opacity-80">
                  {new Date(featuredEvent.date).toLocaleString("default", { month: "short" }).toUpperCase()}
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold">{new Date(featuredEvent.date).getDate()}</div>
                <div className="text-xs sm:text-sm mt-1 sm:mt-2 opacity-70">{featuredEvent.time}</div>
              </div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 flex-1">
              <span className="inline-block bg-secondary text-secondary-foreground text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full mb-2 sm:mb-3">
                {featuredEvent.category}
              </span>
              <h3 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">{featuredEvent.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{featuredEvent.description}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <span>📍 {featuredEvent.venue}</span>
                <span>👥 {featuredEvent.registrations}/{featuredEvent.capacity}</span>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section className="container py-12">
          <div className="text-center py-16">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">No Featured Events</h2>
            <p className="text-muted-foreground mb-6">There are currently no featured events. Check back soon for exciting campus activities!</p>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="container pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Upcoming Events</h2>
          <Button asChild variant="ghost" className="text-primary">
            <Link to="/events">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">No upcoming events</p>
            <p className="text-sm text-muted-foreground">Events will appear here once they are scheduled. Stay tuned!</p>
          </div>
        )}
      </section>

    </Layout>
  );
};

export default Index;
