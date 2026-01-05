import { useState, useMemo } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface DeepLinkGeneratorProps {
  artistId: string;
  artistUserId: string;
}

const PLATFORMS = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'linktree', label: 'Linktree' },
  { value: 'other', label: 'Other' },
];

const LANDING_OPTIONS = [
  { value: 'profile', label: 'Artist Profile' },
  { value: 'spotlight', label: 'Current Spotlight' },
  { value: 'community', label: 'Community' },
];

export function DeepLinkGenerator({ artistId, artistUserId }: DeepLinkGeneratorProps) {
  const [platform, setPlatform] = useState('spotify');
  const [campaign, setCampaign] = useState('');
  const [landing, setLanding] = useState('profile');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/artist/${artistUserId}`
    : `/artist/${artistUserId}`;

  const generatedLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set('utm_source', platform);
    params.set('utm_medium', 'bio_link');
    if (campaign) {
      params.set('utm_campaign', campaign.toLowerCase().replace(/\s+/g, '_'));
    }
    params.set('fm_ref', landing);
    
    return `${baseUrl}?${params.toString()}`;
  }, [baseUrl, platform, campaign, landing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Deep Link Generator
        </CardTitle>
        <CardDescription>
          Create trackable links for external platforms to drive fans to FlyMusic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Campaign Name (optional)</Label>
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g., new_album_2026"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Landing Page</Label>
          <Select value={landing} onValueChange={setLanding}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANDING_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generated Link */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Your trackable link:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm break-all bg-background p-2 rounded">
              {generatedLink}
            </code>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Share this link on <strong className="capitalize">{platform}</strong> to track inbound conversions in your analytics.
          When fans click this link, you'll see the traffic source in your Spotlight analytics.
        </p>
      </CardContent>
    </Card>
  );
}
