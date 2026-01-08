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
import { Monitor, Smartphone } from 'lucide-react';
import { ArtistHeroSection } from '@/components/artist/ArtistHeroSection';
import { type BannerCropData } from '@/hooks/useProfileBanner';

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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Create preview artist object based on mode
  const previewArtist = {
    ...artist,
    // When in mobile mode with a mobile banner, use the mobile banner
    banner_url: previewMode === 'mobile' && artist.banner_url_mobile 
      ? artist.banner_url_mobile 
      : artist.banner_url,
    banner_media_type: previewMode === 'mobile' && artist.banner_url_mobile
      ? artist.banner_media_type_mobile
      : artist.banner_media_type,
    banner_crop_data: previewMode === 'mobile' && artist.banner_url_mobile
      ? artist.banner_crop_data_mobile
      : artist.banner_crop_data,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Banner Preview</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Device toggle */}
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'desktop' | 'mobile')}>
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Preview container with device frame */}
          <div 
            className={`border rounded-lg overflow-hidden bg-background transition-all ${
              previewMode === 'mobile' 
                ? 'max-w-sm mx-auto' 
                : 'w-full'
            }`}
          >
            <ArtistHeroSection
              artist={previewArtist}
              followerCount={0}
              isFollowing={false}
              hasBetaAccess={false}
              isVerified={false}
              onShare={() => {}}
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            This is how your profile banner will appear to fans on {previewMode === 'desktop' ? 'desktop/tablet' : 'mobile'} devices.
            {previewMode === 'mobile' && !artist.banner_url_mobile && artist.banner_url && (
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
