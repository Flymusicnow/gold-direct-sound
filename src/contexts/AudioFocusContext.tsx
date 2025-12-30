import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { useFlightdeck } from './FlightdeckContext';
import { useVideoPlayback } from './VideoPlaybackContext';

interface AudioFocusContextType {
  // State
  activeVideoId: string | null;
  musicWasPlayingBeforeVideo: boolean;
  pauseMusicOnVideo: boolean;
  pipEnabled: boolean;
  
  // Video calls these
  onVideoPlay: (videoId: string) => void;
  onVideoPauseOrEnd: (videoId: string) => void;
  
  // Music player calls this
  onMusicPlay: () => void;
  
  // Settings
  setPauseMusicOnVideo: (enabled: boolean) => void;
  setPipEnabled: (enabled: boolean) => void;
}

const AudioFocusContext = createContext<AudioFocusContextType | undefined>(undefined);

export function AudioFocusProvider({ children }: { children: ReactNode }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [musicWasPlayingBeforeVideo, setMusicWasPlayingBeforeVideo] = useState(false);
  const [pauseMusicOnVideo, setPauseMusicOnVideo] = useState(true);
  const [pipEnabled, setPipEnabled] = useState(true);
  
  const { isPlaying: isMusicPlaying, setIsPlaying: setMusicPlaying } = useFlightdeck();
  const { pauseAllVideos, pauseVideoById } = useVideoPlayback();
  
  // Use refs to avoid stale closures
  const activeVideoIdRef = useRef<string | null>(null);
  activeVideoIdRef.current = activeVideoId;
  
  const musicWasPlayingRef = useRef(false);
  musicWasPlayingRef.current = musicWasPlayingBeforeVideo;

  /**
   * Called when a video starts playing
   * - Stores whether music was playing
   * - Pauses music if setting is enabled
   * - Pauses all other videos
   * - Sets this video as active
   */
  const onVideoPlay = useCallback((videoId: string) => {
    console.log('[AudioFocus] onVideoPlay:', videoId, { pauseMusicOnVideo, isMusicPlaying });
    
    // Pause all other videos first
    pauseAllVideos();
    
    if (pauseMusicOnVideo) {
      // Store music state BEFORE pausing
      setMusicWasPlayingBeforeVideo(isMusicPlaying);
      musicWasPlayingRef.current = isMusicPlaying;
      
      // Pause music
      if (isMusicPlaying) {
        setMusicPlaying(false);
      }
    }
    
    setActiveVideoId(videoId);
    activeVideoIdRef.current = videoId;
  }, [pauseMusicOnVideo, isMusicPlaying, pauseAllVideos, setMusicPlaying]);

  /**
   * Called when a video pauses or ends
   * - If this was the active video, resume music if it was playing before
   * - Reset state
   */
  const onVideoPauseOrEnd = useCallback((videoId: string) => {
    console.log('[AudioFocus] onVideoPauseOrEnd:', videoId, { 
      activeVideoId: activeVideoIdRef.current, 
      musicWasPlayingBeforeVideo: musicWasPlayingRef.current 
    });
    
    // Only handle if this is the currently active video
    if (activeVideoIdRef.current !== videoId) {
      return;
    }
    
    setActiveVideoId(null);
    activeVideoIdRef.current = null;
    
    // Resume music if it was playing before AND pause setting is enabled
    if (pauseMusicOnVideo && musicWasPlayingRef.current) {
      console.log('[AudioFocus] Resuming music');
      setMusicPlaying(true);
    }
    
    setMusicWasPlayingBeforeVideo(false);
    musicWasPlayingRef.current = false;
  }, [pauseMusicOnVideo, setMusicPlaying]);

  /**
   * Called when music starts playing
   * - Pauses any active video
   * - Clears active video state
   * - Also closes any video session (mini player)
   */
  const onMusicPlay = useCallback(() => {
    console.log('[AudioFocus] onMusicPlay, activeVideoId:', activeVideoIdRef.current);
    
    if (activeVideoIdRef.current) {
      // Pause the active video
      pauseVideoById(activeVideoIdRef.current);
      setActiveVideoId(null);
      activeVideoIdRef.current = null;
      setMusicWasPlayingBeforeVideo(false);
      musicWasPlayingRef.current = false;
    }
    
    // Also close any video session (import dynamically to avoid circular deps)
    import('./VideoSessionContext').then(({ videoSessionRef }) => {
      if (videoSessionRef.closeVideo) {
        videoSessionRef.closeVideo();
      }
    }).catch(() => {
      // VideoSessionContext might not be loaded yet
    });
  }, [pauseVideoById]);

  return (
    <AudioFocusContext.Provider
      value={{
        activeVideoId,
        musicWasPlayingBeforeVideo,
        pauseMusicOnVideo,
        pipEnabled,
        onVideoPlay,
        onVideoPauseOrEnd,
        onMusicPlay,
        setPauseMusicOnVideo,
        setPipEnabled,
      }}
    >
      {children}
    </AudioFocusContext.Provider>
  );
}

export function useAudioFocus() {
  const context = useContext(AudioFocusContext);
  if (context === undefined) {
    throw new Error('useAudioFocus must be used within an AudioFocusProvider');
  }
  return context;
}
