import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Users,
  Calendar,
  Mail,
  Bell,
  FileText,
  Download,
  Upload,
  Zap,
  Send,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type DialogType =
  | "createEvent"
  | "broadcast"
  | "export"
  | "import"
  | "report"
  | null;

export default function AdminQuickActions() {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    max_participants: "",
  });

  const [broadcastForm, setBroadcastForm] = useState({
    message: "",
    target: "all_students" as "all_students" | "custom",
    recipients: "",
  });

  const [importResult, setImportResult] = useState<{
    imported?: number;
    skipped?: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  const close = () => {
    setOpenDialog(null);
    setImportResult(null);
  };

  const quickActions = [
    {
      icon: Plus,
      label: "Create Event",
      description: "Add a new event",
      color: "blue",
      onClick: () => setOpenDialog("createEvent"),
    },
    {
      icon: Users,
      label: "Add Student",
      description: "Register a student",
      color: "green",
      onClick: () => navigate("/admin?tab=students"),
    },
    {
      icon: Calendar,
      label: "View Events",
      description: "See all events",
      color: "purple",
      onClick: () => navigate("/admin?tab=events"),
    },
    {
      icon: Mail,
      label: "Send Broadcast",
      description: "SMS all students",
      color: "orange",
      onClick: () => setOpenDialog("broadcast"),
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "View pending alerts",
      color: "yellow",
      onClick: () => navigate("/admin?tab=pending"),
    },
    {
      icon: FileText,
      label: "Generate Report",
      description: "Download analytics",
      color: "pink",
      onClick: () => setOpenDialog("report"),
    },
    {
      icon: Download,
      label: "Export Data",
      description: "Download CSV files",
      color: "cyan",
      onClick: () => setOpenDialog("export"),
    },
    {
      icon: Upload,
      label: "Import Data",
      description: "Bulk import students",
      color: "indigo",
      onClick: () => setOpenDialog("import"),
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
    green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200",
    yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200",
    pink: "bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-200",
    cyan: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-200",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200",
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.events.create(eventForm);
      toast({ title: "Event created!", description: "It is now pending admin approval." });
      close();
      setEventForm({
        title: "", description: "", date: "", time: "",
        location: "", category: "", max_participants: "",
      });
    } catch (err: any) {
      toast({ title: "Failed to create event", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.message.trim()) {
      toast({ title: "Message is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload: { message: string; targetGroup?: string; recipients?: string[] } = {
        message: broadcastForm.message.trim(),
      };
      if (broadcastForm.target === "all_students") {
        payload.targetGroup = "all_students";
      } else {
        const nums = broadcastForm.recipients
          .split(/[\n,]/)
          .map((n) => n.trim())
          .filter(Boolean);
        if (!nums.length) {
          toast({ title: "Enter at least one phone number", variant: "destructive" });
          setLoading(false);
          return;
        }
        payload.recipients = nums;
      }
      const res = await api.admin.sendSMS(payload);
      toast({
        title: "Broadcast sent!",
        description: res.message || `Sent to ${res.count} recipient(s)`,
      });
      close();
      setBroadcastForm({ message: "", target: "all_students", recipients: "" });
    } catch (err: any) {
      toast({ title: "Broadcast failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async (type: "students" | "events") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/admin/export/${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any).message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: `${type === "students" ? "Students" : "Events"} exported!`, description: "CSV file downloaded." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setImportResult(null);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("csv", file);
      const res = await fetch("/api/admin/import/students", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import failed");
      setImportResult(data);
      toast({ title: "Import complete!", description: data.message });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          <p className="text-sm text-gray-500">Frequently used admin tasks</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">Fast access</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            variant="outline"
            className={`h-auto p-3 md:p-4 flex flex-col items-center gap-2 border-2 ${colorClasses[action.color]}`}
            onClick={action.onClick}
          >
            <action.icon className="w-5 h-5 md:w-6 md:h-6" />
            <div className="text-center">
              <p className="font-semibold text-xs md:text-sm">{action.label}</p>
              <p className="text-[10px] md:text-xs opacity-75 mt-0.5">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>

      {/* ── Create Event Dialog ───────────────────────────────────── */}
      <Dialog open={openDialog === "createEvent"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quick Event</DialogTitle>
            <DialogDescription>Add a new event — it will be submitted for approval</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            <div>
              <Label>Event Title *</Label>
              <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g., Tech Career Fair 2026" required className="mt-1" />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Describe the event..." required className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <Label>Time *</Label>
                <Input type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Location *</Label>
              <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g., Main Auditorium" required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Input value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} placeholder="e.g., Academic" required className="mt-1" />
              </div>
              <div>
                <Label>Max Participants</Label>
                <Input type="number" value={eventForm.max_participants} onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })} placeholder="Unlimited" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : <><Plus className="w-4 h-4 mr-1" />Create Event</>}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Broadcast Dialog ─────────────────────────────────────── */}
      <Dialog open={openDialog === "broadcast"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send SMS Broadcast</DialogTitle>
            <DialogDescription>Send a message directly to students via SMS</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
            <div>
              <Label>Target Audience</Label>
              <select value={broadcastForm.target} onChange={(e) => setBroadcastForm({ ...broadcastForm, target: e.target.value as any })} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all_students">All Active Students</option>
                <option value="custom">Custom Phone Numbers</option>
              </select>
            </div>
            {broadcastForm.target === "custom" && (
              <div>
                <Label>Phone Numbers</Label>
                <Textarea value={broadcastForm.recipients} onChange={(e) => setBroadcastForm({ ...broadcastForm, recipients: e.target.value })} placeholder={"+254700000001\n+254700000002"} className="mt-1 font-mono text-sm" rows={3} />
                <p className="text-xs text-gray-400 mt-1">One per line, include country code (+254...)</p>
              </div>
            )}
            <div>
              <Label>Message * <span className="text-xs font-normal text-gray-400">({broadcastForm.message.length}/480)</span></Label>
              <Textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} placeholder="Type your message here..." required className="mt-1" rows={4} maxLength={480} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Sending..." : <><Send className="w-4 h-4 mr-1" />Send Broadcast</>}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Export Dialog ────────────────────────────────────────── */}
      <Dialog open={openDialog === "export"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>Download data as CSV files for analysis or backup</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => downloadCSV("students")} disabled={loading}>
              <Users className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Export Students</p>
                <p className="text-xs text-gray-500">All student registrations as CSV</p>
              </div>
              <Download className="w-4 h-4 ml-auto text-gray-400 shrink-0" />
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => downloadCSV("events")} disabled={loading}>
              <Calendar className="w-5 h-5 mr-3 text-purple-600 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Export Events</p>
                <p className="text-xs text-gray-500">All events with details as CSV</p>
              </div>
              <Download className="w-4 h-4 ml-auto text-gray-400 shrink-0" />
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={close}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Report Dialog ────────────────────────────────────────── */}
      <Dialog open={openDialog === "report"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>Download a CSV report file</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => { downloadCSV("students"); close(); }} disabled={loading}>
              <FileText className="w-5 h-5 mr-3 text-green-600 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Student Engagement Report</p>
                <p className="text-xs text-gray-500">Registration data, status, login activity</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => { downloadCSV("events"); close(); }} disabled={loading}>
              <FileText className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Events Summary Report</p>
                <p className="text-xs text-gray-500">All events with categories, status, participation</p>
              </div>
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={close}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Import Dialog ────────────────────────────────────────── */}
      <Dialog open={openDialog === "import"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Students from CSV</DialogTitle>
            <DialogDescription>Bulk-register students using a CSV file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Expected CSV format:</p>
              <p className="font-mono text-xs bg-white border rounded px-3 py-2">
                admissionNumber,firstName,lastName,email,phone,password
              </p>
              <ul className="text-xs mt-2 space-y-1 text-gray-500">
                <li>• <strong>password</strong> is optional — defaults to <code>Zetech@2024</code></li>
                <li>• First row must be the header row</li>
                <li>• Duplicates (same admission number) are silently skipped</li>
              </ul>
            </div>

            <div>
              <Label>Upload CSV File</Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to choose a CSV file</p>
                <p className="text-xs text-gray-400 mt-1">Max 2MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="mt-3 block mx-auto text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImport(f);
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Importing students...
              </div>
            )}

            {importResult && (
              <div className={`rounded-lg p-4 text-sm space-y-2 ${importResult.errors?.length ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
                <div className="flex items-center gap-2 font-medium">
                  {importResult.errors?.length ? (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <span>{importResult.message}</span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Errors ({importResult.errors.length}):</p>
                    <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>
                <X className="w-4 h-4 mr-1" /> Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
