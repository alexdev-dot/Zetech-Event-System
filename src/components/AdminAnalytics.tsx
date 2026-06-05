import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Download,
  Filter,
  GraduationCap,
  Building2,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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
  upcoming: "#2563eb",
  completed: "#059669",
  ongoing: "#d97706",
  pending: "#64748b",
  cancelled: "#dc2626",
  rejected: "#ea580c",
  missed: "#ea580c",
  archived: "#475569",
};

const CHART_COLORS = [
  "#2563eb", // Royal Blue
  "#059669", // Emerald Green
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#dc2626", // Red
  "#0891b2", // Cyan
  "#db2777", // Pink
  "#65a30d", // Lime
  "#4f46e5", // Indigo
  "#0891b2", // Sky
];

function StatCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card className="border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.isPositive ? "+" : ""}{trend.value}% from last period
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
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
    <Card className="border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 pt-6 pb-16">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-100 uppercase tracking-wider">Student Enrollment</span>
            </div>
            <p className="text-5xl font-bold text-white tracking-tight">{total.toLocaleString()}</p>
            <p className="text-sm text-blue-200 mt-2 font-medium">Total registered students</p>
          </div>
          <div className="text-right">
            {growthPct !== null && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${growthPct >= 0 ? "bg-emerald-400/30 text-emerald-100 border border-emerald-400/30" : "bg-red-400/30 text-red-100 border border-red-400/30"}`}>
                {growthPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {growthPct >= 0 ? "+" : ""}{growthPct}% vs prior period
              </div>
            )}
            <div className="flex gap-1.5 mt-4 justify-end">
              {(["daily", "weekly", "monthly"] as SignupPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize backdrop-blur-sm ${period === p ? "bg-white text-blue-700 shadow-lg" : "text-blue-200 hover:bg-white/10 border border-white/20"}`}>
                  {p === "daily" ? "Daily" : p === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-12 mx-0">
        {loading ? (
          <div className="h-52 bg-white flex items-center justify-center rounded-t-3xl">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="h-52 bg-white flex items-center justify-center rounded-t-3xl">
            <p className="text-sm text-gray-400">No registration data for this period</p>
          </div>
        ) : (
          <div className="bg-white rounded-t-3xl shadow-inner pt-6 pb-4">
            <p className="text-xs text-gray-500 text-right pr-6 mb-3 font-medium">{PERIOD_LABELS[period]}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rows} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false}
                  dy={5}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  dx={-5}
                />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: "1px solid #e2e8f0", 
                    fontSize: 12, 
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    backgroundColor: "white",
                    padding: "12px"
                  }}
                  formatter={(v: number) => [v.toLocaleString(), "New Students"]}
                  labelStyle={{ color: "#64748b", fontWeight: 500 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fill="url(#signupGrad)" 
                  dot={{ fill: "#2563eb", r: 4, strokeWidth: 2, stroke: "#2563eb" }} 
                  activeDot={{ r: 6, strokeWidth: 3, stroke: "#2563eb", fill: "#fff" }}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
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
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading analytics...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait while we gather your data</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-center">
        <p className="text-red-600 font-medium mb-2">{error || "No data available"}</p>
        <p className="text-gray-500 text-sm">Unable to load analytics data</p>
      </div>
      <Button variant="outline" size="sm" onClick={loadAnalytics} className="gap-2">
        <RefreshCw className="h-4 w-4" /> Retry
      </Button>
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
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h2>
              <p className="text-sm text-gray-500 mt-0.5">Comprehensive event insights and university activity metrics</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Last Updated</p>
            <p className="text-sm font-semibold text-gray-700">{format(new Date(), "MMM d, yyyy • HH:mm")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalytics} className="gap-2 border-gray-300">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-gray-300">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* ── Student Registration Growth chart ── */}
      <StudentSignupChart />

      {/* KPI cards with improved design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={Users}     
          label="Event Registrations" 
          value={totalRegistrations.toLocaleString()} 
          sub="across all events"   
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          icon={Calendar}  
          label="Total Events"        
          value={totalEvents}         
          sub="all statuses"        
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          icon={Activity}  
          label="Peak Day"            
          value={peakDay?.day || "—"} 
          sub={peakDay ? `${peakDay.registrations} registrations` : "No data yet"} 
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard 
          icon={Trophy}    
          label="Top Category"        
          value={topCategory?.category || "—"} 
          sub={topCategory ? `${topCategory.total_registrations} registrations` : "No data yet"} 
          color="bg-gradient-to-br from-emerald-500 to-green-600"
        />
      </div>

      {/* Row 1: Trends + Peak Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                Event Registration Trends
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium">Last 12 Weeks</Badge>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-1">Weekly registration patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 1 && trendData[0].week === "No data" ? (
              <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No registration data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 11, fill: "#64748b" }} 
                    tickLine={false} 
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "#64748b" }} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                    dx={-5}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: "1px solid #e2e8f0", 
                      fontSize: 12, 
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      backgroundColor: "white",
                      padding: "12px"
                    }}
                    formatter={(v: number) => [v.toLocaleString(), "Registrations"]}
                    labelStyle={{ color: "#64748b", fontWeight: 500 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#2563eb" 
                    strokeWidth={2} 
                    fill="url(#lineGrad)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ fill: "#2563eb", r: 4, strokeWidth: 2, stroke: "#2563eb" }} 
                    activeDot={{ r: 6, strokeWidth: 3, stroke: "#2563eb", fill: "#fff" }}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
                Peak Activity by Day
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium">Weekly Average</Badge>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-1">Most active days for event registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={peakDaysOrdered} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false}
                  dy={5}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: "1px solid #e2e8f0", 
                    fontSize: 12, 
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    backgroundColor: "white",
                    padding: "12px"
                  }}
                  formatter={(v: number) => [v.toLocaleString(), "Registrations"]}
                  labelStyle={{ color: "#64748b", fontWeight: 500 }}
                />
                <Bar 
                  dataKey="registrations" 
                  fill="url(#barGrad)" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Registrations per Event */}
      <Card className="border border-gray-200/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <BarChart2 className="h-4 w-4 text-indigo-600" />
              </div>
              Registrations per Event
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-medium">Top 15 Events</Badge>
          </div>
          <CardDescription className="text-xs text-gray-500 mt-1">Event performance comparison with capacity utilization</CardDescription>
        </CardHeader>
        <CardContent>
          {data.registrationsPerEvent.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No approved events yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.registrationsPerEvent.map(e => ({
                  name: e.title.length > 25 ? e.title.slice(0, 23) + "…" : e.title,
                  Registrations: e.registrations, Capacity: e.capacity || 0,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 65 }}
              >
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: "#64748b" }} 
                  angle={-40} 
                  textAnchor="end" 
                  interval={0} 
                  tickLine={false} 
                  axisLine={false}
                  dy={5}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: "1px solid #e2e8f0", 
                    fontSize: 12, 
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    backgroundColor: "white",
                    padding: "12px"
                  }}
                  formatter={(v: number) => [v.toLocaleString()]}
                  labelStyle={{ color: "#64748b", fontWeight: 500 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar 
                  dataKey="Registrations" 
                  fill="url(#regGrad)" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
                <Bar 
                  dataKey="Capacity" 
                  fill="url(#capGrad)" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Status Pie + Category Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                </div>
                Events by Status
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium">Distribution</Badge>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-1">Current status breakdown of all events</CardDescription>
          </CardHeader>
          <CardContent>
            {data.statusBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No events yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie 
                      data={data.statusBreakdown} 
                      dataKey="count" 
                      nameKey="status" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={85} 
                      innerRadius={50}
                      paddingAngle={2}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    >
                      {data.statusBreakdown.map(entry => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: "1px solid #e2e8f0", 
                        fontSize: 12, 
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        backgroundColor: "white",
                        padding: "12px"
                      }}
                      formatter={(v: number) => [v.toLocaleString(), "Events"]}
                      labelStyle={{ color: "#64748b", fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2.5 flex-1">
                  {data.statusBreakdown.map(s => (
                    <div key={s.status} className="flex items-center justify-between text-sm p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ background: STATUS_COLORS[s.status] || "#94a3b8" }} />
                        <span className="capitalize text-gray-700 font-medium">{s.status}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">{s.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-purple-600" />
                </div>
                Registrations by Category
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium">Performance</Badge>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-1">Event category popularity analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart layout="vertical"
                  data={data.categoryBreakdown.map((c, i) => ({
                    name: c.category.length > 20 ? c.category.slice(0, 18) + "…" : c.category,
                    Registrations: c.total_registrations,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                  }))}
                  margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" horizontal={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11, fill: "#64748b" }} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                    dy={-5}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: "#64748b" }} 
                    width={110} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-5}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: "1px solid #e2e8f0", 
                      fontSize: 12, 
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      backgroundColor: "white",
                      padding: "12px"
                    }}
                    formatter={(v: number) => [v.toLocaleString(), "Registrations"]}
                    labelStyle={{ color: "#64748b", fontWeight: 500 }}
                  />
                  <Bar 
                    dataKey="Registrations" 
                    radius={[0, 6, 6, 0]}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  >
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
        <Card className="border border-gray-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-amber-600" />
                </div>
                Top Events by Registrations
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium">Performance Leaders</Badge>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-1">Highest performing events by registration count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topEvents.map((ev, i) => {
                const fill = ev.capacity ? Math.min(100, Math.round((ev.registrations / ev.capacity) * 100)) : null;
                return (
                  <div key={ev.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white" : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" : "bg-gradient-to-br from-orange-300 to-orange-400 text-white"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{ev.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{ev.registrations}</p>
                      {fill !== null && (
                        <p className="text-xs text-gray-500 font-medium">{fill}% capacity</p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs capitalize font-semibold shrink-0 ${ev.status === "upcoming" ? "bg-blue-100 text-blue-700 border border-blue-200" : ev.status === "completed" ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-700 border border-gray-200"}`}
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
