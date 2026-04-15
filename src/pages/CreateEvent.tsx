import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, User, ArrowLeft, Send } from "lucide-react";
import { categories, departments } from "@/data/events";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  department: string;
  category: string;
  organizer: string;
  capacity: string;
}

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    department: "",
    category: "",
    organizer: user?.name || "",
    capacity: ""
  });

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create new event object
      const newEvent = {
        id: `user-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        department: formData.department,
        posterUrl: "",
        status: "pending" as const, // All user-submitted events start as pending
        registrations: 0,
        capacity: parseInt(formData.capacity),
        organizer: formData.organizer,
        category: formData.category,
        submittedBy: user?.id,
        submittedAt: new Date().toISOString()
      };

      // Get existing user-submitted events
      const existingEvents = JSON.parse(localStorage.getItem('userSubmittedEvents') || '[]');
      
      // Add new event
      const updatedEvents = [...existingEvents, newEvent];
      localStorage.setItem('userSubmittedEvents', JSON.stringify(updatedEvents));

      toast.success("Event submitted successfully! It will appear in the admin dashboard for approval.");
      
      // Navigate back to events page
      navigate("/events");
    } catch (error) {
      toast.error("Failed to submit event. Please try again.");
      console.error("Error submitting event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.title && 
           formData.description && 
           formData.date && 
           formData.time && 
           formData.venue && 
           formData.department && 
           formData.category && 
           formData.organizer && 
           formData.capacity;
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/events")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Create New Event</h1>
            <p className="text-muted-foreground">Submit your event for admin approval</p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Event Details
              </CardTitle>
              <CardDescription>
                Fill in the details below to submit your event for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe your event in detail"
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time *
                    </Label>
                    <Input
                      id="time"
                      type="text"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      placeholder="e.g., 2:00 PM - 5:00 PM"
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="venue" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Venue *
                  </Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange("venue", e.target.value)}
                    placeholder="Event location"
                    required
                  />
                </div>

                {/* Department and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select onValueChange={(value) => handleInputChange("department", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Organizer and Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizer" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Organizer *
                    </Label>
                    <Input
                      id="organizer"
                      value={formData.organizer}
                      onChange={(e) => handleInputChange("organizer", e.target.value)}
                      placeholder="Your name or organization"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacity">Expected Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange("capacity", e.target.value)}
                      placeholder="Number of attendees"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/events")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!isFormValid() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit for Approval
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEvent;
