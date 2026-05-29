import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
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
  UserPlus,
  TrendingDown,
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

type SignupRow = { label: string; count: number };
type SignupData = { daily: SignupRow[]; weekly: SignupRow[]; monthly: SignupRow[]; total: number };
type SignupPeriod = "daily" | "weekly" | "monthly";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "#3b82f6",
  completed: "#22c55e",
  ongoing: "#f59e0b",
  pending: "#94a3b8",
  cancelled: "#ef4444",
  rejected: "#f97316",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
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

/* ── Student registration growth chart ── */
function StudentSignupChart() {
  const [signups, setSignups] = useState<SignupData | null>(null);
  const [period, setPeriod] = useState<SignupPeriod>("weekly");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getStudentSignups();
      setSignups(data);
    } catch {
      // silently fail — chart just won't show
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const rows: SignupRow[] = signups ? signups[period] : [];
  const total = signups?.total ?? 0;

  // simple growth % compared to previous same-length window
  const half = Math.floor(rows.length / 2);
  const prevHalf = rows.slice(0, half).reduce((s, r) => s + r.count, 0);
  const curHalf  = rows.slice(half).reduce((s, r) => s + r.count, 0);
  const growthPct = prevHalf === 0 ? null : Math.round(((curHalf - prevHalf) / prevHalf) * 100);

  const PERIOD_LABELS: Record<SignupPeriod, string> = {
    daily: "Last 30 Days",
    weekly: "Last 12 Weeks",
    monthly: "Last 12 Months",
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pt-5 pb-14">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-100">Student Registrations</span>
            </div>
            <p className="text-4xl font-bold text-white">{total.toLocaleString()}</p>
            <p className="text-sm text-blue-200 mt-1">Total students registered</p>
          </div>
          <div className="text-right">
            {growthPct !== null && (
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${growthPct >= 0 ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/20 text-red-100"}`}>
                {growthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {growthPct >= 0 ? "+" : ""}{growthPct}% vs prior period
              </div>
            )}
            <div className="flex gap-1 mt-3 justify-end">
              {(["daily", "weekly", "monthly"] as SignupPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${period === p ? "bg-white text-blue-700 shadow-sm" : "text-blue-200 hover:bg-white/10"}`}>
                  {p === "daily" ? "Daily" : p === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-10 mx-0">
        {loading ? (
          <div className="h-44 bg-white flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="h-44 bg-white flex items-center justify-center">
            <p className="text-sm text-gray-400">No registration data for this period</p>
          </div>
        ) : (
          <div className="bg-white rounded-t-2xl shadow-inner pt-4 pb-2">
            <p className="text-xs text-gray-400 text-right pr-4 mb-2">{PERIOD_LABELS[period]}</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={rows} margin={{ top: 5, right: 16, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                  formatter={(v: number) => [v, "New Students"]}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#signupGrad)" dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAnalytics() {
    setLoading(true); setError(null);
    try { setData(await api.admin.getAnalytics()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load analytics"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAnalytics(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-red-500 text-sm">{error || "No data available"}</p>
      <Button variant="outline" size="sm" onClick={loadAnalytics}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
    </div>
  );

  const totalRegistrations = data.registrationsPerEvent.reduce((s, e) => s + e.registrations, 0);
  const totalEvents = data.statusBreakdown.reduce((s, e) => s + e.count, 0);
  const peakDay = data.peakDays.length > 0 ? data.peakDays.reduce((a, b) => a.registrations > b.registrations ? a : b) : null;
  const topCategory = data.categoryBreakdown.length > 0 ? data.categoryBreakdown[0] : null;

  const trendData = data.registrationTrends.length > 0
    ? data.registrationTrends
    : [{ week: "No data", registrations: 0 }];

  const peakDaysOrdered = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => ({
    day,
    registrations: data.peakDays.find(d => d.day === day)?.registrations || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Attendance trends, registration counts, and activity patterns</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* ── Student Registration Growth chart ── */}
      <StudentSignupChart />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Event Registrations" value={totalRegistrations} sub="across all events"   color="bg-blue-500" />
        <StatCard icon={Calendar}  label="Total Events"        value={totalEvents}         sub="all statuses"        color="bg-indigo-500" />
        <StatCard icon={Activity}  label="Peak Day"            value={peakDay?.day || "—"} sub={peakDay ? `${peakDay.registrations} registrations` : "No data yet"} color="bg-amber-500" />
        <StatCard icon={Trophy}    label="Top Category"        value={topCategory?.category || "—"} sub={topCategory ? `${topCategory.total_registrations} registrations` : "No data yet"} color="bg-emerald-500" />
      </div>

      {/* Row 1: Trends + Peak Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Event Registration Trends (Last 12 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 1 && trendData[0].week === "No data" ? (
              <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No registration data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Line type="monotone" dataKey="registrations" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" /> Peak Activity by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakDaysOrdered} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="registrations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Registrations per Event */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-500" /> Registrations per Event (Top 15)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.registrationsPerEvent.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No approved events yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.registrationsPerEvent.map(e => ({
                  name: e.title.length > 20 ? e.title.slice(0, 18) + "…" : e.title,
                  Registrations: e.registrations, Capacity: e.capacity || 0,
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
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" /> Events by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No events yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={data.statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      {data.statusBreakdown.map(entry => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {data.statusBreakdown.map(s => (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.status] || "#94a3b8" }} />
                        <span className="capitalize text-gray-700">{s.status}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" /> Registrations by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart layout="vertical"
                  data={data.categoryBreakdown.map((c, i) => ({
                    name: c.category.length > 18 ? c.category.slice(0, 16) + "…" : c.category,
                    Registrations: c.total_registrations,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="Registrations" radius={[0, 4, 4, 0]}>
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

      {/* Top Events table */}
      {data.topEvents.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Top Events by Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topEvents.map((ev, i) => {
                const fill = ev.capacity ? Math.min(100, Math.round((ev.registrations / ev.capacity) * 100)) : null;
                return (
                  <div key={ev.id} className="flex items-center gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-600"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                      <p className="text-xs text-gray-400">{ev.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-800">{ev.registrations}</p>
                      {fill !== null && (
                        <p className="text-xs text-gray-400">{fill}% full</p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs capitalize shrink-0 ${ev.status === "upcoming" ? "bg-blue-50 text-blue-700" : ev.status === "completed" ? "bg-green-50 text-green-700" : ""}`}
                    >
                      {ev.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
