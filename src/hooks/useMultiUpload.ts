import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeFileName } from '@/lib/utils';

// File constraints
export const SONG_FORMATS = ['.mp3', '.wav', '.flac', '.m4a'];
export const VIDEO_FORMATS = ['.mp4', '.mov', '.avi', '.webm'];
export const MAX_SONG_SIZE = 50 * 1024 * 1024; // 50 MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
export const MAX_SONGS_PER_SESSION = 20;
export const MAX_VIDEOS_PER_SESSION = 10;
export const MAX_SESSION_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
export const BATCH_SIZE = 3;

export interface UploadFile {
  id: string;
  file: File;
  type: 'song' | 'video';
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultUrl?: string;
  thumbnailUrl?: string;
  // Metadata
  title: string;
  visibility: 'draft' | 'public' | 'supporter-only';
  genre?: string;
  mood?: string;
  tags?: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  type?: 'song' | 'video';
}

export interface UploadProgress {
  completed: number;
  failed: number;
  total: number;
  percentage: number;
}

export interface UseMultiUploadReturn {
  files: UploadFile[];
  addFiles: (files: File[]) => ValidationResult[];
  removeFile: (id: string) => void;
  updateFileMetadata: (id: string, metadata: Partial<UploadFile>) => void;
  updateAllMetadata: (metadata: Partial<UploadFile>) => void;
  updateSelectedMetadata: (ids: string[], metadata: Partial<UploadFile>) => void;
  startUpload: (artistId: string, userId: string, albumCoverUrl?: string | null, albumId?: string | null) => Promise<void>;
  retryFailed: (artistId: string, userId: string, albumId?: string | null) => Promise<void>;
  pauseUpload: () => void;
  resumeUpload: () => void;
  resetUpload: () => void;
  isPaused: boolean;
  isUploading: boolean;
  isComplete: boolean;
  progress: UploadProgress;
  batchId: string | null;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const getFileExtension = (filename: string): string => {
  return '.' + (filename.split('.').pop()?.toLowerCase() || '');
};

const validateFile = (file: File, existingFiles: UploadFile[]): ValidationResult => {
  const ext = getFileExtension(file.name);
  const isSong = SONG_FORMATS.includes(ext);
  const isVideo = VIDEO_FORMATS.includes(ext);

  if (!isSong && !isVideo) {
    return { valid: false, error: `Unsupported format: ${ext}` };
  }

  if (isSong && file.size > MAX_SONG_SIZE) {
    return { valid: false, error: `File exceeds 50 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)` };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: `File exceeds 500 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)` };
  }

  // Check session limits
  const songCount = existingFiles.filter(f => f.type === 'song').length;
  const videoCount = existingFiles.filter(f => f.type === 'video').length;

  if (isSong && songCount >= MAX_SONGS_PER_SESSION) {
    return { valid: false, error: `Maximum ${MAX_SONGS_PER_SESSION} songs per session` };
  }

  if (isVideo && videoCount >= MAX_VIDEOS_PER_SESSION) {
    return { valid: false, error: `Maximum ${MAX_VIDEOS_PER_SESSION} videos per session` };
  }

  // Check total session size
  const currentSize = existingFiles.reduce((sum, f) => sum + f.file.size, 0);
  if (currentSize + file.size > MAX_SESSION_SIZE) {
    return { valid: false, error: 'Total upload size exceeds 2 GB limit' };
  }

  return { valid: true, type: isSong ? 'song' : 'video' };
};

export function useMultiUpload(): UseMultiUploadReturn {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const pausedRef = useRef(false);

  const addFiles = useCallback((newFiles: File[]): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const validFiles: UploadFile[] = [];

    let currentFiles = [...files];

    for (const file of newFiles) {
      const validation = validateFile(file, currentFiles);
      results.push(validation);

      if (validation.valid && validation.type) {
        const uploadFile: UploadFile = {
          id: generateId(),
          file,
          type: validation.type,
          status: 'pending',
          progress: 0,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          visibility: 'draft',
        };
        validFiles.push(uploadFile);
        currentFiles.push(uploadFile);
      }
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }

    return results;
  }, [files]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFileMetadata = useCallback((id: string, metadata: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...metadata } : f));
  }, []);

  const updateAllMetadata = useCallback((metadata: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => ({ ...f, ...metadata })));
  }, []);

  const updateSelectedMetadata = useCallback((ids: string[], metadata: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => ids.includes(f.id) ? { ...f, ...metadata } : f));
  }, []);

  const uploadSingleFile = async (
    uploadFile: UploadFile,
    artistId: string,
    userId: string,
    uploadBatchId: string,
    albumCoverUrl?: string | null,
    albumId?: string | null,
    trackOrder?: number
  ): Promise<boolean> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      const timestamp = Date.now();
      const fileName = `${timestamp}_${sanitizeFileName(uploadFile.file.name)}`;
      
      if (uploadFile.type === 'song') {
        // Upload song
        const audioPath = `${userId}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('tracks')
          .upload(audioPath, uploadFile.file);

        if (uploadError) throw uploadError;

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 60 } : f
        ));

        const { data: { publicUrl } } = supabase.storage
          .from('tracks')
          .getPublicUrl(audioPath);

        // Insert track record with album cover and album_id
        const { error: insertError } = await supabase.from('tracks').insert({
          artist_id: artistId,
          title: uploadFile.title,
          audio_url: publicUrl,
          cover_url: albumCoverUrl || null,
          visibility: uploadFile.visibility,
          mood: uploadFile.mood || null,
          tags: uploadFile.tags || null,
          upload_batch_id: uploadBatchId,
          album_id: albumId || null,
          track_order: trackOrder ?? 0,
        });

        if (insertError) throw insertError;

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100, resultUrl: publicUrl } : f
        ));

      } else {
        // Upload video
        const videoPath = `${artistId}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('artist_videos')
          .upload(videoPath, uploadFile.file);

        if (uploadError) throw uploadError;

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 60 } : f
        ));

        const { data: { publicUrl } } = supabase.storage
          .from('artist_videos')
          .getPublicUrl(videoPath);

        // Insert video record
        const { error: insertError } = await supabase.from('artist_video_posts').insert({
          artist_id: artistId,
          video_url: publicUrl,
          caption: uploadFile.title,
          is_supporter_only: uploadFile.visibility === 'supporter-only',
          mood: uploadFile.mood || null,
          tags: uploadFile.tags || null,
          upload_batch_id: uploadBatchId,
        });

        if (insertError) throw insertError;

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100, resultUrl: publicUrl } : f
        ));
      }

      return true;
    } catch (error: any) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'failed', progress: 0, error: error.message || 'Upload failed' } : f
      ));
      return false;
    }
  };

  const startUpload = useCallback(async (artistId: string, userId: string, albumCoverUrl?: string | null, albumId?: string | null) => {
    if (files.length === 0) return;

    setIsUploading(true);
    pausedRef.current = false;
    
    // Create upload session
    const newBatchId = crypto.randomUUID();
    setBatchId(newBatchId);

    const { error: sessionError } = await supabase.from('upload_sessions').insert({
      artist_id: artistId,
      user_id: userId,
      total_files: files.length,
      status: 'in_progress',
      file_type: files.every(f => f.type === 'song') ? 'songs' : 
                 files.every(f => f.type === 'video') ? 'videos' : 'mixed'
    });

    if (sessionError) {
      console.error('Failed to create upload session:', sessionError);
    }

    const pendingFiles = files.filter(f => f.status === 'pending');
    
    // Process in batches of 3, with track order based on original array index
    for (let i = 0; i < pendingFiles.length; i += BATCH_SIZE) {
      if (pausedRef.current) break;

      const batch = pendingFiles.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((file, batchIndex) => {
          const overallIndex = i + batchIndex;
          return uploadSingleFile(file, artistId, userId, newBatchId, albumCoverUrl, albumId, overallIndex);
        })
      );
    }

    // Update session status
    const completedCount = files.filter(f => f.status === 'completed').length;
    const failedCount = files.filter(f => f.status === 'failed').length;

    await supabase.from('upload_sessions').update({
      completed_files: completedCount,
      failed_files: failedCount,
      status: failedCount === 0 ? 'completed' : 
              completedCount === 0 ? 'failed' : 'partial_failure'
    }).eq('artist_id', artistId).eq('status', 'in_progress');

    setIsUploading(false);
  }, [files]);

  const retryFailed = useCallback(async (artistId: string, userId: string, albumId?: string | null) => {
    const failedFiles = files.filter(f => f.status === 'failed');
    if (failedFiles.length === 0) return;

    // Reset failed files to pending
    setFiles(prev => prev.map(f => 
      f.status === 'failed' ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));

    setIsUploading(true);
    pausedRef.current = false;

    const currentBatchId = batchId || crypto.randomUUID();

    for (let i = 0; i < failedFiles.length; i += BATCH_SIZE) {
      if (pausedRef.current) break;

      const batch = failedFiles.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(file => uploadSingleFile({ ...file, status: 'pending' }, artistId, userId, currentBatchId))
      );
    }

    setIsUploading(false);
  }, [files, batchId]);

  const pauseUpload = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resumeUpload = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
  }, []);

  const resetUpload = useCallback(() => {
    setFiles([]);
    setIsPaused(false);
    setIsUploading(false);
    setBatchId(null);
  }, []);

  const progress: UploadProgress = {
    completed: files.filter(f => f.status === 'completed').length,
    failed: files.filter(f => f.status === 'failed').length,
    total: files.length,
    percentage: files.length > 0 
      ? Math.round((files.filter(f => f.status === 'completed').length / files.length) * 100)
      : 0
  };

  const isComplete = files.length > 0 && 
    files.every(f => f.status === 'completed' || f.status === 'failed');

  return {
    files,
    addFiles,
    removeFile,
    updateFileMetadata,
    updateAllMetadata,
    updateSelectedMetadata,
    startUpload,
    retryFailed,
    pauseUpload,
    resumeUpload,
    resetUpload,
    isPaused,
    isUploading,
    isComplete,
    progress,
    batchId
  };
}