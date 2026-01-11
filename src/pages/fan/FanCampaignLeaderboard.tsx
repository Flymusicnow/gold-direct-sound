import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, ArrowLeft, Music, Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SpotlightVoteProvider } from "@/contexts/SpotlightVoteContext";
import SpotlightVoteButton from "@/components/spotlight/SpotlightVoteButton";

interface Entry {
  id: string;
  title: string | null;
  total_votes: number;
  tracks: {
    title: string;
    cover_url: string | null;
  };
  artist_profiles: {
    artist_name: string;
    user_id?: string;
  };
}

export default function FanCampaignLeaderboard() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(true);
  const [previousVotes, setPreviousVotes] = useState<Record<string, number>>({});
  const [changedEntries, setChangedEntries] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    if (!campaignId) return;

    try {
      const [campaignRes, entriesRes] = await Promise.all([
        supabase
          .from('spotlight_campaigns')
          .select('name')
          .eq('id', campaignId)
          .single(),
        supabase
          .from('spotlight_entries')
          .select(`
            *,
            tracks (title, cover_url),
            artist_profiles (artist_name, user_id)
          `)
          .eq('campaign_id', campaignId)
          .eq('status', 'approved')
          .order('total_votes', { ascending: false })
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setCampaignName(campaignRes.data.name);
      
      // Track vote changes for animation
      const newEntries = entriesRes.data || [];
      const changed = new Set<string>();
      
      newEntries.forEach(entry => {
        if (previousVotes[entry.id] !== undefined && previousVotes[entry.id] !== entry.total_votes) {
          changed.add(entry.id);
        }
      });
      
      setChangedEntries(changed);
      setTimeout(() => setChangedEntries(new Set()), 2000);
      
      // Update previous votes
      const votesMap: Record<string, number> = {};
      newEntries.forEach(entry => {
        votesMap[entry.id] = entry.total_votes;
      });
      setPreviousVotes(votesMap);
      
      setEntries(newEntries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId, previousVotes]);

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  // Real-time subscription for vote updates
  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`fan-leaderboard-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spotlight_votes',
        },
        () => {
          // Refetch entries when votes change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, fetchData]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-[#FFD700]" />;
      case 1:
        return <Medal className="h-6 w-6 text-[#C0C0C0]" />;
      case 2:
        return <Award className="h-6 w-6 text-[#CD7F32]" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <MobileFanNav />
        <div className="flex min-h-screen w-full pt-16">
          <FanSidebar />
          <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
            <PageBreadcrumb role="fan" />
            <PageTransition className="max-w-4xl mx-auto">
              <Skeleton className="h-10 w-32 mb-6" />
              <div className="text-center mb-8">
                <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
                <Skeleton className="h-8 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </PageTransition>
          </main>
        </div>
        {isMobile && <BottomNavBarFan />}
      </>
    );
  }

  return (
    <SpotlightVoteProvider campaignId={campaignId || null}>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <PageBreadcrumb role="fan" />
          <PageTransition className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/fan/leaderboard')} 
              className="mb-6 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>

            {/* Header */}
            <div className="text-center mb-8">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-2">{t('nav.leaderboard')}</h1>
              <p className="text-muted-foreground">{campaignName}</p>
            </div>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                        index < 3 ? 'bg-gradient-to-r from-primary/10 to-transparent' : 'hover:bg-muted/50'
                      } ${changedEntries.has(entry.id) ? 'animate-pulse ring-2 ring-primary/50' : ''}`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(index) || (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>

                      {/* Cover */}
                      <div className="flex-shrink-0">
                        {entry.tracks.cover_url ? (
                          <img
                            src={entry.tracks.cover_url}
                            alt={entry.tracks.title}
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
                        <p className="font-semibold truncate">
                          {entry.title || entry.tracks.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {entry.artist_profiles.artist_name}
                        </p>
                      </div>

                      {/* Votes & Button */}
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${index < 3 ? 'border-primary text-primary' : ''}`}
                        >
                          <Heart className="h-3 w-3" />
                          {entry.total_votes}
                        </Badge>
                        <SpotlightVoteButton
                          entryId={entry.id}
                          artistUserId={entry.artist_profiles.user_id}
                          onVoteSuccess={fetchData}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {entries.length === 0 && (
                  <div className="text-center py-12">
                    <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No entries yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </PageTransition>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </SpotlightVoteProvider>
  );
}
