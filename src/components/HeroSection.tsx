import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden h-[60vh] min-h-[400px]">
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

      <div className="relative container py-16 md:py-20">
        <div className="max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 text-sm text-white mb-4">
            <CalendarDays className="w-4 h-4" />
            <span>Zetech Campus Events Portal</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            Discover & Join Campus Events
          </h1>
          <p className="text-base text-white/90 mb-6 max-w-lg">
            Stay connected with everything happening at Zetech University. Browse events, register instantly, and never miss an opportunity.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-white hover:text-primary font-semibold transition-all duration-300">
              <Link to="/events">
                Browse Events <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-white hover:text-primary transition-all duration-300">
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
