import { useState } from "react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { events, categories } from "@/data/events";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Events = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { user } = useAuth();
  const navigate = useNavigate();

  const filtered = events.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || e.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <Layout>
      <div className="hero-gradient py-20 relative min-h-[400px]">
        <div className="container">
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <img 
              src="https://www.zetech.ac.ke/images/students-gallery/1K1A1822.JPG" 
              alt="Zetech University Students" 
              className="w-full h-full object-cover object-center"
              loading="eager"
              style={{
                filter: 'brightness(0.9) contrast(1.1)',
                transform: 'scale(1.05)',
                transformOrigin: 'center'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent pointer-events-none"></div>
          </div>
          <div className="relative z-10">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">Discover Campus Events</h1>
            <p className="text-lg text-white/90">Explore exciting opportunities, connect with fellow students, and make lasting memories at Zetech University</p>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Header with Create Event Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">All Events</h2>
            <p className="text-muted-foreground">Discover and participate in campus events</p>
          </div>
          {user && (
            <Button onClick={() => navigate("/create-event")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No events found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Events;
