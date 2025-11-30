import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { useSupportScore } from '@/hooks/useSupportScore';
import { useVideoPlayback } from './VideoPlaybackContext';

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

interface FlightdeckContextType {
  queue: FlightdeckItem[];
  currentItem: FlightdeckItem | null;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  // Actions
  playNow: (item: FlightdeckItem, context?: FlightdeckItem[]) => void;
  addToQueue: (item: FlightdeckItem) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setQueue: (items: FlightdeckItem[], startIndex?: number) => void;
  clearQueue: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

const FlightdeckContext = createContext<FlightdeckContextType | undefined>(undefined);

export function FlightdeckProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<FlightdeckItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { updateSupportScore } = useSupportScore();
  const lastPlayedRef = useRef<string | null>(null);
  const { pauseAllVideos } = useVideoPlayback();

  const currentItem = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Track plays for support score
  useEffect(() => {
    if (currentItem && isPlaying && currentItem.id !== lastPlayedRef.current) {
      lastPlayedRef.current = currentItem.id;
      // Update support score for play
      if (currentItem.artistId) {
        updateSupportScore(currentItem.artistId, 'play_track');
      }
    }
  }, [currentItem, isPlaying, updateSupportScore]);

  const playNow = useCallback((item: FlightdeckItem, context?: FlightdeckItem[]) => {
    // Pause all videos when Flightdeck starts playing
    pauseAllVideos();
    
    if (context && context.length > 0) {
      // Set entire queue from context
      const itemIndex = context.findIndex(i => i.id === item.id);
      setQueue(context);
      setCurrentIndex(itemIndex >= 0 ? itemIndex : 0);
    } else {
      // Play single item, clear queue
      setQueue([item]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, [pauseAllVideos]);

  const addToQueue = useCallback((item: FlightdeckItem) => {
    setQueue(prev => [...prev, item]);
  }, []);

  const playNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  }, [currentIndex, queue.length]);

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

  const setQueueFn = useCallback((items: FlightdeckItem[], startIndex: number = 0) => {
    setQueue(items);
    setCurrentIndex(startIndex);
    setIsPlaying(true);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, []);

  return (
    <FlightdeckContext.Provider
      value={{
        queue,
        currentItem,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        playNow,
        addToQueue,
        playNext,
        playPrev,
        togglePlay,
        seek,
        setQueue: setQueueFn,
        clearQueue,
        setIsPlaying,
        setCurrentTime,
        setDuration,
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
