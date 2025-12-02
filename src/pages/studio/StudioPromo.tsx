import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudioSidebar } from '@/components/artist/StudioSidebar';
import { MobileStudioNav } from '@/components/artist/MobileStudioNav';
import { CreatePromoLinkDialog } from '@/components/promo/CreatePromoLinkDialog';
import { PromoLinkCard } from '@/components/promo/PromoLinkCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link2, BarChart3, Users, Heart, Loader2 } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface PromoLink {
  id: string;
  slug: string;
  content_type: string;
  content_id: string | null;
  campaign_name: string | null;
  utm_source: string | null;
  click_count: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface PromoStats {
  total_clicks: number;
  total_follows: number;
  total_supporters: number;
  total_links: number;
}

export default function StudioPromo() {
  const { user } = useAuth();
  const [promoLinks, setPromoLinks] = useState<PromoLink[]>([]);
  const [stats, setStats] = useState<PromoStats>({
    total_clicks: 0,
    total_follows: 0,
    total_supporters: 0,
    total_links: 0,
  });
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get artist profile
      const { data: artist } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!artist) return;
      setArtistId(artist.id);

      // Fetch promo links
      const { data: links } = await supabase
        .from('promo_links')
        .select('*')
        .eq('artist_id', artist.id)
        .order('created_at', { ascending: false });

      setPromoLinks(links || []);

      // Calculate stats
      const totalClicks = links?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0;

      // Fetch conversion stats from events
      const { data: events } = await supabase
        .from('promo_events')
        .select('event_type')
        .eq('artist_id', artist.id);

      const followSuccesses = events?.filter(e => e.event_type === 'follow_success').length || 0;
      const supportSuccesses = events?.filter(e => e.event_type === 'support_success').length || 0;

      setStats({
        total_clicks: totalClicks,
        total_follows: followSuccesses,
        total_supporters: supportSuccesses,
        total_links: links?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching promo data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <StudioSidebar />
        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-28">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Link2 className="h-7 w-7 text-primary" />
                  Promo Links
                  <InfoTooltip 
                    title="Promo Links" 
                    description="Create trackable links to promote your music on social media. See which platforms drive the most engagement." 
                  />
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and optimize your promotional campaigns
                </p>
              </div>
              <CreatePromoLinkDialog onCreated={fetchData} />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Link2 className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_links}</p>
                  <p className="text-xs text-muted-foreground">Active Links</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_clicks}</p>
                  <p className="text-xs text-muted-foreground">Total Clicks</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_follows}</p>
                  <p className="text-xs text-muted-foreground">New Followers</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Heart className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_supporters}</p>
                  <p className="text-xs text-muted-foreground">New Supporters</p>
                </CardContent>
              </Card>
            </div>

            {/* Promo Links List */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Your Promo Links</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : promoLinks.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No promo links yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first promo link to start tracking your promotional campaigns.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {promoLinks.map((link) => (
                      <PromoLinkCard key={link.id} promoLink={link} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <MobileStudioNav />
    </div>
  );
}
