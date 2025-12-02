import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, ExternalLink, BarChart3, Music, Video, Calendar, Sparkles, User, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { EditPromoLinkDialog } from './EditPromoLinkDialog';
import { PromoQRCodeModal } from './PromoQRCodeModal';
import { format, isBefore, addDays, isAfter } from 'date-fns';

interface PromoLinkCardProps {
  promoLink: {
    id: string;
    slug: string;
    content_type: string;
    content_id: string | null;
    campaign_name: string | null;
    utm_source: string | null;
    click_count: number | null;
    is_active: boolean | null;
    created_at: string | null;
    expires_at?: string | null;
  };
  contentTitle?: string;
  onUpdated: () => void;
  onDeleted: () => void;
}

const contentTypeIcons: Record<string, typeof Music> = {
  track: Music,
  video: Video,
  event: Calendar,
  spotlight: Sparkles,
  profile: User,
};

const contentTypeLabels: Record<string, string> = {
  track: 'Track',
  video: 'Video',
  event: 'Event',
  spotlight: 'Spotlight',
  profile: 'Profile',
};

export function PromoLinkCard({ promoLink, contentTitle, onUpdated, onDeleted }: PromoLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const Icon = contentTypeIcons[promoLink.content_type] || Music;
  const fullUrl = `${window.location.origin}/link/${promoLink.slug}`;

  const isExpired = promoLink.expires_at && isBefore(new Date(promoLink.expires_at), new Date());
  const isExpiringSoon = promoLink.expires_at && 
    isAfter(new Date(promoLink.expires_at), new Date()) && 
    isBefore(new Date(promoLink.expires_at), addDays(new Date(), 7));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Card className={`border-border/50 hover:border-primary/30 transition-all ${isExpired ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {contentTypeLabels[promoLink.content_type]}
                  </Badge>
                  {promoLink.campaign_name && (
                    <Badge variant="secondary" className="text-xs">
                      {promoLink.campaign_name}
                    </Badge>
                  )}
                  {!promoLink.is_active && (
                    <Badge variant="destructive" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  {isExpired && (
                    <Badge variant="destructive" className="text-xs">
                      Expired
                    </Badge>
                  )}
                  {isExpiringSoon && !isExpired && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Expires soon
                    </Badge>
                  )}
                </div>
                {contentTitle && (
                  <p className={`font-medium text-sm truncate ${isExpired ? 'line-through' : ''}`}>
                    {contentTitle}
                  </p>
                )}
                <p className="text-xs text-muted-foreground font-mono truncate">
                  /link/{promoLink.slug}
                </p>
                {promoLink.utm_source && (
                  <p className="text-xs text-muted-foreground mt-1">
                    UTM: {promoLink.utm_source}
                  </p>
                )}
                {promoLink.expires_at && !isExpired && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires: {format(new Date(promoLink.expires_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 text-sm">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{promoLink.click_count || 0}</span>
                <span className="text-muted-foreground">clicks</span>
              </div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy link</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(fullUrl, '_blank')}
                      className="h-8"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open in new tab</p>
                  </TooltipContent>
                </Tooltip>

                <EditPromoLinkDialog
                  promoLink={promoLink}
                  onUpdated={onUpdated}
                  onDeleted={onDeleted}
                />
                <PromoQRCodeModal
                  slug={promoLink.slug}
                  campaignName={promoLink.campaign_name}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}