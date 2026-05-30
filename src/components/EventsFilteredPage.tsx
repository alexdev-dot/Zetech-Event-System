import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { type Event } from "@/data/events";
import { useCategories } from "@/hooks/useCategories";
import { api } from "@/lib/api";
import { Search, Calendar } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

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

export interface EventsFilteredPageProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  filterFn: (events: Event[]) => Event[];
  emptyMessage: string;
  emptySubtext: string;
  periodLabel: string;
}

function transformEvent(e: BackendEvent): Event {
  return {
    id:            String(e.id),
    title:         e.title         || "",
    description:   e.description   || "",
    date:          e.date          || "",
    time:          e.time          || "",
    venue:         e.location      || "",
    campus:        "Main Campus",
    posterUrl:     e.image_url     || "",
    status:        ["upcoming","ongoing","completed"].includes(e.status || "") ? "approved" : "pending",
    registrations: e.registered_count  ?? 0,
    capacity:      e.max_participants  ?? 0,
    organizer:     e.created_by_email  || "Admin",
    category:      e.category      || "",
    featured:      false,
  };
}

const EventsFilteredPage = ({
  title, subtitle, icon: Icon, iconBg, iconColor,
  filterFn, emptyMessage, emptySubtext, periodLabel,
}: EventsFilteredPageProps) => {
  const [search, setSearch]           = useState("");
  const [activeCategory, setCategory] = useState("All");
  const [allEvents, setAllEvents]     = useState<Event[]>([]);
  const [loading, setLoading]         = useState(true);
  const { categories }                = useCategories();
  const { socket }                    = useSocket();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.events.getAll();
      setAllEvents((data || []).map(transformEvent));
    } catch { setAllEvents([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => {
    if (!socket) return;
    socket.on("event:approved", loadEvents);
    return () => { socket.off("event:approved", loadEvents); };
  }, [socket, loadEvents]);

  const base = allEvents.filter(e => {
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
    return matchSearch && matchCat && e.status === "approved";
  });

  const visible = filterFn(base);

  return (
    <Layout>
      {/* Hero */}
      <div className="hero-gradient py-12 relative overflow-hidden">
        <div className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shadow-lg`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {loading ? "Loading..." : `${visible.length} event${visible.length !== 1 ? "s" : ""}`}
              </Badge>
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-3 leading-tight">{title}</h1>
            <p className="text-xl text-white/85">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Search + category */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={`Search ${periodLabel.toLowerCase()} events...`}
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
          <div>
            {/* Mobile dropdown */}
            <div className="sm:hidden mb-4">
              <select
                value={activeCategory}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium focus:border-primary focus:outline-none min-h-[48px]"
              >
                {["All", ...categories.map(c => c.name)].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Desktop horizontal chips */}
            <div className="hidden sm:flex gap-2 flex-wrap overflow-x-auto scrollbar-hide">
              {["All", ...categories.map(c => c.name)].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                    ${activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-2xl" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-24">
            <div className="max-w-md mx-auto">
              <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <Icon className={`w-10 h-10 ${iconColor}`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{emptyMessage}</h3>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">{emptySubtext}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                {search         && <Button onClick={() => setSearch("")}   variant="outline">Clear Search</Button>}
                {activeCategory !== "All" && <Button onClick={() => setCategory("All")} variant="outline">All Categories</Button>}
                <Button asChild><Link to="/events">Browse All Events</Link></Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-muted-foreground text-sm">
                Showing <span className="font-semibold text-foreground">{visible.length}</span> {periodLabel.toLowerCase()} event{visible.length !== 1 ? "s" : ""}
                {search && <> matching "<span className="font-medium">{search}</span>"</>}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visible.map(ev => (
                <div key={ev.id} className="animate-fade-in">
                  <EventCard event={ev} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default EventsFilteredPage;
