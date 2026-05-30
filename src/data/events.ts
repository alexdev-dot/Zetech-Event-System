// This file contains type definitions and fallback data for the frontend.
// Real dynamic data comes from the backend API and database.
// Static data here is used only as fallback when API is unavailable.

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string; // Maps to 'location' in database
  campus: string; // Derived from location or separate field
  posterUrl: string; // Maps to 'image_url' in database
  status: "approved" | "pending" | "upcoming" | "ongoing" | "completed" | "cancelled" | "rejected";
  registrations: number; // Derived from event_registrations table
  capacity: number; // Maps to 'max_participants' in database
  organizer: string; // Derived from admins table via created_by
  category: string; // Maps to category field in events table
  featured?: boolean; // UI-only flag
  end_date?: string; // Optional end date from database
  created_at?: string; // Timestamp from database
  updated_at?: string; // Timestamp from database
}

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
  }
];

// Flat list of all sub-categories for form options
export const allSubCategories = categories.flatMap(cat => cat.subCategories);
