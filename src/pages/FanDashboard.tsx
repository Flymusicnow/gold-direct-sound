import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Rss, Music, Sparkles, Trophy, ListMusic, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardFeedSwitch } from "@/components/fan/DashboardFeedSwitch";
import { ArtistCardSkeleton } from "@/components/ui/skeletons";
import { StaggeredGrid } from "@/components/ui/StaggeredGrid";

interface Artist {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
}

export default function FanDashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin/fan');
      return;
    }
    fetchFollowedArtists();
  }, [user, navigate]);

  const fetchFollowedArtists = async () => {
    if (!user) return;

    const { data: follows } = await supabase
      .from('follows')
      .select(`
        artist_id,
        artist_profiles (
          id,
          user_id,
          artist_name,
          avatar_url
        )
      `)
      .eq('fan_id', user.id);

    if (follows) {
      const artists = follows.map((f: any) => f.artist_profiles).filter(Boolean);
      setFollowedArtists(artists);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Quick links skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          
          {/* Following section skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ArtistCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { icon: Rss, label: t('nav.feed'), path: '/fan/feed', color: 'text-violet-400' },
    { icon: Music, label: t('fan.myArtists'), path: '/fan/artists', color: 'text-primary' },
    { icon: ListMusic, label: t('nav.playlists'), path: '/fan/playlists', color: 'text-blue-400' },
    { icon: Sparkles, label: t('nav.spotlight'), path: '/spotlight/leaderboard', color: 'text-yellow-400' },
    { icon: Target, label: t('fan.missions'), path: '/fan/missions', color: 'text-green-400' },
    { icon: Award, label: t('fan.achievements'), path: '/fan/achievements', color: 'text-orange-400' },
  ];

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('fan.yourDashboard')}</h1>
            <p className="text-muted-foreground">{t('fan.welcomeBack')}</p>
          </div>
          <DashboardFeedSwitch />
        </div>

        {/* Quick Links Grid */}
        <StaggeredGrid 
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" 
          staggerDelay={0.04}
          className="mb-10"
        >
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border interactive-card group"
            >
              <link.icon className={`h-6 w-6 ${link.color} group-hover:scale-110 transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]`} />
              <span className="text-sm font-medium text-center">{link.label}</span>
            </Link>
          ))}
        </StaggeredGrid>

        {/* Following Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {t('fan.following')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/fan/artists')}>
              {t('common.viewAll')}
            </Button>
          </div>
          
          {followedArtists.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">{t('fan.notFollowingAnyArtists')}</p>
              <Button onClick={() => navigate('/search')}>
                {t('fan.discoverArtists')}
              </Button>
            </Card>
          ) : (
            <StaggeredGrid columns="sm:grid-cols-2 lg:grid-cols-3" className="gap-6">
              {followedArtists.slice(0, 6).map((artist) => (
                <Card
                  key={artist.id}
                  className="p-6 interactive-card cursor-pointer"
                  onClick={() => navigate(`/artist/${artist.user_id}`)}
                >
                  <div className="flex items-center gap-4">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.artist_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl text-primary font-bold">
                          {artist.artist_name[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{artist.artist_name}</h3>
                    </div>
                  </div>
                </Card>
              ))}
            </StaggeredGrid>
          )}
        </div>
      </div>
    </div>
  );
}
