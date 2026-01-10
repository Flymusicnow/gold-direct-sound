import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudioSidebar } from '@/components/artist/StudioSidebar';
import { MobileStudioNav } from '@/components/artist/MobileStudioNav';
import { CreatePromoLinkDialog } from '@/components/promo/CreatePromoLinkDialog';
import { PromoLinkCard } from '@/components/promo/PromoLinkCard';
import { PromoUtmBreakdown } from '@/components/promo/PromoUtmBreakdown';
import { PromoConversionFunnel } from '@/components/promo/PromoConversionFunnel';
import { SmartLinkSuspendedState } from '@/components/smartlink/SmartLinkSuspendedState';
import { useSmartLink } from '@/hooks/useSmartLink';
import { getAvailablePlatforms, validateExternalLink } from '@/lib/smartLinkValidation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Link2, BarChart3, Users, Heart, Loader2, Eye, Globe, Plus, 
  Trash2, ExternalLink, Copy, CheckCircle, AlertTriangle, Music, Instagram, Youtube
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
  expires_at: string | null;
}

interface PromoStats {
  total_clicks: number;
  total_views: number;
  total_follows: number;
  total_supporters: number;
  total_links: number;
  smart_link_clicks: number;
}

interface UtmData {
  utm_source: string;
  clicks: number;
  follows: number;
  supporters: number;
}

export default function StudioPromo() {
  const { user } = useAuth();
  const [promoLinks, setPromoLinks] = useState<PromoLink[]>([]);
  const [stats, setStats] = useState<PromoStats>({
    total_clicks: 0,
    total_views: 0,
    total_follows: 0,
    total_supporters: 0,
    total_links: 0,
    smart_link_clicks: 0,
  });
  const [utmData, setUtmData] = useState<UtmData[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<string | null>(null);

  // Smart Link state
  const { 
    smartLinkPage, 
    externalLinks, 
    loading: smartLinkLoading,
    saving: smartLinkSaving,
    checkSlugAvailability,
    saveSmartLinkPage,
    addExternalLink,
    deleteExternalLink,
  } = useSmartLink();

  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const platforms = getAvailablePlatforms();

  // Initialize slug from smart link page
  useEffect(() => {
    if (smartLinkPage) {
      setSlug(smartLinkPage.slug);
    }
  }, [smartLinkPage]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug === smartLinkPage?.slug) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      const available = await checkSlugAvailability(slug);
      setSlugAvailable(available);
      setCheckingSlug(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, smartLinkPage?.slug, checkSlugAvailability]);

  // Validate URL in real-time
  useEffect(() => {
    if (!newUrl || !newPlatform) {
      setUrlValidation(null);
      return;
    }

    const result = validateExternalLink(newPlatform, newUrl);
    setUrlValidation({
      valid: result.isValid,
      message: result.flagReason || (result.isValid ? 'Valid URL' : 'Invalid URL'),
    });
  }, [newUrl, newPlatform]);

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

      // Fetch all events for this artist
      const { data: events } = await supabase
        .from('promo_events')
        .select('event_type, utm_source')
        .eq('artist_id', artist.id);

      const views = events?.filter(e => e.event_type === 'view').length || 0;
      const followSuccesses = events?.filter(e => e.event_type === 'follow_success').length || 0;
      const supportSuccesses = events?.filter(e => e.event_type === 'support_success').length || 0;

      // Calculate smart link clicks
      const smartLinkClicks = externalLinks.reduce((sum, l) => sum + l.click_count, 0);

      setStats({
        total_clicks: totalClicks,
        total_views: views,
        total_follows: followSuccesses,
        total_supporters: supportSuccesses,
        total_links: links?.length || 0,
        smart_link_clicks: smartLinkClicks,
      });

      // Calculate UTM breakdown
      const utmMap = new Map<string, UtmData>();
      events?.forEach(event => {
        const source = event.utm_source || 'direct';
        if (!utmMap.has(source)) {
          utmMap.set(source, { utm_source: source, clicks: 0, follows: 0, supporters: 0 });
        }
        const data = utmMap.get(source)!;
        if (event.event_type === 'view') data.clicks++;
        if (event.event_type === 'follow_success') data.follows++;
        if (event.event_type === 'support_success') data.supporters++;
      });
      setUtmData(Array.from(utmMap.values()));
    } catch (error) {
      console.error('Error fetching promo data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, externalLinks]);

  const handleSavePage = async () => {
    if (!slug) {
      toast.error("Please enter a slug for your smart link");
      return;
    }
    await saveSmartLinkPage({ slug });
  };

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl) {
      toast.error("Please select a platform and enter a URL");
      return;
    }
    
    const result = await addExternalLink(newPlatform, newUrl);
    if (result) {
      setNewPlatform("");
      setNewUrl("");
      setUrlValidation(null);
    }
  };

  const handleCopyLink = () => {
    if (smartLinkPage) {
      navigator.clipboard.writeText(`${window.location.origin}/@${smartLinkPage.slug}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
      case 'youtube_music':
        return <Youtube className="h-4 w-4" />;
      default:
        return <Music className="h-4 w-4" />;
    }
  };

  // Check if smart link page is suspended
  const isSuspended = smartLinkPage?.status === 'suspended';

  return (
    <div className="h-screen overflow-hidden bg-background pt-16">
      <div className="h-full flex">
        <StudioSidebar />
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide p-4 md:p-8 pb-32 md:pb-28">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Link2 className="h-7 w-7 text-primary" />
                    Promo Hub
                    <InfoTooltip 
                      title="Promo Hub" 
                      description="Manage all your promotional links in one place. Create campaign links for social media and customize your Link-in-Bio page." 
                    />
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Campaign links + Link-in-Bio in one place
                  </p>
                </div>
                <div className="shrink-0">
                  <CreatePromoLinkDialog onCreated={fetchData} />
                </div>
              </div>
            </div>

            {/* Combined Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Link2 className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_links}</p>
                  <p className="text-xs text-muted-foreground">Campaign Links</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Globe className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{externalLinks.length}</p>
                  <p className="text-xs text-muted-foreground">Bio Links</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_views + stats.smart_link_clicks}</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_clicks}</p>
                  <p className="text-xs text-muted-foreground">Link Clicks</p>
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
                  <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.total_supporters}</p>
                  <p className="text-xs text-muted-foreground">Supporters</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="campaigns" className="space-y-4">
              <TabsList>
                <TabsTrigger value="campaigns">Campaign Links</TabsTrigger>
                <TabsTrigger value="link-in-bio" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Link-in-Bio
                </TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Campaign Links Tab */}
              <TabsContent value="campaigns">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Campaign Links</CardTitle>
                    <CardDescription>
                      Create trackable links to promote specific content on social media
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : promoLinks.length === 0 ? (
                      <div className="text-center py-12">
                        <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No campaign links yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create your first promo link to start tracking your promotional campaigns.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {promoLinks.map((link) => (
                          <PromoLinkCard 
                            key={link.id} 
                            promoLink={link} 
                            onUpdated={fetchData}
                            onDeleted={fetchData}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Link-in-Bio Tab */}
              <TabsContent value="link-in-bio" className="space-y-6">
                {/* Suspended State */}
                {isSuspended && smartLinkPage && (
                  <SmartLinkSuspendedState
                    suspensionReason={smartLinkPage.suspension_reason || 'No reason provided'}
                    suspensionType={smartLinkPage.suspension_type || 'temporary'}
                    suspendedUntil={smartLinkPage.suspended_until}
                    onContactSupport={() => window.open('mailto:support@flymusic.com', '_blank')}
                  />
                )}

                {/* Page Settings */}
                {!isSuspended && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          Link-in-Bio Page
                        </CardTitle>
                        <CardDescription>
                          Your personalized landing page with all your platform links
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Slug Input */}
                        <div className="space-y-2">
                          <Label htmlFor="slug">Your URL</Label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-muted rounded-l-md px-3 h-10 text-sm text-muted-foreground border border-r-0">
                              flymusic.com/@
                            </div>
                            <div className="relative flex-1">
                              <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                                placeholder="yourname"
                                className="rounded-l-none pr-10"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {checkingSlug ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : slugAvailable === true ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : slugAvailable === false ? (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                ) : null}
                              </div>
                            </div>
                          </div>
                          {slugAvailable === false && (
                            <p className="text-sm text-amber-500">This slug is already taken</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button onClick={handleSavePage} disabled={smartLinkSaving || !slug || slugAvailable === false}>
                            {smartLinkSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {smartLinkPage ? 'Save Changes' : 'Create Link-in-Bio'}
                          </Button>
                          {smartLinkPage && (
                            <>
                              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/@${smartLinkPage.slug}`} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </a>
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* External Links */}
                    {smartLinkPage && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Platform Links</CardTitle>
                          <CardDescription>
                            Add your music streaming and social media links
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Add New Link */}
                          <div className="p-4 rounded-lg border border-dashed space-y-4">
                            <div className="grid gap-4 md:grid-cols-[1fr,2fr,auto]">
                              <div className="space-y-2">
                                <Label>Platform</Label>
                                <Select value={newPlatform} onValueChange={setNewPlatform}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {platforms.map((p) => (
                                      <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <div className="relative">
                                  <Input
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="https://..."
                                    className={urlValidation ? (urlValidation.valid ? 'border-green-500' : 'border-amber-500') : ''}
                                  />
                                  {urlValidation && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      {urlValidation.valid ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                {urlValidation && !urlValidation.valid && (
                                  <p className="text-xs text-amber-500">{urlValidation.message}</p>
                                )}
                              </div>
                              <div className="flex items-end">
                                <Button onClick={handleAddLink} disabled={smartLinkSaving || !newPlatform || !newUrl}>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Existing Links */}
                          {externalLinks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Link2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                              <p>No platform links yet</p>
                              <p className="text-sm">Add your first platform link above</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {externalLinks.map((link) => (
                                <div
                                  key={link.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="p-2 rounded-md bg-background">
                                    {getPlatformIcon(link.platform)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium capitalize">{link.platform.replace('_', ' ')}</span>
                                      {link.status === 'flagged' && (
                                        <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                                          Under Review
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{link.click_count} clicks</span>
                                  </div>
                                  <Button variant="ghost" size="icon" asChild>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => deleteExternalLink(link.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <PromoConversionFunnel
                    views={stats.total_views}
                    follows={stats.total_follows}
                    supporters={stats.total_supporters}
                  />
                  <PromoUtmBreakdown data={utmData} totalClicks={stats.total_views} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <MobileStudioNav />
    </div>
  );
}
