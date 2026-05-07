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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (file: File) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload an image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      setFormData(prev => ({
        ...prev,
        flyerUrl: result
      }));
    };
    reader.readAsDataURL(file);
    
    toast.success("Flyer uploaded successfully!");
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
    setUploadedFile(null);
    setPreviewUrl("");
    setFormData(prev => ({
      ...prev,
      flyerUrl: ""
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        campus: formData.campus,
        posterUrl: formData.flyerUrl,
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
           formData.campus &&
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
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <Label htmlFor="campus">Campus *</Label>
                    <Select onValueChange={(value) => handleInputChange("campus", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {campuses.map((campus) => (
                          <SelectItem key={campus} value={campus}>
                            {campus}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSubCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {/* Event Flyer Upload */}
                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <ImageIcon className="h-4 w-4" />
                    Event Flyer (Optional)
                  </Label>
                  
                  {previewUrl ? (
                    // File preview
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeFile}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Upload area
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragging ? "Drop your flyer here" : "Upload event flyer"}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Drag and drop your flyer here, or click to browse
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
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
