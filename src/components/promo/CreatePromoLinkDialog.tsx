import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreatePromoLinkDialogProps {
  onCreated: () => void;
}

type ContentType = 'track' | 'video' | 'event' | 'spotlight' | 'profile';

interface ContentItem {
  id: string;
  title: string;
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function CreatePromoLinkDialog({ onCreated }: CreatePromoLinkDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('track');
  const [contentId, setContentId] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) setArtistId(data.id);
    };
    fetchArtistProfile();
  }, [user]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!artistId || contentType === 'profile') {
        setContentItems([]);
        setContentId('');
        return;
      }

      setLoadingContent(true);
      try {
        let data: ContentItem[] = [];
        
        if (contentType === 'track') {
          const { data: tracks } = await supabase
            .from('tracks')
            .select('id, title')
            .eq('artist_id', artistId)
            .order('created_at', { ascending: false });
          data = tracks?.map(t => ({ id: t.id, title: t.title })) || [];
        } else if (contentType === 'video') {
          const { data: videos } = await supabase
            .from('artist_video_posts')
            .select('id, caption')
            .eq('artist_id', artistId)
            .order('created_at', { ascending: false });
          data = videos?.map(v => ({ id: v.id, title: v.caption || 'Untitled Video' })) || [];
        } else if (contentType === 'event') {
          const { data: events } = await supabase
            .from('artist_events')
            .select('id, title')
            .eq('artist_id', artistId)
            .order('start_time', { ascending: false });
          data = events?.map(e => ({ id: e.id, title: e.title })) || [];
        } else if (contentType === 'spotlight') {
          const { data: entries } = await supabase
            .from('spotlight_entries')
            .select('id, title')
            .eq('artist_id', artistId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
          data = entries?.map(e => ({ id: e.id, title: e.title || 'Spotlight Entry' })) || [];
        }

        setContentItems(data);
        if (data.length > 0) setContentId(data[0].id);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, [artistId, contentType]);

  const handleCreate = async () => {
    if (!artistId) {
      toast.error('Artist profile not found');
      return;
    }

    if (contentType !== 'profile' && !contentId) {
      toast.error('Please select content');
      return;
    }

    setLoading(true);
    try {
      const slug = generateSlug();
      const { data, error } = await supabase
        .from('promo_links')
        .insert({
          artist_id: artistId,
          content_type: contentType,
          content_id: contentType === 'profile' ? null : contentId,
          slug,
          campaign_name: campaignName || null,
          utm_source: utmSource || null,
        })
        .select()
        .single();

      if (error) throw error;

      const fullUrl = `${window.location.origin}/link/${slug}`;
      setCreatedLink(fullUrl);
      toast.success('Promo link created!');
      onCreated();
    } catch (error: any) {
      console.error('Error creating promo link:', error);
      toast.error(error.message || 'Failed to create promo link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (createdLink) {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedLink(null);
    setCampaignName('');
    setUtmSource('');
    setContentType('track');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdLink ? 'Promo Link Created!' : 'Create Promo Link'}
          </DialogTitle>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Your promo link:</p>
              <p className="font-mono text-sm break-all">{createdLink}</p>
            </div>
            <Button onClick={handleCopy} className="w-full">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Create Another
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="track">Track</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="spotlight">Spotlight Entry</SelectItem>
                  <SelectItem value="profile">Artist Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contentType !== 'profile' && (
              <div className="space-y-2">
                <Label>Select Content</Label>
                {loadingContent ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : contentItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No {contentType}s found. Create one first!
                  </p>
                ) : (
                  <Select value={contentId} onValueChange={setContentId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Campaign Name (optional)</Label>
              <Input
                placeholder="e.g., Summer Release, TikTok Promo"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>UTM Source (optional)</Label>
              <Input
                placeholder="e.g., instagram, tiktok, youtube"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading || (contentType !== 'profile' && !contentId)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Link'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
