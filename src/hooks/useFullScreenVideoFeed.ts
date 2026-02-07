import { useState, useCallback, useEffect } from "react";

export interface FeedVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  artistId: string;
  artistUserId: string;
  artistName: string;
  artistAvatar: string | null;
  isSupporterOnly?: boolean;
  requiredTier?: string | null;
}

interface FullScreenVideoFeedState {
  isOpen: boolean;
  videos: FeedVideo[];
  initialIndex: number;
}

export function useFullScreenVideoFeed() {
  const [state, setState] = useState<FullScreenVideoFeedState>({
    isOpen: false,
    videos: [],
    initialIndex: 0,
  });

  const openFeed = useCallback((videos: FeedVideo[], startIndex: number = 0) => {
    setState({ isOpen: true, videos, initialIndex: startIndex });
  }, []);

  const closeFeed = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Lock body scroll when feed is open
  useEffect(() => {
    if (state.isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [state.isOpen]);

  return {
    isOpen: state.isOpen,
    videos: state.videos,
    initialIndex: state.initialIndex,
    openFeed,
    closeFeed,
  };
}
