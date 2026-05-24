import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, User, ArrowLeft, Send, Upload, X, Image as ImageIcon } from "lucide-react";
import { categories, allSubCategories, campuses } from "@/data/events";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  campus: string;
  category: string;
  organizer: string;
  capacity: string;
  flyerUrl: string;
}

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    campus: "",
    category: "",
    organizer: user?.name || "",
    capacity: "",
    flyerUrl: ""
  });

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload an image file (JPEG, PNG, GIF, or WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const response = await api.upload.image(file);
      setFormData(prev => ({ ...prev, flyerUrl: response.imageUrl }));
      toast.success("Flyer uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload flyer");
      setUploadedFile(null);
      setPreviewUrl("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setFormData(prev => ({ ...prev, flyerUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const location = formData.campus
        ? `${formData.venue}, ${formData.campus}`
        : formData.venue;

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location,
        category: formData.category,
        maxParticipants: formData.capacity ? (parseInt(formData.capacity) || undefined) : undefined,
        imageUrl: formData.flyerUrl || undefined,
      };

      await api.events.create(eventData);

      if (user?.role === "club_leader") {
        toast.success("Event submitted for admin approval!");
        navigate("/club-leader/dashboard");
      } else {
        toast.success("Event created successfully!");
        navigate("/events");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to create event. Please try again.");
      console.error("Error creating event:", error);
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
           formData.campus &&
           formData.category &&
           formData.organizer;
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => user?.role === "club_leader" ? navigate("/club-leader/dashboard") : navigate("/events")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Create New Event</h1>
            <p className="text-muted-foreground">
              {user?.role === "club_leader"
                ? "Submit your event for admin approval"
                : "Create a new event for the campus"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Event Details
              </CardTitle>
              <CardDescription>
                Fill in the details below to {user?.role === "club_leader" ? "submit your event for review" : "create the event"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter event title"
                      required
                      minLength={3}
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
                      minLength={10}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Time *
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venue" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Venue *
                    </Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => handleInputChange("venue", e.target.value)}
                      placeholder="e.g. Main Hall, Room 101"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="campus">Campus *</Label>
                    <Select onValueChange={(value) => handleInputChange("campus", value)} value={formData.campus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {campuses.map((campus) => (
                          <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => handleInputChange("category", value)} value={formData.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSubCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizer" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Organizer *
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
                    <Label htmlFor="capacity">Max Attendees <span className="text-gray-400 font-normal">(optional — leave blank for Unlimited)</span></Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange("capacity", e.target.value)}
                      placeholder="e.g. 200 — or leave blank for unlimited"
                      min="1"
                      max="10000"
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <ImageIcon className="h-4 w-4" />
                    Event Flyer (Optional)
                  </Label>

                  {previewUrl ? (
                    <div className="relative">
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Event flyer preview"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {uploadedFile?.name} ({(uploadedFile?.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) : '0')} MB)
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={removeFile} className="text-red-600 hover:text-red-700">
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragging ? "Drop your flyer here" : "Upload event flyer"}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">Drag and drop your flyer here, or click to browse</p>
                      <p className="text-xs text-gray-400 mb-4">Supported: JPEG, PNG, GIF, WebP (Max 5MB)</p>
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        title="Upload event flyer"
                        aria-label="Upload event flyer"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => user?.role === "club_leader" ? navigate("/club-leader/dashboard") : navigate("/events")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isFormValid() || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {user?.role === "club_leader" ? "Submit for Approval" : "Create Event"}
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
