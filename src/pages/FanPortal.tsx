import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, MessageSquare, Music, Settings, ArrowRight, TrendingUp, Sparkles, UserMinus } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { AudioPlayer } from "@/components/AudioPlayer";
import { DiscoverArtists } from "@/components/DiscoverArtists";
import { TrendingSection } from "@/components/TrendingSection";
import SpotlightPromoCard from "@/components/spotlight/SpotlightPromoCard";
import SpotlightSupporterBadge from "@/components/spotlight/SpotlightSupporterBadge";
import { toast } from "sonner";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
}

interface LikedTrack {
  track_id: string;
  tracks: {
    id: string;
    title: string;
    cover_url: string | null;
    audio_url: string;
    artist_profiles: {
      artist_name: string;
      avatar_url: string | null;
    };
  };
}

interface Activity {
  type: 'like' | 'comment' | 'follow';
  timestamp: string;
  details: string;
}

export default function FanPortal() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [likedTracks, setLikedTracks] = useState<LikedTrack[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<{ url: string; title: string; artist: string } | null>(null);
  const [supporterStats, setSupporterStats] = useState<{ tier: string; totalVotes: number } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch followed artists
      const { data: follows } = await supabase
        .from('follows')
        .select(`
          artist_id,
          created_at,
          artist_profiles (
            id,
            user_id,
            artist_name,
            avatar_url,
            genre
          )
        `)
        .eq('fan_id', user.id)
        .order('created_at', { ascending: false });

      if (follows) {
        const artists = follows.map((f: any) => f.artist_profiles).filter(Boolean);
        setFollowedArtists(artists);
      }

      // Fetch liked tracks
      const { data: likes } = await supabase
        .from('likes')
        .select(`
          track_id,
          created_at,
          tracks (
            id,
            title,
            cover_url,
            audio_url,
            artist_profiles (
              artist_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (likes) {
        setLikedTracks(likes as any);
      }

      // Fetch comments count
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setCommentsCount(count || 0);

      // Fetch recent comments
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          created_at,
          text,
          artist_profiles (
            artist_name,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Build activity feed
      const recentActivities: Activity[] = [];
      
      if (likes) {
        likes.slice(0, 3).forEach((like: any) => {
          recentActivities.push({
            type: 'like',
            timestamp: like.created_at,
            details: `Liked "${like.tracks.title}"`
          });
        });
      }

      if (follows) {
        follows.slice(0, 2).forEach((follow: any) => {
          recentActivities.push({
            type: 'follow',
            timestamp: follow.created_at,
            details: `Started following ${follow.artist_profiles.artist_name}`
          });
        });
      }

      if (comments) {
        comments.forEach((comment: any) => {
          recentActivities.push({
            type: 'comment',
            timestamp: comment.created_at,
            details: `Commented on ${comment.artist_profiles.artist_name}'s profile`
          });
        });
      }

      recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(recentActivities.slice(0, 5));

      // Fetch supporter stats
      const { data: statsData } = await supabase
        .from('fan_spotlight_stats')
        .select('total_votes, current_tier')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setSupporterStats({
          tier: statsData.current_tier,
          totalVotes: statsData.total_votes,
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (artistId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('follows')
        .delete()
        .eq('fan_id', user.id)
        .eq('artist_id', artistId);

      setFollowedArtists(prev => prev.filter(a => a.id !== artistId));
      toast.success("Unfollowed artist");
    } catch (error) {
      console.error('Error unfollowing artist:', error);
      toast.error("Failed to unfollow");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Hi, {profile?.full_name || 'Fan'}!
          </h1>
          <p className="text-muted-foreground">Welcome to your FlyMusic Gold dashboard</p>
        </div>

          {/* Spotlight Supporter Badge */}
          {supporterStats && supporterStats.tier !== 'none' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Spotlight Supporter</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/spotlight/leaderboard')}
                  className="text-primary"
                >
                  View Leaderboard <TrendingUp className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <SpotlightSupporterBadge
                tier={supporterStats.tier}
                totalVotes={supporterStats.totalVotes}
                variant="full"
              />
            </Card>
          )}

          {/* Spotlight Promo */}
          <SpotlightPromoCard />

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6">
          <StatCard label="Following" value={followedArtists.length} icon={Users} />
          <StatCard label="Liked Tracks" value={likedTracks.length} icon={Heart} />
          <StatCard label="Comments" value={commentsCount} icon={MessageSquare} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Artists Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                My Artists
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/fan/artists')}
                className="text-primary"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {followedArtists.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You're not following any artists yet</p>
                <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
                  Discover Artists
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {followedArtists.slice(0, 4).map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => navigate(`/artist/${artist.user_id}`)}
                    >
                      {artist.avatar_url ? (
                        <img
                          src={artist.avatar_url}
                          alt={artist.artist_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg text-primary font-bold">
                            {artist.artist_name[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{artist.artist_name}</h3>
                        {artist.genre && (
                          <p className="text-sm text-muted-foreground">{artist.genre}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnfollow(artist.id);
                      }}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Liked Tracks Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                Liked Tracks
              </h2>
            </div>

            {likedTracks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't liked any tracks yet</p>
                <Button onClick={() => navigate('/explore')} className="bg-gradient-gold">
                  Explore Music
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {likedTracks.map((like) => (
                  <div
                    key={like.track_id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setCurrentTrack({
                      url: like.tracks.audio_url,
                      title: like.tracks.title,
                      artist: like.tracks.artist_profiles.artist_name
                    })}
                  >
                    {like.tracks.cover_url ? (
                      <img
                        src={like.tracks.cover_url}
                        alt={like.tracks.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{like.tracks.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {like.tracks.artist_profiles.artist_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* My Activity Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Recent Activity
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/fan/activity')}
              className="text-primary"
            >
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activity yet. Start exploring!</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {activity.type === 'like' && <Heart className="h-4 w-4 text-primary" />}
                    {activity.type === 'comment' && <MessageSquare className="h-4 w-4 text-primary" />}
                    {activity.type === 'follow' && <Users className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Discover More Artists */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Discover More Artists</h2>
          </div>

          <DiscoverArtists
            followedGenres={followedArtists.map(a => a.genre).filter(Boolean) as string[]}
            followedArtistIds={followedArtists.map(a => a.id)}
            limit={6}
          />
        </Card>

        {/* Trending This Week */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Trending This Week</h2>
          </div>

          <TrendingSection
            type="tracks"
            limit={5}
            onTrackPlay={setCurrentTrack}
          />
        </Card>

        {/* Settings Link */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/fan/settings')}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </Button>
        </div>
      </div>

      {currentTrack && (
        <AudioPlayer
          audioUrl={currentTrack.url}
          title={currentTrack.title}
          artistName={currentTrack.artist}
        />
      )}
    </div>
  );
}
