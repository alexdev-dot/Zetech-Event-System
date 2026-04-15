import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { events as eventsData, categories, departments, type Event } from "@/data/events";
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
  Eye,
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
  Upload,
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

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  "Technology": Trophy,
  "Culture": Music,
  "Career": TrendingUp,
  "Sports": Trophy,
  "Business": DollarSign,
  "Wellness": Heart
};

// Color mapping for categories
const categoryColors: Record<string, string> = {
  "Technology": "blue",
  "Culture": "purple",
  "Career": "green",
  "Sports": "orange",
  "Business": "yellow",
  "Wellness": "red"
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
    totalUsers: 1847,
    activeEvents: eventsData.filter(e => e.status === "approved").length,
    totalRegistrations: eventsData.reduce((sum, event) => sum + event.registrations, 0),
    totalRevenue: 245680,
    pendingApprovals: eventsData.filter(e => e.status === "pending").length
  });

  useEffect(() => {
    // Check if admin is authenticated
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      window.location.href = "/admin/login";
      return;
    }

    // Load user-submitted events from localStorage
    const userEvents = JSON.parse(localStorage.getItem('userSubmittedEvents') || '[]');
    setUserSubmittedEvents(userEvents);

    // Update stats to include user-submitted events
    const allEvents = [...eventsData, ...userEvents];
    setStats({
      totalEvents: allEvents.length,
      totalUsers: 1847,
      activeEvents: allEvents.filter(e => e.status === "approved").length,
      totalRegistrations: allEvents.reduce((sum, event) => sum + (event.registrations || 0), 0),
      totalRevenue: 245680,
      pendingApprovals: allEvents.filter(e => e.status === "pending").length
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
      // Approve user-submitted event and move to official events
      const eventToApprove = userSubmittedEvents[userEventIndex];
      const updatedUserEvent = { ...eventToApprove, status: "approved" as const };
      
      // Add to official events
      setEvents([...events, updatedUserEvent]);
      
      // Remove from user-submitted events
      const updatedUserEvents = userSubmittedEvents.filter(e => e.id !== eventId);
      setUserSubmittedEvents(updatedUserEvents);
      localStorage.setItem('userSubmittedEvents', JSON.stringify(updatedUserEvents));
      
      toast.success("Event approved and moved to official events");
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
      <header className="hero-gradient shadow-lg border-b border-gray-200 pb-6 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between p-4 gap-4">
            {/* Mobile Menu Button - Only shown on mobile, positioned at left */}
            <div className="lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-white/80 transition-colors"
              >
                <Menu className="text-xl" />
              </button>
            </div>
            
            <div className="hidden lg:flex items-center space-x-3">
              <div className="w-16 h-16 bg-white rounded-lg p-2 border">
                <img 
                  src={zetechLogo}
                  alt="Zetech University Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center lg:text-left">
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/90 text-sm">Zetech University Event Hub Management</p>
              </div>
            </div>

            {/* Navigation - Hidden on Mobile, Shown on Desktop */}
            <nav className="hidden lg:flex items-center space-x-6">
              <button 
                onClick={() => setActiveSection("dashboard")}
                className={`text-white hover:text-white/80 transition-colors flex items-center ${
                  activeSection === "dashboard" ? "text-white font-semibold" : ""
                }`}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveSection("events")}
                className={`text-white hover:text-white/80 transition-colors flex items-center ${
                  activeSection === "events" ? "text-white font-semibold" : ""
                }`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </button>
              <button className="text-white hover:text-white/80 transition-colors flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Users
              </button>
              <button className="text-white hover:text-white/80 transition-colors flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </button>
              <button 
                onClick={() => setActiveSection("settings")}
                className={`text-white hover:text-white/80 transition-colors flex items-center ${
                  activeSection === "settings" ? "text-white font-semibold" : ""
                }`}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
            </nav>

            {/* User Menu - Hidden on Mobile, Shown on Desktop */}
            <div className="hidden lg:flex items-center space-x-4 relative">
              <button className="text-white hover:text-white/80 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 text-white hover:text-white/80 transition-colors"
                >
                  <span className="font-medium hidden sm:block">Admin User</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userDropdownOpen && (
                  <div data-dropdown className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Notification & User Menu - Only shown on mobile */}
            <div className="lg:hidden flex items-center space-x-3 relative">
              <button className="text-white hover:text-white/80 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
                >
                  <span className="font-medium text-sm">Admin User</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userDropdownOpen && (
                  <div data-dropdown className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
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
          className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Sidebar Header */}
          <div className="hero-gradient text-white p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg p-2 border">
                <img 
                  src={zetechLogo}
                  alt="Zetech University Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold">Admin Panel</h2>
                <p className="text-sm opacity-90">Event Hub Management</p>
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                activeSection === "dashboard"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700"
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveSection("events");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                activeSection === "events"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Events</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-300 transform hover:scale-105">
              <Users className="h-5 w-5" />
              <span className="font-medium">Users</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-300 transform hover:scale-105">
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveSection("settings");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                activeSection === "settings"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button className="text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {activeSection === "dashboard" ? (
          <div className="space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Events */}
              <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:translate-y-[-2px]">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-blue-600 text-lg md:text-xl" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Total Events</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">{stats.totalEvents}</p>
                    </div>
                  </div>
                  <span className="text-green-600 text-sm flex items-center">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    12%
                  </span>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:translate-y-[-2px]">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="text-green-600 text-lg md:text-xl" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-green-600 text-sm flex items-center">
                    <ArrowUp className="mr-1 h-3 w-3" />
                    8%
                  </span>
                </div>
              </div>

              
              {/* Pending Approvals */}
              <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:translate-y-[-2px]">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-orange-600 text-lg md:text-xl" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Pending Approvals</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">{stats.pendingApprovals}</p>
                    </div>
                  </div>
                  <span className="text-red-600 text-sm flex items-center">
                    <ArrowDown className="mr-1 h-3 w-3" />
                    3%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Events</h2>
                <button 
                  onClick={() => setActiveSection("events")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {/* Show user-submitted events first (pending approval) */}
                {userSubmittedEvents.slice(0, 3).map((event) => {
                  const IconComponent = getEventIcon(event.category);
                  const eventColor = getEventColor(event.category);
                  return (
                    <div key={event.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-${eventColor}-100 rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`text-${eventColor}-600 h-5 w-5`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm md:text-base">{event.title}</h3>
                          <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} • {event.time}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">User Submitted</span>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Pending Approval</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">0 registered</span>
                        <div className="flex flex-row md:flex-col gap-2 mt-2">
                          <button 
                            onClick={() => handleViewEvent(event)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="View Event Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleApproveEvent(event.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                            title="Approve Event"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleEventStatus(event.id)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm"
                            title="Toggle Status"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
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
                
                {/* Show official events */}
                {events.slice(0, Math.max(0, 3 - userSubmittedEvents.length)).map((event) => {
                  const IconComponent = getEventIcon(event.category);
                  const eventColor = getEventColor(event.category);
                  return (
                    <div key={event.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-${eventColor}-100 rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`text-${eventColor}-600 h-5 w-5`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm md:text-base">{event.title}</h3>
                          <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} • {event.time}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Official Event</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              event.status === "approved" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">{event.registrations} registered</span>
                        <div className="flex flex-row md:flex-col gap-2 mt-2">
                          <button 
                            onClick={() => handleViewEvent(event)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="View Event Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleEventStatus(event.id)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm"
                            title="Toggle Status"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
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
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* User Activity */}
              <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">User Activity</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Registrations</span>
                    <span className="text-sm font-semibold text-green-600">+24 today</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="text-sm font-semibold text-blue-600">142</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Reviews</span>
                    <span className="text-sm font-semibold text-orange-600">8</span>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm font-semibold text-green-600">Operational</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Server</span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm font-semibold text-green-600">Operational</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Service</span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      <span className="text-sm font-semibold text-yellow-600">Maintenance</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === "events" ? (
          <div className="space-y-6">
            {/* Events Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl font-bold text-foreground mb-2">All Events</h1>
                <p className="text-muted-foreground">Manage all events - official and user-submitted</p>
              </div>
              <Button onClick={handleAddEvent} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Event
              </Button>
            </div>

            {/* Events List */}
            <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Department:</span>
                        <span>{selectedEvent.department}</span>
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
    department: event?.department || "",
    category: event?.category || "",
    organizer: event?.organizer || "Admin",
    capacity: event?.capacity || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
          <input
            type="text"
            value={formData.time}
            onChange={(e) => handleInputChange("time", e.target.value)}
            placeholder="e.g., 2:00 PM - 5:00 PM"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Venue *</label>
          <input
            type="text"
            value={formData.venue}
            onChange={(e) => handleInputChange("venue", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
          <select
            value={formData.department}
            onChange={(e) => handleInputChange("department", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Organizer *</label>
          <input
            type="text"
            value={formData.organizer}
            onChange={(e) => handleInputChange("organizer", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => handleInputChange("capacity", e.target.value)}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {event ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
};

export default AdminDashboard;
