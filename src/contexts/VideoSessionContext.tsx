import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

export interface VideoSession {
  videoId: string;
  srcUrl: string;
  title?: string;
  artistId?: string;
  artistName?: string;
  posterUrl?: string;
  currentTime: number;
  isPlaying: boolean;
}

interface VideoSessionContextType {
  activeSession: VideoSession | null;
  isMiniPlayerOpen: boolean;
  isModalOpen: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  
  startVideo: (payload: Omit<VideoSession, 'currentTime' | 'isPlaying'>) => void;
  pauseVideo: () => void;
  resumeVideo: () => void;
  closeVideo: () => void;
  syncTime: (time: number) => void;
  expandToModal: () => void;
  minimizeToMini: () => void;
}

const VideoSessionContext = createContext<VideoSessionContextType | undefined>(undefined);

// Export a ref getter for AudioFocusContext to use without circular deps
export const videoSessionRef = {
  closeVideo: null as (() => void) | null,
};

export function VideoSessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<VideoSession | null>(null);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeSessionRef = useRef<VideoSession | null>(null);
  
  // Keep ref in sync
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  /**
   * Close the video session completely
   */
  const closeVideo = useCallback(() => {
    console.log('[VideoSession] Closing video');
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    setActiveSession(null);
    setIsMiniPlayerOpen(false);
    setIsModalOpen(false);
  }, []);

  // Register closeVideo with the exported ref for AudioFocusContext
  useEffect(() => {
    videoSessionRef.closeVideo = closeVideo;
    return () => {
      videoSessionRef.closeVideo = null;
    };
  }, [closeVideo]);

  /**
   * Start a new video session
   * - Closes any existing session
   * - Opens mini player
   * - Pauses music via AudioFocus (handled by caller)
   */
  const startVideo = useCallback((payload: Omit<VideoSession, 'currentTime' | 'isPlaying'>) => {
    console.log('[VideoSession] Starting video:', payload.videoId);
    
    // Create new session
    const newSession: VideoSession = {
      ...payload,
      currentTime: 0,
      isPlaying: true,
    };
    
    setActiveSession(newSession);
    setIsMiniPlayerOpen(true);
    setIsModalOpen(false);
  }, []);

  /**
   * Pause the current video
   */
  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setActiveSession(prev => prev ? { ...prev, isPlaying: false } : null);
  }, []);

  /**
   * Resume the current video
   */
  const resumeVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
    setActiveSession(prev => prev ? { ...prev, isPlaying: true } : null);
  }, []);

  /**
   * Sync current playback time
   */
  const syncTime = useCallback((time: number) => {
    setActiveSession(prev => prev ? { ...prev, currentTime: time } : null);
  }, []);

  /**
   * Expand from mini player to modal
   */
  const expandToModal = useCallback(() => {
    setIsModalOpen(true);
    setIsMiniPlayerOpen(false);
  }, []);

  /**
   * Minimize from modal to mini player
   */
  const minimizeToMini = useCallback(() => {
    setIsModalOpen(false);
    setIsMiniPlayerOpen(true);
  }, []);

  return (
    <VideoSessionContext.Provider
      value={{
        activeSession,
        isMiniPlayerOpen,
        isModalOpen,
        videoRef,
        startVideo,
        pauseVideo,
        resumeVideo,
        closeVideo,
        syncTime,
        expandToModal,
        minimizeToMini,
      }}
    >
      {children}
    </VideoSessionContext.Provider>
  );
}

export function useVideoSession() {
  const context = useContext(VideoSessionContext);
  if (context === undefined) {
    throw new Error('useVideoSession must be used within a VideoSessionProvider');
  }
  return context;
}
