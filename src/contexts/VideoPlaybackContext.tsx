import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface VideoPlaybackContextType {
  currentVideoId: string | null;
  registerVideo: (id: string, pauseFn: () => void) => void;
  unregisterVideo: (id: string) => void;
  setCurrentVideo: (id: string | null) => void;
  pauseAllVideos: () => void;
  pauseVideoById: (id: string) => void;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextType | undefined>(undefined);

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [videoRefs] = useState<Map<string, () => void>>(new Map());

  const registerVideo = useCallback((id: string, pauseFn: () => void) => {
    videoRefs.set(id, pauseFn);
  }, [videoRefs]);

  const unregisterVideo = useCallback((id: string) => {
    videoRefs.delete(id);
  }, [videoRefs]);

  const pauseAllVideos = useCallback(() => {
    videoRefs.forEach((pauseFn) => pauseFn());
    setCurrentVideoId(null);
  }, [videoRefs]);

  const pauseVideoById = useCallback((id: string) => {
    const pauseFn = videoRefs.get(id);
    if (pauseFn) {
      pauseFn();
    }
    if (currentVideoId === id) {
      setCurrentVideoId(null);
    }
  }, [videoRefs, currentVideoId]);

  const setCurrentVideo = useCallback((id: string | null) => {
    // Pause all other videos before setting current (mutual exclusion)
    if (id !== null) {
      videoRefs.forEach((pauseFn, videoId) => {
        if (videoId !== id) {
          pauseFn();
        }
      });
    }
    setCurrentVideoId(id);
  }, [videoRefs]);

  return (
    <VideoPlaybackContext.Provider
      value={{
        currentVideoId,
        registerVideo,
        unregisterVideo,
        setCurrentVideo,
        pauseAllVideos,
        pauseVideoById,
      }}
    >
      {children}
    </VideoPlaybackContext.Provider>
  );
}

export function useVideoPlayback() {
  const context = useContext(VideoPlaybackContext);
  if (context === undefined) {
    throw new Error('useVideoPlayback must be used within a VideoPlaybackProvider');
  }
  return context;
}
