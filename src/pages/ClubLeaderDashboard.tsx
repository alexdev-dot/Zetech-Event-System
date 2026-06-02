import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSocketNotifications } from "@/hooks/useSocketNotifications";
import { useSocket, Notification } from "@/contexts/SocketContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Clock, Users, Plus, LogOut, RefreshCw,
  TrendingUp, CheckCircle, AlertCircle, XCircle, Trash2, Lock, Eye, EyeOff, Menu, X,
  LayoutDashboard, FileText, User as UserIcon, Settings as SettingsIcon, Download, ChevronRight,
  BarChart3, Mail, Bell, History, Edit, Copy, Upload, ImageIcon, CalendarDays, CheckCheck,
  UserCheck, ThumbsUp, ThumbsDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notifIcon(type: Notification["type"]) {
  switch (type) {
    case "registration:success": return <UserCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    case "event:your-event-approved": return <ThumbsUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
    case "event:your-event-rejected": return <ThumbsDown className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    case "event:new-registration": return <Users className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />;
  }
}

const ClubLeaderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications: socketNotifications, unreadCount, markAllRead, clearNotification } = useSocket();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [pendingCount, setPendingCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Event management
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registrations
  const [viewRegs, setViewRegs] = useState<{ event: any; regs: any[] } | null>(null);
  const [regsLoading, setRegsLoading] = useState(false);

  // Password change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmNewPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: "",
    bio: ""
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    emailApprovals: true,
    browserNotifications: true
  });

  // Duration & time-picker state (shared by both create dialogs)
  const [durationType, setDurationType]   = useState<"single" | "multi">("single");
  const [timeHour,     setTimeHour]       = useState("8");
  const [timeMinute,   setTimeMinute]     = useState("00");
  const [timeAmpm,     setTimeAmpm]       = useState<"AM" | "PM">("AM");

  const TIME_HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const TIME_MINUTES = ["00","05","10","15","20","25","30","35","40","45","50","55"];
  const buildTime    = () => `${timeHour.padStart(2,"0")}:${timeMinute} ${timeAmpm}`;

  const resetTimeForm = () => {
    setDurationType("single"); setTimeHour("8"); setTimeMinute("00"); setTimeAmpm("AM");
  };

  const [eventForm, setEventForm] = useState({
    title: "", description: "", date: "", endDate: "", location: "", maxParticipants: "", category: "", imageUrl: "",
  });

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "events", label: "My Events", icon: FileText, badge: pendingCount },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.clubLeader.getDashboard();
      setDashboardData(data);
      setPendingCount(data.stats.pendingCount || 0);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load dashboard", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  useSocketNotifications(user?.id, user?.role, dashboardData?.club || user?.club || undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setNotifOpen((prev) => !prev);
  };

  const handleNotifClick = (notif: Notification) => {
    clearNotification(notif.id);
    setNotifOpen(false);
    if (notif.eventId) navigate(`/events/${notif.eventId}`);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!eventForm.title.trim())       throw new Error("Event title is required");
      if (!eventForm.description.trim()) throw new Error("Event description is required");
      if (!eventForm.date)               throw new Error("Event date is required");
      if (!eventForm.location.trim())    throw new Error("Event venue is required");
      if (!eventForm.imageUrl)           throw new Error("Event flyer is required – please upload an image");
      if (durationType === "multi" && !eventForm.endDate) throw new Error("End date is required for multi-day events");
      if (durationType === "multi" && eventForm.endDate < eventForm.date)
        throw new Error("End date must be on or after the start date");
      if (eventForm.maxParticipants && parseInt(eventForm.maxParticipants) < 1)
        throw new Error("Capacity must be at least 1");

      await api.events.create({
        title:           eventForm.title.trim(),
        description:     eventForm.description.trim(),
        date:            eventForm.date,
        endDate:         durationType === "multi" ? eventForm.endDate : undefined,
        time:            buildTime(),
        location:        eventForm.location.trim(),
        category:        dashboardData?.club || user?.club || "General",
        maxParticipants: eventForm.maxParticipants ? parseInt(eventForm.maxParticipants) : undefined,
        imageUrl:        eventForm.imageUrl,
      });

      toast({ title: "Event submitted!", description: "Your event is awaiting admin approval." });
      setShowCreateEvent(false);
      setEventForm({ title: "", description: "", date: "", endDate: "", location: "", maxParticipants: "", category: "", imageUrl: "" });
      resetTimeForm();
      setUploadedFile(null);
      setPreviewUrl("");
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit event", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Please upload an image file (JPEG, PNG, GIF, or WebP)", variant: "destructive" });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
    
    try {
      // Upload image to server
      const response = await api.upload.image(file);
      const imageUrl = response.imageUrl;
      
      // Store the server URL in form data
      setEventForm(prev => ({
        ...prev,
        imageUrl: imageUrl
      }));
      
      toast({ title: "Success", description: "Flyer uploaded successfully!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to upload flyer", variant: "destructive" });
      // Reset if upload failed
      setUploadedFile(null);
      setPreviewUrl("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setEventForm(prev => ({
      ...prev,
      imageUrl: ""
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetEditForm = () => {
    setShowEditEvent(false);
    setEditingEvent(null);
    setEventForm({ title: "", description: "", date: "", endDate: "", location: "", maxParticipants: "", category: "", imageUrl: "" });
    resetTimeForm();
    setUploadedFile(null);
    setPreviewUrl("");
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!eventForm.title.trim())       throw new Error("Event title is required");
      if (!eventForm.description.trim()) throw new Error("Event description is required");
      if (!eventForm.date)               throw new Error("Event date is required");
      if (!eventForm.location.trim())    throw new Error("Event venue is required");
      if (!eventForm.imageUrl)           throw new Error("Event flyer is required – please upload an image");
      if (durationType === "multi" && !eventForm.endDate) throw new Error("End date is required for multi-day events");
      if (durationType === "multi" && eventForm.endDate < eventForm.date)
        throw new Error("End date must be on or after the start date");

      await api.events.update(String(editingEvent.id), {
        title:           eventForm.title.trim(),
        description:     eventForm.description.trim(),
        date:            eventForm.date,
        endDate:         durationType === "multi" ? eventForm.endDate : undefined,
        time:            buildTime(),
        location:        eventForm.location.trim(),
        category:        dashboardData?.club || user?.club || "General",
        maxParticipants: eventForm.maxParticipants ? parseInt(eventForm.maxParticipants) : undefined,
        imageUrl:        eventForm.imageUrl,
      });

      toast({ title: "Event resubmitted!", description: "Your changes are awaiting admin approval." });
      resetEditForm();
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update event", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string | number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
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

  const exportRegistrations = () => {
    if (!viewRegs?.regs) return;
    const csv = [
      ["First Name", "Last Name", "Admission Number", "Email", "Registration Date"],
      ...viewRegs.regs.map((r: any) => [
        r.first_name, r.last_name, r.admission_number, r.email, r.registration_date
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${viewRegs.event.title}_registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Registrations exported" });
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      localStorage.setItem('clubLeaderProfile', JSON.stringify(profileForm));
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditEvent = (event: any) => {
    setEditingEvent(event);

    // Parse stored time string "09:30 AM" → picker state
    const rawTime: string = event.time || "08:00 AM";
    const [timePart, periodPart] = rawTime.split(" ");
    const [hStr, mStr] = (timePart || "08:00").split(":");
    const parsedHour = parseInt(hStr || "8", 10);
    setTimeHour(String(isNaN(parsedHour) || parsedHour === 0 ? 8 : parsedHour));
    setTimeMinute(mStr && TIME_MINUTES.includes(mStr) ? mStr : "00");
    setTimeAmpm((periodPart === "PM" ? "PM" : "AM") as "AM" | "PM");

    // Detect multi-day
    const hasEndDate = !!event.end_date && event.end_date !== event.date;
    setDurationType(hasEndDate ? "multi" : "single");

    setEventForm({
      title:           event.title            || "",
      description:     event.description      || "",
      date:            event.date             || "",
      endDate:         hasEndDate ? event.end_date : "",
      location:        event.location         || "",
      maxParticipants: event.max_participants ? String(event.max_participants) : "",
      category:        event.category         || "",
      imageUrl:        event.image_url        || "",
    });
    setPreviewUrl(event.image_url || "");
    setUploadedFile(null);
    setShowEditEvent(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 fixed left-0 top-0 h-full z-30 hidden md:flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={zetechLogo} alt="Zetech" className="w-10 h-10 object-contain" />
            {sidebarOpen && (
              <div>
                <p className="font-semibold text-gray-800 text-sm leading-tight">Club Leader</p>
                <p className="text-xs text-green-600">{dashboardData?.club || user?.club}</p>
              </div>
            )}
          </div>
        </div>

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
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-green-600" : "text-gray-400"}`} />
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

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
              {(user?.name || user?.email)?.[0]?.toUpperCase() || "C"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.name || "Club Leader"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowChangePassword(true)}>
                <Lock className="w-4 h-4 mr-2" /> Change Password
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={() => { signOut(); navigate("/auth"); }}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          )}
          {!sidebarOpen && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="flex-1" onClick={() => setShowChangePassword(true)} title="Change Password">
                <Lock className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => { signOut(); navigate("/auth"); }} title="Sign Out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-180" />}
        </button>
      </aside>

      {/* Desktop Header */}
      <header className="hidden md:flex bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20 h-16 items-center justify-end px-6" style={{ marginLeft: sidebarOpen ? '16rem' : '5rem' }}>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={handleBellClick}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y">
                  {socketNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                      <Bell className="w-7 h-7 opacity-30" />
                      <span className="text-sm">No notifications yet</span>
                    </div>
                  ) : (
                    socketNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/60 ${
                          !notif.read ? "bg-primary/5" : ""
                        }`}
                      >
                        {notifIcon(notif.type)}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {timeAgo(notif.timestamp)}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {socketNotifications.length > 0 && (
                  <div className="px-4 py-2 border-t bg-muted/30 text-center">
                    <button
                      onClick={() => { markAllRead(); setNotifOpen(false); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { signOut(); navigate("/auth"); }}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20 w-full">
        <div className="px-3 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
            <img src={zetechLogo} alt="Zetech" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-800 text-sm leading-tight">Club Leader</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={handleBellClick}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y">
                    {socketNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                        <Bell className="w-7 h-7 opacity-30" />
                        <span className="text-sm">No notifications yet</span>
                      </div>
                    ) : (
                      socketNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/60 ${
                            !notif.read ? "bg-primary/5" : ""
                          }`}
                        >
                          {notifIcon(notif.type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {timeAgo(notif.timestamp)}
                            </p>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {socketNotifications.length > 0 && (
                    <div className="px-4 py-2 border-t bg-muted/30 text-center">
                      <button
                        onClick={() => { markAllRead(); setNotifOpen(false); }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="text-red-600 h-9 w-9" onClick={() => { signOut(); navigate("/auth"); }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setSidebarOpen(false)}>
          <aside className="w-72 sm:w-80 bg-white h-full flex flex-col animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={zetechLogo} alt="Zetech" className="w-10 h-10 object-contain" />
                <div>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">Club Leader</p>
                  <p className="text-xs text-green-600">{dashboardData?.club || user?.club}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-9 w-9">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-green-600" : "text-gray-400"}`} />
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
            <div className="p-4 border-t border-gray-200">
              <Button variant="outline" size="sm" className="w-full justify-start h-10" onClick={() => setShowChangePassword(true)}>
                <Lock className="w-4 h-4 mr-2" /> Change Password
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`pt-14 md:pt-16 overflow-x-hidden overflow-y-auto min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-6xl mx-auto">
          {activeView === "dashboard" && (
            <>
              <div className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(" ")[0]}!</h1>
                <p className="text-gray-500 mt-1 text-sm md:text-base">Manage your club events and track registrations.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 lg:mb-8">
                {[
                  { label: "My Events", value: dashboardData?.stats.totalMyEvents ?? 0, color: "blue", icon: Calendar, gradient: "from-blue-500 to-blue-600" },
                  { label: "Pending", value: dashboardData?.stats.pendingCount ?? 0, color: "yellow", icon: AlertCircle, gradient: "from-amber-500 to-orange-500" },
                  { label: "Approved", value: dashboardData?.stats.upcomingCount ?? 0, color: "green", icon: CheckCircle, gradient: "from-emerald-500 to-green-600" },
                  { label: "Registrations", value: dashboardData?.stats.totalRegistrations ?? 0, color: "purple", icon: Users, gradient: "from-purple-500 to-indigo-600" },
                ].map(({ label, value, color, icon: Icon, gradient }) => (
                  <Card key={label} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <CardContent className="p-3 sm:p-4 md:p-6 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm md:text-sm font-medium text-gray-500 mb-1">{label}</p>
                          <p className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800">{value}</p>
                        </div>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-gradient-to-br ${gradient} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
                      <CardDescription className="text-xs md:text-sm">Common tasks for managing your events</CardDescription>
                    </div>
                    <Dialog open={showCreateEvent} onOpenChange={(open) => {
                      setShowCreateEvent(open);
                      if (!open) {
                        setEventForm({ title: "", description: "", date: "", endDate: "", location: "", maxParticipants: "", category: "", imageUrl: "" });
                        resetTimeForm();
                        setUploadedFile(null);
                        setPreviewUrl("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-1" /> Create Event</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

                          {/* ── Duration toggle ── */}
                          <div>
                            <Label className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4" /> Event Duration *</Label>
                            <div className="flex gap-2">
                              {(["single","multi"] as const).map(t => (
                                <button key={t} type="button"
                                  onClick={() => { setDurationType(t); if (t==="single") setEventForm(f=>({...f,endDate:""})); }}
                                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all
                                    ${durationType===t ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                                  {t==="single" ? "📅 Single Day" : "📅📅 Multiple Days"}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ── Date(s) ── */}
                          <div className={`grid gap-3 ${durationType==="multi" ? "grid-cols-2" : "grid-cols-1"}`}>
                            <div>
                              <Label>{durationType==="multi" ? "Start Date *" : "Date *"}</Label>
                              <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required className="mt-1" min={new Date().toISOString().split("T")[0]} />
                            </div>
                            {durationType==="multi" && (
                              <div>
                                <Label>End Date *</Label>
                                <Input type="date" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} required className="mt-1" min={eventForm.date || new Date().toISOString().split("T")[0]} />
                              </div>
                            )}
                          </div>

                          {/* ── Time picker ── */}
                          <div>
                            <Label className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4" /> Start Time *</Label>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Select value={timeHour} onValueChange={setTimeHour}>
                                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>{TIME_HOURS.map(h=><SelectItem key={h} value={h}>{h.padStart(2,"0")}</SelectItem>)}</SelectContent>
                              </Select>
                              <span className="font-bold text-muted-foreground">:</span>
                              <Select value={timeMinute} onValueChange={setTimeMinute}>
                                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>{TIME_MINUTES.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                              </Select>
                              <div className="flex rounded-lg border overflow-hidden">
                                {(["AM","PM"] as const).map(p=>(
                                  <button key={p} type="button" onClick={()=>setTimeAmpm(p)}
                                    className={`px-3 py-2 text-sm font-semibold transition-all ${timeAmpm===p ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                                    {p}
                                  </button>
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-2 rounded font-mono">{buildTime()}</span>
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
                          <div>
                            <Label className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Event Flyer *
                            </Label>
                            
                            {previewUrl ? (
                              <div className="mt-2 relative">
                                <div className="border rounded-lg overflow-hidden">
                                  <img 
                                    src={previewUrl} 
                                    alt="Event flyer preview" 
                                    className="w-full h-40 object-cover"
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="text-xs text-gray-600">
                                    {uploadedFile?.name} ({(uploadedFile?.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) : '0')} MB)
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={removeFile}
                                    className="text-red-600 hover:text-red-700 h-8"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                                  isDragging
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                              >
                                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {isDragging ? "Drop your flyer here" : "Upload event flyer"}
                                </p>
                                <p className="text-xs text-gray-500 mb-2">
                                  Drag and drop, or click to browse
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Choose File
                                </Button>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>This event will be reviewed by an admin before it becomes visible to students.</span>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowCreateEvent(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                              {isSubmitting ? "Submitting..." : "Submit for Approval"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => setActiveView("events")} className="h-20 flex flex-col items-center justify-center gap-2">
                      <FileText className="w-6 h-6" />
                      <span className="text-sm">View All Events</span>
                    </Button>
                    <Button variant="outline" onClick={() => setActiveView("analytics")} className="h-20 flex flex-col items-center justify-center gap-2">
                      <BarChart3 className="w-6 h-6" />
                      <span className="text-sm">View Analytics</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeView === "events" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base md:text-lg">My Club Events</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Events you have submitted for <strong>{dashboardData?.club || user?.club}</strong>
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateEvent} onOpenChange={(open) => {
                    setShowCreateEvent(open);
                    if (!open) {
                      setEventForm({ title: "", description: "", date: "", endDate: "", location: "", maxParticipants: "", category: "", imageUrl: "" });
                      resetTimeForm();
                      setUploadedFile(null);
                      setPreviewUrl("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-1" /> New Event</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

                        {/* ── Duration toggle ── */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4" /> Event Duration *</Label>
                          <div className="flex gap-2">
                            {(["single","multi"] as const).map(t => (
                              <button key={t} type="button"
                                onClick={() => { setDurationType(t); if (t==="single") setEventForm(f=>({...f,endDate:""})); }}
                                className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all
                                  ${durationType===t ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                                {t==="single" ? "📅 Single Day" : "📅📅 Multiple Days"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── Date(s) ── */}
                        <div className={`grid gap-3 ${durationType==="multi" ? "grid-cols-2" : "grid-cols-1"}`}>
                          <div>
                            <Label>{durationType==="multi" ? "Start Date *" : "Date *"}</Label>
                            <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required className="mt-1" min={new Date().toISOString().split("T")[0]} />
                          </div>
                          {durationType==="multi" && (
                            <div>
                              <Label>End Date *</Label>
                              <Input type="date" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} required className="mt-1" min={eventForm.date || new Date().toISOString().split("T")[0]} />
                            </div>
                          )}
                        </div>

                        {/* ── Time picker ── */}
                        <div>
                          <Label className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4" /> Start Time *</Label>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select value={timeHour} onValueChange={setTimeHour}>
                              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                              <SelectContent>{TIME_HOURS.map(h=><SelectItem key={h} value={h}>{h.padStart(2,"0")}</SelectItem>)}</SelectContent>
                            </Select>
                            <span className="font-bold text-muted-foreground">:</span>
                            <Select value={timeMinute} onValueChange={setTimeMinute}>
                              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                              <SelectContent>{TIME_MINUTES.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                            <div className="flex rounded-lg border overflow-hidden">
                              {(["AM","PM"] as const).map(p=>(
                                <button key={p} type="button" onClick={()=>setTimeAmpm(p)}
                                  className={`px-3 py-2 text-sm font-semibold transition-all ${timeAmpm===p ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                                  {p}
                                </button>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-2 rounded font-mono">{buildTime()}</span>
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
                        <div>
                          <Label className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Event Flyer (Optional)
                          </Label>
                          
                          {previewUrl ? (
                            <div className="mt-2 relative">
                              <div className="border rounded-lg overflow-hidden">
                                <img 
                                  src={previewUrl} 
                                  alt="Event flyer preview" 
                                  className="w-full h-40 object-cover"
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <p className="text-xs text-gray-600">
                                  {uploadedFile?.name} ({(uploadedFile?.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) : '0')} MB)
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={removeFile}
                                  className="text-red-600 hover:text-red-700 h-8"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                                isDragging
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {isDragging ? "Drop your flyer here" : "Upload event flyer"}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                Drag and drop, or click to browse
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Choose File
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowCreateEvent(false)}>Cancel</Button>
                          <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                            {isSubmitting ? "Submitting..." : "Submit for Approval"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {!dashboardData?.myEvents?.length ? (
                  <div className="text-center py-12 md:py-16 text-gray-400 px-4">
                    <Calendar className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-sm md:text-base">No events yet</p>
                    <p className="text-xs md:text-sm mt-1">Submit your first event for admin approval.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.myEvents.map((event: any) => (
                      <div key={event.id} className={`p-3 md:p-4 border rounded-xl transition-colors ${event.status === "rejected" ? "bg-rose-50 border-rose-100" : event.status === "pending" ? "bg-yellow-50 border-yellow-100" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-800 truncate text-sm md:text-base">{event.title}</h3>
                              <StatusBadge status={event.status} />
                            </div>
                            {event.status === "rejected" && (
                              <p className="text-xs text-rose-600 mb-2">This event was not approved. You may delete it and submit a revised version.</p>
                            )}
                            {event.status === "pending" && (
                              <p className="text-xs text-yellow-700 mb-2">Waiting for admin review — not yet visible to students.</p>
                            )}
                            <p className="text-xs md:text-sm text-gray-500 line-clamp-1 mb-2">{event.description}</p>
                            <div className="flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1 text-xs text-gray-500">
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
                            {["pending","rejected","upcoming"].includes(event.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-500 hover:bg-blue-50"
                                onClick={() => openEditEvent(event)}
                                title={event.status === "upcoming" ? "Edit & resubmit for approval" : "Edit event"}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {!["pending","rejected"].includes(event.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-500 hover:bg-blue-50"
                                onClick={() => viewRegistrations(event)}
                                title="View registrations"
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                            )}
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeView === "analytics" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Analytics</CardTitle>
                <CardDescription>Track your event performance and registration trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-4">Registration Trends</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Registrations</span>
                        <span className="font-bold text-gray-800">{dashboardData?.stats.totalRegistrations ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average per Event</span>
                        <span className="font-bold text-gray-800">
                          {dashboardData?.stats.totalMyEvents ? Math.round((dashboardData.stats.totalRegistrations / dashboardData.stats.totalMyEvents) * 10) / 10 : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Approval Rate</span>
                        <span className="font-bold text-green-600">
                          {dashboardData?.stats.totalMyEvents ? Math.round(((dashboardData.stats.upcomingCount / dashboardData.stats.totalMyEvents) * 100)) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-4">Event Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Approved Events</span>
                        <span className="font-bold text-green-600">{dashboardData?.stats.upcomingCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Approval</span>
                        <span className="font-bold text-yellow-600">{dashboardData?.stats.pendingCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Events</span>
                        <span className="font-bold text-gray-800">{dashboardData?.stats.totalMyEvents ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeView === "profile" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" />Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="John Doe" disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+254 700 000 000" disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} disabled={isSubmitting} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                      {isSubmitting ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeView === "settings" && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" />Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2"><Mail className="h-4 w-4" />Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailReminders">Registration reminders</Label>
                      <Switch id="emailReminders" checked={notificationSettings.emailReminders} onCheckedChange={() => setNotificationSettings({ ...notificationSettings, emailReminders: !notificationSettings.emailReminders })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailApprovals">Event approval notifications</Label>
                      <Switch id="emailApprovals" checked={notificationSettings.emailApprovals} onCheckedChange={() => setNotificationSettings({ ...notificationSettings, emailApprovals: !notificationSettings.emailApprovals })} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2"><Bell className="h-4 w-4" />Browser Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="browserNotifications">Enable browser notifications</Label>
                      <Switch id="browserNotifications" checked={notificationSettings.browserNotifications} onCheckedChange={() => setNotificationSettings({ ...notificationSettings, browserNotifications: !notificationSettings.browserNotifications })} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => toast({ title: "Settings saved" })} className="bg-green-600 hover:bg-green-700">Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 text-center text-xs text-gray-500 border-t border-gray-200">
          <p>&copy; {new Date().getFullYear()} Zetech University. All rights reserved.</p>
          <p className="mt-1">Club Leader Portal v1.0</p>
        </div>
      </main>

      {/* Edit Event Dialog */}
      <Dialog open={showEditEvent} onOpenChange={(open) => { if (!open) resetEditForm(); else setShowEditEvent(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-green-600" /> Edit & Resubmit Event
            </DialogTitle>
          </DialogHeader>

          {/* Re-approval banner */}
          <div className="px-1">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <span>Saving changes will reset this event to <strong>Pending</strong> — an admin must approve it again before it becomes visible to students.</span>
            </div>
          </div>

          <form onSubmit={handleEditEvent} className="space-y-4 pt-1">
            <div>
              <Label>Event Title *</Label>
              <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows={3} required className="mt-1" />
            </div>

            {/* ── Duration toggle ── */}
            <div>
              <Label className="flex items-center gap-2 mb-2"><CalendarDays className="h-4 w-4" /> Event Duration *</Label>
              <div className="flex gap-2">
                {(["single","multi"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => { setDurationType(t); if (t==="single") setEventForm(f=>({...f,endDate:""})); }}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all
                      ${durationType===t ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {t==="single" ? "📅 Single Day" : "📅📅 Multiple Days"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Date(s) ── */}
            <div className={`grid gap-3 ${durationType==="multi" ? "grid-cols-2" : "grid-cols-1"}`}>
              <div>
                <Label>{durationType==="multi" ? "Start Date *" : "Date *"}</Label>
                <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required className="mt-1" />
              </div>
              {durationType==="multi" && (
                <div>
                  <Label>End Date *</Label>
                  <Input type="date" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} required className="mt-1" min={eventForm.date} />
                </div>
              )}
            </div>

            {/* ── AM/PM Time picker ── */}
            <div>
              <Label className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4" /> Start Time *</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={timeHour} onValueChange={setTimeHour}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_HOURS.map(h=><SelectItem key={h} value={h}>{h.padStart(2,"0")}</SelectItem>)}</SelectContent>
                </Select>
                <span className="font-bold text-muted-foreground">:</span>
                <Select value={timeMinute} onValueChange={setTimeMinute}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_MINUTES.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex rounded-lg border overflow-hidden">
                  {(["AM","PM"] as const).map(p=>(
                    <button key={p} type="button" onClick={()=>setTimeAmpm(p)}
                      className={`px-3 py-2 text-sm font-semibold transition-all ${timeAmpm===p ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-2 rounded font-mono">{buildTime()}</span>
              </div>
            </div>

            <div>
              <Label>Venue *</Label>
              <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label>Max Participants (optional)</Label>
              <Input type="number" value={eventForm.maxParticipants} onChange={(e) => setEventForm({ ...eventForm, maxParticipants: e.target.value })} min="1" className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Event Flyer (Optional)
              </Label>
              
              {previewUrl ? (
                <div className="mt-2 relative">
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Event flyer preview" 
                      className="w-full h-40 object-cover"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      {uploadedFile?.name} ({(uploadedFile?.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) : '0')} MB)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-700 h-8"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {isDragging ? "Drop your flyer here" : "Upload event flyer"}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Drag and drop, or click to browse
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetEditForm}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? "Resubmitting..." : "Save & Resubmit for Approval"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registrations Dialog */}
      <Dialog open={!!viewRegs} onOpenChange={() => setViewRegs(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Registrations — {viewRegs?.event?.title}</DialogTitle>
              <Button variant="outline" size="sm" onClick={exportRegistrations}>
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
            </div>
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

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
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
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubLeaderDashboard;
