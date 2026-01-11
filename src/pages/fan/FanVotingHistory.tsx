import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, Music, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VoteHistoryEntry {
  entry_id: string;
  voted_at: string;
  track_title: string;
  cover_url: string | null;
  artist_name: string;
  campaign_name: string;
  total_votes: number;
}

interface FanProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function FanVotingHistory() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FanProfile | null>(null);
  const [votes, setVotes] = useState<VoteHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        setProfile(profileData);

        // Fetch voting history
        const { data: votesData } = await supabase
          .from('spotlight_votes')
          .select(`
            entry_id,
            created_at,
            campaign_id,
            spotlight_entries (
              id,
              vote_count,
              tracks (
                title,
                cover_url
              ),
              artist_profiles (
                artist_name
              )
            ),
            spotlight_campaigns (
              name
            )
          `)
          .eq('fan_user_id', userId)
          .order('created_at', { ascending: false });

        if (votesData) {
          const formatted: VoteHistoryEntry[] = votesData.map((vote: any) => ({
            entry_id: vote.entry_id,
            voted_at: vote.created_at,
            track_title: vote.spotlight_entries?.tracks?.title || 'Unknown Track',
            cover_url: vote.spotlight_entries?.tracks?.cover_url || null,
            artist_name: vote.spotlight_entries?.artist_profiles?.artist_name || 'Unknown Artist',
            campaign_name: vote.spotlight_campaigns?.name || 'Spotlight',
            total_votes: vote.spotlight_entries?.vote_count || 0,
          }));
          setVotes(formatted);
        }
      } catch (error) {
        console.error('Error fetching voting history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-2xl mx-auto">
          <Skeleton className="h-10 w-24 mb-6" />
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="text-center text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16 ring-4 ring-primary/30">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-xl">
              {profile.full_name?.[0]?.toUpperCase() || "F"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{profile.full_name || "Fan"}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Heart className="h-4 w-4 text-primary" />
              {votes.length} {votes.length === 1 ? 'entry' : 'entries'} supported
            </p>
          </div>
        </div>

        {/* Votes List */}
        {votes.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold mb-2">No votes yet</h2>
            <p className="text-muted-foreground">
              This fan hasn't voted in any Spotlight campaigns yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Supported Entries
            </h2>
            {votes.map((vote) => (
              <Card key={vote.entry_id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Cover */}
                  <div className="flex-shrink-0">
                    {vote.cover_url ? (
                      <img
                        src={vote.cover_url}
                        alt={vote.track_title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{vote.track_title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{vote.artist_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{vote.campaign_name}</p>
                  </div>

                  {/* Vote info */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-primary">
                      <Heart className="h-4 w-4 fill-current" />
                      <span className="text-sm font-bold">{vote.total_votes}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(vote.voted_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
