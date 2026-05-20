import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Clock, Users, Plus, LogOut, RefreshCw,
  TrendingUp, CheckCircle, AlertCircle, XCircle, Trash2, Lock, Eye, EyeOff
} from "lucide-react";
import zetechLogo from "@/assets/zetech-logo.png";
import { format } from "date-fns";

interface DashboardData {
  club: string;
  stats: {
    totalMyEvents: number;
    pendingCount: number;
    upcomingCount: number;
    totalRegistrations: number;
  };
  myEvents: any[];
}

const statusConfig: Record<string, { label: string; classes: string; icon: React.ElementType }> = {
  pending:   { label: "Awaiting Approval", classes: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle },
  upcoming:  { label: "Approved – Upcoming", classes: "bg-blue-100 text-blue-800 border-blue-200",   icon: CheckCircle },
  ongoing:   { label: "Ongoing",            classes: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  completed: { label: "Completed",          classes: "bg-gray-100 text-gray-600 border-gray-200",    icon: CheckCircle },
  cancelled: { label: "Cancelled",          classes: "bg-red-100 text-red-700 border-red-200",       icon: XCircle    },
  rejected:  { label: "Rejected",           classes: "bg-rose-100 text-rose-700 border-rose-200",    icon: XCircle    },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, classes: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function fmtDate(d: string) {
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; }
}

const ClubLeaderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registrations view
  const [viewRegs, setViewRegs] = useState<{ event: any; regs: any[] } | null>(null);
  const [regsLoading, setRegsLoading] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: "", description: "", date: "", time: "", location: "", maxParticipants: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmNewPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.clubLeader.getDashboard();
      setDashboardData(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load dashboard", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.date || !eventForm.time || !eventForm.location.trim())
        throw new Error("All required fields must be filled");
      if (eventForm.maxParticipants && parseInt(eventForm.maxParticipants) < 1)
        throw new Error("Capacity must be at least 1");

      await api.events.create({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        date: eventForm.date,
        time: eventForm.time,
        location: eventForm.location.trim(),
        category: dashboardData?.club || user?.club || "General",
        maxParticipants: eventForm.maxParticipants ? parseInt(eventForm.maxParticipants) : undefined,
      });

      toast({ title: "Event submitted!", description: "Your event is awaiting admin approval before students can see it." });
      setShowCreateEvent(false);
      setEventForm({ title: "", description: "", date: "", time: "", location: "", maxParticipants: "" });
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit event", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string | number) => {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    try {
      await api.events.delete(String(eventId));
      toast({ title: "Event deleted" });
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete event", variant: "destructive" });
    }
  };

  const viewRegistrations = async (ev: any) => {
    setViewRegs({ event: ev, regs: [] });
    setRegsLoading(true);
    try {
      const regs = await api.clubLeader.getEventRegistrations(ev.id);
      setViewRegs({ event: ev, regs });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRegsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (passwordForm.newPassword !== passwordForm.confirmNewPassword)
        throw new Error("Passwords do not match");
      if (passwordForm.newPassword.length < 6)
        throw new Error("Password must be at least 6 characters");
      await api.clubLeader.updateAccount(passwordForm);
      toast({ title: "Password changed successfully" });
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={zetechLogo} alt="Zetech" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">Club Leader Portal</p>
              <p className="text-xs text-green-700 font-medium">{dashboardData?.club || user?.club || "Club"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>

            <Button variant="ghost" size="sm" onClick={loadDashboard} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Lock className="w-4 h-4 mr-1" /> Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                  <div>
                    <Label>Current Password</Label>
                    <div className="relative mt-1">
                      <Input type={showPwd ? "text" : "password"} value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="pr-10" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input type={showPwd ? "text" : "password"} value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} className="mt-1" />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input type={showPwd ? "text" : "password"} value={passwordForm.confirmNewPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })} required minLength={6} className="mt-1" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Update Password"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/auth"); }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-gray-500 mt-1">Submit events for admin approval and track your club's registrations.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "My Events",     value: dashboardData?.stats.totalMyEvents ?? 0,    color: "blue",   icon: Calendar   },
            { label: "Pending",       value: dashboardData?.stats.pendingCount ?? 0,     color: "yellow", icon: AlertCircle },
            { label: "Approved",      value: dashboardData?.stats.upcomingCount ?? 0,    color: "green",  icon: CheckCircle },
            { label: "Registrations", value: dashboardData?.stats.totalRegistrations ?? 0, color: "orange", icon: Users },
          ].map(({ label, value, color, icon: Icon }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                  </div>
                  <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Events section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">My Club Events</CardTitle>
                <CardDescription>
                  Events you have submitted for <strong>{dashboardData?.club || user?.club}</strong>
                </CardDescription>
              </div>

              <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Event</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Submit Event for Approval</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
                    <div>
                      <Label>Event Title *</Label>
                      <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. Annual Hackathon 2026" required className="mt-1" />
                    </div>
                    <div>
                      <Label>Description *</Label>
                      <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Describe your event..." rows={3} required className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Date *</Label>
                        <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required className="mt-1" min={new Date().toISOString().split("T")[0]} />
                      </div>
                      <div>
                        <Label>Time *</Label>
                        <Input type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} required className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label>Venue *</Label>
                      <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g. Main Hall, Ruiru Campus" required className="mt-1" />
                    </div>
                    <div>
                      <Label>Max Participants (optional)</Label>
                      <Input type="number" value={eventForm.maxParticipants} onChange={(e) => setEventForm({ ...eventForm, maxParticipants: e.target.value })} placeholder="Leave blank for unlimited" min="1" className="mt-1" />
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>This event will be reviewed by an admin before it becomes visible to students.</span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateEvent(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</span>
                        ) : (
                          <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Submit for Approval</span>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {!dashboardData?.myEvents?.length ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No events yet</p>
                <p className="text-sm mt-1">Submit your first event for admin approval.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.myEvents.map((event: any) => (
                  <div key={event.id} className={`p-4 border rounded-xl transition-colors ${event.status === "rejected" ? "bg-rose-50 border-rose-100" : event.status === "pending" ? "bg-yellow-50 border-yellow-100" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-800 truncate">{event.title}</h3>
                          <StatusBadge status={event.status} />
                        </div>
                        {event.status === "rejected" && (
                          <p className="text-xs text-rose-600 mb-2">This event was not approved. You may delete it and submit a revised version.</p>
                        )}
                        {event.status === "pending" && (
                          <p className="text-xs text-yellow-700 mb-2">Waiting for admin review — not yet visible to students.</p>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">{event.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(event.date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time?.substring(0, 5)}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => viewRegistrations(event)}
                            >
                              {event.registered_count ?? 0}{event.max_participants ? `/${event.max_participants}` : ""} registered
                            </button>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {event.status !== "pending" && (
                          <Button
                            variant="ghost" size="sm"
                            className="text-blue-500 hover:bg-blue-50"
                            onClick={() => viewRegistrations(event)}
                            title="View registrations"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteEvent(event.id)}
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          Events you submit go to admin for review. Once approved they become visible to students. Contact the admin for urgent changes.
        </p>
      </main>

      {/* Registrations Dialog */}
      <Dialog open={!!viewRegs} onOpenChange={() => setViewRegs(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrations — {viewRegs?.event?.title}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {regsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : viewRegs?.regs.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No students registered yet.</p>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">{viewRegs?.regs.length} student{viewRegs?.regs.length !== 1 ? "s" : ""} registered</p>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {viewRegs?.regs.map((r, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{r.first_name} {r.last_name}</p>
                        <p className="text-xs text-gray-500">{r.admission_number}</p>
                      </div>
                      <span className="text-xs text-gray-400">{fmtDate(r.registration_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubLeaderDashboard;
