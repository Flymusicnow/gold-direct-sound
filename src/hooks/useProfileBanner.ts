import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BannerCropData {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom?: number;
}

interface UseProfileBannerOptions {
  profileId?: string;
  userId: string;
  onSuccess?: () => void;
}

interface FileValidation {
  valid: boolean;
  error?: string;
  mediaType?: 'image' | 'video';
}

interface UploadResult {
  success: boolean;
  url?: string;
  mediaType?: 'image' | 'video';
  error?: string;
}

interface UseProfileBannerReturn {
  uploading: boolean;
  progress: number;
  dragActive: boolean;
  uploadBanner: (file: File, type: 'desktop' | 'mobile') => Promise<UploadResult>;
  saveCropData: (cropData: BannerCropData, type: 'desktop' | 'mobile') => Promise<boolean>;
  removeBanner: (type: 'desktop' | 'mobile') => Promise<boolean>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => void;
  handleDrop: (e: React.DragEvent, type: 'desktop' | 'mobile') => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  validateFile: (file: File) => FileValidation;
}

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function useProfileBanner({
  profileId,
  userId,
  onSuccess,
}: UseProfileBannerOptions): UseProfileBannerReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((file: File): FileValidation => {
    const isImage = VALID_IMAGE_TYPES.includes(file.type);
    const isVideo = VALID_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return { valid: false, error: 'Please select a valid image (JPEG, PNG, WebP) or video (MP4, WebM, MOV)' };
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: 'Image must be less than 10MB' };
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return { valid: false, error: 'Video must be less than 50MB' };
    }

    return { valid: true, mediaType: isImage ? 'image' : 'video' };
  }, []);

  const getFileExtension = (file: File): string => {
    const parts = file.name.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'jpg';
  };

  const uploadBanner = useCallback(async (file: File, type: 'desktop' | 'mobile'): Promise<UploadResult> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return { success: false, error: validation.error };
    }

    if (!userId || !profileId) {
      return { success: false, error: 'User not authenticated or profile not found' };
    }

    setUploading(true);
    setProgress(0);

    try {
      setProgress(10);

      const suffix = type === 'mobile' ? '_mobile' : '';
      const bannerPath = `${userId}/${Date.now()}_banner${suffix}.${getFileExtension(file)}`;
      
      setProgress(20);

      const { error: uploadError } = await supabase.storage
        .from('artist-banners')
        .upload(bannerPath, file);

      if (uploadError) throw uploadError;

      setProgress(60);

      const { data: { publicUrl } } = supabase.storage
        .from('artist-banners')
        .getPublicUrl(bannerPath);

      setProgress(80);

      // Update artist_profiles with the banner URL
      const updateData: Record<string, any> = {};
      if (type === 'desktop') {
        updateData.banner_url = publicUrl;
        updateData.banner_media_type = validation.mediaType;
        // Clear crop data for videos (crop only applies to images)
        if (validation.mediaType === 'video') {
          updateData.banner_crop_data = null;
        }
      } else {
        updateData.banner_url_mobile = publicUrl;
        updateData.banner_media_type_mobile = validation.mediaType;
        if (validation.mediaType === 'video') {
          updateData.banner_crop_data_mobile = null;
        }
      }

      const { error: updateError } = await supabase
        .from('artist_profiles')
        .update(updateData)
        .eq('id', profileId);

      if (updateError) throw updateError;

      setProgress(100);
      
      onSuccess?.();
      toast.success(`${type === 'desktop' ? 'Desktop' : 'Mobile'} banner updated`);

      return { success: true, url: publicUrl, mediaType: validation.mediaType };
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      toast.error(error.message || "Failed to upload banner");
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [profileId, userId, validateFile, onSuccess]);

  const saveCropData = useCallback(async (cropData: BannerCropData, type: 'desktop' | 'mobile'): Promise<boolean> => {
    if (!profileId) return false;

    try {
      const updateData: Record<string, any> = {};
      if (type === 'desktop') {
        updateData.banner_crop_data = cropData;
      } else {
        updateData.banner_crop_data_mobile = cropData;
      }

      const { error } = await supabase
        .from('artist_profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      onSuccess?.();
      toast.success("Crop saved");
      return true;
    } catch (error: any) {
      console.error('Error saving crop data:', error);
      toast.error("Failed to save crop");
      return false;
    }
  }, [profileId, onSuccess]);

  const removeBanner = useCallback(async (type: 'desktop' | 'mobile'): Promise<boolean> => {
    if (!profileId) return false;

    try {
      const updateData: Record<string, any> = {};
      if (type === 'desktop') {
        updateData.banner_url = null;
        updateData.banner_media_type = null;
        updateData.banner_crop_data = null;
      } else {
        updateData.banner_url_mobile = null;
        updateData.banner_media_type_mobile = null;
        updateData.banner_crop_data_mobile = null;
      }

      const { error } = await supabase
        .from('artist_profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      onSuccess?.();
      toast.success(`${type === 'desktop' ? 'Desktop' : 'Mobile'} banner removed`);
      return true;
    } catch (error: any) {
      console.error('Error removing banner:', error);
      toast.error("Failed to remove banner");
      return false;
    }
  }, [profileId, onSuccess]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadBanner(file, type);
    }
    e.target.value = '';
  }, [uploadBanner]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'desktop' | 'mobile') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        uploadBanner(file, type);
      } else {
        toast.error("Please drop an image or video file");
      }
    }
  }, [uploadBanner]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  return {
    uploading,
    progress,
    dragActive,
    uploadBanner,
    saveCropData,
    removeBanner,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    validateFile,
  };
}
