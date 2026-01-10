import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Music, Heart } from "lucide-react";
import SpotlightVoteButton from "@/components/spotlight/SpotlightVoteButton";

interface SpotlightEntry {
  id: string;
  campaign_id: string;
  artist_id: string;
  track_id: string;
  status: string;
  vote_count: number;
  track: {
    id: string;
    title: string;
    cover_url: string | null;
  } | null;
  artist_profile: {
    id: string;
    artist_name: string;
    avatar_url: string | null;
  } | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

export default function FanVote() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState<SpotlightEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin/fan');
      return;
    }
    fetchCampaignsAndEntries();
  }, [user, navigate]);

  const fetchCampaignsAndEntries = async () => {
    setLoading(true);
    
    // Fetch active campaigns
    const { data: campaignsData } = await supabase
      .from('spotlight_campaigns')
      .select('id, name, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (campaignsData && campaignsData.length > 0) {
      setCampaigns(campaignsData);
      const firstCampaignId = campaignsData[0].id;
      setSelectedCampaign(firstCampaignId);
      await fetchEntriesForCampaign(firstCampaignId);
    }
    
    setLoading(false);
  };

  const fetchEntriesForCampaign = async (campaignId: string) => {
    const { data: entriesData } = await supabase
      .from('spotlight_entries')
      .select(`
        id,
        campaign_id,
        artist_id,
        track_id,
        status,
        vote_count,
        tracks (
          id,
          title,
          cover_url
        ),
        artist_profiles (
          id,
          artist_name,
          avatar_url
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'approved')
      .order('vote_count', { ascending: false });

    if (entriesData) {
      const formatted = entriesData.map((entry: any) => ({
        ...entry,
        track: entry.tracks,
        artist_profile: entry.artist_profiles,
      }));
      setEntries(formatted);
    }
  };

  const handleCampaignChange = async (campaignId: string) => {
    setSelectedCampaign(campaignId);
    setLoading(true);
    await fetchEntriesForCampaign(campaignId);
    setLoading(false);
  };

  const handleVoteSuccess = () => {
    if (selectedCampaign) {
      fetchEntriesForCampaign(selectedCampaign);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          {/* Entries skeleton */}
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (campaigns.length === 0) {
      return (
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('fan.noActiveCampaigns')}</h2>
            <p className="text-muted-foreground mb-6">{t('fan.checkBackLater')}</p>
            <Button onClick={() => navigate('/fan/artists')}>
              {t('fan.discoverArtists')}
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <PageTransition className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            {t('nav.vote')}
          </h1>
          <p className="text-muted-foreground">{t('fan.voteSubtitle')}</p>
        </div>

        {/* Campaign selector (if multiple) */}
        {campaigns.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {campaigns.map((campaign) => (
              <Button
                key={campaign.id}
                variant={selectedCampaign === campaign.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCampaignChange(campaign.id)}
                className="whitespace-nowrap"
              >
                {campaign.name}
              </Button>
            ))}
          </div>
        )}

        {/* Entries list */}
        {entries.length === 0 ? (
          <Card className="p-8 text-center">
            <Music className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('fan.noEntriesInCampaign')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <Card 
                key={entry.id} 
                className="p-4 interactive-card"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className={`text-lg font-bold ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Cover */}
                  <div className="flex-shrink-0">
                    {entry.track?.cover_url ? (
                      <img
                        src={entry.track.cover_url}
                        alt={entry.track.title}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {entry.track?.title || 'Unknown Track'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {entry.artist_profile?.artist_name || 'Unknown Artist'}
                    </p>
                  </div>

                  {/* Vote count */}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm font-medium">{entry.vote_count}</span>
                  </div>

                  {/* Vote button */}
                  <SpotlightVoteButton
                    entryId={entry.id}
                    onVoteSuccess={handleVoteSuccess}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageTransition>
    );
  };

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <PageBreadcrumb role="fan" />
          {renderContent()}
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
