export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  campus: string;
  posterUrl: string;
  status: "approved" | "pending";
  registrations: number;
  capacity: number;
  organizer: string;
  category: string;
  featured?: boolean;
}

export const campuses = [
  "Ruiru",
  "Mang'u", 
  "CBD (Nairobi campus)"
];

export const events: Event[] = [
  {
    id: "event-ongoing-1",
    title: "Today's Workshop: Web Development",
    description: "Learn modern web development techniques with React and TypeScript. Hands-on coding session.",
    date: new Date().toISOString().split('T')[0],
    time: "10:00 AM",
    venue: "Computer Lab 1",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-1.webp",
    status: "approved",
    registrations: 45,
    capacity: 60,
    organizer: "IT Club (iTech)",
    category: "IT Club (iTech)"
  },
  {
    id: "event-ongoing-2",
    title: "Sports Day - Football Finals",
    description: "Championship finals of the inter-campus football tournament. Come support your team!",
    date: new Date().toISOString().split('T')[0],
    time: "2:00 PM",
    venue: "Football Field",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-3.jpg",
    status: "approved",
    registrations: 234,
    capacity: 300,
    organizer: "Football teams",
    category: "Football teams"
  },
  {
    id: "event-1",
    title: "Zetech Tech Summit 2024",
    description: "Annual technology summit featuring industry leaders, workshops, and networking opportunities for tech enthusiasts and professionals.",
    date: "2024-06-15",
    time: "9:00 AM",
    venue: "Main Auditorium",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-1.webp",
    status: "approved",
    registrations: 250,
    capacity: 400,
    organizer: "IT Club (iTech)",
    category: "IT Club (iTech)"
  }, 
  {
    id: "event-2",
    title: "Career Fair & Job Expo",
    description: "Connect with top employers and explore career opportunities. Bring your CV and dress professionally.",
    date: "2024-06-20",
    time: "10:00 AM",
    venue: "Sports Complex",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-2.jpg",
    status: "approved",
    registrations: 380,
    capacity: 600,
    organizer: "Zetech University Student Association (ZUSA)",
    category: "Zetech university Student Association (ZUSA)"
  },
  {
    id: "event-3",
    title: "Football Tournament - Inter Campus",
    description: "Exciting football competition between Ruiru, Mang'u, and CBD campuses. Come support your team!",
    date: "2024-06-25",
    time: "2:00 PM",
    venue: "Football Field",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-3.jpg",
    status: "approved",
    registrations: 156,
    capacity: 300,
    organizer: "Football teams",
    category: "Football teams"
  },
  {
    id: "event-4",
    title: "Innovation Hackathon 2026",
    description: "48-hour coding challenge to solve real-world problems. Great prizes and recognition for winners.",
    date: "2024-07-01",
    time: "6:00 PM",
    venue: "Computer Lab 3",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-4.jpg",
    status: "approved",
    registrations: 89,
    capacity: 120,
    organizer: "Innovation & Mentorship Hub (iZET)",
    category: "Innovation & Mentorship Hub (iZET)"
  },
  {
    id: "event-5",
    title: "Cultural Diversity Day",
    description: "Celebrate the rich cultural diversity at Zetech with food, music, dance, and traditional performances.",
    date: "2024-07-05",
    time: "11:00 AM",
    venue: "Open Grounds",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-5.jpg",
    status: "approved",
    registrations: 412,
    capacity: 800,
    organizer: "Community Development Club",
    category: "Community Development Club"
  },
  {
    id: "event-6",
    title: "Basketball Championship Finals",
    description: "Finals of the inter-campus basketball championship. Don't miss the thrilling conclusion!",
    date: "2024-07-10",
    time: "4:00 PM",
    venue: "Basketball Court",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-6.jpg",
    status: "approved",
    registrations: 178,
    capacity: 250,
    organizer: "Basketball teams",
    category: "Basketball teams"
  },
  {
    id: "event-7",
    title: "Entrepreneurship Workshop",
    description: "Learn from successful entrepreneurs about starting and growing your business. Network with industry leaders.",
    date: "2024-07-15",
    time: "9:00 AM",
    venue: "Conference Room A",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-7.jpg",
    status: "approved",
    registrations: 67,
    capacity: 100,
    organizer: "Entrepreneurs Club",
    category: "Entrepreneurs Club"
  },
  {
    id: "event-8",
    title: "Christian Union Worship Night",
    description: "An evening of praise, worship, and spiritual fellowship. All students welcome regardless of denomination.",
    date: "2024-07-18",
    time: "7:00 PM",
    venue: "Chapel",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-8.jpg",
    status: "approved",
    registrations: 234,
    capacity: 400,
    organizer: "Christian Union",
    category: "Christian Union"
  },
  {
    id: "event-9",
    title: "Engineering Expo 2024",
    description: "Showcase of innovative engineering projects by students. Industry judges and prizes for best projects.",
    date: "2024-07-22",
    time: "10:00 AM",
    venue: "Engineering Workshop",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-9.jpeg",
    status: "approved",
    registrations: 145,
    capacity: 200,
    organizer: "Engineering Club",
    category: "Engineering Club"
  },
  {
    id: "event-10",
    title: "Chess Tournament",
    description: "Test your strategic thinking in the annual chess tournament. Open to all skill levels with great prizes.",
    date: "2024-07-25",
    time: "1:00 PM",
    venue: "Library Study Area",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-10.jpg",
    status: "approved",
    registrations: 45,
    capacity: 64,
    organizer: "Chess",
    category: "Chess"
  },
  {
    id: "event-11",
    title: "Hotel Management Gala Dinner",
    description: "Fine dining experience prepared by Hotel Club students. Five-course meal with entertainment.",
    date: "2024-07-28",
    time: "7:00 PM",
    venue: "Hotel Training Restaurant",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-11.jpg",
    status: "approved",
    registrations: 89,
    capacity: 120,
    organizer: "Hotel Club",
    category: "Hotel Club"
  },
  {
    id: "event-12",
    title: "Rugby 7s Tournament",
    description: "Fast-paced rugby sevens competition with teams from various universities. Exciting matches guaranteed!",
    date: "2024-08-02",
    time: "3:00 PM",
    venue: "Rugby Field",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-12.jpg",
    status: "approved",
    registrations: 267,
    capacity: 500,
    organizer: "Rugby",
    category: "Rugby"
  },
  {
    id: "event-13",
    title: "Journalism Media Workshop",
    description: "Learn about modern journalism, social media management, and content creation from industry experts.",
    date: "2024-08-05",
    time: "2:00 PM",
    venue: "Media Lab",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-13.jpg",
    status: "approved",
    registrations: 78,
    capacity: 150,
    organizer: "Journalism Club",
    category: "Journalism Club"
  },
  {
    id: "event-14",
    title: "Lions Club Community Service",
    description: "Join us for a day of community service at a local children's home. Making a difference together.",
    date: "2024-08-08",
    time: "9:00 AM",
    venue: "Community Center",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-14.jpg",
    status: "approved",
    registrations: 56,
    capacity: 80,
    organizer: "Lions Club",
    category: "Lions Club"
  },
  {
    id: "event-15",
    title: "Freshers' Welcome Party",
    description: "Welcome new students with music, games, and networking. Meet your fellow freshers and senior students.",
    date: "2024-08-12",
    time: "6:00 PM",
    venue: "Main Grounds",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-15.avif",
    status: "approved",
    registrations: 423,
    capacity: 600,
    organizer: "Zetech university Student Association (ZUSA)",
    category: "Zetech university Student Association (ZUSA)"
  },
  {
    id: "event-16",
    title: "Ajira Digital Skills Workshop",
    description: "Learn essential digital skills for online work and freelancing. Get certified and start earning online.",
    date: "2024-08-15",
    time: "9:00 AM",
    venue: "Computer Lab 2",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-16.jpg",
    status: "approved",
    registrations: 95,
    capacity: 150,
    organizer: "Ajira Club",
    category: "Ajira Club"
  },
  {
    id: "event-17",
    title: "Tourism Industry Expo",
    description: "Explore career opportunities in tourism and hospitality. Network with industry professionals.",
    date: "2024-08-18",
    time: "10:00 AM",
    venue: "Conference Hall B",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-17.jpg",
    status: "approved",
    registrations: 112,
    capacity: 200,
    organizer: "Tourism Club",
    category: "Tourism Club"
  },
  {
    id: "event-18",
    title: "ZUKA Knowledge Sharing Forum",
    description: "Share knowledge and experiences with peers. Topics include academic success and personal development.",
    date: "2024-08-20",
    time: "2:00 PM",
    venue: "Library Seminar Room",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-18.jpg",
    status: "approved",
    registrations: 67,
    capacity: 100,
    organizer: "Knowledge Ambassadors Club (ZUKA)",
    category: "Knowledge Ambassadors Club (ZUKA)"
  },
  {
    id: "event-19",
    title: "Rotaract Community Health Camp",
    description: "Free health screening and awareness campaign. Medical checkups and health education for the community.",
    date: "2024-08-22",
    time: "8:00 AM",
    venue: "Community Health Center",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-19.jpg",
    status: "approved",
    registrations: 234,
    capacity: 400,
    organizer: "Rotaract Club",
    category: "Rotaract Club"
  },
  {
    id: "event-20",
    title: "Muslim Association Iftar Dinner",
    description: "Join us for community iftar dinner during Ramadan. Experience Islamic culture and traditions.",
    date: "2024-08-25",
    time: "6:30 PM",
    venue: "Multi-purpose Hall",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-20.jpg",
    status: "approved",
    registrations: 189,
    capacity: 300,
    organizer: "Muslim Association",
    category: "Muslim Association"
  },
  {
    id: "event-21",
    title: "SDA Youth Fellowship",
    description: "Weekly fellowship meeting with Bible study, praise and worship, and youth discussions.",
    date: "2024-08-28",
    time: "5:00 PM",
    venue: "SDA Chapel",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-21.jpg",
    status: "approved",
    registrations: 78,
    capacity: 120,
    organizer: "SDA (Seventh Day Adventist)",
    category: "SDA (Seventh Day Adventist)"
  },
  {
    id: "event-22",
    title: "Catholic Action Mass & Social",
    description: "Sunday mass followed by social gathering and community building activities.",
    date: "2024-08-30",
    time: "10:00 AM",
    venue: "Catholic Chapel",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-22.jpg",
    status: "approved",
    registrations: 145,
    capacity: 250,
    organizer: "Catholic Action",
    category: "Catholic Action"
  },
  {
    id: "event-23",
    title: "ZUSA Student Council Elections",
    description: "Cast your vote for the next student leadership. Democracy in action at Zetech University.",
    date: "2024-09-02",
    time: "8:00 AM",
    venue: "Various Polling Stations",
    campus: "All Campuses",
    posterUrl: "/assets/event-flyers/event-23.jpg",
    status: "approved",
    registrations: 1250,
    capacity: 2000,
    organizer: "Zetech university Student Association (ZUSA)",
    category: "Zetech university Student Association (ZUSA)"
  },
  {
    id: "event-24",
    title: "IT Club Cybersecurity Workshop",
    description: "Learn about cybersecurity threats, prevention, and ethical hacking from industry experts.",
    date: "2024-09-05",
    time: "1:00 PM",
    venue: "Computer Lab 1",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-24.jpg",
    status: "approved",
    registrations: 134,
    capacity: 180,
    organizer: "IT Club (iTech)",
    category: "IT Club (iTech)"
  },
  {
    id: "event-25",
    title: "Engineering Robotics Competition",
    description: "Build and program robots to compete in various challenges. Great prizes for winners.",
    date: "2024-09-08",
    time: "9:00 AM",
    venue: "Engineering Workshop",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-25.jpg",
    status: "approved",
    registrations: 89,
    capacity: 120,
    organizer: "Engineering Club",
    category: "Engineering Club"
  },
  {
    id: "event-26",
    title: "iZET Startup Pitch Night",
    description: "Present your startup ideas to investors and mentors. Funding opportunities available.",
    date: "2024-09-10",
    time: "6:00 PM",
    venue: "Innovation Hub",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-26.jpg",
    status: "approved",
    registrations: 156,
    capacity: 200,
    organizer: "Innovation & Mentorship Hub (iZET)",
    category: "Innovation & Mentorship Hub (iZET)"
  },
  {
    id: "event-27",
    title: "Journalism Club Media Awards",
    description: "Annual awards ceremony recognizing excellence in student journalism and media production.",
    date: "2024-09-12",
    time: "7:00 PM",
    venue: "Main Auditorium",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-27.jpg",
    status: "approved",
    registrations: 278,
    capacity: 400,
    organizer: "Journalism Club",
    category: "Journalism Club"
  },
  {
    id: "event-28",
    title: "Entrepreneurs Club Business Plan Competition",
    description: "Submit your business plan for a chance to win seed funding and mentorship.",
    date: "2024-09-15",
    time: "2:00 PM",
    venue: "Conference Room C",
    campus: "Mang'u",
    posterUrl: "/assets/event-flyers/event-28.jpg",
    status: "approved",
    registrations: 67,
    capacity: 100,
    organizer: "Entrepreneurs Club",
    category: "Entrepreneurs Club"
  },
  {
    id: "event-29",
    title: "Hotel Club Culinary Showcase",
    description: "Experience fine dining with dishes prepared by our talented hospitality students.",
    date: "2024-09-18",
    time: "7:00 PM",
    venue: "Hotel Training Restaurant",
    campus: "CBD (Nairobi campus)",
    posterUrl: "/assets/event-flyers/event-29.jpg",
    status: "approved",
    registrations: 98,
    capacity: 150,
    organizer: "Hotel Club",
    category: "Hotel Club"
  },
  {
    id: "event-30",
    title: "Community Development Charity Run",
    description: "5K charity run to raise funds for local community projects. All fitness levels welcome.",
    date: "2024-09-20",
    time: "7:00 AM",
    venue: "Campus Grounds",
    campus: "Ruiru",
    posterUrl: "/assets/event-flyers/event-30.jpg",
    status: "approved",
    registrations: 345,
    capacity: 500,
    organizer: "Community Development Club",
    category: "Community Development Club"
  }
];


export interface Category {
  name: string;
  subCategories: string[];
}

export const categories: Category[] = [
  {
    name: "Tech & Academic",
    subCategories: [
      "IT Club (iTech)",
      "Engineering Club",
      "Innovation & Mentorship Hub (iZET)",
      "Ajira Club",
      "Journalism Club",
      "Entrepreneurs Club",
      "Hotel Club",
      "Tourism Club"
    ]
  },
  {
    name: "Social & Community",
    subCategories: [
      "Community Development Club",
      "Knowledge Ambassadors Club (ZUKA)",
      "Lions Club",
      "Rotaract Club"
    ]
  },
  {
    name: "Sports & Games",
    subCategories: [
      "Football teams",
      "Basketball teams",
      "Rugby",
      "Chess"
    ]
  },
  {
    name: "Religious Groups",
    subCategories: [
      "Christian Union",
      "Muslim Association",
      "SDA (Seventh Day Adventist)",
      "Catholic Action"
    ]
  },
  {
    name: "Student Leadership",
    subCategories: [
      "Zetech university Student Association (ZUSA)"
    ]
  },
  {
    name: "Creative & Media",
    subCategories: []
  }
];

// Flat list of all sub-categories for form options
export const allSubCategories = categories.flatMap(cat => cat.subCategories);
