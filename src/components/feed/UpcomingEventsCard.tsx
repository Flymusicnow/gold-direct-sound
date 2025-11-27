import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface UpcomingEvent {
  id: string;
  title: string;
  event_type: string;
  start_time: string;
  location: string | null;
  ticket_url: string | null;
  artist_profiles: {
    id: string;
    artist_name: string;
    avatar_url: string | null;
  };
}

interface UpcomingEventsCardProps {
  followedArtistIds: string[];
}

const getEventTypeBadge = (type: string) => {
  switch (type) {
    case "live_stream":
      return { label: "🔴 LIVE", className: "bg-red-500/20 text-red-400 border-red-500/30" };
    case "concert":
      return { label: "🎤 Concert", className: "bg-primary/20 text-primary border-primary/30" };
    default:
      return { label: "📅 Event", className: "bg-secondary/20 text-secondary-foreground border-secondary/30" };
  }
};

export function UpcomingEventsCard({ followedArtistIds }: UpcomingEventsCardProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [followedArtistIds]);

  const fetchUpcomingEvents = async () => {
    if (followedArtistIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("artist_events")
        .select(`
          id,
          title,
          event_type,
          start_time,
          location,
          ticket_url,
          artist_profiles (
            id,
            artist_name,
            avatar_url
          )
        `)
        .in("artist_id", followedArtistIds)
        .eq("status", "upcoming")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(5);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Upcoming Events</h2>
        </div>
        <p className="text-muted-foreground">Loading events...</p>
      </Card>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">Upcoming Events from Your Artists</h2>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const eventBadge = getEventTypeBadge(event.event_type);
          
          return (
            <div
              key={event.id}
              className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar
                  className="h-10 w-10 cursor-pointer"
                  onClick={() => navigate(`/artist/${event.artist_profiles.id}`)}
                >
                  <AvatarImage src={event.artist_profiles.avatar_url || ""} />
                  <AvatarFallback>
                    {event.artist_profiles.artist_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p
                    className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/artist/${event.artist_profiles.id}`)}
                  >
                    {event.artist_profiles.artist_name}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                <Badge variant="outline" className={eventBadge.className}>
                  {eventBadge.label}
                </Badge>
                <span>·</span>
                <span>{format(new Date(event.start_time), "MMM d, yyyy · h:mm a")}</span>
                {event.location && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/artist/${event.artist_profiles.id}`)}
                >
                  Artist Profile
                </Button>
                {event.ticket_url && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-gold"
                    onClick={() => window.open(event.ticket_url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Event Link
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
