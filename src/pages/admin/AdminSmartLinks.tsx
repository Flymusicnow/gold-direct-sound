import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Eye, AlertTriangle, TrendingUp, Search, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type SmartLinkPageRow = Database['public']['Tables']['smart_link_pages']['Row'];
type ExternalLinkRow = Database['public']['Tables']['smart_link_external_links']['Row'];

interface SmartLinkPage extends SmartLinkPageRow {
  artist_profiles?: {
    artist_name: string;
    avatar_url: string | null;
  };
  _clickCount?: number;
}

interface FlaggedLink extends ExternalLinkRow {
  smart_link_pages?: {
    slug: string;
    artist_profiles?: {
      artist_name: string;
    };
  };
}

export default function AdminSmartLinks() {
  const [activeTab, setActiveTab] = useState("overview");
  const [smartLinkPages, setSmartLinkPages] = useState<SmartLinkPage[]>([]);
  const [flaggedLinks, setFlaggedLinks] = useState<FlaggedLink[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPages: 0,
    activePages: 0,
    totalClicks: 0,
    flaggedCount: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch smart link pages with artist info
      const { data: pages } = await supabase
        .from('smart_link_pages')
        .select(`
          *,
          artist_profiles (
            artist_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      // Get click counts for each page
      const pagesWithClicks = await Promise.all((pages || []).map(async (page) => {
        const { count } = await supabase
          .from('smart_link_external_links')
          .select('click_count', { count: 'exact', head: true })
          .eq('smart_link_page_id', page.id);
        
        return { ...page, _clickCount: count || 0 };
      }));

      setSmartLinkPages(pagesWithClicks);

      // Fetch flagged links (status = 'flagged' or has flag_reason)
      const { data: flagged } = await supabase
        .from('smart_link_external_links')
        .select(`
          *,
          smart_link_pages (
            slug,
            artist_profiles (
              artist_name
            )
          )
        `)
        .eq('status', 'flagged')
        .order('created_at', { ascending: false });

      setFlaggedLinks((flagged || []) as FlaggedLink[]);

      // Calculate stats
      const totalPages = pages?.length || 0;
      const activePages = pages?.filter(p => p.status === 'active').length || 0;
      const totalClicks = pagesWithClicks.reduce((sum, p) => sum + (p._clickCount || 0), 0);
      const flaggedCount = flagged?.length || 0;

      setStats({ totalPages, activePages, totalClicks, flaggedCount });
    } catch (error) {
      console.error('Error fetching smart links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLink = async (linkId: string) => {
    try {
      await supabase
        .from('smart_link_external_links')
        .update({ status: 'active', flag_reason: null })
        .eq('id', linkId);
      
      setFlaggedLinks(prev => prev.filter(l => l.id !== linkId));
      setStats(prev => ({ ...prev, flaggedCount: prev.flaggedCount - 1 }));
    } catch (error) {
      console.error('Error approving link:', error);
    }
  };

  const handleRejectLink = async (linkId: string) => {
    try {
      await supabase
        .from('smart_link_external_links')
        .update({ status: 'removed' })
        .eq('id', linkId);
      
      setFlaggedLinks(prev => prev.filter(l => l.id !== linkId));
      setStats(prev => ({ ...prev, flaggedCount: prev.flaggedCount - 1 }));
    } catch (error) {
      console.error('Error rejecting link:', error);
    }
  };

  const filteredPages = smartLinkPages.filter(page => 
    page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.artist_profiles?.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Smart Links" description="Platform-wide smart link analytics and moderation">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPages}</p>
                <p className="text-xs text-muted-foreground">Total Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activePages}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.flaggedCount}</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-links">All Links</TabsTrigger>
          <TabsTrigger value="flagged" className="relative">
            Flagged
            {stats.flaggedCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.flaggedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top Performing Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : smartLinkPages.length === 0 ? (
                  <p className="text-muted-foreground">No smart links yet</p>
                ) : (
                  <div className="space-y-3">
                    {smartLinkPages.slice(0, 5).map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">@{page.slug}</p>
                            <p className="text-xs text-muted-foreground">{page.artist_profiles?.artist_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{page._clickCount || 0}</p>
                          <p className="text-xs text-muted-foreground">clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Recent Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : flaggedLinks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No flagged links 🎉</p>
                ) : (
                  <div className="space-y-3">
                    {flaggedLinks.slice(0, 5).map((link) => (
                      <div key={link.id} className="p-2 rounded-lg border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{link.platform}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{link.url}</p>
                          </div>
                          <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                            {link.flag_reason?.split(':')[0] || 'Flagged'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all-links">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by slug or artist name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : filteredPages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No smart links found</p>
              ) : (
                <div className="space-y-2">
                  {filteredPages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Link2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">@{page.slug}</p>
                            <Badge variant={page.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {page.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{page.artist_profiles?.artist_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{page._clickCount || 0}</p>
                          <p className="text-xs text-muted-foreground">clicks</p>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/@${page.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flagged Links Queue</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : flaggedLinks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">All Clear!</p>
                  <p className="text-muted-foreground">No flagged links to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedLinks.map((link) => (
                    <div key={link.id} className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{link.platform}</Badge>
                            <span className="text-sm text-muted-foreground">
                              by {link.smart_link_pages?.artist_profiles?.artist_name}
                            </span>
                          </div>
                          <p className="font-mono text-sm break-all mb-2">{link.url}</p>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            ⚠️ {link.flag_reason}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                            onClick={() => handleApproveLink(link.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600/30 hover:bg-red-600/10"
                            onClick={() => handleRejectLink(link.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
