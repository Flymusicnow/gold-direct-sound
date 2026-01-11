import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFlightdeck } from "@/contexts/FlightdeckContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ArrowLeft, Music, Heart, Play, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SpotlightVoteProvider } from "@/contexts/SpotlightVoteContext";
import SpotlightVoteButton from "@/components/spotlight/SpotlightVoteButton";
import { MiniAudioPreview } from "@/components/audio/MiniAudioPreview";
import { AnimatedRankBadge } from "@/components/spotlight/AnimatedRankBadge";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  title: string | null;
  total_votes: number;
  tracks: {
    id: string;
    title: string;
    cover_url: string | null;
    audio_url?: string | null;
  };
  artist_profiles: {
    id: string;
    artist_name: string;
    user_id?: string;
  };
}

export default function FanCampaignLeaderboard() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { playNow, currentItem, isPlaying, togglePlay } = useFlightdeck();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(true);
  const [previousPositions, setPreviousPositions] = useState<Record<string, number>>({});
  const [rankChanges, setRankChanges] = useState<Record<string, number>>({});
  const [changedEntries, setChangedEntries] = useState<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

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
            tracks (id, title, cover_url, audio_url),
            artist_profiles (id, artist_name, user_id)
          `)
          .eq('campaign_id', campaignId)
          .eq('status', 'approved')
          .order('total_votes', { ascending: false })
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setCampaignName(campaignRes.data.name);
      
      const newEntries = entriesRes.data || [];
      
      // Calculate position changes (skip on first load)
      if (!isFirstLoad.current) {
        const changed = new Set<string>();
        const changes: Record<string, number> = {};
        
        newEntries.forEach((entry, index) => {
          const currentPosition = index + 1;
          const previousPosition = previousPositions[entry.id];
          
          if (previousPosition !== undefined && previousPosition !== currentPosition) {
            changed.add(entry.id);
            changes[entry.id] = previousPosition - currentPosition; // Positive = moved up
          }
        });
        
        setChangedEntries(changed);
        setRankChanges(changes);
        
        // Clear animations after delay
        setTimeout(() => {
          setChangedEntries(new Set());
        }, 2000);
        
        setTimeout(() => {
          setRankChanges({});
        }, 3000);
      } else {
        isFirstLoad.current = false;
      }
      
      // Update previous positions for next comparison
      const positionsMap: Record<string, number> = {};
      newEntries.forEach((entry, index) => {
        positionsMap[entry.id] = index + 1;
      });
      setPreviousPositions(positionsMap);
      
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
  }, [campaignId, previousPositions]);

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
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, fetchData]);

  const handlePlayFull = (entry: Entry) => {
    if (entry.tracks?.audio_url) {
      playNow({
        id: entry.tracks.id,
        type: 'track',
        title: entry.tracks.title,
        artistId: entry.artist_profiles?.id || '',
        artistName: entry.artist_profiles?.artist_name || 'Unknown Artist',
        artistUserId: entry.artist_profiles?.user_id || '',
        coverUrl: entry.tracks.cover_url || undefined,
        mediaUrl: entry.tracks.audio_url,
      });
    }
  };

  const isCurrentlyPlaying = (entry: Entry) => {
    return currentItem?.id === entry.tracks?.id && isPlaying;
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
              className="mb-6 gap-2 min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>

            {/* Header */}
            <div className="text-center mb-8">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t('nav.leaderboard')}</h1>
              <p className="text-muted-foreground">{campaignName}</p>
            </div>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <LayoutGroup>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {entries.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          layout
                          layoutId={entry.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                          }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            layout: { duration: 0.4 }
                          }}
                          className="relative"
                        >
                          <div
                            className={cn(
                              "flex flex-col gap-3 p-4 rounded-lg transition-all",
                              index < 3 
                                ? "bg-gradient-to-r from-primary/10 to-transparent" 
                                : "hover:bg-muted/50",
                              changedEntries.has(entry.id) && "ring-2 ring-primary/50 animate-pulse"
                            )}
                          >
                            {/* Main Row */}
                            <div className="flex items-center gap-3 sm:gap-4">
                              {/* Rank with animation */}
                              <AnimatedRankBadge
                                rank={index + 1}
                                previousRank={previousPositions[entry.id]}
                                showChange={!!rankChanges[entry.id]}
                                size={isMobile ? "sm" : "md"}
                              />

                              {/* Play button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (isCurrentlyPlaying(entry)) {
                                    togglePlay();
                                  } else {
                                    handlePlayFull(entry);
                                  }
                                }}
                                disabled={!entry.tracks?.audio_url}
                                className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex-shrink-0"
                              >
                                {isCurrentlyPlaying(entry) ? (
                                  <Pause className="h-4 w-4 text-primary" />
                                ) : (
                                  <Play className="h-4 w-4 text-primary ml-0.5" />
                                )}
                              </Button>

                              {/* Cover */}
                              <div className="flex-shrink-0">
                                {entry.tracks?.cover_url ? (
                                  <img
                                    src={entry.tracks.cover_url}
                                    alt={entry.tracks.title}
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base line-clamp-1">
                                  {entry.title || entry.tracks?.title}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                                  {entry.artist_profiles?.artist_name}
                                </p>
                              </div>

                              {/* Votes & Button */}
                              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "flex items-center gap-1",
                                    index < 3 && "border-primary text-primary"
                                  )}
                                >
                                  <Heart className="h-3 w-3" />
                                  <span className="text-xs sm:text-sm">{entry.total_votes}</span>
                                </Badge>
                                <SpotlightVoteButton
                                  entryId={entry.id}
                                  artistUserId={entry.artist_profiles?.user_id}
                                  onVoteSuccess={fetchData}
                                />
                              </div>
                            </div>

                            {/* Audio Preview Row (Desktop only) */}
                            {!isMobile && entry.tracks?.audio_url && (
                              <div className="pl-14 pr-2">
                                <MiniAudioPreview
                                  audioUrl={entry.tracks.audio_url}
                                  trackId={entry.tracks.id}
                                  title={entry.tracks.title}
                                  artistName={entry.artist_profiles?.artist_name || 'Unknown'}
                                  artistId={entry.artist_profiles?.id || ''}
                                  coverUrl={entry.tracks.cover_url || undefined}
                                  onPlayFull={() => handlePlayFull(entry)}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </LayoutGroup>

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
