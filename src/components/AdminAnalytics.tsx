import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Calendar,
  BarChart2,
  RefreshCw,
  Trophy,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AnalyticsData = {
  registrationsPerEvent: { title: string; date: string; category: string; registrations: number; capacity: number }[];
  registrationTrends: { week: string; registrations: number }[];
  peakDays: { day: string; day_num: number; registrations: number }[];
  statusBreakdown: { status: string; count: number }[];
  categoryBreakdown: { category: string; total_events: number; total_registrations: number }[];
  topEvents: { id: number; title: string; date: string; status: string; registrations: number; capacity: number | null }[];
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "#3b82f6",
  completed: "#22c55e",
  ongoing: "#f59e0b",
  pending: "#94a3b8",
  cancelled: "#ef4444",
  rejected: "#f97316",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.admin.getAnalytics();
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 text-sm">{error || "No data available"}</p>
        <Button variant="outline" size="sm" onClick={loadAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const totalRegistrations = data.registrationsPerEvent.reduce((s, e) => s + e.registrations, 0);
  const totalEvents = data.statusBreakdown.reduce((s, e) => s + e.count, 0);
  const peakDay = data.peakDays.length > 0
    ? data.peakDays.reduce((a, b) => (a.registrations > b.registrations ? a : b))
    : null;
  const topCategory = data.categoryBreakdown.length > 0 ? data.categoryBreakdown[0] : null;

  const trendData = data.registrationTrends.length > 0
    ? data.registrationTrends
    : [{ week: "No data", registrations: 0 }];

  const peakDaysOrdered = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
    const found = data.peakDays.find((d) => d.day === day);
    return { day, registrations: found?.registrations || 0 };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Event Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Attendance trends, registration counts, and activity patterns</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={totalRegistrations}
          sub="across all events"
          color="bg-blue-500"
        />
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={totalEvents}
          sub="all statuses"
          color="bg-indigo-500"
        />
        <StatCard
          icon={Activity}
          label="Peak Day"
          value={peakDay?.day || "—"}
          sub={peakDay ? `${peakDay.registrations} registrations` : "No data yet"}
          color="bg-amber-500"
        />
        <StatCard
          icon={Trophy}
          label="Top Category"
          value={topCategory?.category || "—"}
          sub={topCategory ? `${topCategory.total_registrations} registrations` : "No data yet"}
          color="bg-emerald-500"
        />
      </div>

      {/* Row 1: Trends + Peak Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Registration Trends */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Registration Trends (Last 12 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 1 && trendData[0].week === "No data" ? (
              <div className="flex items-center justify-center h-44 text-gray-400 text-sm">
                No registration data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Peak Activity by Day */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              Peak Activity by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakDaysOrdered} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="registrations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Registrations per Event (bar) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-500" />
            Registrations per Event (Top 15)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.registrationsPerEvent.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
              No approved events yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.registrationsPerEvent.map((e) => ({
                  name: e.title.length > 20 ? e.title.slice(0, 18) + "…" : e.title,
                  Registrations: e.registrations,
                  Capacity: e.capacity || 0,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 55 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="Registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Status Pie + Category Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Event Status Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              Events by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No events yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={35}
                    >
                      {data.statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {data.statusBreakdown.map((s) => (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: STATUS_COLORS[s.status] || "#94a3b8" }}
                        />
                        <span className="capitalize text-gray-700">{s.status}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {s.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrations by Category */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              Registrations by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  layout="vertical"
                  data={data.categoryBreakdown}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="total_registrations" name="Registrations" radius={[0, 4, 4, 0]}>
                    {data.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Events Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Top 5 Most Registered Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topEvents.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
              No events with registrations yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Rank</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Event</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Registrations</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Fill %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEvents.map((ev, i) => {
                    const fill = ev.capacity ? Math.round((ev.registrations / ev.capacity) * 100) : null;
                    return (
                      <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-800 max-w-[200px] truncate">
                          {ev.title}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {new Date(ev.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            style={{
                              background: STATUS_COLORS[ev.status] + "22",
                              color: STATUS_COLORS[ev.status] || "#64748b",
                              border: `1px solid ${STATUS_COLORS[ev.status] || "#94a3b8"}44`,
                            }}
                            className="capitalize text-xs font-medium"
                          >
                            {ev.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-800">
                          {ev.registrations}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {fill !== null ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(fill, 100)}%`,
                                    background: fill >= 90 ? "#ef4444" : fill >= 60 ? "#f59e0b" : "#22c55e",
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-9 text-right">{fill}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
