import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { type Event } from "@/data/events";
import { useCategories } from "@/hooks/useCategories";
import { api } from "@/lib/api";
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Sparkles,
  TrendingUp,
  Sun,
  CalendarDays,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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

// ── date helpers ──────────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}
function startOfWeek(d: Date) {
  const c = startOfDay(d);
  c.setDate(c.getDate() - c.getDay()); // Sunday
  return c;
}
function endOfWeek(d: Date) {
  const c = endOfDay(d);
  c.setDate(c.getDate() + (6 - c.getDay())); // Saturday
  return c;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

type TabId = "today" | "week" | "month" | "all";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "today", label: "Today",      icon: Sun         },
  { id: "week",  label: "This Week",  icon: TrendingUp  },
  { id: "month", label: "This Month", icon: CalendarDays },
  { id: "all",   label: "All Events", icon: Calendar    },
];

const Events = () => {
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab]         = useState<TabId>("today");
  const [allEvents, setAllEvents]         = useState<Event[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const { categories }                    = useCategories();
  const { user }                          = useAuth();
  const navigate                          = useNavigate();
  const { socket }                        = useSocket();

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventsData = await api.events.getAll();
      const transformed: Event[] = (eventsData || []).map((event: BackendEvent) => ({
        id:            String(event.id),
        title:         event.title         || "",
        description:   event.description   || "",
        date:          event.date          || "",
        time:          event.time          || "",
        venue:         event.location      || "",
        campus:        "Main Campus",
        posterUrl:     event.image_url     || "",
        status:        ["upcoming", "ongoing", "completed"].includes(event.status || "") ? "approved" : "pending",
        registrations: event.registered_count ?? 0,
        capacity:      event.max_participants ?? 0,
        organizer:     event.created_by_email  || "Admin",
        category:      event.category      || "",
        featured:      false,
      }));
      setAllEvents(transformed);
    } catch (error) {
      console.error("Failed to load events:", error);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (!socket) return;
    socket.on("event:approved", loadEvents);
    return () => { socket.off("event:approved", loadEvents); };
  }, [socket, loadEvents]);

  // ── filtered by search + category + status ───────────────────────────────
  const filtered = allEvents.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);

    let matchCategory = activeCategory === "All";
    if (activeCategory !== "All") {
      const mainCat = categories.find(c => c.name === activeCategory);
      matchCategory = mainCat ? mainCat.subCategories.includes(e.category) : e.category === activeCategory;
    }

    return matchSearch && matchCategory && e.status === "approved";
  });

  // ── date buckets ─────────────────────────────────────────────────────────
  const now    = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const weekStart  = startOfWeek(now);
  const weekEnd    = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const inRange = (dateStr: string, from: Date, to: Date) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= from && d <= to;
  };

  const todayEvents  = filtered.filter(e => inRange(e.date, todayStart, todayEnd));
  const weekEvents   = filtered.filter(e => inRange(e.date, weekStart,  weekEnd));
  const monthEvents  = filtered.filter(e => inRange(e.date, monthStart, monthEnd));
  const allFiltered  = filtered.filter(e => new Date(e.date) >= todayStart);

  const tabEvents: Record<TabId, Event[]> = {
    today: todayEvents,
    week:  weekEvents,
    month: monthEvents,
    all:   allFiltered,
  };

  const counts: Record<TabId, number> = {
    today: todayEvents.length,
    week:  weekEvents.length,
    month: monthEvents.length,
    all:   allFiltered.length,
  };

  const visibleEvents = tabEvents[activeTab];

  const emptyMessages: Record<TabId, string> = {
    today: "No events happening today",
    week:  "No events scheduled this week",
    month: "No events scheduled this month",
    all:   search ? "No events match your search" : activeCategory !== "All" ? "No events in this category" : "No upcoming events",
  };

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="hero-gradient py-8 relative min-h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://www.zetech.ac.ke/images/students-gallery/1K1A1822.JPG"
            alt="Zetech University Students"
            className="w-full h-full object-cover object-center brightness-90 contrast-110 scale-105 origin-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />

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
              Explore exciting opportunities, connect with fellow students, and make lasting memories at Zetech University
            </p>

            {/* Live counters */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div
                className="flex items-center gap-2 text-white cursor-pointer hover:text-yellow-300 transition-colors"
                onClick={() => setActiveTab("today")}
              >
                <Sun className="w-5 h-5" />
                <span className="font-semibold">{counts.today} Today</span>
              </div>
              <div
                className="flex items-center gap-2 text-white cursor-pointer hover:text-yellow-300 transition-colors"
                onClick={() => setActiveTab("week")}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">{counts.week} This Week</span>
              </div>
              <div
                className="flex items-center gap-2 text-white cursor-pointer hover:text-yellow-300 transition-colors"
                onClick={() => setActiveTab("month")}
              >
                <CalendarDays className="w-5 h-5" />
                <span className="font-semibold">{counts.month} This Month</span>
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
        {/* ── Search + Create ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="relative max-w-2xl w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search events by title, venue, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 text-base h-12 border-2 focus:border-primary/50 transition-all"
            />
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                Clear
              </Button>
            )}
          </div>
          {user?.role === "club_leader" && (
            <Button onClick={() => navigate("/create-event")} className="shrink-0 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          )}
        </div>

        {/* ── Category chips ───────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap mb-6">
          {["All", ...categories.map(c => c.name)].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Time Tabs ────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-8 flex-wrap">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active ? "bg-white dark:bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Event grid ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === "today"  ? <Sun className="w-10 h-10 text-gray-400" /> :
                 activeTab === "week"   ? <TrendingUp className="w-10 h-10 text-gray-400" /> :
                 activeTab === "month"  ? <CalendarDays className="w-10 h-10 text-gray-400" /> :
                                         <Calendar className="w-10 h-10 text-gray-400" />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{emptyMessages[activeTab]}</h3>
              <p className="text-gray-500 mb-6 text-sm">
                {activeTab !== "all"
                  ? <>Try switching to <button onClick={() => setActiveTab("all")} className="text-primary font-medium hover:underline">All Events</button> to see upcoming events.</>
                  : "Check back soon — new events are added regularly."}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {search && <Button onClick={() => setSearch("")} variant="outline">Clear Search</Button>}
                {activeCategory !== "All" && <Button onClick={() => setActiveCategory("All")} variant="outline">Show All Categories</Button>}
                {activeTab !== "all" && <Button onClick={() => setActiveTab("all")} variant="default">View All Events</Button>}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing <span className="font-semibold text-foreground">{visibleEvents.length}</span> event{visibleEvents.length !== 1 ? "s" : ""}
                {activeTab !== "all" && (
                  <span className="ml-1">
                    {activeTab === "today" && "happening today"}
                    {activeTab === "week"  && `this week`}
                    {activeTab === "month" && `in ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`}
                  </span>
                )}
              </p>
              {search && <p className="text-sm text-muted-foreground">Results for "<span className="font-medium">{search}</span>"</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleEvents.map(event => (
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
