import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Vote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RisingArtist {
  artist_id: string;
  artist_name: string;
  entry_id: string;
  campaign_id: string;
  total_votes: number;
}

export function SpotlightRisingCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [risingArtists, setRisingArtists] = useState<RisingArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRisingArtists();
      
      // Poll for updates every 30 seconds for live feel
      const interval = setInterval(fetchRisingArtists, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchRisingArtists = async () => {
    if (!user) return;

    try {
      // Get followed artists
      const { data: follows } = await supabase
        .from('follows')
        .select('artist_id')
        .eq('fan_id', user.id);

      if (!follows || follows.length === 0) {
        setLoading(false);
        return;
      }

      const followedArtistIds = follows.map(f => f.artist_id);

      // Get active campaign
      const { data: campaign } = await supabase
        .from('spotlight_campaigns')
        .select('id')
        .eq('status', 'active')
        .single();

      if (!campaign) {
        setLoading(false);
        return;
      }

      // Get entries from followed artists with votes > 0
      const { data: entries, error } = await supabase
        .from('spotlight_entries')
        .select(`
          id,
          artist_id,
          campaign_id,
          total_votes,
          artist_profiles (artist_name)
        `)
        .eq('campaign_id', campaign.id)
        .eq('status', 'approved')
        .in('artist_id', followedArtistIds)
        .gt('total_votes', 0)
        .order('total_votes', { ascending: false })
        .limit(3);

      if (error) throw error;

      const rising = entries?.map(entry => ({
        artist_id: entry.artist_id,
        artist_name: entry.artist_profiles.artist_name,
        entry_id: entry.id,
        campaign_id: entry.campaign_id,
        total_votes: entry.total_votes || 0,
      })) || [];

      setRisingArtists(rising);
    } catch (error) {
      console.error('Error fetching rising artists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || risingArtists.length === 0) {
    return null;
  }

  const topArtist = risingArtists[0];

  return (
    <Card className="card-premium border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Your Artists Are Rising!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-foreground/90">
            <span className="font-semibold text-primary">{topArtist.artist_name}</span>
            {" is climbing the Spotlight ranks with "}
            <span className="font-semibold text-primary">{topArtist.total_votes} votes</span>
            {risingArtists.length > 1 && (
              <>
                {" and "}
                <span className="font-semibold">{risingArtists.length - 1} more</span>
                {" of your favorite artists are competing!"}
              </>
            )}
          </p>

          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              className="w-full bg-gradient-gold"
              onClick={() => navigate(`/spotlight/${topArtist.campaign_id}`)}
            >
              <Vote className="h-4 w-4 mr-2" />
              Vote Again
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Help them reach the top!
            </p>
          </div>

          {risingArtists.length > 1 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Also rising:</p>
              <div className="space-y-1">
                {risingArtists.slice(1).map((artist) => (
                  <div key={artist.entry_id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/80">{artist.artist_name}</span>
                    <span className="text-primary font-medium">{artist.total_votes} votes</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}