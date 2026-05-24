import { useState } from "react";
import {
  User,
  Settings,
  Shield,
  Bell,
  MessageSquare,
  History,
  ChevronRight,
} from "lucide-react";
import AdminAccountSettings from "@/components/AdminAccountSettings";
import AdminSystemSettings from "@/components/AdminSystemSettings";

interface AdminCombinedSettingsProps {
  user?: { email?: string; name?: string } | null;
}

const NAV = [
  {
    group: "Account",
    items: [
      {
        id: "account",
        label: "Account & Security",
        description: "Email, password & sessions",
        icon: Shield,
      },
      {
        id: "profile",
        label: "Profile & Preferences",
        description: "Name, notifications & activity",
        icon: User,
      },
    ],
  },
  {
    group: "Platform",
    items: [
      {
        id: "platform",
        label: "Platform Settings",
        description: "General settings & access control",
        icon: Settings,
      },
      {
        id: "sms",
        label: "SMS & Communications",
        description: "Sender ID & broadcast",
        icon: MessageSquare,
      },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

export default function AdminCombinedSettings({ user }: AdminCombinedSettingsProps) {
  const [activeId, setActiveId] = useState("account");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your account credentials and configure the platform
        </p>
      </div>

      <div className="flex gap-6 min-h-[520px]">
        {/* ── Left Sidebar ── */}
        <aside className="w-52 shrink-0">
          <nav className="space-y-5">
            {NAV.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group ${
                          active
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            active
                              ? "bg-white/20"
                              : "bg-gray-100 group-hover:bg-gray-200"
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
                              active ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                        {active && (
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

        {/* ── Right Content ── */}
        <div className="flex-1 min-w-0">
          {(activeId === "account" || activeId === "profile") && (
            <AdminAccountSettings
              currentAdminEmail={user?.email}
              currentAdminName={user?.name}
              initialTab={activeId === "profile" ? "profile" : "account"}
            />
          )}
          {(activeId === "platform" || activeId === "sms") && (
            <AdminSystemSettings initialSection={activeId === "sms" ? "sms" : "general"} />
          )}
        </div>
      </div>
    </div>
  );
}
