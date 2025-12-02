import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Loader2, CalendarIcon, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EditPromoLinkDialogProps {
  promoLink: {
    id: string;
    slug: string;
    campaign_name: string | null;
    utm_source: string | null;
    is_active: boolean | null;
    expires_at?: string | null;
  };
  onUpdated: () => void;
  onDeleted: () => void;
}

const RESERVED_SLUGS = ['admin', 'api', 'link', 'auth', 'studio', 'fan', 'search', 'discover'];

export function EditPromoLinkDialog({ promoLink, onUpdated, onDeleted }: EditPromoLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [slug, setSlug] = useState(promoLink.slug);
  const [campaignName, setCampaignName] = useState(promoLink.campaign_name || '');
  const [utmSource, setUtmSource] = useState(promoLink.utm_source || '');
  const [isActive, setIsActive] = useState(promoLink.is_active ?? true);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    promoLink.expires_at ? new Date(promoLink.expires_at) : undefined
  );
  
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugValid, setSlugValid] = useState(true);
  const [checkingSlug, setCheckingSlug] = useState(false);

  useEffect(() => {
    setSlug(promoLink.slug);
    setCampaignName(promoLink.campaign_name || '');
    setUtmSource(promoLink.utm_source || '');
    setIsActive(promoLink.is_active ?? true);
    setExpiresAt(promoLink.expires_at ? new Date(promoLink.expires_at) : undefined);
  }, [promoLink]);

  const validateSlug = async (value: string) => {
    setSlugError(null);
    setSlugValid(false);
    
    if (value.length < 3) {
      setSlugError('Slug must be at least 3 characters');
      return;
    }
    if (value.length > 50) {
      setSlugError('Slug must be 50 characters or less');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      setSlugError('Only lowercase letters, numbers, and hyphens');
      return;
    }
    if (RESERVED_SLUGS.includes(value)) {
      setSlugError('This slug is reserved');
      return;
    }
    
    // Check uniqueness if changed
    if (value !== promoLink.slug) {
      setCheckingSlug(true);
      const { data } = await supabase
        .from('promo_links')
        .select('id')
        .eq('slug', value)
        .neq('id', promoLink.id)
        .maybeSingle();
      setCheckingSlug(false);
      
      if (data) {
        setSlugError('This slug is already taken');
        return;
      }
    }
    
    setSlugValid(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (slug) validateSlug(slug);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleSave = async () => {
    if (!slugValid || slugError) {
      toast.error('Please fix the slug error before saving');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('promo_links')
        .update({
          slug,
          campaign_name: campaignName || null,
          utm_source: utmSource || null,
          is_active: isActive,
          expires_at: expiresAt?.toISOString() || null,
        })
        .eq('id', promoLink.id);

      if (error) throw error;

      toast.success('Promo link updated');
      setOpen(false);
      onUpdated();
    } catch (error) {
      console.error('Error updating promo link:', error);
      toast.error('Failed to update promo link');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('promo_links')
        .delete()
        .eq('id', promoLink.id);

      if (error) throw error;

      toast.success('Promo link deleted');
      setOpen(false);
      onDeleted();
    } catch (error) {
      console.error('Error deleting promo link:', error);
      toast.error('Failed to delete promo link');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Promo Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Custom Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/link/</span>
              <div className="relative flex-1">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="your-slug"
                  className={cn(
                    slugError && 'border-destructive',
                    slugValid && !checkingSlug && 'border-green-500'
                  )}
                />
                {checkingSlug && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!checkingSlug && slugValid && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {!checkingSlug && slugError && (
                  <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {slugError && (
              <p className="text-xs text-destructive">{slugError}</p>
            )}
          </div>

          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign Name (optional)</Label>
            <Input
              id="campaign"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Summer Release"
            />
          </div>

          {/* UTM Source */}
          <div className="space-y-2">
            <Label htmlFor="utm">UTM Source (optional)</Label>
            <Input
              id="utm"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value.toLowerCase())}
              placeholder="instagram, tiktok, youtube..."
            />
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Expiration Date (optional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !expiresAt && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiresAt ? format(expiresAt, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {expiresAt && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpiresAt(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete promo link?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this promo link and all its analytics data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={loading || !slugValid || !!slugError}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}