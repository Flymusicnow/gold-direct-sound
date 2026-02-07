import { useEffect, useCallback, useRef } from 'react';

interface UseMediaSessionOptions {
  title?: string;
  artist?: string;
  coverUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  enabled: boolean;
}

/**
 * Integrates with the Media Session API for lock screen / notification
 * music controls on iOS, Android, and desktop OS widgets.
 */
export function useMediaSession({
  title,
  artist,
  coverUrl,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onSeek,
  enabled,
}: UseMediaSessionOptions) {
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onSeekRef = useRef(onSeek);

  // Keep refs updated
  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
    onSeekRef.current = onSeek;
  }, [onPlay, onPause, onNext, onPrev, onSeek]);

  // Set metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !enabled || !title) return;

    const artwork: MediaImage[] = [];
    if (coverUrl) {
      artwork.push(
        { src: coverUrl, sizes: '96x96', type: 'image/png' },
        { src: coverUrl, sizes: '128x128', type: 'image/png' },
        { src: coverUrl, sizes: '192x192', type: 'image/png' },
        { src: coverUrl, sizes: '256x256', type: 'image/png' },
        { src: coverUrl, sizes: '384x384', type: 'image/png' },
        { src: coverUrl, sizes: '512x512', type: 'image/png' },
      );
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: artist || '',
      album: '',
      artwork,
    });
  }, [title, artist, coverUrl, enabled]);

  // Set action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator) || !enabled) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => onPlayRef.current()],
      ['pause', () => onPauseRef.current()],
      ['previoustrack', () => onPrevRef.current()],
      ['nexttrack', () => onNextRef.current()],
      ['seekto', (details) => {
        if (details && 'seekTime' in details && details.seekTime != null) {
          onSeekRef.current(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        const skipTime = details && 'seekOffset' in details && details.seekOffset ? details.seekOffset : 10;
        onSeekRef.current(Math.max(0, currentTime - skipTime));
      }],
      ['seekforward', (details) => {
        const skipTime = details && 'seekOffset' in details && details.seekOffset ? details.seekOffset : 10;
        onSeekRef.current(Math.min(duration, currentTime + skipTime));
      }],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions may not be supported on all browsers
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore
        }
      }
    };
  }, [enabled, currentTime, duration]);

  // Sync playback state
  useEffect(() => {
    if (!('mediaSession' in navigator) || !enabled) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying, enabled]);

  // Update position state
  useEffect(() => {
    if (!('mediaSession' in navigator) || !enabled || !duration || !isFinite(duration)) return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch {
      // Ignore errors from invalid position state
    }
  }, [currentTime, duration, enabled]);
}
