import { useState } from "react";
import { Settings, User } from "lucide-react";
import AdminAccountSettings from "@/components/AdminAccountSettings";
import AdminSystemSettings from "@/components/AdminSystemSettings";

interface AdminCombinedSettingsProps {
  user?: { email?: string; name?: string } | null;
}

export default function AdminCombinedSettings({ user }: AdminCombinedSettingsProps) {
  const [tab, setTab] = useState<"account" | "system">("account");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account credentials and system-wide configuration</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("account")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "account"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <User className="h-4 w-4" />
          Account &amp; Security
        </button>
        <button
          onClick={() => setTab("system")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "system"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Settings className="h-4 w-4" />
          System Configuration
        </button>
      </div>

      {/* Content */}
      {tab === "account" && (
        <AdminAccountSettings
          currentAdminEmail={user?.email}
          currentAdminName={user?.name}
        />
      )}
      {tab === "system" && <AdminSystemSettings />}
    </div>
  );
}
