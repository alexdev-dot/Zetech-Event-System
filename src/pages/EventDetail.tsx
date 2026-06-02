import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { type Event } from "@/data/events";
import { api } from "@/lib/api";
import {
  Calendar, MapPin, Users, Clock, ArrowLeft, Share2,
  Facebook, Twitter, Link2, Mail, CheckCircle, AlertCircle,
  QrCode, Download, Heart, Eye, Sparkles, TrendingUp,
  MessageCircle, Send, Trash2, Image, Clock3,
} from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/contexts/SocketContext";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReactionType = "fire" | "heart" | "wow";
type ReactionCounts = Record<ReactionType, number>;
type Comment = { id: number; content: string; student_name: string; student_id: number; created_at: string };
type Attendee = { id: number; display_name: string };
type GalleryItem = { id: number; image_url: string; caption: string; uploader_name: string; created_at: string };

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "fire",  emoji: "🔥", label: "Hype" },
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "wow",   emoji: "😮", label: "Wow"  },
];

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Core event state
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Reactions
  const [reactions, setReactions] = useState<ReactionCounts>({ fire: 0, heart: 0, wow: 0 });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [reactingTo, setReactingTo] = useState<ReactionType | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Attendees
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  // Waitlist
  const [waitlistPos, setWaitlistPos] = useState<number | null>(null);
  const [waitlistTotal, setWaitlistTotal] = useState(0);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Gallery
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  // ── Load core event ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    api.events.getById(id).then(ev => {
      setEvent({
        id: ev.id.toString(),
        title: ev.title,
        description: ev.description,
        date: ev.date,
        time: ev.time,
        venue: ev.location,
        campus: "Main Campus",
        posterUrl: ev.image_url || "",
        status: ev.status === "upcoming" ? "approved" : "pending",
        registrations: ev.registered_count || 0,
        capacity: ev.max_participants || 0,
        organizer: ev.created_by_name || ev.created_by_email || "Admin",
        category: ev.category,
        featured: false,
      });
    }).catch(() => setEvent(null));
  }, [id]);

  // ── Load all engagement data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    api.reactions.get(id).then(d => { setReactions(d.counts); setUserReaction(d.userReaction); }).catch(() => {});
    api.comments.get(id).then(setComments).catch(() => {});
    api.attendees.get(id).then(setAttendees).catch(() => {});
    api.gallery.get(id).then(setGallery).catch(() => {});
  }, [id]);

  // ── Load registration status + waitlist ─────────────────────────────────────
  useEffect(() => {
    if (!user || !id || user.role !== "user") return;
    api.students.getRegistrations(String(user.id))
      .then((regs: any[]) => setIsRegistered(regs.some((r: any) => r.event_id?.toString() === id)))
      .catch(() => {});
    api.waitlist.getStatus(id)
      .then(d => { setOnWaitlist(d.onWaitlist); setWaitlistPos(d.position); setWaitlistTotal(d.total); })
      .catch(() => {});
  }, [user, id]);

  // ── Real-time socket events ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !id) return;
    const onReaction = (data: any) => { if (String(data.eventId) === id) setReactions(data.counts); };
    const onComment  = (c: Comment) => setComments(prev => [...prev, c]);
    const onGallery  = (data: any) => { if (String(data.eventId) === id) api.gallery.get(id).then(setGallery).catch(() => {}); };
    socket.on("event:reaction-update", onReaction);
    socket.on(`event:new-comment:${id}`, onComment);
    socket.on("event:gallery-update", onGallery);
    return () => {
      socket.off("event:reaction-update", onReaction);
      socket.off(`event:new-comment:${id}`, onComment);
      socket.off("event:gallery-update", onGallery);
    };
  }, [socket, id]);

  // ── Scroll comments to bottom ────────────────────────────────────────────────
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleReact = async (type: ReactionType) => {
    if (!user || user.role !== "user") { navigate("/auth"); return; }
    setReactingTo(type);
    try {
      const data = await api.reactions.react(id!, type);
      setReactions(data.counts);
      setUserReaction(data.userReaction);
    } catch { toast({ title: "Failed to react", variant: "destructive" }); }
    finally { setReactingTo(null); }
  };

  const handleRegister = async () => {
    if (!user) { navigate("/auth"); return; }
    setRegistering(true);
    try {
      await api.events.register(event!.id);
      setIsRegistered(true);
      setOnWaitlist(false);
      toast({ title: "Registered! ✅", description: `You're registered for "${event!.title}". View your QR code in My Events.` });
    } catch (e: any) {
      toast({ title: "Registration Failed", description: e.message, variant: "destructive" });
    } finally { setRegistering(false); }
  };

  const handleDeregister = async () => {
    if (!user) { navigate("/auth"); return; }
    setRegistering(true);
    try {
      await api.events.cancelRegistration(event!.id, user.id);
      setIsRegistered(false);
      toast({ title: "Deregistered", description: `You've been deregistered from "${event!.title}".` });
    } catch (e: any) {
      toast({ title: "Deregistration Failed", description: e.message, variant: "destructive" });
    } finally { setRegistering(false); }
  };

  const handleWaitlist = async () => {
    if (!user) { navigate("/auth"); return; }
    setWaitlistLoading(true);
    try {
      if (onWaitlist) {
        await api.waitlist.leave(id!);
        setOnWaitlist(false); setWaitlistPos(null); setWaitlistTotal(t => Math.max(0, t - 1));
        toast({ title: "Removed from waitlist" });
      } else {
        const data = await api.waitlist.join(id!);
        setOnWaitlist(true); setWaitlistPos(data.position); setWaitlistTotal(t => t + 1);
        toast({ title: `You're #${data.position} on the waitlist 👍`, description: "We'll let you know if a spot opens up." });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setWaitlistLoading(false); }
  };

  const handleComment = async () => {
    if (!user || user.role !== "user") { navigate("/auth"); return; }
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      await api.comments.post(id!, commentText.trim());
      setCommentText("");
    } catch (e: any) {
      toast({ title: "Failed to post", description: e.message, variant: "destructive" });
    } finally { setPosting(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.comments.delete(id!, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const shareEvent = async (platform: string) => {
    const eventUrl = `${window.location.origin}/events/${event!.id}`;
    const shareText = `Check out "${event!.title}" at Zetech University Event Hub!`;
    const imageUrl = event!.posterUrl || "";
    const fullText = `${shareText}\n\n📅 ${new Date(event!.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n🕐 ${event!.time}\n📍 ${event!.venue}\n\n${imageUrl ? `🖼️ Event Flyer: ${imageUrl}\n\n` : ""}${eventUrl}`;
    try {
      switch (platform) {
        case "copy":      await navigator.clipboard.writeText(fullText); toast({ title: "Link Copied! 📋" }); break;
        case "facebook":  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,"_blank"); break;
        case "instagram": await navigator.clipboard.writeText(fullText); toast({ title: "Link Copied! 📋", description: "Paste in Instagram to share" }); break;
        case "email":     window.location.href = `mailto:?subject=${encodeURIComponent(`Event: ${event!.title}`)}&body=${encodeURIComponent(fullText)}`; break;
        case "whatsapp":  window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`,"_blank"); break;
      }
    } catch { toast({ title: "Share Failed", variant: "destructive" }); }
  };

  // ── Not found ────────────────────────────────────────────────────────────────
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
            <Button asChild size="lg"><Link to="/events">Browse All Events</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const dateObj      = new Date(event.date);
  const isUnlimited  = !event.capacity || event.capacity === 0;
  const fillPercent  = isUnlimited ? 0 : Math.round((event.registrations / event.capacity) * 100);
  const isAlmostFull = !isUnlimited && fillPercent >= 80;
  const isPastEvent  = new Date(event.date) < new Date();
  const spotsLeft    = isUnlimited ? null : event.capacity - event.registrations;
  const isFull       = !isUnlimited && spotsLeft !== null && spotsLeft <= 0;
  const totalReactions = reactions.fire + reactions.heart + reactions.wow;

  return (
    <Layout>
      {/* Hero */}
      <div className="relative min-h-[40vh] md:min-h-[50vh] lg:min-h-[60vh] overflow-hidden">
        {event.posterUrl ? (
          <div className="absolute inset-0">
            <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 hero-gradient">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          </div>
        )}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="relative container h-full flex items-center py-12 md:py-20 px-4">
          <div className="max-w-4xl">
            <Link to="/events" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs sm:text-sm mb-4 md:mb-6 transition-colors group">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" /> Back to Events
            </Link>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs md:text-sm">{event.category}</Badge>
              {isPastEvent && <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 text-xs md:text-sm">Past Event</Badge>}
              {event.featured && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs md:text-sm"><Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />Featured</Badge>}
            </div>
            <h1 className="font-heading text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 md:mb-4 leading-tight">{event.title}</h1>
            <div className="flex flex-wrap gap-3 md:gap-6 text-white/90 mb-4 md:mb-8 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 md:gap-2"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /><span className="truncate">{dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span></div>
              <div className="flex items-center gap-1.5 md:gap-2"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /><span>{event.time}</span></div>
              <div className="flex items-center gap-1.5 md:gap-2"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /><span className="truncate">{event.venue}</span></div>
              <div className="flex items-center gap-1.5 md:gap-2"><Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /><span>{event.registrations} / {isUnlimited ? "Unlimited" : event.capacity}</span></div>
            </div>
            {/* Reaction summary in hero */}
            {totalReactions > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2">
                {REACTIONS.filter(r => reactions[r.type] > 0).map(r => (
                  <span key={r.type} className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 md:px-3 md:py-1 text-white text-xs md:text-sm">
                    {r.emoji} {reactions[r.type]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* ── Main Content ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">

            {/* About */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  </div>
                  About This Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-base md:text-lg">{event.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
                  <div className="text-center p-3 md:p-4 bg-blue-50 rounded-xl"><div className="text-xl md:text-2xl font-bold text-blue-600">{isUnlimited ? "∞" : event.capacity}</div><div className="text-xs md:text-sm text-gray-600">Total Capacity</div></div>
                  <div className="text-center p-3 md:p-4 bg-green-50 rounded-xl"><div className="text-xl md:text-2xl font-bold text-green-600">{isUnlimited ? "Open" : spotsLeft}</div><div className="text-xs md:text-sm text-gray-600">Spots Left</div></div>
                  <div className="text-center p-3 md:p-4 bg-purple-50 rounded-xl"><div className="text-sm md:text-xl font-bold text-purple-600 leading-tight mt-1">{event.category}</div><div className="text-xs md:text-sm text-gray-600">Category</div></div>
                  <div className="text-center p-3 md:p-4 bg-orange-50 rounded-xl"><div className="text-xl md:text-2xl font-bold text-orange-600">{totalReactions}</div><div className="text-xs md:text-sm text-gray-600">Reactions</div></div>
                </div>
              </CardContent>
            </Card>

            {/* ── Reactions ──────────────────────────────────────────────────── */}
            <Card className="border-0 shadow-xl">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <p className="font-semibold text-gray-900 text-sm md:text-base">How are you feeling about this event?</p>
                  {totalReactions > 0 && <span className="text-xs md:text-sm text-muted-foreground">{totalReactions} reaction{totalReactions !== 1 ? "s" : ""}</span>}
                </div>
                <div className="flex gap-2 md:gap-3">
                  {REACTIONS.map(({ type, emoji, label }) => {
                    const isActive = userReaction === type;
                    return (
                      <button
                        key={type}
                        onClick={() => handleReact(type)}
                        disabled={reactingTo !== null}
                        className={`flex flex-col items-center gap-1 md:gap-1.5 px-3 md:px-5 py-2 md:py-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95
                          ${isActive ? "border-primary bg-primary/10 shadow-md" : "border-gray-200 hover:border-gray-300 bg-white"}
                          ${reactingTo === type ? "opacity-60" : ""}
                        `}
                      >
                        <span className="text-xl md:text-2xl">{emoji}</span>
                        <span className={`text-[10px] md:text-xs font-medium ${isActive ? "text-primary" : "text-gray-600"}`}>{label}</span>
                        <span className={`text-xs md:text-sm font-bold ${isActive ? "text-primary" : "text-gray-800"}`}>{reactions[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── Event Details ──────────────────────────────────────────────── */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/10 rounded-lg flex items-center justify-center"><Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /></div>
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" /></div>
                    <div><div className="font-semibold text-gray-900 text-sm md:text-base">Date & Time</div><div className="text-gray-600 mt-1 text-xs md:text-sm">{dateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div><div className="text-gray-600 text-xs md:text-sm">{event.time}</div></div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 md:w-6 md:h-6 text-green-600" /></div>
                    <div><div className="font-semibold text-gray-900 text-sm md:text-base">Location</div><div className="text-gray-600 mt-1 text-xs md:text-sm">{event.venue}</div><div className="text-gray-600 text-xs md:text-sm">{event.campus} Campus</div></div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0"><Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" /></div>
                    <div><div className="font-semibold text-gray-900 text-sm md:text-base">Attendance</div><div className="text-gray-600 mt-1 text-xs md:text-sm">{event.registrations} registered</div><div className="text-gray-600 text-xs md:text-sm">{isUnlimited ? "Unlimited capacity" : `${event.capacity} max capacity`}</div></div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-orange-600" /></div>
                    <div><div className="font-semibold text-gray-900 text-sm md:text-base">Organizer</div><div className="text-gray-600 mt-1 text-xs md:text-sm">{event.organizer}</div></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Comments ───────────────────────────────────────────────────── */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center"><MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" /></div>
                  Event Wall
                  <Badge variant="secondary" className="ml-1 text-xs md:text-sm">{comments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Comment list */}
                <div className="space-y-3 md:space-y-4 max-h-80 md:max-h-96 overflow-y-auto mb-4 md:mb-6 pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      <MessageCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs md:text-sm">Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0 font-bold text-primary text-xs md:text-sm">
                          {c.student_name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 md:px-4 md:py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs md:text-sm text-gray-900">{c.student_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] md:text-[11px] text-muted-foreground flex items-center gap-1"><Clock3 className="w-2.5 h-2.5 md:w-3 md:h-3" />{timeAgo(c.created_at)}</span>
                              {user && Number(user.id) === Number(c.student_id) && (
                                <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs md:text-sm text-gray-700">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>
                {/* Comment input */}
                {user && user.role === "user" ? (
                  <div className="flex gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0 font-bold text-primary text-xs md:text-sm">
                      {(user as any).name?.[0]?.toUpperCase() || "Y"}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); }}}
                        placeholder="Share your thoughts about this event..."
                        className="resize-none min-h-[40px] md:min-h-[44px] max-h-32 text-xs md:text-sm"
                        rows={1}
                      />
                      <Button size="icon" onClick={handleComment} disabled={posting || !commentText.trim()} className="shrink-0">
                        <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link> to join the conversation
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ── Gallery ────────────────────────────────────────────────────── */}
            {gallery.length > 0 && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-100 rounded-lg flex items-center justify-center"><Image className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-600" /></div>
                    Event Gallery
                    <Badge variant="secondary" className="ml-1 text-xs md:text-sm">{gallery.length} photos</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                    {gallery.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setLightbox(item)}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img src={item.image_url} alt={item.caption || "Gallery"} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        {item.caption && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────────── */}
          <div className="space-y-4 md:space-y-6">
            {/* Registration Card */}
            <Card className="border-0 shadow-xl sticky top-20 md:top-24">
              <CardHeader><CardTitle className="text-lg md:text-xl">Register Now</CardTitle></CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                {/* Progress */}
                <div className="space-y-2 md:space-y-3">
                  {isUnlimited ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">{event.registrations} registered</span>
                      <span className="text-xs md:text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Unlimited</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm text-gray-600">Registration Progress</span>
                        <span className={`font-semibold text-xs md:text-sm ${isAlmostFull ? "text-orange-600" : fillPercent > 50 ? "text-yellow-600" : "text-green-600"}`}>{fillPercent}%</span>
                      </div>
                      <div className="relative h-2 md:h-3 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full flex-1 transition-all" style={{ width: `${fillPercent}%`, backgroundColor: isAlmostFull ? "#f97316" : fillPercent > 50 ? "#eab308" : "#22c55e" }} />
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-600">{event.registrations} registered</span>
                        <span className={`font-medium text-xs md:text-sm ${(spotsLeft ?? 0) <= 5 ? "text-red-600" : "text-gray-700"}`}>{spotsLeft} spots left</span>
                      </div>
                    </>
                  )}
                </div>

                {isAlmostFull && !isFull && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 md:p-3">
                    <div className="flex items-center gap-2 text-orange-700"><AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /><span className="text-xs md:text-sm font-medium">Almost Full!</span></div>
                    <p className="text-[10px] md:text-xs text-orange-600 mt-1">Only {spotsLeft} spots remaining</p>
                  </div>
                )}

                {/* Register / Full / Waitlist */}
                {!isPastEvent ? (
                  isRegistered ? (
                    <div className="space-y-2">
                      <Button className="w-full py-4 md:py-6 text-base md:text-lg" size="lg" disabled>
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Already Registered
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setShowQRCode(!showQRCode)}>
                        <QrCode className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />{showQRCode ? "Hide" : "Show"} QR Code
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={handleDeregister} disabled={registering}>
                        {registering ? "Deregistering..." : <><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />Deregister</>}
                      </Button>
                      {showQRCode && (
                        <div className="mt-2 p-3 md:p-4 bg-gray-50 rounded-lg text-center">
                          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-lg mx-auto flex items-center justify-center shadow">
                            <QrCode className="w-20 h-20 md:w-28 md:h-28 text-gray-300" />
                          </div>
                          <p className="text-[10px] md:text-xs text-gray-600 mt-2">Show this at the event entrance</p>
                        </div>
                      )}
                    </div>
                  ) : isFull ? (
                    <div className="space-y-2 md:space-y-3">
                      <div className="text-center p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-semibold text-xs md:text-sm">Event is Full</p>
                        <p className="text-[10px] md:text-xs text-red-500 mt-0.5">{waitlistTotal > 0 ? `${waitlistTotal} on waitlist` : "Join the waitlist below"}</p>
                      </div>
                      <Button
                        className="w-full text-xs md:text-sm"
                        variant={onWaitlist ? "outline" : "default"}
                        onClick={handleWaitlist}
                        disabled={waitlistLoading}
                      >
                        {waitlistLoading ? "..." : onWaitlist ? `Leave Waitlist (You're #${waitlistPos})` : "Join Waitlist"}
                      </Button>
                      {onWaitlist && waitlistPos && (
                        <p className="text-[10px] md:text-xs text-center text-muted-foreground">You're #{waitlistPos} of {waitlistTotal} on the waitlist</p>
                      )}
                    </div>
                  ) : (
                    <Button className="w-full text-base md:text-lg py-4 md:py-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" size="lg" onClick={handleRegister} disabled={registering}>
                      {registering ? "Registering..." : <><Users className="w-4 h-4 md:w-5 md:h-5 mr-2" />Register Now</>}
                    </Button>
                  )
                ) : (
                  <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 font-medium text-xs md:text-sm">This event has passed</div>
                  </div>
                )}

                <Separator />

                {/* Share */}
                <div className="space-y-2 md:space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm md:text-base">Share Event</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => shareEvent("facebook")} className="flex items-center gap-2 text-xs md:text-sm"><FaFacebook className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />Facebook</Button>
                    <Button variant="outline" onClick={() => shareEvent("instagram")} className="flex items-center gap-2 text-xs md:text-sm"><FaInstagram className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-500" />Instagram</Button>
                    <Button variant="outline" onClick={() => shareEvent("whatsapp")} className="flex items-center gap-2 text-xs md:text-sm"><FaWhatsapp className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />WhatsApp</Button>
                    <Button variant="outline" onClick={() => shareEvent("copy")} className="flex items-center gap-2 text-xs md:text-sm"><Link2 className="w-3.5 h-3.5 md:w-4 md:h-4" />Copy Link</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Who's Going ────────────────────────────────────────────────── */}
            {attendees.length > 0 && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    Who's Going
                    <Badge variant="secondary" className="ml-auto text-xs md:text-sm">{event.registrations}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {attendees.map(a => (
                      <div key={a.id} className="flex items-center gap-1 md:gap-1.5 bg-gray-100 rounded-full px-2 md:px-3 py-1 md:py-1.5">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-[10px] md:text-xs">
                          {a.display_name[0]?.toUpperCase()}
                        </div>
                        <span className="text-[10px] md:text-xs font-medium text-gray-700">{a.display_name}</span>
                      </div>
                    ))}
                    {event.registrations > attendees.length && (
                      <div className="flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1 md:py-1.5">
                        <span className="text-[10px] md:text-xs font-medium text-gray-500">+{event.registrations - attendees.length} more</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-2 md:p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-3xl w-full relative" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.caption || ""} className="w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-xl" />
            {lightbox.caption && <p className="text-white text-center mt-2 md:mt-3 text-xs md:text-sm">{lightbox.caption}</p>}
            <button onClick={() => setLightbox(null)} className="absolute -top-8 md:-top-4 right-0 md:right-4 text-white text-xl md:text-2xl font-bold hover:text-gray-300">✕</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventDetail;
