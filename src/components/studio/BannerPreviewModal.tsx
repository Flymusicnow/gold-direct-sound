import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, RotateCcw, Check, X } from 'lucide-react';
import { ArtistHeroSection } from '@/components/artist/ArtistHeroSection';
import { type BannerCropData } from '@/hooks/useProfileBanner';
import { type ProfileTheme } from '@/lib/themes';

type PreviewMode = 'desktop' | 'mobile-portrait' | 'mobile-landscape';

interface BannerPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist: {
    artist_name: string;
    avatar_url: string | null;
    banner_url: string | null;
    banner_url_mobile?: string | null;
    banner_media_type?: string | null;
    banner_media_type_mobile?: string | null;
    banner_crop_data?: BannerCropData | null;
    banner_crop_data_mobile?: BannerCropData | null;
    banner_position_y?: number | null;
    show_name_on_banner?: boolean | null;
    profile_theme?: ProfileTheme | string | null;
    genre: string | null;
    city: string | null;
    country: string | null;
  };
}

export function BannerPreviewModal({
  open,
  onOpenChange,
  artist,
}: BannerPreviewModalProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');

  // Create preview artist object based on mode
  const isMobileMode = previewMode !== 'desktop';
  const previewArtist = {
    ...artist,
    // When in mobile mode with a mobile banner, use the mobile banner
    banner_url: isMobileMode && artist.banner_url_mobile 
      ? artist.banner_url_mobile 
      : artist.banner_url,
    banner_media_type: isMobileMode && artist.banner_url_mobile
      ? artist.banner_media_type_mobile
      : artist.banner_media_type,
    banner_crop_data: isMobileMode && artist.banner_url_mobile
      ? artist.banner_crop_data_mobile
      : artist.banner_crop_data,
  };

  // Status indicators
  const hasNameVisible = artist.show_name_on_banner !== false || !artist.banner_url;
  const hasProfilePicture = true; // Always true per SUPER CARD
  const hasFollowerCount = true; // Always true per SUPER CARD

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Banner Preview</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Device toggle - now with 3 options */}
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as PreviewMode)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Desktop</span>
              </TabsTrigger>
              <TabsTrigger value="mobile-portrait" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Portrait</span>
              </TabsTrigger>
              <TabsTrigger value="mobile-landscape" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 rotate-90" />
                <span className="hidden sm:inline">Landscape</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Preview container with device frame */}
          <div 
            className={`border rounded-lg overflow-hidden bg-background transition-all ${
              previewMode === 'mobile-portrait' 
                ? 'max-w-sm mx-auto' 
                : previewMode === 'mobile-landscape'
                ? 'max-w-2xl mx-auto aspect-video'
                : 'w-full'
            }`}
          >
            <ArtistHeroSection
              artist={previewArtist}
              followerCount={1234}
              isFollowing={false}
              hasBetaAccess={false}
              isVerified={false}
              onShare={() => {}}
            />
          </div>

          {/* SUPER CARD Fail-safe status */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className={`flex items-center gap-1 p-2 rounded-md ${hasProfilePicture ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
              {hasProfilePicture ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Profile picture
            </div>
            <div className={`flex items-center gap-1 p-2 rounded-md ${hasFollowerCount ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
              {hasFollowerCount ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Follower count
            </div>
            <div className={`flex items-center gap-1 p-2 rounded-md ${hasNameVisible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
              {hasNameVisible ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Artist name: {hasNameVisible ? 'ON' : 'OFF'}
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            This is how your profile banner will appear to fans on{' '}
            {previewMode === 'desktop' 
              ? 'desktop/tablet' 
              : previewMode === 'mobile-portrait' 
              ? 'mobile (portrait)' 
              : 'mobile (landscape)'
            } devices.
            {isMobileMode && !artist.banner_url_mobile && artist.banner_url && (
              <span className="block mt-1 text-primary">
                Tip: Upload a separate mobile banner for better display on phones.
              </span>
            )}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
