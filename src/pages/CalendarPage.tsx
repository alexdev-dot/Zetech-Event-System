import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CalEvent = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  status: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const categoryColor = (cat: string) => {
  if (!cat) return "bg-primary";
  const c = cat.toLowerCase();
  if (c.includes("sport") || c.includes("football") || c.includes("basket") || c.includes("rugby") || c.includes("chess")) return "bg-orange-500";
  if (c.includes("christian") || c.includes("muslim") || c.includes("sda") || c.includes("catholic")) return "bg-green-500";
  if (c.includes("community") || c.includes("lion") || c.includes("rotaract") || c.includes("zuka")) return "bg-purple-500";
  if (c.includes("creative") || c.includes("media")) return "bg-yellow-500";
  if (c.includes("zusa") || c.includes("leadership")) return "bg-red-500";
  return "bg-blue-500";
};

const CalendarPage = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events.getAll()
      .then((data: any[]) => setEvents(data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const eventsForDay = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return events.filter(e => e.date?.slice(0, 10) === dateStr && e.status === "upcoming");
  };

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  return (
    <Layout>
      <div className="hero-gradient py-10">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-white" />
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white">Campus Calendar</h1>
          </div>
          <p className="text-white/80 text-lg">All campus events at a glance</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl shadow-xl overflow-hidden border">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="font-heading font-bold text-xl">
                  {MONTHS[month]} {year}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {DAYS.map(d => (
                  <div key={d} className="text-center py-3 text-xs font-semibold text-muted-foreground">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }).map((_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isPrev = dayNum < 1;
                  const isNext = dayNum > daysInMonth;
                  const displayDay = isPrev ? daysInPrev + dayNum : isNext ? dayNum - daysInMonth : dayNum;
                  const dayEvents = (!isPrev && !isNext) ? eventsForDay(dayNum) : [];
                  const isSelected = !isPrev && !isNext && selectedDay === dayNum;
                  const isTodayCell = !isPrev && !isNext && isToday(dayNum);

                  return (
                    <div
                      key={i}
                      onClick={() => { if (!isPrev && !isNext) setSelectedDay(dayNum === selectedDay ? null : dayNum); }}
                      className={`min-h-[80px] p-1.5 border-b border-r cursor-pointer transition-colors
                        ${isPrev || isNext ? "bg-muted/20" : "hover:bg-muted/40"}
                        ${isSelected ? "bg-primary/10 border-primary/30" : ""}
                      `}
                    >
                      <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                        ${isTodayCell ? "bg-primary text-primary-foreground" : isPrev || isNext ? "text-muted-foreground/40" : "text-foreground"}
                      `}>
                        {displayDay}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(ev => (
                          <div
                            key={ev.id}
                            className={`${categoryColor(ev.category)} text-white text-[9px] rounded px-1 py-0.5 truncate`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-muted-foreground font-medium pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 px-1">
              {[
                { label: "Tech & Academic", color: "bg-blue-500" },
                { label: "Sports & Games", color: "bg-orange-500" },
                { label: "Social & Community", color: "bg-purple-500" },
                { label: "Religious Groups", color: "bg-green-500" },
                { label: "Student Leadership", color: "bg-red-500" },
                { label: "Creative & Media", color: "bg-yellow-500" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected day events */}
            {selectedDay !== null ? (
              <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">
                    {MONTHS[month]} {selectedDay}, {year}
                  </h3>
                  <Badge variant="secondary">{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="divide-y max-h-80 overflow-y-auto">
                  {selectedEvents.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      No events on this day
                    </div>
                  ) : (
                    selectedEvents.map(ev => (
                      <Link key={ev.id} to={`/events/${ev.id}`} className="flex gap-3 px-5 py-4 hover:bg-muted/50 transition-colors">
                        <span className={`w-2 rounded-full shrink-0 ${categoryColor(ev.category)}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{ev.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.time}</span>
                            <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{ev.location}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-xl border p-6 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click a date to see events</p>
              </div>
            )}

            {/* Upcoming this month */}
            <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h3 className="font-semibold">This Month</h3>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  (() => {
                    const monthEvents = events
                      .filter(e => {
                        const d = new Date(e.date);
                        return d.getFullYear() === year && d.getMonth() === month && e.status === "upcoming";
                      })
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    return monthEvents.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">No events this month</div>
                    ) : monthEvents.map(ev => (
                      <Link key={ev.id} to={`/events/${ev.id}`} className="flex gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                        <div className="text-center min-w-[36px]">
                          <div className="text-xs font-bold text-muted-foreground">{MONTHS[new Date(ev.date).getMonth()].slice(0, 3).toUpperCase()}</div>
                          <div className="text-lg font-bold leading-tight">{new Date(ev.date).getDate()}</div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{ev.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{ev.time}
                          </p>
                        </div>
                      </Link>
                    ));
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
