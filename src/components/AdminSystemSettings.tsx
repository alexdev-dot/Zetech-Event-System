import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  MessageSquare,
  Send,
  RefreshCw,
  Globe,
  Shield,
  Bell,
  Users,
} from "lucide-react";

type SystemSettings = {
  system_name?: string;
  system_description?: string;
  sms_enabled?: string;
  registration_open?: string;
  maintenance_mode?: string;
  sms_sender_id?: string;
  max_events_per_club?: string;
  contact_email?: string;
};

export default function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SMS state
  const [smsMessage, setSmsMessage] = useState("");
  const [smsTarget, setSmsTarget] = useState<"all_students" | "custom">("all_students");
  const [smsRecipients, setSmsRecipients] = useState("");
  const [sendingSMS, setSendingSMS] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getSettings();
      setSettings(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateSetting = (key: keyof SystemSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBoolean = (key: keyof SystemSettings) => {
    const current = settings[key] === "true";
    updateSetting(key, current ? "false" : "true");
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.admin.updateSettings(settings as Record<string, string>);
      toast({ title: "Settings saved", description: "System settings have been updated." });
    } catch (err: any) {
      toast({
        title: "Error saving settings",
        description: err.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message to send.", variant: "destructive" });
      return;
    }
    setSendingSMS(true);
    try {
      const payload: { message: string; targetGroup?: string; recipients?: string[] } = {
        message: smsMessage.trim(),
      };

      if (smsTarget === "all_students") {
        payload.targetGroup = "all_students";
      } else {
        const nums = smsRecipients.split(/[\n,]/).map((n) => n.trim()).filter(Boolean);
        if (nums.length === 0) {
          toast({ title: "Error", description: "Enter at least one phone number.", variant: "destructive" });
          setSendingSMS(false);
          return;
        }
        payload.recipients = nums;
      }

      const result = await api.admin.sendSMS(payload);
      toast({
        title: "SMS Sent!",
        description: result.message || `Message sent to ${result.count} recipient(s)`,
      });
      setSmsMessage("");
      setSmsRecipients("");
    } catch (err: any) {
      toast({
        title: "SMS Failed",
        description: err.message || "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setSendingSMS(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">System Settings</h2>
          <p className="text-sm text-gray-500">Customise and control the entire platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* General Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-blue-600" />
            General Settings
          </CardTitle>
          <CardDescription>Platform name and description shown to users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="system_name">System Name</Label>
            <Input
              id="system_name"
              value={settings.system_name || ""}
              onChange={(e) => updateSetting("system_name", e.target.value)}
              placeholder="Zetech Events Hub"
            />
          </div>
          <div>
            <Label htmlFor="system_description">System Description</Label>
            <Textarea
              id="system_description"
              value={settings.system_description || ""}
              onChange={(e) => updateSetting("system_description", e.target.value)}
              placeholder="Campus event management platform"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={settings.contact_email || ""}
              onChange={(e) => updateSetting("contact_email", e.target.value)}
              placeholder="events@zetech.ac.ke"
            />
          </div>
          <div>
            <Label htmlFor="max_events_per_club">Max Events Per Club</Label>
            <Input
              id="max_events_per_club"
              type="number"
              min="1"
              max="500"
              value={settings.max_events_per_club || "50"}
              onChange={(e) => updateSetting("max_events_per_club", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-red-600" />
            Access Control
          </CardTitle>
          <CardDescription>Control what features are active in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Student Event Registration</p>
              <p className="text-xs text-gray-500">Allow students to register for events</p>
            </div>
            <Switch
              checked={settings.registration_open === "true"}
              onCheckedChange={() => toggleBoolean("registration_open")}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50/30">
            <div>
              <p className="font-medium text-sm text-red-700">Maintenance Mode</p>
              <p className="text-xs text-red-500">Show maintenance page to all non-admin users</p>
            </div>
            <Switch
              checked={settings.maintenance_mode === "true"}
              onCheckedChange={() => toggleBoolean("maintenance_mode")}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">SMS Notifications</p>
              <p className="text-xs text-gray-500">Enable sending SMS to students (requires Africa's Talking API key)</p>
            </div>
            <Switch
              checked={settings.sms_enabled === "true"}
              onCheckedChange={() => toggleBoolean("sms_enabled")}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Configuration */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-green-600" />
            SMS Configuration
          </CardTitle>
          <CardDescription>
            Configure Africa's Talking SMS. Set AT_API_KEY and AT_USERNAME as environment secrets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sms_sender_id">SMS Sender ID</Label>
            <Input
              id="sms_sender_id"
              value={settings.sms_sender_id || ""}
              onChange={(e) => updateSetting("sms_sender_id", e.target.value)}
              placeholder="ZetechHub"
              maxLength={11}
            />
            <p className="text-xs text-gray-400 mt-1">Max 11 characters. Must be registered with Africa's Talking.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Save Settings
            </span>
          )}
        </Button>
      </div>

      {/* SMS Broadcast */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            Send SMS Broadcast
          </CardTitle>
          <CardDescription>
            Send SMS messages to students. Requires phone numbers on student accounts and a valid Africa's Talking API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Recipients</Label>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setSmsTarget("all_students")}
                className={`flex-1 p-3 text-sm border rounded-lg transition-colors flex items-center gap-2 justify-center ${
                  smsTarget === "all_students"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4" /> All Active Students
              </button>
              <button
                type="button"
                onClick={() => setSmsTarget("custom")}
                className={`flex-1 p-3 text-sm border rounded-lg transition-colors flex items-center gap-2 justify-center ${
                  smsTarget === "custom"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Custom Numbers
              </button>
            </div>
          </div>

          {smsTarget === "custom" && (
            <div>
              <Label htmlFor="smsRecipients">Phone Numbers</Label>
              <Textarea
                id="smsRecipients"
                value={smsRecipients}
                onChange={(e) => setSmsRecipients(e.target.value)}
                placeholder="0712345678, 0798765432&#10;(one per line or comma-separated)"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">Kenya numbers (07xx or 01xx). Will be auto-formatted.</p>
            </div>
          )}

          <div>
            <Label htmlFor="smsMessage">Message *</Label>
            <Textarea
              id="smsMessage"
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              maxLength={160}
            />
            <p className="text-xs text-gray-400 mt-1">{smsMessage.length}/160 characters</p>
          </div>

          <Button
            onClick={handleSendSMS}
            disabled={sendingSMS || !smsMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {sendingSMS ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send SMS
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
