import { useState, useEffect } from "react";
import {
  Shield,
  User,
  Settings,
  MessageSquare,
  ChevronRight,
  Save,
  Eye,
  EyeOff,
  Globe,
  Bell,
  Send,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AdminCombinedSettingsProps {
  user?: { email?: string; name?: string } | null;
}

type NavId = "account" | "profile" | "platform" | "sms";
type SysSettings = Record<string, string>;

const NAV: {
  group: string;
  items: { id: NavId; label: string; description: string; icon: React.ComponentType<any> }[];
}[] = [
  {
    group: "Account",
    items: [
      { id: "account", label: "Account & Security", description: "Email & password", icon: Shield },
      { id: "profile", label: "Profile", description: "Name & display", icon: User },
    ],
  },
  {
    group: "Platform",
    items: [
      { id: "platform", label: "Platform Settings", description: "Access & controls", icon: Settings },
      { id: "sms", label: "SMS & Broadcast", description: "Messaging", icon: MessageSquare },
    ],
  },
];

function AccountSection({ userEmail }: { userEmail?: string }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newEmail: userEmail || "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [show, setShow] = useState({ current: false, newPwd: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!form.currentPassword) {
      toast({ title: "Current password required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.admin.updateAccount({
        currentPassword: form.currentPassword,
        newEmail: form.newEmail !== userEmail ? form.newEmail : undefined,
        newPassword: form.newPassword || undefined,
        confirmNewPassword: form.confirmNewPassword || undefined,
      });
      toast({ title: "Account updated", description: "Changes saved successfully." });
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmNewPassword: "" }));
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" /> Account &amp; Security
        </CardTitle>
        <CardDescription>Update your login email or change your password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>
              Current Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                type={show.current ? "text" : "password"}
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Required to save any changes"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="border-t pt-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Change Email (optional)</p>
            <div>
              <Label>New Email Address</Label>
              <Input
                type="email"
                value={form.newEmail}
                onChange={(e) => setForm((f) => ({ ...f, newEmail: e.target.value }))}
                placeholder="Leave unchanged to keep current"
                className="mt-1"
              />
            </div>
          </div>

          <div className="border-t pt-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Change Password (optional)</p>
            <div className="space-y-3">
              <div>
                <Label>New Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={show.newPwd ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    placeholder="At least 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, newPwd: !s.newPwd }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show.newPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {form.newPassword && (
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type={show.newPwd ? "text" : "password"}
                    value={form.confirmNewPassword}
                    onChange={(e) => setForm((f) => ({ ...f, confirmNewPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    className="mt-1"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ProfileSection({ userName }: { userName?: string }) {
  const [name, setName] = useState(userName || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-purple-600" /> Profile
        </CardTitle>
        <CardDescription>Update your display name shown across the admin panel</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div>
            <Label>Display Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Admin User"
              className="mt-1"
              maxLength={100}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PlatformSection() {
  const [settings, setSettings] = useState<SysSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getSettings();
      setSettings(data);
    } catch (err: any) {
      toast({ title: "Failed to load settings", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }));
  const toggle = (key: string) => set(key, settings[key] === "true" ? "false" : "true");

  const save = async () => {
    setSaving(true);
    try {
      await api.admin.updateSettings(settings);
      toast({ title: "Settings saved", description: "Platform settings updated." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> General Settings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Platform Name</Label>
            <Input
              value={settings.system_name || ""}
              onChange={(e) => set("system_name", e.target.value)}
              placeholder="Zetech Events Hub"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={settings.system_description || ""}
              onChange={(e) => set("system_description", e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={settings.contact_email || ""}
                onChange={(e) => set("contact_email", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max Events per Club</Label>
              <Input
                type="number"
                value={settings.max_events_per_club || "50"}
                onChange={(e) => set("max_events_per_club", e.target.value)}
                className="mt-1"
                min={1}
                max={500}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-600" /> Access Controls
          </CardTitle>
          <CardDescription>Toggle platform features on or off</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            {
              key: "registration_open",
              label: "Student Registration",
              desc: "Allow new students to register accounts",
            },
            {
              key: "maintenance_mode",
              label: "Maintenance Mode",
              desc: "Take the student portal offline for maintenance",
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <Switch
                checked={settings[key] === "true"}
                onCheckedChange={() => toggle(key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Saving..." : "Save Platform Settings"}
        </Button>
      </div>
    </div>
  );
}

function SmsSection() {
  const [settings, setSettings] = useState<SysSettings>({});
  const [loading, setLoading] = useState(true);
  const [savingCfg, setSavingCfg] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"all_students" | "custom">("all_students");
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.admin
      .getSettings()
      .then(setSettings)
      .catch((err: any) =>
        toast({ title: "Failed to load", description: err.message, variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }));
  const toggle = (key: string) => set(key, settings[key] === "true" ? "false" : "true");

  const saveCfg = async () => {
    setSavingCfg(true);
    try {
      await api.admin.updateSettings({
        sms_enabled: settings.sms_enabled || "false",
        sms_sender_id: settings.sms_sender_id || "ZetechHub",
      });
      toast({ title: "SMS settings saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingCfg(false);
    }
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: "Message is required", variant: "destructive" });
      return;
    }
    const payload: { message: string; targetGroup?: string; recipients?: string[] } = {
      message: message.trim(),
    };
    if (target === "all_students") {
      payload.targetGroup = "all_students";
    } else {
      const nums = recipients
        .split(/[\n,]/)
        .map((n) => n.trim())
        .filter(Boolean);
      if (!nums.length) {
        toast({ title: "Enter at least one phone number", variant: "destructive" });
        return;
      }
      payload.recipients = nums;
    }
    setSending(true);
    try {
      const res = await api.admin.sendSMS(payload);
      toast({
        title: "SMS Sent!",
        description: res.message || `Sent to ${res.count} recipient(s)`,
      });
      setMessage("");
      setRecipients("");
    } catch (err: any) {
      toast({ title: "SMS Failed", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600" /> SMS Configuration
          </CardTitle>
          <CardDescription>
            Uses Africa's Talking. Add <code className="text-xs bg-gray-100 px-1 rounded">AT_API_KEY</code> to environment secrets to activate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable SMS</p>
              <p className="text-xs text-gray-500">Allow the system to send SMS notifications</p>
            </div>
            <Switch
              checked={settings.sms_enabled === "true"}
              onCheckedChange={() => toggle("sms_enabled")}
            />
          </div>
          <div>
            <Label>Sender ID</Label>
            <Input
              value={settings.sms_sender_id || ""}
              onChange={(e) => set("sms_sender_id", e.target.value)}
              placeholder="ZetechHub"
              maxLength={11}
              className="mt-1 max-w-[200px]"
            />
            <p className="text-xs text-gray-400 mt-1">Max 11 characters, no spaces</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={saveCfg} disabled={savingCfg}>
              <Save className="w-4 h-4 mr-1.5" />
              {savingCfg ? "Saving..." : "Save Config"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" /> Send Broadcast SMS
          </CardTitle>
          <CardDescription>Compose and send an SMS message to students</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendBroadcast} className="space-y-4">
            <div>
              <Label>Target Audience</Label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as "all_students" | "custom")}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all_students">All Active Students</option>
                <option value="custom">Custom Phone Numbers</option>
              </select>
            </div>

            {target === "custom" && (
              <div>
                <Label>Phone Numbers</Label>
                <Textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder={"+254700000001\n+254700000002"}
                  className="mt-1 font-mono text-sm"
                  rows={3}
                />
                <p className="text-xs text-gray-400 mt-1">
                  One per line or comma-separated, include country code
                </p>
              </div>
            )}

            <div>
              <Label>
                Message{" "}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  ({message.length}/480 chars)
                </span>
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="mt-1"
                rows={4}
                maxLength={480}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={sending}>
                <Send className="w-4 h-4 mr-1.5" />
                {sending ? "Sending..." : "Send Broadcast"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCombinedSettings({ user }: AdminCombinedSettingsProps) {
  const [activeId, setActiveId] = useState<NavId>("account");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage account credentials and configure the platform
        </p>
      </div>

      {/* Mobile: pill tabs */}
      <div className="flex md:hidden flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
        {NAV.flatMap((g) => g.items).map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-6 min-h-[480px]">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <nav className="space-y-5">
            {NAV.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-gray-200"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight truncate">
                            {item.label}
                          </p>
                          <p
                            className={`text-[11px] mt-0.5 leading-tight truncate ${
                              isActive ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {activeId === "account" && <AccountSection userEmail={user?.email} />}
          {activeId === "profile" && <ProfileSection userName={user?.name} />}
          {activeId === "platform" && <PlatformSection />}
          {activeId === "sms" && <SmsSection />}
        </div>
      </div>
    </div>
  );
}
