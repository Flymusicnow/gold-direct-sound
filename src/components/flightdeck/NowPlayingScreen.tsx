import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  Heart, 
  ListPlus, 
  Share2, 
  AlignLeft,
  MoreHorizontal,
  Shuffle,
  Repeat,
  Repeat1,
  ExternalLink,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFlightdeck } from '@/contexts/FlightdeckContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AddToPlaylistDialog from '@/components/playlists/AddToPlaylistDialog';
import { ShareModal } from '@/components/ShareModal';
import { SyncedLyricsDisplay } from './SyncedLyricsDisplay';

interface NowPlayingScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NowPlayingScreen({ isOpen, onClose }: NowPlayingScreenProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentItem,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    playNext,
    playPrev,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
  } = useFlightdeck();

  const [lyrics, setLyrics] = useState<string | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeUpdating, setIsLikeUpdating] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Swipe gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    
    // Horizontal swipe (not vertical)
    if (Math.abs(deltaX) > 80 && deltaY < 80) {
      if (deltaX < 0) {
        playNext();
      } else {
        playPrev();
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  }, [playNext, playPrev]);

  // Fetch lyrics
  useEffect(() => {
    if (!currentItem) return;

    const fetchLyrics = async () => {
      const { data } = await supabase
        .from('tracks')
        .select('lyrics')
        .eq('id', currentItem.id)
        .maybeSingle();

      setLyrics(data?.lyrics || null);
    };

    fetchLyrics();
  }, [currentItem?.id]);

  // Fetch like status
  useEffect(() => {
    if (!currentItem || !user) {
      setIsLiked(false);
      return;
    }

    const checkLiked = async () => {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', currentItem.id)
        .maybeSingle();

      setIsLiked(!!data);
    };

    checkLiked();
  }, [currentItem?.id, user?.id]);

  const handleToggleLike = async () => {
    if (!user || !currentItem) {
      toast.error('Please sign in to like tracks');
      return;
    }

    if (isLikeUpdating) return;
    setIsLikeUpdating(true);

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', currentItem.id);
        setIsLiked(false);
        toast.success('Removed from liked tracks');
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, track_id: currentItem.id });
        setIsLiked(true);
        toast.success('Added to liked tracks');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLikeUpdating(false);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentItem) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-safe">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronDown className="h-6 w-6" />
            </Button>
            <span className="text-sm text-muted-foreground font-medium">Now Playing</span>
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative z-[110]">
                  <MoreHorizontal className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="z-[300] bg-card"
                sideOffset={8}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem onClick={() => {
                  onClose();
                  navigate(`/track/${currentItem.id}`);
                }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Track Page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  onClose();
                  navigate(`/artist/${currentItem.artistUserId}`);
                }}>
                  <User className="h-4 w-4 mr-2" />
                  Go to Artist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Album Art - Large (swipeable) */}
          <div 
            className="flex-1 flex items-center justify-center px-8 py-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div
              key={currentItem.id}
              className="w-full max-w-[320px] aspect-square relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <img
                src={currentItem.coverUrl || '/placeholder.svg'}
                alt={currentItem.title}
                className="w-full h-full rounded-2xl shadow-2xl object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              )}
            </motion.div>
          </div>

          {/* Track Info */}
          <div className="px-8 py-2">
            <h1 className="text-2xl font-bold truncate">{currentItem.title}</h1>
            <Link 
              to={`/artist/${currentItem.artistUserId}`} 
              onClick={onClose}
              className="text-lg text-muted-foreground hover:text-primary transition-colors"
            >
              {currentItem.artistName}
            </Link>
          </div>

          {/* Progress Slider */}
          <div className="px-8 py-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(v) => seek(v[0])}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-6 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShuffle}
              className={cn("h-10 w-10", shuffleEnabled && "text-primary")}
            >
              <Shuffle className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={playPrev} className="h-12 w-12">
              <SkipBack className="h-7 w-7" />
            </Button>
            
            <Button
              size="icon"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={playNext} className="h-12 w-12">
              <SkipForward className="h-7 w-7" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={cycleRepeat}
              className={cn("h-10 w-10", repeatMode !== 'off' && "text-primary")}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="h-5 w-5" />
              ) : (
                <Repeat className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-around py-6 pb-safe border-t border-border">
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={handleToggleLike}
              disabled={isLikeUpdating}
            >
              <Heart className={cn("h-6 w-6", isLiked && "fill-red-500 text-red-500")} />
              <span className="text-xs">Like</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => setShowPlaylistDialog(true)}
            >
              <ListPlus className="h-6 w-6" />
              <span className="text-xs">Add to Stack</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="h-6 w-6" />
              <span className="text-xs">Share</span>
            </Button>

            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2",
                showLyrics && "text-primary"
              )}
              onClick={() => setShowLyrics(!showLyrics)}
              disabled={!lyrics}
            >
              <AlignLeft className="h-6 w-6" />
              <span className="text-xs">Lyrics</span>
            </Button>
          </div>

          {/* Lyrics Panel (expandable) - Karaoke style synced display */}
          <AnimatePresence>
            {showLyrics && lyrics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="fixed inset-x-0 bottom-40 z-[110] bg-card/95 backdrop-blur-lg overflow-hidden border-t border-border"
              >
                <SyncedLyricsDisplay 
                  lyrics={lyrics} 
                  currentTime={currentTime}
                  className="h-64"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add to Playlist Dialog */}
          <AddToPlaylistDialog
            isOpen={showPlaylistDialog}
            onClose={() => setShowPlaylistDialog(false)}
            trackId={currentItem.id}
            trackTitle={currentItem.title}
          />

          {/* Share Modal - shares track URL */}
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            artistName={currentItem.artistName}
            shareUrl={`${window.location.origin}/track/${currentItem.id}`}
            artistId={currentItem.artistId}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
