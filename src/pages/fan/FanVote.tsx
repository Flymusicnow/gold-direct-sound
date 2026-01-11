import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SpotlightVoteProvider, useSpotlightVotesOptional } from "@/contexts/SpotlightVoteContext";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Music, Heart, RefreshCw, Users, Share2, Trophy } from "lucide-react";
import SpotlightVoteButton from "@/components/spotlight/SpotlightVoteButton";
import { YourVotesCard } from "@/components/spotlight/YourVotesCard";
import { ShareSupportedCard } from "@/components/spotlight/ShareSupportedCard";

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
    user_id?: string;
  } | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

function VotePageContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const voteContext = useSpotlightVotesOptional();
  const [entries, setEntries] = useState<SpotlightEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fanProfile, setFanProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/signin/fan');
      return;
    }
    fetchCampaignsAndEntries();
    fetchFanProfile();
  }, [user, navigate]);

  const fetchFanProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setFanProfile(data);
    }
  };

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
        total_votes,
        tracks (
          id,
          title,
          cover_url
        ),
        artist_profiles (
          id,
          artist_name,
          avatar_url,
          user_id
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'approved')
      .order('total_votes', { ascending: false });

    if (entriesData) {
      const formatted = entriesData.map((entry: any) => ({
        ...entry,
        vote_count: entry.total_votes,
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

  // Section A: Vote Now
  const renderVoteNowSection = () => {
    if (loading) {
      return (
        <div className="mb-12">
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
        <div className="mb-12">
          <Card className="p-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('fan.noActiveCampaigns')}</h2>
            <p className="text-muted-foreground mb-6">{t('fan.checkBackLater')}</p>
            <Button onClick={() => navigate('/fan/artists')} className="min-h-[44px]">
              {t('fan.discoverArtists')}
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="mb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              {t('nav.vote')}
            </h1>
            <p className="text-muted-foreground">{t('fan.voteSubtitle')}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/fan/leaderboard')}
            className="gap-2 min-h-[44px]"
          >
            <Trophy className="h-4 w-4" />
            {t('nav.leaderboard')}
          </Button>
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
                className="whitespace-nowrap min-h-[44px]"
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
                    artistUserId={entry.artist_profile?.user_id}
                    onVoteSuccess={handleVoteSuccess}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Section B: Your Votes
  const renderYourVotesSection = () => {
    const votedEntries = voteContext?.votedEntries || [];
    const isLoadingVotes = voteContext?.votedEntriesLoading ?? true;
    const hasError = voteContext?.votedEntriesError ?? false;

    return (
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Your Votes
            </h2>
            <p className="text-muted-foreground">The entries you've supported in Spotlight.</p>
          </div>
          {votedEntries.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowShareModal(true)}
              className="min-h-[44px]"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoadingVotes && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoadingVotes && hasError && (
          <Card className="p-8 text-center">
            <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Couldn't load your votes</h3>
            <p className="text-muted-foreground mb-4">Please try again in a moment.</p>
            <Button 
              variant="outline" 
              onClick={() => voteContext?.refreshVotes()}
              className="min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!isLoadingVotes && !hasError && votedEntries.length === 0 && (
          <Card className="p-8 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No votes yet</h3>
            <p className="text-muted-foreground mb-6">
              When you vote in Spotlight, the entries you supported will show up here.
            </p>
            <Button 
              onClick={() => navigate('/fan/artists')} 
              variant="outline"
              className="min-h-[44px]"
            >
              <Users className="h-4 w-4 mr-2" />
              Explore Artists
            </Button>
          </Card>
        )}

        {/* Voted Entries List */}
        {!isLoadingVotes && !hasError && votedEntries.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {votedEntries.map((entry) => (
              <YourVotesCard key={entry.entry_id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageTransition className="max-w-4xl mx-auto">
      {renderVoteNowSection()}
      {renderYourVotesSection()}
      
      {/* Share Modal */}
      {user && fanProfile && (
        <ShareSupportedCard
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          votedEntries={voteContext?.votedEntries || []}
          fanName={fanProfile.full_name || 'Fan'}
          fanAvatar={fanProfile.avatar_url}
          fanId={user.id}
        />
      )}
    </PageTransition>
  );
}

export default function FanVote() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Fetch active campaign ID for the provider
  useEffect(() => {
    const fetchActiveCampaign = async () => {
      const { data } = await supabase
        .from('spotlight_campaigns')
        .select('id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setSelectedCampaign(data.id);
      }
    };
    
    if (user) {
      fetchActiveCampaign();
    }
  }, [user]);

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <PageBreadcrumb role="fan" />
          <SpotlightVoteProvider campaignId={selectedCampaign}>
            <VotePageContent />
          </SpotlightVoteProvider>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
