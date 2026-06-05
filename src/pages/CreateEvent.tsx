import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, User, ArrowLeft, Send, Upload, X, Image as ImageIcon, CalendarDays } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Time picker helpers ───────────────────────────────────────────────────────
const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function buildTimeString(hour: string, minute: string, ampm: string) {
  return `${hour.padStart(2, "0")}:${minute} ${ampm}`;
}

interface EventFormData {
  title: string;
  description: string;
  date: string;
  endDate: string;
  venue: string;
  campus: string;
  category: string;
  organizer: string;
  capacity: string;
  flyerUrl: string;
}

const CreateEvent = () => {
  const { categories } = useCategories();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duration type
  const [durationType, setDurationType] = useState<"single" | "multi">("single");

  // Time fields
  const [hour,   setHour]   = useState("8");
  const [minute, setMinute] = useState("00");
  const [ampm,   setAmpm]   = useState<"AM" | "PM">("AM");

  const [formData, setFormData] = useState<EventFormData>({
    title: "", description: "", date: "", endDate: "",
    venue: "", campus: "", category: "",
    organizer: user?.name || "", capacity: "", flyerUrl: "",
  });

  const handleChange = (field: keyof EventFormData, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Please upload JPEG, PNG, GIF or WebP"); return; }
    if (file.size > 5 * 1024 * 1024)  { toast.error("File size must be under 5 MB"); return; }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const res = await api.upload.image(file);
      setFormData(prev => ({ ...prev, flyerUrl: res.imageUrl }));
      toast.success("Flyer uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploadedFile(null); setPreviewUrl("");
    }
  };

  const removeFile = () => {
    setUploadedFile(null); setPreviewUrl("");
    setFormData(prev => ({ ...prev, flyerUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (durationType === "multi" && formData.endDate && formData.endDate < formData.date) {
      toast.error("End date must be on or after start date"); return;
    }
    setIsSubmitting(true);
    try {
      const location = formData.campus
        ? `${formData.venue}, ${formData.campus}`
        : formData.venue;

      await api.events.create({
        title:           formData.title,
        description:     formData.description,
        date:            formData.date,
        endDate:         durationType === "multi" ? formData.endDate : undefined,
        time:            buildTimeString(hour, minute, ampm),
        location,
        category:        formData.category,
        maxParticipants: formData.capacity ? (parseInt(formData.capacity) || undefined) : undefined,
        imageUrl:        formData.flyerUrl || undefined,
      });

      if (user?.role === "club_leader") {
        toast.success("Event submitted for admin approval!");
        navigate("/club-leader/dashboard");
      } else {
        toast.success("Event created successfully!");
        navigate("/events");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () =>
    formData.title && formData.description && formData.date &&
    formData.venue && formData.campus && formData.category && formData.organizer &&
    (durationType === "single" || formData.endDate);

  const today = new Date().toISOString().split("T")[0];

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
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="font-heading text-3xl font-bold mb-2">Create New Event</h1>
            <p className="text-muted-foreground">
              {user?.role === "club_leader" ? "Submit your event for admin approval" : "Create a new event for the campus"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Event Details</CardTitle>
              <CardDescription>
                Fill in the details below to {user?.role === "club_leader" ? "submit your event for review" : "create the event"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Title */}
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input id="title" value={formData.title} onChange={e => handleChange("title", e.target.value)}
                    placeholder="Enter event title" required minLength={3} />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" value={formData.description} onChange={e => handleChange("description", e.target.value)}
                    placeholder="Describe your event in detail" rows={4} required minLength={10} />
                </div>

                {/* ── Duration Type ───────────────────────────────────────── */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4" /> Event Duration *
                  </Label>
                  <div className="flex gap-3">
                    {(["single", "multi"] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setDurationType(type); if (type === "single") handleChange("endDate", ""); }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all
                          ${durationType === type
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      >
                        {type === "single" ? "📅 Single Day" : "📅📅 Multiple Days"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Date fields ─────────────────────────────────────────── */}
                <div className={`grid gap-4 ${durationType === "multi" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                  <div>
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {durationType === "multi" ? "Start Date *" : "Date *"}
                    </Label>
                    <Input id="date" type="date" value={formData.date}
                      onChange={e => handleChange("date", e.target.value)} min={today} required />
                  </div>
                  {durationType === "multi" && (
                    <div>
                      <Label htmlFor="endDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> End Date *
                      </Label>
                      <Input id="endDate" type="date" value={formData.endDate}
                        onChange={e => handleChange("endDate", e.target.value)}
                        min={formData.date || today} required />
                    </div>
                  )}
                </div>

                {/* ── Time picker ─────────────────────────────────────────── */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" /> Start Time *
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Hour */}
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger className="w-20 flex-1 sm:flex-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map(h => (
                          <SelectItem key={h} value={h}>{h.padStart(2, "0")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="font-bold text-lg text-muted-foreground">:</span>

                    {/* Minute */}
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger className="w-20 flex-1 sm:flex-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MINUTES.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* AM / PM */}
                    <div className="flex rounded-lg border overflow-hidden flex-1 sm:flex-none">
                      {(["AM", "PM"] as const).map(period => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setAmpm(period)}
                          className={`flex-1 px-3 sm:px-4 py-2 text-sm font-semibold transition-all
                            ${ampm === period
                              ? "bg-primary text-primary-foreground"
                              : "bg-white text-gray-600 hover:bg-gray-50"}`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>

                    {/* Preview */}
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg font-mono w-full sm:w-auto text-center sm:text-left">
                      {hour.padStart(2, "0")}:{minute} {ampm}
                    </span>
                  </div>
                </div>

                {/* Venue + Campus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venue" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Venue *
                    </Label>
                    <Input id="venue" value={formData.venue} onChange={e => handleChange("venue", e.target.value)}
                      placeholder="e.g. Main Hall, Room 101" required />
                  </div>
                  <div>
                    <Label htmlFor="campus">Campus *</Label>
                    <Input id="campus" value={formData.campus} onChange={e => handleChange("campus", e.target.value)}
                      placeholder="e.g. Ruiru Main Campus" required />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={v => handleChange("category", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.flatMap(c => c.subCategories).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Organizer + Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizer" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Organizer *
                    </Label>
                    <Input id="organizer" value={formData.organizer} onChange={e => handleChange("organizer", e.target.value)}
                      placeholder="Your name or club" required />
                  </div>
                  <div>
                    <Label htmlFor="capacity">
                      Max Attendees <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </Label>
                    <Input id="capacity" type="number" value={formData.capacity}
                      onChange={e => handleChange("capacity", e.target.value)}
                      placeholder="Leave blank for unlimited" min="1" max="10000" />
                  </div>
                </div>

                {/* Flyer upload */}
                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <ImageIcon className="h-4 w-4" /> Event Flyer (Optional)
                  </Label>
                  {previewUrl ? (
                    <div className="relative">
                      <div className="border rounded-lg overflow-hidden">
                        <img src={previewUrl} alt="Flyer preview" className="w-full h-64 object-cover" />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {uploadedFile?.name} ({((uploadedFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={removeFile} className="text-red-600 hover:text-red-700">
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                        ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
                      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragging ? "Drop your flyer here" : "Upload event flyer"}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</p>
                      <p className="text-xs text-gray-400 mb-4">JPEG, PNG, GIF, WebP — max 5 MB</p>
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> Choose File
                      </Button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect}
                        className="hidden" title="Upload event flyer" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline"
                    onClick={() => user?.role === "club_leader" ? navigate("/club-leader/dashboard") : navigate("/events")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isFormValid() || isSubmitting}>
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Submitting...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" />{user?.role === "club_leader" ? "Submit for Approval" : "Create Event"}</>
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
