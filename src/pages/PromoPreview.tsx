import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePromoEvents } from '@/hooks/usePromoEvents';
import { useFollowArtist } from '@/hooks/useFollowArtist';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import { Loader2, Play, Pause, Heart, UserPlus, Crown, Sparkles, Music, ExternalLink, Instagram, Youtube } from 'lucide-react';
import { toast } from 'sonner';

interface PromoLink {
  id: string;
  artist_id: string;
  content_type: string;
  content_id: string | null;
  slug: string;
  utm_source: string | null;
  click_count: number | null;
}

interface ArtistData {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  bio: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
}

interface ContentData {
  id: string;
  title?: string;
  caption?: string;
  audio_url?: string;
  video_url?: string;
  cover_url?: string;
  thumbnail_url?: string;
}

export default function PromoPreview() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackPromoEvent, setPromoContext } = usePromoEvents();
  
  const [loading, setLoading] = useState(true);
  const [promoLink, setPromoLink] = useState<PromoLink | null>(null);
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerStats, setOwnerStats] = useState<{ views: number; follows: number; supporters: number; topUtm: string | null }>({ views: 0, follows: 0, supporters: 0, topUtm: null });
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [hasTrackedPreview50, setHasTrackedPreview50] = useState(false);
  
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const progressRef = useRef(0);

  const { isFollowing, isUpdating, toggleFollow } = useFollowArtist(artist?.id || '', false);

  useEffect(() => {
    const fetchPromoData = async () => {
      if (!slug) return;

      try {
        // Fetch promo link
        const { data: linkData, error: linkError } = await supabase
          .from('promo_links')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (linkError || !linkData) {
          toast.error('Promo link not found');
          navigate('/');
          return;
        }

        setPromoLink(linkData);
        setPromoContext(linkData);

        // Fetch artist
        const { data: artistData } = await supabase
          .from('artist_profiles')
          .select('*')
          .eq('id', linkData.artist_id)
          .single();

        if (artistData) {
          setArtist(artistData);
          // Check if current user is the owner
          if (user && artistData.user_id === user.id) {
            setIsOwner(true);
            // Fetch owner stats for this promo link
            const { data: events } = await supabase
              .from('promo_events')
              .select('event_type, utm_source')
              .eq('promo_id', linkData.id);
            
            if (events) {
              const views = events.filter(e => e.event_type === 'view').length;
              const follows = events.filter(e => e.event_type === 'follow_success').length;
              const supporters = events.filter(e => e.event_type === 'support_success').length;
              
              // Calculate top UTM
              const utmCounts = new Map<string, number>();
              events.forEach(e => {
                const source = e.utm_source || 'direct';
                utmCounts.set(source, (utmCounts.get(source) || 0) + 1);
              });
              let topUtm: string | null = null;
              let maxCount = 0;
              utmCounts.forEach((count, source) => {
                if (count > maxCount) {
                  maxCount = count;
                  topUtm = source;
                }
              });
              
              setOwnerStats({ views, follows, supporters, topUtm });
            }
          }
        }

        // Fetch content based on type
        if (linkData.content_id) {
          if (linkData.content_type === 'track') {
            const { data: trackData } = await supabase
              .from('tracks')
              .select('id, title, audio_url, cover_url')
              .eq('id', linkData.content_id)
              .single();
            setContent(trackData);
          } else if (linkData.content_type === 'video') {
            const { data: videoData } = await supabase
              .from('artist_video_posts')
              .select('id, caption, video_url, thumbnail_url')
              .eq('id', linkData.content_id)
              .single();
            if (videoData) {
              setContent({ ...videoData, title: videoData.caption || 'Video' });
            }
          }
        }

        // Track view event
        if (!hasTrackedView) {
          await trackPromoEvent(linkData.id, linkData.artist_id, 'view', user?.id, linkData.utm_source || undefined);
          setHasTrackedView(true);
        }
      } catch (error) {
        console.error('Error fetching promo data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoData();
  }, [slug, user, navigate]);

  const handlePlayPause = () => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = async () => {
    if (!mediaRef.current || !promoLink) return;
    
    const progress = (mediaRef.current.currentTime / mediaRef.current.duration) * 100;
    progressRef.current = progress;

    // Track 50% preview
    if (progress >= 50 && !hasTrackedPreview50) {
      setHasTrackedPreview50(true);
      await trackPromoEvent(promoLink.id, promoLink.artist_id, 'preview_50', user?.id, promoLink.utm_source || undefined);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      // Store intent and redirect to auth
      navigate('/auth?redirect=' + encodeURIComponent(`/link/${slug}`));
      return;
    }

    if (promoLink && artist) {
      await trackPromoEvent(promoLink.id, artist.id, 'follow_click', user.id, promoLink.utm_source || undefined);
      await toggleFollow();
      if (!isFollowing) {
        await trackPromoEvent(promoLink.id, artist.id, 'follow_success', user.id, promoLink.utm_source || undefined);
      }
    }
  };

  const handleListenFull = () => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(`/link/${slug}`));
      return;
    }
    
    if (promoLink?.content_type === 'profile' || !promoLink?.content_id) {
      navigate(`/artist/${artist?.user_id}`);
    } else {
      navigate(`/artist/${artist?.user_id}`);
    }
  };

  const handleExternalLink = async (platform: string, url: string) => {
    if (promoLink && artist) {
      await trackPromoEvent(promoLink.id, artist.id, 'external_link', user?.id, platform);
    }
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!promoLink || !artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Promo link not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <FlyMusicLogo size="md" />
      </header>

      {/* Owner Banner */}
      {isOwner && (
        <div className="bg-primary/20 border-y border-primary/30 px-4 py-4">
          <p className="text-sm font-medium text-center mb-3">
            This is your promo link — here's how it performs:
          </p>
          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-primary">{ownerStats.views}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{ownerStats.follows}</p>
              <p className="text-xs text-muted-foreground">Follows</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{ownerStats.supporters}</p>
              <p className="text-xs text-muted-foreground">Supporters</p>
            </div>
            {ownerStats.topUtm && (
              <div>
                <p className="text-xl font-bold text-primary capitalize">{ownerStats.topUtm}</p>
                <p className="text-xs text-muted-foreground">Top Source</p>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 py-8">
        {/* Artist Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl" />
            <Avatar className="h-24 w-24 ring-4 ring-primary relative">
              <AvatarImage src={artist.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-2xl">
                {artist.artist_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-2xl font-bold mb-1">{artist.artist_name}</h1>
          {artist.genre && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              {artist.genre}
            </Badge>
          )}
        </div>

        {/* Content Preview */}
        {content && (
          <Card className="mb-6 border-primary/20 overflow-hidden">
            <CardContent className="p-0">
              {promoLink.content_type === 'video' && content.video_url ? (
                <div className="relative aspect-video bg-black">
                  <video
                    ref={(el) => mediaRef.current = el}
                    src={content.video_url}
                    poster={content.thumbnail_url || undefined}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    playsInline
                  />
                  <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="h-16 w-16 text-white" />
                    ) : (
                      <Play className="h-16 w-16 text-white fill-white" />
                    )}
                  </button>
                </div>
              ) : promoLink.content_type === 'track' && content.audio_url ? (
                <div className="relative">
                  {content.cover_url && (
                    <img
                      src={content.cover_url}
                      alt={content.title}
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <button
                      onClick={handlePlayPause}
                      className="p-4 rounded-full bg-primary hover:bg-primary/90 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8 text-primary-foreground" />
                      ) : (
                        <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
                      )}
                    </button>
                  </div>
                  <audio
                    ref={(el) => mediaRef.current = el}
                    src={content.audio_url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              ) : null}
              {content.title && (
                <div className="p-4">
                  <p className="font-semibold">{content.title}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CTAs */}
        <div className="space-y-3 mb-8">
          <Button
            onClick={handleFollow}
            disabled={isUpdating}
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : isFollowing ? (
              <Heart className="h-5 w-5 mr-2 fill-current" />
            ) : (
              <UserPlus className="h-5 w-5 mr-2" />
            )}
            {isFollowing ? 'Following' : 'Follow on FlyMusic'}
          </Button>

          <Button
            variant="outline"
            onClick={handleListenFull}
            className="w-full h-12 text-lg border-primary/50 hover:bg-primary/10"
          >
            <Music className="h-5 w-5 mr-2" />
            {content ? 'Listen Full on FlyMusic' : 'View Artist Profile'}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              if (!user) {
                navigate('/auth?redirect=' + encodeURIComponent(`/link/${slug}`));
                return;
              }
              navigate(`/artist/${artist.user_id}?tab=supporter`);
            }}
            className="w-full h-12 text-lg border-primary/50 hover:bg-primary/10"
          >
            <Crown className="h-5 w-5 mr-2" />
            Become a Supporter
          </Button>
        </div>

        {/* External Links */}
        {(artist.instagram_url || artist.youtube_url || artist.tiktok_url) && (
          <div className="border-t border-border/50 pt-6">
            <p className="text-sm text-muted-foreground text-center mb-4">Also find {artist.artist_name} on:</p>
            <div className="flex justify-center gap-4">
              {artist.instagram_url && (
                <button
                  onClick={() => handleExternalLink('instagram', artist.instagram_url!)}
                  className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </button>
              )}
              {artist.youtube_url && (
                <button
                  onClick={() => handleExternalLink('youtube', artist.youtube_url!)}
                  className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </button>
              )}
              {artist.tiktok_url && (
                <button
                  onClick={() => handleExternalLink('tiktok', artist.tiktok_url!)}
                  className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Music className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="text-primary font-semibold">FlyMusic Gold</span>
          </p>
        </div>
      </main>
    </div>
  );
}
