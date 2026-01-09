import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Crop, 
  Trash2, 
  Eye,
  Play
} from 'lucide-react';
import { useProfileBanner, type BannerCropData } from '@/hooks/useProfileBanner';
import { BannerCropper } from './BannerCropper';
import { BannerPreviewModal } from './BannerPreviewModal';
import { BannerPositionSlider } from './BannerPositionSlider';
import { BannerTextToggle } from './BannerTextToggle';
import { ProfileThemeSelector } from './ProfileThemeSelector';
import { type ProfileTheme } from '@/lib/themes';

interface BannerData {
  url: string | null;
  mediaType: 'image' | 'video' | null;
  cropData: BannerCropData | null;
}

interface BannerUploadSectionProps {
  profileId: string;
  userId: string;
  artistName: string;
  avatarUrl: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  desktopBanner: BannerData;
  mobileBanner: BannerData;
  bannerPositionY: number;
  showNameOnBanner: boolean;
  profileTheme: ProfileTheme;
  onSuccess: () => void;
  onPositionChange: (value: number) => void;
  onTextToggleChange: (value: boolean) => void;
  onThemeChange: (theme: ProfileTheme) => void;
}

export function BannerUploadSection({
  profileId,
  userId,
  artistName,
  avatarUrl,
  genre,
  city,
  country,
  desktopBanner,
  mobileBanner,
  bannerPositionY,
  showNameOnBanner,
  profileTheme,
  onSuccess,
  onPositionChange,
  onTextToggleChange,
  onThemeChange,
}: BannerUploadSectionProps) {
  const [useMobileBanner, setUseMobileBanner] = useState(!!mobileBanner.url);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperType, setCropperType] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  
  const desktopImageRef = useRef<HTMLInputElement>(null);
  const desktopVideoRef = useRef<HTMLInputElement>(null);
  const mobileImageRef = useRef<HTMLInputElement>(null);
  const mobileVideoRef = useRef<HTMLInputElement>(null);

  const bannerUploader = useProfileBanner({
    profileId,
    userId,
    onSuccess,
  });

  const openCropper = (type: 'desktop' | 'mobile') => {
    setCropperType(type);
    setShowCropper(true);
  };

  const handleCropSave = async (cropData: BannerCropData) => {
    await bannerUploader.saveCropData(cropData, cropperType);
  };

  const renderBannerPreview = (
    banner: BannerData, 
    aspectRatio: string,
    type: 'desktop' | 'mobile'
  ) => {
    if (!banner.url) {
      return (
        <div className={`w-full ${aspectRatio} bg-gradient-to-br from-primary/30 via-primary/10 to-background rounded-lg flex items-center justify-center`}>
          <p className="text-muted-foreground text-sm">No banner set</p>
        </div>
      );
    }

    // Use bannerPositionY for Y position, crop data for X
    const yPosition = type === 'desktop' ? bannerPositionY : (banner.cropData?.y ?? 50);
    const xPosition = banner.cropData?.x ?? 50;
    
    const cropStyle: React.CSSProperties = {
      objectPosition: `${xPosition}% ${yPosition}%`,
    };

    if (banner.mediaType === 'video') {
      return (
        <div className={`w-full ${aspectRatio} rounded-lg overflow-hidden relative group`}>
          <video
            src={banner.url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-8 w-8 text-white" />
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full ${aspectRatio} rounded-lg overflow-hidden`}>
        <img
          src={banner.url}
          alt={`${type} banner`}
          className="w-full h-full object-cover"
          style={cropStyle}
        />
      </div>
    );
  };

  const currentCropUrl = cropperType === 'desktop' ? desktopBanner.url : mobileBanner.url;
  const currentCropData = cropperType === 'desktop' ? desktopBanner.cropData : mobileBanner.cropData;
  const currentAspectRatio = cropperType === 'desktop' ? 3 : 4/3;
  const hasBanner = !!desktopBanner.url;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Profile Banner</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={!desktopBanner.url}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>

        <div className="space-y-6">
          {/* Desktop Banner Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Desktop Banner (3:1)</Label>
            
            {/* Preview */}
            {renderBannerPreview(desktopBanner, 'aspect-[3/1]', 'desktop')}

            {/* Upload buttons and actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => desktopImageRef.current?.click()}
                disabled={bannerUploader.uploading}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => desktopVideoRef.current?.click()}
                disabled={bannerUploader.uploading}
              >
                <Video className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              {desktopBanner.url && desktopBanner.mediaType === 'image' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCropper('desktop')}
                >
                  <Crop className="h-4 w-4 mr-2" />
                  Adjust Crop
                </Button>
              )}
              {desktopBanner.url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bannerUploader.removeBanner('desktop')}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            {/* Hidden file inputs */}
            <Input
              ref={desktopImageRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => bannerUploader.handleFileSelect(e, 'desktop')}
            />
            <Input
              ref={desktopVideoRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => bannerUploader.handleFileSelect(e, 'desktop')}
            />

            {/* Drop zone */}
            <div
              onDrop={(e) => bannerUploader.handleDrop(e, 'desktop')}
              onDragOver={bannerUploader.handleDragOver}
              onDragLeave={bannerUploader.handleDragLeave}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                bannerUploader.dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop an image or video here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP up to 10MB • MP4, WebM up to 50MB
              </p>
            </div>

            {/* Upload progress */}
            {bannerUploader.uploading && (
              <div className="space-y-2">
                <Progress value={bannerUploader.progress} className="h-2" />
                <p className="text-sm text-primary text-center">
                  Uploading... {bannerUploader.progress}%
                </p>
              </div>
            )}
          </div>

          {/* Banner Position Slider - Only for images */}
          {hasBanner && desktopBanner.mediaType === 'image' && (
            <>
              <Separator />
              <BannerPositionSlider
                value={bannerPositionY}
                onChange={onPositionChange}
              />
            </>
          )}

          {/* Show Name Toggle */}
          <Separator />
          <BannerTextToggle
            value={showNameOnBanner}
            onChange={onTextToggleChange}
            hasBanner={hasBanner}
          />

          {/* Theme Selector */}
          <Separator />
          <ProfileThemeSelector
            value={profileTheme}
            onChange={onThemeChange}
          />

          {/* Mobile Banner Toggle */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Mobile Banner (4:3)</Label>
                <p className="text-sm text-muted-foreground">
                  Optional: Use a separate banner optimized for mobile screens
                </p>
              </div>
              <Switch
                checked={useMobileBanner}
                onCheckedChange={setUseMobileBanner}
              />
            </div>

            {useMobileBanner && (
              <div className="space-y-3">
                {/* Preview */}
                <div className="max-w-xs">
                  {renderBannerPreview(mobileBanner, 'aspect-[4/3]', 'mobile')}
                </div>

                {/* Upload buttons and actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mobileImageRef.current?.click()}
                    disabled={bannerUploader.uploading}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mobileVideoRef.current?.click()}
                    disabled={bannerUploader.uploading}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                  {mobileBanner.url && mobileBanner.mediaType === 'image' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCropper('mobile')}
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Adjust Crop
                    </Button>
                  )}
                  {mobileBanner.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bannerUploader.removeBanner('mobile')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Hidden file inputs */}
                <Input
                  ref={mobileImageRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => bannerUploader.handleFileSelect(e, 'mobile')}
                />
                <Input
                  ref={mobileVideoRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => bannerUploader.handleFileSelect(e, 'mobile')}
                />

                <p className="text-xs text-muted-foreground">
                  Mobile banners appear taller to work better on phone screens.
                  Videos should be under 15 seconds for best performance.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Cropper Modal */}
      {showCropper && currentCropUrl && (
        <BannerCropper
          open={showCropper}
          onOpenChange={setShowCropper}
          imageUrl={currentCropUrl}
          aspectRatio={currentAspectRatio}
          initialCrop={currentCropData}
          onSave={handleCropSave}
          title={`Adjust ${cropperType === 'desktop' ? 'Desktop' : 'Mobile'} Banner`}
        />
      )}

      {/* Preview Modal */}
      <BannerPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        artist={{
          artist_name: artistName,
          avatar_url: avatarUrl,
          banner_url: desktopBanner.url,
          banner_url_mobile: mobileBanner.url,
          banner_media_type: desktopBanner.mediaType,
          banner_media_type_mobile: mobileBanner.mediaType,
          banner_crop_data: desktopBanner.cropData,
          banner_crop_data_mobile: mobileBanner.cropData,
          banner_position_y: bannerPositionY,
          show_name_on_banner: showNameOnBanner,
          profile_theme: profileTheme,
          genre,
          city,
          country,
        }}
      />
    </>
  );
}
