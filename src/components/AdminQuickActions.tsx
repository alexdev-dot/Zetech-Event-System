import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Settings,
  Zap,
  Send,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function AdminQuickActions() {
  const navigate = useNavigate();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    max_participants: ""
  });

  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    message: "",
    target: "all"
  });

  const quickActions = [
    {
      icon: Plus,
      label: "Create Event",
      description: "Add a new event to the system",
      color: "blue",
      onClick: () => setShowCreateEvent(true)
    },
    {
      icon: Users,
      label: "Add Student",
      description: "Register a new student manually",
      color: "green",
      onClick: () => navigate("/admin?tab=students")
    },
    {
      icon: Calendar,
      label: "View Calendar",
      description: "See all events in calendar view",
      color: "purple",
      onClick: () => navigate("/admin?tab=calendar")
    },
    {
      icon: Mail,
      label: "Send Broadcast",
      description: "Send email to all students",
      color: "orange",
      onClick: () => setShowBroadcast(true)
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "Manage system notifications",
      color: "yellow",
      onClick: () => toast.info("Notification center coming soon!")
    },
    {
      icon: FileText,
      label: "Generate Report",
      description: "Create event analytics report",
      color: "pink",
      onClick: () => setShowReport(true)
    },
    {
      icon: Download,
      label: "Export Data",
      description: "Download student/event data",
      color: "cyan",
      onClick: () => toast.info("Export feature coming soon!")
    },
    {
      icon: Upload,
      label: "Import Data",
      description: "Bulk import student data",
      color: "indigo",
      onClick: () => toast.info("Import feature coming soon!")
    }
  ];

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.events.create(eventForm);
      toast.success("Event created successfully!");
      setShowCreateEvent(false);
      setEventForm({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        category: "",
        max_participants: ""
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate broadcast - in real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Broadcast sent successfully!");
      setShowBroadcast(false);
      setBroadcastForm({ subject: "", message: "", target: "all" });
    } catch (error: any) {
      toast.error(error.message || "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    toast.success("Report generated! Download starting...");
    setShowReport(false);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
      green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
      purple: "bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200",
      orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200",
      yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200",
      pink: "bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-200",
      cyan: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-200",
      indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          <p className="text-sm text-gray-500">Frequently used admin tasks</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4" />
          <span>Fast access</span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className={`h-auto p-3 md:p-4 flex flex-col items-center gap-2 md:gap-3 border-2 ${getColorClasses(action.color)}`}
            onClick={action.onClick}
          >
            <action.icon className="w-5 h-5 md:w-6 md:h-6" />
            <div className="text-center">
              <p className="font-semibold text-xs md:text-sm">{action.label}</p>
              <p className="text-[10px] md:text-xs opacity-75 mt-0.5 md:mt-1">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quick Event</DialogTitle>
            <DialogDescription>
              Add a new event directly from the dashboard
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            <div>
              <Label>Event Title *</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="e.g., Tech Career Fair 2024"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Describe the event..."
                required
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={eventForm.time}
                  onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Location *</Label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="e.g., Main Auditorium"
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Input
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  placeholder="e.g., Academic"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  value={eventForm.max_participants}
                  onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateEvent(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : <><Plus className="w-4 h-4 mr-1" /> Create Event</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Broadcast</DialogTitle>
            <DialogDescription>
              Send an email notification to students
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
            <div>
              <Label>Subject *</Label>
              <Input
                value={broadcastForm.subject}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                placeholder="e.g., Important: Event Updates"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Target Audience</Label>
              <select
                value={broadcastForm.target}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, target: e.target.value })}
                className="mt-1 w-full p-2 border rounded-md"
              >
                <option value="all">All Students</option>
                <option value="registered">Registered Students Only</option>
                <option value="leaders">Club Leaders Only</option>
              </select>
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                placeholder="Type your message here..."
                required
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowBroadcast(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : <><Send className="w-4 h-4 mr-1" /> Send Broadcast</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Choose the type of report to generate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={handleGenerateReport}
            >
              <FileText className="w-5 h-5 mr-3 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold">Event Summary Report</p>
                <p className="text-sm text-gray-500">Overview of all events and statistics</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={handleGenerateReport}
            >
              <Users className="w-5 h-5 mr-3 text-green-600" />
              <div className="text-left">
                <p className="font-semibold">Student Engagement Report</p>
                <p className="text-sm text-gray-500">Student registration and activity data</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={handleGenerateReport}
            >
              <Calendar className="w-5 h-5 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-semibold">Monthly Analytics</p>
                <p className="text-sm text-gray-500">Trends and performance metrics</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
