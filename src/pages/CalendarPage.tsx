import Layout from "@/components/Layout";
import { CalendarDays } from "lucide-react";

const CalendarPage = () => (
  <Layout>
    <div className="container py-20 text-center">
      <CalendarDays className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h1 className="font-heading text-2xl font-bold mb-2">Campus Calendar</h1>
      <p className="text-muted-foreground">Full calendar view coming soon. Browse events in the meantime.</p>
    </div>
  </Layout>
);

export default CalendarPage;
