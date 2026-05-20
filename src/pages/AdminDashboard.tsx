import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Clock, Users, Plus, LogOut, RefreshCw, Settings,
  Trash2, CheckCircle, XCircle, AlertCircle, Eye, Lock, EyeOff, Shield,
  TrendingUp, ChevronRight, UserPlus
} from "lucide-react";
import zetechLogo from "@/assets/zetech-logo.png";
import { format } from "date-fns";
import StudentManagement from "@/components/StudentManagement";
import SettingsComponent from "@/components/Settings";

const statusColors: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  upcoming:  "bg-blue-100   text-blue-800   border-blue-200",
  ongoing:   "bg-green-100  text-green-800  border-green-200",
  completed: "bg-gray-100   text-gray-700   border-gray-200",
  cancelled: "bg-red-100    text-red-700    border-red-200",
  rejected:  "bg-rose-100   text-rose-700   border-rose-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function fmtDate(d: string) {
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; }
}

// ─── PENDING EVENTS TAB ──────────────────────────────────────────────────────

function PendingEventsTab({ onAction }: { onAction: () => void }) {
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewEvent, setViewEvent] = useState<any | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getPendingEvents();
      setPendingEvents(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    setActioning(id);
    try {
      await api.admin.approveEvent(id);
      toast({ title: "Event approved", description: "The event is now visible to students." });
      load();
      onAction();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioning(null);
    }
  };

  const reject = async (id: number) => {
    if (!confirm("Reject this event? The club leader will see it as rejected.")) return;
    setActioning(id);
    try {
      await api.admin.rejectEvent(id);
      toast({ title: "Event rejected" });
      load();
      onAction();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioning(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Pending Approval</h2>
          <p className="text-sm text-gray-500">Events submitted by club leaders awaiting your review</p>
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
            <Card key={ev.id} className="border border-yellow-200 shadow-sm bg-yellow-50/30">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-800">{ev.title}</h3>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ev.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(ev.date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.time?.substring(0, 5)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ev.max_participants ? `Cap: ${ev.max_participants}` : "Unlimited"}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted by <strong>{ev.created_by_name || ev.created_by_email}</strong>
                      {ev.creator_club ? ` — ${ev.creator_club}` : ""} · {fmtDate(ev.created_at)}
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
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Title</p>
                <p className="font-semibold text-gray-800">{viewEvent.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewEvent.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date</p>
                  <p className="text-sm">{fmtDate(viewEvent.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Time</p>
                  <p className="text-sm">{viewEvent.time?.substring(0, 5)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Venue</p>
                <p className="text-sm">{viewEvent.location}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Category</p>
                  <p className="text-sm">{viewEvent.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Capacity</p>
                  <p className="text-sm">{viewEvent.max_participants || "Unlimited"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Submitted By</p>
                <p className="text-sm">{viewEvent.created_by_name || viewEvent.created_by_email} {viewEvent.creator_club ? `(${viewEvent.creator_club})` : ""}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => { approve(viewEvent.id); setViewEvent(null); }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { reject(viewEvent.id); setViewEvent(null); }}
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
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewRegs, setViewRegs] = useState<{ event: any; regs: any[] } | null>(null);
  const [regsLoading, setRegsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getAllEvents();
      setEvents(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteEvent = async (id: number) => {
    if (!confirm("Delete this event permanently?")) return;
    try {
      await api.events.delete(String(id));
      toast({ title: "Event deleted" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const viewRegistrations = async (ev: any) => {
    setViewRegs({ event: ev, regs: [] });
    setRegsLoading(true);
    try {
      const regs = await api.admin.getEventRegistrations(String(ev.id));
      setViewRegs({ event: ev, regs });
    } catch (err: any) {
      toast({ title: "Error loading registrations", description: err.message, variant: "destructive" });
    } finally {
      setRegsLoading(false);
    }
  };

  const filtered = events.filter((e) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase()) ||
    e.status?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">All Events</h2>
          <p className="text-sm text-gray-500">{events.length} events total (all statuses)</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52"
          />
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{search ? "No events match your search." : "No events yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev) => (
            <Card key={ev.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-gray-800 truncate">{ev.title}</span>
                      <StatusBadge status={ev.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span><Calendar className="inline w-3 h-3 mr-1" />{fmtDate(ev.date)}</span>
                      <span><MapPin className="inline w-3 h-3 mr-1" />{ev.location}</span>
                      <span><Users className="inline w-3 h-3 mr-1" />{ev.registered_count ?? 0}{ev.max_participants ? `/${ev.max_participants}` : ""} registered</span>
                      {ev.creator_club && <span>Club: {ev.creator_club}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => viewRegistrations(ev)} title="View registrations">
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
              <p className="text-center text-gray-400 py-8">No registrations yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {viewRegs?.regs.map((r, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-gray-500">{r.admission_number} · {r.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">{fmtDate(r.registration_date)}</span>
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
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", club: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getClubLeaders();
      setLeaders(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.admin.createClubLeader(form);
      toast({ title: "Club leader created", description: `${form.name} can now log in with their email.` });
      setShowCreate(false);
      setForm({ email: "", password: "", name: "", club: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove club leader "${name}"? This cannot be undone.`)) return;
    try {
      await api.admin.deleteClubLeader(id);
      toast({ title: "Club leader removed" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Club Leaders</h2>
          <p className="text-sm text-gray-500">Leaders can submit events for your approval</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Leader</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Club Leader Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Mwangi" required className="mt-1" />
              </div>
              <div>
                <Label>Club / Society *</Label>
                <Input value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} placeholder="e.g. Tech Club" required className="mt-1" />
              </div>
              <div>
                <Label>Email Address *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="leader@zetech.ac.ke" required className="mt-1" />
              </div>
              <div>
                <Label>Password *</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                <strong>Note:</strong> Club leaders log in via the Club Leader option on the Sign In page using this email and password. They cannot self-register.
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : <><UserPlus className="w-4 h-4 mr-1" /> Create Account</>}
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
            <p className="text-sm mt-1">Add a leader above to let them submit events for approval.</p>
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
                      {(leader.name || leader.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{leader.name || "Unnamed"}</p>
                      <p className="text-sm text-gray-500">{leader.email}</p>
                      {leader.club && <p className="text-xs text-green-700 font-medium">{leader.club}</p>}
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
                      onClick={() => handleDelete(leader.id, leader.name || leader.email)}
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

  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newEmail: "", newPassword: "", confirmNewPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.admin.getDashboardStats();
      setStats(data);
      setPendingCount(data.pendingEvents || 0);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handlePwdUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      if (!pwdForm.currentPassword) throw new Error("Current password is required");
      if (!pwdForm.newEmail && !pwdForm.newPassword) throw new Error("Provide a new email or password");
      if (pwdForm.newPassword && pwdForm.newPassword !== pwdForm.confirmNewPassword)
        throw new Error("Passwords do not match");
      await api.admin.updateAccount(pwdForm);
      toast({ title: "Account updated" });
      setShowChangePwd(false);
      setPwdForm({ currentPassword: "", newEmail: "", newPassword: "", confirmNewPassword: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={zetechLogo} alt="Zetech" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">Admin Dashboard</p>
              <p className="text-xs text-blue-700 font-medium">Zetech Events Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name || user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => setShowChangePwd(true)}>
              <Lock className="w-4 h-4 mr-1" /> Account
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"
              onClick={() => { signOut(); navigate("/auth"); }}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Events", value: stats.totalEvents, color: "blue", icon: Calendar },
              { label: "Pending Approval", value: stats.pendingEvents, color: "yellow", icon: AlertCircle },
              { label: "Upcoming Events", value: stats.upcomingEvents, color: "green", icon: TrendingUp },
              { label: "Students", value: stats.totalStudents, color: "purple", icon: Users },
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="text-3xl font-bold text-gray-800">{value ?? 0}</p>
                    </div>
                    <div className={`w-11 h-11 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingCount > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="events">All Events</TabsTrigger>
            <TabsTrigger value="leaders">Club Leaders</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingEventsTab onAction={loadStats} />
          </TabsContent>

          <TabsContent value="events">
            <AllEventsTab />
          </TabsContent>

          <TabsContent value="leaders">
            <ClubLeadersTab />
          </TabsContent>

          <TabsContent value="students">
            <StudentManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsComponent />
          </TabsContent>
        </Tabs>
      </main>

      {/* Account / Password Dialog */}
      <Dialog open={showChangePwd} onOpenChange={setShowChangePwd}>
        <DialogContent className="max-w-md">
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
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>New Email (optional)</Label>
              <Input type="email" value={pwdForm.newEmail} onChange={(e) => setPwdForm({ ...pwdForm, newEmail: e.target.value })} placeholder="Leave blank to keep current" className="mt-1" />
            </div>
            <div>
              <Label>New Password (optional)</Label>
              <Input type={showPwd ? "text" : "password"} value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} placeholder="Leave blank to keep current" minLength={6} className="mt-1" />
            </div>
            {pwdForm.newPassword && (
              <div>
                <Label>Confirm New Password</Label>
                <Input type={showPwd ? "text" : "password"} value={pwdForm.confirmNewPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmNewPassword: e.target.value })} required className="mt-1" />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowChangePwd(false)}>Cancel</Button>
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
