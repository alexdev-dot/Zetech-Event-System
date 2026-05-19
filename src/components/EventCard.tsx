import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Event } from "@/data/events";
import { useState } from "react";

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  // Tech & Academic
  "IT Club (iTech)": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  "Engineering Club": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  "Innovation & Mentorship Hub (iZET)": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  "Ajira Club": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  "Journalism Club": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  "Entrepreneurs Club": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  "Hotel Club": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  "Tourism Club": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
  
  // Social & Community
  "Community Development Club": { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200" },
  "Knowledge Ambassadors Club (ZUKA)": { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200" },
  "Lions Club": { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200" },
  "Rotaract Club": { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200" },
  
  // Sports & Games
  "Football teams": { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200" },
  "Basketball teams": { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200" },
  "Rugby": { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200" },
  "Chess": { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200" },
  
  // Religious Groups
  "Christian Union": { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200" },
  "Muslim Association": { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200" },
  "SDA (Seventh Day Adventist)": { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200" },
  "Catholic Action": { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200" },
  
  // Student Leadership
  "Zetech university Student Association (ZUSA)": { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-200" },
  
  // Creative & Media
  "Creative & Media": { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-200" },
  
  // Fallback for any unknown categories
  default: { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-200" }
};

const EventCard = ({ event }: { event: Event }) => {
  const [imageError, setImageError] = useState(false);
  const dateObj = new Date(event.date);
  const month = dateObj.toLocaleString("default", { month: "short" }).toUpperCase();
  const day = dateObj.getDate();
  const fillPercentage = Math.round((event.registrations / event.capacity) * 100);
  const isAlmostFull = fillPercentage >= 80;
  const categoryColor = categoryColors[event.category] || categoryColors.Technology;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100/50"
    >
      {/* Image container with enhanced hover effect */}
      <div className="relative overflow-hidden h-48">
        {event.posterUrl && !imageError ? (
          <div className="relative w-full h-full">
            <img 
              src={event.posterUrl} 
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        ) : (
          <div className="hero-gradient h-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
            <div className="text-center text-white relative z-10">
              <div className="text-xs font-semibold tracking-widest opacity-80 mb-1">{month}</div>
              <div className="text-5xl font-heading font-bold">{day}</div>
            </div>
            <Sparkles className="absolute top-4 right-4 w-8 h-8 text-white/20 animate-pulse" />
          </div>
        )}
        
        {/* Enhanced date badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-3 text-center min-w-[70px] shadow-lg border border-white/20 transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
          <div className="text-xs font-bold text-gray-600">{month}</div>
          <div className="text-xl font-bold text-gray-900">{day}</div>
        </div>
        
        {/* Enhanced category badge */}
        <Badge className={`absolute top-4 right-4 ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border} border px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm`}>
          {event.category}
        </Badge>

        {/* Registration status indicator */}
        {isAlmostFull && (
          <div className="absolute bottom-4 right-4 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse shadow-lg">
            Almost Full!
          </div>
        )}
      </div>

      {/* Enhanced content section */}
      <div className="p-6">
        <h3 className="font-heading font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 mb-3 text-lg leading-tight">
          {event.title}
        </h3>
        
        {/* Enhanced event details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">{dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {event.time}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="p-2 bg-green-50 rounded-lg">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium truncate">{event.venue}</div>
              <div className="text-xs text-gray-500 mt-1">{event.campus}</div>
            </div>
          </div>
        </div>

        {/* Enhanced registration section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">
                {event.registrations}/{event.capacity} registered
              </span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isAlmostFull 
                ? 'bg-orange-100 text-orange-700' 
                : fillPercentage > 50 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
            }`}>
              {fillPercentage}% Full
            </span>
          </div>
          <Progress 
            value={fillPercentage} 
            className="h-2 transition-all duration-500"
          />
        </div>

        {/* Hover action hint */}
        <div className="mt-4 text-center">
          <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Click for details →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
