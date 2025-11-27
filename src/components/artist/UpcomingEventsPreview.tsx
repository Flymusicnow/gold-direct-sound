import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  start_time: string;
  location: string | null;
  event_type: string;
}

interface UpcomingEventsPreviewProps {
  artistId: string;
}

export function UpcomingEventsPreview({ artistId }: UpcomingEventsPreviewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [artistId]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('artist_events')
      .select('id, title, start_time, location, event_type')
      .eq('artist_id', artistId)
      .eq('status', 'upcoming')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(3);

    if (data) setEvents(data);
    setLoading(false);
  };

  if (loading) {
    return <Card className="p-6"><p className="text-muted-foreground">Loading...</p></Card>;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upcoming Events</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/studio/events')} className="text-primary hover:text-primary/80">
          View All
        </Button>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-3">No upcoming events scheduled</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/studio/events')} className="border-primary/20 hover:bg-primary/10">
            Create Event
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 hover:border-primary/20 transition-all cursor-pointer"
              onClick={() => navigate('/studio/events')}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0 border border-primary/20">
                  <span className="text-xs font-bold text-primary">
                    {format(new Date(event.start_time), 'MMM')}
                  </span>
                  <span className="text-lg font-bold text-primary leading-none">
                    {format(new Date(event.start_time), 'd')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium mb-1">{event.title}</p>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      {format(new Date(event.start_time), 'h:mm a')}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
