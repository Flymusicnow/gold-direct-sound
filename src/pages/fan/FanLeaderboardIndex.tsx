import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { PageTransition } from "@/components/ui/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  entry_count?: number;
}

export default function FanLeaderboardIndex() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    
    // Fetch active and voting campaigns
    const { data: campaignsData, error } = await supabase
      .from('spotlight_campaigns')
      .select('id, name, status, start_date, end_date')
      .in('status', ['active', 'voting', 'ended'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      setLoading(false);
      return;
    }

    // Fetch entry counts for each campaign
    if (campaignsData && campaignsData.length > 0) {
      const campaignsWithCounts = await Promise.all(
        campaignsData.map(async (campaign) => {
          const { count } = await supabase
            .from('spotlight_entries')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('status', 'approved');
          
          return { ...campaign, entry_count: count || 0 };
        })
      );
      setCampaigns(campaignsWithCounts);
    }
    
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Active</Badge>;
      case 'voting':
        return <Badge className="bg-primary/10 text-primary border-primary/30">Voting Open</Badge>;
      case 'ended':
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <PageBreadcrumb role="fan" />
          <PageTransition className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                {t('nav.leaderboard')}
              </h1>
              <p className="text-muted-foreground">
                See how entries are ranking in Spotlight campaigns
              </p>
            </div>

            {/* Campaign List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Active Campaigns</h2>
                <p className="text-muted-foreground">
                  Check back later for Spotlight campaigns to see leaderboards.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/fan/leaderboard/${campaign.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate mb-1">
                          {campaign.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {campaign.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(campaign.start_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          <span>{campaign.entry_count} entries</span>
                        </div>
                      </div>

                      {/* Status & Arrow */}
                      <div className="flex items-center gap-3">
                        {getStatusBadge(campaign.status)}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </PageTransition>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
