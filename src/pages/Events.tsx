import { useState, useEffect, useCallback } from "react";

import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { categories, allSubCategories, type Event } from "@/data/events";
import { api } from "@/lib/api";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  MapPin,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Backend event shape returned by the API
type BackendEvent = {
  id: number | string;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  image_url?: string | null;
  status?: string;
  registered_count?: number;
  max_participants?: number | null;
  created_by_email?: string | null;
  category?: string;
};

const Events = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { socket } = useSocket();

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventsData = await api.events.getAll();
      const transformedEvents: Event[] = (eventsData || []).map(
        (event: BackendEvent) => ({
          id: String(event.id),
          title: event.title || "",
          description: event.description || "",
          date: event.date || "",
          time: event.time || "",
          venue: event.location || "",
          campus: "Main Campus",
          posterUrl: event.image_url || "",
          status: ["upcoming", "ongoing", "completed"].includes(
            event.status || "",
          )
            ? "approved"
            : "pending",
          registrations: event.registered_count || 0,
          capacity: event.max_participants ?? 0,
          organizer: event.created_by_email || "Admin",
          category: event.category || "",
          featured: false,
        }),
      );
      setAllEvents(transformedEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!socket) return;
    const onApproved = (data: any) => {
      // reload events when a new event is approved
      loadEvents();
    };
    socket.on("event:approved", onApproved);
    return () => {
      socket.off("event:approved", onApproved);
    };
  }, [socket, loadEvents]);

  const filtered = allEvents.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);

    let matchCategory = activeCategory === "All";
    if (activeCategory !== "All") {
      const mainCategory = categories.find(
        (cat) => cat.name === activeCategory,
      );
      if (mainCategory)
        matchCategory = mainCategory.subCategories.includes(e.category);
      else matchCategory = e.category === activeCategory;
    }

    const matchStatus = e.status === "approved";
    return matchSearch && matchCategory && matchStatus;
  });

  const upcomingEvents = filtered
    .filter((e) => new Date(e.date) >= new Date())
    .slice(0, 3);
  const todayEvents = filtered.filter(
    (e) => new Date(e.date).toDateString() === new Date().toDateString(),
  );

  return (
    <Layout>
      <div className="hero-gradient py-8 relative min-h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://www.zetech.ac.ke/images/students-gallery/1K1A1822.JPG"
            alt="Zetech University Students"
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 filter brightness-90 contrast-110 scale-105 origin-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {filtered.length} Events Available
              </Badge>
            </div>

            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              Discover Campus Events
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Explore exciting opportunities, connect with fellow students, and
              make lasting memories at Zetech University
            </p>

            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">
                  {todayEvents.length} Today
                </span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">
                  {upcomingEvents.length} This Week
                </span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">3 Campuses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                All Events
              </h2>
              <p className="text-muted-foreground text-lg">
                Discover and participate in amazing campus events
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user && user.role === "club_leader" && (
                <Button
                  onClick={() => navigate("/create-event")}
                  size="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-2 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Create Event
                </Button>
              )}
            </div>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search events by title, venue, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 text-lg h-12 border-2 focus:border-primary/50 transition-all duration-300"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Visible category bar for students (always shown) */}
          <div className="flex gap-2 flex-wrap mb-8 mt-4">
            {["All", ...categories.map((cat) => cat.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat ? "bg-primary text-primary-foreground shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`transition-all duration-500 ${showFilters ? "opacity-100 max-h-96 mb-8" : "opacity-0 max-h-0 overflow-hidden"}`}
        >
          <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" /> Filter by Category
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {["All", ...categories.map((cat) => cat.name)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${activeCategory === cat ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-white text-foreground hover:bg-gray-100 border border-gray-200 hover:border-gray-300"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* category bar moved above for visibility */}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Events Found
              </h3>
              <p className="text-gray-600 mb-6">
                {search
                  ? "Try adjusting your search terms"
                  : activeCategory !== "All"
                    ? "No events in this category"
                    : "There are currently no events scheduled"}
              </p>
              <div className="flex gap-3 justify-center">
                {search && (
                  <Button onClick={() => setSearch("")} variant="outline">
                    Clear Search
                  </Button>
                )}
                {activeCategory !== "All" && (
                  <Button
                    onClick={() => setActiveCategory("All")}
                    variant="outline"
                  >
                    Show All Categories
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                events
              </p>
              {search && (
                <p className="text-sm text-muted-foreground">
                  Search results for "
                  <span className="font-medium">{search}</span>"
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((event, index) => (
                <div key={event.id} className="animate-fade-in">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Events;
