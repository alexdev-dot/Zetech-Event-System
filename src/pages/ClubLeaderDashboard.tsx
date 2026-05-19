import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Clock, Users, Plus, LogOut, RefreshCw,
  TrendingUp, CheckCircle, AlertCircle, Edit, Trash2, Lock, Eye, EyeOff
} from "lucide-react";
import zetechLogo from "@/assets/zetech-logo.png";
import { format } from "date-fns";

interface DashboardData {
  club: string;
  stats: {
    totalMyEvents: number;
    totalRegistrations: number;
    upcomingCount: number;
  };
  myEvents: any[];
}

const ClubLeaderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    maxParticipants: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
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

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.date || !eventForm.time || !eventForm.location.trim()) {
        throw new Error("All required fields must be filled");
      }
      if (eventForm.maxParticipants && parseInt(eventForm.maxParticipants) < 1) {
        throw new Error("Capacity must be at least 1");
      }

      await api.events.create({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        date: eventForm.date,
        time: eventForm.time,
        location: eventForm.location.trim(),
        category: dashboardData?.club || user?.club || "",
        maxParticipants: eventForm.maxParticipants ? parseInt(eventForm.maxParticipants) : undefined,
      });

      toast({ title: "Event Created!", description: "Your event is now live for students to register." });
      setShowCreateEvent(false);
      setEventForm({ title: "", description: "", date: "", time: "", location: "", maxParticipants: "" });
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create event", variant: "destructive" });
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
        throw new Error("Passwords do not match");
      }
      if (passwordForm.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      await api.clubLeader.updateAccount({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });
      toast({ title: "Password changed successfully" });
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-600",
      cancelled: "bg-red-100 text-red-700",
    };
    return variants[status] || "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), "MMM d, yyyy"); } catch { return dateStr; }
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
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="curPwd">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="curPwd"
                        type={showPwd ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPwd">New Password</Label>
                    <Input id="newPwd" type={showPwd ? "text" : "password"} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPwd">Confirm New Password</Label>
                    <Input id="confirmPwd" type={showPwd ? "text" : "password"} value={passwordForm.confirmNewPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })} required minLength={6} className="mt-1" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowChangePassword(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Update Password"}
                    </Button>
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
          <p className="text-gray-500 mt-1">Manage your club events and track registrations below.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">My Events</p>
                  <p className="text-3xl font-bold text-gray-800">{dashboardData?.stats.totalMyEvents ?? 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Registrations</p>
                  <p className="text-3xl font-bold text-gray-800">{dashboardData?.stats.totalRegistrations ?? 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-800">{dashboardData?.stats.upcomingCount ?? 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">My Club Events</CardTitle>
                <CardDescription>Events you have created for <strong>{dashboardData?.club || user?.club}</strong></CardDescription>
              </div>

              <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Club Event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="evTitle">Event Title *</Label>
                      <Input id="evTitle" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. Annual Hackathon 2026" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="evDesc">Description *</Label>
                      <Textarea id="evDesc" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Describe your event..." rows={3} required className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="evDate">Date *</Label>
                        <Input id="evDate" type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required className="mt-1" min={new Date().toISOString().split("T")[0]} />
                      </div>
                      <div>
                        <Label htmlFor="evTime">Time *</Label>
                        <Input id="evTime" type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} required className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="evLocation">Venue *</Label>
                      <Input id="evLocation" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g. Main Hall, Ruiru Campus" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="evCapacity">Max Participants (optional)</Label>
                      <Input id="evCapacity" type="number" value={eventForm.maxParticipants} onChange={(e) => setEventForm({ ...eventForm, maxParticipants: e.target.value })} placeholder="Leave blank for unlimited" min="1" className="mt-1" />
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>This event will be published immediately under <strong>{dashboardData?.club || user?.club}</strong> and visible to all students.</span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateEvent(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</span>
                        ) : (
                          <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Create Event</span>
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
                <p className="text-sm mt-1">Create your first event using the button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.myEvents.map((event: any) => (
                  <div key={event.id} className="flex items-start justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800 truncate">{event.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">{event.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {event.time?.substring(0, 5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.registered_count ?? 0}
                          {event.max_participants ? ` / ${event.max_participants}` : ""} registered
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteEvent(event.id)}
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          Events you create are immediately visible to students on the events page.
          Contact the administrator to update or transfer events.
        </p>
      </main>
    </div>
  );
};

export default ClubLeaderDashboard;
