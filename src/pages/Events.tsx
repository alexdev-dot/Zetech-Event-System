import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { type Event } from "@/data/events";
import { useCategories } from "@/hooks/useCategories";
import { api } from "@/lib/api";
import { Search, Plus, Calendar, MapPin, Sparkles, TrendingUp, Sun, CalendarDays } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

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

function startOfDay(d: Date) { const c = new Date(d); c.setHours(0,0,0,0); return c; }
function endOfDay(d: Date)   { const c = new Date(d); c.setHours(23,59,59,999); return c; }
function startOfWeek(d: Date){ const c = startOfDay(d); c.setDate(c.getDate()-c.getDay()); return c; }
function endOfWeek(d: Date)  { const c = endOfDay(d); c.setDate(c.getDate()+(6-c.getDay())); return c; }

const Events = () => {
  const [search, setSearch]             = useState("");
  const [activeCategory, setCategory]   = useState("All");
  const [allEvents, setAllEvents]       = useState<Event[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const { categories }                  = useCategories();
  const { user }                        = useAuth();
  const navigate                        = useNavigate();
  const { socket }                      = useSocket();

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.events.getAll();
      setAllEvents((data || []).map((e: BackendEvent) => ({
        id: String(e.id), title: e.title || "", description: e.description || "",
        date: e.date || "", time: e.time || "", venue: e.location || "",
        campus: "Main Campus", posterUrl: e.image_url || "",
        status: ["upcoming","ongoing","completed"].includes(e.status || "") ? "approved" : "pending",
        registrations: e.registered_count ?? 0, capacity: e.max_participants ?? 0,
        organizer: e.created_by_email || "Admin", category: e.category || "", featured: false,
      })));
    } catch { setAllEvents([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => {
    if (!socket) return;
    socket.on("event:approved", loadEvents);
    return () => { socket.off("event:approved", loadEvents); };
  }, [socket, loadEvents]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const weekStart  = startOfWeek(now);
  const weekEnd    = endOfWeek(now);

  const inRange = (ds: string, from: Date, to: Date) => { const d = new Date(ds); return d >= from && d <= to; };

  const approved = allEvents.filter(e => e.status === "approved");
  const todayCount = approved.filter(e => inRange(e.date, todayStart, todayEnd)).length;
  const weekCount  = approved.filter(e => inRange(e.date, weekStart,  weekEnd)).length;
  const monthCount = approved.filter(e => {
    const d = new Date(e.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const filtered = approved.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);
    let matchCat = activeCategory === "All";
    if (activeCategory !== "All") {
      const main = categories.find(c => c.name === activeCategory);
      matchCat = main ? main.subCategories.includes(e.category) : e.category === activeCategory;
    }
    return matchSearch && matchCat;
  }).filter(e => new Date(e.date) >= todayStart);

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="hero-gradient py-6 md:py-8 relative min-h-[250px] md:min-h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://www.zetech.ac.ke/images/students-gallery/1K1A1822.JPG"
            alt="Zetech University Students"
            className="w-full h-full object-cover object-center brightness-90 contrast-110 scale-105 origin-center"
            loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="absolute top-6 left-6 md:top-10 md:left-10 w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="container relative z-10 px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-300 animate-pulse" />
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs md:text-sm">
                {filtered.length} Events Available
              </Badge>
            </div>
            <h1 className="font-heading text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 md:mb-4 leading-tight">
              Discover Campus Events
            </h1>
            <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl">
              Explore exciting opportunities, connect with fellow students, and make lasting memories at Zetech University
            </p>

            {/* Quick-jump pills linking to dedicated pages */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Link to="/events/today"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all hover:scale-105">
                <Sun className="w-3 h-3 md:w-4 md:h-4" />
                <span>{todayCount} Today</span>
              </Link>
              <Link to="/events/week"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all hover:scale-105">
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                <span>{weekCount} This Week</span>
              </Link>
              <Link to="/events/month"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all hover:scale-105">
                <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
                <span>{monthCount} This Month</span>
              </Link>
              <div className="flex items-center gap-2 text-white/70 px-2 py-2 text-xs md:text-sm">
                <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                <span>3 Campuses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Search + Create */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-1">All Upcoming Events</h2>
            <p className="text-muted-foreground">Discover and participate in amazing campus events</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "club_leader" && (
              <Button onClick={() => navigate("/create-event")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            )}
          </div>
        </div>

        <div className="relative max-w-2xl mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search events by title, venue, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-12 border-2 focus:border-primary/50 text-base"
          />
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              Clear
            </Button>
          )}
        </div>

        {/* Category chips - mobile dropdown, desktop horizontal */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile dropdown with better styling */}
          <div className="sm:hidden mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={activeCategory}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[48px] appearance-none cursor-pointer"
            >
              {["All", ...categories.map(c => c.name)].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Desktop horizontal chips */}
          <div className="hidden sm:flex gap-2 flex-wrap">
            {["All", ...categories.map(c => c.name)].map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[40px]
                  ${activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 sm:h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
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
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Events Found</h3>
              <p className="text-gray-600 mb-6">
                {search ? "Try adjusting your search terms"
                  : activeCategory !== "All" ? "No events in this category"
                  : "There are currently no upcoming events"}
              </p>
              <div className="flex gap-3 justify-center">
                {search && <Button onClick={() => setSearch("")} variant="outline">Clear Search</Button>}
                {activeCategory !== "All" && <Button onClick={() => setCategory("All")} variant="outline">Show All Categories</Button>}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <p className="text-muted-foreground text-xs sm:text-sm">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> upcoming event{filtered.length !== 1 ? "s" : ""}
              </p>
              {search && <p className="text-xs sm:text-sm text-muted-foreground">Results for "<span className="font-medium">{search}</span>"</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map(event => (
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
