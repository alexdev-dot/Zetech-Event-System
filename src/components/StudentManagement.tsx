import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  BookOpen,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  UserCheck,
  UserX,
  MoreHorizontal,
  ChevronDown,
  Copy,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the student interface
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  email: string;
  created_at: string;
}

// ─── Student Details Modal (top-level so hooks work correctly) ────────────────

interface StudentDetailsModalProps {
  student: Student;
}

function StudentDetailsModal({ student }: StudentDetailsModalProps) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    setActivityLoading(true);
    api.admin.getStudentActivity(student.id)
      .then((data) => setRegistrations(data.registrations || []))
      .catch(() => setRegistrations([]))
      .finally(() => setActivityLoading(false));
  }, [student.id]);

  const attended = registrations.filter((r) => r.reg_status === "attended").length;

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div>{student.first_name} {student.last_name}</div>
            <div className="text-sm font-normal text-muted-foreground">{student.admission_number}</div>
          </div>
        </DialogTitle>
        <DialogDescription>
          Student details and activity information
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Address</Label>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {student.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Admission Number</Label>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                {student.admission_number}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Registration Date</Label>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {new Date(student.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Student ID</Label>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-muted-foreground" />
                {student.id}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Account Status:</Label>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Events Registered:</Label>
              <Badge variant="secondary">{registrations.length}</Badge>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{registrations.length}</div>
                    <div className="text-sm text-muted-foreground">Events Registered</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{attended}</div>
                    <div className="text-sm text-muted-foreground">Attended</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registration History</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No event registrations yet
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                        reg.reg_status === "attended" ? "bg-green-500"
                        : reg.reg_status === "cancelled" ? "bg-red-500"
                        : "bg-blue-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{reg.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reg.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {reg.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={reg.reg_status === "attended" ? "default" : reg.reg_status === "cancelled" ? "destructive" : "secondary"}
                            className="text-xs capitalize"
                          >
                            {reg.reg_status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Registered {new Date(reg.registration_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registered Events</CardTitle>
              <CardDescription>Events this student has registered for</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No events registered yet
                </div>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{reg.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reg.date).toLocaleDateString()} · {reg.location}
                        </p>
                      </div>
                      <Badge
                        variant={reg.event_status === "upcoming" ? "default" : reg.event_status === "completed" ? "secondary" : "outline"}
                        className="ml-2 capitalize flex-shrink-0"
                      >
                        {reg.event_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

// ─── Main StudentManagement component ────────────────────────────────────────

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch students from database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.admin.getStudents();
        setStudents(data);
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Refresh students data
  const refreshStudents = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getStudents();
      setStudents(data);
      toast.success("Student data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh students:", error);
      toast.error("Failed to refresh students");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Since we don't have status from database yet, we'll show all students
      const matchesStatus = selectedStatus === "all";

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    const total = students.length;
    // Since we don't have status from database yet, all students are considered active
    const active = total;
    const pending = 0;
    const suspended = 0;
    const completeProfiles = total; // All students have complete profiles for now

    return { total, active, pending, suspended, completeProfiles };
  }, [students]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      active: { variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
      pending: { variant: "secondary", icon: <AlertCircle className="w-3 h-3" /> },
      suspended: { variant: "destructive", icon: <XCircle className="w-3 h-3" /> }
    };

    const config = variants[status] || variants.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Loading Students...</h3>
          <p className="text-muted-foreground">
            Please wait while we fetch student data from the database.
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <div>
                  <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Total Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <div>
                  <div className="text-xl md:text-2xl font-bold">{stats.active}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                <div>
                  <div className="text-xl md:text-2xl font-bold">{stats.pending}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                <div>
                  <div className="text-xl md:text-2xl font-bold">{stats.suspended}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Suspended</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                <div>
                  <div className="text-xl md:text-2xl font-bold">{stats.completeProfiles}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">Complete Profiles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      {!loading && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-base md:text-lg">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                Student Management
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={refreshStudents} className="flex-1 sm:flex-none">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Manage and view all registered students (Passwords are securely hashed and not visible)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or admission number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Showing {filteredStudents.length} of {students.length} students
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                  }}
                  className="w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      {!loading && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 md:p-4 font-medium text-xs md:text-sm">Student Name</th>
                    <th className="text-left p-3 md:p-4 font-medium text-xs md:text-sm">Admission Number</th>
                    <th className="text-left p-3 md:p-4 font-medium text-xs md:text-sm">Email Address</th>
                    <th className="text-left p-3 md:p-4 font-medium text-xs md:text-sm">Registration Date</th>
                    <th className="text-left p-3 md:p-4 font-medium text-xs md:text-sm">Status</th>
                    <th className="text-left p-3 md:p-4 font-medium text-xs md:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-t hover:bg-muted/25 transition-colors">
                      <td className="p-3 md:p-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-xs md:text-sm">{student.first_name} {student.last_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="font-mono text-xs md:text-sm">{student.admission_number}</div>
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="text-xs md:text-sm truncate max-w-[150px] md:max-w-none">{student.email}</div>
                      </td>
                      <td className="p-3 md:p-4">
                        <div className="text-xs md:text-sm">{new Date(student.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-3 md:p-4">
                        <Badge variant="default" className="text-xs">Active</Badge>
                      </td>
                      <td className="p-3 md:p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                try {
                                  await api.admin.deleteStudent(student.id);
                                  setStudents(students.filter(s => s.id !== student.id));
                                  toast.success("Student deleted successfully");
                                } catch (error) {
                                  toast.error("Failed to delete student");
                                }
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 px-4">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Students Registered</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    No student accounts have been created yet. Students can register through the authentication page.
                  </p>
                  <Button onClick={refreshStudents} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        {selectedStudent && (
          <StudentDetailsModal student={selectedStudent} />
        )}
      </Dialog>
    </div>
  );
}
