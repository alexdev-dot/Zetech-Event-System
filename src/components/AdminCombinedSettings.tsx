import { useState, useEffect } from "react";
import {
  Shield,
  User,
  Settings,
  MessageSquare,
  Save,
  Eye,
  EyeOff,
  Globe,
  Bell,
  Send,
  RefreshCw,
  CheckCircle,
  ChevronRight,
  Lock,
  Sliders,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Props {
  user?: { email?: string; name?: string } | null;
}

type TabId = "account" | "profile" | "platform" | "sms";
type SysSettings = Record<string, string>;

const TABS: { id: TabId; label: string; icon: React.ComponentType<any>; color: string; gradient: string }[] = [
  { id: "account",  label: "Account & Security", icon: Shield,       color: "text-blue-600",  gradient: "from-blue-500 to-blue-600" },
  { id: "profile",  label: "Profile",            icon: User,         color: "text-violet-600", gradient: "from-violet-500 to-purple-600" },
  { id: "platform", label: "Platform",           icon: Sliders,      color: "text-emerald-600",gradient: "from-emerald-500 to-teal-600" },
  { id: "sms",      label: "SMS & Broadcast",    icon: Phone,        color: "text-orange-600", gradient: "from-orange-500 to-amber-500" },
];

/* ── shared field wrapper ── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/* ── section card wrapper ── */
function Section({ icon: Icon, gradient, title, description, children }: {
  icon: React.ComponentType<any>; gradient: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-50 bg-gray-50/50">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ── toggle row ── */
function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: ACCOUNT
═══════════════════════════════════════════════════════════ */
function AccountTab({ userEmail }: { userEmail?: string }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newEmail: userEmail || "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [show, setShow] = useState({ cur: false, newPwd: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (!form.currentPassword) {
      toast({ title: "Current password is required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await api.admin.updateAccount({
        currentPassword: form.currentPassword,
        newEmail: form.newEmail !== userEmail ? form.newEmail : undefined,
        newPassword: form.newPassword || undefined,
        confirmNewPassword: form.confirmNewPassword || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Account updated successfully" });
      setForm(f => ({ ...f, currentPassword: "", newPassword: "", confirmNewPassword: "" }));
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section icon={Lock} gradient="from-blue-500 to-blue-600" title="Verify Identity" description="Enter your current password to make any changes">
        <Field label="Current Password" hint="Required to save any changes below">
          <div className="relative">
            <Input type={show.cur ? "text" : "password"} value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Your current password" className="pr-10" required />
            <button type="button" onClick={() => setShow(s => ({ ...s, cur: !s.cur }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show.cur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
      </Section>

      <Section icon={Globe} gradient="from-sky-500 to-blue-500" title="Email Address" description="Change the email used to log in to your admin account">
        <Field label="Email Address">
          <Input type="email" value={form.newEmail}
            onChange={e => setForm(f => ({ ...f, newEmail: e.target.value }))}
            placeholder="admin@zetech.ac.ke" />
        </Field>
      </Section>

      <Section icon={Shield} gradient="from-slate-500 to-gray-600" title="Change Password" description="Use a strong password with at least 8 characters">
        <div className="space-y-4">
          <Field label="New Password" hint="Leave blank to keep your current password">
            <div className="relative">
              <Input type={show.newPwd ? "text" : "password"} value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="New password (optional)" className="pr-10" />
              <button type="button" onClick={() => setShow(s => ({ ...s, newPwd: !s.newPwd }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show.newPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          {form.newPassword && (
            <Field label="Confirm New Password">
              <Input type={show.newPwd ? "text" : "password"} value={form.confirmNewPassword}
                onChange={e => setForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                placeholder="Repeat new password" required />
            </Field>
          )}
        </div>
      </Section>

      <div className="flex items-center justify-between pt-1">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle className="w-4 h-4" /> Saved successfully
          </span>
        )}
        <Button type="submit" disabled={saving} className="ml-auto">
          <Save className="w-4 h-4 mr-1.5" />{saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: PROFILE
═══════════════════════════════════════════════════════════ */
function ProfileTab({ userName }: { userName?: string }) {
  const [name, setName] = useState(userName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section icon={User} gradient="from-violet-500 to-purple-600" title="Display Name" description="Your name is shown across the admin panel and in reports">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
            {name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 space-y-3">
            <Field label="Full Name" hint="Max 100 characters">
              <Input value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name" maxLength={100} required />
            </Field>
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-between pt-1">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle className="w-4 h-4" /> Profile saved
          </span>
        )}
        <Button type="submit" disabled={saving} className="ml-auto">
          <Save className="w-4 h-4 mr-1.5" />{saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: PLATFORM
═══════════════════════════════════════════════════════════ */
function PlatformTab() {
  const [settings, setSettings] = useState<SysSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setSettings(await api.admin.getSettings()); }
    catch (err: any) { toast({ title: "Failed to load", description: err.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setSettings(s => ({ ...s, [k]: v }));
  const toggle = (k: string) => set(k, settings[k] === "true" ? "false" : "true");

  const save = async () => {
    setSaving(true);
    try {
      await api.admin.updateSettings(settings);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      toast({ title: "Platform settings saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
        <p className="text-sm text-gray-400">Loading settings…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Section icon={Globe} gradient="from-emerald-500 to-teal-600" title="General Information" description="Basic platform identity and contact details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Platform Name">
              <Input value={settings.system_name || ""} onChange={e => set("system_name", e.target.value)} placeholder="Zetech Events Hub" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea value={settings.system_description || ""} onChange={e => set("system_description", e.target.value)} rows={2} placeholder="Brief description of the platform" />
            </Field>
          </div>
          <Field label="Contact Email">
            <Input type="email" value={settings.contact_email || ""} onChange={e => set("contact_email", e.target.value)} placeholder="events@zetech.ac.ke" />
          </Field>
          <Field label="Max Events per Club" hint="Per club leader">
            <Input type="number" value={settings.max_events_per_club || "50"} onChange={e => set("max_events_per_club", e.target.value)} min={1} max={500} />
          </Field>
        </div>
      </Section>

      <Section icon={Bell} gradient="from-amber-500 to-orange-500" title="Access Controls" description="Toggle platform-wide access features">
        <ToggleRow label="Student Registration" desc="Allow new students to create accounts" checked={settings.registration_open === "true"} onChange={() => toggle("registration_open")} />
        <ToggleRow label="Maintenance Mode" desc="Take the student portal offline for maintenance" checked={settings.maintenance_mode === "true"} onChange={() => toggle("maintenance_mode")} />
      </Section>

      <div className="flex items-center justify-between pt-1">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle className="w-4 h-4" /> Settings saved
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Reload</Button>
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />{saving ? "Saving..." : "Save Platform Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB: SMS
═══════════════════════════════════════════════════════════ */
function SmsTab() {
  const [settings, setSettings] = useState<SysSettings>({});
  const [loading, setLoading] = useState(true);
  const [savingCfg, setSavingCfg] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"all_students" | "custom">("all_students");
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.admin.getSettings()
      .then(setSettings)
      .catch((err: any) => toast({ title: "Failed to load", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => setSettings(s => ({ ...s, [k]: v }));

  const saveCfg = async () => {
    setSavingCfg(true);
    try {
      await api.admin.updateSettings({ sms_enabled: settings.sms_enabled || "false", sms_sender_id: settings.sms_sender_id || "ZetechHub" });
      toast({ title: "SMS config saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSavingCfg(false); }
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { toast({ title: "Message is required", variant: "destructive" }); return; }
    const payload: { message: string; targetGroup?: string; recipients?: string[] } = { message: message.trim() };
    if (target === "all_students") {
      payload.targetGroup = "all_students";
    } else {
      const nums = recipients.split(/[\n,]/).map(n => n.trim()).filter(Boolean);
      if (!nums.length) { toast({ title: "Enter at least one phone number", variant: "destructive" }); return; }
      payload.recipients = nums;
    }
    setSending(true);
    try {
      const res = await api.admin.sendSMS(payload);
      toast({ title: "SMS sent!", description: res.message || `Sent to ${res.count} recipients` });
      setMessage(""); setRecipients("");
    } catch (err: any) {
      toast({ title: "SMS failed", description: err.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="space-y-5">
      <Section icon={Settings} gradient="from-gray-500 to-slate-600" title="SMS Configuration" description="Powered by Africa's Talking — add AT_API_KEY to environment secrets">
        <div className="space-y-4">
          <ToggleRow label="Enable SMS" desc="Allow the platform to send SMS messages" checked={settings.sms_enabled === "true"} onChange={() => set("sms_enabled", settings.sms_enabled === "true" ? "false" : "true")} />
          <Field label="Sender ID" hint="Max 11 characters, no spaces — e.g. ZetechHub">
            <Input value={settings.sms_sender_id || ""} onChange={e => set("sms_sender_id", e.target.value)} placeholder="ZetechHub" maxLength={11} className="max-w-[200px]" />
          </Field>
          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" onClick={saveCfg} disabled={savingCfg}>
              <Save className="w-4 h-4 mr-1.5" />{savingCfg ? "Saving..." : "Save Config"}
            </Button>
          </div>
        </div>
      </Section>

      <Section icon={Send} gradient="from-orange-500 to-amber-500" title="Send Broadcast SMS" description="Compose and send an SMS to students instantly">
        <form onSubmit={sendBroadcast} className="space-y-4">
          <Field label="Target Audience">
            <select value={target} onChange={e => setTarget(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="all_students">All Active Students</option>
              <option value="custom">Custom Phone Numbers</option>
            </select>
          </Field>
          {target === "custom" && (
            <Field label="Phone Numbers" hint="One per line or comma-separated, include country code (+254...)">
              <Textarea value={recipients} onChange={e => setRecipients(e.target.value)}
                placeholder={"+254700000001\n+254700000002"} className="font-mono text-sm" rows={3} />
            </Field>
          )}
          <Field label={`Message — ${message.length}/480 chars`}>
            <Textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Type your broadcast message here..." required rows={4} maxLength={480} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={sending}>
              <Send className="w-4 h-4 mr-1.5" />{sending ? "Sending..." : "Send Broadcast"}
            </Button>
          </div>
        </form>
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminCombinedSettings({ user }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account, profile, and platform configuration</p>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${tab.gradient} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Settings className="w-3.5 h-3.5" />
        <span>Settings</span>
        <ChevronRight className="w-3 h-3" />
        <span className={active.color + " font-medium"}>{active.label}</span>
      </div>

      {/* Content */}
      <div>
        {activeTab === "account"  && <AccountTab  userEmail={user?.email} />}
        {activeTab === "profile"  && <ProfileTab  userName={user?.name}  />}
        {activeTab === "platform" && <PlatformTab />}
        {activeTab === "sms"      && <SmsTab />}
      </div>
    </div>
  );
}
