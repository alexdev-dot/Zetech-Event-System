import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { events } from "@/data/events";
import { CalendarCheck, QrCode, ExternalLink, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Registration {
  id: string;
  eventId: string;
  qrCode: string;
  attended: boolean;
  createdAt: string;
}

const MyEvents = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchRegistrations = async () => {
      // Mock data fetching - replace with actual logic if needed
      const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
      const userRegistrations = registrations
        .filter((reg: any) => reg.userId === user.id)
        .map((reg: any, index: number) => ({
          id: reg.id || index.toString(),
          eventId: reg.eventId,
          qrCode: `QR-${reg.eventId}-${reg.userId}`,
          attended: false,
          createdAt: reg.registeredAt || new Date().toISOString()
        }));
      setRegistrations(userRegistrations);
      setFetching(false);
    };
    fetchRegistrations();
  }, [user]);

  const handleDeleteRegistration = async (registrationId: string) => {
    setDeleting(registrationId);
    try {
      // Mock deletion - replace with actual logic if needed
      const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
      const updatedRegistrations = registrations.filter((reg: any) => 
        !(reg.userId === user?.id && reg.eventId === registrations.find((r: any) => r.id === registrationId)?.eventId)
      );
      localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
      
      // Update local state
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
    } catch (error) {
      console.error("Error deleting registration:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading || fetching) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="hero-gradient py-10">
        <div className="container">
          <h1 className="font-heading text-3xl font-bold text-primary-foreground">My Events</h1>
          <p className="text-primary-foreground/70">Your registered events and QR codes</p>
        </div>
      </div>
      <div className="container py-8">
        {registrations.length === 0 ? (
          <div className="text-center py-16">
            <CalendarCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading text-xl font-bold mb-2">No Registrations Yet</h2>
            <p className="text-muted-foreground mb-4">Browse events and register to see them here.</p>
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => {
              const event = events.find((e) => e.id === reg.eventId);
              if (!event) return null;
              return (
                <Card key={reg.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-2">{event.category}</Badge>
                        <CardTitle className="font-heading text-lg">{event.title}</CardTitle>
                      </div>
                      {reg.attended && <Badge className="bg-green-600">Attended</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>📅 {new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                      <p>🕐 {event.time}</p>
                      <p>📍 {event.venue}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <QrCode className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-xs text-muted-foreground mb-1">Your QR Code</p>
                      <code className="text-xs font-mono bg-background px-2 py-1 rounded border">
                        {reg.qrCode.slice(0, 16)}...
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/events/${event.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" /> View Event
                        </Link>
                      </Button>
                      {!reg.attended && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              disabled={deleting === reg.id}
                              className="px-3"
                            >
                              {deleting === reg.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Cancel Registration
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your registration for "{event.title}"? 
                                This action cannot be undone and you will need to register again if you want to attend.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteRegistration(reg.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Yes, Cancel Registration
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyEvents;
