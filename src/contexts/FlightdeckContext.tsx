import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { useSupportScore } from '@/hooks/useSupportScore';
import { useVideoPlayback } from './VideoPlaybackContext';
import { supabase } from '@/integrations/supabase/client';

export interface FlightdeckItem {
  id: string;
  type: 'track' | 'video';
  title: string;
  artistId: string;
  artistName: string;
  artistUserId: string;
  artistAvatar?: string;
  coverUrl?: string;
  mediaUrl: string;
  duration?: number;
  description?: string;
  // Spotlight info if applicable
  spotlightEntryId?: string;
  spotlightCampaignId?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

interface FlightdeckContextType {
  queue: FlightdeckItem[];
  currentItem: FlightdeckItem | null;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  // Actions
  playNow: (item: FlightdeckItem, context?: FlightdeckItem[]) => void;
  addToQueue: (item: FlightdeckItem) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setQueue: (items: FlightdeckItem[], startIndex?: number) => void;
  reorderQueue: (items: FlightdeckItem[], newCurrentIndex: number) => void;
  clearQueue: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  removeFromQueue: (itemId: string) => void;
}

const FlightdeckContext = createContext<FlightdeckContextType | undefined>(undefined);

export function FlightdeckProvider({ children }: { children: ReactNode }) {
  const [queue, setQueueState] = useState<FlightdeckItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const { updateSupportScore } = useSupportScore();
  const lastPlayedRef = useRef<string | null>(null);
  const { pauseAllVideos } = useVideoPlayback();

  const currentItem = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Track plays for support score and increment play count
  useEffect(() => {
    if (currentItem && isPlaying && currentItem.id !== lastPlayedRef.current) {
      lastPlayedRef.current = currentItem.id;
      // Update support score for play
      if (currentItem.artistId) {
        updateSupportScore(currentItem.artistId, 'play_track');
      }
      // Increment play count for tracks using raw rpc call
      if (currentItem.type === 'track') {
        (supabase.rpc as any)('increment_play_count', { track_id: currentItem.id })
          .then(({ error }: { error: any }) => {
            if (error) console.error('Error incrementing play count:', error);
          });
      }
    }
  }, [currentItem, isPlaying, updateSupportScore]);

  const playNow = useCallback((item: FlightdeckItem, context?: FlightdeckItem[]) => {
    // Pause all videos when Flightdeck starts playing
    pauseAllVideos();
    
    if (context && context.length > 0) {
      // Set entire queue from context
      const itemIndex = context.findIndex(i => i.id === item.id);
      setQueueState(context);
      setCurrentIndex(itemIndex >= 0 ? itemIndex : 0);
    } else {
      // Play single item, clear queue
      setQueueState([item]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, [pauseAllVideos]);

  const addToQueue = useCallback((item: FlightdeckItem) => {
    setQueueState(prev => [...prev, item]);
  }, []);

  const playNext = useCallback(() => {
    if (repeatMode === 'one') {
      // Restart current track
      setCurrentTime(0);
      return;
    }
    
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
    } else if (repeatMode === 'all' && queue.length > 0) {
      // Loop back to start
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [currentIndex, queue.length, repeatMode]);

  const playPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      const newState = !prev;
      // If we're starting to play, pause all videos
      if (newState) {
        pauseAllVideos();
      }
      return newState;
    });
  }, [pauseAllVideos]);

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const setQueue = useCallback((items: FlightdeckItem[], startIndex: number = 0) => {
    setQueueState(items);
    setCurrentIndex(startIndex);
    setIsPlaying(true);
  }, []);

  // Reorder queue without affecting playback state
  const reorderQueue = useCallback((items: FlightdeckItem[], newCurrentIndex: number) => {
    setQueueState(items);
    setCurrentIndex(newCurrentIndex);
  }, []);

  const clearQueue = useCallback(() => {
    setQueueState([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled(prev => {
      const newState = !prev;
      if (newState && queue.length > 1) {
        // Shuffle remaining queue (keep current song in place)
        const before = queue.slice(0, currentIndex + 1);
        const remaining = queue.slice(currentIndex + 1);
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);
        setQueueState([...before, ...shuffled]);
      }
      return newState;
    });
  }, [queue, currentIndex]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  }, []);

  const removeFromQueue = useCallback((itemId: string) => {
    const index = queue.findIndex(item => item.id === itemId);
    if (index === -1) return;
    
    // Don't allow removing current playing item
    if (index === currentIndex) return;
    
    // Adjust current index if needed
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
    
    setQueueState(prev => prev.filter(item => item.id !== itemId));
  }, [queue, currentIndex]);

  return (
    <FlightdeckContext.Provider
      value={{
        queue,
        currentItem,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        shuffleEnabled,
        repeatMode,
        playNow,
        addToQueue,
        playNext,
        playPrev,
        togglePlay,
        seek,
        setQueue,
        reorderQueue,
        clearQueue,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        toggleShuffle,
        cycleRepeat,
        removeFromQueue,
      }}
    >
      {children}
    </FlightdeckContext.Provider>
  );
}

export function useFlightdeck() {
  const context = useContext(FlightdeckContext);
  if (!context) {
    throw new Error('useFlightdeck must be used within FlightdeckProvider');
  }
  return context;
}
