import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Events from "./pages/Events";
import TodayEvents from "./pages/TodayEvents";
import ThisWeekEvents from "./pages/ThisWeekEvents";
import ThisMonthEvents from "./pages/ThisMonthEvents";
import EventDetail from "./pages/EventDetail";
import MyEvents from "./pages/MyEvents";
import CalendarPage from "./pages/CalendarPage";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ClubLeaderDashboard from "./pages/ClubLeaderDashboard";
import CreateEvent from "./pages/CreateEvent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

const Spinner = ({ color = "blue" }: { color?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className={`w-8 h-8 border-4 border-${color}-600 border-t-transparent rounded-full animate-spin`} />
  </div>
);

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner color="blue" />;
  if (!user || user.role !== "admin") return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function ProtectedClubLeader({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner color="green" />;
  if (!user || user.role !== "club_leader") return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function ProtectedAdminOrLeader({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner color="blue" />;
  if (!user || (user.role !== "admin" && user.role !== "club_leader")) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function ProtectedStudent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner color="blue" />;
  if (!user || user.role !== "user") return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/"                   element={<Index />} />
            <Route path="/events"             element={<Events />} />
            <Route path="/events/today"       element={<TodayEvents />} />
            <Route path="/events/week"        element={<ThisWeekEvents />} />
            <Route path="/events/month"       element={<ThisMonthEvents />} />
            <Route path="/events/:id"         element={<EventDetail />} />
            <Route path="/my-events"          element={<ProtectedStudent><MyEvents /></ProtectedStudent>} />
            <Route path="/calendar"           element={<CalendarPage />} />
            <Route path="/profile"            element={<ProtectedStudent><Profile /></ProtectedStudent>} />
            <Route path="/auth"               element={<Auth />} />
            <Route path="/create-event"       element={<ProtectedAdminOrLeader><CreateEvent /></ProtectedAdminOrLeader>} />
            <Route path="/admin/dashboard"    element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
            <Route path="/club-leader/dashboard" element={<ProtectedClubLeader><ClubLeaderDashboard /></ProtectedClubLeader>} />
            <Route path="*"                   element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
