export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  department: string;
  posterUrl: string;
  status: "approved" | "pending";
  registrations: number;
  capacity: number;
  organizer: string;
  category: string;
  featured?: boolean;
}

export const events: Event[] = [
  {
    id: "1",
    title: "Annual Tech Innovation Summit 2026",
    description: "Join us for the biggest tech event of the year featuring keynote speakers from leading tech companies, hands-on workshops, hackathons, and networking opportunities. This two-day summit brings together students, faculty, and industry professionals to explore emerging technologies including AI, blockchain, and cloud computing.",
    date: "2026-03-15",
    time: "09:00 AM - 5:00 PM",
    venue: "Main Auditorium, Block A",
    department: "School of Computing & IT",
    posterUrl: "",
    status: "approved",
    registrations: 234,
    capacity: 500,
    organizer: "Tech Club Zetech",
    category: "Technology",
    featured: true,
  },
  {
    id: "2",
    title: "Cultural Diversity Week",
    description: "Celebrate the rich cultural diversity of our campus community. Experience traditional music, dance performances, art exhibitions, and culinary delights from various cultures represented at Zetech University.",
    date: "2026-03-20",
    time: "10:00 AM - 8:00 PM",
    venue: "University Grounds",
    department: "Student Affairs",
    posterUrl: "",
    status: "approved",
    registrations: 189,
    capacity: 1000,
    organizer: "Student Council",
    category: "Culture",
  },
  {
    id: "3",
    title: "Career Fair & Networking",
    description: "Connect with top employers and explore career opportunities. Over 50 companies will be present to recruit talented Zetech graduates. Bring your CV and dress professionally.",
    date: "2026-04-02",
    time: "8:00 AM - 4:00 PM",
    venue: "Conference Hall, Block B",
    department: "Career Services",
    posterUrl: "",
    status: "approved",
    registrations: 312,
    capacity: 400,
    organizer: "Career Services Office",
    category: "Career",
  },
  {
    id: "4",
    title: "Inter-University Sports Tournament",
    description: "Cheer for Zetech as we compete against other universities in football, basketball, volleyball, and athletics. Show your school spirit!",
    date: "2026-04-10",
    time: "7:00 AM - 6:00 PM",
    venue: "Sports Complex",
    department: "Sports Department",
    posterUrl: "",
    status: "approved",
    registrations: 156,
    capacity: 2000,
    organizer: "Sports Department",
    category: "Sports",
  },
  {
    id: "5",
    title: "Entrepreneurship Workshop Series",
    description: "Learn from successful entrepreneurs and develop your business ideas. This workshop covers business planning, funding, marketing strategies, and pitching to investors.",
    date: "2026-04-18",
    time: "2:00 PM - 6:00 PM",
    venue: "Lecture Hall 3, Block C",
    department: "School of Business",
    posterUrl: "",
    status: "approved",
    registrations: 87,
    capacity: 150,
    organizer: "Business Club",
    category: "Business",
  },
  {
    id: "6",
    title: "Mental Health Awareness Day",
    description: "An important event focused on mental health awareness, featuring counseling sessions, stress management workshops, and peer support training.",
    date: "2026-03-28",
    time: "9:00 AM - 3:00 PM",
    venue: "Wellness Center",
    department: "Student Welfare",
    posterUrl: "",
    status: "approved",
    registrations: 64,
    capacity: 200,
    organizer: "Wellness Committee",
    category: "Wellness",
  },
];

export const departments = [
  "School of Computing & IT",
  "School of Business",
  "Student Affairs",
  "Career Services",
  "Sports Department",
  "Student Welfare",
];

export const categories = [
  "Technology",
  "Culture",
  "Career",
  "Sports",
  "Business",
  "Wellness",
];
