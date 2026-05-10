import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  Copy
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for students
const mockStudents = [
  {
    id: "STU001",
    firstName: "John",
    lastName: "Kamau",
    email: "john.kamau@zetech.ac.ke",
    admissionNumber: "ZU/2023/001",
    hashedPassword: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    phone: "+254 712 345 678",
    studentId: "ZU/2023/001",
    course: "Computer Science",
    year: "Year 3",
    campus: "Main Campus",
    registrationDate: "2023-09-15",
    status: "active",
    eventsAttended: 12,
    profileComplete: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
  },
  {
    id: "STU002",
    firstName: "Mary",
    lastName: "Wanjiru",
    email: "mary.wanjiru@zetech.ac.ke",
    admissionNumber: "ZU/2023/002",
    hashedPassword: "$2b$10$E1G2h3I4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j",
    phone: "+254 723 456 789",
    studentId: "ZU/2023/002",
    course: "Business Administration",
    year: "Year 2",
    campus: "Main Campus",
    registrationDate: "2023-09-16",
    status: "active",
    eventsAttended: 8,
    profileComplete: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mary"
  },
  {
    id: "STU003",
    firstName: "David",
    lastName: "Ochieng",
    email: "david.ochieng@zetech.ac.ke",
    admissionNumber: "ZU/2022/015",
    hashedPassword: "$2b$10$F2h3I4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k",
    phone: "+254 734 567 890",
    studentId: "ZU/2022/015",
    course: "Information Technology",
    year: "Year 4",
    campus: "Thika Road Campus",
    registrationDate: "2022-09-10",
    status: "active",
    eventsAttended: 15,
    profileComplete: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david"
  },
  {
    id: "STU004",
    firstName: "Grace",
    lastName: "Muthoni",
    email: "grace.muthoni@zetech.ac.ke",
    admissionNumber: "ZU/2023/003",
    hashedPassword: "$2b$10$G3h4I5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k",
    phone: "+254 745 678 901",
    studentId: "ZU/2023/003",
    course: "Hospitality Management",
    year: "Year 1",
    campus: "Main Campus",
    registrationDate: "2023-09-17",
    status: "pending",
    eventsAttended: 2,
    profileComplete: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=grace"
  },
  {
    id: "STU005",
    firstName: "Peter",
    lastName: "Njoroge",
    email: "peter.njoroge@zetech.ac.ke",
    admissionNumber: "ZU/2021/020",
    hashedPassword: "$2b$10$H4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l",
    phone: "+254 756 789 012",
    studentId: "ZU/2021/020",
    course: "Engineering",
    year: "Year 4",
    campus: "Thika Road Campus",
    registrationDate: "2021-09-12",
    status: "suspended",
    eventsAttended: 20,
    profileComplete: true,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=peter"
  }
];

export default function StudentManagement() {
  const [students] = useState(mockStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === "active").length;
    const pending = students.filter(s => s.status === "pending").length;
    const suspended = students.filter(s => s.status === "suspended").length;
    const completeProfiles = students.filter(s => s.profileComplete).length;

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

  const StudentDetailsModal = ({ student }: { student: typeof mockStudents[0] }) => (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <img src={student.avatar} alt={student.firstName} className="w-12 h-12 rounded-full" />
          <div>
            <div>{student.firstName} {student.lastName}</div>
            <div className="text-sm font-normal text-muted-foreground">{student.studentId}</div>
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
              <Label className="text-sm font-medium">Phone Number</Label>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {student.phone}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Course</Label>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                {student.course}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Study Year</Label>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-muted-foreground" />
                {student.year}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Campus</Label>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {student.campus}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Registration Date</Label>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {new Date(student.registrationDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Account Status:</Label>
              {getStatusBadge(student.status)}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Profile Complete:</Label>
              <Badge variant={student.profileComplete ? "default" : "secondary"}>
                {student.profileComplete ? "Complete" : "Incomplete"}
              </Badge>
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
                    <div className="text-2xl font-bold">{student.eventsAttended}</div>
                    <div className="text-sm text-muted-foreground">Events Attended</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">Active</div>
                    <div className="text-sm text-muted-foreground">Account Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Registered for Tech Innovation Summit</span>
                  <span className="text-muted-foreground ml-auto">2 days ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Updated profile information</span>
                  <span className="text-muted-foreground ml-auto">1 week ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Attended Career Fair 2024</span>
                  <span className="text-muted-foreground ml-auto">2 weeks ago</span>
                </div>
              </div>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Tech Innovation Summit 2024</div>
                    <div className="text-sm text-muted-foreground">March 15, 2024 • Main Campus</div>
                  </div>
                  <Badge variant="default">Registered</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Career Fair 2024</div>
                    <div className="text-sm text-muted-foreground">February 28, 2024 • Main Campus</div>
                  </div>
                  <Badge variant="secondary">Attended</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Sports Tournament</div>
                    <div className="text-sm text-muted-foreground">January 20, 2024 • Thika Road Campus</div>
                  </div>
                  <Badge variant="secondary">Attended</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.suspended}</div>
                <div className="text-sm text-muted-foreground">Suspended</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.completeProfiles}</div>
                <div className="text-sm text-muted-foreground">Complete Profiles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Management
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage and view all registered students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-40">
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredStudents.length} of {students.length} students
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("all");
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Student Name</th>
                  <th className="text-left p-4 font-medium">Admission Number</th>
                  <th className="text-left p-4 font-medium">Email Address</th>
                  <th className="text-left p-4 font-medium">Hashed Password</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-t hover:bg-muted/25 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={student.avatar} 
                          alt={`${student.firstName} ${student.lastName}`}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-sm">{student.admissionNumber}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{student.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs text-muted-foreground max-w-xs truncate" title={student.hashedPassword}>
                        {student.hashedPassword}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="p-4">
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
                            onClick={() => {
                              navigator.clipboard.writeText(student.hashedPassword);
                              toast.success("Password hash copied to clipboard");
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Password Hash
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="w-4 h-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No students found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        {selectedStudent && (
          <StudentDetailsModal student={selectedStudent} />
        )}
      </Dialog>
    </div>
  );
}
