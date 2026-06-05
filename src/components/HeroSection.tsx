import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative h-[50vh] min-h-[350px] sm:min-h-[400px] md:min-h-[500px]">
      {/* Background image with enhanced visibility */}
      <div className="absolute inset-0">
        <img src="https://www.zetech.ac.ke/images/sliders-inner/slide1.png" alt="Zetech University campus event" className="w-full h-full object-cover object-center scale-105" 
             style={{
               imageRendering: '-webkit-optimize-contrast',
               filter: 'contrast(1.1) brightness(1.05) saturate(1.1)'
             }} />
        {/* Reduced overlay for better image visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/10 to-transparent" />
      </div>

      <div className="relative container py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-white mb-3 sm:mb-4">
            <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">Zetech Campus Events Portal</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 sm:mb-4">
            Discover & Join Campus Events
          </h1>
          <p className="text-sm sm:text-base text-white/90 mb-4 sm:mb-6 max-w-lg">
            Stay connected with everything happening at Zetech University. Browse events, register instantly, and never miss an opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-white hover:text-primary font-semibold transition-all duration-300 w-full min-h-[44px]">
              <Link to="/events">
                Browse Events <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-primary transition-all duration-300 bg-white/10 backdrop-blur-sm w-full min-h-[44px]">
              <Link to="/calendar">
                View Calendar
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
