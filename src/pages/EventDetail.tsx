import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { events } from "@/data/events";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Facebook, Twitter, Link2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const event = events.find((e) => e.id === id);

  useEffect(() => {
    if (!user || !id) return;
    // Mock registration check - replace with actual logic if needed
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const isEventRegistered = registrations.some((reg: any) => 
      reg.userId === user.id && reg.eventId === id
    );
    setIsRegistered(isEventRegistered);
  }, [user, id]);

  if (!event) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Event Not Found</h1>
          <Button asChild>
            <Link to="/events">Back to Events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const dateObj = new Date(event.date);
  const fillPercent = Math.round((event.registrations / event.capacity) * 100);

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
      // Mock registration - replace with actual logic if needed
      const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
      const newRegistration = {
        userId: user.id,
        eventId: event!.id,
        registeredAt: new Date().toISOString()
      };
      registrations.push(newRegistration);
      localStorage.setItem('registrations', JSON.stringify(registrations));
      
      setIsRegistered(true);
      toast({
        title: "Registration Successful! ✅",
        description: `You have been registered for "${event!.title}". View your QR code in My Events.`,
      });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Could not register for event", variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Layout>
      {/* Hero banner */}
      <div className="hero-gradient py-16">
        <div className="container">
          <Link to="/events" className="inline-flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <span className="inline-block bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full mb-4">
            {event.category}
          </span>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-2">{event.title}</h1>
          <p className="text-primary-foreground/70">Organized by {event.organizer} • {event.department}</p>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-lg p-6 card-shadow">
              <h2 className="font-heading text-xl font-bold mb-4">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            <div className="bg-card rounded-lg p-6 card-shadow">
              <h2 className="font-heading text-xl font-bold mb-4">Event Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Date</p>
                    <p className="text-muted-foreground text-sm">
                      {dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Time</p>
                    <p className="text-muted-foreground text-sm">{event.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Venue</p>
                    <p className="text-muted-foreground text-sm">{event.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Capacity</p>
                    <p className="text-muted-foreground text-sm">{event.capacity} attendees</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 card-shadow sticky top-24">
              <h3 className="font-heading font-bold mb-4">Registration</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{event.registrations} registered</span>
                  <span className="font-medium">{fillPercent}%</span>
                </div>
                <Progress value={fillPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {event.capacity - event.registrations} spots remaining
                </p>
              </div>
              <Button
                className="w-full mb-3"
                size="lg"
                onClick={handleRegister}
                disabled={isRegistered || registering}
              >
                {isRegistered ? "✅ Registered" : registering ? "Registering..." : "Register Now"}
              </Button>
              
              {/* Share Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full" size="lg">
                    <Share2 className="w-4 h-4 mr-2" /> Share Event
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={() => shareEvent('copy')} className="cursor-pointer">
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareEvent('facebook')} className="cursor-pointer">
                    <Facebook className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareEvent('twitter')} className="cursor-pointer">
                    <Twitter className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareEvent('email')} className="cursor-pointer">
                    <Mail className="w-4 h-4 mr-2" />
                    Share via Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareEvent('whatsapp')} className="cursor-pointer">
                    <div className="w-4 h-4 mr-2 bg-green-500 rounded-sm" />
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareEvent('native')} className="cursor-pointer">
                    <Share2 className="w-4 h-4 mr-2" />
                    More Options
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetail;
