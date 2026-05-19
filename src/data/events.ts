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
