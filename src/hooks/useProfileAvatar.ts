import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProfileType = 'artist' | 'fan';

interface UseProfileAvatarOptions {
  profileType: ProfileType;
  profileId?: string;
  userId: string;
  onSuccess?: (url: string) => void;
}

interface FileValidation {
  valid: boolean;
  error?: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface UseProfileAvatarReturn {
  uploading: boolean;
  progress: number;
  dragActive: boolean;
  uploadAvatar: (file: File) => Promise<UploadResult>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  validateFile: (file: File) => FileValidation;
}

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Unified avatar upload hook for both artist and fan profiles.
 * Provides upload progress, file validation, and drag-and-drop support.
 */
export function useProfileAvatar({
  profileType,
  profileId,
  userId,
  onSuccess,
}: UseProfileAvatarOptions): UseProfileAvatarReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((file: File): FileValidation => {
    if (!VALID_TYPES.includes(file.type)) {
      return { valid: false, error: 'Please select a valid image (JPEG, PNG, or WebP)' };
    }

    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'Image must be less than 10MB' };
    }

    return { valid: true };
  }, []);

  const getFileExtension = (file: File): string => {
    const parts = file.name.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'jpg';
  };

  const uploadAvatar = useCallback(async (file: File): Promise<UploadResult> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return { success: false, error: validation.error };
    }

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress stages for better UX
      setProgress(10);

      const avatarPath = `${userId}/${Date.now()}_avatar.${getFileExtension(file)}`;
      
      setProgress(20);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, file);

      if (uploadError) throw uploadError;

      setProgress(60);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarPath);

      setProgress(80);

      // Update the correct profile table based on profileType
      if (profileType === 'artist' && profileId) {
        const { error: updateError } = await supabase
          .from('artist_profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profileId);

        if (updateError) throw updateError;
      } else if (profileType === 'fan') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl } as any)
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      setProgress(100);
      
      onSuccess?.(publicUrl);
      toast.success("Profile picture updated");

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || "Failed to upload profile picture");
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
      // Reset progress after a short delay for animation
      setTimeout(() => setProgress(0), 500);
    }
  }, [profileType, profileId, userId, validateFile, onSuccess]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [uploadAvatar]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      uploadAvatar(files[0]);
    } else {
      toast.error("Please drop an image file");
    }
  }, [uploadAvatar]);

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
    uploadAvatar,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    validateFile,
  };
}
