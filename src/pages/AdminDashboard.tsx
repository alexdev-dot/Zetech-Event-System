import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useSocketNotifications } from "@/hooks/useSocketNotifications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Plus,
  LogOut,
  RefreshCw,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Lock,
  EyeOff,
  Shield,
  TrendingUp,
  ChevronRight,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Users as UsersIcon,
  Bell,
  Home,
} from "lucide-react";
import zetechLogo from "@/assets/zetech-logo.png";
import { format } from "date-fns";
import StudentManagement from "@/components/StudentManagement";
import AdminAccountSettings from "@/components/AdminAccountSettings";
import AdminQuickActions from "@/components/AdminQuickActions";
import AdminSystemSettings from "@/components/AdminSystemSettings";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminCombinedSettings from "@/components/AdminCombinedSettings";
import CategoryManagement from "@/components/CategoryManagement";

// ---- Local types for admin pages ----
type AdminEvent = {
  id: number;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  max_participants?: number | null;
  image_url?: string | null;
  status?: string;
  created_by?: number | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  creator_club?: string | null;
  created_at?: string | null;
  registered_count?: number;
  category?: string | null;
};

type Registration = {
  id: number;
  student_id: number;
  registration_date?: string;
  first_name?: string;
  last_name?: string;
  admission_number?: string;
  email?: string;
};

type ClubLeader = {
  id: number;
  name?: string;
  email?: string;
  club?: string;
  created_at?: string;
};

type DashboardStats = {
  totalEvents?: number;
  totalStudents?: number;
  upcomingEvents?: number;
  pendingEvents?: number;
};

function getErrorMessage(err: unknown) {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  upcoming: "bg-blue-100   text-blue-800   border-blue-200",
  ongoing: "bg-green-100  text-green-800  border-green-200",
  completed: "bg-gray-100   text-gray-700   border-gray-200",
  cancelled: "bg-red-100    text-red-700    border-red-200",
  rejected: "bg-rose-100   text-rose-700   border-rose-200",
};

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "unknown";
  const label =
    typeof s === "string" && s.length
      ? s.charAt(0).toUpperCase() + s.slice(1)
      : "Unknown";
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[s] || "bg-gray-100 text-gray-600 border-gray-200"}`}
    >
      {label}
    </span>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  try {
    return format(new Date(d), "MMM d, yyyy");
  } catch {
    return String(d);
  }
}

// ─── PENDING EVENTS TAB ──────────────────────────────────────────────────────

function PendingEventsTab({ onAction }: { onAction: () => void }) {
  const [pendingEvents, setPendingEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewEvent, setViewEvent] = useState<AdminEvent | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getPendingEvents();
      setPendingEvents(data);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: number) => {
    setActioning(id);
    try {
      await api.admin.approveEvent(id);
      toast({
        title: "Event approved",
        description: "The event is now visible to students.",
      });
      load();
      onAction();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setActioning(null);
    }
  };

  const reject = async (id: number) => {
    if (!confirm("Reject this event? The club leader will see it as rejected."))
      return;
    setActioning(id);
    try {
      await api.admin.rejectEvent(id);
      toast({ title: "Event rejected" });
      load();
      onAction();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setActioning(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Pending Approval
          </h2>
          <p className="text-sm text-gray-500">
            Events submitted by club leaders awaiting your review
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {pendingEvents.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm mt-1">No events are waiting for approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingEvents.map((ev) => (
            <Card
              key={ev.id}
              className="border border-yellow-200 shadow-sm bg-yellow-50/30"
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-800">
                        {ev.title ?? ""}
                      </h3>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {ev.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {fmtDate(ev.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ev.time?.substring(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{" "}
                        {ev.max_participants
                          ? `Cap: ${ev.max_participants}`
                          : "Unlimited"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted by{" "}
                      <strong>
                        {ev.created_by_name || ev.created_by_email || ""}
                      </strong>
                      {ev.creator_club ? ` — ${ev.creator_club}` : ""} ·{" "}
                      {fmtDate(ev.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewEvent(ev)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approve(ev.id)}
                      disabled={actioning === ev.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {actioning === ev.id ? "..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => reject(ev.id)}
                      disabled={actioning === ev.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {actioning === ev.id ? "..." : "Reject"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View detail dialog */}
      <Dialog open={!!viewEvent} onOpenChange={() => setViewEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {viewEvent && (
            <div className="space-y-3 pt-2">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Title
                </p>
                <p className="font-semibold text-gray-800">{viewEvent.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Description
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {viewEvent.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-sm">{fmtDate(viewEvent.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Time
                  </p>
                  <p className="text-sm">{viewEvent.time?.substring(0, 5)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Venue
                </p>
                <p className="text-sm">{viewEvent.location}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Category
                  </p>
                  <p className="text-sm">{viewEvent.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Capacity
                  </p>
                  <p className="text-sm">
                    {viewEvent.max_participants || "Unlimited"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Submitted By
                </p>
                <p className="text-sm">
                  {viewEvent.created_by_name || viewEvent.created_by_email}{" "}
                  {viewEvent.creator_club ? `(${viewEvent.creator_club})` : ""}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    approve(viewEvent.id);
                    setViewEvent(null);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    reject(viewEvent.id);
                    setViewEvent(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ALL EVENTS TAB ───────────────────────────────────────────────────────────

function AllEventsTab() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewRegs, setViewRegs] = useState<{
    event: AdminEvent;
    regs: Registration[];
  } | null>(null);
  const [regsLoading, setRegsLoading] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getAllEvents();
      setEvents(data);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteEvent = async (id: number) => {
    if (!confirm("Delete this event permanently?")) return;
    try {
      await api.events.delete(String(id));
      toast({ title: "Event deleted" });
      load();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const bulkDelete = async () => {
    if (selectedEvents.size === 0) return;
    if (!confirm(`Delete ${selectedEvents.size} events permanently?`)) return;
    try {
      await Promise.all(
        Array.from(selectedEvents).map((id) => api.events.delete(String(id))),
      );
      toast({ title: `${selectedEvents.size} events deleted` });
      setSelectedEvents(new Set());
      load();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const bulkApprove = async () => {
    if (selectedEvents.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedEvents).map((id) => api.admin.approveEvent(id)),
      );
      toast({ title: `${selectedEvents.size} events approved` });
      setSelectedEvents(new Set());
      load();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const bulkReject = async () => {
    if (selectedEvents.size === 0) return;
    if (!confirm(`Reject ${selectedEvents.size} events?`)) return;
    try {
      await Promise.all(
        Array.from(selectedEvents).map((id) => api.admin.rejectEvent(id)),
      );
      toast({ title: `${selectedEvents.size} events rejected` });
      setSelectedEvents(new Set());
      load();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const viewRegistrations = async (ev: AdminEvent) => {
    setViewRegs({ event: ev, regs: [] });
    setRegsLoading(true);
    try {
      const regs = await api.admin.getEventRegistrations(String(ev.id));
      setViewRegs({ event: ev, regs });
    } catch (err: unknown) {
      toast({
        title: "Error loading registrations",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setRegsLoading(false);
    }
  };

  const toggleEventSelection = (id: number) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEvents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === filtered.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filtered.map((e) => e.id)));
    }
  };

  const categories = Array.from(
    new Set(events.map((e) => e.category).filter(Boolean)),
  );

  const filtered = events
    .filter((e) => {
      const matchesSearch =
        !search ||
        (e.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (e.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (e.status ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || e.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        comparison = ta - tb;
      } else if (sortBy === "title") {
        comparison = (a.title ?? "").localeCompare(b.title ?? "");
      } else if (sortBy === "registrations") {
        comparison = (a.registered_count || 0) - (b.registered_count || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">All Events</h2>
          <p className="text-sm text-gray-500">
            {events.length} events total (all statuses)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52"
          />
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md"
                aria-label="Filter by status"
                title="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md"
                aria-label="Filter by category"
                title="Filter by category"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={String(cat)} value={String(cat ?? "")}>
                    {String(cat ?? "")}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md"
                aria-label="Sort events"
                title="Sort events"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="registrations">Sort by Registrations</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setSortBy("date");
                  setSortOrder("desc");
                }}
              >
                Clear Filters
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedEvents.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedEvents.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkApprove}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkReject}
                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{search ? "No events match your search." : "No events yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={
                selectedEvents.size === filtered.length && filtered.length > 0
              }
              onChange={toggleSelectAll}
              className="w-4 h-4"
              aria-label="Select all events"
              title="Select all events"
            />
            <span className="text-sm text-gray-600">
              Select All ({filtered.length} events)
            </span>
          </div>

          {filtered.map((ev) => (
            <Card
              key={ev.id}
              className={`border-0 shadow-sm ${selectedEvents.has(ev.id) ? "ring-2 ring-blue-500" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(ev.id)}
                      onChange={() => toggleEventSelection(ev.id)}
                      className="w-4 h-4 mt-1"
                      aria-label={`Select event ${ev.title || ev.id}`}
                      title={`Select event ${ev.title || ev.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-gray-800 truncate">
                          {ev.title ?? ""}
                        </span>
                        <StatusBadge status={ev.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>
                          <Calendar className="inline w-3 h-3 mr-1" />
                          {fmtDate(ev.date)}
                        </span>
                        <span>
                          <MapPin className="inline w-3 h-3 mr-1" />
                          {ev.location}
                        </span>
                        <span>
                          <Users className="inline w-3 h-3 mr-1" />
                          {ev.registered_count ?? 0}
                          {ev.max_participants
                            ? `/${ev.max_participants}`
                            : ""}{" "}
                          registered
                        </span>
                        {ev.creator_club && (
                          <span>Club: {ev.creator_club}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewRegistrations(ev)}
                      title="View registrations"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => deleteEvent(ev.id)}
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Registrations Dialog */}
      <Dialog open={!!viewRegs} onOpenChange={() => setViewRegs(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrations — {viewRegs?.event?.title}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {regsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : viewRegs?.regs.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                No registrations yet.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {viewRegs?.regs.map((r, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {r.first_name} {r.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.admission_number} · {r.email}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {fmtDate(r.registration_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CLUB LEADERS TAB ─────────────────────────────────────────────────────────

function ClubLeadersTab() {
  const [leaders, setLeaders] = useState<ClubLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    club: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getClubLeaders();
      setLeaders(data);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.admin.createClubLeader(form);
      toast({
        title: "Club leader created",
        description: `${form.name} can now log in with their email.`,
      });
      setShowCreate(false);
      setForm({ email: "", password: "", name: "", club: "" });
      load();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, name?: string) => {
    if (!confirm(`Remove club leader "${name ?? ""}"? This cannot be undone.`))
      return;
    try {
      await api.admin.deleteClubLeader(id);
      toast({ title: "Club leader removed" });
      load();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Club Leaders</h2>
          <p className="text-sm text-gray-500">
            Leaders can submit events for your approval
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Leader
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Club Leader Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Mwangi"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Club / Society *</Label>
                <Input
                  value={form.club}
                  onChange={(e) => setForm({ ...form, club: e.target.value })}
                  placeholder="e.g. Tech Club"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="leader@zetech.ac.ke"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Password *</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                <strong>Note:</strong> Club leaders log in via the Club Leader
                option on the Sign In page using this email and password. They
                cannot self-register.
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    "Creating..."
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" /> Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {leaders.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No club leaders yet</p>
            <p className="text-sm mt-1">
              Add a leader above to let them submit events for approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader) => (
            <Card key={leader.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                      {String(leader.name ?? leader.email ?? "")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {leader.name || "Unnamed"}
                      </p>
                      <p className="text-sm text-gray-500">{leader.email}</p>
                      {leader.club && (
                        <p className="text-xs text-green-700 font-medium">
                          {leader.club}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 hidden sm:block">
                      Joined {fmtDate(leader.created_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() =>
                        handleDelete(
                          leader.id,
                          String(leader.name ?? leader.email ?? ""),
                        )
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN DASHBOARD ─────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newEmail: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.admin.getDashboardStats();
      setStats(data);
      setPendingCount(data.pendingEvents || 0);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Enable Socket.io real-time notifications
  useSocketNotifications(user?.id, user?.role);

  const handlePwdUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      if (!pwdForm.currentPassword)
        throw new Error("Current password is required");
      if (!pwdForm.newEmail && !pwdForm.newPassword)
        throw new Error("Provide a new email or password");
      if (
        pwdForm.newPassword &&
        pwdForm.newPassword !== pwdForm.confirmNewPassword
      )
        throw new Error("Passwords do not match");
      await api.admin.updateAccount(pwdForm);
      toast({ title: "Account updated" });
      setShowChangePwd(false);
      setPwdForm({
        currentPassword: "",
        newEmail: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSavingPwd(false);
    }
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pending", label: "Pending Events", icon: Bell, badge: pendingCount },
    { id: "events", label: "All Events", icon: FileText },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "leaders", label: "Club Leaders", icon: UsersIcon },
    { id: "students", label: "Students", icon: Users },
    { id: "categories", label: "Categories", icon: ChevronRight },
    { id: "system", label: "System Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 fixed left-0 top-0 h-full z-30 hidden md:flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src={zetechLogo}
              alt="Zetech"
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div>
                <p className="font-semibold text-gray-800 text-sm leading-tight">
                  Admin Dashboard
                </p>
                <p className="text-xs text-gray-600">Zetech Events Hub</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
              {(user?.name || user?.email)?.[0]?.toUpperCase() || "A"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowChangePwd(true)}
              >
                <Lock className="w-4 h-4 mr-2" /> Account
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:bg-red-50"
                onClick={() => {
                  signOut();
                  navigate("/auth");
                }}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          )}
          {!sidebarOpen && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="flex-1"
                onClick={() => setShowChangePwd(true)}
                title="Account"
              >
                <Lock className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 text-red-600 hover:bg-red-50"
                onClick={() => {
                  signOut();
                  navigate("/auth");
                }}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
        >
          {sidebarOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4 rotate-180" />
          )}
        </button>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20 w-full">
        <div className="px-3 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <img
              src={zetechLogo}
              alt="Zetech"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-800 text-sm leading-tight">
                Admin Dashboard
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 h-9 w-9"
            onClick={() => {
              signOut();
              navigate("/auth");
            }}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="w-72 sm:w-80 bg-white h-full flex flex-col animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo Section */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={zetechLogo}
                  alt="Zetech"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">
                    Admin Dashboard
                  </p>
                  <p className="text-xs text-gray-600">Zetech Events Hub</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-9 w-9"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                    />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                  {(user?.name || user?.email)?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-10"
                  onClick={() => setShowChangePwd(true)}
                >
                  <Lock className="w-4 h-4 mr-2" /> Account
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`pt-14 md:pt-0 overflow-x-hidden overflow-y-auto min-h-screen transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}
      >
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-6xl mx-auto">
          {/* Content based on active view */}
          {activeView === "dashboard" && (
            <>
              {/* Stats */}
              {!statsLoading && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 lg:mb-8">
                  {[
                    {
                      label: "Total Events",
                      value: stats.totalEvents,
                      color: "blue",
                      icon: Calendar,
                      gradient: "from-blue-500 to-blue-600",
                    },
                    {
                      label: "Pending Approval",
                      value: stats.pendingEvents,
                      color: "yellow",
                      icon: AlertCircle,
                      gradient: "from-amber-500 to-orange-500",
                    },
                    {
                      label: "Upcoming Events",
                      value: stats.upcomingEvents,
                      color: "green",
                      icon: TrendingUp,
                      gradient: "from-emerald-500 to-green-600",
                    },
                    {
                      label: "Students",
                      value: stats.totalStudents,
                      color: "purple",
                      icon: Users,
                      gradient: "from-purple-500 to-indigo-600",
                    },
                  ].map(({ label, value, color, icon: Icon, gradient }) => (
                    <Card
                      key={label}
                      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                      />
                      <CardContent className="p-3 sm:p-4 md:p-6 relative">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm md:text-sm font-medium text-gray-500 mb-1">
                              {label}
                            </p>
                            <p className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800">
                              {value ?? 0}
                            </p>
                          </div>
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-gradient-to-br ${gradient} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <AdminQuickActions onNavigate={setActiveView} />
            </>
          )}
          {activeView === "pending" && (
            <PendingEventsTab onAction={loadStats} />
          )}
          {activeView === "events" && <AllEventsTab />}
          {activeView === "leaders" && <ClubLeadersTab />}
          {activeView === "students" && <StudentManagement />}
          {activeView === "analytics" && <AdminAnalytics />}
          {activeView === "categories" && <CategoryManagement />}
          {activeView === "system" && (
            <AdminCombinedSettings user={user} />
          )}
        </div>

        {/* Minimal Footer */}
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 text-center text-xs text-gray-500 border-t border-gray-200">
          <p>
            &copy; {new Date().getFullYear()} Zetech University. All rights
            reserved.
          </p>
          <p className="mt-1">Admin Dashboard v1.0</p>
        </div>
      </main>

      {/* Account / Password Dialog */}
      <Dialog open={showChangePwd} onOpenChange={setShowChangePwd}>
        <DialogContent className="max-w-md w-full mx-4 z-[60]">
          <DialogHeader>
            <DialogTitle>Update Admin Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePwdUpdate} className="space-y-4 pt-2">
            <div>
              <Label>Current Password *</Label>
              <div className="relative mt-1">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={pwdForm.currentPassword}
                  onChange={(e) =>
                    setPwdForm({ ...pwdForm, currentPassword: e.target.value })
                  }
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label>New Email (optional)</Label>
              <Input
                type="email"
                value={pwdForm.newEmail}
                onChange={(e) =>
                  setPwdForm({ ...pwdForm, newEmail: e.target.value })
                }
                placeholder="Leave blank to keep current"
                className="mt-1"
              />
            </div>
            <div>
              <Label>New Password (optional)</Label>
              <Input
                type={showPwd ? "text" : "password"}
                value={pwdForm.newPassword}
                onChange={(e) =>
                  setPwdForm({ ...pwdForm, newPassword: e.target.value })
                }
                placeholder="Leave blank to keep current"
                minLength={6}
                className="mt-1"
              />
            </div>
            {pwdForm.newPassword && (
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type={showPwd ? "text" : "password"}
                  value={pwdForm.confirmNewPassword}
                  onChange={(e) =>
                    setPwdForm({
                      ...pwdForm,
                      confirmNewPassword: e.target.value,
                    })
                  }
                  required
                  className="mt-1"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowChangePwd(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingPwd}>
                {savingPwd ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
