import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { type Event } from "@/data/events";
import { api } from "@/lib/api";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Facebook, Twitter, Link2, Mail, CheckCircle, AlertCircle, QrCode, Download, Heart, Eye, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    // Load event from API
    const loadEvent = async () => {
      if (!id) return;
      
      try {
        const eventData = await api.events.getById(id);
        // Transform API data to match frontend Event interface
        const transformedEvent = {
          id: eventData.id.toString(),
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          venue: eventData.location,
          campus: "Main Campus", // Default value, can be updated later
          posterUrl: eventData.image_url || "",
          status: eventData.status === "upcoming" ? "approved" as const : "pending" as const,
          registrations: eventData.registered_count || 0,
          capacity: eventData.max_participants || 0,
          organizer: eventData.created_by_email || "Admin",
          category: eventData.category,
          featured: false
        };
        setEvent(transformedEvent);
      } catch (error) {
        console.error("Failed to load event:", error);
        setEvent(null);
      }
    };

    loadEvent();
  }, [id]);

  useEffect(() => {
    if (!user || !id || user.role !== 'user') return;
    api.students.getRegistrations(user.id.toString())
      .then((regs: any[]) => {
        setIsRegistered(regs.some((r: any) => r.event_id?.toString() === id));
      })
      .catch(() => setIsRegistered(false));
  }, [user, id]);

  if (!event) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <Button asChild size="lg">
              <Link to="/events">Browse All Events</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const dateObj = new Date(event.date);
  const fillPercent = Math.round((event.registrations / event.capacity) * 100);
  const isAlmostFull = fillPercent >= 80;
  const isPastEvent = new Date(event.date) < new Date();
  const spotsRemaining = event.capacity - event.registrations;

  const shareEvent = async (platform: string) => {
    const eventUrl = `${window.location.origin}/events/${event!.id}`;
    const shareText = `Check out "${event!.title}" at Zetech University Event Hub!`;
    const fullText = `${shareText}\n\n📅 ${dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n🕐 ${event!.time}\n📍 ${event!.venue}\n\n${eventUrl}`;

    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(fullText);
          toast({ title: "Link Copied! 📋", description: "Event details copied to clipboard" });
          break;
        
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
          break;
        
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`, '_blank');
          break;
        
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent(`Event: ${event!.title}`)}&body=${encodeURIComponent(fullText)}`;
          break;
        
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
          break;
        
        default:
          if (navigator.share) {
            await navigator.share({
              title: event!.title,
              text: shareText,
              url: eventUrl
            });
          } else {
            await navigator.clipboard.writeText(fullText);
            toast({ title: "Link Copied! 📋", description: "Event details copied to clipboard" });
          }
      }
    } catch (error) {
      toast({ 
        title: "Share Failed", 
        description: "Could not share event. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setRegistering(true);
    try {
      await api.events.register(event!.id);
      setIsRegistered(true);
      toast({
        title: "Registration Successful! ✅",
        description: `You are now registered for "${event!.title}". View your QR code in My Events.`,
      });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Could not register for event", variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Layout>
      {/* Enhanced Hero Section */}
      <div className="relative min-h-[60vh] overflow-hidden">
        {event?.posterUrl ? (
          <div className="absolute inset-0">
            <img 
              src={event.posterUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 hero-gradient">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
        )}
        
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative container h-full flex items-center py-20">
          <div className="max-w-4xl">
            <Link to="/events" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              Back to Events
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {event?.category}
              </Badge>
              {isPastEvent && (
                <Badge variant="secondary" className="bg-gray-500/20 text-gray-300">
                  Past Event
                </Badge>
              )}
              {event.featured && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              {event?.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-white/90 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{event.venue}, {event.campus}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{event.registrations}/{event.capacity} attending</span>
              </div>
            </div>
            
            <p className="text-white/80 text-lg mb-8 max-w-3xl">
              Organized by {event?.organizer}
            </p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  About This Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{event.capacity}</div>
                    <div className="text-sm text-gray-600">Total Capacity</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">{spotsRemaining}</div>
                    <div className="text-sm text-gray-600">Spots Left</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">{event.campus}</div>
                    <div className="text-sm text-gray-600">Campus</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <div className="text-2xl font-bold text-orange-600">{event.category}</div>
                    <div className="text-sm text-gray-600">Category</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Event Details */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Date & Time</div>
                      <div className="text-gray-600 mt-1">
                        {dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div className="text-gray-600">{event.time}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Location</div>
                      <div className="text-gray-600 mt-1">{event.venue}</div>
                      <div className="text-gray-600">{event.campus} Campus</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Attendance</div>
                      <div className="text-gray-600 mt-1">{event.registrations} registered</div>
                      <div className="text-gray-600">{event.capacity} max capacity</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Organizer</div>
                      <div className="text-gray-600 mt-1">{event.organizer}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="border-0 shadow-xl sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Register Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Registration Status */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Registration Progress</span>
                    <span className={`font-semibold text-sm ${
                      isAlmostFull ? 'text-orange-600' : fillPercent > 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {fillPercent}%
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full w-full flex-1 transition-all"
                      style={{
                        transform: `translateX(-${100 - fillPercent}%)`,
                        backgroundColor: isAlmostFull ? '#f97316' : fillPercent > 50 ? '#eab308' : '#22c55e'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{event.registrations} registered</span>
                    <span className={`font-medium ${
                      spotsRemaining <= 5 ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {spotsRemaining} spots left
                    </span>
                  </div>
                </div>

                {/* Urgency Indicator */}
                {isAlmostFull && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Almost Full!</span>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">Only {spotsRemaining} spots remaining</p>
                  </div>
                )}

                {/* Registration Button */}
                {!isPastEvent ? (
                  <Button
                    className="w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    size="lg"
                    onClick={handleRegister}
                    disabled={isRegistered || registering || spotsRemaining === 0}
                  >
                    {isRegistered ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Already Registered
                      </>
                    ) : registering ? (
                      "Registering..."
                    ) : spotsRemaining === 0 ? (
                      "Event Full"
                    ) : (
                      <>
                        <Users className="w-5 h-5 mr-2" />
                        Register Now
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 font-medium">This event has already passed</div>
                  </div>
                )}

                {/* QR Code for Registered Users */}
                {isRegistered && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowQRCode(!showQRCode)}
                      className="w-full"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      {showQRCode ? 'Hide' : 'Show'} QR Code
                    </Button>
                    {showQRCode && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-48 h-48 bg-white rounded-lg mx-auto flex items-center justify-center">
                          <QrCode className="w-32 h-32 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">Show this code at the event entrance</p>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Enhanced Share Options */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Share Event</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => shareEvent('facebook')}
                      className="flex items-center gap-2"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareEvent('twitter')}
                      className="flex items-center gap-2"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareEvent('whatsapp')}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 bg-green-500 rounded-sm" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareEvent('copy')}
                      className="flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Copy Link
                    </Button>
                  </div>
                </div>

                {/* Additional Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Heart className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetail;
