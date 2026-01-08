import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { type BannerCropData } from '@/hooks/useProfileBanner';

interface BannerCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  aspectRatio: number; // 3 for desktop (3:1), 1.33 for mobile (4:3)
  initialCrop?: BannerCropData | null;
  onSave: (cropData: BannerCropData) => void;
  title?: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function BannerCropper({
  open,
  onOpenChange,
  imageUrl,
  aspectRatio,
  initialCrop,
  onSave,
  title = "Adjust Your Banner",
}: BannerCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [zoom, setZoom] = useState(initialCrop?.zoom || 1);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    if (initialCrop) {
      setCrop({
        unit: '%',
        x: initialCrop.x,
        y: initialCrop.y,
        width: initialCrop.width,
        height: initialCrop.height,
      });
      setZoom(initialCrop.zoom || 1);
    } else {
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  }, [aspectRatio, initialCrop]);

  useEffect(() => {
    if (open && imgRef.current && !crop) {
      const { width, height } = imgRef.current;
      if (width && height) {
        setCrop(centerAspectCrop(width, height, aspectRatio));
      }
    }
  }, [open, aspectRatio, crop]);

  const handleSave = () => {
    if (!crop) return;
    
    const cropData: BannerCropData = {
      x: crop.x || 0,
      y: crop.y || 0,
      width: crop.width || 100,
      height: crop.height || 33,
      zoom,
    };
    
    onSave(cropData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image with crop area */}
          <div className="relative max-h-[60vh] overflow-auto rounded-lg bg-muted/50">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={aspectRatio}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Banner to crop"
                  onLoad={onImageLoad}
                  className="max-w-full"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
          </div>

          {/* Zoom control */}
          <div className="space-y-2">
            <Label className="text-sm">Zoom: {Math.round(zoom * 100)}%</Label>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={1}
              max={2}
              step={0.05}
              className="w-full"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Drag the crop area to adjust which part of the image will be visible.
            {aspectRatio >= 2 ? " This is optimized for wide desktop screens." : " This is optimized for mobile screens."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
