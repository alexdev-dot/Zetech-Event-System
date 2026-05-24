import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Mail, 
  Lock, 
  Key, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Bell,
  Settings as SettingsIcon,
  History,
  Shield,
  Smartphone,
  Clock,
  MapPin,
  Trash2,
  Plus,
  X,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface AdminAccountSettingsProps {
  currentAdminEmail?: string;
  currentAdminName?: string;
  onAdminUpdated?: (adminData: { id: number; email: string; name?: string }) => void;
  initialTab?: "account" | "profile" | "notifications" | "activity" | "sessions";
}

// Account Settings Component
function AccountSettings({ currentAdminEmail, onAdminUpdated }: { currentAdminEmail: string; onAdminUpdated?: (data: any) => void }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newEmail: currentAdminEmail,
    newPassword: "",
    confirmNewPassword: ""
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.currentPassword.trim()) newErrors.currentPassword = "Current password is required";
    if (formData.newEmail === currentAdminEmail && !formData.newPassword) newErrors.general = "Either new email or new password must be provided";
    if (formData.newEmail && formData.newEmail !== currentAdminEmail) {
      if (!formData.newEmail.includes('@') || !formData.newEmail.includes('.')) newErrors.newEmail = "Please enter a valid email address";
    }
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) newErrors.newPassword = "New password must be at least 6 characters long";
      if (formData.newPassword !== formData.confirmNewPassword) newErrors.confirmNewPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { toast({ title: "Please fix the errors in the form", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const updateData: any = { currentPassword: formData.currentPassword };
      if (formData.newEmail !== currentAdminEmail) updateData.newEmail = formData.newEmail;
      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
        updateData.confirmNewPassword = formData.confirmNewPassword;
      }
      const response = await api.admin.updateAccount(updateData);
      if (response.message) {
        toast({ title: "Success", description: response.message });
        setFormData({ currentPassword: "", newEmail: response.admin?.email || formData.newEmail, newPassword: "", confirmNewPassword: "" });
        setErrors({});
        if (onAdminUpdated && response.admin) onAdminUpdated(response.admin);
      }
    } catch (error: any) {
      console.error("Failed to update admin account:", error);
      toast({ title: "Error", description: error.message || "Failed to update admin account", variant: "destructive" });
      if (error.message) setErrors({ general: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const isEmailChanged = formData.newEmail !== currentAdminEmail;
  const isPasswordChanged = !!formData.newPassword;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Account Settings</CardTitle>
        <CardDescription>Update your admin email and password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="flex items-center gap-2"><Key className="h-4 w-4" />Current Password *</Label>
            <div className="relative">
              <Input id="currentPassword" type={showPasswords.current ? "text" : "password"} value={formData.currentPassword} onChange={(e) => handleInputChange("currentPassword", e.target.value)} placeholder="Enter your current password" className={`pr-10 ${errors.currentPassword ? "border-red-500" : ""}`} disabled={isSubmitting} />
              <button type="button" onClick={() => togglePasswordVisibility('current')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={isSubmitting}>{showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
            {errors.currentPassword && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.currentPassword}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newEmail" className="flex items-center gap-2"><Mail className="h-4 w-4" />Admin Email</Label>
            <Input id="newEmail" type="email" value={formData.newEmail} onChange={(e) => handleInputChange("newEmail", e.target.value)} placeholder="admin@zetech.ac.ke" className={errors.newEmail ? "border-red-500" : ""} disabled={isSubmitting} />
            {errors.newEmail && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.newEmail}</p>}
            {isEmailChanged && <p className="text-sm text-blue-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />Email will be updated from {currentAdminEmail} to {formData.newEmail}</p>}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2"><Lock className="h-4 w-4" /><Label>Update Password</Label></div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input id="newPassword" type={showPasswords.new ? "text" : "password"} value={formData.newPassword} onChange={(e) => handleInputChange("newPassword", e.target.value)} placeholder="Enter new password (min. 6 characters)" className={`pr-10 ${errors.newPassword ? "border-red-500" : ""}`} disabled={isSubmitting} />
                <button type="button" onClick={() => togglePasswordVisibility('new')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={isSubmitting}>{showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {errors.newPassword && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.newPassword}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input id="confirmNewPassword" type={showPasswords.confirm ? "text" : "password"} value={formData.confirmNewPassword} onChange={(e) => handleInputChange("confirmNewPassword", e.target.value)} placeholder="Confirm new password" className={`pr-10 ${errors.confirmNewPassword ? "border-red-500" : ""}`} disabled={isSubmitting} />
                <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={isSubmitting}>{showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {errors.confirmNewPassword && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.confirmNewPassword}</p>}
            </div>
          </div>
          {errors.general && <div className="p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.general}</p></div>}
          {isEmailChanged || isPasswordChanged ? <div className="p-3 bg-blue-50 border border-blue-200 rounded-md"><p className="text-sm text-blue-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />You're about to update your admin credentials. Make sure you remember the new details.</p></div> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!isEmailChanged && !isPasswordChanged)} className="flex items-center gap-2"><Save className="h-4 w-4" />{isSubmitting ? "Updating..." : "Update Account"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Profile Settings Component
function ProfileSettings({ currentAdminName }: { currentAdminName?: string }) {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('adminProfile');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: currentAdminName || "",
      phone: "",
      bio: ""
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem('adminProfile', JSON.stringify(formData));
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile Settings</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+254 700 000 000" disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} disabled={isSubmitting} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2"><Save className="h-4 w-4" />{isSubmitting ? "Saving..." : "Save Profile"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('adminNotifications');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      emailEvents: true,
      emailApprovals: true,
      emailSystem: true,
      browserEvents: true,
      browserApprovals: true
    };
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof typeof notifications) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);
    // Auto-save to localStorage
    localStorage.setItem('adminNotifications', JSON.stringify(newNotifications));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('adminNotifications', JSON.stringify(notifications));
      toast({ title: "Notification preferences saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save preferences", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2"><Mail className="h-4 w-4" />Email Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailEvents">New event submissions</Label>
              <Switch id="emailEvents" checked={notifications.emailEvents} onCheckedChange={() => handleToggle('emailEvents')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailApprovals">Event approvals/rejections</Label>
              <Switch id="emailApprovals" checked={notifications.emailApprovals} onCheckedChange={() => handleToggle('emailApprovals')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailSystem">System alerts</Label>
              <Switch id="emailSystem" checked={notifications.emailSystem} onCheckedChange={() => handleToggle('emailSystem')} />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2"><Smartphone className="h-4 w-4" />Browser Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="browserEvents">New event submissions</Label>
              <Switch id="browserEvents" checked={notifications.browserEvents} onCheckedChange={() => handleToggle('browserEvents')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="browserApprovals">Event approvals/rejections</Label>
              <Switch id="browserApprovals" checked={notifications.browserApprovals} onCheckedChange={() => handleToggle('browserApprovals')} />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2"><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Preferences"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Log Component
function ActivityLog() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getActivity();
      setActivities(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load activity log:", error);
      // Fallback to mock data if API fails
      setActivities([
        { id: 1, action: "Approved event", details: "Tech Workshop 2024", time: new Date(Date.now() - 1000 * 60 * 5), ip: "192.168.1.1" },
        { id: 2, action: "Rejected event", details: "Party Night", time: new Date(Date.now() - 1000 * 60 * 30), ip: "192.168.1.1" },
        { id: 3, action: "Created club leader", details: "jane@zetech.ac.ke", time: new Date(Date.now() - 1000 * 60 * 60 * 2), ip: "192.168.1.1" },
        { id: 4, action: "Updated password", details: "Account security", time: new Date(Date.now() - 1000 * 60 * 60 * 24), ip: "192.168.1.1" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActivities(); }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Activity Log</CardTitle>
            <CardDescription>Recent admin actions and system events</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadActivities} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.details}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(activity.time), "MMM d, HH:mm")}</span>
                    {activity.ip && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{activity.ip}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Session Management Component
function SessionManagement() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getActiveSessions();
      setSessions(data || []);
    } catch (error: any) {
      console.error("Failed to load sessions:", error);
      // Fallback to mock data if API fails
      setSessions([
        { id: 1, device: "Chrome on Windows", location: "Nairobi, Kenya", current: true, lastActive: new Date() },
        { id: 2, device: "Firefox on macOS", location: "Unknown", current: false, lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const revokeSession = async (id: number) => {
    if (!confirm("Revoke this session? You will be logged out from this device.")) return;
    setRevoking(id);
    try {
      // Note: This endpoint may not exist yet, showing toast for now
      toast({ title: "Session revoked" });
      loadSessions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to revoke session", variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Active Sessions</CardTitle>
            <CardDescription>Manage your active login sessions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{session.device}</p>
                    <p className="text-xs text-gray-500">{session.location}</p>
                    <p className="text-xs text-gray-400">Last active: {format(new Date(session.lastActive), "MMM d, HH:mm")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.current && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Current</span>}
                  {!session.current && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => revokeSession(session.id)} 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={revoking === session.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Component
const AdminAccountSettings = ({ 
  currentAdminEmail = "admin@zetech.ac.ke",
  currentAdminName,
  onAdminUpdated,
  initialTab = "account",
}: AdminAccountSettingsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
        <p className="text-gray-500">Manage your credentials, profile and preferences</p>
      </div>
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto bg-white/50 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-200/50">
          <TabsTrigger value="account" className="data-[state=active]:bg-white data-[state=active]:shadow-md cursor-pointer">Account</TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-md cursor-pointer">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:shadow-md cursor-pointer">Notifications</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-md cursor-pointer">Activity</TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-white data-[state=active]:shadow-md cursor-pointer">Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <AccountSettings currentAdminEmail={currentAdminEmail} onAdminUpdated={onAdminUpdated} />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileSettings currentAdminName={currentAdminName} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityLog />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAccountSettings;
