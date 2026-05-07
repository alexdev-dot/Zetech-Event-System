import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { events as eventsData, categories, allSubCategories, campuses, type Event } from "@/data/events";
import zetechLogo from "@/assets/zetech-logo.png";
import SettingsComponent from "@/components/Settings";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  X,
  Image as ImageIcon,
  BarChart3,
  Clock,
  MapPin,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Home,
  Bell,
  ChevronDown,
  Menu,
  Music,
  Trophy,
  Smile,
  Megaphone,
  ChartLine,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Heart,
  User,
  Shield,
  Database,
  Mail,
  Globe,
  Smartphone,
  Lock,
  Key,
  Save,
  RefreshCw,
  Download,
  Trash,
  ToggleLeft,
  ToggleRight,
  Info,
  HelpCircle,
  FileText,
  Palette,
  Volume2,
  Wifi,
  Server,
  Cloud,
  Zap
} from "lucide-react";
import { toast } from "sonner";

// Mock users data (this would come from a user API in production)
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@zetech.ac.ke",
    role: "student",
    eventsAttended: 5,
    status: "active"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@zetech.ac.ke",
    role: "student",
    eventsAttended: 8,
    status: "active"
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@zetech.ac.ke",
    role: "admin",
    eventsAttended: 0,
    status: "active"
  }
];

// Category icons and colors mapping
const categoryIcons: { [key: string]: any } = {
  "IT Club (iTech)": Database,
  "Engineering Club": Zap,
  "Innovation & Mentorship Hub (iZET)": ChartLine,
  "Ajira Club": Globe,
  "Journalism Club": FileText,
  "Entrepreneurs Club": DollarSign,
  "Hotel Club": Home,
  "Tourism Club": MapPin,
  "Community Development Club": Heart,
  "Knowledge Ambassadors Club (ZUKA)": Users,
  "Lions Club": Shield,
  "Rotaract Club": Heart,
  "Football teams": Trophy,
  "Basketball teams": Trophy,
  "Rugby": Trophy,
  "Chess": Trophy,
  "Christian Union": Heart,
  "Muslim Association": Heart,
  "SDA (Seventh Day Adventist)": Heart,
  "Catholic Action": Heart,
  "Zetech university Student Association (ZUSA)": Users,
};

const categoryColors: { [key: string]: string } = {
  "IT Club (iTech)": "blue",
  "Engineering Club": "purple",
  "Innovation & Mentorship Hub (iZET)": "green",
  "Ajira Club": "orange",
  "Journalism Club": "red",
  "Entrepreneurs Club": "yellow",
  "Hotel Club": "pink",
  "Tourism Club": "teal",
  "Community Development Club": "green",
  "Knowledge Ambassadors Club (ZUKA)": "blue",
  "Lions Club": "orange",
  "Rotaract Club": "red",
  "Football teams": "green",
  "Basketball teams": "orange",
  "Rugby": "red",
  "Chess": "purple",
  "Christian Union": "blue",
  "Muslim Association": "green",
  "SDA (Seventh Day Adventist)": "purple",
  "Catholic Action": "red",
  "Zetech university Student Association (ZUSA)": "blue",
};

const AdminDashboard = () => {
  const [events, setEvents] = useState<Event[]>(eventsData);
  const [userSubmittedEvents, setUserSubmittedEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | any>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [users, setUsers] = useState(mockUsers);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "Zetech Event Hub",
    siteDescription: "Your central hub for all campus events",
    adminEmail: "admin@zetech.ac.ke",
    contactPhone: "+254 719 034 500",
    timezone: "Africa/Nairobi",
    language: "en",
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    eventReminders: true,
    newEventAlerts: true,
    userRegistrationAlerts: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    loginAttempts: 5,
    
    // System Settings
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 100,
    maxFileSize: 10,
    autoBackup: true,
    backupFrequency: "daily",
    
    // Appearance Settings
    theme: "light",
    primaryColor: "#3b82f6",
    accentColor: "#f59e0b",
    logoUrl: "",
    faviconUrl: ""
  });
  const [stats, setStats] = useState({
    totalEvents: eventsData.length,
    totalUsers: 0,
    activeEvents: eventsData.filter(e => e.status === "approved").length,
    totalRegistrations: eventsData.reduce((sum, event) => sum + event.registrations, 0),
    totalRevenue: 245680,
    pendingApprovals: 0 // Will be updated with user-submitted pending events
  });

  useEffect(() => {
    // Check if admin is authenticated
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      window.location.href = "/admin/login";
      return;
    }

    // Load user-submitted events from localStorage
    const storedUserEvents = localStorage.getItem('userSubmittedEvents');
    const parsedUserEvents = storedUserEvents ? JSON.parse(storedUserEvents) : [];
    setUserSubmittedEvents(parsedUserEvents);

    // Initialize approvedEvents in localStorage if not exists
    if (!localStorage.getItem('approvedEvents')) {
      localStorage.setItem('approvedEvents', JSON.stringify(eventsData));
    }

    // Update stats with all events including user-submitted
    const allEvents = [...eventsData, ...parsedUserEvents];
    setStats({
      totalEvents: allEvents.length,
      totalUsers: 0,
      activeEvents: allEvents.filter(e => e.status === "approved").length,
      totalRegistrations: allEvents.reduce((sum, event) => sum + (event.registrations || 0), 0),
      totalRevenue: 245680,
      pendingApprovals: parsedUserEvents.filter(e => e.status === "pending").length
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen) {
        const target = event.target as HTMLElement;
        // Check if click is inside any dropdown or on user menu buttons
        const isInsideDropdown = target.closest('[data-dropdown]') || 
                              target.closest('button[aria-haspopup="true"]');
        
        if (!isInsideDropdown) {
          setUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleSaveSettings = () => {
    // Save settings to localStorage (in production, this would be saved to a database)
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    toast.success("Settings saved successfully");
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      setSettings({
        // General Settings
        siteName: "Zetech Event Hub",
        siteDescription: "Your central hub for all campus events",
        adminEmail: "admin@zetech.ac.ke",
        contactPhone: "+254 719 034 500",
        timezone: "Africa/Nairobi",
        language: "en",
        
        // Notification Settings
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        eventReminders: true,
        newEventAlerts: true,
        userRegistrationAlerts: true,
        
        // Security Settings
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordMinLength: 8,
        requireStrongPassword: true,
        loginAttempts: 5,
        
        // System Settings
        maintenanceMode: false,
        debugMode: false,
        apiRateLimit: 100,
        maxFileSize: 10,
        autoBackup: true,
        backupFrequency: "daily",
        
        // Appearance Settings
        theme: "light",
        primaryColor: "#3b82f6",
        accentColor: "#f59e0b",
        logoUrl: "",
        faviconUrl: ""
      });
      toast.success("Settings reset to default values");
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'zetech-event-hub-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success("Settings exported successfully");
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          toast.success("Settings imported successfully");
        } catch (error) {
          toast.error("Failed to import settings. Please check the file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSettingChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully");
    window.location.href = "/admin/login";
  };

  const handleDeleteEvent = (eventId: string) => {
    // Check if it's a user-submitted event
    const userEventIndex = userSubmittedEvents.findIndex(e => e.id === eventId);
    if (userEventIndex !== -1) {
      // Remove from user-submitted events
      const updatedUserEvents = userSubmittedEvents.filter(e => e.id !== eventId);
      setUserSubmittedEvents(updatedUserEvents);
      localStorage.setItem('userSubmittedEvents', JSON.stringify(updatedUserEvents));
      toast.success("User-submitted event deleted successfully");
    } else {
      // Remove from official events
      setEvents(events.filter(event => event.id !== eventId));
      toast.success("Official event deleted successfully");
    }
  };

  const handleToggleEventStatus = (eventId: string) => {
    // Check if it's a user-submitted event
    const userEventIndex = userSubmittedEvents.findIndex(e => e.id === eventId);
    if (userEventIndex !== -1) {
      // Update user-submitted event status
      const updatedUserEvents = userSubmittedEvents.map(event => 
        event.id === eventId 
          ? { ...event, status: event.status === "approved" ? "pending" : "approved" }
          : event
      );
      setUserSubmittedEvents(updatedUserEvents);
      localStorage.setItem('userSubmittedEvents', JSON.stringify(updatedUserEvents));
      toast.success("User-submitted event status updated");
    } else {
      // Update official event status
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, status: event.status === "approved" ? "pending" : "approved" }
          : event
      ));
      toast.success("Official event status updated");
    }
  };

  const handleApproveEvent = (eventId: string) => {
    // Check if it's a user-submitted event
    const userEventIndex = userSubmittedEvents.findIndex(e => e.id === eventId);
    if (userEventIndex !== -1) {
      // Get the event to approve
      const eventToApprove = userSubmittedEvents[userEventIndex];
      const approvedEvent = { ...eventToApprove, status: "approved" as const };
      
      // Add to main events array
      const updatedEvents = [...events, approvedEvent];
      setEvents(updatedEvents);
      
      // Save approved events to localStorage for Events page to access
      localStorage.setItem('approvedEvents', JSON.stringify(updatedEvents));
      
      // Remove from user-submitted events (to avoid duplication)
      const updatedUserEvents = userSubmittedEvents.filter(e => e.id !== eventId);
      setUserSubmittedEvents(updatedUserEvents);
      localStorage.setItem('userSubmittedEvents', JSON.stringify(updatedUserEvents));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApprovals: updatedUserEvents.filter(e => e.status === "pending").length,
        activeEvents: prev.activeEvents + 1,
        totalEvents: prev.totalEvents
      }));
      
      // Dispatch custom event to notify other tabs/components
      window.dispatchEvent(new CustomEvent('userEventsUpdated'));
      
      toast.success("Event approved! It has been moved from pending to active events.");
    }
  };

  const handleViewEvent = (event: Event | any) => {
    setSelectedEvent(event);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  const handleAddEvent = () => {
    setShowAddEventModal(true);
  };

  const handleEditEvent = (event: Event | any) => {
    setEditingEvent(event);
    setShowAddEventModal(true);
  };

  const handleSaveEvent = (eventData: any) => {
    if (editingEvent) {
      // Update existing event
      if (editingEvent.id.startsWith('user-')) {
        // Update user-submitted event
        const updatedUserEvents = userSubmittedEvents.map(e => 
          e.id === editingEvent.id ? { ...e, ...eventData } : e
        );
        setUserSubmittedEvents(updatedUserEvents);
        localStorage.setItem('userSubmittedEvents', JSON.stringify(updatedUserEvents));
      } else {
        // Update official event
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e));
      }
      toast.success("Event updated successfully");
    } else {
      // Add new event
      const newEvent = {
        ...eventData,
        id: `admin-${Date.now()}`,
        status: "approved" as const,
        registrations: 0,
        posterUrl: ""
      };
      setEvents([...events, newEvent]);
      toast.success("Event added successfully");
    }
    setShowAddEventModal(false);
    setEditingEvent(null);
  };

  const getAllEvents = () => {
    return [...events, ...userSubmittedEvents];
  };

  const getEventIcon = (category: string) => {
    return categoryIcons[category] || Calendar;
  };

  const getEventColor = (category: string) => {
    return categoryColors[category] || "gray";
  };

  return (
    <div className="bg-gray-50 min-h-screen relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFD700' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Header */}
      <header className="hero-gradient shadow-2xl border-b border-white/10 pb-8 relative z-10 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold-gradient/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between p-6 gap-4">
            {/* Mobile Menu Button - Only shown on mobile, positioned at left */}
            <div className="lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-white/10"
              >
                <Menu className="text-xl" />
              </button>
            </div>
            
            <div className="hidden lg:flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-xl p-3 shadow-lg border-2 border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <img 
                  src={zetechLogo}
                  alt="Zetech University Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center lg:text-left">
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-white/90 text-sm font-medium">Zetech University Event Hub Management</p>
              </div>
            </div>

            {/* Navigation - Hidden on Mobile, Shown on Desktop */}
            <nav className="hidden lg:flex items-center space-x-2">
              <button 
                onClick={() => setActiveSection("dashboard")}
                className={`text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center px-4 py-2 rounded-lg font-medium ${
                  activeSection === "dashboard" ? "bg-white/20 text-white shadow-lg" : ""
                }`}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveSection("events")}
                className={`text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center px-4 py-2 rounded-lg font-medium ${
                  activeSection === "events" ? "bg-white/20 text-white shadow-lg" : ""
                }`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Events
                {stats.pendingApprovals > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center shadow-lg animate-pulse">
                    {stats.pendingApprovals}
                  </span>
                )}
              </button>
              <button className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center px-4 py-2 rounded-lg font-medium">
                <Users className="mr-2 h-4 w-4" />
                Users
              </button>
              <button className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center px-4 py-2 rounded-lg font-medium">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </button>
              <button 
                onClick={() => setActiveSection("settings")}
                className={`text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center px-4 py-2 rounded-lg font-medium ${
                  activeSection === "settings" ? "bg-white/20 text-white shadow-lg" : ""
                }`}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
            </nav>

            {/* User Menu - Hidden on Mobile, Shown on Desktop */}
            <div className="hidden lg:flex items-center space-x-3 relative">
              <button className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 p-2 rounded-lg hover:scale-110">
                <Bell className="h-5 w-5" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 px-4 py-2 rounded-lg font-medium"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium hidden sm:block">Admin User</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userDropdownOpen && (
                  <div data-dropdown className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 py-2 z-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-1 px-2 py-2 text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg mx-2 my-1 text-sm"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Notification & User Menu - Only shown on mobile */}
            <div className="lg:hidden flex items-center space-x-2 relative">
              <button className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 p-2 rounded-lg">
                <Bell className="h-5 w-5" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 px-3 py-2 rounded-lg font-medium"
                >
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userDropdownOpen && (
                  <div data-dropdown className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 py-2 z-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg mx-2 my-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-all duration-500 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Sidebar Header */}
          <div className="hero-gradient text-white p-6 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="relative z-10 flex items-center space-x-4">
              <div className="w-14 h-14 bg-white rounded-xl p-3 border-2 border-white/30 shadow-lg">
                <img 
                  src={zetechLogo}
                  alt="Zetech University Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
                <p className="text-sm opacity-90 font-medium">Event Hub Management</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                setActiveSection("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                activeSection === "dashboard"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:shadow-md"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeSection === "dashboard" ? "bg-white/20" : "bg-blue-100"
                }`}>
                  <Home className={`h-5 w-5 ${
                    activeSection === "dashboard" ? "text-white" : "text-blue-600"
                  }`} />
                </div>
                <span className="font-semibold">Dashboard</span>
              </div>
              {activeSection === "dashboard" && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("events");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                activeSection === "events"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:shadow-md"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeSection === "events" ? "bg-white/20" : "bg-blue-100"
                }`}>
                  <Calendar className={`h-5 w-5 ${
                    activeSection === "events" ? "text-white" : "text-blue-600"
                  }`} />
                </div>
                <span className="font-semibold">Events</span>
              </div>
              <div className="flex items-center space-x-2">
                {stats.pendingApprovals > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center shadow-lg animate-pulse">
                    {stats.pendingApprovals}
                  </span>
                )}
                {activeSection === "events" && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </button>

            <button className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold">Users</span>
              </div>
            </button>

            <button className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold">Analytics</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSection("settings");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                activeSection === "settings"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:shadow-md"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeSection === "settings" ? "bg-white/20" : "bg-blue-100"
                }`}>
                  <Settings className={`h-5 w-5 ${
                    activeSection === "settings" ? "text-white" : "text-blue-600"
                  }`} />
                </div>
                <span className="font-semibold">Settings</span>
              </div>
              {activeSection === "settings" && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 p-4">
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button className="text-gray-600 hover:text-blue-600 transition-colors p-2">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 mt-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {activeSection === "dashboard" ? (
          <div className="space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Events */}
              <div className="group relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-2 overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Calendar className="text-white text-xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Events</p>
                        <p className="text-3xl font-bold text-gray-800 tracking-tight">{stats.totalEvents}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <ArrowUp className="mr-1 h-4 w-4" />
                      <span>12%</span>
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                    <div className="w-16 h-8">
                      <svg viewBox="0 0 64 32" className="w-full h-full">
                        <path d="M0,28 Q16,20 32,24 T64,16" stroke="#10b981" strokeWidth="2" fill="none" className="opacity-60"/>
                        <path d="M0,28 Q16,20 32,24 T64,16" stroke="#10b981" strokeWidth="2" fill="none" className="animate-pulse"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="group relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-2 overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Users className="text-white text-xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-3xl font-bold text-gray-800 tracking-tight">{stats.totalUsers.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <ArrowUp className="mr-1 h-4 w-4" />
                      <span>8%</span>
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                    <div className="w-16 h-8">
                      <svg viewBox="0 0 64 32" className="w-full h-full">
                        <path d="M0,24 Q16,16 32,20 T64,12" stroke="#10b981" strokeWidth="2" fill="none" className="opacity-60"/>
                        <path d="M0,24 Q16,16 32,20 T64,12" stroke="#10b981" strokeWidth="2" fill="none" className="animate-pulse"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="group relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-2 overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Clock className="text-white text-xl" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-3xl font-bold text-gray-800 tracking-tight">{stats.pendingApprovals}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-red-600 text-sm font-medium">
                      <ArrowDown className="mr-1 h-4 w-4" />
                      <span>3%</span>
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                    <div className="w-16 h-8">
                      <svg viewBox="0 0 64 32" className="w-full h-full">
                        <path d="M0,16 Q16,24 32,20 T64,28" stroke="#ef4444" strokeWidth="2" fill="none" className="opacity-60"/>
                        <path d="M0,16 Q16,24 32,20 T64,28" stroke="#ef4444" strokeWidth="2" fill="none" className="animate-pulse"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

                          </div>

            {/* Recent Events */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Recent Events</h2>
                  <p className="text-sm text-gray-600">Latest activities and updates</p>
                </div>
                <button 
                  onClick={() => setActiveSection("events")}
                  className="mt-4 md:mt-0 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:shadow-lg hover:scale-105 font-medium"
                >
                  View All Events
                </button>
              </div>
              {getAllEvents().length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-lg text-gray-600 mb-2">No events available</p>
                  <p className="text-sm text-gray-500">Create your first event to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show user-submitted events first (pending approval) */}
                  {userSubmittedEvents.slice(0, 3).map((event) => {
                    const IconComponent = getEventIcon(event.category);
                    const eventColor = getEventColor(event.category);
                    return (
                      <div key={event.id} className="group relative bg-gradient-to-r from-yellow-50/50 to-orange-50/50 border border-yellow-200/50 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 bg-gradient-to-br from-${eventColor}-400 to-${eventColor}-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                              <IconComponent className={`text-white h-7 w-7`} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg mb-1">{event.title}</h3>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                                <Clock className="h-4 w-4 ml-3 mr-1" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full font-medium shadow-md">
                                  User Submitted
                                </span>
                                <span className="text-xs bg-gradient-to-r from-orange-400 to-red-400 text-white px-3 py-1 rounded-full font-medium shadow-md animate-pulse">
                                  Pending Approval
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right mt-4 md:mt-0">
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">{event.registrations || 0}</span> registered
                            </div>
                            <div className="flex flex-row md:flex-col gap-2">
                              <button 
                                onClick={() => handleViewEvent(event)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors group-hover:scale-110"
                                title="View Event Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleApproveEvent(event.id)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors group-hover:scale-110"
                                title="Approve Event"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleEventStatus(event.id)}
                                className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors group-hover:scale-110"
                                title="Toggle Status"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors group-hover:scale-110"
                                title="Delete Event"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Show official events */}
                  {events.slice(0, Math.max(0, 3 - userSubmittedEvents.length)).map((event) => {
                    const IconComponent = getEventIcon(event.category);
                    const eventColor = getEventColor(event.category);
                    return (
                      <div key={event.id} className="group relative bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 bg-gradient-to-br from-${eventColor}-400 to-${eventColor}-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                              <IconComponent className={`text-white h-7 w-7`} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg mb-1">{event.title}</h3>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                                <Clock className="h-4 w-4 ml-3 mr-1" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs bg-gradient-to-r from-blue-400 to-blue-600 text-white px-3 py-1 rounded-full font-medium shadow-md">
                                  Official Event
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium shadow-md ${
                                  event.status === "approved" 
                                    ? "bg-gradient-to-r from-green-400 to-green-600 text-white" 
                                    : "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right mt-4 md:mt-0">
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">{event.registrations}</span> registered
                            </div>
                            <div className="flex flex-row md:flex-col gap-2">
                              <button 
                                onClick={() => handleViewEvent(event)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors group-hover:scale-110"
                                title="View Event Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleEventStatus(event.id)}
                                className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors group-hover:scale-110"
                                title="Toggle Status"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors group-hover:scale-110"
                                title="Delete Event"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Activity */}
              <div className="group bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">User Activity</h2>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="group/item flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">New Registrations</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 group-hover/item:scale-110 transition-transform">+24 today</span>
                  </div>
                  <div className="group/item flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                      <span className="text-sm font-medium text-gray-700">Active Sessions</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 group-hover/item:scale-110 transition-transform">142</span>
                  </div>
                  <div className="group/item flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-150"></div>
                      <span className="text-sm font-medium text-gray-700">Pending Reviews</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600 group-hover/item:scale-110 transition-transform">8</span>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="group bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">System Status</h2>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Server className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="group/item flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">Database</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-green-600 group-hover/item:scale-110 transition-transform">Operational</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="group/item flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
                      <span className="text-sm font-medium text-gray-700">API Server</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-green-600 group-hover/item:scale-110 transition-transform">Operational</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="group/item flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-yellow-50 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-150"></div>
                      <span className="text-sm font-medium text-gray-700">Email Service</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-yellow-600 group-hover/item:scale-110 transition-transform">Maintenance</span>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === "events" ? (
          <div className="space-y-6">
            {/* Events Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">Event Management</h1>
                <p className="text-gray-600 font-medium">Manage all events - official and user-submitted</p>
              </div>
              <Button onClick={handleAddEvent} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 font-medium">
                <Plus className="h-5 w-5" />
                Add New Event
              </Button>
            </div>

            {/* Pending Approvals Section */}
            {userSubmittedEvents.filter(e => e.status === "pending").length > 0 && (
              <div className="bg-gradient-to-r from-orange-50/80 to-yellow-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-orange-800 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      Pending Approvals
                    </h2>
                    <p className="text-sm text-orange-600 font-medium mt-1">
                      {userSubmittedEvents.filter(e => e.status === "pending").length} events awaiting approval
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg">
                    {userSubmittedEvents.filter(e => e.status === "pending").length} Pending
                  </Badge>
                </div>
                <div className="space-y-3">
                  {userSubmittedEvents.filter(e => e.status === "pending").map((event) => {
                    const IconComponent = getEventIcon(event.category);
                    const eventColor = getEventColor(event.category);
                    
                    return (
                      <div key={event.id} className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 bg-${eventColor}-100 rounded-lg flex items-center justify-center`}>
                              <IconComponent className={`text-${eventColor}-600 h-6 w-6`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 text-lg">{event.title}</h3>
                              <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} • {event.time}</p>
                              <p className="text-sm text-gray-600">{event.venue}</p>
                              <p className="text-sm text-gray-600">{event.campus}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  User Submitted
                                </span>
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  Pending Approval
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                  {event.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewEvent(event)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                              title="View Event Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleApproveEvent(event.id)}
                              className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                              title="Approve Event"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="text-yellow-600 hover:text-yellow-800 p-2 rounded hover:bg-yellow-50"
                              title="Edit Event"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                              title="Delete Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Events List */}
            <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
              {getAllEvents().length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg text-gray-600 mb-4">No events available</p>
                  <p className="text-sm text-gray-500">Use the "Add New Event" button above to create your first event</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getAllEvents().map((event) => {
                    const IconComponent = getEventIcon(event.category);
                    const eventColor = getEventColor(event.category);
                    const isUserSubmitted = event.id.startsWith('user-');
                    
                    return (
                      <div key={event.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        isUserSubmitted 
                          ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-${eventColor}-100 rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`text-${eventColor}-600 h-6 w-6`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{event.title}</h3>
                            <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} • {event.time}</p>
                            <p className="text-sm text-gray-600">{event.venue}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                isUserSubmitted 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {isUserSubmitted ? "User Submitted" : "Official Event"}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                event.status === "approved" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-orange-100 text-orange-800"
                              }`}>
                                {event.status}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                {event.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <span className="text-sm text-gray-600">{event.registrations || 0} / {event.capacity} registered</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewEvent(event)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="View Event Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="text-yellow-600 hover:text-yellow-800 text-sm"
                              title="Edit Event"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {isUserSubmitted && event.status === "pending" && (
                              <button 
                                onClick={() => handleApproveEvent(event.id)}
                                className="text-green-600 hover:text-green-800 text-sm"
                                title="Approve Event"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Delete Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeSection === "settings" ? (
          <SettingsComponent
            settings={settings}
            onSettingChange={handleSettingChange}
            onSaveSettings={handleSaveSettings}
            onResetSettings={handleResetSettings}
            onExportSettings={handleExportSettings}
            onImportSettings={handleImportSettings}
          />
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
            <p className="text-gray-600">This section is under development</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="hero-gradient text-primary-foreground">
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-heading font-bold text-lg mb-3">Zetech Events Portal</h3>
              <p className="text-sm opacity-80">
                Your central hub for all campus events, activities, and experiences at Zetech University.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><button className="hover:text-white hover:underline transition-all">All Events</button></li>
                <li><button className="hover:text-white hover:underline transition-all">Campus Calendar</button></li>
                <li><a href="https://portal.zetech.ac.ke" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">Student Portal</a></li>
                <li><a href="https://elearning.zetech.ac.ke" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">E-learning Portal</a></li>
                <li><a href="https://zetech.ac.ke" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">Zetech University</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Email: info@zetech.ac.ke</li>
                <li>Call: +254 719 034 500</li>
                <li>WhatsApp: +254 706 622 557</li>
                <li>Main Campus, Off Thika Road - Ruiru</li>
                <li>P.O. Box 2768 00200, Nairobi</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-primary-foreground/20 text-center text-sm opacity-60">
           Copyright &copy; 2026 Zetech University | Inventing your Future. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && closeEventModal()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedEvent.status === "approved" ? "default" : "secondary"}>
                      {selectedEvent.status}
                    </Badge>
                    <Badge variant="outline">{selectedEvent.category}</Badge>
                    {selectedEvent.id.startsWith('user-') && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        User Submitted
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Event Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Date:</span>
                        <span>{new Date(selectedEvent.date).toLocaleDateString("en-US", { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Time:</span>
                        <span>{selectedEvent.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Venue:</span>
                        <span>{selectedEvent.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Campus:</span>
                        <span>{selectedEvent.campus}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Organizer:</span>
                        <span>{selectedEvent.organizer}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Registration Info</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Capacity:</span>
                        <span>{selectedEvent.capacity} attendees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Registered:</span>
                        <span>{selectedEvent.registrations || 0} attendees</span>
                      </div>
                                          </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Registration Progress</h3>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, ((selectedEvent.registrations || 0) / selectedEvent.capacity) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedEvent.registrations || 0} of {selectedEvent.capacity} spots filled
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {selectedEvent.id.startsWith('user-') && selectedEvent.status === "pending" && (
                    <Button 
                      onClick={() => handleApproveEvent(selectedEvent.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Event
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleToggleEventStatus(selectedEvent.id)}
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Toggle Status
                  </Button>
                  <Button 
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={closeEventModal}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Event Modal */}
      <Dialog open={showAddEventModal} onOpenChange={(open) => !open && setShowAddEventModal(false)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update event details below" : "Fill in the details to create a new event"}
            </DialogDescription>
          </DialogHeader>
          
          <AddEditEventForm 
            event={editingEvent}
            onSave={handleSaveEvent}
            onCancel={() => setShowAddEventModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add/Edit Event Form Component
const AddEditEventForm = ({ event, onSave, onCancel }: { event: any, onSave: (data: any) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date || "",
    time: event?.time || "",
    venue: event?.venue || "",
    campus: event?.campus || "",
    category: event?.category || "",
    organizer: event?.organizer || "Admin",
    capacity: event?.capacity || "",
    posterUrl: event?.posterUrl || ""
  });

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(event?.posterUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size <= 5 * 1024 * 1024) { // 5MB limit
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setPreviewUrl(result);
          setFormData(prev => ({ ...prev, posterUrl: result }));
          setUploadedFile(file);
        };
        reader.readAsDataURL(file);
      } else {
        alert('File size must be less than 5MB');
      }
    } else {
      alert('Please upload an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const removeFile = () => {
    setPreviewUrl("");
    setFormData(prev => ({ ...prev, posterUrl: "" }));
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            placeholder="Enter event title"
            required
          />
        </div>

        {/* Event Flyer Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Event Flyer</label>
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
              isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 bg-white/60 backdrop-blur-sm hover:bg-white/80'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Event flyer preview" 
                    className="mx-auto h-32 w-32 object-cover rounded-xl shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 font-medium">Event flyer uploaded</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Drag and drop your flyer here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => handleInputChange("time", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Venue *</label>
          <input
            type="text"
            value={formData.venue}
            onChange={(e) => handleInputChange("venue", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            placeholder="Enter event venue"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Campus *</label>
          <select
            value={formData.campus}
            onChange={(e) => handleInputChange("campus", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            required
          >
            <option value="">Select Campus</option>
            {campuses.map((campus) => (
              <option key={campus} value={campus}>{campus}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            required
          >
            <option value="">Select Category</option>
            {allSubCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Organizer *</label>
          <input
            type="text"
            value={formData.organizer}
            onChange={(e) => handleInputChange("organizer", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            placeholder="Enter organizer name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity *</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => handleInputChange("capacity", e.target.value)}
            min="1"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            placeholder="Enter event capacity"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={5}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm resize-none"
          placeholder="Enter event description"
          required
        />
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 font-medium"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg font-medium"
        >
          {event ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
};

export default AdminDashboard;
