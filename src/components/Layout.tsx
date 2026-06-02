import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bell, User, LogOut, LogIn, Mail, Phone, ChevronDown, CheckCheck, UserCheck, ThumbsUp, ThumbsDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSocket, Notification } from "@/contexts/SocketContext";
import zetechLogo from "@/assets/zetech-logo.png";
import WhatsAppButton from "@/components/WhatsAppButton";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import SocialMediaIcons from "@/components/SocialMediaIcons";

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notifIcon(type: Notification["type"]) {
  switch (type) {
    case "registration:success": return <UserCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    case "event:your-event-approved": return <ThumbsUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
    case "event:your-event-rejected": return <ThumbsDown className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    case "event:new-registration": return <Users className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />;
    case "event:posted": return <Bell className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />;
  }
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);
  const [mobileEventsDropdownOpen, setMobileEventsDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAllRead, clearNotification } = useSocket();

  // Filter notifications based on user role
  const filteredNotifications = notifications.filter((notif) => {
    if (user?.role === "user") {
      // Students: Only see event:posted notifications
      return notif.type === "event:posted";
    } else if (user?.role === "club_leader") {
      // Club leaders: Only see event:your-event-approved and event:your-event-rejected
      return notif.type === "event:your-event-approved" || notif.type === "event:your-event-rejected";
    }
    // Admins: See all notifications
    return true;
  });

  const filteredUnreadCount = filteredNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBellClick = () => {
    if (isMobile) {
      setMobileNotifOpen((prev) => !prev);
      setNotifOpen(false);
    } else {
      setNotifOpen((prev) => !prev);
      setMobileNotifOpen(false);
    }
  };

  const handleNotifClick = (notif: Notification) => {
    clearNotification(notif.id);
    setNotifOpen(false);
    setMobileNotifOpen(false);
    if (notif.eventId) navigate(`/events/${notif.eventId}`);
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Events", path: "/events", hasDropdown: true },
    { label: "My Events", path: "/my-events" },
    { label: "Calendar", path: "/calendar" },
  ];

  const eventsDropdownItems = [
    { label: "All Events", path: "/events" },
    { label: "Today's Events", path: "/events/today" },
    { label: "This Week Events", path: "/events/week" },
    { label: "This Month Events", path: "/events/month" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar - Hidden on Auth Page and Mobile */}
      {location.pathname !== "/auth" && (
        <div className="hero-gradient hidden md:block">
          <div className="container flex items-center justify-between py-2 text-white text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>info@zetech.ac.ke</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>+254 719 034 500</span>
              </div>
              <div className="flex items-center gap-1">
                <WhatsAppIcon />
                <span>+254 706 622 557</span>
              </div>
            </div>
            <SocialMediaIcons />
          </div>
        </div>
      )}

      {/* Main Header - Hidden on Auth Page */}
      {location.pathname !== "/auth" && (
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container flex items-center justify-between h-14 md:h-20 px-4 md:px-0">
            <Link to="/" className="flex items-center gap-3 ml-4 md:ml-8">
              <img
                src={zetechLogo}
                alt="Zetech University Logo"
                className="h-10 md:h-16 w-auto object-contain"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.path} className="relative">
                  {link.hasDropdown ? (
                    <div
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1 text-foreground hover:bg-muted ${
                        eventsDropdownOpen ? "bg-muted" : ""
                      }`}
                      onMouseEnter={() => setEventsDropdownOpen(true)}
                      onMouseLeave={() => setEventsDropdownOpen(false)}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-300 ease-in-out ${
                          eventsDropdownOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  ) : (
                    <Link
                      to={link.path}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === link.path
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )}

                  {link.hasDropdown && (
                    <div
                      className={`absolute top-full left-0 mt-1 w-56 bg-gray-500 border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto transition-all duration-300 ease-in-out transform origin-top ${
                        eventsDropdownOpen
                          ? "opacity-100 scale-100 translate-y-0 visible"
                          : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
                      }`}
                      onMouseEnter={() => setEventsDropdownOpen(true)}
                      onMouseLeave={() => setEventsDropdownOpen(false)}
                    >
                      <div className="py-2">
                        {eventsDropdownItems.map((item, index) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-4 py-3 text-sm text-white hover:bg-black transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-white transform ${
                              eventsDropdownOpen
                                ? "translate-x-0 opacity-100"
                                : "-translate-x-2 opacity-0"
                            }`}
                            style={{
                              transitionDelay: eventsDropdownOpen ? `${index * 50}ms` : "0ms",
                            }}
                            onClick={() => setEventsDropdownOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Notification Bell - Visible on both desktop and mobile */}
                  <div className="relative" ref={notifRef}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      onClick={handleBellClick}
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {filteredUnreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                          {filteredUnreadCount > 9 ? "9+" : filteredUnreadCount}
                        </span>
                      )}
                    </Button>

                    {/* Notification Dropdown - Desktop */}
                    {notifOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden hidden md:block">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                          <span className="font-semibold text-sm">Notifications</span>
                          {filteredUnreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <CheckCheck className="w-3 h-3" />
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto divide-y">
                          {filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                              <Bell className="w-7 h-7 opacity-30" />
                              <span className="text-sm">No notifications yet</span>
                            </div>
                          ) : (
                            filteredNotifications.map((notif) => (
                              <div
                                key={notif.id}
                                onClick={() => handleNotifClick(notif)}
                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/60 ${
                                  !notif.read ? "bg-primary/5" : ""
                                }`}
                              >
                                {notifIcon(notif.type)}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                                    {timeAgo(notif.timestamp)}
                                  </p>
                                </div>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {notifications.length > 0 && (
                          <div className="px-4 py-2 border-t bg-muted/30 text-center">
                            <button
                              onClick={() => { markAllRead(); setNotifOpen(false); }}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Profile Button - Visible on both desktop and mobile */}
                  <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/profile")}>
                    <User className="w-5 h-5" />
                  </Button>
                  {/* Sign Out Button - Hidden on mobile, visible in mobile menu */}
                  <Button variant="ghost" size="icon" className="hidden md:block" onClick={handleSignOut} title="Sign Out">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  {/* Sign In Button - Hidden on mobile, visible in mobile menu */}
                  <Button variant="ghost" size="sm" asChild className="hidden md:flex mr-2">
                    <Link to="/auth">
                      <LogIn className="w-4 h-4 mr-1" /> Sign In
                    </Link>
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <nav className="md:hidden border-t bg-card px-4 py-4">
              {navLinks.map((link) => (
                <div key={link.path}>
                  {link.hasDropdown ? (
                    <div>
                      <button
                        onClick={() => setMobileEventsDropdownOpen(!mobileEventsDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-4 rounded-md text-sm font-medium transition-colors text-foreground hover:bg-muted min-h-[48px]"
                      >
                        {link.label}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            mobileEventsDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {mobileEventsDropdownOpen && (
                        <div className="ml-4 space-y-1">
                          {eventsDropdownItems.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setMobileOpen(false)}
                              className="block w-full px-4 py-3 rounded-md text-sm font-medium transition-colors text-foreground hover:bg-muted min-h-[48px]"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={`block w-full px-4 py-4 rounded-md text-sm font-medium transition-colors min-h-[48px] ${
                        location.pathname === link.path
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
              {user ? (
                <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 min-h-[48px]"
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" asChild className="w-full justify-center min-h-[48px]">
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <LogIn className="w-4 h-4 mr-1" /> Sign In
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          )}

          {/* Mobile Notification Panel */}
          {mobileNotifOpen && (
            <nav className="md:hidden border-t bg-card px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-lg">Notifications</span>
                {filteredUnreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Bell className="w-12 h-12 opacity-30" />
                  <span className="text-base">No notifications yet</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`flex items-start gap-3 px-4 py-4 rounded-lg cursor-pointer transition-colors hover:bg-muted/60 min-h-[72px] ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      {notifIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {timeAgo(notif.timestamp)}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {notifications.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => { markAllRead(); setMobileNotifOpen(false); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </nav>
          )}
        </header>
      )}

      <main className="flex-1">{children}</main>

      {/* Footer - Hidden on Auth Page */}
      {location.pathname !== "/auth" && (
        <footer className="hero-gradient text-primary-foreground">
          <div className="px-4 md:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <div>
                <h3 className="font-heading font-bold text-lg mb-3">Zetech Events Portal</h3>
                <p className="text-sm opacity-80">
                  Your central hub for all campus events, activities, and experiences at Zetech University.
                </p>
              </div>
              <div>
                <h4 className="font-heading font-semibold mb-3">Quick Links</h4>
                <ul className="space-y-2 text-sm opacity-80">
                  <li><Link to="/events" className="hover:text-white hover:underline transition-all">All Events</Link></li>
                  <li><Link to="/calendar" className="hover:text-white hover:underline transition-all">Campus Calendar</Link></li>
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
          </div>
          <div className="mt-8 pt-6 pb-6 border-t border-primary-foreground/20 text-center text-xs text-gray-300 bg-red-800">
            <div className="px-4 md:px-8">
              Copyright &copy; 2026 Zetech University | Inventing your Future. All rights reserved.
            </div>
          </div>
        </footer>
      )}
      <WhatsAppButton />
    </div>
  );
};

export default Layout;
