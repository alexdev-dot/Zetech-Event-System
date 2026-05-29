import { useState, useRef } from "react";
import {
  Card,
  CardContent,
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
  Send,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type DialogType = "createEvent" | "broadcast" | "export" | "import" | "report" | null;

interface Props {
  onNavigate?: (view: string) => void;
}

export default function AdminQuickActions({ onNavigate }: Props) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [eventForm, setEventForm] = useState({
    title: "", description: "", date: "", time: "",
    location: "", category: "", max_participants: "",
  });
  const [broadcastForm, setBroadcastForm] = useState({
    message: "", target: "all_students" as "all_students" | "custom", recipients: "",
  });
  const [importResult, setImportResult] = useState<{
    imported?: number; skipped?: number; errors?: string[]; message?: string;
  } | null>(null);

  const close = () => { setOpenDialog(null); setImportResult(null); };

  const actions = [
    {
      icon: Plus,
      label: "Create Event",
      desc: "Add a new event",
      gradient: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-200",
      onClick: () => setOpenDialog("createEvent"),
    },
    {
      icon: Users,
      label: "Manage Students",
      desc: "View & edit students",
      gradient: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-200",
      onClick: () => onNavigate?.("students"),
    },
    {
      icon: Calendar,
      label: "All Events",
      desc: "Browse all events",
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-200",
      onClick: () => onNavigate?.("events"),
    },
    {
      icon: Mail,
      label: "Broadcast SMS",
      desc: "Message students",
      gradient: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-200",
      onClick: () => setOpenDialog("broadcast"),
    },
    {
      icon: Bell,
      label: "Pending Review",
      desc: "Approve events",
      gradient: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-200",
      onClick: () => onNavigate?.("pending"),
    },
    {
      icon: FileText,
      label: "Reports",
      desc: "Download analytics",
      gradient: "from-teal-500 to-cyan-600",
      shadow: "shadow-teal-200",
      onClick: () => setOpenDialog("report"),
    },
    {
      icon: Download,
      label: "Export CSV",
      desc: "Download data files",
      gradient: "from-sky-500 to-blue-500",
      shadow: "shadow-sky-200",
      onClick: () => setOpenDialog("export"),
    },
    {
      icon: Upload,
      label: "Import Students",
      desc: "Bulk CSV import",
      gradient: "from-indigo-500 to-violet-600",
      shadow: "shadow-indigo-200",
      onClick: () => setOpenDialog("import"),
    },
  ];

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.events.create(eventForm);
      toast({ title: "Event created!", description: "Submitted for approval." });
      close();
      setEventForm({ title: "", description: "", date: "", time: "", location: "", category: "", max_participants: "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.message.trim()) { toast({ title: "Message required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const payload: { message: string; targetGroup?: string; recipients?: string[] } = { message: broadcastForm.message.trim() };
      if (broadcastForm.target === "all_students") {
        payload.targetGroup = "all_students";
      } else {
        const nums = broadcastForm.recipients.split(/[\n,]/).map(n => n.trim()).filter(Boolean);
        if (!nums.length) { toast({ title: "Add phone numbers", variant: "destructive" }); setLoading(false); return; }
        payload.recipients = nums;
      }
      const res = await api.admin.sendSMS(payload);
      toast({ title: "Broadcast sent!", description: res.message || `Sent to ${res.count} recipients` });
      close();
      setBroadcastForm({ message: "", target: "all_students", recipients: "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const downloadCSV = async (type: "students" | "events") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/admin/export/${type}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as any).message || "Export failed"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: `${type === "students" ? "Students" : "Events"} exported!` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleImport = async (file: File) => {
    if (!file.name.endsWith(".csv")) { toast({ title: "Upload a .csv file", variant: "destructive" }); return; }
    setLoading(true); setImportResult(null);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData(); formData.append("csv", file);
      const res = await fetch("/api/admin/import/students", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import failed");
      setImportResult(data);
      toast({ title: "Import complete!", description: data.message });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-500">Fast access to common tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={action.onClick}
            className="group relative flex flex-col items-center gap-3 p-4 md:p-5 bg-white rounded-xl border border-gray-100 hover:border-transparent hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} shadow-md ${action.shadow} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm leading-tight">{action.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{action.desc}</p>
            </div>
            <ArrowRight className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* ── Create Event ── */}
      <Dialog open={openDialog === "createEvent"} onOpenChange={o => !o && close()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Submit a new event for admin approval</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            <div><Label>Title *</Label><Input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="Event title" required className="mt-1" /></div>
            <div><Label>Description *</Label><Textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} required className="mt-1" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date *</Label><Input type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} required className="mt-1" /></div>
              <div><Label>Time *</Label><Input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} required className="mt-1" /></div>
            </div>
            <div><Label>Location *</Label><Input value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} placeholder="Venue" required className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category *</Label><Input value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})} placeholder="e.g. Academic" required className="mt-1" /></div>
              <div><Label>Max Participants</Label><Input type="number" value={eventForm.max_participants} onChange={e => setEventForm({...eventForm, max_participants: e.target.value})} placeholder="Unlimited" className="mt-1" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={loading}><Plus className="w-4 h-4 mr-1.5" />{loading ? "Creating..." : "Create Event"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Broadcast ── */}
      <Dialog open={openDialog === "broadcast"} onOpenChange={o => !o && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Send SMS Broadcast</DialogTitle><DialogDescription>Send a message to students via SMS</DialogDescription></DialogHeader>
          <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
            <div>
              <Label>Target Audience</Label>
              <select value={broadcastForm.target} onChange={e => setBroadcastForm({...broadcastForm, target: e.target.value as any})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all_students">All Active Students</option>
                <option value="custom">Custom Numbers</option>
              </select>
            </div>
            {broadcastForm.target === "custom" && (
              <div><Label>Phone Numbers</Label><Textarea value={broadcastForm.recipients} onChange={e => setBroadcastForm({...broadcastForm, recipients: e.target.value})} placeholder="+254700000001&#10;+254700000002" className="mt-1 font-mono text-sm" rows={3} /></div>
            )}
            <div>
              <Label>Message * <span className="text-xs font-normal text-gray-400">({broadcastForm.message.length}/480)</span></Label>
              <Textarea value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} placeholder="Type your message..." required className="mt-1" rows={4} maxLength={480} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={loading}><Send className="w-4 h-4 mr-1.5" />{loading ? "Sending..." : "Send Broadcast"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Export ── */}
      <Dialog open={openDialog === "export"} onOpenChange={o => !o && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Export Data</DialogTitle><DialogDescription>Download records as CSV files</DialogDescription></DialogHeader>
          <div className="space-y-3 pt-2">
            <button type="button" onClick={() => downloadCSV("students")} disabled={loading} className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm text-gray-800">Export Students</p>
                <p className="text-xs text-gray-500 mt-0.5">All student registrations as CSV</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            </button>
            <button type="button" onClick={() => downloadCSV("events")} disabled={loading} className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm text-gray-800">Export Events</p>
                <p className="text-xs text-gray-500 mt-0.5">All events with details as CSV</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
            </button>
          </div>
          <div className="flex justify-end pt-2"><Button variant="outline" onClick={close}>Close</Button></div>
        </DialogContent>
      </Dialog>

      {/* ── Reports ── */}
      <Dialog open={openDialog === "report"} onOpenChange={o => !o && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Generate Report</DialogTitle><DialogDescription>Download a data report as CSV</DialogDescription></DialogHeader>
          <div className="space-y-3 pt-2">
            <button type="button" onClick={() => { downloadCSV("students"); close(); }} disabled={loading} className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-white" /></div>
              <div className="text-left"><p className="font-semibold text-sm text-gray-800">Student Engagement Report</p><p className="text-xs text-gray-500">Registrations, status, activity</p></div>
            </button>
            <button type="button" onClick={() => { downloadCSV("events"); close(); }} disabled={loading} className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-white" /></div>
              <div className="text-left"><p className="font-semibold text-sm text-gray-800">Events Summary Report</p><p className="text-xs text-gray-500">Categories, status, participation</p></div>
            </button>
          </div>
          <div className="flex justify-end pt-2"><Button variant="outline" onClick={close}>Close</Button></div>
        </DialogContent>
      </Dialog>

      {/* ── Import ── */}
      <Dialog open={openDialog === "import"} onOpenChange={o => !o && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Import Students</DialogTitle><DialogDescription>Bulk-register students from a CSV file</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-800">Expected CSV columns:</p>
              <code className="block text-xs bg-white border rounded-lg px-3 py-2 font-mono">admissionNumber, firstName, lastName, email, phone, password</code>
              <ul className="text-xs text-gray-500 space-y-1 mt-1">
                <li>• <strong>password</strong> optional — defaults to <code>Zetech@2024</code></li>
                <li>• Header row required • Duplicates are skipped</li>
              </ul>
            </div>
            <div>
              <Label>Upload CSV File</Label>
              <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Choose a .csv file (max 2 MB)</p>
                <input ref={fileInputRef} type="file" accept=".csv" disabled={loading}
                  className="mt-3 block mx-auto text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); }}
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
              <div className={`rounded-xl p-4 text-sm space-y-2 ${importResult.errors?.length ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {importResult.errors?.length ? <AlertCircle className="w-4 h-4 text-amber-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                  <span>{importResult.message}</span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul className="text-xs text-red-600 space-y-0.5 max-h-28 overflow-y-auto">
                    {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
                  </ul>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={close}><X className="w-4 h-4 mr-1" />Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
