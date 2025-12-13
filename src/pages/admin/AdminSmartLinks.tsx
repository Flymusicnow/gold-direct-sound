import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { useAuth } from "@/contexts/AuthContext";
import { SuspendPageDialog } from "@/components/admin/SuspendPageDialog";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { RejectReasonDialog } from "@/components/admin/RejectReasonDialog";
import { 
  Link2, Eye, AlertTriangle, TrendingUp, Search, ExternalLink, 
  CheckCircle, XCircle, Ban, RefreshCw, Clock 
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type SmartLinkPageRow = Database['public']['Tables']['smart_link_pages']['Row'];
type ExternalLinkRow = Database['public']['Tables']['smart_link_external_links']['Row'];

interface SmartLinkPage extends SmartLinkPageRow {
  artist_profiles?: {
    artist_name: string;
    avatar_url: string | null;
    user_id: string;
  };
  _clickCount?: number;
}

interface FlaggedLink extends ExternalLinkRow {
  smart_link_pages?: {
    slug: string;
    artist_id: string;
    artist_profiles?: {
      artist_name: string;
      user_id: string;
    };
  };
}

export default function AdminSmartLinks() {
  const { user } = useAuth();
  const { logActivity } = useAdminActivityLog();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [smartLinkPages, setSmartLinkPages] = useState<SmartLinkPage[]>([]);
  const [flaggedLinks, setFlaggedLinks] = useState<FlaggedLink[]>([]);
  const [suspendedPages, setSuspendedPages] = useState<SmartLinkPage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPages: 0,
    activePages: 0,
    suspendedPages: 0,
    totalClicks: 0,
    flaggedCount: 0,
  });

  // Bulk selection state
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; page: SmartLinkPage | null }>({ open: false, page: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; linkIds: string[] }>({ open: false, linkIds: [] });

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
            avatar_url,
            user_id
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

      setSmartLinkPages(pagesWithClicks.filter(p => p.status !== 'suspended'));
      setSuspendedPages(pagesWithClicks.filter(p => p.status === 'suspended'));

      // Fetch flagged links
      const { data: flagged } = await supabase
        .from('smart_link_external_links')
        .select(`
          *,
          smart_link_pages (
            slug,
            artist_id,
            artist_profiles (
              artist_name,
              user_id
            )
          )
        `)
        .eq('status', 'flagged')
        .order('created_at', { ascending: false });

      setFlaggedLinks((flagged || []) as FlaggedLink[]);

      // Calculate stats
      const totalPages = pages?.length || 0;
      const activePages = pages?.filter(p => p.status === 'active').length || 0;
      const suspended = pages?.filter(p => p.status === 'suspended').length || 0;
      const totalClicks = pagesWithClicks.reduce((sum, p) => sum + (p._clickCount || 0), 0);
      const flaggedCount = flagged?.length || 0;

      setStats({ totalPages, activePages, suspendedPages: suspended, totalClicks, flaggedCount });
    } catch (error) {
      console.error('Error fetching smart links:', error);
    } finally {
      setLoading(false);
    }
  };

  // Notification helper
  const sendNotification = async (userId: string, type: string, title: string, message: string, link?: string) => {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title,
        message,
        link: link || '/studio/smart-link',
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  // Page suspension
  const handleSuspendPage = async (type: "temporary" | "permanent", reason: string, until?: Date) => {
    if (!suspendDialog.page || !user) return;
    
    const page = suspendDialog.page;
    
    try {
      await supabase
        .from('smart_link_pages')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspended_by: user.id,
          suspended_until: until?.toISOString() || null,
          suspension_reason: reason,
          suspension_type: type,
        })
        .eq('id', page.id);

      // Log activity
      await logActivity('smart_link_page_suspended', 'smart_link_page', page.id, {
        slug: page.slug,
        artist_id: page.artist_id,
        suspension_type: type,
        reason,
        until: until?.toISOString(),
      });

      // Notify artist
      if (page.artist_profiles?.user_id) {
        await sendNotification(
          page.artist_profiles.user_id,
          'smart_link_suspended',
          '⚠️ Smart Link Suspended',
          `Your smart link page has been suspended: ${reason}`,
          '/studio/smart-link'
        );
      }

      toast.success('Page suspended');
      fetchData();
    } catch (error) {
      console.error('Error suspending page:', error);
      toast.error('Failed to suspend page');
    }
  };

  // Unsuspend page
  const handleUnsuspendPage = async (page: SmartLinkPage) => {
    if (!user) return;
    
    try {
      await supabase
        .from('smart_link_pages')
        .update({
          status: 'active',
          suspended_at: null,
          suspended_by: null,
          suspended_until: null,
          suspension_reason: null,
          suspension_type: null,
        })
        .eq('id', page.id);

      // Log activity
      await logActivity('smart_link_page_unsuspended', 'smart_link_page', page.id, {
        slug: page.slug,
        artist_id: page.artist_id,
      });

      // Notify artist
      if (page.artist_profiles?.user_id) {
        await sendNotification(
          page.artist_profiles.user_id,
          'smart_link_restored',
          '✅ Smart Link Restored',
          'Your smart link page has been restored and is now active.',
          '/studio/smart-link'
        );
      }

      toast.success('Page restored');
      fetchData();
    } catch (error) {
      console.error('Error unsuspending page:', error);
      toast.error('Failed to restore page');
    }
  };

  // Approve single link
  const handleApproveLink = async (link: FlaggedLink) => {
    if (!user) return;
    
    try {
      await supabase
        .from('smart_link_external_links')
        .update({ status: 'active', flag_reason: null, verified_at: new Date().toISOString(), verified_by: user.id })
        .eq('id', link.id);
      
      // Log activity
      await logActivity('smart_link_approved', 'smart_link_external_link', link.id, {
        url: link.url,
        platform: link.platform,
        page_slug: link.smart_link_pages?.slug,
      });

      // Notify artist
      if (link.smart_link_pages?.artist_profiles?.user_id) {
        await sendNotification(
          link.smart_link_pages.artist_profiles.user_id,
          'smart_link_approved',
          '✅ Link Approved',
          `Your ${link.platform} link has been verified and is now active.`,
          '/studio/smart-link'
        );
      }

      setFlaggedLinks(prev => prev.filter(l => l.id !== link.id));
      setStats(prev => ({ ...prev, flaggedCount: prev.flaggedCount - 1 }));
      toast.success('Link approved');
    } catch (error) {
      console.error('Error approving link:', error);
      toast.error('Failed to approve link');
    }
  };

  // Reject links with reason
  const handleRejectLinks = async (reason: string, permanentlyBlock: boolean) => {
    if (!user || rejectDialog.linkIds.length === 0) return;
    
    setBulkLoading(true);
    try {
      const linksToReject = flaggedLinks.filter(l => rejectDialog.linkIds.includes(l.id));
      
      await supabase
        .from('smart_link_external_links')
        .update({ 
          status: 'removed', 
          removal_reason: reason,
          removed_at: new Date().toISOString(),
          removed_by: user.id,
          is_permanently_blocked: permanentlyBlock,
        })
        .in('id', rejectDialog.linkIds);
      
      // Log activity
      await logActivity('smart_link_rejected', 'smart_link_external_link', rejectDialog.linkIds.join(','), {
        count: rejectDialog.linkIds.length,
        reason,
        permanently_blocked: permanentlyBlock,
      });

      // Notify affected artists
      const artistNotifications = new Map<string, string[]>();
      linksToReject.forEach(link => {
        const userId = link.smart_link_pages?.artist_profiles?.user_id;
        if (userId) {
          if (!artistNotifications.has(userId)) {
            artistNotifications.set(userId, []);
          }
          artistNotifications.get(userId)?.push(link.platform);
        }
      });

      for (const [userId, platforms] of artistNotifications) {
        await sendNotification(
          userId,
          'smart_link_rejected',
          '⚠️ Link Removed',
          `Your ${platforms.join(', ')} link${platforms.length > 1 ? 's were' : ' was'} removed: ${reason}`,
          '/studio/smart-link'
        );
      }

      setFlaggedLinks(prev => prev.filter(l => !rejectDialog.linkIds.includes(l.id)));
      setStats(prev => ({ ...prev, flaggedCount: prev.flaggedCount - rejectDialog.linkIds.length }));
      setSelectedLinks(new Set());
      toast.success(`${rejectDialog.linkIds.length} link(s) rejected`);
    } catch (error) {
      console.error('Error rejecting links:', error);
      toast.error('Failed to reject links');
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk approve
  const handleBulkApprove = async () => {
    if (!user || selectedLinks.size === 0) return;
    
    setBulkLoading(true);
    try {
      const linkIds = Array.from(selectedLinks);
      
      await supabase
        .from('smart_link_external_links')
        .update({ 
          status: 'active', 
          flag_reason: null,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .in('id', linkIds);
      
      // Log activity
      await logActivity('smart_link_bulk_approve', 'smart_link_external_link', linkIds.join(','), {
        count: linkIds.length,
      });

      setFlaggedLinks(prev => prev.filter(l => !selectedLinks.has(l.id)));
      setStats(prev => ({ ...prev, flaggedCount: prev.flaggedCount - linkIds.length }));
      setSelectedLinks(new Set());
      toast.success(`${linkIds.length} links approved`);
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast.error('Failed to approve links');
    } finally {
      setBulkLoading(false);
    }
  };

  // Toggle selection
  const toggleLinkSelection = (linkId: string) => {
    setSelectedLinks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(linkId)) {
        newSet.delete(linkId);
      } else {
        newSet.add(linkId);
      }
      return newSet;
    });
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedLinks.size === flaggedLinks.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(flaggedLinks.map(l => l.id)));
    }
  };

  const filteredPages = smartLinkPages.filter(page => 
    page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.artist_profiles?.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Smart Links" description="Platform-wide smart link analytics and moderation">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
              <div className="p-2 rounded-lg bg-red-500/10">
                <Ban className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.suspendedPages}</p>
                <p className="text-xs text-muted-foreground">Suspended</p>
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
          <TabsTrigger value="suspended" className="relative">
            Suspended
            {stats.suspendedPages > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.suspendedPages}
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600/30 hover:bg-red-600/10"
                          onClick={() => setSuspendDialog({ open: true, page })}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Flagged Links Queue</CardTitle>
                {flaggedLinks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedLinks.size === flaggedLinks.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                )}
              </div>
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
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedLinks.has(link.id)}
                          onCheckedChange={() => toggleLinkSelection(link.id)}
                        />
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
                            onClick={() => handleApproveLink(link)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600/30 hover:bg-red-600/10"
                            onClick={() => setRejectDialog({ open: true, linkIds: [link.id] })}
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

        <TabsContent value="suspended">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Suspended Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : suspendedPages.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Suspended Pages</p>
                  <p className="text-muted-foreground">All pages are currently active</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suspendedPages.map((page) => (
                    <div key={page.id} className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">@{page.slug}</p>
                            <Badge variant={page.suspension_type === 'permanent' ? 'destructive' : 'secondary'}>
                              {page.suspension_type === 'permanent' ? 'Permanent' : 'Temporary'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {page.artist_profiles?.artist_name}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                            Reason: {page.suspension_reason}
                          </p>
                          {page.suspended_until && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Until: {new Date(page.suspended_until).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                          onClick={() => handleUnsuspendPage(page)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedLinks.size}
        onApprove={handleBulkApprove}
        onReject={() => setRejectDialog({ open: true, linkIds: Array.from(selectedLinks) })}
        onClear={() => setSelectedLinks(new Set())}
        loading={bulkLoading}
      />

      {/* Suspend Dialog */}
      <SuspendPageDialog
        open={suspendDialog.open}
        onOpenChange={(open) => setSuspendDialog({ open, page: open ? suspendDialog.page : null })}
        pageSlug={suspendDialog.page?.slug || ''}
        artistName={suspendDialog.page?.artist_profiles?.artist_name || 'Unknown Artist'}
        onSuspend={handleSuspendPage}
      />

      {/* Reject Dialog */}
      <RejectReasonDialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog({ open, linkIds: open ? rejectDialog.linkIds : [] })}
        count={rejectDialog.linkIds.length}
        onConfirm={handleRejectLinks}
      />
    </AdminLayout>
  );
}
